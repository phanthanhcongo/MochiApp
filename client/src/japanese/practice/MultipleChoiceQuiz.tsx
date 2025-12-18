import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import PracticeAnimationWrapper from '../../components/PracticeAnimationWrapper';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
import JpPracticeResultPanel from '../components/JpPracticeResultPanel';



const MultipleChoiceQuiz: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ text: string; isCorrect: boolean }>>([]);

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
    isNavigating: storeIsNavigating,
    previousType,
    scenarios,
    randomAnswers,
  } = usePracticeSession();

  // Function để tạo mảng 3 đáp án (1 đúng + 2 sai) chỉ từ scenarios
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

    let incorrects: Array<{ text: string; isCorrect: boolean }> = [];

    // Lấy từ danh sách word review (scenarios)
    if (scenarios.length > 0) {
      incorrects = scenarios
        .filter(s => {
          const m = s.word.meaning_vi;
          return s.word.id !== currentWord.word.id && m && !isOverlapping(m, correctAnswerText);
        })
        .map(s => ({
          text: s.word.meaning_vi || '',
          isCorrect: false,
        }))
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
        .sort(() => Math.random() - 0.5); // Shuffle randomAnswers
      
      incorrects = [...incorrects, ...additionalIncorrects];
    }

    // Shuffle và lấy 2 incorrect answers
    // Đảm bảo các incorrect answers cũng không overlap lẫn nhau
    const finalIncorrects: Array<{ text: string; isCorrect: boolean }> = [];
    const shuffled = incorrects.sort(() => Math.random() - 0.5);
    
    for (const item of shuffled) {
      if (finalIncorrects.length >= 2) break;
      if (!finalIncorrects.some(existing => isOverlapping(item.text, existing.text))) {
        finalIncorrects.push(item);
      }
    }

    // Nếu vẫn không đủ 2, lấy bất kỳ ai chưa có (nới lỏng điều kiện nếu quá ít data)
    if (finalIncorrects.length < 2) {
        for (const item of shuffled) {
            if (finalIncorrects.length >= 2) break;
            if (!finalIncorrects.some(existing => existing.text === item.text)) {
                finalIncorrects.push(item);
            }
        }
    }

    // Đảm bảo luôn có 3 lựa chọn (1 correct + 2 incorrect)
    if (finalIncorrects.length < 2) {
      const placeholders = ['...', '...'];
      for (let i = finalIncorrects.length; i < 2; i++) {
        finalIncorrects.push({ text: placeholders[i] || '...', isCorrect: false });
      }
    }

    // Tạo mảng 3 đáp án và shuffle
    const finalAnswers = [correctAnswer, ...finalIncorrects].sort(() => Math.random() - 0.5);
    setAnswers(finalAnswers);
  }, [currentWord, scenarios, randomAnswers]);

  // useEffect để tạo đáp án khi currentWord ID thay đổi
  useEffect(() => {
    if (currentWord) {
      generateAnswers();
    }
  }, [currentWord?.word.id]); // Chụp dependency theo ID để tránh render lại vô ích
  useEffect(() => {
    // Đợi một chút để đảm bảo location.state đã được set đúng cách sau khi navigate
    const checkState = setTimeout(() => {
      const allowedSources = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];
      const state = location.state;

      // Kiểm tra xem có đang ở đúng route không
      const currentPath = location.pathname;
      const isCorrectRoute = currentPath.includes('multiple');

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
      const stateFromMatchesRoute = state.from === 'multiple';

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
    console.log('📞 [MultipleChoiceQuiz] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
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
      setSelectedIndex(null);
      speak(currentWord?.word.reading_hiragana || ""); // Phát âm khi chọn "Tôi không nhớ từ này"
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

  // Ẩn component ngay khi đang navigate hoặc không phải quiz type hiện tại
  // Điều này ngăn component cũ render trong nháy mắt khi chuyển quiz type
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('multiple');
  
  // Nếu đang navigate hoặc previousType đã được set thành type khác → ẩn component
  // previousType được set ngay lập tức trong navigateToQuiz để chặn render của type cũ
  const shouldHide = storeIsNavigating || (previousType && previousType !== 'multiple');
  
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

  // Chỉ render khi đã có đủ 3 đáp án sẵn sàng
  if (answers.length !== 3) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
      markAnswer(isCorrect);
      speak(currentWord?.word.reading_hiragana || '');

    }
  };

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className="w-full flex items-center justify-center max-h-screen overflow-y-auto"
    >
        <div className="flex flex-col items-center justify-center w-full mx-auto px-8 py-12">
          <div className="text-center pb-10 w-full">
            <h4 className="text-gray-600 mb-4 text-3xl">Chọn đúng nghĩa của từ</h4>
            <h1 className="text-7xl font-bold text-gray-900">{word.kanji}</h1>
          </div>
          <div className="flex flex-col gap-4 mb-8 w-full ">
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
          <div className="flex flex-col items-center gap-6 p-8 w-full">
            <button
              className={`btn-primary ${selectedIndex === null || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-full max-w-md px-6 py-3`}
              onClick={handleCheck}
              disabled={selectedIndex === null || isAnswered}>
              Kiểm tra
            </button>
            <button className="btn-forget text-lg" onClick={handleForget} disabled={isAnswered}>
              Tôi ko nhớ từ này
            </button>
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
};

export default MultipleChoiceQuiz;
