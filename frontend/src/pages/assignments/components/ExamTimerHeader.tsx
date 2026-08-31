import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerHeaderProps {
  timeLimitMinutes: number;
  onTimeExpired: () => void;
  isSubmitted: boolean;
}

export const ExamTimerHeader: React.FC<ExamTimerHeaderProps> = ({
  timeLimitMinutes,
  onTimeExpired,
  isSubmitted,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(timeLimitMinutes * 60);

  useEffect(() => {
    if (isSubmitted || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, onTimeExpired, secondsRemaining]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const isLowTime = secondsRemaining <= 300; // < 5 mins

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs transition ${
        isLowTime
          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]'
          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
      }`}
      title="Thời gian làm bài còn lại"
    >
      {isLowTime ? <AlertTriangle size={14} className="text-rose-400" /> : <Clock size={14} className="text-indigo-400" />}
      <span>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};
