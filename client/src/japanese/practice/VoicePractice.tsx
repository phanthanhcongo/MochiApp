import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import PracticeAnimationWrapper from '../components/PracticeAnimationWrapper';
import { usePracticeSession } from '../utils/practiceStore';
import { RELOAD_COUNT_THRESHOLD } from '../utils/practiceConfig';
interface AnswerOption {
  text: string;
  isCorrect: boolean;
}


const VoicePractice: React.FC = () => {
  
   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isResultHidden, setIsResultHidden] = useState(false);
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);
  const [isForgetClicked, setIsForgetClicked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isProcessingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const [allWords, setAllWords] = useState<any[]>([]);

  const isResultShown = isAnswered || isForgetClicked;
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentWord,
    markAnswer,
    continueToNextQuiz,
    isNavigating: storeIsNavigating,
    previousType,
  } = usePracticeSession();

  // Fetch all words from database
  useEffect(() => {
    const fetchAllWords = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/jp/practice/listWord', {
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
    
    if(newReloadCount >= RELOAD_COUNT_THRESHOLD){
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
  const correctAnswer = currentWord?.word.meaning_vi || '';

  const speak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      if (speechSynthesis.speaking) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      speechSynthesis.speak(utterance);
    }
  };

  const answers: AnswerOption[] = useMemo(() => {
    if (!correctAnswer) return [];
    
    let incorrects: AnswerOption[] = [];
    
    // Lấy từ tất cả words trong database
    incorrects = allWords
      .filter(w => w.meaning_vi && w.meaning_vi !== correctAnswer)
      .map(w => ({ text: w.meaning_vi, isCorrect: false }))
      .filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i);

    // Shuffle và lấy 2 incorrect answers
    const shuffled = incorrects.sort(() => 0.5 - Math.random());
    let selectedIncorrects = shuffled.slice(0, 2);
    
    // Nếu không đủ 2, lặp lại từ danh sách để đảm bảo có đủ (nhưng vẫn unique)
    if (selectedIncorrects.length < 2 && shuffled.length > 0) {
      // Lặp lại từ danh sách có sẵn nhưng đảm bảo unique
      const maxAttempts = 10; // Tránh infinite loop
      let attempts = 0;
      while (selectedIncorrects.length < 2 && attempts < maxAttempts) {
        const randomItem = shuffled[Math.floor(Math.random() * shuffled.length)];
        if (!selectedIncorrects.find(item => item.text === randomItem.text)) {
          selectedIncorrects.push(randomItem);
        }
        attempts++;
      }
    }

    // Đảm bảo luôn có 3 lựa chọn (1 correct + 2 incorrect)
    // Nếu vẫn không đủ, tạo placeholder
    if (selectedIncorrects.length < 2) {
      const placeholders = ['...', '...'];
      for (let i = selectedIncorrects.length; i < 2; i++) {
        selectedIncorrects.push({ text: placeholders[i] || '...', isCorrect: false });
      }
    }

    return [...selectedIncorrects, { text: correctAnswer, isCorrect: true }].sort(() => 0.5 - Math.random());
  }, [allWords, correctAnswer]);

  // Ẩn component ngay khi đang navigate hoặc không phải quiz type hiện tại
  const currentPath = location.pathname;
  const isCorrectRoute = currentPath.includes('voicePractice');
  const shouldHide = storeIsNavigating || (previousType && previousType !== 'voicePractice');
  
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

  const handleContinue = async () => {
    if (isNavigating || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsNavigating(true);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsResultHidden(false);
    setIsTranslationHidden(false);
    setIsForgetClicked(false);
    setIsCorrectAnswer(null);
    sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

    // Sử dụng method mới từ store để xử lý toàn bộ logic
    console.log('📞 [VoicePractice] GỌI continueToNextQuiz', { timestamp: new Date().toISOString() });
    await continueToNextQuiz(navigate, () => {
      setIsNavigating(false);
      isProcessingRef.current = false;
    });
  };

  return (
    <PracticeAnimationWrapper
      keyValue={`${word.id}-${previousType || 'none'}`}
      isExiting={isExiting}
      onExitComplete={() => setIsExiting(false)}
      className=""
    >
      {/* Question */}
      {/* Question (Phát âm thay vì hiển thị chữ) */}
      <div className="text-center mb-6">
  <h4 className="text-gray-600 mb-4">Chọn đáp án đúng</h4>
  <button
    className="bg-slate-200 hover:bg-slate-600 p-4 w-20 h-20 rounded-full text-2xl font-bold text-gray-800 transition"
    onClick={() => speak(reading)}
    title="Phát âm từ"
  >
    🔊
  </button>
</div>
          {/* Answers */}
          <div className="flex flex-col  mb-6">
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
                  className={`answer-option ${statusClass}`}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-4 h-full">
                    <div className="flex-shrink-0 flex justify-center">
                      <span className="inline-flex items-center justify-center h-8 w-8 border-2 border-gray-300 rounded-full text-sm font-medium">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 text-center break-words">{ans.text}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Check & Forget */}
          <div className="flex flex-col items-center gap-4 p-8">
            <button
              className={`btn-primary ${selectedIndex === null || isAnswered ? 'btn-primary--disabled' : 'btn-primary--check'} w-80 px-6 py-2`}
              onClick={handleCheck}
              disabled={selectedIndex === null || isAnswered}
            >
              Kiểm tra
            </button>
            <button className="btn-forget" onClick={handleForget} disabled={isAnswered}>
              Tôi ko nhớ từ này
            </button>
          </div>

         {isResultShown && !isResultHidden && (
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
         
                   {isResultShown && isResultHidden && (
                     <div className={isCorrectAnswer && !isForgetClicked ? 'result-panel_true' : 'result-panel_false'}>
                       <button className={`btn-toggle ${isCorrectAnswer ? 'btn-toggle--green' : 'btn-toggle--red'} hiddenBtn`} onClick={() => setIsResultHidden(false)}>
                         <FontAwesomeIcon icon={faChevronUp} />
                       </button>
                       <div className=" text-center  p-10">
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

export default VoicePractice;
