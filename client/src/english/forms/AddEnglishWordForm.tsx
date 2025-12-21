import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiLogOutCircle, BiCodeBlock } from "react-icons/bi";
import { Sparkles } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_URL } from '../../apiClient';

const CEFR_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const IS_GRAMMAR_OPTIONS = [
  { value: '0', label: 'Từ vựng thường' },
  { value: '1', label: 'Mục ngữ pháp' },
];
const IS_ACTIVE_OPTIONS = [
  { value: '1', label: 'Đang sử dụng (active)' },
  { value: '0', label: 'Tạm ẩn / không dùng' },
];

export interface ReviewWord {
  word: string;
  ipa: string;
  meaning_vi: string;
  cefr_level: string;
  context_vi: string;
  exampleEn: string;
  exampleVi: string;
  examples: {
    sentence_en: string;
    sentence_vi: string;
    exercises: {
      question_text: string;
      answer_explanation: string;
      choices: {
        content: string;
        is_correct: number;
      }[];
    }[];
  }[];
  is_active: string;
  is_grammar: string;
}

const INITIAL_FORM: ReviewWord = {
  word: "",
  ipa: "",
  meaning_vi: "",
  cefr_level: "A1",
  context_vi: "",
  exampleEn: "",
  exampleVi: "",
  examples: [
    {
      sentence_en: "",
      sentence_vi: "",
      exercises: [
        {
          question_text: "",
          answer_explanation: "",
          choices: [
            {
              content: "",
              is_correct: 1,
            },
          ],
        },
      ],
    },
  ],
  is_active: "1",
  is_grammar: "0",
};

type Errors = Partial<Record<string, string>>;

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
}

const InputField: React.FC<FieldProps> = ({ label, name, value, onChange, error, placeholder }) => (
  <div className="mb-3">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
        error 
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
          : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-sm'
      } outline-none`}
      aria-invalid={!!error}
      placeholder={placeholder}
    />
    {error && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase ml-1 tracking-tight">{error}</p>}
  </div>
);

const SelectField: React.FC<FieldProps & { options: { value: string; label: string }[] }> = ({ label, name, value, onChange, options, error, placeholder }) => (
  <div className="mb-3">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
        error 
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
          : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-sm'
      } outline-none cursor-pointer appearance-none bg-no-repeat bg-right`}
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '1.5em', backgroundPosition: 'right 0.5rem center' }}
      aria-invalid={!!error}
    >
      <option value="">{placeholder || 'Chọn...'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase ml-1 tracking-tight">{error}</p>}
  </div>
);

const AddEnglishWordForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ReviewWord>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleGeminiCall = async () => {
    if (!form.word || geminiLoading) return;

    const cacheKey = `gemini_en_${form.word.trim().toLowerCase()}`;
    const savedData = localStorage.getItem(cacheKey);
    if (savedData) {
      applyGeminiData(JSON.parse(savedData));
      setNotice({ type: 'success', msg: 'Lấy dữ liệu từ bộ nhớ đệm thành công!' });
      return;
    }

    setGeminiLoading(true);
    const availableModels = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash"];
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    const fetchWithFallback = async (modelIndex = 0): Promise<any> => {
      if (modelIndex >= availableModels.length) {
        throw new Error("Tất cả các model đều đã hết hạn mức hôm nay.");
      }
      const modelName = availableModels[modelIndex];
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Bạn là từ điển Anh-Việt. Phân tích từ: ${form.word}. 
        Trả về JSON bao gồm các trường: 
        ipa (phiên âm), meaning_vi (nghĩa), cefr_level (A1, A2, B1, B2, C1, C2), context_vi (ngữ cảnh tiếng Việt), 
        exampleEn (ví dụ ngắn tiếng Anh), exampleVi (dịch ví dụ ngắn),
        sentence_en (câu ví dụ dài có một chỗ trống ____), sentence_vi (dịch câu dài),
        answer_explanation (giải thích cho bài tập), correct_answer (từ đúng để điền vào chỗ trống).`;

        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
      } catch (err: any) {
        if (err.message.includes('429') || err.message.includes('quota')) {
          return fetchWithFallback(modelIndex + 1);
        }
        throw err;
      }
    };

    try {
      const data = await fetchWithFallback();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      applyGeminiData(data);
      setNotice({ type: 'success', msg: 'Gemini đã gợi ý thành công!' });
    } catch (err: any) {
      setNotice({ type: 'error', msg: err.message });
    } finally {
      setGeminiLoading(false);
    }
  };

  const applyGeminiData = (data: any) => {
    setForm(prev => {
      const newForm = { ...prev, ...data };
      newForm.examples = [{
        sentence_en: data.sentence_en || prev.examples[0].sentence_en,
        sentence_vi: data.sentence_vi || prev.examples[0].sentence_vi,
        exercises: [{
          question_text: data.sentence_en || prev.examples[0].exercises[0].question_text,
          answer_explanation: data.answer_explanation || prev.examples[0].exercises[0].answer_explanation,
          choices: [{
            content: data.correct_answer || prev.examples[0].exercises[0].choices[0].content,
            is_correct: 1
          }]
        }]
      }];
      return newForm;
    });

    setErrors(prev => {
      const newErrors = { ...prev };
      const fields = ["word", "ipa", "meaning_vi", "cefr_level", "context_vi", "examples.0.sentence_en", "examples.0.exercises.0.choices.0.content"];
      fields.forEach(f => delete newErrors[f]);
      return newErrors;
    });
  };

  const setField = (name: string, value: any) => {
    if (name.includes('.')) {
      const parts = name.split('.');
      setForm(prev => {
        const next = JSON.parse(JSON.stringify(prev)); // Deep clone for safety
        if (parts[0] === 'examples') {
          const exIdx = parseInt(parts[1]);
          if (parts[2] === 'exercises') {
            const exrIdx = parseInt(parts[3]);
            if (parts[4] === 'choices') {
              const chIdx = parseInt(parts[5]);
              next.examples[exIdx].exercises[exrIdx].choices[chIdx].content = value;
            } else {
              next.examples[exIdx].exercises[exrIdx][parts[4]] = value;
            }
          } else {
            next.examples[exIdx][parts[2]] = value;
            if (parts[2] === 'sentence_en') {
               next.examples[exIdx].exercises[0].question_text = value;
            }
          }
        }
        return next;
      });
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (f: ReviewWord): Errors => {
    const e: Errors = {};
    if (!f.word.trim()) e.word = 'Bắt buộc';
    if (!f.meaning_vi.trim()) e.meaning_vi = 'Bắt buộc';
    if (!f.examples[0].sentence_en.trim()) e["examples.0.sentence_en"] = 'Bắt buộc';
    if (!f.examples[0].exercises[0].choices[0].content.trim()) e["examples.0.exercises.0.choices.0.content"] = 'Bắt buộc';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const vErrors = validate(form);
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      setNotice({ type: 'error', msg: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = parseInt(localStorage.getItem('user_id') || '0', 10);
      
      const payload = {
        words: [{
          ...form,
          level: 1,
          is_grammar: form.is_grammar === "1",
          user_id: userId
        }]
      };

      const res = await fetch(`${API_URL}/en/practice/addWord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu từ vựng');

      setForm(INITIAL_FORM);
      setErrors({});
      setNotice({ type: 'success', msg: 'Đã thêm từ vựng thành công!' });
    } catch (err: any) {
      setNotice({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8faff] min-h-screen py-8 text-neutral-800">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 pb-12">
        <div className='text-center w-full text-5xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-400 uppercase tracking-tighter pt-4'>
          Add New English Word
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/en/home')}
            className="flex items-center text-gray-500 hover:text-gray-800 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-x-1"
          >
            <BiLogOutCircle className="text-xl" />
            <span className="ml-2 text-xs font-bold uppercase tracking-wider">Quay lại</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/en/import')}
            className="flex items-center text-blue-500 hover:text-blue-700 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:translate-x-1"
          >
            <BiCodeBlock className="text-xl" />
            <span className="ml-2 text-xs font-bold uppercase tracking-wider">Coder Mode</span>
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-2xl shadow-gray-200/50 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500"></div>

          <div className="border-b border-gray-100 pb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Word</label>
            <div className="flex space-x-3">
              <input
                value={form.word}
                onChange={(e) => setField("word", e.target.value)}
                className={`flex-1 border rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                  errors.word 
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-sm'
                } outline-none`}
                placeholder="Enter English word to get AI suggestions..."
              />
              <button
                type="button"
                onClick={handleGeminiCall}
                disabled={geminiLoading}
                className={`flex items-center px-6 py-2 rounded-lg shadow-sm text-white text-xs font-black uppercase tracking-widest transition-all duration-300
                  ${geminiLoading 
                    ? 'bg-purple-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 hover:shadow-purple-200 hover:-translate-y-0.5 active:scale-95'}`}
              >
                {geminiLoading ? 'Calling...' : <><Sparkles className="mr-2 h-4 w-4" /> Gemini AI</>}
              </button>
            </div>
            {errors.word && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase ml-1 tracking-tight">{errors.word}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="IPA (Pronunciation)" name="ipa" value={form.ipa} onChange={(e) => setField("ipa", e.target.value)} error={errors.ipa} />
            <InputField label="Meaning (VI)" name="meaning_vi" value={form.meaning_vi} onChange={(e) => setField("meaning_vi", e.target.value)} error={errors.meaning_vi} />
            <SelectField label="CEFR Level" name="cefr_level" value={form.cefr_level} onChange={(e) => setField("cefr_level", e.target.value)} options={CEFR_OPTIONS.map(o => ({ value: o, label: o }))} error={errors.cefr_level} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-gray-100 pb-2">
            <SelectField label="Loại mục" name="is_grammar" value={form.is_grammar} onChange={(e) => setField("is_grammar", e.target.value)} options={IS_GRAMMAR_OPTIONS} error={errors.is_grammar} />
            <SelectField label="Trạng thái" name="is_active" value={form.is_active} onChange={(e) => setField("is_active", e.target.value)} options={IS_ACTIVE_OPTIONS} error={errors.is_active} />
            <div className="md:col-span-2">
              <InputField label="Context (VI)" name="context_vi" value={form.context_vi} onChange={(e) => setField("context_vi", e.target.value)} error={errors.context_vi} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Quick Example (EN)" name="exampleEn" value={form.exampleEn} onChange={(e) => setField("exampleEn", e.target.value)} error={errors.exampleEn} />
            <InputField label="Quick Example (VI)" name="exampleVi" value={form.exampleVi} onChange={(e) => setField("exampleVi", e.target.value)} error={errors.exampleVi} />
          </div>

          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Exercise Sentence (EN)" name="examples.0.sentence_en" value={form.examples[0].sentence_en} onChange={(e) => setField("examples.0.sentence_en", e.target.value)} error={errors["examples.0.sentence_en"]} placeholder="Use ____ for blank" />
                <InputField label="Exercise Sentence (VI)" name="examples.0.sentence_vi" value={form.examples[0].sentence_vi} onChange={(e) => setField("examples.0.sentence_vi", e.target.value)} error={errors["examples.0.sentence_vi"]} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Correct Answer" name="examples.0.exercises.0.choices.0.content" value={form.examples[0].exercises[0].choices[0].content} onChange={(e) => setField("examples.0.exercises.0.choices.0.content", e.target.value)} error={errors["examples.0.exercises.0.choices.0.content"]} />
                <InputField label="Explanation" name="examples.0.exercises.0.answer_explanation" value={form.examples[0].exercises[0].answer_explanation} onChange={(e) => setField("examples.0.exercises.0.answer_explanation", e.target.value)} error={errors["examples.0.exercises.0.answer_explanation"]} />
             </div>
          </div>

          {notice && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-bold flex items-center shadow-sm border animate-in fade-in slide-in-from-top-2 duration-300 ${
              notice.type === 'success' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <div className={`mr-3 w-2 h-2 rounded-full ${notice.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {notice.msg}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pb-8">
          <button
            type="submit"
            disabled={loading}
            className={`px-10 py-3 rounded-xl shadow-lg text-white font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95
              ${loading 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-200 hover:-translate-y-0.5'
              }`}
          >
            {loading ? 'Saving...' : 'Save Word'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEnglishWordForm;
