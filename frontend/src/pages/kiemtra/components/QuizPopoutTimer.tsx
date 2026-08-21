import React, { useRef, useState } from 'react';
import { GripVertical, X, Play, Pause, RotateCcw } from 'lucide-react';
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
  const [timerSize, setTimerSize] = useState<{ width: number; height: number }>({ width: 170, height: 95 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 170, height: 95 });

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

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: timerSize.width,
      height: timerSize.height,
    };

    const onMove = (moveEvt: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = moveEvt.clientX - resizeStartRef.current.x;
      const dy = moveEvt.clientY - resizeStartRef.current.y;
      setTimerSize({
        width: Math.max(130, Math.min(480, resizeStartRef.current.width + dx)),
        height: Math.max(70, Math.min(320, resizeStartRef.current.height + dy)),
      });
    };

    const onUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Determine dynamic color status: green -> yellow -> red
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
  const displayTimeFormatted = rawTime.includes(':')
    ? rawTime.split(':').join(' : ')
    : rawTime;

  const fontSizeRem = Math.max(1.2, Math.min(3.6, (timerSize.width / 170) * 1.65));

  return (
    <>
      <style>{`
        @keyframes timerNumberBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
      `}</style>

      <div
        style={{
          width: `${timerSize.width}px`,
          height: `${timerSize.height}px`,
          ...(timerPos ? { transform: `translate3d(${timerPos.x}px, ${timerPos.y}px, 0)` } : {}),
        }}
        className={`fixed top-20 left-8 z-[100] pointer-events-auto bg-[#0d101f] border-2 p-2.5 rounded-2xl select-none shadow-[0_16px_40px_rgba(0,0,0,0.7)] ring-1 flex flex-col justify-between relative group ${
          timerStatus === 'red'
            ? 'border-rose-500/80 ring-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
            : timerStatus === 'yellow'
            ? 'border-amber-500/60 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            : 'border-[#5c36f5]/70 ring-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* TOP HEADER ROW: DRAG HANDLE (LEFT) + ICON ACTIONS (RIGHT) */}
        <div className="w-full flex items-center justify-between text-slate-400 shrink-0">
          <div
            onMouseDown={handleMouseDown}
            className={`p-1 cursor-move transition-colors rounded-lg hover:bg-white/5 ${
              timerStatus === 'red' ? 'text-rose-400 hover:text-rose-200' : 'text-indigo-400 hover:text-indigo-200'
            }`}
            title="Kéo thả để di chuyển đồng hồ"
          >
            <GripVertical size={14} />
          </div>

          {/* TOP-RIGHT ICON ACTIONS: RESET, START/STOP, CLOSE */}
          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title="Đặt lại thời gian (Reset)"
            >
              <RotateCcw size={13} />
            </button>

            <button
              onClick={onTogglePause}
              className={`p-1 rounded-lg transition cursor-pointer ${
                isTimerPaused
                  ? 'hover:bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-rose-500/20 text-rose-400'
              }`}
              title={isTimerPaused ? "Bắt đầu (Start)" : "Tạm dừng (Stop)"}
            >
              {isTimerPaused ? (
                <Play size={13} className="fill-emerald-400" />
              ) : (
                <Pause size={13} className="fill-rose-400" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Đóng đồng hồ nổi"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* CENTER: LARGE DIGITAL TIME WITH SCALE BREATHING ANIMATION ON NUMBERS ONLY */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-1">
          <span
            style={{
              fontSize: `${fontSizeRem.toFixed(2)}rem`,
              animation: timerStatus === 'red' ? 'timerNumberBreathe 1s ease-in-out infinite' : 'none',
              transformOrigin: 'center',
            }}
            className={`font-mono font-black tracking-wider transition-colors inline-block ${
              timerStatus === 'red'
                ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                : timerStatus === 'yellow'
                ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
            }`}
          >
            {displayTimeFormatted}
          </span>
        </div>

        {/* CORNER DRAG RESIZE HANDLE */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-slate-500 hover:text-indigo-400 opacity-60 hover:opacity-100 transition-opacity"
          title="Kéo góc để phóng to/thu nhỏ kích thước"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <circle cx="7" cy="7" r="1" />
            <circle cx="7" cy="4" r="1" />
            <circle cx="4" cy="7" r="1" />
            <circle cx="7" cy="1" r="1" />
            <circle cx="4" cy="4" r="1" />
            <circle cx="1" cy="7" r="1" />
          </svg>
        </div>
      </div>
    </>
  );
};
