import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeSession } from './practiceStore';
import PracticeLayout from './PracticeLayout';

interface PracticeWrapperProps {
  children: React.ReactNode;
}

const PracticeWrapper: React.FC<PracticeWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const { totalCount, completedCount } = usePracticeSession();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showConfirmExit, setShowConfirmExit] = React.useState(false);

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

