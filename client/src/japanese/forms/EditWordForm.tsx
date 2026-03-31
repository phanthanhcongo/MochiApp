// EditJapaneseWordForm.tsx
import React, { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BiLogOutCircle } from 'react-icons/bi';
import { API_URL } from '../../apiClient';

const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;
const LEVEL_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'] as const;
type JLPT = typeof JLPT_OPTIONS[number];
const IS_GRAMMAR_OPTIONS: { value: string; label: string }[] = [
  { value: '0', label: 'Từ vựng thường' },
  { value: '1', label: 'Mục ngữ pháp' },
];
const IS_ACTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: 'Đang sử dụng (active)' },
  { value: '0', label: 'Tạm ẩn / không dùng' },
];

type FormState = {
  id: string; // luôn mang ID theo form
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

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  id: '',
  kanji: '',
  reading_hiragana: '',
  reading_romaji: '',
  meaning_vi: '',
  jlpt_level: '',
  level: '',
  han_viet: '',
  hanviet_explanation: '',
  context_vi: '',
  sentence_jp: '',
  sentence_hira: '',
  sentence_romaji: '',
  sentence_vi: '',
  is_grammar: '',
  is_active: '',
};

const InputField: React.FC<{
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
}> = ({ label, name, value, onChange, error, placeholder }) => (
  <div className="mb-2">
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 ml-1">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 ${
        error 
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
          : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm'
      } outline-none`}
      aria-invalid={!!error}
      placeholder={placeholder}
    />
    {error && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase ml-1 tracking-tight">{error}</p>}
  </div>
);

const SelectField: React.FC<{
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}> = ({ label, name, value, onChange, options, error, placeholder }) => (
  <div className="mb-2">
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 ml-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 ${
        error 
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
          : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm'
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mb-4">
    <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-blue-600 border-b border-blue-50 pb-1">{title}</h2>
    {children}
  </div>
);

const EditWordForm: React.FC = () => {
  const { id: idFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { form?: FormState } };

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Nạp từ state hoặc sessionStorage, không gọi GET
  useEffect(() => {
    const fromStateForm = location.state?.form;
    if (fromStateForm) {
      const normalized = { ...fromStateForm, id: String(fromStateForm.id || idFromUrl || '') };
      setForm(normalized);
      console.log('📌 Nhận từ state:', normalized);
      sessionStorage.setItem('editingForm', JSON.stringify(normalized));
      return;
    }
    const cached = sessionStorage.getItem('editingForm');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as FormState;
        const normalized = { ...parsed, id: String(parsed.id || idFromUrl || '') };
        setForm(normalized);
        console.log('📌 Lấy từ sessionStorage:', normalized);
        return;
      } catch { }
    }
    navigate('/jp/reviewWordList');
  }, [location.state, idFromUrl, navigate]);

  const setField = (name: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      sessionStorage.setItem('editingForm', JSON.stringify(next));
      if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }));
      return next;
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setField(name as keyof FormState, value);
  };

  // helper an toàn
  const isEmpty = (v: unknown) => (typeof v === 'string' ? v.trim().length === 0 : v == null);

  const validate = (f: FormState): Errors => {
    const e: Errors = {};

    // các field đều string → có thể kiểm tra rỗng an toàn
    // context_vi không bắt buộc
    (Object.keys(f) as (keyof FormState)[]).forEach(k => {
      if (k === 'context_vi') return; // Bỏ qua context_vi
      if (isEmpty(f[k])) e[k] = 'Trường này là bắt buộc.';
    });

    // JLPT phải hợp lệ
    if (f.jlpt_level && !JLPT_OPTIONS.includes(f.jlpt_level as JLPT)) {
      e.jlpt_level = 'Giá trị không hợp lệ. Hãy chọn N1 đến N5.';
    }
    // is_grammar chỉ cho phép '0' hoặc '1'
    if (f.is_grammar && f.is_grammar !== '0' && f.is_grammar !== '1') {
      e.is_grammar = 'Giá trị không hợp lệ.';
    }
    // level 1..7
    if (f.level) {
      const n = Number(f.level);
      if (!Number.isInteger(n) || n < 1 || n > 7) {
        e.level = 'Level phải từ 1 đến 7.';
      }
    }

    return e;
  };

  // Gửi POST /practice/updateWord với payload phẳng + word_id
  const handleSubmit = async (e: FormEvent) => {
    console.log('🔎 Gửi form:', form);
    e.preventDefault();
    setNotice(null);

    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    ) as FormState;

    const vErrors = validate(trimmed);
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      setNotice({ type: 'error', msg: 'Vui lòng điền đầy đủ và đúng định dạng tất cả các trường.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setNotice({ type: 'error', msg: 'Bạn chưa đăng nhập.' });
      return;
    }

    const wordId = trimmed.id || idFromUrl;
    if (!wordId) {
      setNotice({ type: 'error', msg: 'Thiếu ID để cập nhật.' });
      return;
    }

    // Backend đang nhận phẳng → gửi nguyên trimmed kèm word_id
    const bodyToSend = { word_id: wordId, ...trimmed };
    console.log('🔎 Payload gửi POST /practice/updateWord:', bodyToSend);

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/jp/practice/updateWord/${wordId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.errors ? (Object.values(data.errors) as any).flat().join('\n') : 'Có lỗi xảy ra, vui lòng thử lại.');
        setNotice({ type: 'error', msg });
        return;
      }

      sessionStorage.setItem('editingForm', JSON.stringify(trimmed));
      setNotice({ type: 'success', msg: data?.message || 'Đã cập nhật từ vựng thành công.' });
      // Chuyển hướng về trang listWord sau khi cập nhật thành công
      setTimeout(() => {
        navigate('/jp/listWord');
      }, 500);
    } catch (err: any) {
      setNotice({ type: 'error', msg: err?.message || 'Không thể kết nối máy chủ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8faff] overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className='text-center w-full text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-400 uppercase tracking-tighter pt-2'>
            Edit Word
          </div>

          {/* Quay lại */}
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => navigate('/jp/listWord')}
              className="flex items-center text-gray-500 hover:text-gray-800 transition-all bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100"
            >
              <BiLogOutCircle className="text-lg" />
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider">Quay lại</span>
            </button>
          </div>

      <Section title="1. jp_words">
        <InputField label="Kanji" name="kanji" value={form.kanji} onChange={handleChange} error={errors.kanji} />
        <InputField
          label="Hiragana"
          name="reading_hiragana"
          value={form.reading_hiragana}
          onChange={handleChange}
          error={errors.reading_hiragana}
        />
        <InputField
          label="Romaji"
          name="reading_romaji"
          value={form.reading_romaji}
          onChange={handleChange}
          error={errors.reading_romaji}
        />
        <InputField
          label="Nghĩa tiếng Việt"
          name="meaning_vi"
          value={form.meaning_vi}
          onChange={handleChange}
          error={errors.meaning_vi}
        />
        <SelectField
          label="JLPT level"
          name="jlpt_level"
          value={form.jlpt_level}
          onChange={handleChange as any}
          options={JLPT_OPTIONS.map(n => ({ value: n, label: n }))}
          placeholder="Chọn JLPT N1 đến N5"
          error={errors.jlpt_level}
        />
        <SelectField
          label="Level"
          name="level"
          value={form.level}
          onChange={handleChange as any}
          options={LEVEL_OPTIONS.map(l => ({ value: l, label: l }))}
          placeholder="Chọn level 1 đến 7"
          error={errors.level}
        />
        <SelectField
          label="Loại mục (is_grammar)"
          name="is_grammar"
          value={form.is_grammar}
          onChange={handleChange as any}
          options={IS_GRAMMAR_OPTIONS}
          error={errors.is_grammar}
        />
        <SelectField
    label="Trạng thái (is_active)"
    name="is_active"
    value={form.is_active}
    onChange={handleChange as any}
    options={IS_ACTIVE_OPTIONS}
    placeholder="Chọn trạng thái"
    error={errors.is_active}
  />

      </Section>

      <Section title="2. jp_hanviet">
        <InputField
          label="Âm Hán Việt"
          name="han_viet"
          value={form.han_viet}
          onChange={handleChange}
          error={errors.han_viet}
        />
        <InputField
          label="Giải thích"
          name="hanviet_explanation"
          value={form.hanviet_explanation}
          onChange={handleChange}
          error={errors.hanviet_explanation}
        />
      </Section>

      <Section title="3. jp_contexts">
        <InputField
          label="Context VI"
          name="context_vi"
          value={form.context_vi}
          onChange={handleChange}
          error={errors.context_vi}
        />
      </Section>

      <Section title="4. jp_examples">
        <InputField
          label="Câu JP"
          name="sentence_jp"
          value={form.sentence_jp}
          onChange={handleChange}
          error={errors.sentence_jp}
        />
        <InputField
          label="Câu Hira"
          name="sentence_hira"
          value={form.sentence_hira}
          onChange={handleChange}
          error={errors.sentence_hira}
        />
        <InputField
          label="Câu Romaji"
          name="sentence_romaji"
          value={form.sentence_romaji}
          onChange={handleChange}
          error={errors.sentence_romaji}
        />
        <InputField
          label="Câu dịch"
          name="sentence_vi"
          value={form.sentence_vi}
          onChange={handleChange}
          error={errors.sentence_vi}
        />
      </Section>

          {notice && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-[11px] font-bold flex items-center shadow-sm border animate-in fade-in slide-in-from-top-2 duration-300 ${
              notice.type === 'success' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <div className={`mr-3 w-2 h-2 rounded-full ${notice.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {notice.msg}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-2 rounded-lg shadow-md text-white font-black text-xs uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                saving 
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5'
              }`}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWordForm;



