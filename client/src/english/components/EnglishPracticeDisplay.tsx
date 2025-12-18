import { useEffect, useMemo, useState } from "react";
import { BiLogOutCircle, BiEdit } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

// ----- Types (linh hoạt, khớp với API hiện có) -----
type Choice = { id: number; exercise_id: number; content: string; is_correct: number };
type Exercise = { id: number; example_id: number; question_type?: string; question_text: string; answer_explanation?: string | null; blank_position?: number | null; choices: Choice[] };
type Example = { id: number; en_word_id: number; sentence_en: string; sentence_vi: string; exercises: Exercise[] };
type Context = { id: number; en_word_id: number; context_vi: string };
type EnWord = {
  id: number;
  word: string;
  ipa?: string | null;
  meaning_vi: string;
  cefr_level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "" | null;
  level: number;
  exampleEn?: string | null;
  exampleVn?: string | null;
  contexts?: Context[];
  examples?: Example[];
  is_active?: boolean | number | "1" | "0";
  is_grammar?: boolean | number | "1" | "0";
};
type CEFROption = "" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "all";

type ApiResponse = {
  message?: string;
  data?: EnWord[];   // nếu API của bạn trả field khác thì đổi ở đây
  words?: EnWord[];  // fallback nếu backend trả "words"
};

export default function EnglishPracticeDisplay() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // UI state
  const [words, setWords] = useState<EnWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [cefrFilter, setCefrFilter] = useState<CEFROption>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "word" | "grammar">("all");

  // Tạo list level để chọn
  const levels = useMemo(() => {
    const u = Array.from(new Set(words.map(w => w.level))).sort((a, b) => a - b);
    return u.length ? u : [1, 2, 3, 4, 5];
  }, [words]);

  useEffect(() => {
    let mounted = true;

    async function fetchWords() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const requestBody = {}; // nếu API yêu cầu tham số (ví dụ page, limit, filter) thì đặt ở đây

        const res = await fetch("http://localhost:8000/api/en/practice/display", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        });

        const text = await res.text();
        let json: ApiResponse;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(`Server trả non-JSON: ${text.slice(0, 200)}...`);
        }

        if (!res.ok) {
          throw new Error(json?.message || `HTTP ${res.status}`);
        }

        const list = (json.data ?? json.words ?? []) as EnWord[];
        if (mounted) setWords(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (mounted) setError(e.message || "Lỗi tải dữ liệu");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchWords();
    return () => { mounted = false; };
  }, []);

  const filteredWords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return words.filter((w) => {
      const matchSearch =
        !term ||
        w.word.toLowerCase().includes(term) ||
        (w.meaning_vi || "").toLowerCase().includes(term) ||
        (w.ipa || "").toLowerCase().includes(term) ||
        (w.exampleEn || "").toLowerCase().includes(term) ||
        (w.exampleVn || "").toLowerCase().includes(term) ||
        (w.contexts || []).some(c => (c.context_vi || "").toLowerCase().includes(term)) ||
        (w.examples || []).some(ex =>
          (ex.sentence_en || "").toLowerCase().includes(term) ||
          (ex.sentence_vi || "").toLowerCase().includes(term));

      const matchLevel = levelFilter === "all" ? true : w.level === levelFilter;
      const matchCefr = cefrFilter === "all" ? true : (w.cefr_level || "") === cefrFilter;
      
      // Filter by is_active
      const isActive = w.is_active === true || w.is_active === 1 || w.is_active === "1";
      const matchActive = activeFilter === "all" ? true : 
        (activeFilter === "active" ? isActive : !isActive);
      
      // Filter by is_grammar - convert 0/1 to boolean before comparison
      const isGrammar = w.is_grammar === true || w.is_grammar === 1 || w.is_grammar === "1";
      const matchType = typeFilter === "all" ? true : 
        (typeFilter === "grammar" ? isGrammar : !isGrammar);

      return matchSearch && matchLevel && matchCefr && matchActive && matchType;
    });
  }, [words, searchTerm, levelFilter, cefrFilter, activeFilter, typeFilter]);

  const goEdit = (w: EnWord) => navigate(`/en/editWord/${w.id}`);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Đang tải dữ liệu
        </div>
      </div>
    );
  }
  function handleSpeak(text: string) {
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng phát âm.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // Đọc tiếng Anh
    utterance.rate = 0.9;     // Tốc độ đọc (0.1 -> 10)
    utterance.pitch = 1;      // Cao độ (0 -> 2)

    speechSynthesis.cancel(); // Dừng nếu đang đọc
    speechSynthesis.speak(utterance);
  }

  function openConfirm(id: number) {
    setDeleteId(id);
  }

  function closeConfirm() {
    setDeleteId(null);
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/en/practice/delete/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server trả non-JSON: ${text.slice(0, 200)}...`);
      }

      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      setWords((prev) => prev.filter((w) => w.id !== deleteId));
    } catch (err: any) {
      alert(`Lỗi xoá: ${err.message || err}`);
    } finally {
      closeConfirm();
    }
  }

  // ===== BULK ACTIONS =====
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const promises = Array.from(selectedIds).map(id => {
        // Get word data first
        const word = words.find(w => w.id === id);
        if (!word) return Promise.resolve(null);
        
        return fetch(`http://localhost:8000/api/en/practice/update/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            words: [{
              id: word.id,
              word: word.word,
              meaning_vi: word.meaning_vi,
              ipa: word.ipa || "",
              level: word.level,
              cefr_level: word.cefr_level || "",
              exampleEn: word.exampleEn || "",
              exampleVi: word.exampleVn || "",
              is_active: true,
            }]
          }),
        });
      });

      const results = await Promise.all(promises);
      const failed = results.filter(r => r && !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} từ cập nhật thất bại`);
      }

      // Update local state
      setWords(prev => prev.map(w => 
        selectedIds.has(w.id) ? { ...w, is_active: true } : w
      ));
      
      setMessage(`Đã kích hoạt ${selectedIds.size} từ`);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e?.message || "Cập nhật thất bại");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const promises = Array.from(selectedIds).map(id => {
        const word = words.find(w => w.id === id);
        if (!word) return Promise.resolve(null);
        
        return fetch(`http://localhost:8000/api/en/practice/update/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            words: [{
              id: word.id,
              word: word.word,
              meaning_vi: word.meaning_vi,
              ipa: word.ipa || "",
              level: word.level,
              cefr_level: word.cefr_level || "",
              exampleEn: word.exampleEn || "",
              exampleVi: word.exampleVn || "",
              is_active: false,
            }]
          }),
        });
      });

      const results = await Promise.all(promises);
      const failed = results.filter(r => r && !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} từ cập nhật thất bại`);
      }

      // Update local state
      setWords(prev => prev.map(w => 
        selectedIds.has(w.id) ? { ...w, is_active: false } : w
      ));
      
      setMessage(`Đã vô hiệu ${selectedIds.size} từ`);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e?.message || "Cập nhật thất bại");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.size} từ đã chọn?`)) return;
    
    setIsBulkProcessing(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const promises = Array.from(selectedIds).map(id =>
        fetch(`http://localhost:8000/api/en/practice/delete/${id}`, {
          method: "DELETE",
          headers: {
            "Accept": "application/json",
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
      setWords(prev => prev.filter(w => !selectedIds.has(w.id)));
      
      setMessage(`Đã xóa ${selectedIds.size} từ`);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e?.message || "Xóa thất bại");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="min-h-screen mx-auto px-4">
      {/* Header + Search */}
      <div className="bg-white/95 backdrop-blur-sm fixed top-0 left-1/2 -translate-x-1/2 w-full xl:w-[70%] z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between mb-2 relative">
            <button
              onClick={() => navigate("/en/home")}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
              title="Quay lại"
            >
              <BiLogOutCircle className="text-xl" />
            </button>

            <h2 className="text-xl font-black text-gray-800 tracking-tight">
              English Word List
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
                placeholder="Tìm kiếm từ vựng, nghĩa, ví dụ..."
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
                value={levelFilter === "all" ? "all" : String(levelFilter)}
                onChange={(e) => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Cấp độ: Tất cả</option>
                {levels.map((lv) => (
                  <option key={lv} value={lv}>Level {lv}</option>
                ))}
              </select>

              <select
                value={cefrFilter}
                onChange={(e) => setCefrFilter(e.target.value as CEFROption)}
                className="px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">CEFR: Tất cả</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
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

              <div className="ml-auto bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-bold">
                {filteredWords.length} kết quả
              </div>
            </div>
          </div>

          {/* Bulk Actions and Select All Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-200">
            {/* Select All */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={filteredWords.length > 0 && filteredWords.every(w => selectedIds.has(w.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    const allIds = new Set(filteredWords.map(w => w.id));
                    setSelectedIds(allIds);
                  } else {
                    const filteredIds = new Set(filteredWords.map(w => w.id));
                    setSelectedIds(prev => {
                      const newSet = new Set(prev);
                      filteredIds.forEach(id => newSet.delete(id));
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
          
          {/* Messages */}
          {(message || error) && (
            <div className="mt-3">
              {message && <p className="text-green-600 text-sm">{message}</p>}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="pt-44 pb-10 max-w-6xl mx-auto">
        {filteredWords.map((w) => (
          <div
            key={w.id}
            className="bg-white border rounded-xl mb-4 border-l-8 border-yellow-400 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Header với checkbox và actions */}
            <div className="flex justify-between items-start p-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(w.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(prev => new Set(prev).add(w.id));
                    } else {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(w.id);
                        return newSet;
                      });
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
                />
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  w.is_active === true || w.is_active === 1 || w.is_active === "1"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {w.is_active === true || w.is_active === 1 || w.is_active === "1" ? "Đang dùng" : "Đang ẩn"}
                </span>
                {w.is_grammar === true || w.is_grammar === 1 || w.is_grammar === "1" && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Ngữ pháp
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => goEdit(w)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Sửa từ này"
                >
                  <BiEdit className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => openConfirm(w.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xoá từ này"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {deleteId === w.id && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-20">
                      <p className="text-xs font-medium text-gray-800 mb-3">Xác nhận xoá?</p>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={closeConfirm}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                          Huỷ
                        </button>
                        <button
                          onClick={confirmDelete}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                          Xoá
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
                {/* Cột trái: Word + IPA */}
                <div className="md:col-span-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tight">{w.word}</h3>
                    <button
                      onClick={() => handleSpeak(w.word)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors shadow-sm"
                      title="Phát âm"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 5a1 1 0 011 1v8a1 1 0 01-1 1l-3-3H5a1 1 0 01-1-1V9a1 1 0 011-1h2l3-3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728" />
                      </svg>
                    </button>
                  </div>
                  {w.ipa && (
                    <div className="text-lg text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded-lg w-fit">
                      {w.ipa}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">Level {w.level}</span>
                    {w.cefr_level && (
                      <span className="px-2 py-1 bg-yellow-100 rounded text-xs font-bold text-yellow-700">{w.cefr_level}</span>
                    )}
                  </div>
                </div>

                {/* Cột phải: Nghĩa + Ví dụ */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Nghĩa tiếng Việt</span>
                    <p className="text-xl font-bold text-gray-800">{w.meaning_vi}</p>
                  </div>

                  {(w.exampleEn || w.exampleVn) && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ví dụ nhanh</span>
                      {w.exampleEn && <p className="text-gray-800 font-semibold mb-1">“{w.exampleEn}”</p>}
                      {w.exampleVn && <p className="text-gray-600 text-sm italic">{w.exampleVn}</p>}
                    </div>
                  )}

                  {w.contexts?.length ? (
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ngữ cảnh sử dụng</span>
                      <div className="flex flex-wrap gap-2">
                        {w.contexts.map((c) => (
                          <span key={c.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 shadow-sm">
                            {c.context_vi}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {w.examples?.length ? (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Câu ví dụ chi tiết</span>
                      <div className="space-y-3">
                        {w.examples.map((ex) => (
                          <div key={ex.id} className="bg-blue-50/50 p-3 rounded-lg border-l-4 border-blue-400">
                            <p className="text-gray-900 font-medium mb-1">{ex.sentence_en}</p>
                            <p className="text-gray-600 text-sm">{ex.sentence_vi}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}




        {!error && filteredWords.length === 0 && (
          <div className="text-center text-sm text-neutral-600 py-12">Không có kết quả nào</div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600 py-12">
            Lỗi tải dữ liệu: {error}
          </div>
        )}
      </div>


    </div>
  );
}
