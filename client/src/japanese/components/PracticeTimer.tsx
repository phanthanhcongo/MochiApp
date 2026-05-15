import React, { useState, useEffect } from 'react';

const PracticeTimer: React.FC = () => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const start = parseInt(localStorage.getItem('practice_start_time') || '0');
    if (start === 0) return;

    const updateTimer = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm whitespace-nowrap">
      <span className="text-gray-400 text-xs">⏱️</span>
      <span className="font-mono font-bold text-gray-700 text-sm">
        {formatTime(elapsed)}
      </span>
    </div>
  );
};

export default PracticeTimer;
