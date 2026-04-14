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
    const rawProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    return Math.min(100, Math.max(0, rawProgress));
  }, [completedCount, totalCount]);

  return (
    <div className="relative w-full mb-1 pl-4 pt-4 ">
      {/* Wrapper chứa thanh tiến độ + runner */}
      <div className="relative w-full h-4">
        {/* Thanh tiến độ nền */}
        <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out will-change-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Text hiển thị số từ đã ôn / tổng số từ bên trong thanh tiến độ */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-gray-900 px-2 rounded-full transition-opacity duration-300">
            {completedCount} / {totalCount}
          </span>
        </div>

        {/* Ảnh nổi phía trên */}
        <img
          src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmichi.308739ad.png&w=96&q=75"
          alt="Runner"
          className="absolute -top-5 w-10 h-10 transition-all duration-500 ease-out will-change-[left]"
          style={{ left: `calc(${progress}% - 20px)` }} // dịch trái = nửa ảnh
        />
      </div>
    </div>
  );
};

export default React.memo(PracticeProgressBar);




