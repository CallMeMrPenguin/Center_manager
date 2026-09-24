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
        <button
          type="button"
          onClick={() => onPaperSizeChange('A4')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
            paperSize === 'A4'
              ? 'bg-[#2563eb] text-white shadow-xs font-bold'
              : 'bg-slate-100 dark:bg-[#121626] text-slate-700 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/10'
          }`}
        >
          A4 (210 x 297 mm)
        </button>
        <button
          type="button"
          onClick={() => onPaperSizeChange('Letter')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
            paperSize === 'Letter'
              ? 'bg-[#2563eb] text-white shadow-xs font-bold'
              : 'bg-slate-100 dark:bg-[#121626] text-slate-700 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/10'
          }`}
        >
          Letter
        </button>
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
