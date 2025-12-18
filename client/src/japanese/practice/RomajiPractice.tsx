import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
const RomajiPractice: React.FC = () => {
  const [userRomajiAnswer, setUserRomajiAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [hasAccentWarning, setHasAccentWarning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
    isNavigating: storeIsNavigating,
    previousType,
  } = usePracticeSession();

  const question = currentWord?.word.kanji || '';
  const reading = currentWord?.word.reading_hiragana || '';
  const correctRomaji = currentWord?.word.reading_romaji || '';

  useEffect(() => {
    // Đợi một chút để đảm bảo location.state đã được set đúng cách sau khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice'];
      const state = location.state;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('romajiPractice');
      
      // Nếu không ở đúng route, không làm gì cả (có thể đang navigate đi)
      if (!isCorrectRoute) {
        return;
      }

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
      // Kiểm tra xem state.from có khớp với route hiện tại không
      const stateFromMatchesRoute = state.from === 'romajiPractice';
      
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

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      speechSynthesis.speak(utterance);
    }
  };

  const hasVietnameseAccents = (text: string): boolean => {
    // Regex để kiểm tra ký tự có dấu tiếng Việt
    const vietnameseAccentRegex = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;
    return vietnameseAccentRegex.test(text);
  };

  const handleCheck = () => {
    if (!isAnswered && userRomajiAnswer.trim()) {
      // Kiểm tra nếu có dấu tiếng Việt thì không cho submit
      if (hasVietnameseAccents(userRomajiAnswer)) {
        setHasAccentWarning(true);
        return;
      }
      
      const cleaned = userRomajiAnswer.trim().toLowerCase();
      const isCorrect = cleaned === correctRomaji;

      setIsAnswered(true);
      setIsCorrectAnswer(isCorrect);
      setIsForgetClicked(false);
      setHasAccentWarning(false);
      speak(reading);
      markAnswer(isCorrect);
    }
  };

  const handleContinue = async () => {
    if (isNavigating || isProcessingRef.current) return; // Ngăn chặn gọi nhiều lần
    
    isProcessingRef.current = true;
    setIsNavigating(true);
    setUserRomajiAnswer('');
    setIsAnswered(false);
    setIsCorrectAnswer(null);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsTranslationHidden(false);
    setHasAccentWarning(false);
    sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

    // Sử dụng method mới từ store để xử lý toàn bộ logic
    console.log('📞 [RomajiPractice] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isAnswered || isForgetClicked) {
          handleContinue();
        } else if (userRomajiAnswer.trim() !== '') {
          handleCheck();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, userRomajiAnswer]);

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
  // Ẩn component ngay khi đang navigate hoặc không phải quiz type hiện tại
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('romajiPractice');
  const shouldHide = storeIsNavigating || (previousType && previousType !== 'romajiPractice');
  
  // Đồng bộ exit animation với state updates
  useEffect(() => {
    if (shouldHide && !isExiting) {
      setIsExiting(true);
      exitTimeoutRef.current = setTimeout(() => {
        // Component sẽ được unmount bởi shouldHide check
      }, 400);
    } else if (!shouldHide && isExiting) {
      setIsExiting(false);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [shouldHide, isExiting]);
  
  if (!currentWord || shouldHide || !isCorrectRoute) {
    return null;
  }
  
  const word = currentWord.word;

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className=""
    >
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto px-8 py-12">
          <div className="text-center w-full">
            <h4 className="text-gray-600 mb-6 text-3xl">Nhập cách đọc romaji của từ sau:</h4>
            <h1 className="text-6xl font-bold text-gray-900 mb-10">{question}</h1>
            <div className="flex justify-center mb-4">
              <input
                type="text"
                className={`border rounded px-6 py-4 text-3xl text-center w-full max-w-lg ${
                  hasAccentWarning ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="ví dụ: shiji"
                value={userRomajiAnswer}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserRomajiAnswer(value);
                  // Kiểm tra và cập nhật cảnh báo khi người dùng nhập
                  if (value.trim() && hasVietnameseAccents(value)) {
                    setHasAccentWarning(true);
                  } else {
                    setHasAccentWarning(false);
                  }
                }}
                disabled={isAnswered}
              />
            </div>
            {hasAccentWarning && (
              <p className="text-red-500 text-lg mt-3">⚠️ Romaji không được chứa dấu tiếng Việt</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-6 p-8 w-full">
            <button
              className={`btn-primary ${!userRomajiAnswer || isAnswered || hasAccentWarning ? 'btn-primary--disabled' : 'btn-primary--check'} w-full max-w-md px-6 py-3`}
              onClick={handleCheck}
              disabled={!userRomajiAnswer || isAnswered || hasAccentWarning}
            >
              Kiểm tra
            </button>
            <button className="btn-forget text-lg" onClick={handleForget} disabled={isAnswered}>Tôi ko nhớ từ này</button>
          </div>
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
                    <button 
                      className="btn-primary btn-primary--active w-full" 
                      onClick={handleContinue}
                      disabled={isNavigating}
                    >
                      {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
                    </button>
                  </div>
                </div>
              )}

              {(isAnswered || isForgetClicked) && isResultHidden && (
                <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
                  <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green ' : 'btn-toggle--red'} hiddenBtn`} onClick={() => setIsResultHidden(false)}>
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                  <div className="w-full text-center p-10">
                    <button 
                      className="btn-primary btn-primary--active w-full" 
                      onClick={handleContinue}
                      disabled={isNavigating}
                    >
                      {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
                    </button>
                  </div>
                </div>
              )}
    </PracticeAnimationWrapper>
  );
};

export default RomajiPractice;
