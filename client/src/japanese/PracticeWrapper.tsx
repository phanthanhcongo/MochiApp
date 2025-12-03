import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import PracticeLayout from './PracticeLayout';
import LoadingScreen from './LoadingScreen';

interface PracticeWrapperProps {
  children: React.ReactNode;
}

const PracticeWrapper: React.FC<PracticeWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, completedCount, isNavigating: storeIsNavigating, previousType } = usePracticeSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isWaitingForState, setIsWaitingForState] = useState(true);

  // Kiểm tra xem có đang chờ state đúng không - hiển thị loading khi không đúng new quiz type
  useEffect(() => {
    const checkState = () => {
      const state = location.state as any;
      const currentPath = location.pathname;
      
      // Lấy quiz type từ path
      const quizTypeFromPath = currentPath.split('/').pop();
      
      // Nếu không phải quiz route, không cần check
      if (!currentPath.includes('/quiz/')) {
        setIsWaitingForState(false);
        return;
      }

      // Nếu đang navigate từ store, hiển thị loading
      if (storeIsNavigating) {
        setIsWaitingForState(true);
        return;
      }

      // Kiểm tra xem state.from có khớp với quiz type hiện tại không
      const stateFrom = state?.from;
      const isStateCorrect = stateFrom && stateFrom === quizTypeFromPath;

      // Nếu previousType đã được set và khác với quiz type hiện tại, đang chờ navigate đến quiz type mới
      if (previousType && quizTypeFromPath && previousType !== quizTypeFromPath) {
        // Đang chờ navigate đến quiz type mới, hiển thị loading
        setIsWaitingForState(true);
        return;
      }

      // Nếu state.from không khớp với quiz type hiện tại, đang chờ state đúng
      if (stateFrom && stateFrom !== quizTypeFromPath) {
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
          if (!newStateFrom || newStateFrom !== quizTypeFromPath) {
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
  }, [location.state, location.pathname, storeIsNavigating, previousType]);

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

  // Hiển thị loading screen nếu đang chờ state đúng
  if (isWaitingForState || storeIsNavigating) {
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
      {children}
    </PracticeLayout>
  );
};

export default PracticeWrapper;

