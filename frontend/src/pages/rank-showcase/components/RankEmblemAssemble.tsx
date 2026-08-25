import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

export interface RankEmblemAssembleHandle {
  assemble: () => void;
  disassemble: () => void;
  blast: (clientX?: number, clientY?: number) => void;
  triggerSheen: () => void;
}

interface FlyingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  type: 'ambient' | 'inflow' | 'burst';
  angle?: number;
  dist?: number;
  speed?: number;
}

interface RankEmblemAssembleProps {
  imageSrc: string;
  size?: number;
  tierColor?: string;
  tierName?: string;
  autoReplay?: boolean;
  enableMouseInteraction?: boolean;
  particleCount?: number;
  onCompleteAssemble?: () => void;
  className?: string;
}

export const RankEmblemAssemble = forwardRef<RankEmblemAssembleHandle, RankEmblemAssembleProps>(({
  imageSrc,
  size = 240,
  tierColor = '#fbbf24',
  autoReplay = false,
  enableMouseInteraction = true,
  particleCount = 50,
  onCompleteAssemble,
  className = '',
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<FlyingParticle[]>([]);
  const animPhaseRef = useRef<'inflow' | 'locked' | 'disassembling'>('locked');
  const [emblemState, setEmblemState] = useState<'hidden' | 'incoming' | 'locked' | 'disassembling'>('locked');
  const [showShockwave, setShowShockwave] = useState(false);
  const [showSheen, setShowSheen] = useState(false);
  const mousePosRef = useRef<{ x: number; y: number; isInside: boolean }>({ x: -999, y: -999, isInside: false });

  // Spawn an ambient ember floating upward
  const createAmbientEmber = useCallback((cx: number, cy: number): FlyingParticle => {
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = (Math.random() * 0.45 + 0.1) * size;
    const x = cx + Math.cos(angle) * spawnDist;
    const y = cy + Math.sin(angle) * spawnDist + 20;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 1.2 + 0.4),
      size: Math.random() * 3.5 + 1.5,
      color: tierColor,
      alpha: 0.1,
      maxAlpha: Math.random() * 0.7 + 0.3,
      life: 0,
      maxLife: Math.floor(Math.random() * 70 + 50),
      type: 'ambient',
    };
  }, [size, tierColor]);

  // Trigger Inflow Assemble Sequence (Game Style)
  const triggerAssemble = useCallback(() => {
    setEmblemState('hidden');
    setShowShockwave(false);
    setShowSheen(false);
    animPhaseRef.current = 'inflow';

    const cx = size / 2;
    const cy = size / 2;
    const inflowParticles: FlyingParticle[] = [];

    // Create 60 vortex inflow particles rushing into center
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = size * (0.8 + Math.random() * 0.8);
      inflowParticles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        size: Math.random() * 4 + 2,
        color: tierColor,
        alpha: 0.1,
        maxAlpha: Math.random() * 0.8 + 0.2,
        life: 0,
        maxLife: Math.floor(Math.random() * 30 + 35),
        type: 'inflow',
        angle,
        dist,
        speed: Math.random() * 0.07 + 0.05,
      });
    }

    particlesRef.current = inflowParticles;

    // After 600ms of particles gathering, slam the emblem into place with shockwave
    setTimeout(() => {
      setEmblemState('incoming');
      setTimeout(() => {
        setEmblemState('locked');
        setShowShockwave(true);
        animPhaseRef.current = 'locked';

        // Spawn lock-in burst particles
        for (let i = 0; i < 40; i++) {
          const bAngle = Math.random() * Math.PI * 2;
          const bSpeed = Math.random() * 5 + 2.5;
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(bAngle) * bSpeed,
            vy: Math.sin(bAngle) * bSpeed,
            size: Math.random() * 4 + 2,
            color: tierColor,
            alpha: 1.0,
            maxAlpha: 1.0,
            life: 0,
            maxLife: Math.floor(Math.random() * 40 + 25),
            type: 'burst',
          });
        }

        // Trigger metallic light sheen glint
        setTimeout(() => {
          setShowSheen(true);
          onCompleteAssemble?.();
        }, 200);
      }, 350);
    }, 450);
  }, [size, tierColor, onCompleteAssemble]);

  // Trigger Disassemble
  const triggerDisassemble = useCallback(() => {
    setEmblemState('disassembling');
    setShowShockwave(false);
    setShowSheen(false);
    animPhaseRef.current = 'disassembling';

    const cx = size / 2;
    const cy = size / 2;

    // Burst particles outwards
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: tierColor,
        alpha: 1.0,
        maxAlpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 45 + 30),
        type: 'burst',
      });
    }

    setTimeout(() => {
      setEmblemState('hidden');
    }, 400);
  }, [size, tierColor]);

  // Trigger Blast Wave
  const triggerBlast = useCallback((clientX?: number, clientY?: number) => {
    const canvas = canvasRef.current;
    let blastX = size / 2;
    let blastY = size / 2;

    if (canvas && clientX !== undefined && clientY !== undefined) {
      const rect = canvas.getBoundingClientRect();
      blastX = ((clientX - rect.left) / rect.width) * size;
      blastY = ((clientY - rect.top) / rect.height) * size;
    }

    setShowShockwave(false);
    setTimeout(() => setShowShockwave(true), 10);
    setShowSheen(false);
    setTimeout(() => setShowSheen(true), 250);

    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      particlesRef.current.push({
        x: blastX,
        y: blastY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4.5 + 1.5,
        color: tierColor,
        alpha: 1.0,
        maxAlpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 40 + 20),
        type: 'burst',
      });
    }
  }, [size, tierColor]);

  const triggerSheen = useCallback(() => {
    setShowSheen(false);
    setTimeout(() => setShowSheen(true), 10);
  }, []);

  useImperativeHandle(ref, () => ({
    assemble: triggerAssemble,
    disassemble: triggerDisassemble,
    blast: triggerBlast,
    triggerSheen,
  }), [triggerAssemble, triggerDisassemble, triggerBlast, triggerSheen]);

  // Initial spawn
  useEffect(() => {
    triggerAssemble();
  }, [triggerAssemble]);

  // Auto Replay Loop
  useEffect(() => {
    if (!autoReplay) return;
    const interval = setInterval(() => {
      triggerAssemble();
    }, 4500);
    return () => clearInterval(interval);
  }, [autoReplay, triggerAssemble]);

  // Particle Engine Render Loop (60/120 FPS)
  useEffect(() => {
    let animId: number;
    const cx = size / 2;
    const cy = size / 2;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);

      // Maintain ambient particle count when locked
      if (animPhaseRef.current === 'locked') {
        const ambientCount = particlesRef.current.filter(p => p.type === 'ambient').length;
        if (ambientCount < particleCount) {
          particlesRef.current.push(createAmbientEmber(cx, cy));
        }
      }

      const mouse = mousePosRef.current;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;

        if (p.type === 'inflow') {
          // Vortex convergence towards center
          if (p.dist !== undefined && p.angle !== undefined) {
            p.dist *= 0.91;
            p.angle += p.speed || 0.05;
            p.x = cx + Math.cos(p.angle) * p.dist;
            p.y = cy + Math.sin(p.angle) * p.dist;
            p.alpha = Math.min(p.maxAlpha, p.alpha + 0.05);

            if (p.dist < 8) {
              particlesRef.current.splice(i, 1);
              continue;
            }
          }
        } else if (p.type === 'ambient') {
          p.x += p.vx + Math.sin(p.life * 0.05) * 0.3;
          p.y += p.vy;

          if (p.life < p.maxLife * 0.3) {
            p.alpha = Math.min(p.maxAlpha, p.alpha + 0.03);
          } else {
            p.alpha = Math.max(0, p.alpha - 0.015);
          }
        } else if (p.type === 'burst') {
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
        }

        // Mouse Repel Physics
        if (enableMouseInteraction && mouse.isInside) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < 50 && mdist > 0.1) {
            const force = ((50 - mdist) / 50) * 3.5;
            p.x += (mdx / mdist) * force;
            p.y += (mdy / mdist) * force;
          }
        }

        if (p.life >= p.maxLife || p.alpha <= 0.01) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Draw glowing particle spark
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [size, tierColor, particleCount, createAmbientEmber, enableMouseInteraction]);

  // Pointer event handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * size,
      y: ((e.clientY - rect.top) / rect.height) * size,
      isInside: true,
    };
  };

  const handlePointerLeave = () => {
    mousePosRef.current = { x: -999, y: -999, isInside: false };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    triggerBlast(e.clientX, e.clientY);
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer group ${className}`}
      style={{ width: size, height: size }}
      title="Click để tạo sóng nổ hạt năng lượng! Rê chuột để đẩy bụi sáng."
    >
      {/* 1. Background Cosmic Radial Aura */}
      <div
        className={`absolute inset-4 rounded-full pointer-events-none transition-all duration-700 ${
          emblemState === 'locked' ? 'opacity-30 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          background: `radial-gradient(circle, ${tierColor} 0%, transparent 70%)`,
        }}
      />

      {/* 2. Shockwave Expanding Energy Ring */}
      {showShockwave && (
        <div
          key={Date.now()}
          className="absolute inset-0 rounded-full border-2 pointer-events-none animate-ping duration-700"
          style={{
            borderColor: tierColor,
            boxShadow: `0 0 20px ${tierColor}`,
          }}
        />
      )}

      {/* 3. Particle Canvas (Flying Embers, Inflow Vortex, Spark Bursts) */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 z-10 w-full h-full pointer-events-none"
      />

      {/* 4. High-Definition Rank Emblem with Game-Style Assemble Animation */}
      <div
        className={`relative z-20 flex items-center justify-center transition-all duration-500 transform ${
          emblemState === 'hidden'
            ? 'opacity-0 scale-50 -translate-y-6'
            : emblemState === 'incoming'
            ? 'opacity-90 scale-115 translate-y-0 duration-300'
            : emblemState === 'locked'
            ? 'opacity-100 scale-100 translate-y-0 group-hover:scale-105 duration-300'
            : 'opacity-0 scale-125 translate-y-4 duration-400'
        }`}
        style={{
          width: size * 0.72,
          height: size * 0.72,
          filter: emblemState === 'locked' ? `drop-shadow(0 4px 16px ${tierColor}55)` : 'none',
        }}
      >
        {/* Crisp Emblem Image */}
        <img
          src={imageSrc}
          alt="Rank Emblem"
          className="w-full h-full object-contain pointer-events-none select-none"
        />

        {/* 5. Metallic Light Sheen Sweep (Glint effect across the emblem) */}
        {showSheen && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl"
            style={{
              maskImage: `url(${imageSrc})`,
              WebkitMaskImage: `url(${imageSrc})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent -skew-x-25 animate-[sheen_1s_ease-in-out_forwards]" />
          </div>
        )}
      </div>
    </div>
  );
});

RankEmblemAssemble.displayName = 'RankEmblemAssemble';
