import { create } from 'zustand';
import { API_URL } from '../../apiClient';

export type QuizType = 'multiple' | 'hiraganaPractice' | 'romajiPractice' | 'voicePractice' | 'multiCharStrokePractice';
export type QuizType_withoutStroke = 'multiple' | 'hiraganaPractice' | 'romajiPractice' | 'voicePractice';

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

export const speak = (text: string) => {
  if ('speechSynthesis' in window && text) {
    // Cancel any ongoing speech for responsiveness
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    // Attempt to select a more natural voice
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => voice.lang === 'ja-JP' && voice.name.includes('Google')) // Google's voices are usually good
      || voices.find(voice => voice.lang === 'ja-JP' && voice.name.includes('Microsoft')) // Microsoft's are also decent
      || voices.find(voice => voice.lang === 'ja-JP');

    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    // Optional: Adjust rate/pitch slightly if needed
    // utterance.rate = 0.9; // Slightly slower can be clearer
    // utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }
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
  quizType?: string;
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
  currentScenarioOrder: number | null; // Track current scenario's order
  pendingWrongAnswerReorder: boolean; // Flag to delay scenario reordering until continue
  pendingCorrectAnswerRemoval: boolean; // Flag to delay scenario removal until continue
  randomAnswers: Array<{ meaning_vi: string }>; // Mảng 50 từ ngẫu nhiên để làm đáp án sai

  // Data đã prepare (cho session tiếp theo)
  preparedScenarios: PracticeScenario[];
  preparedRandomAnswers: Array<{ meaning_vi: string }>;
  fetchPreparedData: () => Promise<void>;

  setWords: (words: ReviewWord[]) => void;
  setScenarios: (scenarios: PracticeScenario[]) => void;
  setRandomAnswers: (randomAnswers: Array<{ meaning_vi: string }>) => void;
  markAnswer: (isCorrect: boolean, quizType?: QuizType) => void;
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
  currentScenarioOrder: null,
  pendingWrongAnswerReorder: false,
  pendingCorrectAnswerRemoval: false,
  randomAnswers: [],
  preparedScenarios: [],
  preparedRandomAnswers: [],

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
    // console.log('🎯 [QUIZ TYPE] First scenario quiz type:', firstScenario.quizType);
    // console.log('📋 [QUIZ TYPE] All scenarios:', scenarios.map(s => ({
    //   order: s.order,
    //   kanji: s.word.kanji,
    //   quizType: s.quizType
    // })));

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
      currentScenarioOrder: firstScenario.order,
    });
  },

  setRandomAnswers: (randomAnswers) => {
    set({ randomAnswers });
  },

  markAnswer: (isCorrect, quizType) => {
    const { currentWord, words, reviewedWords, completedCount, scenarios } = get();
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
        quizType: quizType || get().previousType || undefined,
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
        // Trả lời đúng: CHỈ CẬP NHẬT completedCount, chưa xóa khỏi scenarios
        // Việc remove sẽ được làm trong continueToNextQuiz
        set({
          completedCount: completedCount + 1,
          currentWord: updatedCurrent,
          pendingCorrectAnswerRemoval: true // Đánh dấu cần xóa khi continue
        });
      } else {
        // Trả lời sai: CHỈ SET FLAG, chưa xóa/thêm lại
        // Việc reorder sẽ được làm trong continueToNextQuiz
        set({
          currentWord: updatedCurrent,
          pendingWrongAnswerReorder: true // Đánh dấu cần reorder khi continue
        });
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

  navigateToQuiz: async (navigate, newQuizType, _oldQuizType, onComplete) => {
    const { isNavigating } = get();
    // console.log("🔄 [QUIZ TYPE TRANSITION] oldQuizType:", oldQuizType, "→ newQuizType:", newQuizType);

    if (isNavigating) {
      // console.warn('⚠️ [navigateToQuiz] ĐÃ ĐƯỢC GỌI KHI ĐANG NAVIGATING, BỎ QUA', {
      //   newQuizType,
      //   timestamp: new Date().toISOString()
      // });
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
      // console.error('❌ [navigateToQuiz] LỖI', { error, newQuizType, timestamp: new Date().toISOString() });
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
        // If no more scenarios, go to summary
        if (scenarios.length === 0) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 50));
          set({ isGettingNextType: false, isNavigating: false });
          await new Promise(resolve => requestAnimationFrame(resolve));
          navigate('/jp/summary');
          if (onComplete) onComplete();
          return;
        }

        // Nếu có pending operations, xử lý trước khi lấy từ tiếp theo
        const { pendingWrongAnswerReorder, pendingCorrectAnswerRemoval, currentScenarioOrder: currentOrder } = get();
        let updatedScenarios = [...scenarios];

        // Xử lý trả lời đúng: Xóa scenario khỏi mảng
        if (pendingCorrectAnswerRemoval && currentOrder !== null) {
          const scenarioIndex = updatedScenarios.findIndex(s => s.order === currentOrder);

          if (scenarioIndex !== -1) {
            updatedScenarios.splice(scenarioIndex, 1); // Remove completely

            // START FIX: Check if empty after removal to redirect immediately
            if (updatedScenarios.length === 0) {
              set({
                scenarios: [],
                pendingCorrectAnswerRemoval: false,
                isGettingNextType: false,
                isNavigating: false
              });

              await new Promise(resolve => requestAnimationFrame(resolve));
              await new Promise(resolve => setTimeout(resolve, 50));
              navigate('/jp/summary');
              if (onComplete) onComplete();
              return;
            }
            // END FIX

            set({
              scenarios: updatedScenarios,
              pendingCorrectAnswerRemoval: false
            });
          }
        }

        // Xử lý trả lời sai: Reorder scenario
        if (pendingWrongAnswerReorder && currentOrder !== null) {
          const scenarioIndex = updatedScenarios.findIndex(s => s.order === currentOrder);

          if (scenarioIndex !== -1) {
            const currentScenario = updatedScenarios[scenarioIndex];

            // FIRST: Delete from current position
            updatedScenarios.splice(scenarioIndex, 1);

            // Check if current word is grammar (has is_grammar field or inferred from practice type)
            // For grammar patterns, only use 'multiple' choice
            const isGrammar = (currentScenario.word as any).is_grammar === true ||
              (currentScenario.word as any).is_grammar === 1 ||
              (currentScenario.word as any).is_grammar === '1';

            let newQuizType: QuizType;

            if (isGrammar) {
              // Grammar ALWAYS uses 'multiple' choice - no random selection needed
              newQuizType = 'multiple';
              console.log('📚 [GRAMMAR WRONG ANSWER] Forcing multiple choice quiz type');
            } else {
              // Vocabulary: pick random from all 4 types, preferably different from old type
              const availableQuizTypes: QuizType[] = ['multiple', 'romajiPractice', 'voicePractice', 'hiraganaPractice'];
              const oldQuizType = currentScenario.quizType;
              const filteredQuizTypes = availableQuizTypes.filter(type => type !== oldQuizType);
              const newQuizTypes = filteredQuizTypes.length > 0 ? filteredQuizTypes : availableQuizTypes;
              newQuizType = newQuizTypes[Math.floor(Math.random() * newQuizTypes.length)];

              console.log('📖 [VOCABULARY WRONG ANSWER] Selected quiz type:', newQuizType);
            }

            // console.log('❌ [WRONG ANSWER - QUIZ TYPE CHANGE]', {
            //   word: currentScenario.word.kanji,
            //   isGrammar,
            //   oldQuizType,
            //   newQuizType: randomQuizType,
            //   availableTypes: availableQuizTypes,
            //   filteredTypes: filteredQuizTypes
            // });

            // Tìm order lớn nhất hiện tại
            const maxOrder = updatedScenarios.length > 0
              ? Math.max(...updatedScenarios.map(s => s.order))
              : 0;

            // THEN: Add to end with new quiz type and new order
            updatedScenarios.push({
              ...currentScenario,
              order: maxOrder + 1,
              quizType: newQuizType,
            });

            // Update scenarios và reset flag
            set({
              scenarios: updatedScenarios,
              pendingWrongAnswerReorder: false
            });
          }
        }

        // Just take the next index (or wrap to 0)
        // Nếu đã xóa phần tử hiện tại (trả lời đúng), index hiện tại sẽ trỏ đến phần tử kế tiếp -> KHÔNG CỘNG 1
        // Nếu không xóa (trả lời sai -> chuyển xuống cuối), hoặc traverse bình thường -> CỘNG 1?
        // Wait, if answer wrong, we REMOVE it from current pos and PUSH to end. So current pos is now the next item.
        // So in BOTH cases (Correct Remove, Wrong Reorder), the current index now points to the "Next" item (originally at index+1).

        // TUY NHIÊN, ta cần cẩn thận vì logic reorder:
        // splice(index, 1) -> phần tử sau nó dồn lên.
        // Vậy nextIndex chính là currentScenarioIndex (kẹp giới hạn).

        let nextIndex = currentScenarioIndex;
        if (nextIndex >= updatedScenarios.length) {
          nextIndex = 0;  // Wrap around if we were at the end
        }

        const nextScenario = updatedScenarios[nextIndex];
        const nextQuizType = nextScenario.quizType as QuizType | null;
        const oldQuizType = previousType;

        // console.log('➡️ [NEXT SCENARIO]', {
        //   word: nextScenario.word.kanji,
        //   order: nextScenario.order,
        //   quizType: nextQuizType,
        //   scenarioIndex: nextIndex,
        //   totalRemaining: updatedScenarios.length
        // });

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

        // Cập nhật currentWord, index và currentScenarioOrder
        set({
          currentWord: { word: nextWord, hasFailed: false },
          currentScenarioIndex: nextIndex,
          currentScenarioOrder: nextScenario.order,
        });

        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 0));

        // Nếu không có quiz type hợp lệ, navigate đến summary
        if (!nextQuizType) {
          // console.log('📊 [continueToNextQuiz] KHÔNG CÓ QUIZ TYPE - navigate to summary', {
          //   nextWord: nextWord.kanji,
          //   timestamp: new Date().toISOString()
          // });
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
        // console.error('❌ [continueToNextQuiz] LỖI', { error, timestamp: new Date().toISOString() });
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
      currentScenarioOrder: null,
      pendingWrongAnswerReorder: false,
      pendingCorrectAnswerRemoval: false,
      randomAnswers: [],
    });
    localStorage.removeItem('practice_active');
    localStorage.removeItem('reviewed_words');
  },

  submitReviewedWords: async () => {
    const { reviewedWords, resetSession } = get();
    if (reviewedWords.length === 0) {
      // console.warn('Không có từ đã luyện để gửi.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/jp/practice/reviewed-words`, {
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

      // const data = await res.json();
      // console.log('Đã cập nhật lịch sử ôn tập:', data);
      await res.json();
      resetSession();
      // Ngay sau khi reset session, fetch data mới ngay
      await get().fetchPreparedData();
    } catch (err) {
      // console.error('Lỗi khi gọi API reviewed-words:', err);
    }
  },

  fetchPreparedData: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [scenariosRes, randomAnswersRes] = await Promise.all([
        fetch(`${API_URL}/jp/practice/scenarios`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/jp/practice/listWord`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (scenariosRes.status === 401 || randomAnswersRes.status === 401) {
        // localStorage.removeItem('token');
        // Let other components handle auth redirect
        return;
      }

      if (scenariosRes.ok) {
        const scenariosData = await scenariosRes.json();
        const scenarios: PracticeScenario[] = scenariosData.scenarios || [];
        set({ preparedScenarios: scenarios });
      }

      if (randomAnswersRes.ok) {
        const randomAnswersData = await randomAnswersRes.json();
        const allWords = (randomAnswersData.allWords || []).map((w: any) => ({
          meaning_vi: w.meaning_vi || ''
        })).filter((w: { meaning_vi: string }) => w.meaning_vi !== '');

        console.log(`📊 Fetched ${allWords.length} words for randomAnswers from API`);

        if (allWords.length === 0) {
          console.error('⚠️ API returned 0 words for randomAnswers! Check database or API endpoint.');
        }

        const shuffled = allWords.sort(() => Math.random() - 0.5);
        // Take up to 50 words, or all if less than 50
        const randomAnswers = shuffled.slice(0, Math.min(50, allWords.length));

        console.log(`✅ Set ${randomAnswers.length} randomAnswers in preparedRandomAnswers`);
        set({ preparedRandomAnswers: randomAnswers });
      } else {
        console.error('❌ Failed to fetch randomAnswers from API:', randomAnswersRes.status);
      }
    } catch (err) {
      console.error('Lỗi khi fetch prepared data:', err);
    }
  },
}));
