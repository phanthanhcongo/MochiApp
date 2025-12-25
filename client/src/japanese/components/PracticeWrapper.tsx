import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import type { QuizType } from '../utils/practiceStore';
import PracticeLayout from './PracticeLayout';
import MultipleChoiceQuiz from '../practice/MultipleChoiceQuiz';
import HiraganaPractice from '../practice/HiraganaPractice';
import RomajiPractice from '../practice/RomajiPractice';
import VoicePractice from '../practice/VoicePractice';
import MultiCharStrokePractice from '../practice/MultiCharStrokePractice';

const PracticeWrapper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, completedCount } = usePracticeSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayQuizType, setDisplayQuizType] = useState<QuizType | null>(null);
  const [exitingQuizType, setExitingQuizType] = useState<QuizType | null>(null);
  const prevQuizTypeRef = useRef<QuizType | null>(null);

  // Lấy quizType từ pathname
  const quizType = useMemo<QuizType | null>(() => {
    const pathParts = location.pathname.split('/');
    const quizTypeFromPath = pathParts[pathParts.length - 1] as QuizType;
    const validTypes: QuizType[] = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];
    return validTypes.includes(quizTypeFromPath) ? quizTypeFromPath : null;
  }, [location.pathname]);

  // Render all quiz components, keep them mounted
  const quizComponents = useMemo(() => ({
    multiple: <MultipleChoiceQuiz />,
    hiraganaPractice: <HiraganaPractice />,
    romajiPractice: <RomajiPractice />,
    voicePractice: <VoicePractice />,
    multiCharStrokePractice: <MultiCharStrokePractice />,
  }), []);

  // Xử lý animation khi quizType thay đổi
  useEffect(() => {
    if (!quizType) {
      setDisplayQuizType(null);
      prevQuizTypeRef.current = null;
      return;
    }

    // Nếu quizType thay đổi, bắt đầu animation
    if (prevQuizTypeRef.current !== quizType && prevQuizTypeRef.current !== null) {
      // Track the exiting type
      setExitingQuizType(prevQuizTypeRef.current);
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
            setExitingQuizType(null);
          });
        });
      }, 125); // Half of 250ms animation

      return () => clearTimeout(timeoutId);
    } else if (prevQuizTypeRef.current === null) {
      // Lần đầu tiên, không cần animation
      setDisplayQuizType(quizType);
      prevQuizTypeRef.current = quizType;
      setIsAnimating(false);
      setExitingQuizType(null);
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

  // Nếu không có quizType, không render gì
  if (!quizType) {
    return null;
  }

  const validTypes: QuizType[] = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];

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
        className="relative w-full flex-1 h-full"
        style={{
          willChange: 'transform, opacity',
        }}
      >
        {validTypes.map((type) => {
          const Component = quizComponents[type];
          if (!Component) return null;
          
          const isCurrent = displayQuizType === type;
          const isExiting = exitingQuizType === type;
          
          // Show if current, or if exiting and animating (for exit animation)
          const shouldShow = isCurrent || (isExiting && isAnimating);
          
          // Determine transform based on state
          let transform = 'translateX(-100px)'; // Default: hidden left
          if (isCurrent && !isAnimating) {
            transform = 'translateX(0)'; // Active: center
          } else if (isCurrent && isAnimating) {
            transform = 'translateX(0)'; // Entering: from left to center
          } else if (isExiting && isAnimating) {
            transform = 'translateX(100px)'; // Exiting: to right
          }
          
          return (
            <div
              key={type}
              className="absolute inset-0 w-full"
              style={{
                opacity: shouldShow ? (isCurrent ? 1 : 0) : 0,
                pointerEvents: isCurrent && !isAnimating ? 'auto' : 'none',
                transform,
                transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
                willChange: 'transform, opacity',
              }}
            >
              {Component}
            </div>
          );
        })}
      </div>
    </PracticeLayout>
  );
};

export default PracticeWrapper;

