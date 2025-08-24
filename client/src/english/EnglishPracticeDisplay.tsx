import  { useEffect, useMemo, useState } from "react";
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
  cefr_level?: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|""|null;
  level: number;
  exampleEn?: string | null;
  exampleVn?: string | null;
  contexts?: Context[];
  examples?: Example[];
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

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
const [cefrFilter, setCefrFilter] = useState<CEFROption>("all");

  // Tạo list level để chọn
  const levels = useMemo(() => {
    const u = Array.from(new Set(words.map(w => w.level))).sort((a,b)=>a-b);
    return u.length ? u : [1,2,3,4,5];
  }, [words]);

  useEffect(() => {
    let mounted = true;

    async function fetchWords() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const requestBody = {}; // nếu API yêu cầu tham số (ví dụ page, limit, filter) thì đặt ở đây

        const res = await fetch("/api/en/practice/display", {
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

      return matchSearch && matchLevel && matchCefr;
    });
  }, [words, searchTerm, levelFilter, cefrFilter]);

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
    const res = await fetch(`/api/en/practice/delete/${deleteId}`, {
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

  return (
    <div className="min-h-screen mx-auto px-4">
      {/* Header + Search */}
      <div className="bg-gray-100 fixed top-0 left-1/2 -translate-x-1/2 w-full xl:w-[60%] z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center mb-4 relative">
            <button
              onClick={() => navigate("/en/home")}
              className="flex items-center text-gray-700 hover:text-gray-900 mr-2 absolute cursor-pointer"
              title="Về trang JP"
              aria-label="Quay lại"
            >
              <BiLogOutCircle className="text-gray-700 text-3xl" />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 text-center flex-1">
              Danh sách từ cần ôn
            </h2>
          </div>

          {/* Search + Level + CEFR + Count */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ vựng..."
              className="w-full md:flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <select
              value={levelFilter === "all" ? "all" : String(levelFilter)}
              onChange={(e) => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full md:w-44 px-3 py-2 rounded-lg border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">Tất cả cấp độ</option>
              {levels.map((lv) => (
                <option key={lv} value={lv}>Cấp {lv}</option>
              ))}
            </select>

           <select
  value={cefrFilter}
  onChange={(e) => setCefrFilter(e.target.value as CEFROption)}
  className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
>
  <option value="all">Tất cả CEFR</option>
  <option value="A1">A1</option>
  <option value="A2">A2</option>
  <option value="B1">B1</option>
  <option value="B2">B2</option>
  <option value="C1">C1</option>
  <option value="C2">C2</option>
</select>


            <span className="text-sm text-gray-500 md:ml-auto">
              {filteredWords.length} kết quả
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[70vh] min-h-screen overflow-y-auto pt-35 scrollbar-hide">
      {filteredWords.map((w) => (
  <div
    key={w.id}
    className="bg-slate-50 border rounded-lg p-4 mb-4 border-l-4 border-yellow-400 relative space-y-4 leading-relaxed"
  >
    {/* Nút sửa & xoá */}
    <div className="absolute top-3 right-3 flex gap-2">
      <button
        onClick={() => goEdit(w)}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
        title="Sửa từ này"
      >
        <BiEdit className="w-4 h-4" />
        Sửa
      </button>
      <div className="relative inline-block">
        <button
          onClick={() => openConfirm(w.id)}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
          title="Xoá từ này"
        >
          🗑 Xoá
        </button>

        {deleteId === w.id && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-slate-50 border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <p className="text-xs text-gray-700 mb-3">Bạn có chắc muốn xoá?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeConfirm}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Huỷ
              </button>
              <button
                onClick={confirmDelete}
                className="px-2 py-1 text-xs rounded-md bg-red-500 text-slate-50 hover:bg-red-600"
              >
                Xoá
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Tiêu đề từ + nút phát âm */}
    <div className="flex items-center gap-2">
      <h3 className="text-3xl font-bold text-gray-800">{w.word}</h3>
      <button
        onClick={() => handleSpeak(w.word)}
        className="p-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
        title="Phát âm từ này"
      >
        📢
      </button>
    </div>

    {/* Thông tin cơ bản */}
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-700">
      <span><strong>Cấp độ:</strong> {w.level}</span>
      {w.cefr_level && (
        <>
          <span className="opacity-50">|</span>
          <span><strong>CEFR:</strong> {w.cefr_level}</span>
        </>
      )}
      {w.ipa && (
        <>
          <span className="opacity-50">|</span>
          <span><strong>IPA:</strong> {w.ipa}</span>
        </>
      )}
    </div>

    {/* Nghĩa & ví dụ nhanh */}
    <div className="text-gray-700">
      <div><strong>Nghĩa:</strong> {w.meaning_vi}</div>
      {w.exampleEn && <div><strong>Quick EN:</strong> {w.exampleEn}</div>}
      {w.exampleVn && <div><strong>Quick VI:</strong> {w.exampleVn}</div>}
    </div>

    {/* Ngữ cảnh */}
    {w.contexts?.length ? (
      <div>
        <strong>Ngữ cảnh:</strong>
        <ul className="list-disc list-inside text-gray-600">
          {w.contexts.map((c) => (
            <li key={c.id}>{c.context_vi}</li>
          ))}
        </ul>
      </div>
    ) : null}
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
