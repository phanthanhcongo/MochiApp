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
  const [isTranslationHidden, setIsTranslationHidden] = useState(true);

  if (!isAnswered && !isForgetClicked) return null;

  const isCorrect = isCorrectAnswer && !isForgetClicked;
  const panelClass = isCorrect ? 'result-panel_true' : 'result-panel_false';
  const toggleBtnColorClass = isCorrect ? 'btn-toggle--green' : 'btn-toggle--red';

  if (isResultHidden) {
    return (
      <div className={`${panelClass} relative pt-6`}>
        {/* Nút UP bám đỉnh */}
        <div className="absolute -top-5 md:-top-8  right-[5%] z-20">
          <button
            className={`btn-toggle ${toggleBtnColorClass} shadow-lg`}
            onClick={() => setIsResultHidden(false)}
          >
            <FontAwesomeIcon icon={faChevronUp} />
          </button>
        </div>

        <div className="w-full text-center px-4 pb-[env(safe-area-inset-bottom)] py-4">
          <button className="btn-primary btn-primary--active w-full shadow-md" onClick={onContinue} disabled={isNavigating}>
            {isNavigating ? 'Đang tải...' : 'Tiếp tục'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${panelClass} relative  rounded-t-3xl shadow-2xl pt-10`}>
      {/* - w-[90%] cho mobile để không quá hẹp, md:w-[70%] cho màn hình lớn.
         - pt-10 để tạo khoảng cách cho nút Chevron bám đỉnh.
      */}

      {/* NHÓM ĐIỀU KHIỂN - Bám sát mép phải của container 70% */}
      <div className="absolute -top-6 right-4 sm:right-6 flex flex-col gap-2 z-30">
        <button
          className={`btn-toggle ${toggleBtnColorClass} shadow-xl border-2 border-white/20`}
          onClick={() => setIsResultHidden(true)}
        >
          <FontAwesomeIcon icon={faChevronDown} size="sm" />
        </button>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="px-6 sm:px-10 overflow-y-auto max-h-[50vh] scrollbar-hide w-[90%]  mx-auto">
        {/* Header: Word & IPA */}
        <div className="flex items-center gap-4 mb-4">
          <div className="btn-audio scale-110 flex-shrink-0" onClick={() => speak(word.word)}>🔊</div>
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight break-words">
              {word.word}
            </h2>
            {word.ipa && (
              <span className="text-base sm:text-xl font-medium text-stone-200/80 font-mono">
                {word.ipa}
              </span>
            )}
          </div>
        </div>

        {/* Meaning */}
        <div className="mb-6">
          <p className="text-xl sm:text-3xl text-white font-medium leading-relaxed">
            {word.meaning_vi}
          </p>
        </div>

        {/* Example Box */}
        {(word.exampleEn || word.exampleVi) && (
          <div className="bg-white/10 rounded-2xl p-4 sm:p-6 mb-4 border border-white/5">
            <div className="flex gap-3">
              <button className="text-xl opacity-80 hover:opacity-100 transition" onClick={() => speak(word.exampleEn || '')}>🔊</button>
              <div className="flex-1">
                <p className="text-lg sm:text-2xl text-stone-50 leading-snug">
                  {word.exampleEn}
                  <button className="btn-eye inline-flex ml-3 align-middle" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                    {isTranslationHidden ? '🙈' : '👁'}
                  </button>
                </p>

                <div className={`mt-3 transition-all duration-300 overflow-hidden ${isTranslationHidden ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                  <p className="text-base sm:text-xl text-stone-200 italic border-l-2 border-white/30 pl-3">
                    {word.exampleVi}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NÚT TIẾP TỤC */}
      <div className="flex justify-center px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
        <button
          className="btn-primary btn-primary--active w-full sm:w-72 md:w-80 py-4 text-xl font-bold shadow-2xl transform active:scale-[0.96] transition-all duration-200"
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

