import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { BiLogOutCircle,BiCodeBlock } from "react-icons/bi";
import { useNavigate } from 'react-router-dom';

const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;
const LEVEL_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'] as const;

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
};

const INITIAL_FORM: FormState = {
  kanji: '', reading_hiragana: '', reading_romaji: '',
  meaning_vi: '', jlpt_level: '', level: '',
  han_viet: '', hanviet_explanation: '',
  context_vi: '',
  sentence_jp: '', sentence_hira: '', sentence_romaji: '', sentence_vi: '',
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
  <div className="mb-4">
    <label className="block font-medium text-gray-700 mb-1">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
      placeholder={placeholder}
    />
    {error && <p id={`${name}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
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
  <div className="mb-4">
    <label className="block font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded px-3 py-2  ${error ? 'border-red-500' : 'border-gray-300'}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <option value="">{placeholder || 'Chọn một giá trị'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p id={`${name}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="border rounded-md p-4 mb-6">
    <h2 className="text-lg font-bold mb-4 text-blue-600">{title}</h2>
    {children}
  </div>
);

const AddJapaneseWordForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

    // Level phải là 1..7
    if (f.level) {
      const n = Number(f.level);
      if (!Number.isInteger(n) || n < 1 || n > 7) {
        e.level = 'Level phải từ 1 đến 7.';
      }
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

      const res = await fetch('/api/practice/add-word', {
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <div className='text-center w-full text-5xl'>Add new word</div>

   {/* Nút quay lại + Coder Mode */}
<div className="flex items-center my-5 space-x-4">
  {/* Nút Quay lại */}
  <button
    type="button"
    onClick={() => navigate('/jp/home')}
    className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
  >
    <BiLogOutCircle className="text-gray-700 text-3xl" />
    <span className="ml-2 text-sm">Quay lại</span>
  </button>

  {/* Nút Coder Mode */}
  <button
    type="button"
    onClick={() => navigate('/jp/import')}
    className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
  >
    <BiCodeBlock className="text-blue-600 text-3xl" />
    <span className="ml-2 text-sm">Coder Mode</span>
  </button>
</div>


      <Section title="1. jp_words">
        <InputField label="Kanji" name="kanji" value={form.kanji} onChange={handleChange} error={errors.kanji} />
        <InputField label="Hiragana" name="reading_hiragana" value={form.reading_hiragana} onChange={handleChange} error={errors.reading_hiragana} />
        <InputField label="Romaji" name="reading_romaji" value={form.reading_romaji} onChange={handleChange} error={errors.reading_romaji} />
        <InputField label="Nghĩa tiếng Việt" name="meaning_vi" value={form.meaning_vi} onChange={handleChange} error={errors.meaning_vi} />
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
      </Section>

      <Section title="2. jp_hanviet">
        <InputField label="Âm Hán Việt" name="han_viet" value={form.han_viet} onChange={handleChange} error={errors.han_viet} />
        <InputField label="Giải thích" name="hanviet_explanation" value={form.hanviet_explanation} onChange={handleChange} error={errors.hanviet_explanation} />
      </Section>

      <Section title="3. jp_contexts">
        <InputField label="Context VI" name="context_vi" value={form.context_vi} onChange={handleChange} error={errors.context_vi} />
      </Section>

      <Section title="4. jp_examples">
        <InputField label="Câu JP" name="sentence_jp" value={form.sentence_jp} onChange={handleChange} error={errors.sentence_jp} />
        <InputField label="Câu Hira" name="sentence_hira" value={form.sentence_hira} onChange={handleChange} error={errors.sentence_hira} />
        <InputField label="Câu Romaji" name="sentence_romaji" value={form.sentence_romaji} onChange={handleChange} error={errors.sentence_romaji} />
        <InputField label="Câu dịch" name="sentence_vi" value={form.sentence_vi} onChange={handleChange} error={errors.sentence_vi} />
      </Section>

      {/* Thông báo */}
      {notice && (
        <div className={`mb-4 rounded px-4 py-3 text-sm ${notice.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {notice.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`mt-4 px-6 py-2 rounded-md shadow text-stone-50 font-semibold
          ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Đang lưu...' : 'Lưu từ vựng'}
      </button>
    </form>
  );
};

export default AddJapaneseWordForm;
