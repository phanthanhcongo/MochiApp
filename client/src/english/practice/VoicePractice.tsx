import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { usePracticeSession } from '../utils/practiceStore';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import EnglishPracticeResultPanel from '../components/EnglishPracticeResultPanel';
import { HiSpeakerWave } from "react-icons/hi2";
import { showToast } from '../../components/Toast';

interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

const VoicePractice: React.FC = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const isProcessingRef = useRef(false);
  const lastKeyPressRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);
  const {
    currentWord,
    words,
    markAnswer,
    continueToNextQuiz,
    previousType,
    isNavigating
  } = usePracticeSession();



  useEffect(() => {
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'voicePractice', 'FillInBlankPractice'];
      const state = location.state;
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('voicePractice');

      if (!isCorrectRoute) return;

      const storedRaw = localStorage.getItem('reviewed_words_english');
      const reviewedWords = storedRaw ? JSON.parse(storedRaw) : [];

      const reloadCountRaw = sessionStorage.getItem('reload_count');
      const reloadCount = reloadCountRaw ? parseInt(reloadCountRaw) : 0;
      const newReloadCount = reloadCount + 1;
      sessionStorage.setItem('reload_count', newReloadCount.toString());
      // console.log(`Reload count: ${newReloadCount}`);

      if (!state) {
        // console.log('No state provided, redirecting to summary or home');
        if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
          navigate('/en/summary');
        } else {
          navigate('/en/home');
        }
        return;
      }

      if (!allowedSources.includes(state.from)) {
        // console.log(`Invalid source: ${state.from}, redirecting to summary or home`);
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





  const [answers, setAnswers] = useState<AnswerOption[]>([]);

  // Generate answer choices (1 correct + 2 incorrect) from scenarios
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

    // Shuffle and select 2 incorrect answers
    const finalIncorrects: AnswerOption[] = [];
    const shuffled = incorrects.sort(() => 0.5 - Math.random());

    for (const item of shuffled) {
      if (finalIncorrects.length >= 2) break;
      if (!finalIncorrects.some(existing => isOverlapping(item.text, existing.text))) {
        finalIncorrects.push(item);
      }
    }

    // If still not enough, relax constraints
    if (finalIncorrects.length < 2) {
      for (const item of shuffled) {
        if (finalIncorrects.length >= 2) break;
        if (!finalIncorrects.some(existing => existing.text === item.text)) {
          finalIncorrects.push(item);
        }
      }
    }

    // Ensure we always have 3 choices (1 correct + 2 incorrect)
    if (finalIncorrects.length < 2) {
      const placeholders = ['...', '...'];
      for (let i = finalIncorrects.length; i < 2; i++) {
        finalIncorrects.push({ text: placeholders[i] || '...', isCorrect: false });
      }
    }

    // Create array of 3 answers and shuffle
    const finalAnswers = [...finalIncorrects, correctAnswer].sort(() => 0.5 - Math.random());
    setAnswers(finalAnswers);
  }, [currentWord, words]);

  // useEffect to generate answers when currentWord ID changes
  useEffect(() => {
    if (currentWord) {
      generateAnswers();
    }
  }, [currentWord?.word.id]); // Only depend on ID to avoid unnecessary re-renders


  const handleSelect = (index: number) => {
    if (!isAnswered) setSelectedIndex(index);
  };

  const handleCheck = () => {
    if (selectedIndex !== null && !isAnswered) {
      const isCorrect = answers[selectedIndex].isCorrect;
      setIsAnswered(true);
      setIsCorrectAnswer(isCorrect);
      setIsForgetClicked(false);
      speak(reading);
      markAnswer(isCorrect);
    }
  };

  const handleContinue = async () => {
    if (isNavigating || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);

    // Timeout protection - reset after 5 seconds max
    const timeoutId = setTimeout(() => {
      isProcessingRef.current = false;
      // console.warn('Navigation timeout - forcing reset');
    }, 5000);
    sessionStorage.setItem('reload_count', '0'); // Reset to 0 before

    try {
      // Use new method from store to handle all logic
      await continueToNextQuiz(navigate, () => {
        clearTimeout(timeoutId);
        isProcessingRef.current = false;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      // console.error('Error in handleContinue:', error);
      isProcessingRef.current = false;
      showToast('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ONLY process if on correct route
      const currentPath = window.location.pathname;
      const isCorrectRoute = currentPath.includes('voicePractice');
      if (!isCorrectRoute) return;

      // Ignore auto-repeat events when key is held down
      if (e.repeat) return;

      if (e.key === 'Enter' || e.key.toLowerCase() === 'f') {
        const now = Date.now();
        // Prevent double-trigger: only process if at least 300ms has passed since last key press
        if (now - lastKeyPressRef.current < 300) {
          return;
        }
        lastKeyPressRef.current = now;

        // ONLY continue if already answered/forget
        if (isAnswered || isForgetClicked) {
          handleContinue();
        }
        // ONLY check if selected answer AND not answered
        else if (selectedIndex !== null && !isAnswered) {
          handleCheck();
        }
        // If nothing selected → Notify
        else {
          showToast('Vui lòng chọn đáp án trước khi kiểm tra');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, selectedIndex]);

  // Component is always mounted, visibility handled by PracticeWrapper
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('voicePractice');

  if (!currentWord || !isCorrectRoute) {
    return null;
  }

  // Only render when we have 3 answers ready
  if (answers.length !== 3) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải đáp án...</p>
        </div>
      </div>
    );
  }

  const word = currentWord.word;
  const reading = currentWord?.word.word || '';

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const handleForget = () => {
    if (!isAnswered) {
      setIsAnswered(false);
      setIsCorrectAnswer(false);
      setIsForgetClicked(true);
      setIsResultHidden(false);
      setSelectedIndex(null);
      markAnswer(false);
      speak(reading);
    }
  };

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className="h-full"
    >
      <div
        className="flex flex-col items-center justify-center h-full w-full overflow-x-hidden overflow-y-hidden"
        style={{
          willChange: 'transform, opacity',
        }}
      >
        {/* Question (Play sound instead of showing text) */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 w-full">
          <h4 className="text-gray-600 m-5 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl lg:text-3xl">Chọn đáp án đúng</h4>
          <div className="flex justify-center w-full"> {/* Add this div to center */}
            <button
              className="bg-slate-200 hover:bg-slate-600 p-8 w-28 h-28 rounded-full text-gray-800 hover:text-white transition duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
              onClick={() => speak(reading)}
              title="Phát âm từ"
            >
              <HiSpeakerWave className="text-5xl" />
            </button>
          </div>

        </div>
        {/* Answers */}
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

        {/* Check & Forget */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8 w-full">
          <button
            className={`btn-primary ${selectedIndex === null || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-full max-w-md px-6 py-3`}
            onClick={handleCheck}
            disabled={selectedIndex === null || isAnswered}
          >
            Kiểm tra
          </button>
          <button className="btn-forget text-lg" onClick={handleForget} disabled={isAnswered}>
            Tôi ko nhớ từ này
          </button>
        </div>
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
    </PracticeAnimationWrapper>
  );
});

VoicePractice.displayName = 'VoicePractice';

export default VoicePractice;
