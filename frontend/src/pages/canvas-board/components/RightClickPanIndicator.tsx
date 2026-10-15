import React, { memo } from 'react';
import { Mouse } from 'lucide-react';

interface RightClickPanIndicatorProps {
  isPanning: boolean;
}

export const RightClickPanIndicator = memo(function RightClickPanIndicator({
  isPanning,
}: RightClickPanIndicatorProps) {
  return (
    <>
      {/* Live Panning Floating Overlay Badge when user is actively right-clicking */}
      {isPanning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-blue-600/90 text-white text-xs font-bold rounded-xl shadow-lg pointer-events-none select-none animate-in fade-in duration-150">
          <Mouse size={14} className="stroke-[2.5]" />
          <span>Đang di chuyển canvas (Pan)</span>
        </div>
      )}

      {/* Subtle Desktop Helper Badge at bottom right indicating Right-Click = Pan */}
      <div
        className="absolute bottom-3 right-3 z-30 hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-[#121626]/80 text-slate-500 dark:text-slate-400 text-[11px] font-semibold rounded-lg shadow-2xs pointer-events-none select-none"
        title="Nhấn giữ chuột phải và kéo để di chuyển canvas"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="7" />
          <path d="M12 2v6" />
          <path d="M12 2h3a4 4 0 0 1 4 4v2h-7V2z" fill="currentColor" fillOpacity="0.25" />
        </svg>
        <span>Chuột phải: Kéo canvas</span>
      </div>
    </>
  );
});

export default RightClickPanIndicator;
