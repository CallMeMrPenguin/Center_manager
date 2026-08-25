import React, { createContext, useContext, useRef, useState } from 'react';

interface DockContextType {
  mousePos: number;
  orientation: 'horizontal' | 'vertical';
}

const DockContext = createContext<DockContextType>({ mousePos: -999, orientation: 'vertical' });

export interface DockProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Dock: React.FC<DockProps> = ({
  children,
  orientation = 'vertical',
  className = '',
}) => {
  const [mousePos, setMousePos] = useState<number>(-999);
  const dockRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dockRef.current) return;
    const rect = dockRef.current.getBoundingClientRect();
    if (orientation === 'vertical') {
      setMousePos(e.clientY - rect.top);
    } else {
      setMousePos(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(-999);
  };

  return (
    <DockContext.Provider value={{ mousePos, orientation }}>
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`flex ${
          orientation === 'vertical' ? 'flex-col items-center gap-1.5' : 'flex-row items-end gap-1.5'
        } ${className}`}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
};

export interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export const DockItem: React.FC<DockItemProps> = ({
  children,
  className = '',
  onClick,
  active = false,
}) => {
  const { mousePos, orientation } = useContext(DockContext);
  const itemRef = useRef<HTMLDivElement | null>(null);

  // Calculate distance-based magnification scale
  let scale = 1.0;
  if (itemRef.current && mousePos !== -999) {
    const rect = itemRef.current.getBoundingClientRect();
    const parentRect = itemRef.current.parentElement?.getBoundingClientRect() || { top: 0, left: 0 };
    const itemCenter = orientation === 'vertical'
      ? (rect.top - parentRect.top) + rect.height / 2
      : (rect.left - parentRect.left) + rect.width / 2;

    const dist = Math.abs(mousePos - itemCenter);
    const maxDist = 90; // Influence radius

    if (dist < maxDist) {
      const factor = (maxDist - dist) / maxDist; // 0 to 1
      scale = 1.0 + factor * 0.28; // Up to 1.28x magnification
    }
  }

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
      className={`relative group cursor-pointer transition-transform duration-100 ease-out flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
};

export const DockIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${className}`}>
      {children}
    </div>
  );
};

export const DockLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const { orientation } = useContext(DockContext);

  const positionClasses = orientation === 'vertical'
    ? 'left-full top-1/2 -translate-y-1/2 ml-3'
    : 'bottom-full left-1/2 -translate-x-1/2 mb-3';

  return (
    <div
      className={`absolute ${positionClasses} z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-x-0 ${className}`}
    >
      <div className="px-2.5 py-1 rounded-lg bg-[#121626] border border-[#232d4e] text-white text-xs font-bold whitespace-nowrap shadow-[0_8px_20px_rgba(0,0,0,0.85)]">
        {children}
      </div>
    </div>
  );
};
