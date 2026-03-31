import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession, speak } from '../utils/usePracticeStore';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import PracticeResultPanel from '../components/PracticeResultPanel';
import { cnCharDataLoader } from '../utils/kanjiStrokeData';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';

const isKanji = (char: string): boolean => /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(char);

const WritingKanjiPractice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
    isNavigating: storeIsNavigating,
    previousType,
  } = usePracticeSession();
  const [kanjiStatus, setKanjiStatus] = useState<boolean[]>([]);
  const [statusWordId, setStatusWordId] = useState<number | null>(null);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const writersRef = useRef<(HanziWriter | null)[]>([]);

  const word = currentWord?.word;
  useEffect(() => {
    // Đợi một chút để đảm bảo location.state đã được set đúng cách sau khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'ReadingHiraganaPractice', 'TypingRomajiPractice', 'voicePractice', 'WritingKanjiPractice'];
      const state = location.state;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('WritingKanjiPractice');

      // Nếu không ở đúng route, không làm gì cả (có thể đang navigate đi)
      if (!isCorrectRoute) {
        return;
      }

      // KHÔNG navigate nếu đang trong quá trình practice (có currentWord và chưa hoàn thành)
      if (currentWord && isCorrectAnswer === null && !isForgetClicked) {
        return;
      }

      const storedRaw = localStorage.getItem('reviewed_words');
      const reviewedWords = storedRaw ? JSON.parse(storedRaw) : [];

      const reloadCountRaw = sessionStorage.getItem('reload_count');
      const reloadCount = reloadCountRaw ? parseInt(reloadCountRaw) : 0;
      const newReloadCount = reloadCount + 1;
      sessionStorage.setItem('reload_count', newReloadCount.toString());
      // console.log(`Reload count: ${newReloadCount}`);

      if (!state) {
        // console.log('No state provided, redirecting to summary or home');
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/jp/summary');
        } else {
          navigate('/jp/home');
        }
        return;
      }

      // Kiểm tra xem state.from có khớp với route hiện tại không
      // Nếu khớp, không cần navigate (đang ở đúng route)
      const stateFromMatchesRoute = state.from === 'WritingKanjiPractice';

      if (!allowedSources.includes(state.from)) {
        // Chỉ navigate nếu state.from không khớp với route hiện tại
        // Điều này tránh navigate khi đang transition giữa các quiz
        if (!stateFromMatchesRoute) {
          // console.log(`Invalid source: ${state.from}, redirecting to summary or home`);
          if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
            navigate('/jp/summary');
          } else {
            navigate('/jp/home');
          }
        }
        return;
      }

      if (newReloadCount >= RELOAD_COUNT_THRESHOLD) {
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/jp/summary');
        } else {
          navigate('/jp/home');
        }
      }
    }, 100);

    return () => clearTimeout(checkState);
  }, [location.state, location.pathname, navigate, currentWord, isCorrectAnswer, isForgetClicked]);

  const isResultShown = isCorrectAnswer !== null || isForgetClicked;





  const processedWordIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!word) return;

    let cancelled = false;

    const chars = Array.from(word.kanji ?? '');
    // initStatus: non-Kanji -> true, Kanji -> false
    const initStatus = chars.map(ch => !isKanji(ch));

    // Set trạng thái ban đầu
    setKanjiStatus(initStatus);
    setStatusWordId(word.id);
    processedWordIdRef.current = word.id;

    // Dọn cũ trước khi vẽ mới
    writersRef.current.forEach(w => { try { w?.cancelQuiz?.(); } catch { } });
    writersRef.current = [];

    const timer = setTimeout(async () => {
      await Promise.all(chars.map(async (ch, idx) => {
        const container = containerRefs.current[idx];
        if (!container) return;
        container.innerHTML = '';

        // Non-Kanji → render tĩnh, đã set true ở initStatus
        if (!isKanji(ch)) {
          container.textContent = ch;
          return;
        }

        // Pre-load dataset
        await HanziWriter.loadCharacterData(ch, { charDataLoader: cnCharDataLoader as any });
        if (cancelled) return;

        const writer = HanziWriter.create(container, ch, {
          width: 200,
          height: 200,
          padding: 5,
          strokeColor: '#22c55e',
          radicalColor: '#0ea5e9',
          highlightColor: '#f97316',
          showOutline: true,
          showCharacter: false,
          showHintAfterMisses: 1,
          drawingFadeDuration: 300,
          strokeFadeDuration: 300,
          charDataLoader: cnCharDataLoader as any,
        });
        writersRef.current[idx] = writer;

        if (!isForgetClicked) {
          writer.quiz({
            onComplete: () => {
              setKanjiStatus(prev => {
                if (cancelled) return prev;
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            },
            onMistake: () => speak(word.reading_hiragana),
          });
        } else {
          writer.animateCharacter();
        }
      }));
    }, 1000);

    // Cleanup
    return () => {
      cancelled = true;
      processedWordIdRef.current = null;
      clearTimeout(timer);
      writersRef.current.forEach(w => { try { w?.cancelQuiz?.(); } catch { } });
      writersRef.current = [];
    };
  }, [word, isForgetClicked]);

  const hasKanjiChars = React.useMemo(() => {
    if (!word?.kanji) return false;
    return Array.from(word.kanji).some(ch => isKanji(ch));
  }, [word]);

  useEffect(() => {
    // Chỉ mark done nếu status khớp với word hiện tại
    // CRITICAL FIX: Check statusWordId to ensure kanjiStatus belongs to current word
    if (
      word?.id &&
      statusWordId === word.id &&
      processedWordIdRef.current === word.id &&
      kanjiStatus.length > 0 &&
      kanjiStatus.every((status) => status === true) &&
      hasKanjiChars // Only auto-complete if there were actual Kanji to practice
    ) {
      // Add delay before showing result to allow user to see the last stroke
      const timer = setTimeout(() => {
        setIsCorrectAnswer(true);
        markAnswer(true, 'WritingKanjiPractice');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [kanjiStatus, word, statusWordId, markAnswer, hasKanjiChars]);

  const handleSkip = React.useCallback(() => {
    if (!isCorrectAnswer) {
      setIsCorrectAnswer(true);
      markAnswer(true, 'WritingKanjiPractice');
      speak(word?.reading_hiragana || '');
      writersRef.current.forEach((writer) => {
        if (writer) {
          writer.cancelQuiz();
          writer.showCharacter();
        }
      });
    }
  }, [isCorrectAnswer, word, markAnswer]);

  const handleContinue = React.useCallback(async () => {
    if (isNavigating || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsNavigating(true);
    setIsCorrectAnswer(null);
    setIsForgetClicked(false);
    setIsResultHidden(false);
    sessionStorage.setItem('reload_count', '0');

    // Đợi animation exit hoàn thành trước khi chuyển bài (400ms để khớp với animation duration)
    await new Promise(resolve => setTimeout(resolve, 400));

    // Xóa từ khỏi pool khi trả lời đúng (kể cả stroke practice)
    // console.log('📞 [WritingKanjiPractice.handleContinue] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  }, [isNavigating, continueToNextQuiz, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CHỈ xử lý nếu đang ở đúng route
      const currentPath = window.location.pathname;
      const isCorrectRoute = currentPath.includes('WritingKanjiPractice');
      if (!isCorrectRoute) return;

      // Ignore auto-repeat events when key is held down
      if (e.repeat) return;

      if (e.key === 'Enter' || e.key.toLowerCase() === 'f') {
        // CHỈ cho phép continue khi đã hoàn thành (isResultShown = true)
        // KHÔNG tự động gọi handleForget nữa
        if (isResultShown) {
          handleContinue();
        }
        // Khi chưa hoàn thành → KHÔNG làm gì cả
        // User phải tự bấm nút "Tôi ko nhớ từ này" nếu muốn forget
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResultShown, handleContinue, handleSkip]);

  // Ẩn component ngay khi đang navigate hoặc không phải quiz type hiện tại
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('WritingKanjiPractice');
  const shouldHide = storeIsNavigating || (previousType && previousType !== 'WritingKanjiPractice');

  // Đồng bộ exit animation với state updates
  useEffect(() => {
    if (shouldHide && !isExiting) {
      setIsExiting(true);
      exitTimeoutRef.current = setTimeout(() => {
        // Component sẽ được unmount bởi shouldHide check
      }, 400);
    } else if (!shouldHide && isExiting) {
      setIsExiting(false);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [shouldHide, isExiting]);

  if (!word || shouldHide || !isCorrectRoute) {
    return null;
  }



  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className="w-full h-full"
    >
      <div className="flex flex-col items-center h-full overflow-y-hidden">
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <h4 className="text-gray-600 mb-4 shrink-0">Vẽ từng nét đúng theo thứ tự</h4>
          <div className="flex gap-4 flex-wrap justify-center shrink-0 mb-8">
            {word.kanji.split('').map((char, idx) => (
              <div
                key={`${word.id}-${idx}`} // ✅ Quan trọng: đảm bảo mỗi ô là duy nhất khi từ thay đổi
                ref={(el) => {
                  containerRefs.current[idx] = el;
                }}
                className="relative w-[200px] h-[200px] flex items-center justify-center text-9xl font-bold border border-gray-400 rounded-lg shadow bg-stone-100"
                style={{
                  backgroundImage: `
            linear-gradient(to right, #b4b7bdff 1px, transparent 1px),
            linear-gradient(to bottom, #c6c7c9ff 1px, transparent 1px),
            linear-gradient(to top left, #f3f4f6 1px, transparent 1px),
            linear-gradient(to top right, #f3f4f6 1px, transparent 1px)
          `,
                  backgroundSize: '25% 25%',
                  backgroundPosition: 'center',
                }}
              >
                {!isKanji(char) && <span>{char}</span>}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 shrink-0 pb-8 w-full">
            <button
              className="btn-forget"
              onClick={handleSkip}
              disabled={!!isCorrectAnswer}
            >Bỏ qua</button>
          </div>
        </div>
      </div>

      <PracticeResultPanel
        isAnswered={isResultShown}
        isForgetClicked={isForgetClicked}
        isCorrectAnswer={isCorrectAnswer}
        isResultHidden={isResultHidden}
        setIsResultHidden={setIsResultHidden}
        onContinue={handleContinue}
        isNavigating={isNavigating}
        word={currentWord.word}
        speak={speak}
      />
    </PracticeAnimationWrapper>
  );
};

export default WritingKanjiPractice;



