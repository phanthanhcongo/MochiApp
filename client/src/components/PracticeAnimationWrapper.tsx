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
  className = 'w-full min-h-screen cong_2',
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
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1]
          }
        }}
        exit={{
          opacity: 0,
          x: 100,
          transition: {
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1]
          }
        }}
        onAnimationComplete={(definition) => {
          if (definition === 'exit' && onExitComplete) {
            onExitComplete();
          }
        }}
        className={className}
        style={{
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PracticeAnimationWrapper;

