import React, { useRef, useState } from 'react';
import { GripVertical, X, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { TimerMode } from '../types';

interface QuizPopoutTimerProps {
  timerMode: TimerMode;
  timerPos: { x: number; y: number } | null;
  setTimerPos: (pos: { x: number; y: number } | null) => void;
  formattedTimerRemaining: string;
  timerRemaining?: number;
  globalTimeSeconds?: number;
  questionTimer?: number;
  perQuestionSeconds?: number;
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
  timerRemaining = 0,
  globalTimeSeconds = 1,
  questionTimer = 0,
  perQuestionSeconds = 1,
  isTimerPaused,
  onClose,
  onTogglePause,
  onReset,
}) => {
  const [scale, setScale] = useState<number>(1.0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
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

  const handleZoomIn = () => {
    setScale(s => Math.min(2.5, +(s + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale(s => Math.max(0.75, +(s - 0.25).toFixed(2)));
  };

  // Determine dynamic color status: green -> yellow -> red with breathing effect
  let timerStatus: 'green' | 'yellow' | 'red' = 'green';
  if (timerMode === 'per_question') {
    const ratio = questionTimer / Math.max(1, perQuestionSeconds);
    if (questionTimer <= 5 || ratio <= 0.25) {
      timerStatus = 'red';
    } else if (ratio <= 0.5) {
      timerStatus = 'yellow';
    } else {
      timerStatus = 'green';
    }
  } else if (timerMode === 'global') {
    const ratio = timerRemaining / Math.max(1, globalTimeSeconds);
    if (timerRemaining <= 60 || ratio <= 0.15) {
      timerStatus = 'red';
    } else if (ratio <= 0.4) {
      timerStatus = 'yellow';
    } else {
      timerStatus = 'green';
    }
  }

  const displayTime = timerMode === 'per_question' ? `${questionTimer}s` : formattedTimerRemaining;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={timerPos ? { transform: `translate3d(${timerPos.x}px, ${timerPos.y}px, 0)` } : {}}
      className={`fixed top-20 left-8 z-[100] pointer-events-auto flex items-center gap-1.5 bg-[#12162a] border-2 p-1.5 rounded-2xl select-none ring-1 ${
        timerStatus === 'red'
          ? 'border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.65)] ring-rose-500/50 animate-pulse'
          : timerStatus === 'yellow'
          ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-amber-500/30'
          : 'border-[#5c36f5]/70 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(92,54,245,0.35)] ring-white/15'
      }`}
    >
      {/* Draggable Grip Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`p-1 cursor-move transition-colors ${
          timerStatus === 'red' ? 'text-rose-400 hover:text-rose-200' : 'text-indigo-400 hover:text-indigo-200'
        }`}
        title="Kéo thả để di chuyển đồng hồ"
      >
        <GripVertical size={14} />
      </div>

      {/* Scalable Digital Countdown / Stopwatch */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1c2242] border transition-all ${
          timerStatus === 'red'
            ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
            : timerStatus === 'yellow'
            ? 'border-amber-500/40'
            : 'border-indigo-500/30'
        }`}
      >
        <span
          style={{ fontSize: `${(0.875 * scale).toFixed(3)}rem` }}
          className={`font-mono font-black tracking-wide transition-all ${
            timerStatus === 'red'
              ? 'text-rose-400'
              : timerStatus === 'yellow'
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {displayTime}
        </span>
      </div>

      {/* ACTION BUTTONS (Mặc định ẩn, mở khi di chuột vào) */}
      {isHovered && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.75}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
            title="Thu nhỏ đồng hồ (-)"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
            title="Phóng to đồng hồ (+)"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={onTogglePause}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isTimerPaused ? "Tiếp tục đếm giờ" : "Tạm dừng đếm giờ"}
          >
            {isTimerPaused ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} />}
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đặt lại thời gian"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
            title="Đóng đồng hồ nổi"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
