import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { usePracticeSession } from "../utils/practiceStore";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import { API_URL } from '../../apiClient';
import EnglishPracticeResultPanel from '../components/EnglishPracticeResultPanel';

interface Choice {
  text: string;
  isCorrect: boolean;
}

const BLANK = "(   )";
const MIN_REVEAL_MS = 900; // đảm bảo người dùng kịp thấy panel kết quả

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
const uniq = (arr: string[]) => Array.from(new Set(arr));

const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const maskWordInSentence = (sentence: string, target: string) => {
  if (!sentence) return BLANK;
  if (!target) return sentence;

  // Thử thay đúng "từ biên" (word boundary)
  const re = new RegExp(`(\\b)${escapeReg(target)}\\b`, "i");
  if (re.test(sentence)) return sentence.replace(re, `$1${BLANK}`);

  // Fallback: chèn trống ~40% độ dài
  const idx = Math.floor(sentence.length * 0.4);
  return sentence.slice(0, idx) + ` ${BLANK} ` + sentence.slice(idx);
};

const MultipleSentence: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // Freeze từ hiện tại khi đã chấm điểm để UI không bị "nhảy"
  const [frozenWord, setFrozenWord] = useState<any>(null);
  const [canContinue, setCanContinue] = useState(false);
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

  // Route guard tương tự các màn khác
  useEffect(() => {
    const allowedSources = ["multiple", "voicePractice", "fillInBlank",  "multipleSentence"];
    const state = location.state as any;

    const storedRaw = localStorage.getItem("reviewed_words_english");
    const reviewed = storedRaw ? JSON.parse(storedRaw) : [];

    const reloadCountRaw = sessionStorage.getItem("reload_count");
    const reloadCount = reloadCountRaw ? parseInt(reloadCountRaw) : 0;
    const newReloadCount = reloadCount + 1;
    sessionStorage.setItem("reload_count", newReloadCount.toString());

    if (!state) {
      if (Array.isArray(reviewed) && reviewed.length > 0) navigate("/en/summary");
      else navigate("/en/home");
      return;
    }

    if (!allowedSources.includes(state.from)) {
      if (Array.isArray(reviewed) && reviewed.length > 0) navigate("/en/summary");
      else navigate("/en/home");
      return;
    }

    if (newReloadCount >= RELOAD_COUNT_THRESHOLD) {
      if (Array.isArray(reviewed) && reviewed.length > 0) navigate("/en/summary");
      else navigate("/en/home");
    }
  }, []);


  // Reset state mỗi khi đổi từ
  useEffect(() => {
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setSelectedIndex(null);
    setCanContinue(false);
    setFrozenWord(currentWord?.word || null);
    if (currentWord?.word?.word) speak(currentWord.word.word);
  }, [currentWord?.word?.id]);

  // Câu hỏi dạng sentence có chỗ trống
  const sentenceMasked = useMemo(() => {
    const s = currentWord?.word?.exampleEn || "";
    const w = currentWord?.word?.word || "";
    return maskWordInSentence(s, w);
  }, [currentWord?.word?.exampleEn, currentWord?.word?.word]);

  // Tạo 3 đáp án: 1 đúng là từ đích (word), 2 nhiễu từ các item còn lại
  const choices: Choice[] = useMemo(() => {
    if (!currentWord?.word?.word || allWords.length === 0) return [];
    const correctText = currentWord.word.word;

    const isOverlapping = (t1: string, t2: string) => {
      const s1 = t1.toLowerCase().trim();
      const s2 = t2.toLowerCase().trim();
      if (!s1 || !s2) return false;
      return s1.includes(s2) || s2.includes(s1);
    };

    const distractPool = uniq(
      allWords
        .filter(w => {
          const m = w.word;
          return w.id !== currentWord.word.id && m && !isOverlapping(m, correctText);
        })
        .map(w => w.word)
        .filter(Boolean) as string[]
    );

    const shuffledDistracts = shuffle(distractPool);
    const finalDistracts: string[] = [];
    
    for (const item of shuffledDistracts) {
      if (finalDistracts.length >= 2) break;
      if (!finalDistracts.some(existing => isOverlapping(item, existing))) {
        finalDistracts.push(item);
      }
    }

    if (finalDistracts.length < 2) {
      for (const item of shuffledDistracts) {
        if (finalDistracts.length >= 2) break;
        if (!finalDistracts.some(existing => existing === item)) {
          finalDistracts.push(item);
        }
      }
    }

    const base: Choice[] = [
      { text: correctText, isCorrect: true },
      ...finalDistracts.map(d => ({ text: d, isCorrect: false })),
    ];

    return shuffle(base);
  }, [currentWord?.word?.word, currentWord?.word?.id, allWords]);

  const speak = (text: string) => {
    if ("speechSynthesis" in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    }
  };

  const handleSelect = (idx: number) => {
    if (!isAnswered) setSelectedIndex(idx);
  };

  const handleCheck = () => {
    if (isAnswered || selectedIndex === null) return;

    const ok = choices[selectedIndex].isCorrect;
    setIsAnswered(true);
    setIsCorrectAnswer(ok);
    setIsForgetClicked(false);
    setCanContinue(false);

    // trì hoãn ghi điểm để tránh “giật” UI khi framer-motion đang animate
    requestAnimationFrame(() => {
      try {
        markAnswer(!!ok);
      } finally {
        setTimeout(() => setCanContinue(true), MIN_REVEAL_MS);
      }
    });

    if (currentWord?.word?.word) speak(currentWord.word.word);
  };

  const handleContinue = () => {
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setShowConfirmExit(false);
    setSelectedIndex(null);
    setCanContinue(false);
    sessionStorage.setItem("reload_count", "0");

    removeCurrentWord();
    if (words.length === 0) {
      navigate("/en/summary", { state: { reviewedWords } });
    } else {
      const nextType = getNextQuizType();
      navigate(`/en/quiz/${nextType}`, { state: { from: nextType } });
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
    if (isAnswered) return;
    setIsAnswered(false);
    setIsCorrectAnswer(false);
    setIsForgetClicked(true);
    setIsResultHidden(false);
    setSelectedIndex(null);
    if (currentWord?.word?.word) speak(currentWord.word.word);
  };

  const handleToggle = () => {
    setIsPlaying((prev) => !prev);
    setShowConfirmExit(true);
  };

  if (!currentWord) return null;

  // dùng snapshot đã “đóng băng” khi hiển thị kết quả
  const renderWord = (isAnswered || isForgetClicked) ? frozenWord : currentWord.word;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentWord.word.id}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.45 }}
        className="min-h-screen bg-gray-100 relative"
      >
        <div className="mx-auto p-10 ">
          {/* Progress + runner */}
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

          {/* Title + audio */}
     
          {/* Sentence card */}
          <div className="bg-slate-50 rounded-2xl border border-yellow-400 shadow p-6 mx-auto max-w-3xl mb-6">
            <p className="text-xl md:text-2xl text-center leading-relaxed">
              {sentenceMasked}
            </p>
          </div>

          {/* Answer options */}
          <div className="flex flex-col gap-3 mb-6">
            {choices.map((ans, idx) => {
              const isSelected = selectedIndex === idx;
              let statusClass = "answer-option--default";

              if (isAnswered || isForgetClicked) {
                if (ans.isCorrect) statusClass = "answer-option--correct";
                else if (isSelected) statusClass = "answer-option--wrong";
              } else if (isSelected) {
                statusClass = "answer-option--selected";
              }

              
              return (
                <button
                  key={idx}
                  className={`answer-option group ${statusClass}`}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-6 w-full">
                    <span className="option-index">
                      {idx + 1}
                    </span>
                    <div className="flex-1 text-center font-bold text-2xl pr-10">
                      {ans.text}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4 p-8">
            <button
              className={`btn-primary ${selectedIndex === null || isAnswered ? "btn-primary--disabled" : "btn-primary--check"} w-80 px-6 py-2`}
              onClick={handleCheck}
              disabled={selectedIndex === null || isAnswered}
            >
              Kiểm tra
            </button>
            <button className="btn-forget" onClick={handleForget} disabled={isAnswered}>
              Tôi ko nhớ từ này
            </button>
          </div>

          {/* Result Panel */}
          {currentWord && (
            <EnglishPracticeResultPanel
              isAnswered={isAnswered}
              isForgetClicked={isForgetClicked}
              isCorrectAnswer={isCorrectAnswer}
              isResultHidden={isResultHidden}
              setIsResultHidden={setIsResultHidden}
              onContinue={handleContinue}
              isNavigating={!canContinue}
              word={renderWord || currentWord.word}
              speak={speak}
            />
          )}
        </div>

        {/* Confirm Exit Bottom Sheet */}
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
                onClick={() => setShowConfirmExit(false)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:brightness-110 text-stone-50 font-semibold transition"
              >
                <FaPlay className="text-3xl" />
                Tiếp tục
              </button>

              <button
                onClick={() => navigate("/en/summary")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full hover:brightness-110 text-gray-800 font-semibold transition border border-gray-300"
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

export default MultipleSentence;
