import React, { useState } from 'react';

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
  colorHex: string;
  colorBack: string;
  textColor: string;
  textHover: string;
  glowShadow: string;
}> = {
  indigo: {
    border: 'border-2 border-[#5c36f5]',
    colorHex: '#5c36f5',
    colorBack: 'rgba(92, 54, 245, 0.55)',
    textColor: 'text-indigo-300',
    textHover: 'group-hover:text-white',
    glowShadow: 'hover:shadow-[0_0_24px_rgba(92,54,245,0.65)]',
  },
  cyan: {
    border: 'border-2 border-[#38bdf8]',
    colorHex: '#38bdf8',
    colorBack: 'rgba(56, 189, 248, 0.55)',
    textColor: 'text-[#38bdf8]',
    textHover: 'group-hover:text-[#0b1329]',
    glowShadow: 'hover:shadow-[0_0_24px_rgba(56,189,248,0.65)]',
  },
  emerald: {
    border: 'border-2 border-[#34d399]',
    colorHex: '#34d399',
    colorBack: 'rgba(52, 211, 153, 0.55)',
    textColor: 'text-[#34d399]',
    textHover: 'group-hover:text-[#062017]',
    glowShadow: 'hover:shadow-[0_0_24px_rgba(52,211,153,0.65)]',
  },
  amber: {
    border: 'border-2 border-[#fbbf24]',
    colorHex: '#fbbf24',
    colorBack: 'rgba(251, 191, 36, 0.55)',
    textColor: 'text-[#fbbf24]',
    textHover: 'group-hover:text-[#211604]',
    glowShadow: 'hover:shadow-[0_0_24px_rgba(251,191,36,0.65)]',
  },
  rose: {
    border: 'border-2 border-[#fb7185]',
    colorHex: '#fb7185',
    colorBack: 'rgba(251, 113, 133, 0.55)',
    textColor: 'text-[#fb7185]',
    textHover: 'group-hover:text-white',
    glowShadow: 'hover:shadow-[0_0_24px_rgba(251,113,133,0.65)]',
  },
  purple: {
    border: 'border-2 border-[#c084fc]',
    colorHex: '#c084fc',
    colorBack: 'rgba(192, 132, 252, 0.55)',
    textColor: 'text-[#c084fc]',
    textHover: 'group-hover:text-[#180829]',
    glowShadow: 'hover:shadow-[0_0_24px_rgba(192,132,252,0.65)]',
  },
};

const SIZES: Record<LiquidSize, {
  padding: string;
  fontSize: string;
  iconSize: number;
  height: string;
}> = {
  sm: {
    padding: 'px-4 py-2',
    fontSize: 'text-xs',
    iconSize: 13,
    height: 'h-9',
  },
  md: {
    padding: 'px-6 py-3',
    fontSize: 'text-sm',
    iconSize: 16,
    height: 'h-12',
  },
  lg: {
    padding: 'px-8 py-4',
    fontSize: 'text-base',
    iconSize: 18,
    height: 'h-14',
  },
};

export const LiquidFillButton: React.FC<LiquidButtonProps> = ({
  variant = 'cyan',
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
  const theme = THEMES[variant] || THEMES.cyan;
  const sizeConf = SIZES[size] || SIZES.md;

  // Calculate top position based on hover or manual fillPercentage
  const getTopPosition = () => {
    if (typeof fillPercentage === 'number') {
      const clamped = Math.min(100, Math.max(0, fillPercentage));
      // 0% -> top: 105%, 100% -> top: -65%
      return `${105 - clamped * 1.7}%`;
    }
    if (autoFillOnHover) {
      return isHovered ? '-60%' : '105%';
    }
    return '105%';
  };

  const topPos = getTopPosition();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-full ${theme.border} bg-transparent ${
        sizeConf.padding
      } ${sizeConf.fontSize} ${theme.textColor} ${theme.textHover} ${
        glow ? theme.glowShadow : ''
      } font-bold transition-all duration-400 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2.5 ${className}`}
      {...props}
    >
      {/* 1. Back Depth Rotating Liquid Wave */}
      <div
        className="absolute w-[260%] h-[260%] left-[-80%] pointer-events-none animate-liquid-rotate-wave-back transition-[top] duration-700 ease-out z-0"
        style={{
          top: topPos,
          backgroundColor: theme.colorBack,
          borderRadius: '40%',
        }}
      />

      {/* 2. Front Primary Rotating 45% Wave (User's Exact Liquid Algorithm) */}
      <div
        className="absolute w-[240%] h-[240%] left-[-70%] pointer-events-none animate-liquid-rotate-wave transition-[top] duration-600 ease-out z-0"
        style={{
          top: topPos,
          backgroundColor: theme.colorHex,
          borderRadius: '45%',
        }}
      />

      {/* 3. Button Content */}
      <span className="relative z-10 flex items-center gap-2 pointer-events-none font-black tracking-wide transition-colors duration-400">
        {icon && <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};

export default LiquidFillButton;
