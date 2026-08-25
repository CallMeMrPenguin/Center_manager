import React, { createContext, useContext, useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

export interface HoverPreviewItem {
  image?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

interface HoverPreviewContextType {
  data: Record<string, HoverPreviewItem>;
  activeKey: string | null;
  pos: { x: number; y: number };
  setActiveKey: (key: string | null, pos?: { x: number; y: number }) => void;
}

const HoverPreviewContext = createContext<HoverPreviewContextType>({
  data: {},
  activeKey: null,
  pos: { x: 0, y: 0 },
  setActiveKey: () => {},
});

export const HoverPreviewProvider: React.FC<{
  data: Record<string, HoverPreviewItem>;
  children: React.ReactNode;
  className?: string;
}> = ({ data, children, className = '' }) => {
  const [activeKey, setActiveKeyLocal] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const springX = useSpring(pos.x, { stiffness: 350, damping: 25 });
  const springY = useSpring(pos.y, { stiffness: 350, damping: 25 });

  const setActiveKey = (key: string | null, newPos?: { x: number; y: number }) => {
    setActiveKeyLocal(key);
    if (newPos) {
      setPos(newPos);
      springX.set(newPos.x);
      springY.set(newPos.y);
    }
  };

  const activeItem = activeKey ? data[activeKey] : null;

  return (
    <HoverPreviewContext.Provider value={{ data, activeKey, pos, setActiveKey }}>
      <div className={`relative ${className}`}>
        {children}

        {/* Floating Dynamic Preview Card with Framer Motion */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                left: pos.x,
                top: pos.y - 14,
                translateX: '-50%',
                translateY: '-100%',
              }}
              className="fixed z-[999] pointer-events-none w-72 bg-[#0c0f1e]/95 border border-[#212c4b] rounded-2xl p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] space-y-2.5"
            >
              {activeItem.image && (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-[#151c36] border border-white/10 relative">
                  <motion.img
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={activeItem.image}
                    alt={activeItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f1e] via-transparent to-transparent opacity-60" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white truncate">{activeItem.title}</h4>
                  {activeItem.badge && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                      {activeItem.badge}
                    </span>
                  )}
                </div>
                {activeItem.subtitle && (
                  <p className="text-[11px] text-slate-300 font-medium line-clamp-2 mt-1 leading-snug">
                    {activeItem.subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HoverPreviewContext.Provider>
  );
};

export const HoverPreviewLink: React.FC<{
  previewKey: string;
  children: React.ReactNode;
  className?: string;
  href?: string;
}> = ({ previewKey, children, className = '', href }) => {
  const { setActiveKey } = useContext(HoverPreviewContext);
  const ref = useRef<HTMLAnchorElement | HTMLSpanElement | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveKey(previewKey, {
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setActiveKey(null);
  };

  const commonProps = {
    ref: ref as any,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    className: `text-indigo-400 font-bold underline decoration-indigo-500/40 hover:decoration-indigo-400 cursor-pointer transition ${className}`,
  };

  if (href) {
    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    );
  }

  return <span {...commonProps}>{children}</span>;
};

export default HoverPreviewProvider;
