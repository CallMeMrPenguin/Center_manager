import React, { createContext, useContext, useState, useRef } from 'react';

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

  const setActiveKey = (key: string | null, newPos?: { x: number; y: number }) => {
    setActiveKeyLocal(key);
    if (newPos) setPos(newPos);
  };

  const activeItem = activeKey ? data[activeKey] : null;

  return (
    <HoverPreviewContext.Provider value={{ data, activeKey, pos, setActiveKey }}>
      <div className={`relative ${className}`}>
        {children}

        {/* Floating Preview Card */}
        {activeItem && (
          <div
            style={{
              left: `${pos.x}px`,
              top: `${pos.y - 12}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="fixed z-[999] pointer-events-none w-64 bg-[#0c0f1e] border border-[#212c4b] rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-2 animate-in fade-in zoom-in-95 duration-200"
          >
            {activeItem.image && (
              <div className="w-full h-32 rounded-xl overflow-hidden bg-[#151c36] border border-white/5">
                <img
                  src={activeItem.image}
                  alt={activeItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white">{activeItem.title}</h4>
                {activeItem.badge && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeItem.badge}
                  </span>
                )}
              </div>
              {activeItem.subtitle && (
                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-0.5">
                  {activeItem.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
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
  const linkRef = useRef<HTMLAnchorElement | HTMLSpanElement | null>(null);

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

  if (href) {
    return (
      <a
        ref={linkRef as any}
        href={href}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`text-indigo-400 font-bold underline decoration-indigo-500/40 hover:decoration-indigo-400 transition ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <span
      ref={linkRef as any}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`text-indigo-400 font-bold underline decoration-indigo-500/40 hover:decoration-indigo-400 cursor-pointer transition ${className}`}
    >
      {children}
    </span>
  );
};

export default HoverPreviewProvider;
