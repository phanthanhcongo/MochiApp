import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";

const HiraganaPractice: React.FC = () => {
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [hiraganaPool, setHiraganaPool] = useState<{ id: string; char: string }[]>([]);
  const [usedCharIds, setUsedCharIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // --------- Guard navigation & reload logic ----------
  useEffect(() => {
    const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice'];
    const state = location.state as any;

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
  }, [location.state, navigate]);

  const {
    currentWord,
    words,
    markAnswer,
    getNextQuizType,
    removeCurrentWord,
    totalCount,
    completedCount,
  } = usePracticeSession();

  if (!currentWord) return null;
  const word = currentWord.word;

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const question = word.kanji || '';
  const reading = word.reading_hiragana || ''; // ✅ ground truth in kana

  // ---------- Speech synthesis (robust) ----------
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // stop any ongoing speech
      } catch {}
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  };

  // ---------- Build choice pool directly from kana (fixes っ, ゃ/ゅ/ょ, etc.) ----------
  useEffect(() => {
    speak(reading);

    // Split exact kana units; Array.from handles surrogate pairs safely
    const correctChars = Array.from(reading);

    // Basic distractors; can be expanded if you want a smarter generator
    const distractors = ['あ', 'お', 'ま', 'み', 'む', 'め', 'も', 'ら', 'り', 'る', 'れ', 'ろ']
      .filter(c => !correctChars.includes(c))
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    const allChars = [...correctChars, ...distractors].sort(() => 0.5 - Math.random());

    const poolWithIds = allChars.map((char, idx) => ({
      id: `${char}-${idx}`,
      char,
    }));

    setHiraganaPool(poolWithIds);
    // Reset selection state whenever the target reading changes
    setUsedCharIds([]);
    setSelectedChars([]);
    setIsAnswered(false);
    setIsCorrectAnswer(null);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsTranslationHidden(false);
  }, [reading]);

  // ---------- Interactions ----------
  const handleCharClick = (id: string) => {
    if (!isAnswered && !usedCharIds.includes(id)) {
      const char = hiraganaPool.find(item => item.id === id)?.char;
      if (char) {
        setSelectedChars(prev => [...prev, char]);
        setUsedCharIds(prev => [...prev, id]);
      }
    }
  };

  const handleRemoveLast = () => {
    if (!isAnswered && selectedChars.length > 0) {
      const removed = selectedChars[selectedChars.length - 1];
      setSelectedChars(prev => prev.slice(0, -1));

      const index = [...usedCharIds].reverse().findIndex(id => {
        const char = hiraganaPool.find(item => item.id === id)?.char;
        return char === removed;
      });

      if (index !== -1) {
        const trueIndex = usedCharIds.length - 1 - index;
        setUsedCharIds(prev => [...prev.slice(0, trueIndex), ...prev.slice(trueIndex + 1)]);
      }
    }
  };

  const handleCheck = () => {
    if (!isAnswered && selectedChars.length > 0) {
      const userKana = selectedChars.join('');
      const isCorrect = userKana === reading; // ✅ compare kana to kana
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
      setSelectedChars([]);
      speak(reading);
      markAnswer(false);
    }
  };

  const handleContinue = () => {
    setSelectedChars([]);
    setIsAnswered(false);
    setIsCorrectAnswer(null);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsTranslationHidden(false);
    setShowConfirmExit(false);
    sessionStorage.setItem('reload_count', '0');

    removeCurrentWord();
    if (words.length === 0) {
      navigate('/jp/summary');
    } else {
      const firstQuizType = getNextQuizType();
      navigate(`/jp/quiz/${firstQuizType}`, {
        state: { from: firstQuizType }
      });
    }
  };

  const handleToggle = () => {
    setIsPlaying(prev => !prev);
    setShowConfirmExit(true);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={word.id}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto p-10 relative min-h-screen">
          {/* Progress bar with runner */}
          <div className="relative w-full h-5">
            <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <img
              src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmichi.308739ad.png&w=96&q=75"
              alt="Runner"
              className="absolute -top-6 w-12 h-12 transition-all duration-300"
              style={{ left: `calc(${progress}% - 24px)` }}
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
            <h4 className="text-gray-600 mb-4">Chọn các ký tự hiragana để ghép cách đọc:</h4>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">{question}</h1>
            <div className="mb-4 h-15 w-[70%] mx-auto border border-gray-400 rounded-2xl px-4 text-3xl font-semibold tracking-widest text-gray-800 bg-slate-50 flex items-center justify-center text-center">
              {selectedChars.join('')}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {hiraganaPool.map(({ id, char }) => (
                <button
                  key={id}
                  id={id}
                  className="bg-slate-50 px-4 py-2 rounded-xl text-3xl hover:bg-slate-400 border-b-4 border border-slate-400 disabled:opacity-50"
                  onClick={() => handleCharClick(id)}
                  disabled={usedCharIds.includes(id)}
                >
                  {char}
                </button>
              ))}
              <button className="bg-red-400 px-4 py-2 rounded text-xl hover:bg-red-600" onClick={handleRemoveLast}>⌫</button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 p-8">
            <button
              className={`btn-primary ${selectedChars.length === 0 || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-80 px-6 py-2`}
              onClick={handleCheck}
              disabled={selectedChars.length === 0 || isAnswered}
            >
              Kiểm tra
            </button>
            <button className="btn-forget" onClick={handleForget} disabled={isAnswered}>Tôi ko nhớ từ này</button>
          </div>

          {(isAnswered || isForgetClicked) && !isResultHidden && (
            <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
              <div className="flex items-start justify-end mb-4 w-[90%] mx-auto">
                <button
                  className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green' : 'btn-toggle--red'} displayBtn`}
                  onClick={() => setIsResultHidden(true)}
                >
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
                    <p className="text-stone-50 text-2xl">
                      {word.example}
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
              <button
                className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green ' : 'btn-toggle--red'} hiddenBtn`}
                onClick={() => setIsResultHidden(false)}
              >
                <FontAwesomeIcon icon={faChevronUp} />
              </button>
              <div className="w-full text-center p-10">
                <button className="btn-primary btn-primary--active w-full" onClick={handleContinue}>Tiếp tục</button>
              </div>
            </div>
          )}
        </div>

        {showConfirmExit && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="relative bg-slate-50 p-6 rounded-t-2xl shadow-xl w-full text-center animate-slideUp space-y-4">
              <button
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
                onClick={() => setShowConfirmExit(false)}
                title="Đóng"
              >
                <FontAwesomeIcon icon={faCircleXmark} className="text-gray-700 text-4xl" />
              </button>

              <p className="text-2xl font-semibold text-gray-800 mb-10 mt-5">Bạn muốn ngừng ôn tập à?</p>

              <button
                onClick={() => {
                  console.log("Tiếp tục ôn tập");
                  setShowConfirmExit(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:brightness-110 text-stone-50 font-semibold transition"
              >
                <FaPlay className=" text-3xl" />
                Tiếp tục
              </button>

              <button
                onClick={() => navigate('/jp/summary')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full hover:brightness-110 text-gray-800 font-semibold transition border border-gray-300 border-b-10"
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

export default HiraganaPractice;
