import React, { useRef } from 'react';
import { GripVertical, Clock, X, Play, Pause, RotateCcw } from 'lucide-react';
import { TimerMode } from '../types';

interface QuizPopoutTimerProps {
  timerMode: TimerMode;
  timerPos: { x: number; y: number } | null;
  setTimerPos: (pos: { x: number; y: number } | null) => void;
  formattedTimerRemaining: string;
  questionTimer: number;
  isTimerPaused: boolean;
  onClose: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export const QuizPopoutTimer: React.FC<QuizPopoutTimerProps> = ({
  timerMode,
  timerPos,
  setTimerPos,
  formattedTimerRemaining,
  questionTimer,
  isTimerPaused,
  onClose,
  onTogglePause,
  onReset,
}) => {
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    const currentX = timerPos ? timerPos.x : 0;
    const currentY = timerPos ? timerPos.y : 0;
    dragOffsetRef.current = { x: e.clientX - currentX, y: e.clientY - currentY };

    const onMove = (moveEvt: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setTimerPos({
        x: moveEvt.clientX - dragOffsetRef.current.x,
        y: moveEvt.clientY - dragOffsetRef.current.y,
      });
    };

    const onUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={timerPos ? { transform: `translate3d(${timerPos.x}px, ${timerPos.y}px, 0)` } : {}}
      className="absolute top-16 left-4 z-30 pointer-events-auto flex items-center gap-1.5 bg-[#0c0f1e]/95 border border-[#212c4b] p-1.5 rounded-xl shadow-2xl select-none"
    >
      {/* Draggable Grip Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="p-1 text-slate-500 hover:text-slate-300 cursor-move"
        title="Kéo thả để di chuyển đồng hồ"
      >
        <GripVertical size={13} />
      </div>

      {/* Clock Icon & Digital Countdown / Stopwatch */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
        <Clock
          size={13}
          className={
            timerMode === 'none'
              ? 'text-emerald-400'
              : timerMode === 'global'
              ? 'text-indigo-400'
              : 'text-amber-400'
          }
        />
        <span className="font-mono text-xs sm:text-sm font-black text-white tracking-wide">
          {timerMode === 'per_question' ? `${questionTimer}s` : formattedTimerRemaining}
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

      {/* Close Floating Timer Button */}
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
