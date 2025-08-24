import { create } from 'zustand';

export type QuizType = 'multiple' | 'hiraganaPractice' | 'romajiPractice' | 'voicePractice' | 'multiCharStrokePractice';

export interface ReviewWord {
  id: number;
  kanji: string;
  reading_hiragana: string;
  reading_romaji: string;
  meaning_vi: string;
  hanviet?: string;
  hanviet_explanation?: string;
  example?: string;
  example_romaji?: string;
  example_vi?: string;
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
  reviewedWords: JSON.parse(localStorage.getItem('reviewed_words') || '[]'),
  previousType: null,
  totalCount: 0,
  completedCount: 0,

  setWords: (words) => {
    const stateList = words.map(w => ({ word: w, hasFailed: false }));
    const randomIndex = Math.floor(Math.random() * stateList.length);
    const current = stateList.splice(randomIndex, 1)[0];
    localStorage.setItem('practice_active', 'true');
    localStorage.setItem('reviewed_words', '[]');

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
      localStorage.setItem('reviewed_words', JSON.stringify(updatedLogs));

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

      'hiraganaPractice',
      'romajiPractice',
      'multiCharStrokePractice',
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
    localStorage.removeItem('reviewed_words');
  },

  submitReviewedWords: async () => {
    const { reviewedWords, resetSession } = get();
    if (reviewedWords.length === 0) {
      console.warn('Không có từ đã luyện để gửi.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('/api/practice/reviewed-words', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reviewedWords }),
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
  },
}));
