// EditJapaneseWordForm.tsx
import React, { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BiLogOutCircle } from 'react-icons/bi';

const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;
const LEVEL_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'] as const;
type JLPT = typeof JLPT_OPTIONS[number];

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
};

const InputField: React.FC<{
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
}> = ({ label, name, value, onChange, error, placeholder }) => (
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
    {error && (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
        {error}
      </p>
    )}
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
  <div className="mb-4">
    <label className="block font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <option value="">{placeholder || 'Chọn một giá trị'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
        {error}
      </p>
    )}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border rounded-md p-4 mb-6">
    <h2 className="text-lg font-bold mb-4 text-blue-600">{title}</h2>
    {children}
  </div>
);

const EditJapaneseWordForm: React.FC = () => {
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
      } catch {}
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
    (Object.keys(f) as (keyof FormState)[]).forEach(k => {
      if (isEmpty(f[k])) e[k] = 'Trường này là bắt buộc.';
    });

    // JLPT phải hợp lệ
    if (f.jlpt_level && !JLPT_OPTIONS.includes(f.jlpt_level as JLPT)) {
      e.jlpt_level = 'Giá trị không hợp lệ. Hãy chọn N1 đến N5.';
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
      const res = await fetch(`/api/practice/updateWord/${wordId}`, {
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
    } catch (err: any) {
      setNotice({ type: 'error', msg: err?.message || 'Không thể kết nối máy chủ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <div className="text-center w-full text-5xl">Edit word</div>

      {/* Quay lại */}
      <div className="flex items-center my-5">
        <button
          type="button"
          onClick={() => navigate('/jp/listWord')}
          className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <BiLogOutCircle className="text-gray-700 text-3xl" />
          <span className="ml-2 text-sm">Quay lại</span>
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
        <div
          className={`mb-4 rounded px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notice.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className={`mt-4 px-6 py-2 rounded-md shadow text-stone-50 font-semibold ${
          saving ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </form>
  );
};

export default EditJapaneseWordForm;
