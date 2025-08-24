import { create } from 'zustand';

export type QuizType = 'multiple' | 'fillInBlank' |  'voicePractice'|'multipleSentence' ;

export interface ReviewWord {
  id: number;
  user_id: number;
  word: string;
  ipa?: string;
  meaning_vi: string;
  cefr_level?: string; // A1–C2
  level?: number;
  last_reviewed_at?: string;
  next_review_at?: string;
  context_vi: string;
  exampleEn:string;
  exampleVi:string;
  examples?: {
    id: number;
    en_word_id: number;
    sentence_en: string;
    sentence_vi: string;
    exercises?: {
      id: number;
      example_id: number;
      question_text: string;
      blank_position: number;
      answer_explanation?: string;
      choices?: {
        id: number;
        content: string;
        is_correct: number;
      }[];
    }[];

  }[];
}


interface ReviewedWordLog {
  word: ReviewWord;
  firstFailed: boolean;
  reviewedAt: string;
}

interface ReviewWordState {
  word: ReviewWord;
  hasFailed: boolean;
}

interface PracticeSessionStore {
  words: ReviewWordState[];
  reviewedWords: ReviewedWordLog[];
  currentWord: ReviewWordState | null;
  previousType: QuizType | null;
  totalCount: number;
  completedCount: number;

  setWords: (words: ReviewWord[]) => void;
  markAnswer: (isCorrect: boolean) => void;
  removeCurrentWord: () => void;
  getNextQuizType: () => QuizType | null;
  resetSession: () => void;
  submitReviewedWords: () => Promise<void>;
}

export const usePracticeSession = create<PracticeSessionStore>((set, get) => ({
  words: [],
  currentWord: null,
  reviewedWords: JSON.parse(localStorage.getItem('reviewed_words_english') || '[]'),
  previousType: null,
  totalCount: 0,
  completedCount: 0,

  setWords: (words) => {
    const stateList = words.map(w => ({ word: w, hasFailed: false }));
    const randomIndex = Math.floor(Math.random() * stateList.length);
    const current = stateList.splice(randomIndex, 1)[0];
    localStorage.setItem('practice_active', 'true');
    localStorage.setItem('reviewed_words_english', '[]');

    set({
      words: stateList,
      currentWord: current,
      reviewedWords: [],
      totalCount: words.length,
      completedCount: 0,
    });
  },

  markAnswer: (isCorrect) => {
    const { currentWord, words, reviewedWords, completedCount } = get();
    if (!currentWord) return;

    const updatedCurrent = { ...currentWord };
    if (!isCorrect && !updatedCurrent.hasFailed) {
      updatedCurrent.hasFailed = true;
    }

    const alreadyReviewed = reviewedWords.find(r => r.word.id === updatedCurrent.word.id);
    if (!alreadyReviewed) {
      const newLog: ReviewedWordLog = {
        word: updatedCurrent.word,
        firstFailed: !isCorrect,
        reviewedAt: new Date().toISOString(),
      };

      const updatedLogs = [...reviewedWords, newLog];
      localStorage.setItem('reviewed_words_english', JSON.stringify(updatedLogs));

      if (updatedLogs.length === 1) {
        localStorage.setItem('practice_active', 'true');
      }

      set({ reviewedWords: updatedLogs });
    }

    if (!isCorrect) {
      set({ words: [...words, updatedCurrent], currentWord: updatedCurrent });
    } else if (!alreadyReviewed) {
      set({ completedCount: completedCount + 1 });
    }
  },

  removeCurrentWord: () => {
    const { words } = get();
    if (words.length === 0) {
      set({ currentWord: null });
      return;
    }
    const randomIndex = Math.floor(Math.random() * words.length);
    const nextWord = words[randomIndex];
    const updated = words.filter((_, idx) => idx !== randomIndex);
    set({ words: updated, currentWord: nextWord });
  },

  getNextQuizType: () => {
    const { previousType } = get();
    const all: QuizType[] = [
      'multiple',
      'voicePractice',
      'multipleSentence',
      'fillInBlank',
 
    ];
    const filtered = all.filter(type => type !== previousType);
    const next = filtered[Math.floor(Math.random() * filtered.length)];

    set({ previousType: next });
    return next;
  },

  resetSession: () => {
    set({
      words: [],
      currentWord: null,
      reviewedWords: [],
      previousType: null,
      totalCount: 0,
      completedCount: 0,
    });
    localStorage.removeItem('practice_active');
    localStorage.removeItem('reviewed_words_english');
  },
submitReviewedWords: async () => {
  const { reviewedWords, resetSession } = get();
  if (reviewedWords.length === 0) {
    console.warn('Không có từ đã luyện để gửi.');
    return;
  }

  // Chỉ giữ lại word.id và các trường cần thiết
  const minimalData = reviewedWords.map(item => ({
    word: { id: item.word.id },
    firstFailed: !!item.firstFailed,
    reviewedAt: item.reviewedAt || new Date().toISOString()
  }));

  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/en/practice/reviewed-words', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // nếu gọi từ client cần auth
      },
      body: JSON.stringify({ reviewedWords: minimalData }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Lỗi khi gửi: ${err}`);
    }

    const data = await res.json();
    console.log('Đã cập nhật lịch sử ôn tập:', data);
    resetSession();
  } catch (err) {
    console.error('Lỗi khi gọi API reviewed-words:', err);
  }
}

}));
