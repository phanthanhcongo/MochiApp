import React, { useMemo } from 'react';

interface PracticeProgressBarProps {
  completedCount: number;
  totalCount: number;
}

const PracticeProgressBar: React.FC<PracticeProgressBarProps> = ({
  completedCount,
  totalCount,
}) => {
  const progress = useMemo(() => {
    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  }, [completedCount, totalCount]);

  return (
    <div className="relative w-full mb-2  pl-5 pt-5 ">
      {/* Wrapper chứa thanh tiến độ + runner */}
      <div className="relative w-full h-5">
        {/* Thanh tiến độ nền */}
        <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out will-change-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Text hiển thị số từ đã ôn / tổng số từ bên trong thanh tiến độ */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-900 px-2 py-0.5 rounded-full transition-opacity duration-300">
            {completedCount} / {totalCount}
          </span>
        </div>

        {/* Ảnh nổi phía trên */}
        <img
          src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmichi.308739ad.png&w=96&q=75"
          alt="Runner"
          className="absolute -top-6 w-12 h-12 transition-all duration-500 ease-out will-change-[left]"
          style={{ left: `calc(${progress}% - 24px)` }} // dịch trái = nửa ảnh
        />
      </div>
    </div>
  );
};

export default React.memo(PracticeProgressBar);

