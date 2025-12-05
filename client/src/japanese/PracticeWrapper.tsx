import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import type { QuizType } from './practiceStore';
import PracticeLayout from './PracticeLayout';
import LoadingScreen from './LoadingScreen';
import MultipleChoiceQuiz from './MultipleChoiceQuiz';
import HiraganaPractice from './HiraganaPractice';
import RomajiPractice from './RomajiPractice';
import VoicePractice from './VoicePractice';
import MultiCharStrokePractice from './MultiCharStrokePractice';

const PracticeWrapper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, completedCount, isNavigating: storeIsNavigating, previousType } = usePracticeSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isWaitingForState, setIsWaitingForState] = useState(true);

  // Lấy quizType từ pathname
  const quizType = useMemo<QuizType | null>(() => {
    const pathParts = location.pathname.split('/');
    const quizTypeFromPath = pathParts[pathParts.length - 1] as QuizType;
    const validTypes: QuizType[] = ['multiple', 'hiraganaPractice', 'romajiPractice', 'voicePractice', 'multiCharStrokePractice'];
    return validTypes.includes(quizTypeFromPath) ? quizTypeFromPath : null;
  }, [location.pathname]);

  // Render component quiz tương ứng
  const quizComponent = useMemo(() => {
    if (!quizType) return null;
    
    switch (quizType) {
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
  }, [quizType]);

  // Kiểm tra xem có đang chờ state đúng không - hiển thị loading khi không đúng new quiz type
  useEffect(() => {
    const checkState = () => {
      const state = location.state as any;
      const currentPath = location.pathname;
      
      // Nếu không phải quiz route, không cần check
      if (!currentPath.includes('/quiz/')) {
        setIsWaitingForState(false);
        return;
      }

      // Nếu không có quizType hợp lệ, hiển thị loading
      if (!quizType) {
        setIsWaitingForState(true);
        return;
      }

      // Nếu đang navigate từ store, hiển thị loading
      if (storeIsNavigating) {
        setIsWaitingForState(true);
        return;
      }

      // Kiểm tra xem state.from có khớp với quiz type hiện tại không
      const stateFrom = state?.from;
      const isStateCorrect = stateFrom && stateFrom === quizType;

      // Nếu previousType đã được set và khác với quiz type hiện tại, đang chờ navigate đến quiz type mới
      if (previousType && quizType && previousType !== quizType) {
        // Đang chờ navigate đến quiz type mới, hiển thị loading
        setIsWaitingForState(true);
        return;
      }

      // Nếu state.from không khớp với quiz type hiện tại, đang chờ state đúng
      if (stateFrom && stateFrom !== quizType) {
        // State không đúng với quiz type hiện tại, hiển thị loading
        setIsWaitingForState(true);
        return;
      }

      // Nếu không có state, có thể đang trong quá trình navigate
      if (!stateFrom) {
        // Đợi một chút để state được set
        const timeout = setTimeout(() => {
          const newState = location.state as any;
          const newStateFrom = newState?.from;
          
          // Nếu sau khi đợi vẫn không có state hoặc state không khớp
          if (!newStateFrom || newStateFrom !== quizType) {
            // Nếu không đang navigate, có thể là direct access - để component tự xử lý
            if (!storeIsNavigating) {
              setIsWaitingForState(false);
            } else {
              // Vẫn đang navigate, tiếp tục hiển thị loading
              setIsWaitingForState(true);
            }
          } else {
            // State đã đúng, ẩn loading
            setIsWaitingForState(false);
          }
        }, 300);

        return () => clearTimeout(timeout);
      }

      // State đúng, không cần loading
      if (isStateCorrect) {
        setIsWaitingForState(false);
      }
    };

    // Check ngay lập tức
    checkState();
    
    // Check lại sau một frame để đảm bảo state đã được update
    const rafId = requestAnimationFrame(() => {
      checkState();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [location.state, location.pathname, storeIsNavigating, previousType, quizType]);

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

  // Hiển thị loading screen nếu đang chờ state đúng hoặc không có quizType hợp lệ
  if (isWaitingForState || storeIsNavigating || !quizType || !quizComponent) {
    return <LoadingScreen />;
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
      {quizComponent}
    </PracticeLayout>
  );
};

export default PracticeWrapper;

