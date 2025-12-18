import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { usePracticeSession } from "../utils/practiceStore";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaPause } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';

const BLANK = "(   )"; // dùng ký hiệu trống thống nhất

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\p{P}\p{S}]/gu, "") // bỏ dấu câu
    .replace(/\s+/g, " ")
    .trim();

const maskWordInSentence = (sentence: string, target: string) => {
  if (!sentence) return BLANK;
  if (!target) return sentence;

  // Tạo regex tách theo biên từ, không phân biệt hoa thường
  const re = new RegExp(`(\\b)${target.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
  if (re.test(sentence)) {
    return sentence.replace(re, `$1${BLANK}`);
  }

  // Nếu không tìm được từ đúng, fallback: chèn trống ở giữa câu (sau ~40% độ dài)
  const idx = Math.floor(sentence.length * 0.4);
  return sentence.slice(0, idx) + ` ${BLANK} ` + sentence.slice(idx);
};

const FillInBlankPractice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [inputValue, setInputValue] = useState("");

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

  useEffect(() => {
    const allowedSources = ["multiple", "voicePractice", "fillInBlank"]; // giữ giống VoicePractice
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

  const totalWords = words.length + (currentWord ? 1 : 0);

  useEffect(() => {
    // reset trạng thái khi đổi từ
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setInputValue("");
    if (currentWord?.word?.word) speak(currentWord.word.word);
  }, [currentWord?.word?.id]);

  const sentenceMasked = useMemo(() => {
    const s = currentWord?.word?.exampleEn || "";
    const w = currentWord?.word?.word || "";
    return maskWordInSentence(s, w);
  }, [currentWord?.word?.exampleEn, currentWord?.word?.word]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [sentenceMasked]);

  const speak = (text: string) => {
    if ("speechSynthesis" in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = () => {
    if (isAnswered) return;
    const expected = normalize(currentWord?.word?.word || "");
    const actual = normalize(inputValue);
    const ok = expected.length > 0 && expected === actual;

    setIsAnswered(true);
    setIsCorrectAnswer(ok);
    setIsForgetClicked(false);
    markAnswer(!!ok);
    if (currentWord?.word?.word) speak(currentWord.word.word);
  };

  const handleContinue = () => {
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    setShowConfirmExit(false);
    setInputValue("");
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
      if (e.key === 'Enter') {
        if (isAnswered || isForgetClicked) {
          handleContinue();
        } else if (inputValue.trim() !== '') {
          handleCheck();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, inputValue]);

  const handleForget = () => {
    if (isAnswered) return;
    setIsAnswered(false);
    setIsCorrectAnswer(false);
    setIsForgetClicked(true);
    setIsResultHidden(false);
    setInputValue("");
    if (currentWord?.word?.word) speak(currentWord.word.word);
  };

  const handleToggle = () => {
    setIsPlaying((prev) => !prev);
    setShowConfirmExit(true);
  };

  if (!currentWord) return null;
  const word = currentWord.word;

  const isResultShown = isAnswered || isForgetClicked;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={word.id}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen bg-gray-100 relative"
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full  mx-auto px-8 py-12">
          {/* progress bar + runner */}
          <div className="relative w-full h-5 mb-6">
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

          <div className="flex items-center justify-between w-full mb-8">
            <button
              className="bg-yellow-400 px-3 py-1 rounded-full flex items-center justify-center h-15 w-15 text-3xl text-slate-50"
              onClick={handleToggle}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <div className="text-xs">1 / {totalWords}</div>
          </div>

          {/* Title + audio trigger */}
          <div className="text-center mb-8 w-full">
            <h4 className="text-gray-600 mb-6 text-3xl">Điền từ còn thiếu</h4>
            <button
              className="bg-slate-200 hover:bg-slate-600 p-5 w-24 h-24 rounded-full text-3xl font-bold text-gray-800 transition"
              onClick={() => speak(word.word)}
              title="Phát âm từ"
            >
              🔊
            </button>
          </div>

          {/* Question sentence */}
          <div className="bg-slate-50 rounded-2xl border border-yellow-400 shadow p-8 mx-auto w-full max-w-3xl mb-8">
            <p className="text-2xl md:text-3xl text-center leading-relaxed mb-8">
              {sentenceMasked}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập đáp án bằng tiếng Anh"
                className="w-full max-w-lg px-6 py-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-400 text-2xl text-center"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isAnswered}
              />
              <button
                className={`btn-primary ${!inputValue || isAnswered ? "btn-primary--disabled" : "btn-primary--check"} w-full max-w-md px-6 py-3`}
                onClick={handleCheck}
                disabled={!inputValue || isAnswered}
              >
                Kiểm tra
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <button className="btn-forget text-lg" onClick={handleForget} disabled={isAnswered}>
                Tôi ko nhớ từ này
              </button>
            </div>
          </div>
        </div>

          {/* Result Panels */}
          {isResultShown && !isResultHidden && (
            <div className={isCorrectAnswer && !isForgetClicked ? "result-panel_true" : "result-panel_false"}>
              <div className="flex items-start justify-end mb-4 w-[90%] mx-auto">
                <button className={`btn-toggle ${isCorrectAnswer ? "btn-toggle--green" : "btn-toggle--red"} displayBtnEnglish`} onClick={() => setIsResultHidden(true)}>
                  <FontAwesomeIcon icon={faChevronDown} />
                </button>
              </div>
              <div className="flex items-start gap-4 mb-4 w-[90%] mx-auto">
                <div className="btn-audio text-2xl" onClick={() => speak(word.word)} title="Phát âm">🔊</div>
                <div>
                  <p className="text-4xl font-bold">{word.word}</p>
                  <p className="text-xl text-stone-50/90">{word.ipa}</p>
                  <p className="text-2xl text-stone-50/100 my-5">{word.meaning_vi}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-1 w-[90%] mx-auto">
                <button className="btn-audio text-2xl" onClick={() => speak(word.exampleEn || "")} title="Phát âm ví dụ">🔊</button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-stone-50 text-2xl">
                      {word.exampleEn}
                      <button className="btn-eye" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                        {isTranslationHidden ? "🙈" : "👁"}
                      </button>
                    </p>
                  </div>
                  <p className={`text-stone-50/90 mt-6 text-xl ${isTranslationHidden ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                    {word.exampleVi}
                  </p>
                </div>
              </div>
              <div className="w-80 mx-auto mt-6">
                <button className="btn-primary btn-primary--active w-full" onClick={handleContinue}>Tiếp tục</button>
              </div>
            </div>
          )}

          {isResultShown && isResultHidden && (
            <div className={isCorrectAnswer && !isForgetClicked ? "result-panel_true" : "result-panel_false"}>
              <button className={`btn-toggle ${isCorrectAnswer ? "btn-toggle--green" : "btn-toggle--red"} hiddenBtn`} onClick={() => setIsResultHidden(false)}>
                <FontAwesomeIcon icon={faChevronUp} />
              </button>
              <div className=" text-center  p-10">
                <button className="btn-primary btn-primary--active w-full" onClick={handleContinue}>Tiếp tục</button>
              </div>
            </div>
          )}

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
                onClick={() => {
                  setShowConfirmExit(false);
                }}
                className="w-full flex items-center  justify-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:brightness-110 text-stone-50 font-semibold transition"
              >
                <FaPlay className=" text-3xl" />
                Tiếp tục
              </button>

              <button
                onClick={() => navigate("/en/summary")}
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

export default FillInBlankPractice;
