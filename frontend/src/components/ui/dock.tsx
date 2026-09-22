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
}) => {
  return (
    <div
      className={`flex ${
        orientation === 'vertical'
          ? 'flex-col items-center gap-1.5 p-1.5'
          : 'flex-row items-center gap-2 p-2'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const DockItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  title?: string;
}> = ({
  children,
  className = '',
  onClick,
  isActive = false,
  title,
}) => {
  const activeStyles = '!bg-[#2563eb] !text-white !border-0 shadow-md shadow-blue-500/30';
  const inactiveStyles = 'bg-transparent hover:bg-slate-200/70 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-0 shadow-none';

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative group flex items-center justify-center w-10 h-10 mx-auto rounded-xl cursor-pointer transition-all duration-150 ease-out hover:scale-110 active:scale-95 shrink-0 ${
        isActive ? activeStyles : inactiveStyles
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const DockIcon: React.FC<{ children: React.ReactNode; className?: string; isActive?: boolean }> = ({
  children,
  className = '',
  isActive = false,
}) => {
  return (
    <div
      className={`w-full h-full flex items-center justify-center transition-colors [&>svg]:w-[18px] [&>svg]:h-[18px] ${
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
  return (
    <div
      className={`absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 whitespace-nowrap shadow-xl ${className}`}
    >
      <div className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-[#151d36] text-white text-xs font-bold border border-slate-700 dark:border-white/10 shadow-lg">
        {children}
      </div>
    </div>
  );
};

export default Dock;
