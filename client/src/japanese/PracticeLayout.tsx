import React from 'react';
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

const PracticeLayout: React.FC<PracticeLayoutProps> = ({
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
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full min-h-screen mx-auto pt-6 relative bg-slate-50 min-h-[700px]">
        {/* Header with padding */}
        <div className="mx-auto px-8">
          <PracticeProgressBar 
            completedCount={completedCount}
            totalCount={totalCount}
          />

          {/* Pause and progress text */}
          <div className="flex items-center justify-between mt-2">
            <button
              className="bg-yellow-400 px-3 py-1 rounded-full flex items-center justify-center h-15 w-15 text-3xl text-slate-50"
              onClick={onTogglePlay}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>

        {/* Practice content without padding */}
        <div className="mx-auto">
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
};

export default PracticeLayout;

