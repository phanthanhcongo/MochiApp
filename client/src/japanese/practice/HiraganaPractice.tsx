import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import JpPracticeResultPanel from '../components/JpPracticeResultPanel';
import { showToast } from '../../components/Toast';

const HiraganaPractice: React.FC = React.memo(() => {
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const lastKeyPressRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);

  const [hiraganaPool, setHiraganaPool] = useState<{ id: string; char: string }[]>([]);
  const [usedCharIds, setUsedCharIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // --------- Guard navigation & reload logic ----------
  useEffect(() => {
    // Đợi một chút để đảm bảo location.state đã được set đúng cách sau khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice'];
      const state = location.state as any;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('hiraganaPractice');

      // Nếu không ở đúng route, không làm gì cả (có thể đang navigate đi)
      if (!isCorrectRoute) {
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
      const stateFromMatchesRoute = state.from === 'hiraganaPractice';

      if (!allowedSources.includes(state.from)) {
        // Chỉ navigate nếu state.from không khớp với route hiện tại
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
  }, [location.state, location.pathname, navigate]);

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
    previousType,
  } = usePracticeSession();

  // Định nghĩa reading với optional chaining để dùng trong useEffect
  const reading = currentWord?.word.reading_hiragana || '';

  // ---------- Speech synthesis (robust) ----------
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // stop any ongoing speech
      } catch { }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  };

  // ---------- Build choice pool directly from kana (fixes っ, ゃ/ゅ/ょ, etc.) ----------
  useEffect(() => {
    if (!reading) return;

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
  }, [reading]);

  const handleContinue = async () => {
    if (isNavigating || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsNavigating(true);
    setSelectedChars([]);
    setIsAnswered(false);
    setIsCorrectAnswer(null);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    sessionStorage.setItem('reload_count', '0');

    // Sử dụng method mới từ store để xử lý toàn bộ logic
    // console.log('📞 [HiraganaPractice] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CHỈ xử lý nếu đang ở đúng route
      const currentPath = window.location.pathname;
      const isCorrectRoute = currentPath.includes('hiraganaPractice');
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

        // CHỈ continue nếu đã answer/forget
        if (isAnswered || isForgetClicked) {
          handleContinue();
        }
        // CHỈ check nếu đã chọn ký tự VÀ chưa answer
        else if (selectedChars.length > 0 && !isAnswered) {
          handleCheck();
        }
        // Nếu chưa chọn gì → Thông báo
        else {
          showToast('Vui lòng chọn các ký tự hiragana trước khi kiểm tra');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, selectedChars]);

  // Component is always mounted, visibility handled by PracticeWrapper
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('hiraganaPractice');

  if (!currentWord || !isCorrectRoute) {
    return null;
  }

  // Sau khi check, currentWord chắc chắn không null
  const word = currentWord.word;
  const question = word.kanji || '';

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

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className="w-full h-full"
    >
      <div
        className="flex flex-col items-center h-full w-full overflow-x-hidden overflow-y-hidden"
        style={{
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex-1 flex flex-col justify-center w-full text-center">
          <h4 className="text-gray-600 mb-3 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl lg:text-3xl">Chọn các ký tự hiragana để ghép cách đọc:</h4>
          <h1 className="text-6xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8 lg:mb-10">{question}</h1>
          <div className="mb-4 sm:mb-6 md:mb-8 h-18 lg:h-20 w-[90%] mx-auto border border-gray-400 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 text-4xl font-semibold tracking-widest text-gray-800 bg-slate-50 flex items-center justify-center text-center">
            {selectedChars.join('')}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 w-[99%] mx-auto justify-center mb-4 sm:mb-5 md:mb-6">
            {hiraganaPool.map(({ id, char }) => (
              <button
                key={id}
                id={id}
                className="bg-slate-50 px-5  lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-4xl hover:bg-slate-400 border-b-2 sm:border-b-3 md:border-b-4 border border-slate-400 disabled:opacity-50"
                onClick={() => handleCharClick(id)}
                disabled={usedCharIds.includes(id)}
              >
                {char}
              </button>
            ))}
            <button className="bg-red-400 px-2.5 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-lg sm:text-xl md:text-2xl hover:bg-red-600" onClick={handleRemoveLast}>⌫</button>
          </div>

          <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 mt-8 w-full">
            <button
              className={`btn-primary ${selectedChars.length === 0 || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-full max-w-md px-6 py-3`}
              onClick={handleCheck}
              disabled={selectedChars.length === 0 || isAnswered}
            >
              Kiểm tra
            </button>
            <button className="btn-forget text-lg" onClick={handleForget} disabled={isAnswered}>Tôi ko nhớ từ này</button>
          </div>
        </div>
      </div>

      <JpPracticeResultPanel
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

HiraganaPractice.displayName = 'HiraganaPractice';

export default HiraganaPractice;
