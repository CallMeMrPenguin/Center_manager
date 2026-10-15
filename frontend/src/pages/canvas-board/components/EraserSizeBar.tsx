import React, { memo } from 'react';
import { Eraser } from 'lucide-react';

interface EraserSizeBarProps {
  isVisible: boolean;
  size: number;
  onSizeChange: (newSize: number) => void;
}

export const EraserSizeBar = memo(function EraserSizeBar({
  isVisible,
  size,
  onSizeChange,
}: EraserSizeBarProps) {
  if (!isVisible) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="custom-eraser-size-bar absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3.5 py-2 bg-white dark:bg-[#121626] rounded-2xl shadow-lg border-0 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs shrink-0">
        <Eraser size={16} strokeWidth={2.4} />
        <span>Cỡ tẩy:</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={4}
          max={120}
          step={2}
          value={size}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10) || 24)}
          className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          title={`Cỡ tẩy: ${size}px (Phím tắt: [ hoặc ])`}
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={4}
            max={120}
            value={size}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const val = Math.max(4, Math.min(120, parseInt(e.target.value, 10) || 4));
              onSizeChange(val);
            }}
            className="w-12 bg-slate-50 dark:bg-slate-800 border-0 text-slate-900 dark:text-slate-100 rounded-lg px-1.5 py-0.5 text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <span className="text-[11px] font-mono font-semibold text-slate-400">px</span>
        </div>
      </div>

      <div
        className="rounded-full shrink-0 border border-red-500/40 bg-red-500/20"
        style={{
          width: Math.min(24, Math.max(6, size / 3)),
          height: Math.min(24, Math.max(6, size / 3)),
        }}
        title={`Xem trước kích thước: ${size}px`}
      />
    </div>
  );
});

export default EraserSizeBar;
