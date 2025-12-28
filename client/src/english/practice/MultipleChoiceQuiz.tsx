import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import { API_URL } from '../../apiClient';
import EnglishPracticeResultPanel from '../components/EnglishPracticeResultPanel';
import { showToast } from '../../components/Toast';

interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

const MultipleChoiceQuiz: React.FC = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [allWords, setAllWords] = useState<any[]>([]);
  const isProcessingRef = useRef(false);
  const lastKeyPressRef = useRef<number>(0);

  const {
    currentWord,
    words,
    markAnswer,
    continueToNextQuiz,
    totalCount,
    completedCount,
    isNavigating
  } = usePracticeSession();

  // const isResultShown = isAnswered || isForgetClicked; // Unused variable
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Fetch all words from database
  useEffect(() => {
    const fetchAllWords = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/en/practice/listWord`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAllWords(data.allWords || []);
        }
      } catch (err) {
        console.error('Error fetching all words:', err);
      }
    };
    fetchAllWords();
  }, []);
  useEffect(() => {
    // Delay để tránh race condition khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'voicePractice', 'FillInBlankPractice'];
      const state = location.state;

      // Kiểm tra route hiện tại
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('multiple');

      if (!isCorrectRoute) {
        return;
      }

      // Đọc dữ liệu từ localStorage
      const storedRaw = localStorage.getItem('reviewed_words_english');
      const reviewedWords = storedRaw ? JSON.parse(storedRaw) : [];

      // --- Reset rồi đếm reload ---
      const reloadCountRaw = sessionStorage.getItem('reload_count');
      const reloadCount = reloadCountRaw ? parseInt(reloadCountRaw) : 0;
      const newReloadCount = reloadCount + 1;
      sessionStorage.setItem('reload_count', newReloadCount.toString());
      console.log(`Reload count: ${newReloadCount}`);

      // -------------------------

      // ✅ Nếu không có state (truy cập trực tiếp hoặc reload)
      if (!state) {
        console.log('No state provided, redirecting to summary or home');
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/en/summary');
        } else {
          navigate('/en/home');
        }
        return;
      }

      // ✅ Nếu có state nhưng không đến từ nguồn hợp lệ
      if (!allowedSources.includes(state.from)) {
        console.log(`Invalid source: ${state.from}, redirecting to summary or home`);
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/en/summary');
        } else {
          navigate('/en/home');
        }
        return;
      }

      if (newReloadCount >= RELOAD_COUNT_THRESHOLD) {
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/en/summary');
        } else {
          navigate('/en/home');
        }
      }
    }, 100);

    return () => clearTimeout(checkState);
  }, [location.state, location.pathname, navigate]);





  const totalWords = words.length + (currentWord ? 1 : 0);
  const [answers, setAnswers] = useState<AnswerOption[]>([]);

  // Generate answer choices (1 correct + 2 incorrect)
  const generateAnswers = useCallback(() => {
    if (!currentWord) {
      setAnswers([]);
      return;
    }

    const correctAnswerText = currentWord.word.meaning_vi || '';
    const correctAnswer = {
      text: correctAnswerText,
      isCorrect: true,
    };

    const isOverlapping = (t1: string, t2: string) => {
      const s1 = t1.toLowerCase().trim();
      const s2 = t2.toLowerCase().trim();
      if (!s1 || !s2) return false;
      return s1.includes(s2) || s2.includes(s1);
    };

    let incorrects: AnswerOption[] = [];

    // First, try to get incorrect answers from current practice words
    if (words.length > 0) {
      incorrects = words
        .filter(w => {
          const m = w.word.meaning_vi;
          return w.word.id !== currentWord.word.id && m && !isOverlapping(m, correctAnswerText);
        })
        .map(w => ({
          text: w.word.meaning_vi || '',
          isCorrect: false,
        }))
        .filter(v => v.text !== '')
        .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i);
    }

    // If not enough from practice words, use allWords as fallback
    if (incorrects.length < 2 && allWords.length > 0) {
      const additionalIncorrects = allWords
        .filter(w => {
          const m = w.meaning_vi;
          return w.id !== currentWord.word.id && m && !isOverlapping(m, correctAnswerText) && !incorrects.some(inc => isOverlapping(m, inc.text));
        })
        .map(w => ({
          text: w.meaning_vi,
          isCorrect: false,
        }))
        .filter(v => v.text !== '')
        .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i)
        .filter(item => !incorrects.find(existing => existing.text === item.text))
        .sort(() => Math.random() - 0.5);

      incorrects = [...incorrects, ...additionalIncorrects];
    }

    // Select 2 non-overlapping incorrect answers
    const finalIncorrects: AnswerOption[] = [];
    const shuffled = incorrects.sort(() => Math.random() - 0.5);

    for (const item of shuffled) {
      if (finalIncorrects.length >= 2) break;
      if (!finalIncorrects.some(existing => isOverlapping(item.text, existing.text))) {
        finalIncorrects.push(item);
      }
    }

    // Relax overlap check if still not enough
    if (finalIncorrects.length < 2) {
      for (const item of shuffled) {
        if (finalIncorrects.length >= 2) break;
        if (!finalIncorrects.some(existing => existing.text === item.text)) {
          finalIncorrects.push(item);
        }
      }
    }

    // Add placeholders if still not enough (edge case)
    if (finalIncorrects.length < 2) {
      const placeholders = ['...', '...'];
      for (let i = finalIncorrects.length; i < 2; i++) {
        finalIncorrects.push({ text: placeholders[i] || '...', isCorrect: false });
      }
    }

    // Shuffle all 3 answers and set state
    const finalAnswers = [correctAnswer, ...finalIncorrects].sort(() => Math.random() - 0.5);
    setAnswers(finalAnswers);
  }, [currentWord, words, allWords]);

  useEffect(() => {
    if (currentWord) {
      speak(currentWord.word.word || '');
      generateAnswers();
    }
  }, [currentWord?.word.id]); // ✅ CHỈ phụ thuộc vào ID - stable dependency


  const handleSelect = (index: number) => {
    if (!isAnswered) setSelectedIndex(index);
  };

  const handleCheck = useCallback(() => {
    if (selectedIndex !== null && !isAnswered) {
      const isCorrect = answers[selectedIndex].isCorrect;
      setIsAnswered(true);
      setIsCorrectAnswer(isCorrect);
      setIsForgetClicked(false);
      markAnswer(isCorrect);
      speak(currentWord?.word.word || '');
    }
  }, [selectedIndex, isAnswered, answers, markAnswer, currentWord]);

  const handleContinue = useCallback(async () => {
    if (isNavigating || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setShowConfirmExit(false);
    sessionStorage.setItem('reload_count', '0');

    // Timeout protection
    const timeoutId = setTimeout(() => {
      isProcessingRef.current = false;
      console.warn('Navigation timeout - forcing reset');
    }, 5000);

    try {
      await continueToNextQuiz(navigate, () => {
        clearTimeout(timeoutId);
        isProcessingRef.current = false;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error in handleContinue:', error);
      isProcessingRef.current = false;
      showToast('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  }, [isNavigating, continueToNextQuiz, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CHỈ xử lý nếu đang ở đúng route
      const currentPath = window.location.pathname;
      const isCorrectRoute = currentPath.includes('multiple');
      if (!isCorrectRoute) return;

      // Ignore auto-repeat events
      if (e.repeat) return;

      if (e.key === 'Enter' || e.key.toLowerCase() === 'f') {
        const now = Date.now();
        // Prevent double-trigger: debounce 300ms
        if (now - lastKeyPressRef.current < 300) {
          return;
        }
        lastKeyPressRef.current = now;

        // CHỈ cho phép continue nếu đã answer/forget
        if (isAnswered || isForgetClicked) {
          handleContinue();
        }
        // CHỈ cho phép check nếu đã chọn đáp án VÀ chưa answer
        else if (selectedIndex !== null && !isAnswered) {
          handleCheck();
        }
        // Nếu chưa chọn gì → Thông báo
        else {
          showToast('Vui lòng chọn đáp án trước khi kiểm tra');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, selectedIndex, handleContinue, handleCheck]);

  const handleForget = () => {
    if (!isAnswered) {
      setIsAnswered(false);
      setIsCorrectAnswer(false);
      setIsForgetClicked(true);
      setIsResultHidden(false);
      setSelectedIndex(null);
      markAnswer(false); // Log as incorrect attempt
      speak(currentWord?.word.word || ""); // Phát âm khi chọn "Tôi không nhớ từ này"
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };
  const handleToggle = () => {
    setIsPlaying(prev => !prev);
    setShowConfirmExit(true); // nếu vẫn muốn gọi logic này
  };
  if (!currentWord) return null;

  const word = currentWord.word;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={word.id}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen bg-gray-100 relative"  >
        <div className="flex flex-col items-center justify-center w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
          <div className="relative w-full h-5 mb-6"> {/* wrapper chứa thanh tiến độ + runner */}
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
          <div className="flex items-center justify-between w-full mb-8">
            <button
              className="bg-yellow-400 px-3 py-1 rounded-full flex items-center justify-center h-15 w-15 text-3xl text-slate-50"
              onClick={handleToggle}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <div className="text-xs">1 / {totalWords}</div>
          </div>
          <div className="text-center pb-4 sm:pb-6 md:pb-8 lg:pb-10 w-full">
            <h4 className="text-gray-600 mb-2 sm:mb-3 md:mb-4 text-lg sm:text-xl md:text-2xl lg:text-3xl">Chọn đúng nghĩa của từ</h4>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">{word.word}</h1>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 w-full ">
            {answers.map((ans, idx) => {
              const isSelected = selectedIndex === idx;
              let statusClass = 'answer-option--default';
              if (isAnswered || isForgetClicked) {
                if (ans.isCorrect) {
                  statusClass = 'answer-option--correct';
                } else if (selectedIndex === idx) {
                  statusClass = 'answer-option--wrong';
                }
              } else if (isSelected) {
                statusClass = 'answer-option--selected';
              }


              return (
                <button
                  key={idx}
                  className={`answer-option group ${statusClass}`}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full">
                    <span className="option-index">
                      {idx + 1}
                    </span>
                    <div className="flex-1 text-center font-bold text-base sm:text-lg md:text-xl lg:text-2xl pr-4 sm:pr-6 md:pr-8 lg:pr-10">
                      {ans.text}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8 w-full">
            <button
              className={`btn-primary ${selectedIndex === null || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-full max-w-md px-6 py-3`}
              onClick={handleCheck}
              disabled={selectedIndex === null || isAnswered}>
              Kiểm tra
            </button>
            <button className="btn-forget text-lg" onClick={handleForget} disabled={isAnswered}>
              Tôi ko nhớ từ này
            </button>
          </div>

          <EnglishPracticeResultPanel
            isAnswered={isAnswered}
            isForgetClicked={isForgetClicked}
            isCorrectAnswer={isCorrectAnswer}
            isResultHidden={isResultHidden}
            setIsResultHidden={setIsResultHidden}
            onContinue={handleContinue}
            isNavigating={isNavigating}
            word={currentWord.word}
            speak={speak}
          />
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
                onClick={() => navigate('/en/summary')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full  hover:brightness-110 text-gray-800 font-semibold transition border border-gray-300 border-b-10"
              >
                <BiLogOutCircle className="text-gray-700 text-3xl" />
                Quay lại
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </AnimatePresence>
  );
});

MultipleChoiceQuiz.displayName = 'MultipleChoiceQuiz';

export default MultipleChoiceQuiz;
