import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cnCharDataLoader } from './strokeData';
import { RELOAD_COUNT_THRESHOLD } from './practiceConfig';

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
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
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

  const handleContinue = async () => {
    if (isNavigating || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsNavigating(true);
    setIsCorrectAnswer(null);
    setIsForgetClicked(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    sessionStorage.setItem('reload_count', '0');

    // Xóa từ khỏi pool khi trả lời đúng (kể cả stroke practice)
    console.log('📞 [MultiCharStrokePractice.handleContinue] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setIsExiting(false)}>
      <motion.div
        key={`${word.id}-${previousType || 'none'}`}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className=" w-full"
      >
        <div className="text-center mb-6 p-10">
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

              {isResultShown && !isResultHidden && (
                <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
                  <div className="flex items-start justify-end mb-4 w-[90%] mx-auto">
                    <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green' : 'btn-toggle--red'} displayBtn`} onClick={() => setIsResultHidden(true)}>
                      <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                  </div>
                  <div className="flex items-start gap-4 mb-4 w-[90%] mx-auto">
                    <div className="btn-audio text-2xl" onClick={() => speak(word.reading_hiragana)} title="Phát âm">🔊</div>
                    <div>
                      <p className="text-xl text-stone-50/90">{word.reading_hiragana} • {word.hanviet}</p>
                      <p className="text-4xl font-bold">{word.kanji}</p>
                      <p className="text-2xl text-stone-50/100 my-5">{word.meaning_vi}</p>
                      <p className="text-xl text-stone-50/90 mt-1 italic">{word.hanviet_explanation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 mb-1 w-[90%] mx-auto">
                    <button className="btn-audio text-2xl" onClick={() => speak(word.example || '')} title="Phát âm ví dụ">🔊</button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-stone-50 text-2xl">{word.example}
                          <button className="btn-eye" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                            {isTranslationHidden ? '🙈' : '👁'}
                          </button>
                        </p>
                      </div>
                      <p className={`text-stone-50/90 text-xl mt-1 italic ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.example_romaji}</p>
                      <p className={`text-stone-50/90 text-xl ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.example_vi}</p>
                    </div>
                  </div>
                  <div className="w-80 mx-auto mt-6">
                    <button 
                      className="btn-primary btn-primary--active w-full" 
                      onClick={handleContinue}
                      disabled={isNavigating}
                    >
                      {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
                    </button>
                  </div>
                </div>
              )}

              {isResultShown && isResultHidden && (
                <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
                  <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green' : 'btn-toggle--red'} hiddenBtn`} onClick={() => setIsResultHidden(false)}>
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                  <div className=" text-center  p-10">
                    <button 
                      className="btn-primary btn-primary--active w-full" 
                      onClick={handleContinue}
                      disabled={isNavigating}
                    >
                      {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
                    </button>
                  </div>
                </div>
              )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MultiCharStrokePractice;
