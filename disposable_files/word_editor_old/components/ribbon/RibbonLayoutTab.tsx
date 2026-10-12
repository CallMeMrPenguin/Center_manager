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
    <div className="flex items-center gap-1 text-xs select-none">
      {/* 1. Paper Size Group */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] pr-1">Khổ giấy:</span>
        <button
          type="button"
          onClick={() => onPaperSizeChange('A4')}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            paperSize === 'A4'
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          A4 (210 x 297 mm)
        </button>
        <button
          type="button"
          onClick={() => onPaperSizeChange('Letter')}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            paperSize === 'Letter'
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          Letter
        </button>
      </div>

      <div className="h-6 w-[1px] bg-slate-300 dark:bg-white/10 mx-1.5 shrink-0" />

      {/* 2. Orientation Group */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] pr-1">Hướng giấy:</span>
        <button
          type="button"
          onClick={() => onOrientationChange('portrait')}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            orientation === 'portrait'
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          Dọc
        </button>
        <button
          type="button"
          onClick={() => onOrientationChange('landscape')}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            orientation === 'landscape'
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          Ngang
        </button>
      </div>

      <div className="h-6 w-[1px] bg-slate-300 dark:bg-white/10 mx-1.5 shrink-0" />

      {/* 3. Margins Group */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] pr-1">Lề:</span>
        <button
          type="button"
          onClick={() => onMarginsChange({ top: 20, bottom: 20, left: 25, right: 20 })}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            margins.left === 25
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          Chuẩn (2.5cm)
        </button>
        <button
          type="button"
          onClick={() => onMarginsChange({ top: 20, bottom: 20, left: 20, right: 20 })}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            margins.left === 20
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          Vừa (2.0cm)
        </button>
        <button
          type="button"
          onClick={() => onMarginsChange({ top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 })}
          className={`h-6 px-2 rounded-[2px] transition-colors cursor-pointer text-xs ${
            margins.left === 12.7
              ? 'bg-[#cde4f7] dark:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-[#7fbae9] dark:border-blue-500/50 font-bold'
              : 'hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          Hẹp (1.27cm)
        </button>
      </div>
    </div>
  );
};
