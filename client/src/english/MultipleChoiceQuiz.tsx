import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";

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
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const { totalCount, completedCount } = usePracticeSession();

  const isResultShown = isAnswered || isForgetClicked;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;


  const {
    currentWord,
    words,
    markAnswer,
    getNextQuizType,
    removeCurrentWord,
    reviewedWords,
  } = usePracticeSession();
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
    if (newReloadCount >= 2) {
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
    // console.log("✅ reviewedWords sau khi xoá current:", reviewedWords);
    speak(currentWord?.word.word || '');
    if (currentWord) {
      const correctAnswer = {
        text: currentWord.word.meaning_vi,
        isCorrect: true,
      };
      const incorrects = words
        .filter(w => w.word.id !== currentWord.word.id && w.word.meaning_vi !== currentWord.word.meaning_vi)
        .map(w => ({
          text: w.word.meaning_vi,
          isCorrect: false,
        }))
        .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      setAnswers([correctAnswer, ...incorrects].sort(() => Math.random() - 0.5));
    }
  }, [currentWord, words]);


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
    setIsTranslationHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setShowConfirmExit(false);
  sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

    removeCurrentWord();
    if (words.length === 0) {
      // Nếu hết từ để ôn → chuyển sang trang summary
      navigate('/summary', { state: { reviewedWords } });
    } else {
      const firstQuizType = getNextQuizType();
      navigate(`/en/quiz/${firstQuizType}`, {
        state: { from: firstQuizType }
      });
    }
  };

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
        <div className="mx-auto p-10 ">
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
          <div className="flex items-center justify-between m-6">
            <button
              className="bg-yellow-400 px-3 py-1 rounded-full flex items-center justify-center h-15 w-15 text-3xl text-slate-50"
              onClick={handleToggle}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <div className="text-xs">1 / {totalWords}</div>
          </div>
          <div className="text-center pb-8">
            <h4 className="text-gray-600 mb-1">Chọn đúng nghĩa của từ</h4>
            <h1 className="text-5xl font-bold text-gray-900">{word.word}</h1>
          </div>
          <div className="flex flex-col gap-3 mb-6">
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
                  className={`answer-option ${statusClass}`}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-4 h-full">
                    <div className="flex-shrink-0 flex justify-center">
                      <span className="inline-flex items-center justify-center h-8 w-8 border-2 border-gray-300 rounded-full text-sm font-medium">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 text-center break-words">{ans.text}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-4 p-8 ">
            <button
              className={`btn-primary ${selectedIndex === null || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-80 px-6 py-2`}
              onClick={handleCheck}
              disabled={selectedIndex === null || isAnswered}>
              Kiểm tra
            </button>
            <button className="btn-forget" onClick={handleForget} disabled={isAnswered}>
              Tôi ko nhớ từ này
            </button>
          </div>

          {isResultShown && !isResultHidden && (
            <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
              <div className="flex items-start justify-end mb-4 w-[90%] mx-auto">
                <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green' : 'btn-toggle--red'} displayBtnEnglish `} onClick={() => setIsResultHidden(true)}>
                  <FontAwesomeIcon icon={faChevronDown} />
                </button>
              </div>
              <div className="flex items-start gap-4 mb-4 w-[90%] mx-auto">
                <div className="btn-audio text-2xl" onClick={() => speak(word.word)} title="Phát âm">🔊</div>
                <div>
                  <p className="text-4xl font-bold">{word.word}</p>
                   <p className="text-xl text-stone-50/90">{word.ipa} </p>
                  <p className="text-2xl text-stone-50/100 my-5">{word.meaning_vi}</p>
                  {/* <p className="text-xl text-stone-50/90 mt-1 italic">{word.word}</p> */}
                </div>
              </div>
              <div className="flex items-start gap-4 mb-1 w-[90%] mx-auto">
                <button className="btn-audio text-2xl" onClick={() => speak(word.exampleEn || '')} title="Phát âm ví dụ">🔊</button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-stone-50 text-2xl">{word.exampleEn}
                      <button className="btn-eye" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                        {isTranslationHidden ? '🙈' : '👁'}
                      </button>
                    </p>
                  </div>
                  <p className={`text-stone-50/90 text-lg mt-1 italic ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.exampleEn}</p>
                  <p className={`text-stone-50/90 text-lg ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.exampleVi}</p>
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
