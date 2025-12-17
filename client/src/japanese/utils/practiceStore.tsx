import { create } from 'zustand';

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

export interface PracticeScenario {
  order: number;
  word: {
    id: number;
    kanji: string;
    reading_hiragana: string | null;
    reading_romaji: string | null;
    meaning_vi: string | null;
    examples: {
      sentence_jp: string;
      sentence_romaji: string;
      sentence_vi: string;
    }[];
    hanviet: {
      han_viet: string;
      explanation: string;
    } | null;
  };
  quizType: string | null;
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
  
  // Scenarios từ API
  scenarios: PracticeScenario[];
  currentScenarioIndex: number;
  completedWordIds: Set<number>; // Track những từ đã trả lời đúng
  randomAnswers: Array<{ meaning_vi: string }>; // Mảng 50 từ ngẫu nhiên để làm đáp án sai

  setWords: (words: ReviewWord[]) => void;
  setScenarios: (scenarios: PracticeScenario[]) => void;
  setRandomAnswers: (randomAnswers: Array<{ meaning_vi: string }>) => void;
  markAnswer: (isCorrect: boolean) => void;
  removeCurrentWord: () => void;
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
  scenarios: [],
  currentScenarioIndex: 0,
  completedWordIds: new Set<number>(),
  randomAnswers: [],

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

  setScenarios: (scenarios) => {
    if (scenarios.length === 0) {
      set({
        scenarios: [],
        currentScenarioIndex: 0,
        currentWord: null,
        totalCount: 0,
        completedCount: 0,
      });
      return;
    }

    // Convert scenario đầu tiên thành ReviewWordState
    const firstScenario = scenarios[0];
    const firstWord: ReviewWord = {
      id: firstScenario.word.id,
      kanji: firstScenario.word.kanji,
      reading_hiragana: firstScenario.word.reading_hiragana || '',
      reading_romaji: firstScenario.word.reading_romaji || '',
      meaning_vi: firstScenario.word.meaning_vi || '',
      hanviet: firstScenario.word.hanviet?.han_viet,
      hanviet_explanation: firstScenario.word.hanviet?.explanation,
      example: firstScenario.word.examples?.[0]?.sentence_jp,
      example_romaji: firstScenario.word.examples?.[0]?.sentence_romaji,
      example_vi: firstScenario.word.examples?.[0]?.sentence_vi,
    };

    localStorage.setItem('practice_active', 'true');
    localStorage.setItem('reviewed_words', '[]');

    set({
      scenarios,
      currentScenarioIndex: 0,
      currentWord: { word: firstWord, hasFailed: false },
      reviewedWords: [],
      totalCount: scenarios.length,
      completedCount: 0,
      previousType: null,
      completedWordIds: new Set<number>(),
    });
  },

  setRandomAnswers: (randomAnswers) => {
    set({ randomAnswers });
  },

  markAnswer: (isCorrect) => {
    const { currentWord, words, reviewedWords, completedCount, scenarios, completedWordIds } = get();
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

    // Nếu có scenarios, xử lý theo logic mới
    if (scenarios.length > 0) {
      if (isCorrect) {
        // Trả lời đúng: đánh dấu từ đã hoàn thành
        const newCompletedIds = new Set(completedWordIds);
        newCompletedIds.add(currentWord.word.id);
        set({ 
          completedWordIds: newCompletedIds,
          completedCount: completedCount + 1,
          currentWord: updatedCurrent 
        });
        
        // Console log list còn lại
        const remainingScenarios = scenarios.filter(s => !newCompletedIds.has(s.word.id));
        console.log('📋 [markAnswer] LIST SCENARIOS CÒN LẠI (sau khi trả lời đúng):', {
          total: scenarios.length,
          completed: newCompletedIds.size,
          remaining: remainingScenarios.length,
          remainingList: remainingScenarios.map(s => ({
            order: s.order,
            wordId: s.word.id,
            kanji: s.word.kanji,
            quizType: s.quizType
          }))
        });
      } else {
        // Trả lời sai: đẩy xuống cuối và đổi quizType
        const currentWordId = currentWord.word.id;
        const scenarioIndex = scenarios.findIndex(s => s.word.id === currentWordId);
        
        if (scenarioIndex !== -1) {
          const updatedScenarios = [...scenarios];
          const currentScenario = updatedScenarios[scenarioIndex];
          
          // Đổi quizType thành một trong: multiple, romajiPractice, voicePractice
          // Đảm bảo không trùng với quizType cũ
          const availableQuizTypes: QuizType[] = ['multiple', 'romajiPractice', 'voicePractice'];
          const oldQuizType = currentScenario.quizType;
          const filteredQuizTypes = availableQuizTypes.filter(type => type !== oldQuizType);
          
          // Nếu tất cả 3 loại đều trùng (không xảy ra), fallback về danh sách gốc
          const newQuizTypes = filteredQuizTypes.length > 0 ? filteredQuizTypes : availableQuizTypes;
          const randomQuizType = newQuizTypes[Math.floor(Math.random() * newQuizTypes.length)];
          
          // Xóa scenario hiện tại
          updatedScenarios.splice(scenarioIndex, 1);
          
          // Tìm order lớn nhất hiện tại
          const maxOrder = updatedScenarios.length > 0 
            ? Math.max(...updatedScenarios.map(s => s.order))
            : 0;
          
          // Thêm vào cuối với quizType mới và order mới
          updatedScenarios.push({
            ...currentScenario,
            order: maxOrder + 1,
            quizType: randomQuizType,
          });
          
          set({ 
            scenarios: updatedScenarios,
            currentWord: updatedCurrent 
          });
          
          // Console log list còn lại
          const remainingScenarios = updatedScenarios.filter(s => !completedWordIds.has(s.word.id));
          console.log('📋 [markAnswer] LIST SCENARIOS CÒN LẠI (sau khi trả lời sai):', {
            total: updatedScenarios.length,
            completed: completedWordIds.size,
            remaining: remainingScenarios.length,
            remainingList: remainingScenarios.map(s => ({
              order: s.order,
              wordId: s.word.id,
              kanji: s.word.kanji,
              quizType: s.quizType
            }))
          });
        }
      }
      return;
    }

    // Logic cũ cho words (fallback)
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

  navigateToQuiz: async (navigate, newQuizType, oldQuizType, onComplete) => {
    const { isNavigating } = get();
    console.log("oldQuizType", oldQuizType , "and newQuizType", newQuizType);
    
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
  
    // console.log('🚀 [navigateToQuiz] BẮT ĐẦU', {
    //   oldQuizType: currentOldType,
    //   newQuizType,
    //   timestamp: new Date().toISOString()
    // });
  
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
  
      // console.log('✅ [navigateToQuiz] HOÀN THÀNH', { newQuizType, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [navigateToQuiz] LỖI', { error, newQuizType, timestamp: new Date().toISOString() });
      set({ isNavigating: false, isGettingNextType: false });
    } finally {
      if (onComplete) onComplete();
    }
  },
  

  continueToNextQuiz: async (navigate, onComplete) => {
    const { scenarios, currentScenarioIndex, isGettingNextType, isNavigating, navigateToQuiz, previousType } = get();
    
    // Nếu đang trong quá trình xử lý hoặc đang navigate, bỏ qua
    if (isGettingNextType || isNavigating) {
      if (onComplete) onComplete();
      return;
    }

    // Nếu có scenarios từ API, dùng logic mới
    if (scenarios.length > 0) {
      set({ isGettingNextType: true });
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 0));

      try {
        const { completedWordIds } = get();
        
        // Lọc ra những scenarios chưa trả lời đúng
        const remainingScenarios = scenarios.filter(s => !completedWordIds.has(s.word.id));
        
        // Console log list còn lại
        console.log('📋 [continueToNextQuiz] LIST SCENARIOS CÒN LẠI:', {
          total: scenarios.length,
          completed: completedWordIds.size,
          remaining: remainingScenarios.length,
          remainingList: remainingScenarios.map(s => ({
            order: s.order,
            wordId: s.word.id,
            kanji: s.word.kanji,
            quizType: s.quizType
          }))
        });
        
        // Nếu không còn từ nào, navigate đến summary
        if (remainingScenarios.length === 0) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 50));
          set({ isGettingNextType: false, isNavigating: false });
          await new Promise(resolve => requestAnimationFrame(resolve));
          navigate('/jp/summary');
          if (onComplete) onComplete();
          return;
        }

        // Tìm scenario tiếp theo (bỏ qua những từ đã trả lời đúng)
        let nextIndex = currentScenarioIndex + 1;
        while (nextIndex < scenarios.length && completedWordIds.has(scenarios[nextIndex].word.id)) {
          nextIndex++;
        }
        
        // Nếu không tìm thấy từ tiếp theo trong phần còn lại, tìm từ đầu
        if (nextIndex >= scenarios.length) {
          nextIndex = scenarios.findIndex(s => !completedWordIds.has(s.word.id));
        }
        
        // Nếu vẫn không tìm thấy, navigate đến summary
        if (nextIndex === -1 || nextIndex >= scenarios.length) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 50));
          set({ isGettingNextType: false, isNavigating: false });
          await new Promise(resolve => requestAnimationFrame(resolve));
          navigate('/jp/summary');
          if (onComplete) onComplete();
          return;
        }

        const nextScenario = scenarios[nextIndex];
        const nextQuizType = nextScenario.quizType as QuizType | null;
        const oldQuizType = previousType;

        // Convert scenario word thành ReviewWord
        const nextWord: ReviewWord = {
          id: nextScenario.word.id,
          kanji: nextScenario.word.kanji,
          reading_hiragana: nextScenario.word.reading_hiragana || '',
          reading_romaji: nextScenario.word.reading_romaji || '',
          meaning_vi: nextScenario.word.meaning_vi || '',
          hanviet: nextScenario.word.hanviet?.han_viet,
          hanviet_explanation: nextScenario.word.hanviet?.explanation,
          example: nextScenario.word.examples?.[0]?.sentence_jp,
          example_romaji: nextScenario.word.examples?.[0]?.sentence_romaji,
          example_vi: nextScenario.word.examples?.[0]?.sentence_vi,
        };

        // Cập nhật currentWord và index
        // completedCount chỉ tăng khi trả lời đúng, không cập nhật khi chuyển từ
        // Đảm bảo completedCount không bao giờ giảm
        set({
          currentWord: { word: nextWord, hasFailed: false },
          currentScenarioIndex: nextIndex,
          // Giữ nguyên completedCount, không cập nhật dựa trên index
          // completedCount chỉ tăng trong markAnswer khi trả lời đúng
        });

        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 0));

        // Nếu không có quiz type hợp lệ, navigate đến summary
        if (!nextQuizType) {
          console.log('📊 [continueToNextQuiz] KHÔNG CÓ QUIZ TYPE - navigate to summary', {
            nextWord: nextWord.kanji,
            timestamp: new Date().toISOString()
          });
          set({ previousType: null, isGettingNextType: false, isNavigating: false });
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 50));
          navigate('/jp/summary');
          if (onComplete) onComplete();
          return;
        }

        // console.log('✅ [continueToNextQuiz] DÙNG QUIZ TYPE TỪ SCENARIO', {
        //   oldQuizType,
        //   nextQuizType,
        //   nextWord: nextWord.kanji,
        //   order: nextScenario.order,
        //   timestamp: new Date().toISOString()
        // });

        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 0));

        // Navigate đến quiz type từ scenario
        await navigateToQuiz(navigate, nextQuizType, oldQuizType, () => {
          // console.log('✅ [continueToNextQuiz] HOÀN THÀNH', { nextQuizType, timestamp: new Date().toISOString() });
          set({ isGettingNextType: false, isNavigating: false });
          if (onComplete) onComplete();
        });
      } catch (error) {
        console.error('❌ [continueToNextQuiz] LỖI', { error, timestamp: new Date().toISOString() });
        set({ isGettingNextType: false, isNavigating: false });
        await new Promise(resolve => requestAnimationFrame(resolve));
        if (onComplete) onComplete();
      }
      return;
    }

    // Nếu không có scenarios, navigate đến summary
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 50));
    set({ isGettingNextType: false, isNavigating: false });
    await new Promise(resolve => requestAnimationFrame(resolve));
    navigate('/jp/summary');
    if (onComplete) onComplete();
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
      scenarios: [],
      currentScenarioIndex: 0,
      completedWordIds: new Set<number>(),
      randomAnswers: [],
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

      const res = await fetch('http://localhost:8000/api/jp/practice/reviewed-words', {
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
