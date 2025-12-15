import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

type CEFR = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "";

interface ReviewWord {
  id?: number;
  user_id: number;
  word: string;
  ipa?: string;
  meaning_vi: string;
  cefr_level?: CEFR | null;
  level: number;
  last_reviewed_at?: string; // "YYYY-MM-DD HH:mm:ss"
  next_review_at?: string;   // "YYYY-MM-DD HH:mm:ss"
  context_vi: string;
  exampleEn: string;
  exampleVi: string;
  examples: {
    sentence_en: string;
    sentence_vi: string;
    exercises: {
      question_text: string;
      blank_position?: number | null;
      answer_explanation?: string;
      choices: { content: string; is_correct: 1 }[]; // chỉ 1 đáp án đúng
    }[];
  }[];
  is_active: "1" | "0";
  is_grammar?: boolean;
}

type ErrorMap = Record<string, string>;
type TouchedMap = Record<string, boolean>;

// Tìm vị trí (1-based) của "____" trong câu; không có thì trả null
function computeBlankPosition(sentence: string | undefined): number | null {
  if (!sentence) return null;
  const parts = sentence.split(/\s+/);
  const idx = parts.findIndex((t) => t === "____");
  return idx >= 0 ? idx + 1 : null;
}

// Map từ object trả về API -> ReviewWord đầy đủ
function mapFromApi(apiWord: any): ReviewWord {
  const ex0 = apiWord?.examples?.[0] || {};
  const exr0 = ex0?.exercises?.[0] || {};
  const ch0 = exr0?.choices?.[0] || {};

  return {
    id: apiWord.id,
    user_id: Number(apiWord.user_id ?? 0),
    word: apiWord.word ?? "",
    ipa: apiWord.ipa ?? "",
    meaning_vi: apiWord.meaning_vi ?? "",
    cefr_level: (apiWord.cefr_level ?? "") as CEFR,
    level: Number(apiWord.level ?? 1),
    last_reviewed_at: apiWord.last_reviewed_at ?? "",
    next_review_at: apiWord.next_review_at ?? "",
    context_vi: apiWord.contexts?.[0]?.context_vi ?? apiWord.context_vi ?? "",
    exampleEn: apiWord.exampleEn ?? "",
    exampleVi: apiWord.exampleVn ?? apiWord.exampleVi ?? "",
    examples: [
      {
        sentence_en: ex0.sentence_en ?? "",
        sentence_vi: ex0.sentence_vi ?? "",
        exercises: [
          {
            question_text: exr0.question_text ?? ex0.sentence_en ?? "",
            blank_position:
              typeof exr0.blank_position === "number"
                ? exr0.blank_position
                : computeBlankPosition(ex0.sentence_en),
            answer_explanation: exr0.answer_explanation ?? "",
            // chỉ 1 đáp án đúng, các đáp án nhiễu backend sẽ lo
            choices: [
              {
                content: ch0.content ?? "",
                is_correct: 1,
              },
            ],
          },
        ],
      },
    ],
    is_active: "1",
    is_grammar: apiWord.is_grammar ?? false,
  };
}

export default function EditEnglishWordForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [word, setWord] = useState<ReviewWord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [touched, setTouched] = useState<TouchedMap>({});

  // ====== helpers (form) ======
  const setField = (field: keyof ReviewWord, value: any) =>
    setWord((prev) => (prev ? { ...prev, [field]: value } : prev));

  const setExampleField = (
    exIdx: number,
    field: keyof ReviewWord["examples"][number],
    value: any
  ) => {
    setWord((prev) => {
      if (!prev) return prev;
      const examples = [...(prev.examples || [])];
      (examples[exIdx] as any)[field] = value;
      return { ...prev, examples };
    });
  };

  const setExerciseField = (
    exIdx: number,
    exrIdx: number,
    field: keyof NonNullable<ReviewWord["examples"]>[number]["exercises"][number],
    value: any
  ) => {
    setWord((prev) => {
      if (!prev) return prev;
      const examples = [...(prev.examples || [])];
      const exercises = [...(examples[exIdx].exercises || [])];
      (exercises[exrIdx] as any)[field] = value;
      examples[exIdx].exercises = exercises;
      return { ...prev, examples };
    });
  };

  const setChoiceField = (
    exIdx: number,
    exrIdx: number,
    chIdx: number,
    field: keyof NonNullable<
      ReviewWord["examples"]
    >[number]["exercises"][number]["choices"][number],
    value: any
  ) => {
    setWord((prev) => {
      if (!prev) return prev;
      const examples = [...(prev.examples || [])];
      const exercises = [...(examples[exIdx].exercises || [])];
      const choices = [...(exercises[exrIdx].choices || [])];
      (choices[chIdx] as any)[field] = value;
      exercises[exrIdx].choices = choices;
      examples[exIdx].exercises = exercises;
      return { ...prev, examples };
    });
  };

  const setFieldTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const hasError = (key: string) => !!errors[key] && touched[key];
  const helpId = (key: string) => `${key.replace(/\./g, "-")}-error`;

  const inputClass = (key: string) =>
    `block w-full rounded-xl border px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus:ring-4 transition ${hasError(key)
      ? "border-red-500 ring-red-200"
      : "border-neutral-300 bg-slate-50 focus:ring-black/10 focus:border-neutral-800"
    }`;

  // ====== validate ======
  const validateAll = useCallback((w: ReviewWord): ErrorMap => {
    const errs: ErrorMap = {};
    const ex0 = w.examples?.[0];
    const exr0 = ex0?.exercises?.[0];
    const ch0 = exr0?.choices?.[0];

    if (!w.word?.trim()) errs["word"] = "Required";
    if (!w.meaning_vi?.trim()) errs["meaning_vi"] = "Required";
    if (!ex0?.sentence_en?.trim()) errs["examples.0.sentence_en"] = "Required";
    if (!ch0?.content?.trim())
      errs["examples.0.exercises.0.choices.0.content"] = "Required";

    return errs;
  }, []);

  const revalidateOnChange = (key: string, next: ReviewWord) => {
    if (touched[key] || errors[key]) {
      const all = validateAll(next);
      setErrors((prev) => ({ ...prev, [key]: all[key] }));
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!id) return;

    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/en/practice/${id}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const text = await res.text();
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        const apiWord = data?.data ?? data;
        const mapped = mapFromApi(apiWord);
        if (mounted) setWord(mapped);
      } catch (e: any) {
        if (mounted)
          setErrors((prev) => ({ ...prev, _form: e.message || "Load error" }));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // ====== submit update (PUT) ======
  async function updateEnglishWord() {
    // submit xong thì chuyển tragn về list words
    if (!word || !id) return;

    setSubmitting(true);
    setServerResult(null);

    const allErrors = validateAll(word);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const touchedAll: TouchedMap = { ...touched };
      Object.keys(allErrors).forEach((k) => (touchedAll[k] = true));
      setTouched(touchedAll);
      setSubmitting(false);
      return;
    }

    const ex0 = word.examples?.[0];
    const exr0 = ex0?.exercises?.[0];
    const choiceContent = exr0?.choices?.[0]?.content?.trim() || "";

    // Đồng bộ question_text = sentence_en nếu thiếu
    const questionText = (exr0?.question_text || ex0?.sentence_en || "").trim();

    const payload = {
      words: [
        {
          id: word.id,
          user_id: Number(word.user_id || 0),
          word: word.word.trim(),
          ipa: word.ipa?.trim() || "",
          meaning_vi: word.meaning_vi.trim(),
          cefr_level: word.cefr_level || null,
          level: Number(word.level || 1),
          last_reviewed_at: word.last_reviewed_at || "", // "YYYY-MM-DD HH:mm:ss"
          next_review_at: word.next_review_at || "",     // "YYYY-MM-DD HH:mm:ss"
          context_vi: word.context_vi?.trim() || "",
          exampleEn: word.exampleEn?.trim() || "",
          exampleVi: word.exampleVi?.trim() || "",
          examples: [
            {
              sentence_en: ex0?.sentence_en?.trim() || "",
              sentence_vi: ex0?.sentence_vi?.trim() || "",
              exercises: [
                {
                  question_text: questionText,
                  blank_position:
                    typeof exr0?.blank_position === "number"
                      ? exr0!.blank_position
                      : computeBlankPosition(ex0?.sentence_en),
                  answer_explanation: exr0?.answer_explanation?.trim() || "",
                  choices: choiceContent
                    ? [{ content: choiceContent, is_correct: 1 as const }]
                    : [],
                },
              ],
            },
          ],
          is_active: word.is_active,
          is_grammar: word.is_grammar ?? false,
        },
      ],
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/en/practice/update/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server trả non-JSON: ${text.slice(0, 200)}...`);
      }
      if (res.ok) {
        navigate(`/en/listWord`);
      }
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      setServerResult(data);
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, _form: e.message || "Submit error" }));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Đang tải...</div>;
  if (!word) return <div>Không tìm thấy từ</div>;

  return (
    <div>
      <div className="mx-auto w-full px-4 py-8">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Edit English Word</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Fields marked with <span className="text-red-600">*</span> are required.
          </p>
        </header>

        {errors._form && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errors._form}
          </div>
        )}

        <section className="rounded-2xl bg-slate-50 shadow-sm ring-1 ring-neutral-200">
          <div className="p-6 space-y-8">
            {/* Basic fields */}
            <div>
              <h3 className="text-base font-medium">Basic Info</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Word */}
                <label className="flex flex-col gap-1" data-field="word">
                  <span className="text-sm font-medium">
                    Word <span className="text-red-600">*</span>
                  </span>
                  <input
                    className={inputClass("word")}
                    value={word.word}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...(word as ReviewWord), word: v };
                      setField("word", v);
                      revalidateOnChange("word", next);
                    }}
                    onBlur={() => setFieldTouched("word")}
                    placeholder="e.g. adapt"
                    aria-invalid={hasError("word")}
                    aria-describedby={hasError("word") ? helpId("word") : undefined}
                  />
                  {hasError("word") && (
                    <span id={helpId("word")} className="text-xs text-red-600">
                      {errors.word}
                    </span>
                  )}
                </label>

                {/* IPA */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">IPA</span>
                  <input
                    className={inputClass("ipa")}
                    value={word.ipa || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...(word as ReviewWord), ipa: v };
                      setField("ipa", v);
                      revalidateOnChange("ipa", next);
                    }}
                    onBlur={() => setFieldTouched("ipa")}
                    placeholder="/əˈdæpt/"
                  />
                </label>

                {/* CEFR */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">CEFR level</span>
                  <select
                    className={inputClass("cefr_level")}
                    value={word.cefr_level || ""}
                    onChange={(e) => {
                      const v = e.target.value as CEFR;
                      const next = { ...(word as ReviewWord), cefr_level: v };
                      setField("cefr_level", v);
                      revalidateOnChange("cefr_level", next);
                    }}
                    onBlur={() => setFieldTouched("cefr_level")}
                  >
                    <option value="">-- Select level --</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </label>

                {/* Level */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Level</span>
                  <input
                    type="number"
                    min={1}
                    className={inputClass("level")}
                    value={word.level}
                    onChange={(e) => {
                      const v = Number(e.target.value || 1);
                      const next = { ...(word as ReviewWord), level: v };
                      setField("level", v);
                      revalidateOnChange("level", next);
                    }}
                    onBlur={() => setFieldTouched("level")}
                    placeholder="1"
                  />
                </label>

                {/* Meaning VI */}
                <label className="md:col-span-2 flex flex-col gap-1" data-field="meaning_vi">
                  <span className="text-sm font-medium">
                    Meaning VI <span className="text-red-600">*</span>
                  </span>
                  <input
                    className={inputClass("meaning_vi")}
                    value={word.meaning_vi}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...(word as ReviewWord), meaning_vi: v };
                      setField("meaning_vi", v);
                      revalidateOnChange("meaning_vi", next);
                    }}
                    onBlur={() => setFieldTouched("meaning_vi")}
                    placeholder="thích nghi"
                    aria-invalid={hasError("meaning_vi")}
                    aria-describedby={hasError("meaning_vi") ? helpId("meaning_vi") : undefined}
                  />
                  {hasError("meaning_vi") && (
                    <span id={helpId("meaning_vi")} className="text-xs text-red-600">
                      {errors["meaning_vi"]}
                    </span>
                  )}
                </label>
                {/* Status: is_active */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    className={inputClass("is_active")}
                    value={word.is_active}
                    onChange={(e) => {
                      const v = e.target.value as "1" | "0";
                      setField("is_active", v);
                      revalidateOnChange("is_active", { ...word, is_active: v });
                    }}
                    onBlur={() => setFieldTouched("is_active")}
                  >
                    <option value="1">Active (đang sử dụng)</option>
                    <option value="0">Inactive (ẩn)</option>
                  </select>
                </label>

                {/* Is Grammar */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Loại</span>
                  <select
                    className={inputClass("is_grammar")}
                    value={word.is_grammar ? "1" : "0"}
                    onChange={(e) => {
                      const v = e.target.value === "1";
                      const next = { ...(word as ReviewWord), is_grammar: v };
                      setField("is_grammar", v);
                      revalidateOnChange("is_grammar", next);
                    }}
                    onBlur={() => setFieldTouched("is_grammar")}
                  >
                    <option value="0">Từ vựng</option>
                    <option value="1">Mẫu ngữ pháp</option>
                  </select>
                </label>

                {/* Context VI */}
                <label className="md:col-span-2 flex flex-col gap-1">
                  <span className="text-sm font-medium">Context VI</span>
                  <textarea
                    className={inputClass("context_vi") + " min-h-24 resize-y"}
                    value={word.context_vi}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...(word as ReviewWord), context_vi: v };
                      setField("context_vi", v);
                      revalidateOnChange("context_vi", next);
                    }}
                    onBlur={() => setFieldTouched("context_vi")}
                    placeholder="Ví dụ sử dụng trong giao tiếp hằng ngày..."
                  />
                </label>

                {/* Quick Example EN */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Quick Example EN</span>
                  <input
                    className={inputClass("exampleEn")}
                    value={word.exampleEn}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...(word as ReviewWord), exampleEn: v };
                      setField("exampleEn", v);
                      revalidateOnChange("exampleEn", next);
                    }}
                    onBlur={() => setFieldTouched("exampleEn")}
                    placeholder="They need to adapt to the situation."
                  />
                </label>

                {/* Quick Example VI */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Quick Example VI</span>
                  <input
                    className={inputClass("exampleVi")}
                    value={word.exampleVi}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...(word as ReviewWord), exampleVi: v };
                      setField("exampleVi", v);
                      revalidateOnChange("exampleVi", next);
                    }}
                    onBlur={() => setFieldTouched("exampleVi")}
                    placeholder="Họ cần thích nghi với tình huống."
                  />
                </label>

                {/* Last/Next Reviewed (tùy chỉnh nếu muốn chỉnh tay) */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Last reviewed at</span>
                  <input
                    className={inputClass("last_reviewed_at")}
                    value={word.last_reviewed_at || ""}
                    onChange={(e) => setField("last_reviewed_at", e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm:ss"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Next review at</span>
                  <input
                    className={inputClass("next_review_at")}
                    value={word.next_review_at || ""}
                    onChange={(e) => setField("next_review_at", e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm:ss"
                  />
                </label>
              </div>
            </div>

            <div className="h-px bg-neutral-200" />

            {/* Example (only one) */}
            <div className="space-y-4">
              <h3 className="text-base font-medium">Example</h3>

              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* sentence_en */}
                  <label className="flex flex-col gap-1" data-field="examples.0.sentence_en">
                    <span className="text-sm font-medium">
                      Sentence EN <span className="text-red-600">*</span>
                    </span>
                    <input
                      className={inputClass("examples.0.sentence_en")}
                      value={word.examples?.[0]?.sentence_en || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExampleField(0, "sentence_en", val);
                        setExerciseField(0, 0, "question_text", val); // sync
                        const next = { ...(word as ReviewWord) };
                        next.examples = [...word.examples];
                        next.examples[0] = { ...word.examples[0], sentence_en: val } as any;
                        revalidateOnChange("examples.0.sentence_en", next);
                      }}
                      onBlur={() => setFieldTouched("examples.0.sentence_en")}
                      placeholder="They need to ____ the situation carefully."
                      aria-invalid={hasError("examples.0.sentence_en")}
                      aria-describedby={
                        hasError("examples.0.sentence_en")
                          ? helpId("examples.0.sentence_en")
                          : undefined
                      }
                    />
                    {hasError("examples.0.sentence_en") && (
                      <span id={helpId("examples.0.sentence_en")} className="text-xs text-red-600">
                        {errors["examples.0.sentence_en"]}
                      </span>
                    )}
                  </label>

                  {/* sentence_vi */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Sentence VI</span>
                    <input
                      className={inputClass("examples.0.sentence_vi")}
                      value={word.examples?.[0]?.sentence_vi || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExampleField(0, "sentence_vi", v);
                        const next = { ...(word as ReviewWord) };
                        next.examples = [...word.examples];
                        next.examples[0] = { ...word.examples[0], sentence_vi: v } as any;
                        revalidateOnChange("examples.0.sentence_vi", next);
                      }}
                      onBlur={() => setFieldTouched("examples.0.sentence_vi")}
                      placeholder="Họ cần thích nghi với tình huống một cách cẩn thận."
                    />
                  </label>
                </div>

                {/* Exercise (only one) */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Exercise</h4>
                    <span className="text-xs text-neutral-500">1 question</span>
                  </div>

                  <div className="rounded-xl border border-neutral-200 p-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Answer explanation</span>
                      <textarea
                        className={inputClass("examples.0.exercises.0.answer_explanation") + " min-h-24 resize-y"}
                        value={word.examples?.[0]?.exercises?.[0]?.answer_explanation || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExerciseField(0, 0, "answer_explanation", v);
                          const next = { ...(word as ReviewWord) };
                          next.examples = [...word.examples];
                          next.examples[0] = { ...word.examples[0] } as any;
                          next.examples[0].exercises = [...word.examples[0].exercises];
                          next.examples[0].exercises[0] = {
                            ...word.examples[0].exercises[0],
                            answer_explanation: v,
                          } as any;
                          revalidateOnChange("examples.0.exercises.0.answer_explanation", next);
                        }}
                        onBlur={() => setFieldTouched("examples.0.exercises.0.answer_explanation")}
                        placeholder="'Adapt' means thích nghi in English."
                      />
                    </label>

                    {/* Choice (only one correct) */}
                    <div className="mt-4 space-y-2">
                      <h5 className="text-sm font-medium">Choice (Correct Answer)</h5>
                      <div
                        className="flex items-center gap-2"
                        data-field="examples.0.exercises.0.choices.0.content"
                      >
                        <input
                          className={inputClass("examples.0.exercises.0.choices.0.content")}
                          placeholder="Correct answer"
                          value={word.examples?.[0]?.exercises?.[0]?.choices?.[0]?.content || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setChoiceField(0, 0, 0, "content", v);
                            const next = { ...(word as ReviewWord) };
                            next.examples = [...word.examples];
                            next.examples[0] = { ...word.examples[0] } as any;
                            next.examples[0].exercises = [...word.examples[0].exercises];
                            next.examples[0].exercises[0] = {
                              ...word.examples[0].exercises[0],
                            } as any;
                            next.examples[0].exercises[0].choices = [
                              ...word.examples[0].exercises[0].choices,
                            ];
                            next.examples[0].exercises[0].choices[0] = {
                              ...word.examples[0].exercises[0].choices[0],
                              content: v,
                            } as any;
                            revalidateOnChange("examples.0.exercises.0.choices.0.content", next);
                          }}
                          onBlur={() => setFieldTouched("examples.0.exercises.0.choices.0.content")}
                          aria-invalid={hasError("examples.0.exercises.0.choices.0.content")}
                          aria-describedby={
                            hasError("examples.0.exercises.0.choices.0.content")
                              ? helpId("examples.0.exercises.0.choices.0.content")
                              : undefined
                          }
                        />
                        <label className="flex items-center gap-2 text-xs text-neutral-600 select-none">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="h-4 w-4 rounded border-neutral-300 text-neutral-800 focus:ring-0"
                          />
                          correct
                        </label>
                      </div>
                      {hasError("examples.0.exercises.0.choices.0.content") && (
                        <span
                          id={helpId("examples.0.exercises.0.choices.0.content")}
                          className="text-xs text-red-600"
                        >
                          {errors["examples.0.exercises.0.choices.0.content"]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                disabled={submitting}
                onClick={updateEnglishWord}
                className="inline-flex h-12 w-50 items-center justify-center gap-2 rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 hover:bg-white hover:text-black"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>

              {errors._form && <span className="ml-3 text-sm text-red-600">Error: {errors._form}</span>}
            </div>

            {serverResult && (
              <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                <pre className="max-h-64 overflow-auto text-xs leading-relaxed">
                  {JSON.stringify(serverResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
