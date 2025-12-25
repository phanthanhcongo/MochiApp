import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import JpPracticeResultPanel from '../components/JpPracticeResultPanel';
import { cnCharDataLoader } from '../utils/strokeData';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';

const isKanji = (char: string): boolean => /[\u4E00-\u9FFF]/.test(char);

const MultiCharStrokePractice: React.FC = () => {
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
      const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];
      const state = location.state;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('multiCharStrokePractice');
      
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
      console.log(`Reload count: ${newReloadCount}`);

      if (!state) {
        console.log('No state provided, redirecting to summary or home');
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/jp/summary');
        } else {
          navigate('/jp/home');
        }
        return;
      }

      // Kiểm tra xem state.from có khớp với route hiện tại không
      // Nếu khớp, không cần navigate (đang ở đúng route)
      const stateFromMatchesRoute = state.from === 'multiCharStrokePractice';
      
      if (!allowedSources.includes(state.from)) {
        // Chỉ navigate nếu state.from không khớp với route hiện tại
        // Điều này tránh navigate khi đang transition giữa các quiz
        if (!stateFromMatchesRoute) {
          console.log(`Invalid source: ${state.from}, redirecting to summary or home`);
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

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!word) return;

    let cancelled = false;

    const chars = Array.from(word.kanji ?? '');
    // initStatus: non-Kanji -> true, Kanji -> false
    const initStatus = chars.map(ch => !isKanji(ch));
    
    // Set trạng thái ban đầu
    setKanjiStatus(initStatus);

    // Dọn cũ trước khi vẽ mới
    writersRef.current.forEach(w => { try { w?.cancelQuiz?.(); } catch {} });
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
        }
      }));
    }, 1000);

    // Cleanup
    return () => {
      cancelled = true;
      clearTimeout(timer);
      writersRef.current.forEach(w => { try { w?.cancelQuiz?.(); } catch {} });
      writersRef.current = [];
    };
  }, [word, isForgetClicked]);

  useEffect(() => {
    if (kanjiStatus.length > 0 && kanjiStatus.every((status) => status === true)) {
      setIsCorrectAnswer(true);
      markAnswer(true);
    }
  }, [kanjiStatus]);

  const handleContinue = async () => {
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
    // console.log('📞 [MultiCharStrokePractice.handleContinue] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'f') {
        if (isResultShown) {
          handleContinue();
        } else {
          handleForget();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResultShown]);

  // Ẩn component ngay khi đang navigate hoặc không phải quiz type hiện tại
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('multiCharStrokePractice');
  const shouldHide = storeIsNavigating || (previousType && previousType !== 'multiCharStrokePractice');
  
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

  const handleForget = () => {
    if (!isCorrectAnswer) {
      setIsForgetClicked(true);
      setIsCorrectAnswer(false);
      markAnswer(false);
      speak(word?.reading_hiragana || '');
      writersRef.current.forEach((writer) => {
        if (writer) writer.cancelQuiz();
      });
    }
  };

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className="w-full"
    >
        <div className="text-center overflow-x-hidden">
                <h4 className="text-gray-600 mb-4">Vẽ từng nét đúng theo thứ tự</h4>
                <div className="flex gap-4 flex-wrap justify-center">
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

              </div>

              <div className="flex flex-col items-center gap-4 p-8">
                <button
                  className="btn-forget"
                  onClick={handleForget}
                  disabled={!!isCorrectAnswer}
                >Tôi ko nhớ từ này</button>
              </div>

              <JpPracticeResultPanel
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

export default MultiCharStrokePractice;
