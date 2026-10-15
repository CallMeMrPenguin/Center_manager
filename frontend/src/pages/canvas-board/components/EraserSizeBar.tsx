import React, { memo } from 'react';
import { Eraser } from 'lucide-react';

interface EraserSizeBarProps {
  isVisible: boolean;
  size: number;
  onSizeChange: (newSize: number) => void;
}

const PRESET_SIZES = [
  { label: 'Nhỏ', val: 12 },
  { label: 'Vừa', val: 24 },
  { label: 'Lớn', val: 40 },
  { label: 'Cực lớn', val: 64 },
];

export const EraserSizeBar = memo(function EraserSizeBar({
  isVisible,
  size,
  onSizeChange,
}: EraserSizeBarProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 bg-white/95 dark:bg-[#121626]/95 rounded-2xl shadow-md border-0 select-none animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs shrink-0">
        <Eraser size={16} strokeWidth={2.4} />
        <span>Cỡ tẩy</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={6}
          max={80}
          step={2}
          value={size}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10) || 24)}
          className="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          title={`Cỡ tẩy: ${size}px (Dùng phím [ và ] để tăng/giảm)`}
        />
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-9 text-right">
          {size}px
        </span>
      </div>

      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
        {PRESET_SIZES.map((preset) => (
          <button
            key={preset.val}
            type="button"
            onClick={() => onSizeChange(preset.val)}
            className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border-0 ${
              size === preset.val
                ? 'bg-red-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default EraserSizeBar;
