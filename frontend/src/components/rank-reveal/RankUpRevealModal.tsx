import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { RankRevealModalProps } from './types';
import { useRankRevealCanvas } from './useRankRevealCanvas';

export const RankUpRevealModal: React.FC<RankRevealModalProps> = ({
  isOpen,
  onClose,
  oldTier,
  newTier,
  studentName = 'Học Sinh',
  className = 'Lớp Học',
  oldScore,
  newScore,
  options = {},
}) => {
  const [phase, setPhase] = useState<'idle' | 'crack' | 'shatter' | 'slam' | 'reveal'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const speedMult = options.playbackSpeed ?? 1.0;
  const t = (ms: number) => ms / speedMult;

  useRankRevealCanvas(canvasRef, phase, oldTier, newTier, options);

  // Resize canvas to match screen
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, [isOpen]);

  // Orchestrate timeline sequence
  const startSequence = () => {
    setPhase('crack');
    setIsShaking(false);

    const timer1 = setTimeout(() => {
      setPhase('shatter');
    }, t(500));

    const timer2 = setTimeout(() => {
      setPhase('slam');
      if (options.enableShake !== false) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), t(450));
      }
    }, t(1050));

    const timer3 = setTimeout(() => {
      setPhase('reveal');
    }, t(1600));

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  useEffect(() => {
    if (isOpen) {
      const cleanup = startSequence();
      return cleanup;
    } else {
      setPhase('idle');
      setIsShaking(false);
    }
  }, [isOpen, oldTier, newTier, options.playbackSpeed]);

  if (!isOpen) return null;

  const isOldVisible = phase === 'crack';
  const isNewSlamming = phase === 'slam';
  const isRevealed = phase === 'reveal';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#080b14]/95 select-none">
      {/* 1. OFFSCREEN / FULLSCREEN CANVAS FX */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* 2. CAMERA SHAKE CONTAINER */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center w-full h-full max-w-4xl p-6 transition-transform duration-75 ${
          isShaking ? 'animate-[rankShake_0.45s_cubic-bezier(.36,.07,.19,.97)_both]' : ''
        }`}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 z-50 cursor-pointer"
          title="Đóng"
        >
          <X size={20} />
        </button>

        {/* TOP STATUS PILL */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/15 text-xs font-bold text-slate-300 mb-6 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <Trophy size={14} style={{ color: newTier.color }} />
          <span className="uppercase tracking-widest text-[11px] font-black" style={{ color: newTier.color }}>
            Vinh Danh Thăng Hạng
          </span>
          <span className="text-slate-500 font-mono">|</span>
          <span className="text-white font-medium">{studentName}</span>
          <span className="text-slate-500 font-mono">({className})</span>
        </div>

        {/* CENTER EMBLEM STAGE */}
        <div className="relative flex items-center justify-center w-72 h-72 my-2">
          {/* AURA GLOW BEHIND BADGE */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 pointer-events-none ${
              isRevealed ? 'opacity-100 scale-125' : 'opacity-0 scale-75'
            }`}
            style={{
              background: `radial-gradient(circle, ${newTier.color}40 0%, ${newTier.color}10 50%, transparent 70%)`,
            }}
          />

          {/* SVG WINGS (Left & Right) */}
          {options.enableWings !== false && (
            <div
              className={`absolute flex items-center justify-between w-[460px] pointer-events-none transition-all duration-1000 ease-out z-0 ${
                isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
            >
              {/* Left Wing */}
              <svg width="150" height="120" viewBox="0 0 150 120" className="drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                <defs>
                  <linearGradient id={`wingGradLeft_${newTier.tier}`} x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={newTier.color} stopOpacity="0.9" />
                    <stop offset="70%" stopColor={newTier.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M140,60 C100,10 50,5 5,30 C35,45 60,65 15,85 C55,80 85,95 30,115 C80,100 120,85 140,60 Z"
                  fill={`url(#wingGradLeft_${newTier.tier})`}
                />
              </svg>

              {/* Right Wing */}
              <svg width="150" height="120" viewBox="0 0 150 120" className="scale-x-[-1] drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                <path
                  d="M140,60 C100,10 50,5 5,30 C35,45 60,65 15,85 C55,80 85,95 30,115 C80,100 120,85 140,60 Z"
                  fill={`url(#wingGradLeft_${newTier.tier})`}
                />
              </svg>
            </div>
          )}

          {/* PHASE 1: OLD BADGE CRACKING */}
          {isOldVisible && (
            <div className="relative z-10 w-44 h-44 flex items-center justify-center animate-pulse">
              <img
                src={oldTier.badge}
                alt={oldTier.name}
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              />
              {/* Energy Cracks Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg width="140" height="140" viewBox="0 0 100 100" className="animate-ping opacity-80">
                  <path
                    d="M15,20 L45,50 L35,70 L60,85 M55,30 L50,50 L80,65"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* PHASE 3 & 4: NEW BADGE SLAM & REVEAL */}
          {(isNewSlamming || isRevealed) && (
            <div
              className={`relative z-10 w-48 h-48 flex items-center justify-center transition-all duration-300 ease-out ${
                isNewSlamming
                  ? 'scale-125 opacity-90'
                  : 'scale-100 opacity-100'
              }`}
              style={{
                filter: isRevealed
                  ? `drop-shadow(0 0 25px ${newTier.color}) drop-shadow(0 0 50px ${newTier.color}80)`
                  : 'none',
              }}
            >
              <img
                src={newTier.badge}
                alt={newTier.name}
                className={`w-full h-full object-contain ${newTier.scale || 'scale-100'}`}
              />
            </div>
          )}
        </div>

        {/* 4. REVEAL BANNER & DETAILS */}
        <div
          className={`flex flex-col items-center mt-6 space-y-4 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          {/* TIER TITLE RIBBON */}
          <div className="relative px-8 py-2 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent border-y border-white/20 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              {newTier.title}
            </span>
            <h2
              className="text-3xl md:text-4xl font-black tracking-wider uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
              style={{ color: newTier.color }}
            >
              BẬC {newTier.name}
            </h2>
          </div>

          {/* SCORE PROGRESSION BADGE (if provided) */}
          {(oldScore !== undefined || newScore !== undefined) && (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-[#0d1120] border border-white/10 text-xs font-semibold text-slate-300">
              <span className="text-slate-400">Điểm số:</span>
              {oldScore !== undefined && <span className="font-mono text-slate-400">{oldScore.toFixed(1)} đ</span>}
              <ArrowRight size={13} className="text-indigo-400" />
              {newScore !== undefined && (
                <span className="font-mono font-bold text-emerald-400">{newScore.toFixed(1)} đ</span>
              )}
            </div>
          )}

          {/* BOTTOM ACTIONS */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={startSequence}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Xem Lại Hoạt Cảnh</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black text-white shadow-lg transition-all cursor-pointer hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: newTier.color,
                boxShadow: `0 0 20px ${newTier.color}60`,
              }}
            >
              <Sparkles size={14} />
              <span>Tiếp Tục</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
