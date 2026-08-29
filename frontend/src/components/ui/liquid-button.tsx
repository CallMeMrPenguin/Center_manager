import React, { useState } from 'react';
import { motion } from 'framer-motion';

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

const VARIANT_CONFIG: Record<LiquidVariant, {
  border: string;
  bgBase: string;
  textColor: string;
  textHover: string;
  liquidColor: string;
  liquidWave1: string;
  liquidWave2: string;
  glowShadow: string;
  accent: string;
}> = {
  indigo: {
    border: 'border-[#5c36f5]/40 hover:border-[#5c36f5]',
    bgBase: 'bg-[#0b0e1e]',
    textColor: 'text-indigo-100',
    textHover: 'group-hover:text-white',
    liquidColor: '#5c36f5',
    liquidWave1: '#704cf7',
    liquidWave2: '#4122bd',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(92,54,245,0.6)]',
    accent: '#9d84ff',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bgBase: 'bg-[#061424]',
    textColor: 'text-cyan-100',
    textHover: 'group-hover:text-white',
    liquidColor: '#0891b2',
    liquidWave1: '#06b6d4',
    liquidWave2: '#0e7490',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(6,182,212,0.6)]',
    accent: '#67e8f9',
  },
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-400',
    bgBase: 'bg-[#051714]',
    textColor: 'text-emerald-100',
    textHover: 'group-hover:text-white',
    liquidColor: '#059669',
    liquidWave1: '#10b981',
    liquidWave2: '#047857',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(16,185,129,0.6)]',
    accent: '#6ee7b7',
  },
  amber: {
    border: 'border-amber-500/40 hover:border-amber-400',
    bgBase: 'bg-[#181105]',
    textColor: 'text-amber-100',
    textHover: 'group-hover:text-white',
    liquidColor: '#d97706',
    liquidWave1: '#f59e0b',
    liquidWave2: '#b45309',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(245,158,11,0.6)]',
    accent: '#fde68a',
  },
  rose: {
    border: 'border-rose-500/40 hover:border-rose-400',
    bgBase: 'bg-[#1a0810]',
    textColor: 'text-rose-100',
    textHover: 'group-hover:text-white',
    liquidColor: '#e11d48',
    liquidWave1: '#f43f5e',
    liquidWave2: '#be123c',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(244,63,94,0.6)]',
    accent: '#fda4af',
  },
  purple: {
    border: 'border-purple-500/40 hover:border-purple-400',
    bgBase: 'bg-[#13081e]',
    textColor: 'text-purple-100',
    textHover: 'group-hover:text-white',
    liquidColor: '#9333ea',
    liquidWave1: '#a855f7',
    liquidWave2: '#7e22ce',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(168,85,247,0.6)]',
    accent: '#d8b4fe',
  },
};

const SIZE_CONFIG: Record<LiquidSize, {
  padding: string;
  fontSize: string;
  iconSize: number;
  height: string;
}> = {
  sm: {
    padding: 'px-3.5 py-1.5',
    fontSize: 'text-xs',
    iconSize: 13,
    height: 'h-8',
  },
  md: {
    padding: 'px-5 py-2.5',
    fontSize: 'text-sm',
    iconSize: 16,
    height: 'h-11',
  },
  lg: {
    padding: 'px-7 py-3.5',
    fontSize: 'text-base',
    iconSize: 18,
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
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.indigo;
  const sizeConf = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const currentFill = typeof fillPercentage === 'number'
    ? Math.min(100, Math.max(0, fillPercentage))
    : autoFillOnHover
    ? isHovered
      ? 100
      : 0
    : 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-2xl border ${config.border} ${config.bgBase} ${
        sizeConf.padding
      } ${sizeConf.fontSize} ${
        glow ? config.glowShadow : ''
      } font-black transition-all duration-300 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {/* Dynamic Rising Liquid Fill (Pro Sinusoidal Liquid Physics) */}
      <motion.div
        initial={false}
        animate={{
          height: `${currentFill}%`,
          opacity: currentFill > 0 ? 1 : 0,
        }}
        transition={{
          height: {
            duration: currentFill > 0 ? 0.75 : 0.55,
            ease: currentFill > 0 ? [0.22, 1, 0.36, 1] : [0.32, 0, 0.67, 0],
          },
          opacity: { duration: 0.25 },
        }}
        style={{
          background: `linear-gradient(180deg, ${config.liquidWave1} 0%, ${config.liquidColor} 40%, ${config.bgBase} 100%)`,
        }}
        className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none origin-bottom"
      >
        {/* Layer 1: Back Wave Crest (Translucent Depth) */}
        <div className="absolute -top-3.5 left-0 w-[200%] h-4 pointer-events-none opacity-50 animate-liquid-wave-back">
          <svg viewBox="0 0 1000 30" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M 0,15 C 160,25 340,5 500,15 C 660,25 840,5 1000,15 L 1000,30 L 0,30 Z"
              fill={config.liquidWave2}
            />
          </svg>
        </div>

        {/* Layer 2: Front Wave Crest (Smooth Continuous Bezier Sine Wave) */}
        <div className="absolute -top-3 left-0 w-[200%] h-4 pointer-events-none opacity-90 animate-liquid-wave-front">
          <svg viewBox="0 0 1000 30" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M 0,12 C 125,2 275,22 400,12 C 525,2 675,22 800,12 C 925,2 1075,22 1200,12 L 1200,30 L 0,30 Z"
              fill={config.liquidWave1}
            />
          </svg>
        </div>

        {/* Layer 3: Specular Water Surface Sheen */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-70 pointer-events-none animate-liquid-sway"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${config.accent} 50%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* Button Content (High Contrast Floating Layer) */}
      <span className={`relative z-10 flex items-center gap-2 ${config.textColor} ${config.textHover} transition-colors duration-200`}>
        {icon && <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</span>}
        <span className="font-extrabold tracking-wide">{children}</span>
      </span>
    </button>
  );
};

export default LiquidFillButton;
