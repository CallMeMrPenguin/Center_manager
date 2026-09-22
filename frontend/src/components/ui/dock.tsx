import React, { createContext, useContext, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface DockContextType {
  mousePos: MotionValue<number>;
  orientation: 'horizontal' | 'vertical';
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextType | null>(null);

export interface DockProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  magnification?: number;
  distance?: number;
}

export const Dock: React.FC<DockProps> = ({
  children,
  orientation = 'vertical',
  className = '',
  magnification = 60,
  distance = 120,
}) => {
  const mousePos = useMotionValue(Infinity);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (orientation === 'vertical') {
      mousePos.set(e.clientY);
    } else {
      mousePos.set(e.clientX);
    }
  };

  const handleMouseLeave = () => {
    mousePos.set(Infinity);
  };

  return (
    <DockContext.Provider value={{ mousePos, orientation, magnification, distance }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`flex ${
          orientation === 'vertical'
            ? 'flex-col items-center gap-2 p-2'
            : 'flex-row items-end gap-2 p-2.5'
        } bg-white/95 dark:bg-[#0b0e1a]/95 border border-slate-200 dark:border-[#1e2746] rounded-2xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.85)] ${className}`}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
};

export const DockItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}> = ({
  children,
  className = '',
  onClick,
  isActive = false,
}) => {
  const context = useContext(DockContext);
  const ref = useRef<HTMLDivElement>(null);

  const mousePos = context?.mousePos ?? new MotionValue(Infinity);
  const orientation = context?.orientation ?? 'vertical';
  const magnification = context?.magnification ?? 60;
  const distance = context?.distance ?? 120;

  const distanceCalc = useTransform(mousePos, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    const center = orientation === 'vertical' ? bounds.y + bounds.height / 2 : bounds.x + bounds.width / 2;
    return val - center;
  });

  const sizeSync = useTransform(distanceCalc, [-distance, 0, distance], [40, magnification, 40]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 200, damping: 14 });

  const activeStyles = '!bg-[#5c36f5] !text-white !border-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.6)]';
  const inactiveStyles = 'bg-white hover:bg-slate-100 dark:bg-[#13192c] dark:hover:bg-[#1c2540] border border-slate-200 dark:border-[#212c4b] text-slate-700 dark:text-slate-300 shadow-xs';

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onClick={onClick}
      className={`relative group flex items-center justify-center cursor-pointer rounded-xl transition-all duration-150 ${
        isActive ? activeStyles : inactiveStyles
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const DockIcon: React.FC<{ children: React.ReactNode; className?: string; isActive?: boolean }> = ({
  children,
  className = '',
  isActive = false,
}) => {
  return (
    <div
      className={`w-full h-full flex items-center justify-center transition-colors [&>svg]:w-1/2 [&>svg]:h-1/2 ${
        isActive
          ? '!text-white'
          : 'text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const DockLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const context = useContext(DockContext);
  const orientation = context?.orientation ?? 'vertical';

  const positionClasses = orientation === 'vertical'
    ? 'left-full top-1/2 -translate-y-1/2 ml-3'
    : 'bottom-full left-1/2 -translate-x-1/2 mb-3';

  return (
    <div
      className={`absolute ${positionClasses} z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 ${className}`}
    >
      <div className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#212c4b] text-slate-900 dark:text-white text-xs font-black whitespace-nowrap shadow-xl dark:shadow-[0_8px_24px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </div>
  );
};

export default Dock;
