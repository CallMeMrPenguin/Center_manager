import React from 'react';
import { GripVertical, Clock, X, Play, Pause, RotateCcw } from 'lucide-react';
import { TimerMode } from '../types';

interface QuizPopoutTimerProps {
  timerMode: TimerMode;
  timerPos: { x: number; y: number };
  formattedTimerRemaining: string;
  questionTimer: number;
  isTimerPaused: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export const QuizPopoutTimer: React.FC<QuizPopoutTimerProps> = ({
  timerMode,
  timerPos,
  formattedTimerRemaining,
  questionTimer,
  isTimerPaused,
  onMouseDown,
  onClose,
  onTogglePause,
  onReset,
}) => {
  if (timerMode === 'none') return null;

  return (
    <div
      style={{ left: `${timerPos.x}px`, top: `${timerPos.y}px` }}
      className="fixed z-50 bg-[#0c0f1e]/95 border border-[#212c4b] p-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 select-none"
    >
      {/* Draggable Grip Handle */}
      <div
        onMouseDown={onMouseDown}
        className="p-1 text-slate-500 hover:text-slate-300 cursor-move"
        title="Kéo thả để di chuyển đồng hồ"
      >
        <GripVertical size={13} />
      </div>

      {/* Clock Icon & Digital Countdown */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
        <Clock size={13} className={timerMode === 'global' ? 'text-indigo-400' : 'text-amber-400'} />
        <span className="font-mono text-xs sm:text-sm font-black text-white tracking-wide">
          {timerMode === 'global' ? formattedTimerRemaining : `${questionTimer}s`}
        </span>
      </div>

      {/* Play / Pause Toggle Button */}
      <button
        onClick={onTogglePause}
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
        title={isTimerPaused ? "Tiếp tục đếm giờ" : "Tạm dừng đếm giờ"}
      >
        {isTimerPaused ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} />}
      </button>

      {/* Reset Timer Button */}
      <button
        onClick={onReset}
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
        title="Đặt lại thời gian"
      >
        <RotateCcw size={13} />
      </button>

      {/* Close Floating Timer */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        title="Đóng đồng hồ nổi"
      >
        <X size={13} />
      </button>
    </div>
  );
};
