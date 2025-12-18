import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PracticeAnimationWrapperProps {
  children: React.ReactNode;
  keyValue: string;
  isExiting: boolean;
  onExitComplete?: () => void;
  className?: string;
}

const PracticeAnimationWrapper: React.FC<PracticeAnimationWrapperProps> = ({
  children,
  keyValue,
  onExitComplete,
  className = 'w-full',
}) => {
  return (
    <AnimatePresence mode="wait">
  <motion.div
    key={keyValue}
    initial={{ opacity: 0, x: -50 }}
    animate={{
      opacity: 1,
      x: 0,
      transition: {
        duration: 1,         // ⬅️ component mới hiện trong đúng 2 giây
        ease: [0.4, 0, 0.2, 1]
      }
    }}

    exit={{
      opacity: 0,
      x: 100,
      scale: 0.95,
      transition: {
        delay: 0,            // ⬅️ bỏ delay, tránh lệch timing
        duration: 2,         // ⬅️ component cũ ẩn đúng 2 giây
        ease: [0.4, 0, 0.2, 1]
      }
    }}
    onAnimationComplete={(definition) => {
      if (definition === 'exit' && onExitComplete) {
        onExitComplete();
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
</AnimatePresence>

  );
};

export default PracticeAnimationWrapper;

