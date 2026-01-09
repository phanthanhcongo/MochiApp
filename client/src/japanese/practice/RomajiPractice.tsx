import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession, speak } from '../utils/practiceStore';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import JpPracticeResultPanel from '../components/JpPracticeResultPanel';
import { showToast } from '../../components/Toast';
const RomajiPractice: React.FC = React.memo(() => {
  const [userRomajiAnswer, setUserRomajiAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [hasAccentWarning, setHasAccentWarning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const lastKeyPressRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
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

      const cleaned = userRomajiAnswer.trim().toLowerCase().replace(/\s+/g, '');
      const correctCleaned = correctRomaji.toLowerCase().replace(/\s+/g, '');
      const isCorrect = cleaned === correctCleaned;

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
    setHasAccentWarning(false);
    sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

    // Sử dụng method mới từ store để xử lý toàn bộ logic
    // console.log('📞 [RomajiPractice] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CHỈ xử lý nếu đang ở đúng route
      const currentPath = window.location.pathname;
      const isCorrectRoute = currentPath.includes('romajiPractice');
      if (!isCorrectRoute) return;

      // Ignore auto-repeat events when key is held down
      if (e.repeat) return;

      // F chỉ work khi đã answer/forget - để continue
      // Enter work khi: (1) đã answer/forget → continue, (2) có text → check
      if (e.key === 'Enter' || (e.key.toLowerCase() === 'f' && (isAnswered || isForgetClicked))) {
        console.log('handleKeyDown', e.key);
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
        // CHỈ check nếu có text VÀ chưa answer
        else if (userRomajiAnswer.trim() !== '' && !isAnswered) {
          handleCheck();
        }
        // Nếu chưa nhập gì → Thông báo
        else if (e.key === 'Enter') {
          showToast('Vui lòng nhập cách đọc romaji trước khi kiểm tra');
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
  // Component is always mounted, visibility handled by PracticeWrapper
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('romajiPractice');

  if (!currentWord || !isCorrectRoute) {
    return null;
  }

  const word = currentWord.word;

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className="h-full"
    >
      <div
        className="flex flex-col items-center h-full w-full overflow-x-hidden overflow-y-hidden"
        style={{
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex-1 flex flex-col justify-center w-full text-center">
          <h4 className="text-gray-600 mb-6 text-3xl">Nhập cách đọc romaji của từ sau:</h4>
          <h1 className="text-6xl font-bold text-gray-900 mb-10">{question}</h1>
          <div className="flex justify-center mb-4 w-[90%] mx-auto">
            <input
              type="text"
              className={`border rounded px-6 h-15 py-4 text-3xl text-center w-full max-w-lg ${hasAccentWarning ? 'border-red-500 bg-red-50' : 'border-gray-300'
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

          <div className="flex flex-col items-center gap-6 mt-10 w-full">
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

RomajiPractice.displayName = 'RomajiPractice';

export default RomajiPractice;
