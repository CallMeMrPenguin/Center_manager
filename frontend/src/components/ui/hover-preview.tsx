import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface HoverPreviewItem {
  image?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  details?: Record<string, string | number>;
}

interface HoverPreviewContextType {
  data: Record<string, HoverPreviewItem>;
  activeItem: HoverPreviewItem | null;
  pos: { x: number; y: number; width: number; height: number };
  setActive: (item: HoverPreviewItem | null, pos?: { x: number; y: number; width: number; height: number }) => void;
}

const HoverPreviewContext = createContext<HoverPreviewContextType>({
  data: {},
  activeItem: null,
  pos: { x: 0, y: 0, width: 0, height: 0 },
  setActive: () => {},
});

export const HoverPreviewProvider: React.FC<{
  data?: Record<string, HoverPreviewItem>;
  children: React.ReactNode;
  className?: string;
}> = ({ data = {}, children, className = '' }) => {
  const [activeItem, setActiveItem] = useState<HoverPreviewItem | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setActive = (item: HoverPreviewItem | null, newPos?: { x: number; y: number; width: number; height: number }) => {
    setActiveItem(item);
    if (newPos) {
      setPos(newPos);
    }
  };

  // Viewport-aware positioning
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isTooCloseToTop = pos.y < 260;
  const cardWidth = 300;
  const clampedX = Math.max(cardWidth / 2 + 16, Math.min(windowWidth - cardWidth / 2 - 16, pos.x + pos.width / 2));

  const cardElement = mounted ? (
    <AnimatePresence>
      {activeItem && (
        <motion.div
          initial={{ opacity: 0, y: isTooCloseToTop ? -8 : 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isTooCloseToTop ? -6 : 6, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{
            position: 'fixed',
            left: clampedX,
            top: isTooCloseToTop ? pos.y + pos.height + 12 : pos.y - 12,
            transform: isTooCloseToTop ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
            zIndex: 99999,
          }}
          className="pointer-events-none w-[300px] bg-[#0c0f1e] border border-[#263563] rounded-2xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-3 font-sans select-none"
        >
          {activeItem.image && (
            <div className="w-full h-36 rounded-xl overflow-hidden bg-[#151c36] border border-white/10 relative">
              <motion.img
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.35 }}
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

          {activeItem.details && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px]">
              {Object.entries(activeItem.details).map(([k, v]) => (
                <div key={k} className="bg-[#12182c] px-2 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-400 block">{k}:</span>
                  <span className="text-white font-bold font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <HoverPreviewContext.Provider value={{ data, activeItem, pos, setActive }}>
      <div className={`relative ${className}`}>
        {children}
        {mounted && createPortal(cardElement, document.body)}
      </div>
    </HoverPreviewContext.Provider>
  );
};

export interface HoverPreviewLinkProps {
  previewKey?: string;
  previewData?: HoverPreviewItem;
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export const HoverPreviewLink: React.FC<HoverPreviewLinkProps> = ({
  previewKey,
  previewData,
  children,
  className = '',
  href,
}) => {
  const { data, setActive } = useContext(HoverPreviewContext);
  const ref = useRef<HTMLAnchorElement | HTMLSpanElement | null>(null);

  const itemToDisplay = previewData || (previewKey ? data[previewKey] : null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!itemToDisplay) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(itemToDisplay, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleMouseLeave = () => {
    setActive(null);
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
