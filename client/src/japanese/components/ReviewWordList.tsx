import React, { useEffect, useState } from 'react';
import { BiLogOutCircle, BiEdit, BiTrash } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

type FormState = {
  id: string;
  kanji: string;
  reading_hiragana: string;
  reading_romaji: string;
  meaning_vi: string;
  jlpt_level: string;
  level: string;
  han_viet: string;
  hanviet_explanation: string;
  context_vi: string;
  sentence_jp: string;
  sentence_hira: string;
  sentence_romaji: string;
  sentence_vi: string;

};

const toFormState = (w: any): FormState => {
  const ex0 = Array.isArray(w.examples) && w.examples.length > 0 ? w.examples[0] : undefined;
  const ctx0 = Array.isArray(w.contexts) && w.contexts.length > 0 ? w.contexts[0] : undefined;
  return {
    id: w.id ?? w._id ?? '',
    kanji: w.kanji || '',
    reading_hiragana: w.reading_hiragana || '',
    reading_romaji: w.reading_romaji || '',
    meaning_vi: w.meaning_vi || '',
    jlpt_level: w.jlpt_level || '',
    level: w.level != null ? String(w.level) : '',
    han_viet: w.hanviet?.han_viet || '',
    hanviet_explanation: w.hanviet?.explanation || '',
    context_vi: ctx0?.context_vi || '',
    sentence_jp: ex0?.sentence_jp || '',
    sentence_hira: ex0?.sentence_hira || '',
    sentence_romaji: ex0?.sentence_romaji || '',
    sentence_vi: ex0?.sentence_vi || '',
  };
};

const ReviewWordList: React.FC = () => {
  const navigate = useNavigate();

  const [words, setWords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [jlptFilter, setJlptFilter] = useState<'all' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5'>('all');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [limitFilter, setLimitFilter] = useState<10 | 20 | 'all'>(10);
  const [confirmingId, setConfirmingId] = useState<string | null>(null); // ô xác nhận
  const [typeFilter, setTypeFilter] = useState<'all' | 'word' | 'grammar'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Thêm state thông báo và lỗi + trạng thái xoá
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  // Chuẩn hoá giá trị is_grammar từ backend
  const isGrammarWord = (w: any): boolean => {
    const v = w.is_grammar ?? w.isGrammar ?? w.grammar;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === '1' || s === 'true' || s === 'yes';
    }
    return false;
  };
  // Chuẩn hoá giá trị is_active từ backend
  const isActiveWord = (w: any): boolean => {
    const v = w.is_active ?? w.isActive ?? w.active;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === '1' || s === 'true' || s === 'yes';
    }
    return true; // mặc định coi là active nếu không có field
  };


  const levels = React.useMemo(
    () =>
      Array.from(new Set((words || []).map(w => w.level).filter(Boolean))).sort(
        (a: number, b: number) => a - b
      ),
    [words]
  );

  const getJlpt = (w: any): 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | undefined => {
    if (typeof w?.jlpt_level === 'string') {
      const up = w.jlpt_level.toUpperCase();
      if (['N1', 'N2', 'N3', 'N4', 'N5'].includes(up)) {
        return up as any;
      }
    }
    return undefined;
  };

  const filteredWords = words.filter((word) => {
    const q = searchTerm.toLowerCase();
    const matchText =
      word.kanji.toLowerCase().includes(q) ||
      word.reading_romaji.toLowerCase().includes(q) ||
      word.meaning_vi.toLowerCase().includes(q);

    const matchLevel = levelFilter === 'all' ? true : word.level === levelFilter;

    const jlptOfWord = getJlpt(word);
    const matchJlpt = jlptFilter === 'all' ? true : jlptOfWord === jlptFilter;

    // NEW: lọc theo loại
    const grammarFlag = isGrammarWord(word);
    const matchType =
      typeFilter === 'all'
        ? true
        : typeFilter === 'grammar'
          ? grammarFlag
          : !grammarFlag;
    const activeFlag = isActiveWord(word);
    const matchActive =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
          ? activeFlag
          : !activeFlag;

    return matchText && matchLevel && matchJlpt && matchType && matchActive;
  });


  const displayedWords = limitFilter === 'all'
    ? filteredWords
    : filteredWords.slice(0, limitFilter);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:8000/api/jp/practice/listWord', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    })
      .then(res => res.json())
      .then(data => setWords(data.allWords || []))
      .catch(err => setError(`Lỗi khi tải danh sách: ${err?.message || err}`));
  }, []);


  const goEdit = (w: any) => {
    const id = w?.id ?? w?._id;
    if (!id) {
      alert('Không tìm thấy ID của từ để sửa');
      return;
    }
    const form = toFormState(w);
    sessionStorage.setItem('editingId', String(id));
    sessionStorage.setItem('editingForm', JSON.stringify(form));
    navigate(`/jp/editWord/${id}`, { state: { id, form } });
  };

  // ===== BULK ACTIONS =====
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedIds).map(id =>
        fetch(`http://localhost:8000/api/jp/practice/updateWord/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ is_active: true }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} từ cập nhật thất bại`);
      }

      // Update local state
      setWords(prev => prev.map(w => {
        const wid = String(w.id ?? w._id);
        if (selectedIds.has(wid)) {
          return { ...w, is_active: true };
        }
        return w;
      }));
      
      setMessage(`Đã kích hoạt ${selectedIds.size} từ`);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e?.message || 'Cập nhật thất bại');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedIds).map(id =>
        fetch(`http://localhost:8000/api/jp/practice/updateWord/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ is_active: false }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} từ cập nhật thất bại`);
      }

      // Update local state
      setWords(prev => prev.map(w => {
        const wid = String(w.id ?? w._id);
        if (selectedIds.has(wid)) {
          return { ...w, is_active: false };
        }
        return w;
      }));
      
      setMessage(`Đã vô hiệu ${selectedIds.size} từ`);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e?.message || 'Cập nhật thất bại');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.size} từ đã chọn?`)) return;
    
    setIsBulkProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedIds).map(id =>
        fetch(`http://localhost:8000/api/jp/practice/delete/${id}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} từ xóa thất bại`);
      }

      // Remove from local state
      setWords(prev => prev.filter(w => !selectedIds.has(String(w.id ?? w._id))));
      
      setMessage(`Đã xóa ${selectedIds.size} từ`);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e?.message || 'Xóa thất bại');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // ===== XÓA TỪ VỰNG =====
  const handleDelete = async (id: string) => {
    setError(null);
    setMessage(null);
    setDeletingId(id);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/jp/practice/delete/${id}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      setWords(prev => prev.filter(w => String(w.id ?? w._id) !== id));
      setMessage(data.message || 'Đã xoá từ vựng.');
    } catch (e: any) {
      setError(e?.message || 'Xoá thất bại');
    } finally {
      setDeletingId(null);
      setConfirmingId(null); // ẩn hộp xác nhận
    }
  };

  return (
    <div className="min-h-screen mx-auto px-4">
      {/* Header + Search */}
      <div className="bg-white/95 backdrop-blur-sm fixed top-0 left-1/2 -translate-x-1/2 w-full xl:w-[70%] z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between mb-2 relative">
            <button
              onClick={() => navigate("/jp/home")}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
              title="Quay lại"
            >
              <BiLogOutCircle className="text-xl" />
            </button>

            <h2 className="text-xl font-black text-gray-800 tracking-tight">
              Japanese Word List
            </h2>

            <div className="w-8"></div>
          </div>

          {/* Search Bar and Filters Row */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm từ vựng, nghĩa, hán việt..."
                className="w-full pl-10 pr-4 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all shadow-sm text-sm"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Cấp độ: Tất cả</option>
                {levels.map((lv) => (
                  <option key={lv} value={lv}>Cấp {lv}</option>
                ))}
              </select>

              <select
                value={jlptFilter}
                onChange={(e) => setJlptFilter(e.target.value as any)}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">JLPT: Tất cả</option>
                <option value="N1">N1</option>
                <option value="N2">N2</option>
                <option value="N3">N3</option>
                <option value="N4">N4</option>
                <option value="N5">N5</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'word' | 'grammar')}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Loại: Tất cả</option>
                <option value="word">Từ vựng</option>
                <option value="grammar">Ngữ pháp</option>
              </select>

              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="active">Đang dùng</option>
                <option value="inactive">Đang ẩn</option>
              </select>

              <select
                value={limitFilter}
                onChange={(e) => setLimitFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as 10 | 20)}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Hiển thị: Tất cả</option>
                <option value="10">10 từ</option>
                <option value="20">20 từ</option>
              </select>

              <div className="ml-auto bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">
                {displayedWords.length} / {filteredWords.length} kết quả
              </div>
            </div>
          </div>

          {/* Bulk Actions and Select All Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-200">
            {/* Select All */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={displayedWords.length > 0 && displayedWords.every(w => selectedIds.has(String(w.id ?? w._id)))}
                onChange={(e) => {
                  if (e.target.checked) {
                    const allIds = new Set(displayedWords.map(w => String(w.id ?? w._id)));
                    setSelectedIds(allIds);
                  } else {
                    const displayedIds = new Set(displayedWords.map(w => String(w.id ?? w._id)));
                    setSelectedIds(prev => {
                      const newSet = new Set(prev);
                      displayedIds.forEach(id => newSet.delete(id));
                      return newSet;
                    });
                  }
                }}
                className="w-4 h-4 cursor-pointer"
              />
              <label className="text-xs font-medium text-gray-700 cursor-pointer">Chọn tất cả</label>
            </div>

            {/* Bulk Actions - Luôn hiển thị để giữ layout */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 ? (
                <>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                    Đã chọn: {selectedIds.size}
                  </span>
                  <button
                    onClick={() => handleBulkActivate()}
                    disabled={isBulkProcessing}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    ✅ Kích hoạt
                  </button>
                  <button
                    onClick={() => handleBulkDeactivate()}
                    disabled={isBulkProcessing}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    ⏸️ Vô hiệu
                  </button>
                  <button
                    onClick={() => handleBulkDelete()}
                    disabled={isBulkProcessing}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    🗑️ Xóa
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    ✖️ Bỏ chọn
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">Chọn các từ để thao tác hàng loạt</span>
              )}
            </div>
          </div>

          {/* Thông báo */}
          {(message || error) && (
            <div className="mt-3">
              {error && <p className="text-red-500 text-sm whitespace-pre-line">{error}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="pt-44 pb-10 max-w-6xl mx-auto">
        {displayedWords.map((word, index) => {
          const wid = String(word.id ?? word._id);
          return (
            <div key={index} className="bg-white border rounded-xl mb-4 border-l-8 border-yellow-400 shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Header với checkbox và actions */}
              <div className="flex justify-between items-start p-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(wid)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(prev => new Set(prev).add(wid));
                      } else {
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(wid);
                          return newSet;
                        });
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isActiveWord(word)
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {isActiveWord(word) ? "Đang dùng" : "Đang ẩn"}
                  </span>
                  {isGrammarWord(word) && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Ngữ pháp
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => goEdit(word)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sửa từ này"
                  >
                    <BiEdit className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setConfirmingId(wid)}
                      disabled={deletingId === wid}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                      title="Xoá từ này"
                    >
                      <BiTrash className="w-5 h-5" />
                    </button>

                    {confirmingId === wid && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-20">
                        <p className="text-xs font-medium text-gray-800 mb-3">Xác nhận xoá?</p>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleDelete(wid)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600"
                          >
                            Có
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-100"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Nội dung word */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Cột trái: Kanji + Romaji */}
                  <div className="md:col-span-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 text-center">
                    <h3 className="text-5xl font-black text-gray-900 mb-2">{word.kanji}</h3>
                    <div className="text-lg text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-lg w-fit mx-auto">
                      {word.reading_hiragana}
                    </div>
                    {word.reading_romaji && (
                      <p className="text-sm text-gray-500 mt-2 font-mono">{word.reading_romaji}</p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">Level {word.level}</span>
                      {word.jlpt_level && (
                        <span className="px-2 py-1 bg-yellow-100 rounded text-xs font-bold text-yellow-700">{word.jlpt_level}</span>
                      )}
                    </div>
                  </div>

                  {/* Cột phải: Nghĩa + Ví dụ */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Nghĩa tiếng Việt</span>
                        <p className="text-xl font-bold text-gray-800">{word.meaning_vi}</p>
                      </div>
                      {word.hanviet && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Hán Việt</span>
                          <p className="text-lg font-bold text-red-600">{word.hanviet.han_viet}</p>
                        </div>
                      )}
                    </div>

                    {word.hanviet?.explanation && (
                      <div className="bg-red-50/50 p-3 rounded-lg border-l-4 border-red-200">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">Giải thích hán việt</span>
                        <p className="text-sm text-gray-700">{word.hanviet.explanation}</p>
                      </div>
                    )}

                    {word.contexts?.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ngữ cảnh sử dụng</span>
                        <div className="flex flex-wrap gap-2">
                          {word.contexts.map((ctx: any, idx: number) => (
                            <span key={idx} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 shadow-sm">
                              {ctx.context_vi}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {word.examples?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Câu ví dụ chi tiết</span>
                        <div className="space-y-4">
                          {word.examples.map((ex: any, idx: number) => (
                            <div key={idx} className="bg-blue-50/50 p-3 rounded-lg border-l-4 border-blue-400">
                              <p className="text-gray-900 font-medium mb-1">{ex.sentence_jp}</p>
                              {ex.sentence_romaji && <p className="text-xs text-gray-500 mb-1 font-mono">{ex.sentence_romaji}</p>}
                              <p className="text-gray-600 text-sm">{ex.sentence_vi}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default ReviewWordList;
