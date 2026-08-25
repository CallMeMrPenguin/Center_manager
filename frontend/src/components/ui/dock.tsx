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
        } bg-[#0b0e1a]/95 border border-[#1e2746] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] ${className}`}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
};

export interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const DockItem: React.FC<DockItemProps> = ({
  children,
  className = '',
  onClick,
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

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onClick={onClick}
      className={`relative group flex items-center justify-center cursor-pointer rounded-xl bg-white/[0.04] hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-400/60 shadow-lg transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const DockIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full h-full flex items-center justify-center text-slate-300 group-hover:text-white transition-colors [&>svg]:w-1/2 [&>svg]:h-1/2 ${className}`}>
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
      <div className="px-2.5 py-1 rounded-xl bg-[#0c0f1e] border border-[#212c4b] text-white text-xs font-black whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </div>
  );
};

export default Dock;
