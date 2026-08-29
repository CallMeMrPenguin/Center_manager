import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface AnimatedThemeToggleProps {
  initialTheme?: 'dark' | 'light';
  onToggle?: (theme: 'dark' | 'light') => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedThemeToggle: React.FC<AnimatedThemeToggleProps> = ({
  initialTheme = 'dark',
  onToggle,
  size = 'md',
  className = '',
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme);

  const handleToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    onToggle?.(next);
  };

  const isDark = theme === 'dark';

  const sizeStyles = {
    sm: {
      btn: 'w-14 h-7 p-0.5',
      thumb: 'w-6 h-6',
      icon: 12,
    },
    md: {
      btn: 'w-20 h-10 p-1',
      thumb: 'w-8 h-8',
      icon: 16,
    },
    lg: {
      btn: 'w-24 h-12 p-1.5',
      thumb: 'w-9 h-9',
      icon: 20,
    },
  }[size];

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Chuyển đổi giao diện sáng tối"
      className={`relative inline-flex items-center rounded-full transition-colors duration-500 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#5c36f5]/50 border ${
        isDark
          ? 'bg-[#0b0e1b] border-[#202b50] shadow-[0_0_20px_rgba(92,54,245,0.25)]'
          : 'bg-[#e2e8f0] border-amber-300/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
      } ${sizeStyles.btn} ${className}`}
    >
      {/* Background Decor Stars / Clouds */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="dark-sky"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-start pl-2"
            >
              <div className="w-1 h-1 rounded-full bg-white/70 shadow-[0_0_4px_#ffffff] animate-ping" />
              <div className="w-0.5 h-0.5 rounded-full bg-indigo-300 ml-2 mb-2 opacity-80" />
            </motion.div>
          ) : (
            <motion.div
              key="light-sky"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-end pr-2.5"
            >
              <Sparkles size={11} className="text-amber-500 opacity-80 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Morphing Sliding Thumb */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`relative z-10 flex items-center justify-center rounded-full shadow-lg ${
          isDark
            ? 'bg-[#1b223d] text-indigo-300 ml-auto border border-[#3b4b80] shadow-[0_0_12px_rgba(92,54,245,0.5)]'
            : 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 mr-auto shadow-[0_0_15px_rgba(245,158,11,0.7)]'
        } ${sizeStyles.thumb}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Moon size={sizeStyles.icon} className="fill-indigo-300/30 text-indigo-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Sun size={sizeStyles.icon} className="text-amber-950 stroke-[2.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};

export function AnimatedThemeToggleDemo() {
  const [current, setCurrent] = useState<'dark' | 'light'>('dark');

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-[#0c0f1e] border border-white/10 rounded-2xl">
      <div className="text-center space-y-1">
        <h4 className="text-sm font-black text-white">Animated Theme Toggle Demo</h4>
        <p className="text-xs text-slate-400">
          Chế độ hiện tại: <span className="font-bold font-mono text-indigo-400 uppercase">{current}</span>
        </p>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Small (SM)</span>
          <AnimatedThemeToggle size="sm" initialTheme={current} onToggle={setCurrent} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Medium (MD)</span>
          <AnimatedThemeToggle size="md" initialTheme={current} onToggle={setCurrent} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Large (LG)</span>
          <AnimatedThemeToggle size="lg" initialTheme={current} onToggle={setCurrent} />
        </div>
      </div>
    </div>
  );
}

export default AnimatedThemeToggle;
