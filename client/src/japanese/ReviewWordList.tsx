import React, { useEffect, useState } from 'react';
import { BiLogOutCircle, BiEdit } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
type FormState = {
  id: string; // hoặc có thể để optional: id?: string;
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

  const levels = React.useMemo(
    () =>
      Array.from(new Set((words || []).map(w => w.level).filter(Boolean))).sort(
        (a: number, b: number) => a - b
      ),
    [words]
  );

  // --- helper: lấy nhãn JLPT của 1 word ---
  const getJlpt = (w: any): 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | undefined => {
    if (typeof w?.jlpt_level === 'string') {
      const up = w.jlpt_level.toUpperCase();
      if (['N1', 'N2', 'N3', 'N4', 'N5'].includes(up)) {
        return up as any;
      }
    }
    return undefined;
  };

  // --- filteredWords: bổ sung điều kiện JLPT ---
  const filteredWords = words.filter((word) => {
    const q = searchTerm.toLowerCase();
    const matchText =
      word.kanji.toLowerCase().includes(q) ||
      word.reading_romaji.toLowerCase().includes(q) ||
      word.meaning_vi.toLowerCase().includes(q);

    const matchLevel = levelFilter === 'all' ? true : word.level === levelFilter;

    const jlptOfWord = getJlpt(word);
    const matchJlpt = jlptFilter === 'all' ? true : jlptOfWord === jlptFilter;

    return matchText && matchLevel && matchJlpt;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // Nếu chưa login thì có thể redirect về /login

    fetch('/api/practice/listWord', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`, // gửi token
      }
    })
      .then(res => res.json())
      .then(data => {
        setWords(data.allWords || []);
        console.log(data.allWords);
      })
      .catch(err => console.error('Lỗi khi fetch:', err));
  }, []);

const goEdit = (w: any) => {
  const id = w?.id ?? w?._id;
  if (!id) {
    alert('Không tìm thấy ID của từ để sửa');
    return;
  }
  const form = toFormState(w);

  // Lưu dự phòng để chống mất khi refresh
  sessionStorage.setItem('editingId', String(id));
  sessionStorage.setItem('editingForm', JSON.stringify(form));

  // Gửi gọn: chỉ gửi form và id
  navigate(`/jp/editWord/${id}`, { state: { id, form } });
};


  return (
    <div className="min-h-screen mx-auto px-4">
      {/* Header + Search */}
      <div className="bg-gray-100 fixed top-0 left-1/2 -translate-x-1/2 w-full xl:w-[60%]  z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center mb-4 relative">
            <button
              onClick={() => navigate("/jp/home")}
              className="flex items-center text-gray-700 hover:text-gray-900 mr-2 absolute cursor-pointer"
            >
              <BiLogOutCircle className="text-gray-700 text-3xl" />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 text-center flex-1">
              Danh sách từ cần ôn
            </h2>
          </div>

          {/* Search + Level + Count */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ vựng..."
              className="w-full md:flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full md:w-44 px-3 py-2 rounded-lg border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">Tất cả cấp độ</option>
              {levels.map((lv) => (
                <option key={lv} value={lv}>
                  Cấp {lv}
                </option>
              ))}
            </select>

            <select
              value={jlptFilter}
              onChange={(e) => setJlptFilter(e.target.value as any)}
              className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">Tất cả JLPT</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
              <option value="N4">N4</option>
              <option value="N5">N5</option>
            </select>

            <span className="text-sm text-gray-500 md:ml-auto">
              {filteredWords.length} kết quả
            </span>
          </div>
        </div>
      </div>

      <div className="max-h-[70vh] min-h-screen overflow-y-auto pt-35 scrollbar-hide">
        {filteredWords.map((word, index) => (
          <div key={index} className="bg-slate-50 border rounded-lg p-4 mb-4 border-l-4 border-yellow-400">
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-3 h-full flex items-center justify-center">
                <h3 className="text-5xl font-bold text-gray-800">{word.kanji}</h3>
              </div>

              <div className="col-span-9">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Cấp độ: {word.level}</span>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{word.jlpt_level}</span>
                    {/* Nút Sửa nho nhỏ */}
                    <button
                      onClick={() => goEdit(word)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      title="Sửa từ này"
                      aria-label="Sửa"
                    >
                      <BiEdit className="w-4 h-4" />
                      Sửa
                    </button>
                  </div>
                </div>

                <div className="text-gray-700 mb-2">
                  <strong>Romaji:</strong> {word.reading_romaji} <br />
                  <strong>Nghĩa:</strong> {word.meaning_vi}
                </div>

                {word.hanviet && (
                  <div className="text-gray-700 mb-2">
                    <strong>Hán Việt:</strong> {word.hanviet.han_viet} <br />
                    <strong>Giải thích:</strong> {word.hanviet.explanation}
                  </div>
                )}

                {word.contexts?.length > 0 && (
                  <div className="mt-3">
                    <strong>Ngữ cảnh:</strong>
                    <ul className="list-disc list-inside text-gray-600">
                      {word.contexts.map((ctx: any, idx: number) => (
                        <li key={idx}>{ctx.context_vi}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {word.examples?.length > 0 && (
                  <div className="mt-3">
                    <strong>Ví dụ:</strong>
                    {word.examples.map((ex: any, idx: number) => (
                      <div key={idx} className="mb-2 text-gray-700">
                        <div><strong>JP:</strong> {ex.sentence_jp}</div>
                        <div><strong>Romaji:</strong> {ex.sentence_romaji}</div>
                        <div><strong>VI:</strong> {ex.sentence_vi}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ReviewWordList;
