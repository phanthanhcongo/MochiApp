import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";
const RomajiPractice: React.FC = () => {
  const [userRomajiAnswer, setUserRomajiAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const question = currentWord?.word.kanji || '';
  const reading = currentWord?.word.reading_hiragana || '';
  const correctRomaji = currentWord?.word.reading_romaji || '';

  useEffect(() => {
    const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice'];
    const state = location.state;

    // Đọc dữ liệu từ localStorage
    const storedRaw = localStorage.getItem('reviewed_words');
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
        navigate('/jp/summary');
      } else {
        navigate('/jp/home');
      }
      return;
    }

    // ✅ Nếu có state nhưng không đến từ nguồn hợp lệ
    if (!allowedSources.includes(state.from)) {
      console.log(`Invalid source: ${state.from}, redirecting to summary or home`);
      if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
        navigate('/jp/summary');
      } else {
        navigate('/jp/home');
      }
    }
    if (newReloadCount >= 4) {
      if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
        navigate('/jp/summary');
      } else {
        navigate('/jp/home');
      }
    }
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = () => {
    if (!isAnswered && userRomajiAnswer.trim()) {
      const cleaned = userRomajiAnswer.trim().toLowerCase();
      const isCorrect = cleaned === correctRomaji;

      setIsAnswered(true);
      setIsCorrectAnswer(isCorrect);
      setIsForgetClicked(false);
      speak(reading);
      markAnswer(isCorrect);
    }
  };

  const handleForget = () => {
    if (!isAnswered) {
      setIsAnswered(false);
      setIsCorrectAnswer(false);
      setIsForgetClicked(true);
      setIsResultHidden(false);
      setUserRomajiAnswer('');
      speak(reading);
      markAnswer(false);
    }
  };

  const handleContinue = () => {
    setUserRomajiAnswer('');
    setIsAnswered(false);
    setIsCorrectAnswer(null);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsTranslationHidden(false);
    setShowConfirmExit(false);
  sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

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
        className="min-h-screen"  >
        <div className="min-h-screen ">
          <div className=" w-full min-h-screen mx-auto pt-6 relative bg-slate-50 min-h-[700px]">
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

              <div className="flex items-center justify-between m-6">
                          <button
                            className="bg-yellow-400 px-3 py-1 rounded-full flex items-center justify-center h-15 w-15 text-3xl text-slate-50"
                            onClick={handleToggle}
                          >
                            {isPlaying ? <FaPause /> : <FaPlay />}
                          </button>
                        </div>

              <div className="text-center mb-6 p-10">
                <h4 className="text-gray-600 mb-4">Nhập cách đọc romaji của từ sau:</h4>
                <h1 className="text-4xl font-bold text-gray-900 mb-6">{question}</h1>
                <input
                  type="text"
                  className="border border-gray-300 rounded px-4 py-2 text-2xl text-center w-full max-w-sm"
                  placeholder="ví dụ: shiji"
                  value={userRomajiAnswer}
                  onChange={(e) => setUserRomajiAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  disabled={isAnswered}
                />
              </div>

              <div className="flex flex-col items-center gap-4 p-8">
                <button
                  className={`btn-primary ${!userRomajiAnswer || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-80 px-6 py-2`}
                  onClick={handleCheck}
                  disabled={!userRomajiAnswer || isAnswered}
                >
                  Kiểm tra
                </button>
                <button className="btn-forget" onClick={handleForget} disabled={isAnswered}>Tôi ko nhớ từ này</button>
              </div>

              {(isAnswered || isForgetClicked) && !isResultHidden && (
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

              {(isAnswered || isForgetClicked) && isResultHidden && (
                <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
                  <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green ' : 'btn-toggle--red'} hiddenBtn`} onClick={() => setIsResultHidden(false)}>
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                  <div className="w-full text-center p-10">
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

export default RomajiPractice;
