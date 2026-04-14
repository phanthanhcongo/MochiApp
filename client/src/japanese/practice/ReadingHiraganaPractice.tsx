import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession, speak } from '../utils/usePracticeStore';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import PracticeResultPanel from '../components/PracticeResultPanel';
import { showToast } from '../../components/Toast';

const ReadingHiraganaPractice: React.FC = () => {
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
  const [focusedIdx, setFocusedIdx] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // --------- Guard navigation & reload logic ----------
  useEffect(() => {
    // Đợi một chút để đảm bảo location.state đã được set đúng cách sau khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'ReadingHiraganaPractice', 'TypingRomajiPractice', 'voicePractice'];
      const state = location.state as { from?: string } | null;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('ReadingHiraganaPractice');

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
      const stateFromMatchesRoute = state.from === 'ReadingHiraganaPractice';

      if (!state.from || !allowedSources.includes(state.from)) {
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
    setFocusedIdx(0);
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
    // console.log('📞 [ReadingHiraganaPractice] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
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

  // Helper to find the next available (non-used) index in a given direction
  const findNextAvailableIdx = useCallback((from: number, direction: 1 | -1): number => {
    if (hiraganaPool.length === 0) return 0;
    let idx = from;
    for (let i = 0; i < hiraganaPool.length; i++) {
      idx = (idx + direction + hiraganaPool.length) % hiraganaPool.length;
      if (!usedCharIds.includes(hiraganaPool[idx].id)) {
        return idx;
      }
    }
    return from; // All used, stay put
  }, [hiraganaPool, usedCharIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CHỈ xử lý nếu đang ở đúng route
      const currentPath = window.location.pathname;
      const isCorrectRoute = currentPath.includes('ReadingHiraganaPractice');
      if (!isCorrectRoute) return;

      // --- j/l navigation (allow repeat for smooth movement) ---
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setFocusedIdx(prev => findNextAvailableIdx(prev, -1));
        return;
      }
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setFocusedIdx(prev => findNextAvailableIdx(prev, 1));
        return;
      }

      // Ignore auto-repeat for all other keys
      if (e.repeat) return;

      // --- "q" to pick the focused character ---
      if (e.key.toLowerCase() === 'd' && !isAnswered && !isForgetClicked) {
        const item = hiraganaPool[focusedIdx];
        if (item && !usedCharIds.includes(item.id)) {
          setSelectedChars(prev => [...prev, item.char]);
          setUsedCharIds(prev => [...prev, item.id]);
          // Auto-advance focus to next available
          setFocusedIdx(prev => findNextAvailableIdx(prev, 1));
        }
        return;
      }

      // --- p to remove last character ---
      if (e.key.toLowerCase() === 'i' && !isAnswered) {
        e.preventDefault();
        handleRemoveLast();
        return;
      }

      // --- "*" to forget ---
      if (e.key === '*' && !isAnswered) {
        handleForget();
        return;
      }

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
  }, [isAnswered, isForgetClicked, selectedChars, hiraganaPool, usedCharIds, focusedIdx, findNextAvailableIdx]);

  // Component is always mounted, visibility handled by PracticeWrapper
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('ReadingHiraganaPractice');

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
          <h4 className="text-gray-600 mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">Chọn các ký tự hiragana để ghép cách đọc:</h4>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">{question}</h1>
          <div className="mb-4 sm:mb-6 h-12 lg:h-14 w-[90%] mx-auto border border-gray-400 rounded-lg sm:rounded-xl px-2 sm:px-3 text-2xl font-semibold tracking-widest text-gray-800 bg-slate-50 flex items-center justify-center text-center">
            {selectedChars.join('')}
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5 w-[99%] mx-auto justify-center mb-3 sm:mb-4">
            {hiraganaPool.map(({ id, char }, idx) => {
              const isFocused = idx === focusedIdx;
              return (
                <button
                  key={id}
                  id={id}
                  className={`bg-slate-50 px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-2xl hover:bg-slate-400 border-b-2 sm:border-b-3 border disabled:opacity-50 transition-all duration-150 ${
                    isFocused
                      ? 'border-blue-500 ring-2 ring-blue-400 scale-110 bg-blue-50'
                      : 'border-slate-400'
                  }`}
                  onClick={() => handleCharClick(id)}
                  disabled={usedCharIds.includes(id)}
                >
                  {char}
                </button>
              );
            })}
            <button className="bg-red-400 px-3 py-1 sm:py-1.5 md:py-2 rounded-lg text-lg hover:bg-red-600" onClick={handleRemoveLast}>⌫</button>
          </div>

          <div className="flex flex-col items-center gap-2 sm:gap-3 mt-6 w-full">
            <button
              className={`btn-primary ${selectedChars.length === 0 || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-full max-w-sm px-4 py-2`}
              onClick={handleCheck}
              disabled={selectedChars.length === 0 || isAnswered}
            >
              Kiểm tra
            </button>
            <button className="btn-forget text-xs sm:text-sm" onClick={handleForget} disabled={isAnswered}>Tôi ko nhớ từ này</button>
          </div>
        </div>
      </div>

      <PracticeResultPanel
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
};

export default ReadingHiraganaPractice;



