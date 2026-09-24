import React from 'react';
import { PaperSize, Orientation, MarginConfig } from '../../types';

interface RibbonLayoutTabProps {
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  orientation: Orientation;
  onOrientationChange: (ori: Orientation) => void;
  margins: MarginConfig;
  onMarginsChange: (margins: MarginConfig) => void;
}

export const RibbonLayoutTab: React.FC<RibbonLayoutTabProps> = ({
  paperSize,
  onPaperSizeChange,
  orientation,
  onOrientationChange,
  margins,
  onMarginsChange,
}) => {
  return (
    <div className="flex items-center gap-4 text-xs">
      {/* Paper Size */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400 font-semibold">Khổ giấy:</span>
        <select
          value={paperSize}
          onChange={(e) => onPaperSizeChange(e.target.value as PaperSize)}
          className="bg-slate-100 dark:bg-[#121626] border border-slate-300 dark:border-white/10 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer font-medium"
        >
          <option value="A4">A4 (210 x 297 mm)</option>
          <option value="Letter">Letter (8.5 x 11 in)</option>
        </select>
      </div>

      {/* Orientation */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400 font-semibold">Hướng giấy:</span>
        <button
          type="button"
          onClick={() => onOrientationChange('portrait')}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
            orientation === 'portrait'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#121626] text-slate-700 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Dọc
        </button>
        <button
          type="button"
          onClick={() => onOrientationChange('landscape')}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
            orientation === 'landscape'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#121626] text-slate-700 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Ngang
        </button>
      </div>

      {/* Margins */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400 font-semibold">Lề:</span>
        <button
          type="button"
          onClick={() => onMarginsChange({ top: 20, bottom: 20, left: 25, right: 20 })}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
            margins.left === 25
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#121626] text-slate-700 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Chuẩn (2.5cm)
        </button>
        <button
          type="button"
          onClick={() => onMarginsChange({ top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 })}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
            margins.left === 12.7
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#121626] text-slate-700 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Hẹp (1.27cm)
        </button>
      </div>
    </div>
  );
};
