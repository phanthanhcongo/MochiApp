import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";
import { cnCharDataLoader } from './strokeData';

const isKanji = (char: string): boolean => /[\u4E00-\u9FFF]/.test(char);

const MultiCharStrokePractice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentWord,
    words,
    markAnswer,
    getNextQuizType,
    removeCurrentWord,
    reviewedWords,
    totalCount,
    completedCount,
  } = usePracticeSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [strokeError, setStrokeError] = useState<{ chars: string[]; msg?: string } | null>(null);
  const errorOnceRef = useRef(false);
  const [kanjiStatus, setKanjiStatus] = useState<boolean[]>([]);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const writersRef = useRef<(HanziWriter | null)[]>([]);

  const word = currentWord?.word;
 useEffect(() => {
    const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];
    const state = location.state;

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

    if (!allowedSources.includes(state.from)) {
      console.log(`Invalid source: ${state.from}, redirecting to summary or home`);
      if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
        navigate('/jp/summary');
      } else {
        navigate('/jp/home');
      }
    }
    if (newReloadCount >= 2) {
      if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
        navigate('/jp/summary');
      } else {
        navigate('/jp/home');
      }
    }
  }, []);
  const isResultShown = isCorrectAnswer !== null || isForgetClicked;
  const handleSkipDueToError = () => {
    // huỷ quiz hiện tại (nếu có)
    writersRef.current.forEach(w => { try { w?.cancelQuiz?.(); } catch { } });

    // reset cờ
    setStrokeError(null);
    errorOnceRef.current = false;
    sessionStorage.setItem('reload_count', '0');

    if (words.length === 0) {
      navigate('/jp/summary');
    } else {
      const firstQuizType = getNextQuizType();
    navigate(`/jp/quiz/${firstQuizType}`, {
      state: { from: firstQuizType }
    });
    }
  };
 useEffect(() => {
  if (!word) return;

  let cancelled = false;

  const chars = Array.from(word.kanji ?? '');
  // initStatus: non-Kanji -> true, Kanji -> false
  const initStatus = chars.map(ch => !isKanji(ch));
  const noKanji = initStatus.length > 0 && initStatus.every(Boolean);

  // 🛑 Nếu KHÔNG có Kanji: không vẽ, KHÔNG tự mark đúng; hiện panel Bỏ qua
  if (noKanji) {
    // Đảm bảo effect "kanjiStatus.every(true)" của bạn KHÔNG kích hoạt:
    setKanjiStatus([]); 

    // Hiển thị thông báo + nút bỏ qua
    setStrokeError({
      chars: [], 
      msg: 'Từ này không có Kanji để luyện nét. Bạn có muốn bỏ qua từ này?'
    });

    // Dọn writer cũ nếu có
    writersRef.current.forEach(w => { try { w?.cancelQuiz?.(); } catch {} });
    writersRef.current = [];

    return () => { cancelled = true; };
  }

  // ✅ Có ít nhất 1 Kanji: set trạng thái ban đầu
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

      try {
        // Pre-load dataset để bắt lỗi sớm
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
      } catch (e: any) {
        console.warn('⚠️ Thiếu dataset nét cho ký tự:', ch, e?.message ?? e);

        // Chỉ set thông báo/lỗi MỘT LẦN cho cả từ
        if (!errorOnceRef.current) {
          errorOnceRef.current = true;
          setStrokeError(prev => {
            const list = new Set([...(prev?.chars ?? []), ch]);
            return { chars: Array.from(list), msg: e?.message ?? 'Missing stroke data' };
          });
        }

        // Fallback hiển thị tĩnh, KHÔNG auto-đúng
        container.classList.add('bg-stone-100');
        container.textContent = ch;
        // Không set kanjiStatus[idx] = true để tránh tự hoàn thành khi thiếu dataset
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

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      speechSynthesis.speak(utterance);
    }
  };
  const handleToggle = () => {
    setIsPlaying(prev => !prev);
    setShowConfirmExit(true);
  };

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

  const handleContinue = () => {
    setIsCorrectAnswer(null);
    setIsForgetClicked(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    setShowConfirmExit(false);
    sessionStorage.setItem('reload_count', '0');

    removeCurrentWord();
    if (words.length === 0) {
      navigate('/jp/summary', { state: { reviewedWords } });
    } else {
      const firstQuizType = getNextQuizType();
      navigate(`/jp/quiz/${firstQuizType}`, {
        state: { from: firstQuizType }
      });
    }
  };

  if (!word) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={word.id}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen bg-gray-100"
      >
        <div className="min-h-screen ">
          <div className="w-full min-h-screen mx-auto pt-6 relative bg-slate-50 min-h-[700px]">
            <div className="mx-auto px-8">
              <div className="relative w-full h-5"> {/* wrapper chứa thanh tiến độ + runner */}
                {/* Thanh tiến độ nền */}
                <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Ảnh nổi phía trên */}
                <img
                  src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmichi.308739ad.png&w=96&q=75" // 👈 ảnh bạn đã gửi
                  alt="Runner"
                  className="absolute -top-6 w-12 h-12 transition-all duration-300"
                  style={{ left: `calc(${progress}% - 24px)` }} // dịch trái = nửa ảnh
                />
              </div>

              {/* Pause and progress text */}
              <div className="flex items-center justify-between mt-2">
                <button
                  className="bg-yellow-400 px-3 py-1 rounded-full flex items-center justify-center h-15 w-15 text-3xl text-slate-50"
                  onClick={handleToggle}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
              </div>

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
{strokeError && (
  <div className="max-w-3xl mx-auto mt-4 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
    <div className="font-semibold mb-1">Không có dữ liệu nét cho từ này</div>
    {strokeError.chars?.length > 0 && (
      <div className="text-sm mb-2">
        Ký tự thiếu dataset: <strong>{strokeError.chars.join(' ')}</strong>
      </div>
    )}
    <div className="flex gap-3">
      <button
        className="px-4 py-2 rounded-md bg-gray-800 text-white hover:brightness-110"
        onClick={handleSkipDueToError}
      >
        Bỏ qua từ này
      </button>
     
    </div>
  </div>
)}

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
                    <button className="btn-primary btn-primary--active w-full" onClick={handleContinue}>Tiếp tục</button>
                  </div>
                </div>
              )}

              {isResultShown && isResultHidden && (
                <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
                  <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green' : 'btn-toggle--red'} hiddenBtn`} onClick={() => setIsResultHidden(false)}>
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                  <div className=" text-center  p-10">
                    <button className="btn-primary btn-primary--active w-full" onClick={handleContinue}>Tiếp tục</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {showConfirmExit && (
            <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
              <div className="relative bg-slate-50 p-6 rounded-t-2xl shadow-xl w-full text-center animate-slideUp space-y-4">
                {/* Nút đóng */}
                <button
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
                  onClick={() => setShowConfirmExit(false)}
                  title="Đóng"
                >
                  <FontAwesomeIcon icon={faCircleXmark} className="text-gray-700 text-4xl" />
                </button>

                {/* Nội dung */}
                <p className="text-2xl font-semibold text-gray-800 mb-10 mt-5">Bạn muốn ngừng ôn tập à?</p>

                {/* Nút: Tiếp tục */}
                <button
                  onClick={() => {
                    console.log("Tiếp tục ôn tập");
                    setShowConfirmExit(false);
                  }}
                  className="w-full flex items-center  justify-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:brightness-110 text-stone-50 font-semibold transition"
                >
                  <FaPlay className=" text-3xl" />
                  Tiếp tục
                </button>

                {/* Nút: Quay lại */}
                <button
                  onClick={() => navigate('/jp/summary')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full  hover:brightness-110 text-gray-800 font-semibold transition border border-gray-300 border-b-10"
                >
                  <BiLogOutCircle className="text-gray-700 text-3xl" />
                  Quay lại
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MultiCharStrokePractice;
