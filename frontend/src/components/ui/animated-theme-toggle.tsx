import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export interface AnimatedThemeToggleProps {
  className?: string;
  isDark?: boolean;
  onToggle?: (isDark: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedThemeToggle: React.FC<AnimatedThemeToggleProps> = ({
  className = '',
  isDark: controlledDark,
  onToggle,
  size = 'md',
}) => {
  const themeCtx = useTheme();
  const isDark = controlledDark !== undefined ? controlledDark : themeCtx.isDark;

  const toggleTheme = () => {
    const next = !isDark;
    if (onToggle) {
      onToggle(next);
    } else {
      themeCtx.toggleTheme();
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'h-7 w-7 sm:h-8 sm:w-8 rounded-lg'
      : size === 'lg'
      ? 'h-11 w-11 rounded-2xl'
      : 'h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0c0f1e] hover:bg-slate-100 dark:hover:bg-white/10 text-amber-500 dark:text-amber-300 cursor-pointer shadow-sm dark:shadow-md active:scale-95 shrink-0 ${sizeClasses} ${className}`}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện Tối (Bấm để đổi sang Sáng)' : 'Giao diện Sáng (Bấm để đổi sang Tối)'}
    >
      <SolarSwitch isDark={isDark} size={size} />
    </button>
  );
};

interface SolarSwitchProps {
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SolarSwitch: React.FC<SolarSwitchProps> = ({ isDark, size = 'md' }) => {
  const duration = 0.2;

  const moonVariants = {
    checked: {
      scale: 1,
      opacity: 1,
      rotate: 0,
    },
    unchecked: {
      scale: 0,
      opacity: 0,
      rotate: -45,
    },
  };

  const sunVariants = {
    checked: {
      scale: 0,
      opacity: 0,
      rotate: 45,
    },
    unchecked: {
      scale: 1,
      opacity: 1,
      rotate: 0,
    },
  };

  const scaleMoon = useMotionValue(isDark ? 1 : 0);
  const scaleSun = useMotionValue(isDark ? 0 : 1);
  const pathLengthMoon = useTransform(scaleMoon, [0.6, 1], [0, 1]);
  const pathLengthSun = useTransform(scaleSun, [0.6, 1], [0, 1]);

  const svgDim = size === 'sm' ? '16' : size === 'lg' ? '24' : '20';

  return (
    <motion.div
      animate={isDark ? 'checked' : 'unchecked'}
      className="flex items-center justify-center"
    >
      <motion.svg
        width={svgDim}
        height={svgDim}
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Sun Center Circle */}
        <motion.path
          d="M12.4058 17.7625C15.1672 17.7625 17.4058 15.5239 17.4058 12.7625C17.4058 10.0011 15.1672 7.76251 12.4058 7.76251C9.64434 7.76251 7.40576 10.0011 7.40576 12.7625C7.40576 15.5239 9.64434 17.7625 12.4058 17.7625Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{
            pathLength: pathLengthSun,
            scale: scaleSun,
          }}
        />

        {/* Sun Rays */}
        <motion.path
          d="M12.4058 1.76251V3.76251"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M12.4058 21.7625V23.7625"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M4.62598 4.98248L6.04598 6.40248"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M18.7656 19.1225L20.1856 20.5425"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M1.40576 12.7625H3.40576"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M21.4058 12.7625H23.4058"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M4.62598 20.5425L6.04598 19.1225"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />
        <motion.path
          d="M18.7656 6.40248L20.1856 4.98248"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{ pathLength: pathLengthSun, scale: scaleSun }}
        />

        {/* Crescent Moon */}
        <motion.path
          d="M21.1918 13.2013C21.0345 14.9035 20.3957 16.5257 19.35 17.8781C18.3044 19.2305 16.8953 20.2571 15.2875 20.8379C13.6797 21.4186 11.9398 21.5294 10.2713 21.1574C8.60281 20.7854 7.07479 19.9459 5.86602 18.7371C4.65725 17.5283 3.81774 16.0003 3.4457 14.3318C3.07367 12.6633 3.18451 10.9234 3.76526 9.31561C4.346 7.70783 5.37263 6.29868 6.72501 5.25307C8.07739 4.20746 9.69959 3.56862 11.4018 3.41132C10.4052 4.75958 9.92564 6.42077 10.0503 8.09273C10.175 9.76469 10.8957 11.3364 12.0812 12.5219C13.2667 13.7075 14.8384 14.4281 16.5104 14.5528C18.1823 14.6775 19.8435 14.1979 21.1918 13.2013Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          transition={{ duration }}
          variants={moonVariants}
          custom={isDark}
          style={{
            pathLength: pathLengthMoon,
            scale: scaleMoon,
          }}
        />
      </motion.svg>
    </motion.div>
  );
};

export function AnimatedThemeToggleDemo() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0f1528] border border-slate-200 dark:border-[#1b2444] p-8 rounded-2xl space-y-6 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Animated Theme Toggle</h3>
        </div>

        {/* Demo container requested by user */}
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#0c0f1e] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-6">
            <AnimatedThemeToggle
              size="sm"
              isDark={theme === 'dark'}
              onToggle={(isDark) => setTheme(isDark ? 'dark' : 'light')}
            />
            <AnimatedThemeToggle
              size="md"
              isDark={theme === 'dark'}
              onToggle={(isDark) => setTheme(isDark ? 'dark' : 'light')}
            />
            <AnimatedThemeToggle
              size="lg"
              isDark={theme === 'dark'}
              onToggle={(isDark) => setTheme(isDark ? 'dark' : 'light')}
            />
          </div>

          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Trạng thái hiện tại:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono uppercase">{theme} MODE</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default AnimatedThemeToggle;
