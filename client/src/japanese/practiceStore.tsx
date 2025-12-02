import { create } from 'zustand';
import { canStrokeWordCN } from './strokeData';

export type QuizType = 'multiple' | 'hiraganaPractice' | 'romajiPractice' | 'voicePractice' | 'multiCharStrokePractice';
export type QuizType_withoutStroke = 'multiple' | 'hiraganaPractice' | 'romajiPractice' | 'voicePractice' ;

// Có ÍT NHẤT 1 ký tự Kanji (mọi extension, mọi mặt phẳng)
export const containsKanjiStrict = (s: string): boolean =>
  /\p{Script=Han}/u.test(s);

// TẤT CẢ ký tự đều là Kanji (nếu bạn muốn ràng buộc khắt khe hơn)
export const allKanjiStrict = (s: string): boolean => {
  const t = (s ?? '').normalize('NFKC').trim();
  if (!t) return false;
  // Không cho phép kana/latin… → chỉ Han hoặc khoảng trắng
  return [...t].every(ch => /\p{Script=Han}/u.test(ch));
};

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
  isGettingNextType: boolean; // Lock để tránh gọi đồng thời
  isNavigating: boolean; // Lock để đảm bảo chỉ một navigation được thực hiện

  setWords: (words: ReviewWord[]) => void;
  markAnswer: (isCorrect: boolean) => void;
  removeCurrentWord: () => void;
  getNextQuizType: (word?: ReviewWordState | null, skipLock?: boolean, excludeType?: QuizType | null) => Promise<QuizType | null>;
  navigateToQuiz: (navigate: (path: string, state?: any) => void, newQuizType: QuizType, oldQuizType?: QuizType | null, onComplete?: () => void) => Promise<void>;
  continueToNextQuiz: (navigate: (path: string, state?: any) => void, onComplete?: () => void) => Promise<void>;
  resetSession: () => void;
  submitReviewedWords: () => Promise<void>;
}

// Hàm shuffle Fisher-Yates để xáo trộn mảng ngẫu nhiên
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const usePracticeSession = create<PracticeSessionStore>((set, get) => ({
  words: [],
  currentWord: null,
  reviewedWords: JSON.parse(localStorage.getItem('reviewed_words') || '[]'),
  previousType: null,
  totalCount: 0,
  completedCount: 0,
  isGettingNextType: false,
  isNavigating: false,

  setWords: (words) => {
    // Shuffle toàn bộ danh sách trước khi chọn từ đầu tiên
    const stateList = shuffleArray(words.map(w => ({ word: w, hasFailed: false })));
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
      // Thêm từ sai vào lại mảng và shuffle để đảm bảo ngẫu nhiên
      const updatedWords = shuffleArray([...words, updatedCurrent]);
      set({ words: updatedWords, currentWord: updatedCurrent });
    } else {
      // Trả lời đúng: xóa từ khỏi pool (không thêm lại vào words)
      // Chỉ cập nhật currentWord, từ sẽ bị xóa khi gọi removeCurrentWord
      if (!alreadyReviewed) {
        set({ completedCount: completedCount + 1, currentWord: updatedCurrent });
      } else {
        set({ currentWord: updatedCurrent });
      }
    }
  },

  removeCurrentWord: () => {
    const { words } = get();
    
    // Xóa từ hiện tại khỏi pool (không giữ lại)
    // Nếu hết từ, set currentWord = null
    if (words.length === 0) {
      set({ currentWord: null });
      return;
    }
    
    // Chọn từ tiếp theo ngẫu nhiên từ words (đã không bao gồm từ vừa trả lời đúng)
    const randomIndex = Math.floor(Math.random() * words.length);
    const nextWord = words[randomIndex];
    const updated = words.filter((_, idx) => idx !== randomIndex);
    set({ words: updated, currentWord: nextWord });
  },

  getNextQuizType: async (word?: ReviewWordState | null, skipLock = false, excludeType?: QuizType | null) => {
    const { currentWord, isGettingNextType } = get();
    
    // Nếu skipLock = false và đang trong quá trình lấy type, đợi một chút rồi thử lại hoặc return null
    if (!skipLock && isGettingNextType) {
      console.warn('⚠️ [getNextQuizType] Đang được gọi, bỏ qua lần gọi này');
      // Đợi một chút để lần gọi trước hoàn thành
      await new Promise(resolve => setTimeout(resolve, 100));
      const { isGettingNextType: stillGetting } = get();
      if (stillGetting) {
        return null;
      }
    }

    // Chỉ set lock nếu skipLock = false (tức là được gọi độc lập, không từ continueToNextQuiz)
    if (!skipLock) {
      set({ isGettingNextType: true });
    }

    try {
      // Đọc previousType từ state mới nhất, không dùng từ closure
      const { previousType: currentPreviousType } = get();
      
      // Sử dụng word được truyền vào hoặc currentWord mặc định
      const targetWord = word ?? currentWord;
      
      if (!targetWord) {
        if (!skipLock) {
          set({ isGettingNextType: false });
        }
        return null;
      }
      
      const candidate =
        (targetWord && 'word' in targetWord)
          ? (targetWord.word?.kanji ?? '')
          : (targetWord as unknown as ReviewWord | null)?.kanji ?? '';

      if (!candidate) {
       
        if (!skipLock) {
          set({ isGettingNextType: false });
        }
        return null;
      }

      // ✅ validate chặt: có ÍT NHẤT một ký tự thuộc Script=Han
      const hasKanji = containsKanjiStrict(candidate);

      // Kiểm tra stroke data trước để quyết định pool
      let hasStrokeData = false;
      if (hasKanji) {
        hasStrokeData = await canStrokeWordCN(candidate);
      }

     

      // Nếu có stroke data → random từ QuizType (bao gồm multiCharStrokePractice)
      // Nếu không có stroke data → random từ QuizType_withoutStroke
      const allWithStroke: QuizType[] = [
        'multiple',
        'voicePractice',
        'hiraganaPractice',
        'romajiPractice',
        'multiCharStrokePractice',
      ];

      const allWithoutStroke: QuizType_withoutStroke[] = [
        'multiple',
        'voicePractice',
        'hiraganaPractice',
        'romajiPractice',
      ];

      let pool: QuizType[] = hasStrokeData ? allWithStroke : allWithoutStroke;

      // Filter cả previousType và excludeType để đảm bảo không chọn lại type cũ
      const typesToExclude = [currentPreviousType, excludeType].filter(Boolean) as QuizType[];
      pool = pool.filter(t => !typesToExclude.includes(t));

      // Nếu pool rỗng sau khi filter, thử lại với tất cả types (trừ excludeType nếu có)
      if (pool.length === 0) {
        pool = hasStrokeData ? allWithStroke : allWithoutStroke;
        // Chỉ filter excludeType, không filter previousType nữa
        if (excludeType) {
          pool = pool.filter(t => t !== excludeType);
        }
      }
      
      if (pool.length === 0) {
       
        if (!skipLock) {
          set({ previousType: null, isGettingNextType: false });
        } else {
          set({ previousType: null });
        }
        return null;
      }

      const nextType = pool[Math.floor(Math.random() * pool.length)];
      console.log('✅ [getNextQuizType] CHỌN QUIZ TYPE', {
        nextType,
        pool,
        candidate,
        previousType: currentPreviousType,
        excludeType,
        skipLock,
        timestamp: new Date().toISOString()
      });
      
      if (!skipLock) {
        set({ previousType: nextType, isGettingNextType: false });
      }
      // Khi skipLock = true, KHÔNG set previousType ở đây
      // Để continueToNextQuiz tự quản lý và set sau khi đã có oldQuizType
      return nextType;
    } catch (error) {
      console.error('❌ [getNextQuizType] LỖI', { error, timestamp: new Date().toISOString() });
      if (!skipLock) {
        set({ isGettingNextType: false });
      }
      return null;
    }
  },

  navigateToQuiz: async (navigate, newQuizType, oldQuizType, onComplete) => {
    const { isNavigating, previousType } = get();
    console.log("oldQuizType", oldQuizType , "and newQuizType", newQuizType);
    // Lấy oldQuizType từ parameter hoặc từ state
    const currentOldType = oldQuizType ?? previousType;
    
    // So sánh và chỉ navigate nếu khác nhau
    if (currentOldType === newQuizType) {
      console.warn('⚠️ [navigateToQuiz] QUIZ TYPE GIỐNG NHAU, BỎ QUA', {
        oldQuizType: currentOldType,
        newQuizType,
        timestamp: new Date().toISOString()
      });
      if (onComplete) onComplete();
      return;
    }
    
    if (isNavigating) {
      console.warn('⚠️ [navigateToQuiz] ĐÃ ĐƯỢC GỌI KHI ĐANG NAVIGATING, BỎ QUA', {
        newQuizType,
        timestamp: new Date().toISOString()
      });
      if (onComplete) onComplete();
      return;
    }
  
    // Set previousType NGAY LẬP TỨC để vô hiệu hóa các navigation khác
    // Điều này đảm bảo quiz type mới chiếm quyền navigate trước
    set({ isNavigating: true, previousType: newQuizType });
  
    console.log('🚀 [navigateToQuiz] BẮT ĐẦU', {
      oldQuizType: currentOldType,
      newQuizType,
      timestamp: new Date().toISOString()
    });
  
    try {
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã update và navigate mượt mà
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Navigate ngay lập tức sau khi DOM đã sẵn sàng
      navigate(`/jp/quiz/${newQuizType}`, {
        state: { from: newQuizType },
        replace: true
      });
  
      // Reset lock sau khi navigate để không block các lần gọi tiếp theo
      // Sử dụng requestAnimationFrame để đảm bảo navigate đã được xử lý
      await new Promise(resolve => requestAnimationFrame(resolve));
      set({ isNavigating: false, isGettingNextType: false });
  
      console.log('✅ [navigateToQuiz] HOÀN THÀNH', { newQuizType, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [navigateToQuiz] LỖI', { error, newQuizType, timestamp: new Date().toISOString() });
      set({ isNavigating: false, isGettingNextType: false });
    } finally {
      if (onComplete) onComplete();
    }
  },
  

  continueToNextQuiz: async (navigate, onComplete) => {
    // const stackTrace = new Error().stack;
    // console.log('🔵 [continueToNextQuiz] BẮT ĐẦU', {
    //   timestamp: new Date().toISOString(),
    //   stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n')
    // });
    
    const { words, isGettingNextType, isNavigating, removeCurrentWord, getNextQuizType, navigateToQuiz } = get();
    
    // Nếu đang trong quá trình xử lý hoặc đang navigate, bỏ qua
    if (isGettingNextType || isNavigating) {
      // console.warn('⚠️ [continueToNextQuiz] BỊ BLOCK - đang được gọi, bỏ qua lần gọi này', { 
      //   isGettingNextType, 
      //   isNavigating,
      //   timestamp: new Date().toISOString()
      // });
      if (onComplete) onComplete();
      return;
    }

    // Set lock - chỉ set isGettingNextType, isNavigating sẽ được set khi thực sự navigate
    // console.log('🔒 [continueToNextQuiz] SET LOCK');
    set({ isGettingNextType: true });
    
    // Đợi state update hoàn thành
    await Promise.resolve();

    try {
      // Lưu words.length và currentWord vào localStorage trước khi remove để tránh race condition
      const remainingWordsCount = words.length;
      const hasCurrentWord = !!get().currentWord;
      localStorage.setItem('practice_remainingWordsCount', String(remainingWordsCount));
      localStorage.setItem('practice_hasCurrentWord', String(hasCurrentWord));
      
      // Remove current word (xóa từ khỏi pool)
      removeCurrentWord();
      
      // Đợi state update sau removeCurrentWord hoàn thành
      await Promise.resolve();

      // Nếu hết từ, navigate đến summary
      if (remainingWordsCount <= 1) {
        // console.log('📊 [continueToNextQuiz] HẾT TỪ - navigate to summary', { remainingWordsCount });
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/jp/summary');
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 50));
        set({ isGettingNextType: false, isNavigating: false });
        if (onComplete) onComplete();
        return;
      }

      // Lấy từ tiếp theo sau khi remove
      const { currentWord: nextWord } = get();
      if (!nextWord) {
        // console.log('📊 [continueToNextQuiz] KHÔNG CÓ TỪ TIẾP THEO - navigate to summary', { remainingWordsCount });
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/jp/summary');
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 50));
        set({ isGettingNextType: false, isNavigating: false });
        if (onComplete) onComplete();
        return;
      }

      // Lưu previousType cũ trước khi reset để so sánh và exclude
      const { previousType: oldQuizType } = get();
      
      // Reset previousType trước khi gọi getNextQuizType để tránh dùng giá trị cũ
      set({ previousType: null });
      await Promise.resolve();
      
      // Gọi getNextQuizType với từ tiếp theo - ĐỢI HOÀN THÀNH
      // skipLock = true vì continueToNextQuiz đã quản lý lock rồi
      // Truyền oldQuizType vào excludeType để đảm bảo không chọn lại type cũ
      // console.log('🔄 [continueToNextQuiz] GỌI getNextQuizType', {
      //   nextWord: nextWord.word?.kanji,
      //   oldQuizType,
      //   timestamp: new Date().toISOString()
      // });
      const nextType = await getNextQuizType(nextWord, true, oldQuizType);
      
      // Kiểm tra lại lock sau khi getNextQuizType hoàn thành
      const { isGettingNextType: stillLocked, isNavigating: stillNavigating } = get();
      if (!stillLocked || stillNavigating) {
        // console.warn('⚠️ [continueToNextQuiz] LOCK ĐÃ BỊ MỞ HOẶC ĐANG NAVIGATE SAU getNextQuizType - bỏ qua navigate', {
        //   stillLocked,
        //   stillNavigating,
        //   nextType,
        //   timestamp: new Date().toISOString()
        // });
        set({ isGettingNextType: false });
        if (onComplete) onComplete();
        return;
      }

      // Nếu không có quiz type hợp lệ, navigate đến summary
      if (!nextType) {
        console.log('📊 [continueToNextQuiz] KHÔNG CÓ QUIZ TYPE - navigate to summary', {
          nextWord: nextWord.word?.kanji,
          timestamp: new Date().toISOString()
        });
        set({ previousType: null });
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/jp/summary');
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 50));
        set({ isGettingNextType: false, isNavigating: false });
        if (onComplete) onComplete();
        return;
      }

      console.log('✅ [continueToNextQuiz] ĐÃ LẤY ĐƯỢC QUIZ TYPE', {
        oldQuizType,
        nextType,
        nextWord: nextWord.word?.kanji,
        timestamp: new Date().toISOString()
      });

      // Navigate đến quiz type đã chọn NGAY LẬP TỨC sau khi có QuizType mới
      // navigateToQuiz sẽ tự set previousType để vô hiệu hóa các navigation khác
      // Truyền oldQuizType để so sánh và chỉ navigate nếu khác nhau
      await navigateToQuiz(navigate, nextType, oldQuizType, () => {
        console.log('✅ [continueToNextQuiz] HOÀN THÀNH', { nextType, timestamp: new Date().toISOString() });
        set({ isGettingNextType: false, isNavigating: false });
        if (onComplete) onComplete();
      });
    } catch (error) {
      console.error('❌ [continueToNextQuiz] LỖI', { error, timestamp: new Date().toISOString() });
      set({ isGettingNextType: false, isNavigating: false });
      await Promise.resolve();
      if (onComplete) onComplete();
    }
  },


  resetSession: () => {
    set({
      words: [],
      currentWord: null,
      reviewedWords: [],
      previousType: null,
      totalCount: 0,
      completedCount: 0,
      isGettingNextType: false,
      isNavigating: false,
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
