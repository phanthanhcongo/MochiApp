import React, { useEffect } from 'react';
import { FaPlay, FaPause } from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { BiLogOutCircle } from "react-icons/bi";
import PracticeProgressBar from './PracticeProgressBar';

interface PracticeLayoutProps {
  completedCount: number;
  totalCount: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showConfirmExit: boolean;
  onCloseConfirmExit: () => void;
  onContinuePractice: () => void;
  onExitPractice: () => void;
  children: React.ReactNode;
}

const PracticeLayout: React.FC<PracticeLayoutProps> = React.memo(({
  completedCount,
  totalCount,
  isPlaying,
  onTogglePlay,
  showConfirmExit,
  onCloseConfirmExit,
  onContinuePractice,
  onExitPractice,
  children,
}) => {
  // Auto request fullscreen on mobile when entering practice
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to enter fullscreen mode
      const requestFullscreen = async () => {
        try {
          const doc = document.documentElement as any;
          
          if (doc.requestFullscreen) {
            await doc.requestFullscreen();
          } else if (doc.webkitRequestFullscreen) {
            // Safari
            await doc.webkitRequestFullscreen();
          } else if (doc.mozRequestFullScreen) {
            // Firefox
            await doc.mozRequestFullScreen();
          } else if (doc.msRequestFullscreen) {
            // IE/Edge
            await doc.msRequestFullscreen();
          }
        } catch (error) {
          // Fullscreen request failed (user interaction required on some browsers)
          console.log('Fullscreen request failed:', error);
        }
      };

      // Request fullscreen after a short delay to ensure component is mounted
      const timer = setTimeout(() => {
        requestFullscreen();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 mx-auto ">
      <div className="w-full min-h-screen mx-auto pt-3 sm:pt-4 md:pt-6 relative bg-slate-50 ">
        {/* Header with padding */}
        <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <PracticeProgressBar 
            completedCount={completedCount}
            totalCount={totalCount}
          />

          {/* Pause and progress text */}
          <div className="flex items-center justify-between mt-2">
            <button
              className="bg-yellow-400 px-2 sm:px-2.5 md:px-3 py-1 rounded-full flex items-center justify-center h-12 w-12 sm:h-13 sm:w-13 md:h-15 md:w-15 text-xl sm:text-2xl md:text-3xl text-slate-50"
              onClick={onTogglePlay}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>

        {/* Practice content without padding */}
        <div className="mx-auto w-full max-w-6xl ">
          {children}
        </div>
      </div>

      {/* Confirm Exit Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="relative bg-slate-50 p-6 rounded-t-2xl shadow-xl w-full text-center animate-slideUp space-y-4">
            {/* Nút đóng */}
            <button
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
              onClick={onCloseConfirmExit}
              title="Đóng"
            >
              <FontAwesomeIcon icon={faCircleXmark} className="text-gray-700 text-4xl" />
            </button>

            {/* Nội dung */}
            <p className="text-2xl font-semibold text-gray-800 mb-10 mt-5">Bạn muốn ngừng ôn tập à?</p>

            {/* Nút: Tiếp tục */}
            <button
              onClick={onContinuePractice}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:brightness-110 text-stone-50 font-semibold transition"
            >
              <FaPlay className="text-3xl" />
              Tiếp tục
            </button>

            {/* Nút: Quay lại */}
            <button
              onClick={onExitPractice}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full hover:brightness-110 text-gray-800 font-semibold transition border border-gray-300 border-b-10"
            >
              <BiLogOutCircle className="text-gray-700 text-3xl" />
              Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

PracticeLayout.displayName = 'PracticeLayout';

export default PracticeLayout;

