import React, { useState, useRef, useEffect } from 'react';

export type LiquidVariant = 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
export type LiquidSize = 'sm' | 'md' | 'lg';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LiquidVariant;
  size?: LiquidSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fillPercentage?: number; // Optional manual fill (0 - 100)
  autoFillOnHover?: boolean; // Default true (hover fills like pouring liquid)
  glow?: boolean;
}

const THEMES: Record<LiquidVariant, {
  border: string;
  bgBase: string;
  textBase: string;
  textFilled: string;
  glowShadow: string;
  colorFront: string;
  colorBack: string;
  colorSurface: string;
}> = {
  indigo: {
    border: 'border-[#5c36f5]/50 hover:border-[#5c36f5]',
    bgBase: 'bg-[#080b18]',
    textBase: 'text-indigo-300/80',
    textFilled: 'text-white',
    glowShadow: 'group-hover:shadow-[0_0_28px_rgba(92,54,245,0.75)]',
    colorFront: 'rgba(92, 54, 245, 0.95)',
    colorBack: 'rgba(65, 34, 189, 0.65)',
    colorSurface: '#c4b5fd',
  },
  cyan: {
    border: 'border-cyan-500/50 hover:border-cyan-400',
    bgBase: 'bg-[#04121d]',
    textBase: 'text-cyan-300/80',
    textFilled: 'text-white',
    glowShadow: 'group-hover:shadow-[0_0_28px_rgba(6,182,212,0.75)]',
    colorFront: 'rgba(8, 145, 178, 0.95)',
    colorBack: 'rgba(6, 182, 212, 0.6)',
    colorSurface: '#a5f3fc',
  },
  emerald: {
    border: 'border-emerald-500/50 hover:border-emerald-400',
    bgBase: 'bg-[#031510]',
    textBase: 'text-emerald-300/80',
    textFilled: 'text-white',
    glowShadow: 'group-hover:shadow-[0_0_28px_rgba(16,185,129,0.75)]',
    colorFront: 'rgba(5, 150, 105, 0.95)',
    colorBack: 'rgba(16, 185, 129, 0.6)',
    colorSurface: '#a7f3d0',
  },
  amber: {
    border: 'border-amber-500/50 hover:border-amber-400',
    bgBase: 'bg-[#150f03]',
    textBase: 'text-amber-300/80',
    textFilled: 'text-white',
    glowShadow: 'group-hover:shadow-[0_0_28px_rgba(245,158,11,0.75)]',
    colorFront: 'rgba(217, 119, 6, 0.95)',
    colorBack: 'rgba(245, 158, 11, 0.6)',
    colorSurface: '#fef08a',
  },
  rose: {
    border: 'border-rose-500/50 hover:border-rose-400',
    bgBase: 'bg-[#16060c]',
    textBase: 'text-rose-300/80',
    textFilled: 'text-white',
    glowShadow: 'group-hover:shadow-[0_0_28px_rgba(244,63,94,0.75)]',
    colorFront: 'rgba(225, 29, 72, 0.95)',
    colorBack: 'rgba(244, 63, 94, 0.6)',
    colorSurface: '#fecdd3',
  },
  purple: {
    border: 'border-purple-500/50 hover:border-purple-400',
    bgBase: 'bg-[#10061a]',
    textBase: 'text-purple-300/80',
    textFilled: 'text-white',
    glowShadow: 'group-hover:shadow-[0_0_28px_rgba(168,85,247,0.75)]',
    colorFront: 'rgba(147, 51, 234, 0.95)',
    colorBack: 'rgba(168, 85, 247, 0.6)',
    colorSurface: '#e9d5ff',
  },
};

const SIZES: Record<LiquidSize, {
  padding: string;
  fontSize: string;
  height: string;
}> = {
  sm: {
    padding: 'px-4 py-2',
    fontSize: 'text-xs',
    height: 'h-9',
  },
  md: {
    padding: 'px-6 py-3',
    fontSize: 'text-sm',
    height: 'h-12',
  },
  lg: {
    padding: 'px-8 py-4',
    fontSize: 'text-base',
    height: 'h-14',
  },
};

export const LiquidFillButton: React.FC<LiquidButtonProps> = ({
  variant = 'indigo',
  size = 'md',
  icon,
  children,
  className = '',
  fillPercentage,
  autoFillOnHover = true,
  glow = true,
  disabled = false,
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const overlayTextRef = useRef<HTMLDivElement | null>(null);

  const theme = THEMES[variant] || THEMES.indigo;
  const sizeConf = SIZES[size] || SIZES.md;

  const currentTargetFill = typeof fillPercentage === 'number'
    ? Math.min(100, Math.max(0, fillPercentage))
    : autoFillOnHover
    ? isHovered
      ? 100
      : 0
    : 0;

  // Fluid physics animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentLevel = 0; // 0 to 100
    let step = 0;
    let slosh = 0;
    let sloshTarget = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Smooth liquid pouring speed (gentle, steady, graceful fill)
      const target = currentTargetFill;
      const speed = target > currentLevel ? 0.016 : 0.038;
      currentLevel += (target - currentLevel) * speed;

      // Sync progressive text clipping in real-time
      if (overlayTextRef.current) {
        const clipTop = Math.max(0, Math.min(100, 100 - currentLevel));
        overlayTextRef.current.style.clipPath = `inset(${clipTop}% 0 0 0)`;
      }

      // Smooth slosh damping
      slosh += (sloshTarget - slosh) * 0.06;
      sloshTarget *= 0.92;

      if (currentLevel > 0.1) {
        step += 0.03;
        // Total water height covers slightly beyond top at 100% so full button is submerged
        const waterHeight = (currentLevel / 100) * (height + 16);
        const baseSurfaceY = height - waterHeight;
        const waveScale = Math.max(0, 1 - currentLevel / 92); // flatten wave smoothly as cup tops off

        // 1. Render Back Depth Wave
        ctx.fillStyle = theme.colorBack;
        ctx.beginPath();
        ctx.moveTo(-4, height + 4);
        for (let x = -4; x <= width + 4; x += 4) {
          const wave =
            (Math.sin(x * 0.035 + step * 1.1) * 3.5 +
            Math.cos(x * 0.02 - step * 0.7) * 2 +
            ((x - width / 2) / width) * slosh) * waveScale;
          const y = Math.min(height + 4, Math.max(-12, baseSurfaceY + wave));
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width + 4, height + 4);
        ctx.closePath();
        ctx.fill();

        // 2. Render Front Primary Wave
        ctx.fillStyle = theme.colorFront;
        ctx.beginPath();
        ctx.moveTo(-4, height + 4);
        const frontPoints: { x: number; y: number }[] = [];
        for (let x = -4; x <= width + 4; x += 4) {
          const wave =
            (Math.sin(x * 0.04 - step * 1.3) * 4.5 +
            Math.cos(x * 0.025 + step * 0.8) * 2.5 +
            ((x - width / 2) / width) * slosh) * waveScale;
          const y = Math.min(height + 4, Math.max(-12, baseSurfaceY + wave));
          frontPoints.push({ x, y });
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width + 4, height + 4);
        ctx.closePath();
        ctx.fill();

        // 3. Render Specular Surface Foam Line (only when wave is visible)
        if (frontPoints.length > 0 && waveScale > 0.04) {
          ctx.strokeStyle = theme.colorSurface;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(frontPoints[0].x, frontPoints[0].y);
          for (let i = 1; i < frontPoints.length; i++) {
            ctx.lineTo(frontPoints[i].x, frontPoints[i].y);
          }
          ctx.stroke();
        }
      }

      ctx.restore();

      // Continue animation loop if liquid is actively filling, draining or present
      if (currentLevel > 0.05 || currentTargetFill > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const normX = (mouseX / rect.width - 0.5) * 2;
      sloshTarget = normX * 7;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animId);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [currentTargetFill, theme]);

  return (
    <button
      ref={containerRef}
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bgBase} ${
        sizeConf.padding
      } ${sizeConf.fontSize} ${
        glow ? theme.glowShadow : ''
      } font-black transition-all duration-300 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {/* Real-time HTML5 60FPS Fluid Physics Water Simulation Canvas with -inset-[4px] to eliminate any border gaps */}
      <canvas
        ref={canvasRef}
        className="absolute -inset-[4px] w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none z-0 rounded-2xl"
      />

      {/* Layer 1: Base Unsubmerged Text (Behind water) */}
      <div className={`relative z-10 flex items-center justify-center gap-2 ${theme.textBase} font-extrabold tracking-wide`}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>

      {/* Layer 2: Submerged Text Layer (Color changes progressively as water rises via CSS clipPath) */}
      <div
        ref={overlayTextRef}
        style={{ clipPath: 'inset(100% 0 0 0)' }}
        className={`absolute inset-0 z-20 flex items-center justify-center gap-2 ${theme.textFilled} font-extrabold tracking-wide pointer-events-none ${sizeConf.padding}`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    </button>
  );
};

export default LiquidFillButton;
