import  { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BiLogOutCircle } from "react-icons/bi";

export interface ReviewWord {
  word: string;
  ipa?: string;
  meaning_vi: string;
  cefr_level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  context_vi: string;
  exampleEn: string;
  exampleVi: string;
  examples: {
    sentence_en: string; // sync with question_text
    sentence_vi: string;
    exercises: {
      question_text: string; // synced from sentence_en
      answer_explanation?: string;
      choices: {
        content: string;
        is_correct: 1; // only 1 correct answer
      }[];
    }[];
  }[];
}

type ErrorMap = Record<string, string>;
type TouchedMap = Record<string, boolean>;

export default function AddEnglishWord() {
  const navigate = useNavigate();
  const [word, setWord] = useState<ReviewWord>({
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
  });

  const [submitting, setSubmitting] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);

  // Inline field errors + touched
  const [errors, setErrors] = useState<ErrorMap>({});
  const [touched, setTouched] = useState<TouchedMap>({});

  // ------- helpers to set nested fields (kept from your structure) -------
  const setField = (field: keyof ReviewWord, value: any) =>
    setWord((prev) => ({ ...prev, [field]: value }));

  const setExampleField = (
    exIdx: number,
    field: keyof ReviewWord["examples"][number],
    value: any
  ) => {
    setWord((prev) => {
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
      const examples = [...(prev.examples || [])];
      const exercises = [...(examples[exIdx].exercises || [])];
      const choices = [...(exercises[exrIdx].choices || [])];
      (choices[chIdx] as any)[field] = value;
      exercises[exrIdx].choices = choices;
      examples[exIdx].exercises = exercises;
      return { ...prev, examples };
    });
  };

  // ------- validation -------
  const validateAll = useCallback((w: ReviewWord): ErrorMap => {
    const errs: ErrorMap = {};
    const ex0 = w.examples?.[0];
    const exr0 = ex0?.exercises?.[0];
    const ch0 = exr0?.choices?.[0];

    if (!w.word?.trim()) errs["word"] = "Required";
    if (!w.meaning_vi?.trim()) errs["meaning_vi"] = "Required";
    if (!ex0?.sentence_en?.trim()) errs["examples.0.sentence_en"] = "Required";
    if (!ch0?.content?.trim()) errs["examples.0.exercises.0.choices.0.content"] = "Required";

    return errs;
  }, []);

  const setFieldTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const hasError = (key: string) => !!errors[key] && touched[key];

  const inputClass = (key: string) =>
    `block w-full rounded-xl border px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus:ring-4 transition ${
      hasError(key)
        ? "border-red-500 ring-red-200"
        : "border-neutral-300 bg-slate-50 focus:ring-black/10 focus:border-neutral-800"
    }`;

  const helpId = (key: string) => `${key.replace(/\./g, "-")}-error`;

  // Revalidate a single field on change if it already has an error or is touched
  const revalidateOnChange = (key: string, next: ReviewWord) => {
    if (touched[key] || errors[key]) {
      const all = validateAll(next);
      setErrors((prev) => ({ ...prev, [key]: all[key] }));
    }
  };

  // ------- submit -------
  async function addEnglishWord() {
    setSubmitting(true);
    setServerResult(null);

    const allErrors = validateAll(word);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // mark all these fields as touched so messages show up
      const touchedAll: TouchedMap = { ...touched };
      Object.keys(allErrors).forEach((k) => (touchedAll[k] = true));
      console.log("Validation errors:", allErrors);
      setTouched(touchedAll);

      // scroll to first error field if possible
      const firstKey = Object.keys(allErrors)[0];
      if (typeof window !== "undefined") {
        const el = document.querySelector(`[data-field="${firstKey}"]`);
        if (el && "scrollIntoView" in el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setSubmitting(false);
      return;
    }

    // sync question_text = sentence_en
    const ex0 = word.examples?.[0];
    const syncedQuestion = ex0.sentence_en.trim();

    const payload = {
      words: [
        {
          word: word.word.trim(),
          ipa: word.ipa?.trim() || "",
          meaning_vi: word.meaning_vi.trim(),
          cefr_level: word.cefr_level || null,
          level: 1,
          context_vi: word.context_vi?.trim() || "",
          exampleEn: word.exampleEn?.trim() || "",
          exampleVi: word.exampleVi?.trim() || "",
          examples: [
            {
              sentence_en: ex0.sentence_en.trim(),
              sentence_vi: ex0.sentence_vi?.trim() || "",
              exercises: [
                {
                  question_text: syncedQuestion,
                  answer_explanation: ex0.exercises?.[0]?.answer_explanation?.trim() || "",
                  choices: [
                    {
                      content: ex0.exercises?.[0]?.choices?.[0]?.content?.trim() || "",
                      is_correct: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
// Log dữ liệu trước khi gửi xuống backend
console.log("Payload to send:", payload);

    try {
       const token = localStorage.getItem('token');

    const res = await fetch('/api/en/practice/addWord', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // nếu gọi từ client cần auth
      },
      body: JSON.stringify(payload),
    });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setServerResult(data);
    } catch (e: any) {
      // show a small toast-like banner; inline errors already handled above
      setErrors((prev) => ({ ...prev, _form: e.message || "Submit error" }));
    } finally {
      setSubmitting(false);
    }
  }

  // ===================== UI =====================
  return (
    <div>
      <div className="mx-auto w-full  px-4 py-8">
        <header className="mb-6 relative">
  <button
    onClick={() => navigate("/en/home")}
    className="absolute left-0 top-1 flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
    title="Về trang EN"
    aria-label="Về trang EN"
  >
    <BiLogOutCircle className="text-gray-700 text-3xl" />
  </button>

  <h2 className="text-2xl font-semibold tracking-tight text-center">
    Add New English Word
  </h2>
  <p className="mt-1 text-sm text-neutral-600 text-center">
    Fields marked with <span className="text-red-600">*</span> are required.
  </p>
</header>


        {errors._form && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
                  <span className="text-sm font-medium">Word <span className="text-red-600">*</span></span>
                  <input
                    className={inputClass("word")}
                    value={word.word}
                    onChange={(e) => {
                      const v = e.target.value;
                      setField("word", v);
                      revalidateOnChange("word", { ...word, word: v });
                    }}
                    onBlur={() => setFieldTouched("word")}
                    placeholder="e.g. adapt"
                    aria-invalid={hasError("word")}
                    aria-describedby={hasError("word") ? helpId("word") : undefined}
                  />
                  {hasError("word") && (
                    <span id={helpId("word")} className="text-xs text-red-600">{errors.word}</span>
                  )}
                </label>

                {/* IPA */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">IPA</span>
                  <input
                    className={inputClass("ipa")}
                    value={word.ipa}
                    onChange={(e) => {
                      const v = e.target.value;
                      setField("ipa", v);
                      revalidateOnChange("ipa", { ...word, ipa: v });
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
                    value={word.cefr_level}
                    onChange={(e) => {
                      const v = e.target.value as ReviewWord["cefr_level"];
                      setField("cefr_level", v);
                      revalidateOnChange("cefr_level", { ...word, cefr_level: v });
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

                <div className="hidden md:block" />

                {/* Meaning VI */}
                <label className="md:col-span-2 flex flex-col gap-1" data-field="meaning_vi">
                  <span className="text-sm font-medium">Meaning VI <span className="text-red-600">*</span></span>
                  <input
                    className={inputClass("meaning_vi")}
                    value={word.meaning_vi}
                    onChange={(e) => {
                      const v = e.target.value;
                      setField("meaning_vi", v);
                      revalidateOnChange("meaning_vi", { ...word, meaning_vi: v });
                    }}
                    onBlur={() => setFieldTouched("meaning_vi")}
                    placeholder="thích nghi"
                    aria-invalid={hasError("meaning_vi")}
                    aria-describedby={hasError("meaning_vi") ? helpId("meaning_vi") : undefined}
                  />
                  {hasError("meaning_vi") && (
                    <span id={helpId("meaning_vi")} className="text-xs text-red-600">{errors["meaning_vi"]}</span>
                  )}
                </label>

                {/* Context VI */}
                <label className="md:col-span-2 flex flex-col gap-1">
                  <span className="text-sm font-medium">Context VI</span>
                  <textarea
                    className={inputClass("context_vi") + " min-h-24 resize-y"}
                    value={word.context_vi}
                    onChange={(e) => {
                      const v = e.target.value;
                      setField("context_vi", v);
                      revalidateOnChange("context_vi", { ...word, context_vi: v });
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
                      setField("exampleEn", v);
                      revalidateOnChange("exampleEn", { ...word, exampleEn: v });
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
                      setField("exampleVi", v);
                      revalidateOnChange("exampleVi", { ...word, exampleVi: v });
                    }}
                    onBlur={() => setFieldTouched("exampleVi")}
                    placeholder="Họ cần thích nghi với tình huống."
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
                    <span className="text-sm font-medium">Sentence EN <span className="text-red-600">*</span></span>
                    <input
                      className={inputClass("examples.0.sentence_en")}
                      value={word.examples?.[0]?.sentence_en || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExampleField(0, "sentence_en", val);
                        setExerciseField(0, 0, "question_text", val); // sync
                        const next = { ...word } as ReviewWord;
                        next.examples = [...word.examples];
                        next.examples[0] = { ...word.examples[0], sentence_en: val } as any;
                        revalidateOnChange("examples.0.sentence_en", next);
                      }}
                      onBlur={() => setFieldTouched("examples.0.sentence_en")}
                      placeholder="They need to ____ to the situation carefully."
                      aria-invalid={hasError("examples.0.sentence_en")}
                      aria-describedby={hasError("examples.0.sentence_en") ? helpId("examples.0.sentence_en") : undefined}
                    />
                    {hasError("examples.0.sentence_en") && (
                      <span id={helpId("examples.0.sentence_en")} className="text-xs text-red-600">{errors["examples.0.sentence_en"]}</span>
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
                        const next = { ...word } as ReviewWord;
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
                          const next = { ...word } as ReviewWord;
                          next.examples = [...word.examples];
                          next.examples[0] = { ...word.examples[0] } as any;
                          next.examples[0].exercises = [...word.examples[0].exercises];
                          next.examples[0].exercises[0] = { ...word.examples[0].exercises[0], answer_explanation: v } as any;
                          revalidateOnChange("examples.0.exercises.0.answer_explanation", next);
                        }}
                        onBlur={() => setFieldTouched("examples.0.exercises.0.answer_explanation")}
                        placeholder="'Adapt' means thích nghi in English."
                      />
                    </label>

                    {/* Choice (only one correct) */}
                    <div className="mt-4 space-y-2">
                      <h5 className="text-sm font-medium">Choice (Correct Answer)</h5>
                      <div className="flex items-center gap-2" data-field="examples.0.exercises.0.choices.0.content">
                        <input
                          className={inputClass("examples.0.exercises.0.choices.0.content")}
                          placeholder="Correct answer"
                          value={word.examples?.[0]?.exercises?.[0]?.choices?.[0]?.content || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setChoiceField(0, 0, 0, "content", v);
                            const next = { ...word } as ReviewWord;
                            next.examples = [...word.examples];
                            next.examples[0] = { ...word.examples[0] } as any;
                            next.examples[0].exercises = [...word.examples[0].exercises];
                            next.examples[0].exercises[0] = { ...word.examples[0].exercises[0] } as any;
                            next.examples[0].exercises[0].choices = [...word.examples[0].exercises[0].choices];
                            next.examples[0].exercises[0].choices[0] = { ...word.examples[0].exercises[0].choices[0], content: v } as any;
                            revalidateOnChange("examples.0.exercises.0.choices.0.content", next);
                          }}
                          onBlur={() => setFieldTouched("examples.0.exercises.0.choices.0.content")}
                          aria-invalid={hasError("examples.0.exercises.0.choices.0.content")}
                          aria-describedby={hasError("examples.0.exercises.0.choices.0.content") ? helpId("examples.0.exercises.0.choices.0.content") : undefined}
                        />
                        <label className="flex items-center gap-2 text-xs text-neutral-600 select-none">
                          <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-neutral-300 text-neutral-800 focus:ring-0" />
                          correct
                        </label>
                      </div>
                      {hasError("examples.0.exercises.0.choices.0.content") && (
                        <span id={helpId("examples.0.exercises.0.choices.0.content")} className="text-xs text-red-600">{errors["examples.0.exercises.0.choices.0.content"]}</span>
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
                onClick={addEnglishWord}
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

              {/* global, non-field error echo (optional) */}
              {errors._form && (
                <span className="text-sm text-red-600">Error: {errors._form}</span>
              )}
            </div>

            {serverResult && (
              <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
                <pre className="max-h-64 overflow-auto text-xs leading-relaxed">{JSON.stringify(serverResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}