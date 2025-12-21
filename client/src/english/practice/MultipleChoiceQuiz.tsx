import React, { useState, useEffect } from 'react';
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

interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

const MultipleChoiceQuiz: React.FC = () => {
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
  const {
    currentWord,
    words,
    markAnswer,
    getNextQuizType,
    removeCurrentWord,
    reviewedWords,
    totalCount,
    completedCount
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
    const allowedSources = ['multiple', 'voicePractice','FillInBlankPractice'];
    const state = location.state;

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
    }
    if (newReloadCount >= RELOAD_COUNT_THRESHOLD) {
      if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
        navigate('/en/summary');
      } else {
        navigate('/en/home');
      }
    }
  }, []);





  const totalWords = words.length + (currentWord ? 1 : 0);
  const [answers, setAnswers] = useState<AnswerOption[]>([]);

  useEffect(() => {
    if (!currentWord) return;
    
    speak(currentWord.word.word || '');
    
    if (allWords.length > 0) {
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

      const incorrects = allWords
        .filter(w => {
          const m = w.meaning_vi;
          return w.id !== currentWord.word.id && m && !isOverlapping(m, correctAnswerText);
        })
        .map(w => ({
          text: w.meaning_vi,
          isCorrect: false,
        }))
        .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i)
        .sort(() => Math.random() - 0.5);

      const finalIncorrects: AnswerOption[] = [];
      for (const item of incorrects) {
        if (finalIncorrects.length >= 2) break;
        if (!finalIncorrects.some(existing => isOverlapping(item.text, existing.text))) {
          finalIncorrects.push(item);
        }
      }

      // Nới lỏng nếu thiếu
      if (finalIncorrects.length < 2) {
        for (const item of incorrects) {
          if (finalIncorrects.length >= 2) break;
          if (!finalIncorrects.some(existing => existing.text === item.text)) {
            finalIncorrects.push(item);
          }
        }
      }

      setAnswers([correctAnswer, ...finalIncorrects].sort(() => Math.random() - 0.5));
    }
  }, [currentWord?.word.id, allWords.length > 0]); // Chỉ chạy khi ID từ thay đổi hoặc khi listWord tải xong


  const handleSelect = (index: number) => {
    if (!isAnswered) setSelectedIndex(index);
  };

  const handleCheck = () => {
    if (selectedIndex !== null && !isAnswered) {
      const isCorrect = answers[selectedIndex].isCorrect;
      setIsAnswered(true);
      setIsCorrectAnswer(isCorrect);
      setIsForgetClicked(false);
      markAnswer(isCorrect);
      speak(currentWord?.word.word || '');

    }
  };

  const handleContinue = () => {
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setShowConfirmExit(false);

    removeCurrentWord();
    if (words.length === 0) {
      // Nếu hết từ để ôn → chuyển sang trang summary
      navigate('/en/summary', { state: { reviewedWords } });
    } else {
      const firstQuizType = getNextQuizType();
      navigate(`/en/quiz/${firstQuizType}`, {
        state: { from: firstQuizType }
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'f') {
        if (isAnswered || isForgetClicked) {
          handleContinue();
        } else if (selectedIndex !== null) {
          handleCheck();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, selectedIndex]);

  const handleForget = () => {
    if (!isAnswered) {
      setIsAnswered(false);
      setIsCorrectAnswer(false);
      setIsForgetClicked(true);
      setIsResultHidden(false);
      setSelectedIndex(null);
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
            isNavigating={false}
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
};

export default MultipleChoiceQuiz;
