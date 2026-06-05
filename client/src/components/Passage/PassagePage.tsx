import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../routes/LanguageContext';
import { apiGet, apiPost, apiPut, apiDelete, getErrorMessage } from '../../apiClient';
import { showToast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Volume2,
  Languages,
  Eye,
  EyeOff,
  X,
  FileText,
  Search,
  Sparkles,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpenCheck
} from 'lucide-react';

interface UserPassage {
  id: number;
  user_id: number;
  title: string;
  passage: string;
  translation: string;
  language: string;
  created_at: string;
  updated_at: string;
}

const getCleanText = (text: string) => {
  if (!text) return '';
  let result = text;
  
  // 1. Clean [color:kanji(furi)] -> kanji
  result = result.replace(/\[[a-zA-Z#0-9]+:([^\(]+)\([^\)]+\)\]/g, '$1');

  // 2. Clean [color:plain] -> plain
  result = result.replace(/\[[a-zA-Z#0-9]+:([^\]]+)\]/g, '$1');

  // 3. Clean kanji(furi) -> kanji
  result = result.replace(/([\u4e00-\u9faf\u3400-\u4dbf0-9a-zA-Z々ヶ]+)\(([\u3040-\u309f\u30a0-\u30ff]+)\)/g, '$1');

  return result;
};

const parseToHtml = (text: string): string => {
  if (!text) return '';
  let result = text;
  
  // Color mapping (Tailwind-aligned colors)
  const colorMap: { [key: string]: string } = {
    blue: '#2563eb',   // blue-600
    orange: '#d97706', // amber-600 / orange-brown
    red: '#dc2626',    // red-600
    green: '#16a34a',  // green-600
  };

  // 1. Parse colored ruby text: [color:Kanji(Furigana)] -> <ruby style="color: ...">Kanji<rt>Furigana</rt></ruby>
  result = result.replace(/\[([a-zA-Z#0-9]+):([^\(]+)\(([^\)]+)\)\]/g, (_match, colorKey, kanji, furi) => {
    const color = colorMap[colorKey] || colorKey;
    return `<ruby style="color: ${color};">${kanji}<rt>${furi}</rt></ruby>`;
  });

  // 2. Parse colored plain text: [color:text] -> <span style="color: ...">text</span>
  result = result.replace(/\[([a-zA-Z#0-9]+):([^\]]+)\]/g, (_match, colorKey, plainText) => {
    const color = colorMap[colorKey] || colorKey;
    return `<span style="color: ${color};">${plainText}</span>`;
  });

  // 3. Parse standard ruby text: Kanji(Furigana) -> <ruby>Kanji<rt>Furigana</rt></ruby>
  result = result.replace(/([\u4e00-\u9faf\u3400-\u4dbf0-9a-zA-Z々ヶ]+)\(([\u3040-\u309f\u30a0-\u30ff]+)\)/g, '<ruby>$1<rt>$2</rt></ruby>');

  return result;
};

export default function PassagePage() {
  const { lang } = useLanguage(); // 'jp' or 'en'
  const [passages, setPassages] = useState<UserPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassage, setEditingPassage] = useState<UserPassage | null>(null);
  
  // Reader view state (for viewing details full-width)
  const [selectedPassage, setSelectedPassage] = useState<UserPassage | null>(null);
  const [readerFontSize, setReaderFontSize] = useState(16); // in pixels
  const [readerShowTranslation, setReaderShowTranslation] = useState(true);

  // Form state
  const [titleText, setTitleText] = useState('');
  const [passageText, setPassageText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [passageLang, setPassageLang] = useState('en');
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // TTS speaking state
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  useEffect(() => {
    // Default form language matches route language
    setPassageLang(lang === 'jp' ? 'ja' : 'en');
    fetchPassages();
  }, [lang]);

  const fetchPassages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await apiGet<UserPassage[]>('/user-passages', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPassages(data);
    } catch (err) {
      console.error('Fetch passages error:', err);
      showToast('Không thể tải danh sách đoạn văn. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPassage(null);
    setTitleText('');
    setPassageText('');
    setTranslationText('');
    setPassageLang(lang === 'jp' ? 'ja' : 'en');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, p: UserPassage) => {
    e.stopPropagation(); // Avoid triggering open reader view
    setEditingPassage(p);
    setTitleText(p.title || '');
    setPassageText(p.passage);
    setTranslationText(p.translation);
    setPassageLang(p.language);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPassage(null);
  };

  const handleAddFuriganaHelper = () => {
    const textarea = document.getElementById('passage-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = passageText.substring(start, end);

    if (!selectedText.trim()) {
      showToast('Vui lòng bôi đen từ tiếng Nhật cần thêm phiên âm.');
      return;
    }

    const reading = window.prompt(`Nhập phiên âm Hiragana cho "${selectedText}":`);
    if (reading === null) return; // user cancelled

    const newText = 
      passageText.substring(0, start) + 
      `${selectedText}(${reading.trim()})` + 
      passageText.substring(end);

    setPassageText(newText);
    
    // Reset focus & selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + selectedText.length + reading.trim().length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleAddColorHelper = (color: string) => {
    const textarea = document.getElementById('passage-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = passageText.substring(start, end);

    if (!selectedText.trim()) {
      showToast('Vui lòng bôi đen từ cần tô màu.');
      return;
    }

    const newText = 
      passageText.substring(0, start) + 
      `[${color}:${selectedText}]` + 
      passageText.substring(end);

    setPassageText(newText);

    // Reset focus & selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + color.length + selectedText.length + 3;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleText.trim() || !passageText.trim() || !translationText.trim()) {
      showToast('Vui lòng điền đầy đủ tiêu đề, đoạn văn và bản dịch.');
      return;
    }

    setFormSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: titleText.trim(),
        passage: passageText,
        translation: translationText,
        language: passageLang
      };

      if (editingPassage) {
        // Edit mode
        const updated = await apiPut<UserPassage>(`/user-passages/${editingPassage.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPassages(prev => prev.map(item => item.id === updated.id ? updated : item));
        
        // If currently reading this passage, update the reader view data too
        if (selectedPassage?.id === updated.id) {
          setSelectedPassage(updated);
        }
        
        showToast('Cập nhật đoạn văn thành công!');
      } else {
        // Create mode
        const created = await apiPost<UserPassage>('/user-passages', payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPassages(prev => [created, ...prev]);
        showToast('Thêm đoạn văn mới thành công!');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Submit error:', err);
      showToast(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Avoid triggering open reader view
    if (!window.confirm('Bạn có chắc chắn muốn xóa đoạn văn này?')) return;

    try {
      const token = localStorage.getItem('token');
      await apiDelete(`/user-passages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPassages(prev => prev.filter(p => p.id !== id));
      
      // If currently reading this deleted passage, close reader
      if (selectedPassage?.id === id) {
        setSelectedPassage(null);
      }
      
      showToast('Xóa đoạn văn thành công!');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Không thể xóa đoạn văn. Vui lòng thử lại!');
    }
  };

  const handleSpeak = (e: React.MouseEvent | null, text: string, languageCode: string, id: number) => {
    if (e) e.stopPropagation();
    
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = getCleanText(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Map language identifier to browser TTS locales
    let locale = 'en-US';
    const cleanLang = languageCode.toLowerCase();
    if (cleanLang.startsWith('jp') || cleanLang.startsWith('ja')) {
      locale = 'ja-JP';
    } else if (cleanLang.startsWith('vi')) {
      locale = 'vi-VN';
    } else if (cleanLang.startsWith('zh') || cleanLang.startsWith('cn')) {
      locale = 'zh-CN';
    } else if (cleanLang.startsWith('ko')) {
      locale = 'ko-KR';
    } else if (cleanLang.startsWith('fr')) {
      locale = 'fr-FR';
    } else if (cleanLang.startsWith('de')) {
      locale = 'de-DE';
    }
    
    utterance.lang = locale;
    
    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Clean speech synthesis when unmounting
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const zoomIn = () => {
    setReaderFontSize(prev => Math.min(prev + 2, 32));
  };

  const zoomOut = () => {
    setReaderFontSize(prev => Math.max(prev - 2, 12));
  };

  const filteredPassages = passages.filter(p => {
    const query = searchQuery.toLowerCase();
    const cleanPassage = getCleanText(p.passage).toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(query) ||
      cleanPassage.includes(query) ||
      p.translation.toLowerCase().includes(query) ||
      p.language.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-amber-500 w-8 h-8" />
              <span>Thư viện bài đọc & dịch</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Chọn bài đọc để mở rộng toàn màn hình, tùy chỉnh cỡ chữ và nghe phát âm chuẩn.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm bài mới</span>
          </button>
        </div>

        {/* Filter and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề bài đọc, từ khóa trong đoạn hoặc ngôn ngữ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 flex-shrink-0">
            <span>Tổng số: {filteredPassages.length} bài đọc</span>
          </div>
        </div>

        {/* Loading / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : filteredPassages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/60 p-12 text-center shadow-sm max-w-xl mx-auto mt-8">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="text-amber-500 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có bài đọc nào</h3>
            <p className="text-sm text-gray-500 mb-6">
              Hãy thêm tiêu đề, bài đọc tiếng nước ngoài cùng bản dịch nghĩa để luyện tập.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Bắt đầu thêm</span>
            </button>
          </div>
        ) : (
          /* Passage list showing only titles */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPassages.map((p) => {
                const isSpeaking = speakingId === p.id;
                
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => {
                      setSelectedPassage(p);
                      setSpeakingId(null); // Cancel list-level speaking if open reader
                      window.speechSynthesis.cancel();
                    }}
                    className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl hover:border-amber-200/80 transition-all duration-300 flex flex-col justify-between h-44 cursor-pointer relative group"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                        <Languages className="w-3 h-3" />
                        {p.language}
                      </span>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleSpeak(e, p.passage, p.language, p.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isSpeaking ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-slate-100 hover:text-gray-700'}`}
                          title="Đọc nhanh"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEditModal(e, p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-100 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title Content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-base font-extrabold text-gray-800 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                        {p.title || 'Bài đọc không có tiêu đề'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">
                        {getCleanText(p.passage).substring(0, 60)}...
                      </p>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-end text-[11px] font-bold text-slate-400 group-hover:text-amber-500 transition-colors">
                      <span className="flex items-center gap-1">
                        <span>Đọc chi tiết</span>
                        <Maximize2 className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Full-screen Reader Overlay */}
      <AnimatePresence>
        {selectedPassage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Dark glassmorphism backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedPassage(null);
                window.speechSynthesis.cancel();
                setSpeakingId(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Reader Content container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white w-full max-w-6xl h-[90vh] md:h-[85vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col border border-slate-100"
            >
              
              {/* Reader Header Toolbar */}
              <div className="px-6 py-4 bg-slate-50 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-100 text-amber-800 shrink-0">
                    {selectedPassage.language}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-gray-800 truncate" title={selectedPassage.title}>
                    {selectedPassage.title}
                  </h3>
                </div>

                {/* Toolbar control buttons */}
                <div className="flex items-center flex-wrap gap-2.5 text-slate-700">
                  
                  {/* TTS Voice button */}
                  <button
                    onClick={() => handleSpeak(null, selectedPassage.passage, selectedPassage.language, selectedPassage.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      speakingId === selectedPassage.id 
                        ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' 
                        : 'bg-white border-gray-200 hover:bg-slate-50'
                    }`}
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{speakingId === selectedPassage.id ? 'Dừng đọc' : 'Phát âm'}</span>
                  </button>

                  {/* Toggle Translation button */}
                  <button
                    onClick={() => setReaderShowTranslation(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      readerShowTranslation 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-white border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    {readerShowTranslation ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Ẩn dịch</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Xem dịch</span>
                      </>
                    )}
                  </button>

                  {/* Font Size controls */}
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={zoomOut}
                      className="p-2 text-gray-500 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer border-r border-gray-150"
                      disabled={readerFontSize <= 12}
                      title="Thu nhỏ chữ"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-xs font-black min-w-[55px] text-center bg-slate-50 select-none">
                      {Math.round((readerFontSize / 16) * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      className="p-2 text-gray-500 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer border-l border-gray-150"
                      disabled={readerFontSize >= 32}
                      title="Phóng to chữ"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => {
                      setSelectedPassage(null);
                      window.speechSynthesis.cancel();
                      setSpeakingId(null);
                    }}
                    className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-gray-700 transition-colors cursor-pointer ml-2"
                    title="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reader Body content area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
                <div className={`grid grid-cols-1 ${readerShowTranslation ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-8 h-full max-w-5xl mx-auto`}>
                  
                  {/* Left Column: Original Passage */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm flex flex-col h-full overflow-y-auto">
                    <div className="mb-4 shrink-0 flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                        <BookOpenCheck className="w-4 h-4" />
                        Đoạn văn gốc
                      </span>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                      <p 
                        className="text-gray-800 leading-relaxed font-medium whitespace-pre-wrap select-text"
                        style={{ fontSize: `${readerFontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: parseToHtml(selectedPassage.passage) }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Translation */}
                  {readerShowTranslation && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-amber-50/30 p-6 md:p-8 rounded-2xl border border-amber-100 shadow-sm flex flex-col h-full overflow-y-auto"
                    >
                      <div className="mb-4 shrink-0 flex items-center justify-between border-b border-amber-100/50 pb-2">
                        <span className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          Bản dịch nghĩa
                        </span>
                      </div>
                      <div className="flex-1 min-h-[250px]">
                        <p 
                          className="text-slate-700 italic leading-relaxed whitespace-pre-wrap select-text"
                          style={{ fontSize: `${readerFontSize}px` }}
                        >
                          {selectedPassage.translation}
                        </p>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>

              {/* Reader Footer bar */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-gray-100 text-center text-xs text-gray-400 select-none shrink-0">
                Sử dụng các công cụ zoom hoặc nghe đọc ở trên để tối ưu trải nghiệm học tập của bạn.
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-extrabold text-gray-800">
                  {editingPassage ? 'Chỉnh sửa đoạn văn' : 'Thêm đoạn văn mới'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-105 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                
                {/* Title Input */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Tiêu đề bài đọc</label>
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề bài đọc..."
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 font-medium placeholder:text-gray-400"
                  />
                </div>

                {/* Language Select */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Ngôn ngữ định danh</label>
                  <div className="relative">
                    <select
                      value={passageLang}
                      onChange={(e) => setPassageLang(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer font-semibold text-gray-700"
                    >
                      <option value="en">🇺🇸 Tiếng Anh (English)</option>
                      <option value="ja">🇯🇵 Tiếng Nhật (Japanese)</option>
                      <option value="vi">🇻🇳 Tiếng Việt (Vietnamese)</option>
                      <option value="zh">🇨🇳 Tiếng Trung (Chinese)</option>
                      <option value="ko">🇰🇷 Tiếng Hàn (Korean)</option>
                      <option value="fr">🇫🇷 Tiếng Pháp (French)</option>
                      <option value="de">🇩🇪 Tiếng Đức (German)</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Passage Text */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Đoạn văn gốc</label>
                  <textarea
                    id="passage-textarea"
                    rows={4}
                    placeholder="Nhập đoạn văn tiếng nước ngoài cần học..."
                    value={passageText}
                    onChange={(e) => setPassageText(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y min-h-[100px] placeholder:text-gray-400 text-gray-800"
                  />
                  
                  {/* Toolbar helper */}
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-50 rounded-xl border border-gray-150">
                    <span className="text-xs text-gray-400 font-bold flex items-center mr-1">
                      Công cụ viết nhanh:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddFuriganaHelper}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      ✍️ Thêm Furigana
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddColorHelper('blue')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      🔵 Xanh
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddColorHelper('orange')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      🟠 Cam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddColorHelper('red')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      🔴 Đỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddColorHelper('green')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-bold text-green-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      🟢 Xanh lá
                    </button>
                  </div>

                  {/* Live Preview */}
                  {passageText && (
                    <div className="mt-3">
                      <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Xem trước trực quan:</span>
                      <div 
                        className="p-3 bg-slate-50 border border-gray-150 rounded-xl text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap max-h-[120px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: parseToHtml(passageText) }}
                      />
                    </div>
                  )}
                </div>

                {/* Translation Text */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Bản dịch nghĩa</label>
                  <textarea
                    rows={4}
                    placeholder="Nhập bản dịch nghĩa sang Tiếng Việt..."
                    value={translationText}
                    onChange={(e) => setTranslationText(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y min-h-[100px] placeholder:text-gray-400 text-gray-800"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>{editingPassage ? 'Cập nhật' : 'Thêm mới'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
