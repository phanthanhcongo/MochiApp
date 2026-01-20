import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { usePracticeSession, speak } from '../utils/practiceStore';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import JpPracticeResultPanel from '../components/JpPracticeResultPanel';
import { HiSpeakerWave } from "react-icons/hi2";
import { showToast } from '../../components/Toast';

interface AnswerOption {
  text: string;
  isCorrect: boolean;
}


const VoicePractice: React.FC = React.memo(() => {

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const lastKeyPressRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);
  const [answers, setAnswers] = useState<AnswerOption[]>([]);
  const lastProcessedWordIdRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('voicePractice');

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
    previousType,
    scenarios,
    randomAnswers,
    isGettingNextType: storeIsGettingNextType,
  } = usePracticeSession();

  // useEffect để tạo đáp án CHỈ MỘT LẦN khi currentWord ID thay đổi
  useEffect(() => {
    if (!currentWord || currentWord.word.id === lastProcessedWordIdRef.current) {
      return;
    }

    // Đánh dấu word này đã được xử lý
    lastProcessedWordIdRef.current = currentWord.word.id;

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

    // Lấy từ danh sách word review (scenarios)
    if (scenarios.length > 0) {
      incorrects = scenarios
        .filter(s => {
          const m = s.word.meaning_vi;
          return s.word.id !== currentWord.word.id && m && !isOverlapping(m, correctAnswerText);
        })
        .map(s => ({ text: s.word.meaning_vi || '', isCorrect: false }))
        .filter(v => v.text !== '')
        .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i);
    }

    // Nếu không đủ 2 đáp án sai từ scenarios, lấy thêm từ randomAnswers
    if (incorrects.length < 2 && randomAnswers.length > 0) {
      const additionalIncorrects = randomAnswers
        .filter(r => {
          const m = r.meaning_vi;
          return m && !isOverlapping(m, correctAnswerText) && !incorrects.some(inc => isOverlapping(m, inc.text));
        })
        .map(r => ({
          text: r.meaning_vi,
          isCorrect: false,
        }))
        .filter(v => v.text !== '')
        .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i)
        .filter(item => !incorrects.find(existing => existing.text === item.text))
        .sort(() => Math.random() - 0.5); // Shuffle để đảm bảo đáp án ngẫu nhiên

      incorrects = [...incorrects, ...additionalIncorrects];
    }

    // Chọn 2 incorrect answers - shuffle trước để ngẫu nhiên
    const shuffledIncorrects = incorrects.sort(() => Math.random() - 0.5);
    const finalIncorrects: AnswerOption[] = [];

    for (const item of shuffledIncorrects) {
      if (finalIncorrects.length >= 2) break;
      if (!finalIncorrects.some(existing => isOverlapping(item.text, existing.text))) {
        finalIncorrects.push(item);
      }
    }

    // Nếu vẫn không đủ 2, nới lỏng điều kiện
    if (finalIncorrects.length < 2) {
      for (const item of shuffledIncorrects) {
        if (finalIncorrects.length >= 2) break;
        if (!finalIncorrects.some(existing => existing.text === item.text)) {
          finalIncorrects.push(item);
        }
      }
    }

    // Đảm bảo luôn có 3 lựa chọn (1 correct + 2 incorrect) với placeholder có nghĩa
    if (finalIncorrects.length < 2) {
      const fallbackAnswers = [
        'Không nhớ', 'Chưa học', 'Không biết', 'Quên rồi', 'Bỏ qua',
        'Không rõ', 'Chưa rõ', 'Không chắc', 'Cần xem lại', 'Khác'
      ].filter(p => !isOverlapping(p, correctAnswerText) && !finalIncorrects.some(inc => inc.text === p));

      const shuffledFallbacks = fallbackAnswers.sort(() => Math.random() - 0.5);
      for (let i = finalIncorrects.length; i < 2; i++) {
        finalIncorrects.push({ text: shuffledFallbacks[i - finalIncorrects.length] || '...', isCorrect: false });
      }
    }

    // Tạo mảng 3 đáp án và shuffle 1 lần khi render
    const finalAnswers = [correctAnswer, ...finalIncorrects].sort(() => Math.random() - 0.5);
    setAnswers(finalAnswers);
  }, [currentWord, scenarios, randomAnswers]);


  useEffect(() => {
    // Đợi một chút để đảm bảo location.state đã được set đúng cách sau khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice'];
      const state = location.state;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('voicePractice');

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
      const stateFromMatchesRoute = state.from === 'voicePractice';

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
          console.log(newReloadCount);
          navigate('/jp/summary');
        } else {
          navigate('/jp/home');
        }
      }
    }, 100);

    return () => clearTimeout(checkState);
  }, [location.state, location.pathname, navigate]);




  const reading = currentWord?.word.reading_hiragana || '';

  useEffect(() => {
    // Chỉ speak khi đang ở đúng route VoicePractice
    // Và KHÔNG đang trong quá trình lấy từ mới (để tránh speak từ tiếp theo trước khi chuyển cảnh)
    if (reading && currentPath.includes('voicePractice') && !storeIsGettingNextType) {
      speak(reading);
    }
  }, [reading, currentPath, storeIsGettingNextType]);



  const handleContinue = async () => {
    if (isNavigating || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsNavigating(true);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

    // Sử dụng method mới từ store để xử lý toàn bộ logic
    // console.log('📞 [VoicePractice] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CHỈ xử lý nếu đang ở đúng route
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

        // CHỈ continue nếu đã answer/forget
        if (isAnswered || isForgetClicked) {
          handleContinue();
        }
        // CHỈ check nếu đã chọn đáp án VÀ chưa answer
        else if (selectedIndex !== null && !isAnswered) {
          handleCheck();
        }
        // Nếu chưa chọn gì → Thông báo
        else {
          showToast('Vui lòng chọn đáp án trước khi kiểm tra');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, selectedIndex]);

  // Component is always mounted, visibility handled by PracticeWrapper


  if (!currentWord || !isCorrectRoute) {
    return null;
  }

  // Chỉ render khi đã có đủ 3 đáp án sẵn sàng
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
        className="flex flex-col items-center h-full w-full overflow-x-hidden overflow-y-hidden"
        style={{
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex-1 flex flex-col justify-center w-full max-w-4xl">
          {/* Question (Phát âm thay vì hiển thị chữ) */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 w-full">
            <h4 className="text-gray-600 m-5 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl lg:text-3xl">Chọn đáp án đúng</h4>
            <div className="flex justify-center w-full"> {/* Thêm div này để căn giữa */}
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

          <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 mt-6 w-full">
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

VoicePractice.displayName = 'VoicePractice';

export default VoicePractice;
