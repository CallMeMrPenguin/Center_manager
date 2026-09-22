import React, { createContext, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface DockContextType {
  mousePos: MotionValue<number>;
  orientation: 'horizontal' | 'vertical';
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextType | null>(null);

interface ItemContextType {
  isHovered: boolean;
  tooltipPos: { top: number; left: number };
}

const ItemContext = createContext<ItemContextType>({
  isHovered: false,
  tooltipPos: { top: 0, left: 0 },
});

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
  magnification = 52,
  distance = 85,
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
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`flex ${
          orientation === 'vertical'
            ? 'flex-col items-center gap-1.5 p-1.5'
            : 'flex-row items-center gap-2 p-2'
        } ${className}`}
      >
        {children}
      </div>
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

  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const mousePos = context?.mousePos ?? new MotionValue(Infinity);
  const orientation = context?.orientation ?? 'vertical';
  const distance = context?.distance ?? 85;

  // Cache item center on mouse enter to eliminate layout thrashing during mousemove
  const centerPos = useRef<number | null>(null);

  const distanceCalc = useTransform(mousePos, (val: number) => {
    if (val === Infinity) {
      centerPos.current = null;
      return Infinity;
    }
    if (centerPos.current === null && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      centerPos.current = orientation === 'vertical' ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    }
    return val - (centerPos.current ?? 0);
  });

  const scaleTransform = useTransform(distanceCalc, [-distance, 0, distance], [1, 1.28, 1]);
  const scale = useSpring(scaleTransform, { mass: 0.1, stiffness: 350, damping: 22 });

  const activeStyles = '!bg-[#2563eb] !text-white !border-0 shadow-md shadow-blue-500/30';
  const inactiveStyles = 'bg-transparent hover:bg-slate-200/70 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-0 shadow-none';

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <ItemContext.Provider value={{ isHovered, tooltipPos }}>
      <motion.div
        ref={ref}
        style={{ scale }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl cursor-pointer shrink-0 ${
          isActive ? activeStyles : inactiveStyles
        } ${className}`}
      >
        {children}
      </motion.div>
    </ItemContext.Provider>
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
  const { isHovered, tooltipPos } = useContext(ItemContext);

  if (!isHovered || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${tooltipPos.top}px`,
        left: `${tooltipPos.left}px`,
        transform: 'translateY(-50%)',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className={`whitespace-nowrap select-none animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      <div className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#212c4b] text-slate-900 dark:text-white text-xs font-black whitespace-nowrap shadow-xl dark:shadow-[0_8px_24px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Dock;
