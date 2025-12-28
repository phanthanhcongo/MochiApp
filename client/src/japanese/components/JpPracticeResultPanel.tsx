import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import type { ReviewWord } from '../utils/practiceStore';

interface JpPracticeResultPanelProps {
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

const JpPracticeResultPanel: React.FC<JpPracticeResultPanelProps> = ({
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
          <div className="btn-audio text-xl sm:text-3xl flex-shrink-0" onClick={() => speak(word.reading_hiragana)}>🔊</div>
          <div className="flex-1 min-w-0">
            <p className="text-xl sm:text-2xl text-stone-50/90">{word.reading_hiragana} {word.hanviet ? `• ${word.hanviet}` : ''}</p>
            <p className="text-5xl sm:text-6xl font-bold">{word.kanji}</p>
            <p className="text-3xl sm:text-xl text-stone-50 my-2">{word.meaning_vi}</p>
            {word.hanviet_explanation && (
              <p className="text-xl sm:text-xl text-stone-50/90 italic">{word.hanviet_explanation}</p>
            )}
          </div>
        </div>

        {/* Ví dụ */}
        {(word.example || word.example_vi) && (
          <div className="flex items-start gap-2 sm:gap-4 w-[95%] sm:w-[92%] md:w-[90%] mx-auto mt-2 border-t border-stone-50/20 pt-4">
            <button className="btn-audio text-xl sm:text-3xl flex-shrink-0" onClick={() => speak(word.example || '')}>🔊</button>
            <div className="flex-1 min-w-0">
              <div className="text-stone-50 text-3xl sm:text-4xl break-words">
                {word.example}
                <button className="btn-eye ml-2" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                  {isTranslationHidden ? '🙈' : '👁'}
                </button>
              </div>
              <div className={`${isTranslationHidden ? 'opacity-0 h-0' : 'opacity-100'} transition-all duration-300`}>
                <p className="text-stone-50/90 text-xl italic mt-1">{word.example_romaji}</p>
                <p className="text-stone-50/90 text-xl">{word.example_vi}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NÚT TIẾP TỤC */}
      <div className="w-full sm:w-80 mx-auto py-4 text-center px-4 pb-[env(safe-area-inset-bottom)]">
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

export default JpPracticeResultPanel;

