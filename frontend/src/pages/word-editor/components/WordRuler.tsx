import React from 'react';
import { MarginConfig } from '../types';

interface WordRulerProps {
  margins: MarginConfig;
  paperWidthMm?: number;
}

export const WordRuler: React.FC<WordRulerProps> = ({
  margins,
  paperWidthMm = 210, // A4 standard width in mm
}) => {
  // Generate markings every 1cm (10mm)
  const totalCm = Math.floor(paperWidthMm / 10);
  const leftMarginCm = margins.left / 10;
  const rightMarginCm = margins.right / 10;

  return (
    <div className="w-full flex justify-center py-1 select-none pointer-events-none">
      <div 
        className="relative h-5 bg-white dark:bg-[#0f1423] border border-slate-300 dark:border-white/10 rounded text-[9px] font-mono text-slate-500 dark:text-slate-400 flex items-end shadow-xs"
        style={{ width: '800px', maxWidth: '100%' }}
      >
        {/* Left Margin Shading */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-blue-500/15 border-r border-blue-500/40"
          style={{ width: `${(margins.left / paperWidthMm) * 100}%` }}
        />

        {/* Right Margin Shading */}
        <div 
          className="absolute top-0 bottom-0 right-0 bg-blue-500/15 border-l border-blue-500/40"
          style={{ width: `${(margins.right / paperWidthMm) * 100}%` }}
        />

        {/* Ruler tick marks */}
        <div className="w-full h-full flex justify-between px-1 relative z-10 items-end pb-0.5">
          {Array.from({ length: totalCm + 1 }).map((_, i) => {
            const isZero = Math.abs(i - leftMarginCm) < 0.5;
            return (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-[8px] leading-none ${isZero ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {i}
                </span>
                <div className={`w-[1px] ${i % 5 === 0 ? 'h-2 bg-slate-400' : 'h-1 bg-slate-300 dark:bg-slate-600'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
