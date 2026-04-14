import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import type { ReviewWord } from '../utils/usePracticeStore';

interface PracticeResultPanelProps {
  isAnswered: boolean;
  isForgetClicked: boolean;
  isCorrectAnswer: boolean | null;
  isResultHidden: boolean;
  setIsResultHidden: (hidden: boolean) => void;
  onContinue: () => void;
  isNavigating: boolean;
  word: ReviewWord;
  speak: (text: string) => void;
}

const PracticeResultPanel: React.FC<PracticeResultPanelProps> = ({
  isAnswered,
  isForgetClicked,
  isCorrectAnswer,
  isResultHidden,
  setIsResultHidden,
  onContinue,
  isNavigating,
  word,
  speak,
}) => {
  const [isTranslationHidden, setIsTranslationHidden] = useState(true);

  useEffect(() => {
    // Chỉ kích hoạt phím tắt khi panel hiển thị hợp lệ
    if (!isAnswered && !isForgetClicked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignored if user is typing in input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 's':
        case 'S':
          speak(word.reading_hiragana);
          break;
        case 'x':
        case 'X':
          if (word.example || word.example_vi) {
            speak(word.example || '');
          }
          break;
        case 't':
        case 'T':
          setIsTranslationHidden((prev) => !prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setIsResultHidden(false); // Mở (kéo lên)
          break;
        case 'ArrowDown':
          e.preventDefault();
          setIsResultHidden(true); // Gập (kéo xuống)
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isForgetClicked, setIsResultHidden, speak, word]);

  if (!isAnswered && !isForgetClicked) return null;

  const isCorrect = isCorrectAnswer && !isForgetClicked;
  const panelClass = isCorrect ? 'result-panel_true' : 'result-panel_false';
  const toggleBtnColorClass = isCorrect ? 'btn-toggle--green' : 'btn-toggle--red';

  if (isResultHidden) {
    return (
      <div className={`${panelClass} fixed bottom-0  w-full z-50  cong_2`}>
        {/* Nút Up - Bây giờ cũng dùng absolute top để bám vào mép bảng */}
        <div className="absolute -top-5 md:-top-8 right-[5%] z-20">
          <button
            className={`btn-toggle ${toggleBtnColorClass} shadow-sm`}
            onClick={() => setIsResultHidden(false)}
          >
            <FontAwesomeIcon icon={faChevronUp} />
          </button>
        </div>

        <div className="w-full text-center p-4 pb-[env(safe-area-inset-bottom)]">
          <button className="btn-primary btn-primary--active w-full" onClick={onContinue}>
            Tiếp tục
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${panelClass} fixed bottom-0  w-full z-50  cong_2`}>

      {/* NHÓM ĐIỀU KHIỂN (Floating Actions) */}
      <div className="absolute -top-5 md:-top-8 right-[5%] flex flex-col gap-2 z-20">
        <button
          className={`btn-toggle ${toggleBtnColorClass} shadow-lg`}
          onClick={() => setIsResultHidden(true)}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>

        {/* Nếu có nút English, nó sẽ tự nằm dưới nút trên nhờ flex-col */}
        {/* <button className="btn-toggle ...">EN</button> */}
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 overflow-y-auto max-h-[55vh] scrollbar-hide pt-4">

        {/* Phần từ vựng */}
        <div className="flex items-start gap-2 sm:gap-4 w-[95%] sm:w-[92%] md:w-[90%] mx-auto">
          <div className="btn-audio text-lg sm:text-xl flex-shrink-0" onClick={() => speak(word.reading_hiragana)}>🔊</div>
          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg text-stone-50/90">{word.reading_hiragana} {word.hanviet ? `• ${word.hanviet}` : ''}</p>
            <p className="text-3xl sm:text-4xl font-bold">{word.kanji}</p>
            <p className="text-xl sm:text-lg text-stone-50 my-1">{word.meaning_vi}</p>
            {word.hanviet_explanation && (
              <p className="text-sm sm:text-base text-stone-50/90 italic">{word.hanviet_explanation}</p>
            )}
          </div>
        </div>

        {/* Ví dụ Detail */}
        {(word.example || word.example_vi) && (
          <div className="flex items-start gap-2 sm:gap-4 w-[95%] sm:w-[92%] md:w-[90%] mx-auto mt-2 border-t border-stone-50/20 pt-3">
            <button className="btn-audio text-lg sm:text-xl flex-shrink-0" onClick={() => speak(word.example || '')}>🔊</button>
            <div className="flex-1 min-w-0">
              <div className="text-stone-50 text-xl sm:text-2xl break-words">
                {word.example}
                <button className="btn-eye ml-2" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                  {isTranslationHidden ? '🙈' : '👁'}
                </button>
              </div>
              <div className={`${isTranslationHidden ? 'opacity-0 h-0' : 'opacity-100'} transition-all duration-300`}>
                <p className="text-stone-50/90 text-sm sm:text-base italic mt-1">{word.example_romaji}</p>
                <p className="text-stone-50/90 text-sm sm:text-base">{word.example_vi}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NÚT TIẾP TỤC */}
      <div className="w-full sm:w-80 mx-auto p-4 sm:p-6 text-center">
        <button
          className="btn-primary btn-primary--active w-full shadow-md"
          onClick={onContinue}
          disabled={isNavigating}
        >
          {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
        </button>
      </div>
    </div>
  );
};

export default PracticeResultPanel;




