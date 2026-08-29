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
  textColor: string;
  textHover: string;
  glowShadow: string;
  colorFront: string;
  colorBack: string;
  colorSurface: string;
}> = {
  indigo: {
    border: 'border-[#5c36f5]/40 hover:border-[#5c36f5]',
    bgBase: 'bg-[#0a0d1c]',
    textColor: 'text-indigo-200',
    textHover: 'group-hover:text-white',
    glowShadow: 'group-hover:shadow-[0_0_26px_rgba(92,54,245,0.7)]',
    colorFront: 'rgba(92, 54, 245, 0.92)',
    colorBack: 'rgba(65, 34, 189, 0.55)',
    colorSurface: '#a594fd',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bgBase: 'bg-[#051322]',
    textColor: 'text-cyan-200',
    textHover: 'group-hover:text-white',
    glowShadow: 'group-hover:shadow-[0_0_26px_rgba(6,182,212,0.7)]',
    colorFront: 'rgba(8, 145, 178, 0.92)',
    colorBack: 'rgba(6, 182, 212, 0.5)',
    colorSurface: '#67e8f9',
  },
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-400',
    bgBase: 'bg-[#041512]',
    textColor: 'text-emerald-200',
    textHover: 'group-hover:text-white',
    glowShadow: 'group-hover:shadow-[0_0_26px_rgba(16,185,129,0.7)]',
    colorFront: 'rgba(5, 150, 105, 0.92)',
    colorBack: 'rgba(16, 185, 129, 0.5)',
    colorSurface: '#6ee7b7',
  },
  amber: {
    border: 'border-amber-500/40 hover:border-amber-400',
    bgBase: 'bg-[#160f04]',
    textColor: 'text-amber-200',
    textHover: 'group-hover:text-white',
    glowShadow: 'group-hover:shadow-[0_0_26px_rgba(245,158,11,0.7)]',
    colorFront: 'rgba(217, 119, 6, 0.92)',
    colorBack: 'rgba(245, 158, 11, 0.5)',
    colorSurface: '#fde68a',
  },
  rose: {
    border: 'border-rose-500/40 hover:border-rose-400',
    bgBase: 'bg-[#18070e]',
    textColor: 'text-rose-200',
    textHover: 'group-hover:text-white',
    glowShadow: 'group-hover:shadow-[0_0_26px_rgba(244,63,94,0.7)]',
    colorFront: 'rgba(225, 29, 72, 0.92)',
    colorBack: 'rgba(244, 63, 94, 0.5)',
    colorSurface: '#fda4af',
  },
  purple: {
    border: 'border-purple-500/40 hover:border-purple-400',
    bgBase: 'bg-[#11071c]',
    textColor: 'text-purple-200',
    textHover: 'group-hover:text-white',
    glowShadow: 'group-hover:shadow-[0_0_26px_rgba(168,85,247,0.7)]',
    colorFront: 'rgba(147, 51, 234, 0.92)',
    colorBack: 'rgba(168, 85, 247, 0.5)',
    colorSurface: '#d8b4fe',
  },
};

const SIZES: Record<LiquidSize, {
  padding: string;
  fontSize: string;
  height: string;
}> = {
  sm: {
    padding: 'px-3.5 py-1.5',
    fontSize: 'text-xs',
    height: 'h-8',
  },
  md: {
    padding: 'px-5 py-2.5',
    fontSize: 'text-sm',
    height: 'h-11',
  },
  lg: {
    padding: 'px-7 py-3.5',
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

      // Smooth liquid level pouring acceleration
      const target = currentTargetFill;
      const speed = target > currentLevel ? 0.055 : 0.085; // Viscous filling, crisp draining
      currentLevel += (target - currentLevel) * speed;

      // Smooth slosh damping
      slosh += (sloshTarget - slosh) * 0.08;
      sloshTarget *= 0.94; // Decay slosh

      if (currentLevel > 0.3) {
        step += 0.045;
        const waterHeight = (currentLevel / 100) * height;
        const baseSurfaceY = height - waterHeight;

        // 1. Render Back Depth Wave
        ctx.fillStyle = theme.colorBack;
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 4) {
          const wave =
            Math.sin(x * 0.035 + step * 1.2) * 3.5 +
            Math.cos(x * 0.02 - step * 0.8) * 2 +
            ((x - width / 2) / width) * slosh;
          const y = Math.min(height, Math.max(0, baseSurfaceY + wave));
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // 2. Render Front Primary Wave
        ctx.fillStyle = theme.colorFront;
        ctx.beginPath();
        ctx.moveTo(0, height);
        const frontPoints: { x: number; y: number }[] = [];
        for (let x = 0; x <= width; x += 4) {
          const wave =
            Math.sin(x * 0.04 - step * 1.5) * 4.5 +
            Math.cos(x * 0.025 + step * 0.9) * 2.5 +
            ((x - width / 2) / width) * slosh;
          const y = Math.min(height, Math.max(0, baseSurfaceY + wave));
          frontPoints.push({ x, y });
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // 3. Render Specular Surface Foam Line
        if (frontPoints.length > 0) {
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

      // Only continue loop if there is active liquid or movement
      if (currentLevel > 0.1 || currentTargetFill > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const normX = (mouseX / rect.width - 0.5) * 2; // -1 to 1
      sloshTarget = normX * 8; // Impart tilt ripple
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
      {/* Real-time HTML5 60FPS Fluid Physics Water Simulation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-2xl"
      />

      {/* Button Content (High Contrast Pure White Floating Layer) */}
      <span className={`relative z-10 flex items-center gap-2 ${theme.textColor} ${theme.textHover} transition-colors duration-200`}>
        {icon && <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</span>}
        <span className="font-extrabold tracking-wide">{children}</span>
      </span>
    </button>
  );
};

export default LiquidFillButton;
