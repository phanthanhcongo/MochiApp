import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface PracticeResultPanelProps {
  isAnswered: boolean;
  isForgetClicked: boolean;
  isCorrectAnswer: boolean | null;
  isResultHidden: boolean;
  setIsResultHidden: (hidden: boolean) => void;
  onContinue: () => void;
  isNavigating: boolean;
  word: any;
  type: 'japanese' | 'english';
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
  type,
  speak,
}) => {
  const [isTranslationHidden, setIsTranslationHidden] = useState(false);

  if (!isAnswered && !isForgetClicked) return null;

  const isCorrect = isCorrectAnswer && !isForgetClicked;
  const panelClass = isCorrect ? 'result-panel_true' : 'result-panel_false';
  const toggleBtnColorClass = isCorrect ? 'btn-toggle--green' : 'btn-toggle--red';
  const displayBtnClass = type === 'english' ? 'displayBtnEnglish' : 'displayBtn';

  if (isResultHidden) {
    return (
      <div className={panelClass}>
        <button
          className={`btn-toggle ${toggleBtnColorClass} hiddenBtn`}
          onClick={() => setIsResultHidden(false)}
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <div className="w-full text-center p-10">
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
      <div className="flex items-start justify-end mb-4 w-[90%] mx-auto">
        <button
          className={`btn-toggle ${toggleBtnColorClass} ${displayBtnClass}`}
          onClick={() => setIsResultHidden(true)}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] scrollbar-hide">
        {type === 'japanese' ? (
          <>
            <div className="flex items-start gap-4 mb-4 w-[90%] mx-auto">
              <div className="btn-audio text-2xl" onClick={() => speak(word.reading_hiragana)} title="Phát âm">🔊</div>
              <div>
                <p className="text-2xl text-stone-50/90">{word.reading_hiragana} • {word.hanviet}</p>
                <p className="text-5xl font-bold">{word.kanji}</p>
                <p className="text-3xl text-stone-50/100 my-5">{word.meaning_vi}</p>
                <p className="text-2xl text-stone-50/90 mt-1 italic">{word.hanviet_explanation}</p>
              </div>
            </div>
            {(word.example || word.example_romaji || word.example_vi) && (
              <div className="flex items-start gap-4 mb-1 w-[90%] mx-auto">
                <button className="btn-audio text-2xl" onClick={() => speak(word.example || '')} title="Phát âm ví dụ">🔊</button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-stone-50 text-3xl">
                      {word.example}
                      <button className="btn-eye" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                        {isTranslationHidden ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <p className={`text-stone-50/90 text-2xl mt-1 italic ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.example_romaji}</p>
                  <p className={`text-stone-50/90 text-2xl ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.example_vi}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-4 w-[90%] mx-auto">
              <div className="btn-audio text-2xl" onClick={() => speak(word.word)} title="Phát âm">🔊</div>
              <div>
                <p className="text-5xl font-bold">{word.word}</p>
                <p className="text-2xl text-stone-50/90">{word.ipa}</p>
                <p className="text-3xl text-stone-50/100 my-5">{word.meaning_vi}</p>
              </div>
            </div>
            {(word.exampleEn || word.exampleVi) && (
              <div className="flex items-start gap-4 mb-1 w-[90%] mx-auto">
                <button className="btn-audio text-2xl" onClick={() => speak(word.exampleEn || '')} title="Phát âm ví dụ">🔊</button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-stone-50 text-3xl">{word.exampleEn}
                      <button className="btn-eye" onClick={() => setIsTranslationHidden(!isTranslationHidden)}>
                        {isTranslationHidden ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <p className={`text-stone-50/90 text-xl mt-1 italic ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.exampleEn}</p>
                  <p className={`text-stone-50/90 text-xl ${isTranslationHidden ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>{word.exampleVi}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-80 mx-auto mt-6 text-center">
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

export default PracticeResultPanel;

