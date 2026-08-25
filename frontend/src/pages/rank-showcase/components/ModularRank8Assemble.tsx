import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Sparkles, SunMedium, RotateCcw, Flame } from 'lucide-react';

export interface ModularRank8Handle {
  assemble: () => void;
  disassemble: () => void;
  explode: () => void;
  triggerSheen: () => void;
  setProgress: (progress: number) => void;
}

interface ModularRank8AssembleProps {
  size?: number; // Canvas size, e.g. 480
  autoAssemble?: boolean;
  manualProgress?: number; // 0 to 1
  isManualControl?: boolean;
  enable3DTilt?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const ModularRank8Assemble = forwardRef<ModularRank8Handle, ModularRank8AssembleProps>(({
  size = 460,
  autoAssemble = true,
  manualProgress = 1,
  isManualControl = false,
  enable3DTilt = true,
  onComplete,
  className = '',
}, ref) => {
  // Assembly progress from 0 (scattered) to 1 (fully assembled)
  const [progress, setProgressState] = useState<number>(isManualControl ? manualProgress : 0);
  const [phase, setPhase] = useState<'scattered' | 'assembling' | 'locked' | 'exploded'>('scattered');
  const [showShockwave, setShowShockwave] = useState(false);
  const [showSheen, setShowSheen] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating ambient embers canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync manual slider if active
  useEffect(() => {
    if (isManualControl) {
      setProgressState(manualProgress);
      if (manualProgress >= 1) {
        setPhase('locked');
      } else {
        setPhase('assembling');
      }
    }
  }, [manualProgress, isManualControl]);

  // Full Cinematic Assemble Timeline
  const triggerAssemble = useCallback(() => {
    setPhase('assembling');
    setShowShockwave(false);
    setShowSheen(false);

    let startTime = performance.now();
    const duration = 1600; // 1.6s cinematic sequence

    const stepAnim = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Custom ease: smooth exponential curve
      const eased = t < 0.7 ? Math.pow(t / 0.7, 2) * 0.7 : 0.7 + (1 - Math.pow(1 - (t - 0.7) / 0.3, 3)) * 0.3;

      setProgressState(eased);

      if (t < 1) {
        requestAnimationFrame(stepAnim);
      } else {
        setProgressState(1);
        setPhase('locked');
        setShowShockwave(true);

        setTimeout(() => {
          setShowSheen(true);
          onComplete?.();
        }, 300);
      }
    };

    requestAnimationFrame(stepAnim);
  }, [onComplete]);

  // Disassemble outwards
  const triggerDisassemble = useCallback(() => {
    setPhase('scattered');
    setShowShockwave(false);
    setShowSheen(false);

    let startTime = performance.now();
    const duration = 600;

    const stepAnim = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const current = 1 - Math.pow(t, 2);

      setProgressState(current);

      if (t < 1) {
        requestAnimationFrame(stepAnim);
      } else {
        setProgressState(0);
      }
    };

    requestAnimationFrame(stepAnim);
  }, []);

  // Explode outwards and snap back
  const triggerExplode = useCallback(() => {
    setPhase('exploded');
    setProgressState(-0.4); // Over-scatter
    setShowShockwave(true);

    setTimeout(() => {
      triggerAssemble();
    }, 450);
  }, [triggerAssemble]);

  const triggerSheen = useCallback(() => {
    setShowSheen(false);
    setTimeout(() => setShowSheen(true), 20);
  }, []);

  useImperativeHandle(ref, () => ({
    assemble: triggerAssemble,
    disassemble: triggerDisassemble,
    explode: triggerExplode,
    triggerSheen,
    setProgress: (p: number) => {
      setProgressState(p);
      if (p >= 1) setPhase('locked');
    },
  }), [triggerAssemble, triggerDisassemble, triggerExplode, triggerSheen]);

  // Initial Auto-Assemble on Mount
  useEffect(() => {
    if (autoAssemble && !isManualControl) {
      const timer = setTimeout(() => {
        triggerAssemble();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [autoAssemble, isManualControl, triggerAssemble]);

  // 3D Parallax Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3DTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 22, y: -y * 22 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Ambient Flying Embers Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const embers: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
    }> = [];

    const colors = ['#fbbf24', '#ff3344', '#f59e0b', '#ffffff', '#ec4899'];

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      if (phase === 'locked' || progress > 0.8) {
        if (embers.length < 45) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * (size * 0.38) + 20;
          embers.push({
            x: size / 2 + Math.cos(angle) * dist,
            y: size / 2 + Math.sin(angle) * dist + 40,
            vx: (Math.random() - 0.5) * 0.9,
            vy: -(Math.random() * 1.5 + 0.6),
            size: Math.random() * 3.5 + 1.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 0.1,
            life: 0,
            maxLife: Math.floor(Math.random() * 60 + 40),
          });
        }
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const em = embers[i];
        em.life++;
        em.x += em.vx + Math.sin(em.life * 0.08) * 0.4;
        em.y += em.vy;

        if (em.life < em.maxLife * 0.3) {
          em.alpha = Math.min(0.9, em.alpha + 0.05);
        } else {
          em.alpha = Math.max(0, em.alpha - 0.02);
        }

        if (em.life >= em.maxLife || em.alpha <= 0.01) {
          embers.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = em.color;
        ctx.globalAlpha = em.alpha;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [size, phase, progress]);

  // Interpolation helper for piece transformation
  // progress: 0 (scattered) -> 1 (locked assembled)
  const calcPieceStyle = (
    finalX: number,
    finalY: number,
    finalScale: number,
    finalRotate: number,
    scatterX: number,
    scatterY: number,
    scatterScale: number,
    scatterRotate: number,
    delayFrac = 0 // 0 to 0.4
  ) => {
    // Effective progress considering piece arrival delay
    const p = Math.max(0, Math.min(1, (progress - delayFrac) / (1 - delayFrac)));
    const ease = 1 - Math.pow(1 - p, 3); // Cubic ease out

    const curX = scatterX + (finalX - scatterX) * ease;
    const curY = scatterY + (finalY - scatterY) * ease;
    const curScale = scatterScale + (finalScale - scatterScale) * ease;
    const curRotate = scatterRotate + (finalRotate - scatterRotate) * ease;
    const curOpacity = Math.max(0, Math.min(1, p * 1.5));

    return {
      transform: `translate3d(${curX}px, ${curY}px, 0px) scale(${curScale}) rotate(${curRotate}deg)`,
      opacity: curOpacity,
      transition: isManualControl ? 'none' : 'none',
      willChange: 'transform, opacity',
    };
  };

  const scaleRatio = size / 460;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={triggerExplode}
      className={`relative flex items-center justify-center select-none cursor-pointer perspective-[1000px] ${className}`}
      style={{ width: size, height: size }}
      title="Click để kích hoạt sóng nổ tách rời các mảnh ghép và hút hợp thể lại!"
    >
      {/* Background Energy Glow */}
      <div
        className={`absolute inset-6 rounded-full pointer-events-none transition-all duration-700 ${
          progress > 0.8 ? 'opacity-35 scale-105' : 'opacity-10 scale-75'
        }`}
        style={{
          background: 'radial-gradient(circle, #fbbf24 0%, #ff3344 40%, transparent 75%)',
        }}
      />

      {/* Shockwave Ping Ring */}
      {showShockwave && (
        <div
          key={Date.now()}
          className="absolute inset-0 rounded-full border-4 border-amber-400 pointer-events-none animate-ping duration-700 shadow-[0_0_30px_#fbbf24]"
        />
      )}

      {/* Flying Sparks Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 z-10 w-full h-full pointer-events-none"
      />

      {/* 3D Transform Wrapper for Multi-Layer Assembled Rank 8 Emblem */}
      <div
        className="relative z-20 w-full h-full pointer-events-none transition-transform duration-150 ease-out"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ======================================================== */}
        {/* LAYER 1: BACKGROUND AURA SWIRLS & CAPES (Z: 1-4)        */}
        {/* ======================================================== */}

        {/* Aura Swirl Left */}
        <img
          src="/ranks/tier_8_parts/aura_swirl_left.png"
          alt="Aura Left"
          className="absolute origin-center"
          style={{
            width: 140 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -160 * scaleRatio,
            marginTop: 40 * scaleRatio,
            zIndex: 1,
            ...calcPieceStyle(0, 0, 1, 0, -180, 120, 0.4, -60, 0.0),
          }}
        />

        {/* Aura Swirl Right */}
        <img
          src="/ranks/tier_8_parts/aura_swirl_right.png"
          alt="Aura Right"
          className="absolute origin-center"
          style={{
            width: 140 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 20 * scaleRatio,
            marginTop: 40 * scaleRatio,
            zIndex: 1,
            ...calcPieceStyle(0, 0, 1, 0, 180, 120, 0.4, 60, 0.0),
          }}
        />

        {/* Royal Cape Left */}
        <img
          src="/ranks/tier_8_parts/cape_left.png"
          alt="Cape Left"
          className="absolute origin-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          style={{
            width: 195 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -190 * scaleRatio,
            marginTop: 10 * scaleRatio,
            zIndex: 3,
            ...calcPieceStyle(0, 0, 1, 0, -220, 160, 0.3, -40, 0.05),
          }}
        />

        {/* Royal Cape Right */}
        <img
          src="/ranks/tier_8_parts/cape_right.png"
          alt="Cape Right"
          className="absolute origin-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          style={{
            width: 195 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -5 * scaleRatio,
            marginTop: 10 * scaleRatio,
            zIndex: 3,
            ...calcPieceStyle(0, 0, 1, 0, 220, 160, 0.3, 40, 0.05),
          }}
        />

        {/* Ribbon Flow Left */}
        <img
          src="/ranks/tier_8_parts/ribbon_flow.png"
          alt="Ribbon"
          className="absolute origin-center"
          style={{
            width: 85 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 110 * scaleRatio,
            marginTop: 60 * scaleRatio,
            zIndex: 4,
            ...calcPieceStyle(0, 0, 1, 0, 160, 200, 0.2, 70, 0.1),
          }}
        />

        {/* Ribbon Loop Right */}
        <img
          src="/ranks/tier_8_parts/ribbon_loop.png"
          alt="Ribbon Loop"
          className="absolute origin-center"
          style={{
            width: 90 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -180 * scaleRatio,
            marginTop: 70 * scaleRatio,
            zIndex: 4,
            ...calcPieceStyle(0, 0, 1, 0, -160, 200, 0.2, -70, 0.1),
          }}
        />

        {/* ======================================================== */}
        {/* LAYER 2: VALKYRIE WINGS & GUARDIAN DRAGONS (Z: 5-8)      */}
        {/* ======================================================== */}

        {/* Outer Left Wing */}
        <img
          src="/ranks/tier_8_parts/wing_left_outer.png"
          alt="Outer Wing Left"
          className="absolute origin-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          style={{
            width: 130 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -195 * scaleRatio,
            marginTop: -100 * scaleRatio,
            zIndex: 5,
            ...calcPieceStyle(0, 0, 1, 0, -260, -80, 0.3, -50, 0.15),
          }}
        />

        {/* Outer Right Wing */}
        <img
          src="/ranks/tier_8_parts/wing_right_outer.png"
          alt="Outer Wing Right"
          className="absolute origin-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          style={{
            width: 130 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 65 * scaleRatio,
            marginTop: -100 * scaleRatio,
            zIndex: 5,
            ...calcPieceStyle(0, 0, 1, 0, 260, -80, 0.3, 50, 0.15),
          }}
        />

        {/* Main Angel Wing Left */}
        <img
          src="/ranks/tier_8_parts/wing_left_main.png"
          alt="Main Wing Left"
          className="absolute origin-center drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
          style={{
            width: 145 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -165 * scaleRatio,
            marginTop: -90 * scaleRatio,
            zIndex: 6,
            ...calcPieceStyle(0, 0, 1, 0, -200, -140, 0.4, -35, 0.2),
          }}
        />

        {/* Main Angel Wing Right */}
        <img
          src="/ranks/tier_8_parts/wing_right_main.png"
          alt="Main Wing Right"
          className="absolute origin-center drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
          style={{
            width: 145 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 20 * scaleRatio,
            marginTop: -90 * scaleRatio,
            zIndex: 6,
            ...calcPieceStyle(0, 0, 1, 0, 200, -140, 0.4, 35, 0.2),
          }}
        />

        {/* Golden Dragon Left */}
        <img
          src="/ranks/tier_8_parts/dragon_left.png"
          alt="Dragon Left"
          className="absolute origin-center drop-shadow-[0_6px_16px_rgba(251,191,36,0.3)]"
          style={{
            width: 135 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -130 * scaleRatio,
            marginTop: -150 * scaleRatio,
            zIndex: 7,
            ...calcPieceStyle(0, 0, 1, 0, -150, -240, 0.3, -40, 0.25),
          }}
        />

        {/* Golden Dragon Right */}
        <img
          src="/ranks/tier_8_parts/dragon_right.png"
          alt="Dragon Right"
          className="absolute origin-center drop-shadow-[0_6px_16px_rgba(251,191,36,0.3)]"
          style={{
            width: 135 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -5 * scaleRatio,
            marginTop: -150 * scaleRatio,
            zIndex: 7,
            ...calcPieceStyle(0, 0, 1, 0, 150, -240, 0.3, 40, 0.25),
          }}
        />

        {/* Wing Feathers Accent Left */}
        <img
          src="/ranks/tier_8_parts/wing_accent_curve_l.png"
          alt="Wing Accent"
          className="absolute origin-center"
          style={{
            width: 60 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -110 * scaleRatio,
            marginTop: 0 * scaleRatio,
            zIndex: 8,
            ...calcPieceStyle(0, 0, 1, 0, -140, 50, 0.4, -30, 0.22),
          }}
        />

        {/* Wing Feathers Accent Right */}
        <img
          src="/ranks/tier_8_parts/wing_accent_curve_r.png"
          alt="Wing Accent"
          className="absolute origin-center"
          style={{
            width: 60 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 50 * scaleRatio,
            marginTop: 0 * scaleRatio,
            zIndex: 8,
            ...calcPieceStyle(0, 0, 1, 0, 140, 50, 0.4, 30, 0.22),
          }}
        />

        {/* ======================================================== */}
        {/* LAYER 3: CORE GOLD SHIELD & BOTTOM CHEVRON (Z: 9-11)     */}
        {/* ======================================================== */}

        {/* Bottom Gold Chevron */}
        <img
          src="/ranks/tier_8_parts/chevron.png"
          alt="Chevron"
          className="absolute origin-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          style={{
            width: 130 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -65 * scaleRatio,
            marginTop: 45 * scaleRatio,
            zIndex: 9,
            ...calcPieceStyle(0, 0, 1, 0, 0, 180, 0.3, 0, 0.3),
          }}
        />

        {/* Center Golden Shield with Ruby Core */}
        <img
          src="/ranks/tier_8_parts/core_shield.png"
          alt="Core Shield"
          className="absolute origin-center drop-shadow-[0_8px_24px_rgba(255,51,68,0.4)]"
          style={{
            width: 175 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -87.5 * scaleRatio,
            marginTop: -75 * scaleRatio,
            zIndex: 10,
            ...calcPieceStyle(0, 0, 1, 0, 0, 0, 0.2, 0, 0.35),
          }}
        />

        {/* Center Dangling Ruby Crystal */}
        <img
          src="/ranks/tier_8_parts/pendant_crystal.png"
          alt="Crystal"
          className="absolute origin-center drop-shadow-[0_4px_10px_rgba(255,51,68,0.5)]"
          style={{
            width: 55 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -27.5 * scaleRatio,
            marginTop: 90 * scaleRatio,
            zIndex: 11,
            ...calcPieceStyle(0, 0, 1, 0, 0, 220, 0.2, 0, 0.38),
          }}
        />

        {/* Left Dangling Beads */}
        <img
          src="/ranks/tier_8_parts/pendant_bead_l.png"
          alt="Beads Left"
          className="absolute origin-center"
          style={{
            width: 30 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -70 * scaleRatio,
            marginTop: 80 * scaleRatio,
            zIndex: 11,
            ...calcPieceStyle(0, 0, 1, 0, -60, 200, 0.2, -20, 0.4),
          }}
        />

        {/* Right Dangling Beads */}
        <img
          src="/ranks/tier_8_parts/pendant_bead_r.png"
          alt="Beads Right"
          className="absolute origin-center"
          style={{
            width: 32 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 40 * scaleRatio,
            marginTop: 80 * scaleRatio,
            zIndex: 11,
            ...calcPieceStyle(0, 0, 1, 0, 60, 200, 0.2, 20, 0.4),
          }}
        />

        {/* ======================================================== */}
        {/* LAYER 4: ROYAL GOLD CROWN & APEX RUBY DIAMOND (Z: 12-15) */}
        {/* ======================================================== */}

        {/* Royal Crown on Top */}
        <img
          src="/ranks/tier_8_parts/crown.png"
          alt="Crown"
          className="absolute origin-center drop-shadow-[0_6px_16px_rgba(251,191,36,0.5)]"
          style={{
            width: 160 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -80 * scaleRatio,
            marginTop: -165 * scaleRatio,
            zIndex: 13,
            ...calcPieceStyle(0, 0, 1, 0, 0, -250, 0.2, 0, 0.45),
          }}
        />

        {/* Apex Grand Ruby Diamond on Top */}
        <img
          src="/ranks/tier_8_parts/gem_diamond.png"
          alt="Grand Diamond"
          className="absolute origin-center drop-shadow-[0_0_20px_rgba(255,51,68,0.7)]"
          style={{
            width: 85 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -42.5 * scaleRatio,
            marginTop: -195 * scaleRatio,
            zIndex: 15,
            ...calcPieceStyle(0, 0, 1, 0, 0, -280, 0.1, 0, 0.5),
          }}
        />

        {/* Sparkle Star Gold Accent */}
        <img
          src="/ranks/tier_8_parts/spark_star_gold.png"
          alt="Spark Star"
          className="absolute origin-center animate-pulse"
          style={{
            width: 45 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: 70 * scaleRatio,
            marginTop: -140 * scaleRatio,
            zIndex: 16,
            ...calcPieceStyle(0, 0, 1, 0, 160, -200, 0.1, 90, 0.5),
          }}
        />

        {/* Sparkle Ruby Accent Left */}
        <img
          src="/ranks/tier_8_parts/spark_ruby_crystal.png"
          alt="Ruby Spark"
          className="absolute origin-center animate-pulse"
          style={{
            width: 50 * scaleRatio,
            left: '50%',
            top: '50%',
            marginLeft: -120 * scaleRatio,
            marginTop: -130 * scaleRatio,
            zIndex: 16,
            ...calcPieceStyle(0, 0, 1, 0, -160, -200, 0.1, -90, 0.5),
          }}
        />

        {/* ======================================================== */}
        {/* LAYER 5: METALLIC LIGHT SHEEN SWEEP (Z: 20)              */}
        {/* ======================================================== */}
        {showSheen && (
          <div
            className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
            style={{
              maskImage: 'radial-gradient(circle at center, black 60%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 60%, transparent 90%)',
            }}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -skew-x-30 animate-[sheen_1.1s_ease-in-out_forwards]" />
          </div>
        )}
      </div>
    </div>
  );
});

ModularRank8Assemble.displayName = 'ModularRank8Assemble';
