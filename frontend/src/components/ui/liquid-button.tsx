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
    bgBase: 'bg-[#0c0f1e]',
    textColor: 'text-indigo-200',
    textHover: 'group-hover:text-white',
    liquidColor: '#5c36f5',
    liquidWave1: '#7351f7',
    liquidWave2: '#4a25dd',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(92,54,245,0.65)]',
    accent: '#8c6eff',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bgBase: 'bg-[#081524]',
    textColor: 'text-cyan-200',
    textHover: 'group-hover:text-white',
    liquidColor: '#06b6d4',
    liquidWave1: '#22d3ee',
    liquidWave2: '#0891b2',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(6,182,212,0.65)]',
    accent: '#67e8f9',
  },
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-400',
    bgBase: 'bg-[#061814]',
    textColor: 'text-emerald-200',
    textHover: 'group-hover:text-white',
    liquidColor: '#10b981',
    liquidWave1: '#34d399',
    liquidWave2: '#059669',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(16,185,129,0.65)]',
    accent: '#6ee7b7',
  },
  amber: {
    border: 'border-amber-500/40 hover:border-amber-400',
    bgBase: 'bg-[#1a1206]',
    textColor: 'text-amber-200',
    textHover: 'group-hover:text-white',
    liquidColor: '#f59e0b',
    liquidWave1: '#fbbf24',
    liquidWave2: '#d97706',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(245,158,11,0.65)]',
    accent: '#fde68a',
  },
  rose: {
    border: 'border-rose-500/40 hover:border-rose-400',
    bgBase: 'bg-[#1c0a12]',
    textColor: 'text-rose-200',
    textHover: 'group-hover:text-white',
    liquidColor: '#f43f5e',
    liquidWave1: '#fb7185',
    liquidWave2: '#e11d48',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(244,63,94,0.65)]',
    accent: '#fda4af',
  },
  purple: {
    border: 'border-purple-500/40 hover:border-purple-400',
    bgBase: 'bg-[#140a20]',
    textColor: 'text-purple-200',
    textHover: 'group-hover:text-white',
    liquidColor: '#a855f7',
    liquidWave1: '#c084fc',
    liquidWave2: '#9333ea',
    glowShadow: 'group-hover:shadow-[0_0_24px_rgba(168,85,247,0.65)]',
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
      {/* Dynamic Rising Liquid Level (Water Pouring Simulation) */}
      <motion.div
        initial={false}
        animate={{
          height: `${currentFill}%`,
          opacity: currentFill > 0 ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
          opacity: { duration: 0.2 },
        }}
        style={{ backgroundColor: config.liquidColor }}
        className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none origin-bottom"
      >
        {/* Layer 1: Front Fluid Wave Crest */}
        <div
          className="absolute -top-3 left-0 w-[200%] h-4 animate-liquid-wave opacity-80 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 100%, ${config.liquidWave1} 60%, transparent 62%)`,
            backgroundSize: '24px 16px',
            backgroundRepeat: 'repeat-x',
          }}
        />

        {/* Layer 2: Back Fluid Wave Crest for Depth */}
        <div
          className="absolute -top-3 left-0 w-[200%] h-4 animate-liquid-wave-reverse opacity-45 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 100%, ${config.liquidWave2} 60%, transparent 62%)`,
            backgroundSize: '32px 14px',
            backgroundRepeat: 'repeat-x',
          }}
        />

        {/* Liquid Surface Specular Sheen */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-70 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${config.accent} 50%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* Button Content (High Contrast Floating Layer) */}
      <span className={`relative z-10 flex items-center gap-2 ${config.textColor} ${config.textHover} transition-colors duration-200`}>
        {icon && <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
        <span className="font-extrabold tracking-wide">{children}</span>
      </span>
    </button>
  );
};

export default LiquidFillButton;
