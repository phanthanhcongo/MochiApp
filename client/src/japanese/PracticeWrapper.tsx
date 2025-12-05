import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import type { QuizType } from './practiceStore';
import PracticeLayout from './PracticeLayout';
import MultipleChoiceQuiz from './MultipleChoiceQuiz';
import HiraganaPractice from './HiraganaPractice';
import RomajiPractice from './RomajiPractice';
import VoicePractice from './VoicePractice';
import MultiCharStrokePractice from './MultiCharStrokePractice';

const PracticeWrapper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, completedCount } = usePracticeSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayQuizType, setDisplayQuizType] = useState<QuizType | null>(null);
  const prevQuizTypeRef = useRef<QuizType | null>(null);

  // Lấy quizType từ pathname
  const quizType = useMemo<QuizType | null>(() => {
    const pathParts = location.pathname.split('/');
    const quizTypeFromPath = pathParts[pathParts.length - 1] as QuizType;
    const validTypes: QuizType[] = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];
    return validTypes.includes(quizTypeFromPath) ? quizTypeFromPath : null;
  }, [location.pathname]);

  // Render component quiz tương ứng
  const quizComponent = useMemo(() => {
    if (!displayQuizType) return null;
    
    switch (displayQuizType) {
      case 'multiple':
        return <MultipleChoiceQuiz />;
      case 'hiraganaPractice':
        return <HiraganaPractice />;
      case 'romajiPractice':
        return <RomajiPractice />;
      case 'voicePractice':
        return <VoicePractice />;
      case 'multiCharStrokePractice':
        return <MultiCharStrokePractice />;
      default:
        return null;
    }
  }, [displayQuizType]);

  // Xử lý animation khi quizType thay đổi
  useEffect(() => {
    if (!quizType) {
      setDisplayQuizType(null);
      prevQuizTypeRef.current = null;
      return;
    }

    // Nếu quizType thay đổi, bắt đầu animation
    if (prevQuizTypeRef.current !== quizType && prevQuizTypeRef.current !== null) {
      // Bắt đầu fade out
      setIsAnimating(true);
      
      // Sau khi fade out một nửa, thay đổi component
      const timeoutId = setTimeout(() => {
        setDisplayQuizType(quizType);
        prevQuizTypeRef.current = quizType;
        
        // Fade in component mới ngay sau đó
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimating(false);
          });
        });
      }, 250); // Thời gian fade out (một nửa của tổng thời gian animation)

      return () => clearTimeout(timeoutId);
    } else if (prevQuizTypeRef.current === null) {
      // Lần đầu tiên, không cần animation
      setDisplayQuizType(quizType);
      prevQuizTypeRef.current = quizType;
      setIsAnimating(false);
    }
  }, [quizType]);


  const handleToggle = () => {
    setIsPlaying(prev => !prev);
    setShowConfirmExit(true);
  };

  const handleCloseConfirmExit = () => {
    setShowConfirmExit(false);
  };

  const handleContinuePractice = () => {
    setShowConfirmExit(false);
    setIsPlaying(true);
  };

  const handleExitPractice = () => {
    navigate('/jp/summary');
  };

  // Nếu không có quizType hoặc quizComponent, không render gì
  if (!quizType || !quizComponent) {
    return null;
  }

  return (
    <PracticeLayout 
      completedCount={completedCount}
      totalCount={totalCount}
      isPlaying={isPlaying}
      onTogglePlay={handleToggle}
      showConfirmExit={showConfirmExit}
      onCloseConfirmExit={handleCloseConfirmExit}
      onContinuePractice={handleContinuePractice}
      onExitPractice={handleExitPractice}
    >
      <div
        className={`transition-opacity duration-500 ease-in-out w-full ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          willChange: 'opacity',
          minHeight: '100%',
        }}
      >
        {quizComponent}
      </div>
    </PracticeLayout>
  );
};

export default PracticeWrapper;

