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

  // Determine dynamic color status: green -> yellow -> red with breathing pulse
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

  const rawTime = timerMode === 'per_question' ? `${questionTimer}s` : formattedTimerRemaining;
  // Format spaced digits for modern digital clock look (e.g., "12 : 30")
  const displayTimeFormatted = rawTime.includes(':')
    ? rawTime.split(':').join(' : ')
    : rawTime;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={timerPos ? { transform: `translate3d(${timerPos.x}px, ${timerPos.y}px, 0)` } : {}}
      className={`fixed top-20 left-8 z-[100] pointer-events-auto bg-[#0d101f] border-2 p-3.5 rounded-3xl select-none shadow-[0_16px_40px_rgba(0,0,0,0.7)] ring-1 flex flex-col items-center gap-2.5 transition-all duration-200 ${
        timerStatus === 'red'
          ? 'border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.6)] ring-rose-500/50 animate-pulse'
          : timerStatus === 'yellow'
          ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-amber-500/30'
          : 'border-[#5c36f5]/70 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(92,54,245,0.35)] ring-white/15'
      }`}
    >
      {/* TOP HEADER: DRAG HANDLE & UTILITY BUTTONS */}
      <div className="w-full flex items-center justify-between text-slate-400 px-1">
        <div
          onMouseDown={handleMouseDown}
          className={`p-1 cursor-move transition-colors rounded-lg hover:bg-white/5 ${
            timerStatus === 'red' ? 'text-rose-400 hover:text-rose-200' : 'text-indigo-400 hover:text-indigo-200'
          }`}
          title="Kéo thả để di chuyển đồng hồ"
        >
          <GripVertical size={14} />
        </div>

        {/* UTILITY ZOOM & CLOSE BUTTONS (Revealed on hover) */}
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.75}
            className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition disabled:opacity-30 cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <Minus size={11} />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition disabled:opacity-30 cursor-pointer"
            title="Phóng to (+)"
          >
            <Plus size={11} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Đóng"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* LARGE DIGITAL CLOCK DISPLAY */}
      <div className="px-3 py-1 flex items-center justify-center">
        <span
          style={{ fontSize: `${(1.75 * scale).toFixed(3)}rem` }}
          className={`font-mono font-black tracking-wider transition-all drop-shadow-md ${
            timerStatus === 'red'
              ? 'text-rose-400'
              : timerStatus === 'yellow'
              ? 'text-amber-400'
              : 'text-white'
          }`}
        >
          {displayTimeFormatted}
        </span>
      </div>

      {/* BOTTOM ACTION BUTTONS: RESET & START/STOP PILLS (Matching reference card) */}
      <div className="flex items-center gap-2 w-full pt-0.5">
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 text-xs font-bold transition cursor-pointer border border-white/10"
          title="Đặt lại thời gian"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>

        {isTimerPaused ? (
          <button
            onClick={onTogglePause}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-[0_4px_14px_rgba(92,54,245,0.4)] border border-white/20"
            title="Bắt đầu đếm giờ"
          >
            <Play size={12} className="fill-white" />
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={onTogglePause}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-[0_4px_14px_rgba(239,68,68,0.4)] border border-white/20"
            title="Tạm dừng đếm giờ"
          >
            <Pause size={12} className="fill-white" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};
