import React from 'react';
import { Move, X, Play, Pause, RotateCcw } from 'lucide-react';
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
      className="fixed z-50 bg-[#0c0f1e] border border-[#263152] rounded-2xl shadow-2xl p-3 w-56 select-none"
    >
      {/* Draggable Titlebar */}
      <div
        onMouseDown={onMouseDown}
        className="flex items-center justify-between cursor-move pb-2 border-b border-white/10"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Move size={12} className="text-indigo-400" />
          <span>Đồng hồ nổi</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Đóng đồng hồ nổi"
        >
          <X size={12} />
        </button>
      </div>

      {/* Large Digital Timer Countdown Display */}
      <div className="py-3 text-center">
        <div
          className={`text-3xl font-black font-mono tracking-tight ${
            timerMode === 'global' ? 'text-indigo-400' : 'text-amber-400'
          }`}
        >
          {timerMode === 'global' ? formattedTimerRemaining : `${questionTimer}s`}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
          {timerMode === 'global' ? 'Thời gian làm bài' : 'Thời gian câu hỏi'}
        </div>
      </div>

      {/* Action Buttons: Reset & Pause/Play */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <button
          onClick={onTogglePause}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition cursor-pointer border border-white/10"
          title={isTimerPaused ? "Tiếp tục đếm giờ" : "Tạm dừng đếm giờ"}
        >
          {isTimerPaused ? <Play size={12} /> : <Pause size={12} />}
          <span>{isTimerPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-white/10"
          title="Đặt lại thời gian về ban đầu"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
