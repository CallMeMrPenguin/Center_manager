import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Particle, ParticleShape, AnimationMode } from '../types';

export interface RankParticleCanvasHandle {
  assemble: () => void;
  disassemble: () => void;
  blast: (clientX?: number, clientY?: number) => void;
  reset: () => void;
}

interface RankParticleCanvasProps {
  imageSrc: string;
  size?: number;
  tierColor?: string;
  shape?: ParticleShape;
  step?: number;
  speed?: number;
  scatterRadius?: number;
  enableMouseRepel?: boolean;
  autoReplay?: boolean;
  onCompleteAssemble?: () => void;
  className?: string;
}

export const RankParticleCanvas = forwardRef<RankParticleCanvasHandle, RankParticleCanvasProps>(({
  imageSrc,
  size = 200,
  tierColor = '#fbbf24',
  shape = 'square',
  step = 3,
  speed = 1.0,
  scatterRadius = 150,
  enableMouseRepel = true,
  autoReplay = false,
  onCompleteAssemble,
  className = '',
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animModeRef = useRef<AnimationMode>('assemble');
  const animProgressRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number; isInside: boolean }>({ x: -999, y: -999, isInside: false });
  const [isAssembledState, setIsAssembledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and sample particles from image
  const initParticles = useCallback(() => {
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0, size, size);
      const imgData = tempCtx.getImageData(0, 0, size, size).data;

      const particles: Particle[] = [];
      const centerX = size / 2;
      const centerY = size / 2;
      const effectiveStep = Math.max(2, Math.min(6, step));

      for (let y = 0; y < size; y += effectiveStep) {
        for (let x = 0; x < size; x += effectiveStep) {
          const index = (y * size + x) * 4;
          const alpha = imgData[index + 3];

          if (alpha > 45) {
            const r = imgData[index];
            const g = imgData[index + 1];
            const b = imgData[index + 2];

            // Random initial vortex/explosion angle & distance
            const angle = Math.random() * Math.PI * 2;
            const dist = (size * 0.4 + Math.random() * scatterRadius);

            const startX = centerX + Math.cos(angle) * dist;
            const startY = centerY + Math.sin(angle) * dist;

            particles.push({
              x: startX,
              y: startY,
              originX: startX,
              originY: startY,
              targetX: x,
              targetY: y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: `rgba(${r}, ${g}, ${b}, ${alpha / 255})`,
              r, g, b,
              size: effectiveStep * 0.95,
              alpha: 0,
              angle: Math.random() * Math.PI * 2,
              speed: (0.08 + Math.random() * 0.08) * speed,
              friction: 0.88,
              spring: 0.12 * speed,
            });
          }
        }
      }

      particlesRef.current = particles;
      animModeRef.current = 'assemble';
      animProgressRef.current = 0;
      setIsAssembledState(false);
      setIsLoading(false);
    };
  }, [imageSrc, size, step, speed, scatterRadius]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  const triggerAssemble = useCallback(() => {
    const centerX = size / 2;
    const centerY = size / 2;
    for (const p of particlesRef.current) {
      const angle = Math.random() * Math.PI * 2;
      const dist = (size * 0.4 + Math.random() * scatterRadius);
      p.x = centerX + Math.cos(angle) * dist;
      p.y = centerY + Math.sin(angle) * dist;
      p.vx = (Math.random() - 0.5) * 6;
      p.vy = (Math.random() - 0.5) * 6;
      p.alpha = 0.1;
    }
    animModeRef.current = 'assemble';
    animProgressRef.current = 0;
    setIsAssembledState(false);
  }, [size, scatterRadius]);

  const triggerDisassemble = useCallback(() => {
    const centerX = size / 2;
    const centerY = size / 2;
    for (const p of particlesRef.current) {
      const angle = Math.atan2(p.y - centerY, p.x - centerX) + (Math.random() - 0.5) * 0.8;
      const force = (Math.random() * 8 + 4) * speed;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
    }
    animModeRef.current = 'disassemble';
    setIsAssembledState(false);
  }, [size, speed]);

  const triggerBlast = useCallback((clientX?: number, clientY?: number) => {
    const canvas = canvasRef.current;
    let blastX = size / 2;
    let blastY = size / 2;

    if (canvas && clientX !== undefined && clientY !== undefined) {
      const rect = canvas.getBoundingClientRect();
      blastX = ((clientX - rect.left) / rect.width) * size;
      blastY = ((clientY - rect.top) / rect.height) * size;
    }

    for (const p of particlesRef.current) {
      const dx = p.x - blastX;
      const dy = p.y - blastY;
      const dist = Math.max(5, Math.hypot(dx, dy));
      const force = (size / dist) * (Math.random() * 6 + 4);
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    }
    animModeRef.current = 'assemble';
    setIsAssembledState(false);
  }, [size]);

  useImperativeHandle(ref, () => ({
    assemble: triggerAssemble,
    disassemble: triggerDisassemble,
    blast: triggerBlast,
    reset: initParticles,
  }), [triggerAssemble, triggerDisassemble, triggerBlast, initParticles]);

  // Main Render Loop (60/120 FPS requestAnimationFrame)
  useEffect(() => {
    let animId: number;
    let replayTimer: any;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);

      const particles = particlesRef.current;
      const mode = animModeRef.current;
      const mouse = mousePosRef.current;

      let allSettled = true;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (mode === 'assemble') {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx += dx * p.spring;
          p.vy += dy * p.spring;
          p.vx *= p.friction;
          p.vy *= p.friction;

          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.min(1, p.alpha + 0.04 * speed);

          if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6 || Math.abs(p.vx) > 0.2 || Math.abs(p.vy) > 0.2) {
            allSettled = false;
          }
        } else if (mode === 'disassemble') {
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.max(0, p.alpha - 0.02 * speed);
        }

        // Mouse Repel Physics (Interact with cursor)
        if (enableMouseRepel && mouse.isInside) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          const repelRadius = 45;

          if (mdist < repelRadius && mdist > 0.1) {
            const force = ((repelRadius - mdist) / repelRadius) * 4;
            p.vx += (mdx / mdist) * force;
            p.vy += (mdy / mdist) * force;
          }
        }

        // Draw particle
        if (p.alpha > 0.01) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;

          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (shape === 'diamond') {
            const s = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - s / 2);
            ctx.lineTo(p.x + s / 2, p.y);
            ctx.lineTo(p.x, p.y + s / 2);
            ctx.lineTo(p.x - s / 2, p.y);
            ctx.closePath();
            ctx.fill();
          } else {
            // Square (Fastest)
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
        }
      }

      ctx.globalAlpha = 1.0;

      if (mode === 'assemble' && allSettled && particles.length > 0) {
        animModeRef.current = 'assembled';
        setIsAssembledState(true);
        onCompleteAssemble?.();

        if (autoReplay) {
          replayTimer = setTimeout(() => {
            triggerAssemble();
          }, 2400);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      if (replayTimer) clearTimeout(replayTimer);
    };
  }, [size, speed, shape, enableMouseRepel, autoReplay, onCompleteAssemble, triggerAssemble]);

  // Pointer event handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    triggerBlast(e.clientX, e.clientY);
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Tier Aura Ring */}
      {isAssembledState && (
        <div
          className="absolute inset-2 rounded-full pointer-events-none opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${tierColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* High-Performance Canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        className="relative z-10 w-full h-full cursor-pointer touch-none"
        title="Nhấp để tạo sóng nổ hạt! Rê chuột để đẩy hạt."
      />
    </div>
  );
});

RankParticleCanvas.displayName = 'RankParticleCanvas';
