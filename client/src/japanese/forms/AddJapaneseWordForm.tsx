import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { BiLogOutCircle, BiCodeBlock } from "react-icons/bi";
import { Sparkles } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_URL } from '../../apiClient';
const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;
const IS_GRAMMAR_OPTIONS: { value: string; label: string }[] = [
  { value: '0', label: 'Từ vựng thường' },
  { value: '1', label: 'Mục ngữ pháp' },
];
const IS_ACTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: 'Đang sử dụng (active)' },
  { value: '0', label: 'Tạm ẩn / không dùng' },
];

type FormState = {
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
  is_grammar: string;
  is_active: string; 
};

const INITIAL_FORM: FormState = {
  kanji: '', reading_hiragana: '', reading_romaji: '',
  meaning_vi: '', jlpt_level: '', level: '1',
  han_viet: '', hanviet_explanation: '',
  context_vi: '',
  sentence_jp: '', sentence_hira: '', sentence_romaji: '', sentence_vi: '',
  is_grammar: '0',  is_active: '1',
};

type Errors = Partial<Record<keyof FormState, string>>;

interface InputFieldProps {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, error, placeholder }) => (
  <div className="mb-3">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
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


interface SelectFieldProps {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, error, placeholder }) => (
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
      } outline-none cursor-pointer appearance-none`}
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

const AddJapaneseWordForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleGeminiCall = async () => {
    if (!form.kanji || geminiLoading) return;

    // 1. KIỂM TRA CACHE TRƯỚC (Tiết kiệm lượt gọi)
    const cacheKey = `gemini_${form.kanji.trim()}`;
    const savedData = localStorage.getItem(cacheKey);
    if (savedData) {
      setForm(prev => ({ ...prev, ...JSON.parse(savedData) }));
      setNotice({ type: 'success', msg: 'Lấy dữ liệu từ bộ nhớ đệm thành công!' });
      return;
    }

    setGeminiLoading(true);

    // 2. DANH SÁCH CÁC MODEL BẠN ĐANG CÓ (Dựa trên ảnh của bạn)
    // Thứ tự ưu tiên: Lite (10 RPM) -> 2.5 Flash -> 3 Flash
    const availableModels = [
      "gemini-2.5-flash-lite", // Ưu tiên vì có tới 10 yêu cầu/phút
      "gemini-2.5-flash",
      "gemini-3-flash"
    ];

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Hàm thực hiện gọi API với cơ chế thử lại trên model khác nếu hết hạn mức (429)
    const fetchWithFallback = async (modelIndex = 0) => {
      if (modelIndex >= availableModels.length) {
        throw new Error("Tất cả các model đều đã hết hạn mức hôm nay (60/60 lượt).");
      }

      const modelName = availableModels[modelIndex];
      console.log(`Đang thử gọi model: ${modelName}`);

      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Bạn là từ điển Nhật-Việt. Phân tích từ: ${form.kanji}. 
        Trả về JSON bao gồm các trường: 
        reading_hiragana, reading_romaji, meaning_vi, han_viet, hanviet_explanation, context_vi, sentence_jp, sentence_hira, sentence_romaji, sentence_vi,
        và jlpt_level (chọn một trong các giá trị: N1, N2, N3, N4, N5 dựa trên độ khó của từ).`;

        const result = await model.generateContent(prompt);
        console.log(result.response.text());
        return JSON.parse(result.response.text());
      } catch (err:any) {
        // Nếu lỗi 429 (Hết hạn mức), tự động thử model tiếp theo trong danh sách
        if (err.message.includes('429') || err.message.includes('quota')) {
          console.warn(`Model ${modelName} đã hết lượt. Chuyển sang model tiếp theo...`);
          return fetchWithFallback(modelIndex + 1);
        }
        throw err; // Các lỗi khác (mạng, 503...) thì báo lỗi luôn
      }
    };

    try {
      const data = await fetchWithFallback();

      // 3. LƯU VÀO CACHE & CẬP NHẬT FORM
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setForm(prev => ({ ...prev, ...data }));
      setNotice({ type: 'success', msg: 'Gemini đã phân tích xong!' });

    } catch (err:any) {
      console.error("Lỗi cuối cùng:", err);
      setNotice({ type: 'error', msg: err.message });
    } finally {
      setGeminiLoading(false);
    }
  };
  const setField = (name: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    // clear error ngay khi user sửa
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setField(name as keyof FormState, value);
  };

  const validate = (raw: FormState): Errors => {
    const f: FormState = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    ) as FormState;

    const e: Errors = {};

    // Bắt buộc tất cả các trường
    (Object.keys(f) as (keyof FormState)[]).forEach((k) => {
      if (!f[k] || f[k].length === 0) e[k] = 'Trường này là bắt buộc.';
    });

    // JLPT phải là 1 trong N1..N5
    if (f.jlpt_level && !JLPT_OPTIONS.includes(f.jlpt_level as any)) {
      e.jlpt_level = 'Giá trị không hợp lệ. Hãy chọn N1 đến N5.';
    }

    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    // chuẩn hóa trước khi validate
    const trimmed: FormState = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    ) as FormState;

    const vErrors = validate(trimmed);
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      setNotice({
        type: 'error',
        msg: 'Vui lòng điền đầy đủ và đúng định dạng tất cả các trường.'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = parseInt(localStorage.getItem('user_id') || '0', 10);
      const payload = { ...trimmed, user_id: userId };

      const res = await fetch(`${API_URL}/jp/practice/add-word`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join('\n') : 'Có lỗi xảy ra, vui lòng thử lại.');
        setNotice({ type: 'error', msg });
        return;
      }

      setForm(INITIAL_FORM);
      setErrors({});
      setNotice({ type: 'success', msg: data?.message || 'Đã thêm từ vựng thành công.' });
    } catch (err: any) {
      setNotice({ type: 'error', msg: err?.message || 'Không thể kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8faff] min-h-screen py-8">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 pb-12">
        <div className='text-center w-full text-5xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-400 uppercase tracking-tighter pt-4'>
          Add New Word
        </div>

        {/* Nút quay lại + Coder Mode */}
        {/* Nút quay lại + Coder Mode */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/jp/home')}
            className="flex items-center text-gray-500 hover:text-gray-800 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-x-1"
          >
            <BiLogOutCircle className="text-xl" />
            <span className="ml-2 text-xs font-bold uppercase tracking-wider">Quay lại</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/jp/import')}
            className="flex items-center text-blue-500 hover:text-blue-700 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:translate-x-1"
          >
            <BiCodeBlock className="text-xl" />
            <span className="ml-2 text-xs font-bold uppercase tracking-wider">Coder Mode</span>
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-2xl shadow-gray-200/50 space-y-8 relative overflow-hidden">
          {/* Một dải màu trang trí phía trên cùng */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500"></div>

          {/* Hàng 1: Kanji + Gemini */}
          <div className="border-b border-gray-100 pb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Kanji</label>
            <div className="flex space-x-3">
              <input
                name="kanji"
                value={form.kanji}
                onChange={handleChange}
                className={`flex-1 border rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                  errors.kanji 
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-sm'
                } outline-none`}
                placeholder="Nhập Kanji để lấy gợi ý từ Gemini AI..."
              />
              <button
                type="button"
                onClick={handleGeminiCall}
                disabled={geminiLoading}
                className={`flex items-center px-4   py-2 rounded-lg shadow-sm text-white text-xs font-black uppercase tracking-widest transition-all duration-300
                  ${geminiLoading 
                    ? 'bg-purple-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 hover:shadow-purple-200 hover:-translate-y-0.5 active:scale-95'}`}
              >
                {geminiLoading ? 'Đang gọi...' : <><Sparkles className="mr-2 h-4 w-4" /> Gemini AI</>}
              </button>
            </div>
            {errors.kanji && <p className="mt-0.5 text-xs text-red-600">{errors.kanji}</p>}
          </div>

          {/* Hàng 2: Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Hiragana" name="reading_hiragana" value={form.reading_hiragana} onChange={handleChange} error={errors.reading_hiragana} />
            <InputField label="Romaji" name="reading_romaji" value={form.reading_romaji} onChange={handleChange} error={errors.reading_romaji} />
            <InputField label="Nghĩa tiếng Việt" name="meaning_vi" value={form.meaning_vi} onChange={handleChange} error={errors.meaning_vi} />
          </div>

          {/* Hàng 3: Cấu hình */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-2">
            <SelectField label="JLPT" name="jlpt_level" value={form.jlpt_level} onChange={handleChange as any} options={JLPT_OPTIONS.map(n => ({ value: n, label: n }))} placeholder="Chọn..." error={errors.jlpt_level} />
            <SelectField label="Loại mục" name="is_grammar" value={form.is_grammar} onChange={handleChange as any} options={IS_GRAMMAR_OPTIONS} error={errors.is_grammar} />
            <SelectField label="Trạng thái" name="is_active" value={form.is_active} onChange={handleChange as any} options={IS_ACTIVE_OPTIONS} error={errors.is_active} />
          </div>

          {/* Hàng 4: Hán Việt & Ngữ cảnh */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InputField label="Âm Hán Việt" name="han_viet" value={form.han_viet} onChange={handleChange} error={errors.han_viet} />
            <div className="md:col-span-1">
               <InputField label="Giải thích Hán" name="hanviet_explanation" value={form.hanviet_explanation} onChange={handleChange} error={errors.hanviet_explanation} />
            </div>
            <div className="md:col-span-2">
              <InputField label="Ngữ cảnh (Context)" name="context_vi" value={form.context_vi} onChange={handleChange} error={errors.context_vi} />
            </div>
          </div>

          {/* Hàng 5: Ví dụ */}
          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Câu tiếng Nhật" name="sentence_jp" value={form.sentence_jp} onChange={handleChange} error={errors.sentence_jp} />
            <InputField label="Câu Hiragana" name="sentence_hira" value={form.sentence_hira} onChange={handleChange} error={errors.sentence_hira} />
            <InputField label="Câu Romaji" name="sentence_romaji" value={form.sentence_romaji} onChange={handleChange} error={errors.sentence_romaji} />
            <InputField label="Dịch ví dụ" name="sentence_vi" value={form.sentence_vi} onChange={handleChange} error={errors.sentence_vi} />
          </div>

          {/* Thông báo lỗi/thành công */}
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
          {loading ? 'Đang lưu...' : 'Lưu từ vựng'}
        </button>
      </div>
    </form>
    </div>
  );
};

export default AddJapaneseWordForm;
