import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import type { ReviewWord } from '../utils/practiceStore';

interface EnglishPracticeResultPanelProps {
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

const EnglishPracticeResultPanel: React.FC<EnglishPracticeResultPanelProps> = ({
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
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);

  if (!isAnswered && !isForgetClicked) return null;

  const isCorrect = isCorrectAnswer && !isForgetClicked;
  const panelClass = isCorrect ? 'result-panel_true' : 'result-panel_false';
  const toggleBtnColorClass = isCorrect ? 'btn-toggle--green' : 'btn-toggle--red';

  if (isResultHidden) {
    return (
      <div className={panelClass}>
        <button
          className={`btn-toggle ${toggleBtnColorClass} hiddenBtn`}
          onClick={() => setIsResultHidden(false)}
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <div className="w-full text-center p-4 sm:p-6 md:p-8 lg:p-10">
          <button
            className="btn-primary btn-primary--active w-full"
            onClick={onContinue}
            disabled={isNavigating}
          >
            {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="flex items-start justify-end mb-2 sm:mb-3 md:mb-4 w-[95%] sm:w-[92%] md:w-[90%] mx-auto">
        <button
          className={`btn-toggle ${toggleBtnColorClass} displayBtnEnglish`}
          onClick={() => setIsResultHidden(true)}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 overflow-y-auto max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] scrollbar-hide">
        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 w-[95%] sm:w-[92%] md:w-[90%] mx-auto">
          <div className="btn-audio text-xl sm:text-2xl md:text-3xl flex-shrink-0" onClick={() => speak(word.word)} title="Phát âm">🔊</div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold break-words">{word.word}</p>
            {word.ipa && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-stone-50/90 break-words">{word.ipa}</p>
            )}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-stone-50/100 my-2 sm:my-3 md:my-4 lg:my-5 break-words">{word.meaning_vi}</p>
          </div>
        </div>

        {(word.exampleEn || word.exampleVi) && (
          <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-1 w-[95%] sm:w-[92%] md:w-[90%] mx-auto">
            <button className="btn-audio text-xl sm:text-2xl md:text-3xl flex-shrink-0" onClick={() => speak(word.exampleEn || '')} title="Phát âm ví dụ">🔊</button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-stone-50 text-base sm:text-lg md:text-xl lg:text-2xl break-words">
                  {word.exampleEn}
                  <button className="btn-eye ml-1 sm:ml-2" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                    {isTranslationHidden ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <p className={`text-stone-50/90 text-sm sm:text-base md:text-lg lg:text-xl mt-1 italic break-words ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.exampleEn}</p>
              <p className={`text-stone-50/90 text-sm sm:text-base md:text-lg lg:text-xl break-words ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.exampleVi}</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full sm:w-80 mx-auto mt-3 sm:mt-4 md:mt-5 lg:mt-6 text-center px-4 sm:px-0">
        <button
          className="btn-primary btn-primary--active w-full"
          onClick={onContinue}
          disabled={isNavigating}
        >
          {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
        </button>
      </div>
    </div>
  );
};

export default EnglishPracticeResultPanel;

