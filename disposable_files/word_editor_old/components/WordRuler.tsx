import React from 'react';
import { MarginConfig } from '../types';

interface WordRulerProps {
  margins: MarginConfig;
  paperWidthMm?: number;
  paperWidthPx: number;
}

export const WordRuler: React.FC<WordRulerProps> = ({
  margins,
  paperWidthMm = 210, // A4 standard width in mm
  paperWidthPx,
}) => {
  const totalCm = Math.floor(paperWidthMm / 10);
  const leftPct = (margins.left / paperWidthMm) * 100;
  const rightPct = (margins.right / paperWidthMm) * 100;

  return (
    <div 
      className="relative h-6 bg-slate-100 dark:bg-[#0f1423] border-t border-x border-slate-300 dark:border-white/15 text-[9px] font-mono text-slate-500 dark:text-slate-400 select-none pointer-events-none rounded-t-[2px] shadow-xs"
      style={{ width: `${paperWidthPx}px` }}
    >
      {/* 1. Left Non-printable Margin Shading */}
      <div 
        className="absolute top-0 bottom-0 left-0 bg-slate-200/90 dark:bg-white/5 border-r border-blue-500/50"
        style={{ width: `${leftPct}%` }}
      >
        {/* Margin downward indicator marker */}
        <div className="absolute right-[-4px] bottom-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-blue-600 dark:border-b-blue-400" />
      </div>

      {/* 2. White Printable Core Body */}
      <div 
        className="absolute top-0 bottom-0 bg-white dark:bg-[#121626]"
        style={{ 
          left: `${leftPct}%`, 
          right: `${rightPct}%` 
        }}
      />

      {/* 3. Right Non-printable Margin Shading */}
      <div 
        className="absolute top-0 bottom-0 right-0 bg-slate-200/90 dark:bg-white/5 border-l border-blue-500/50"
        style={{ width: `${rightPct}%` }}
      >
        {/* Margin downward indicator marker */}
        <div className="absolute left-[-4px] bottom-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-blue-600 dark:border-b-blue-400" />
      </div>

      {/* 4. Measurement Centimeter Marks */}
      <div className="w-full h-full flex justify-between px-1 relative z-10 items-end pb-0.5">
        {Array.from({ length: totalCm + 1 }).map((_, i) => {
          const isMajor = i % 5 === 0;
          return (
            <div key={i} className="flex flex-col items-center">
              <span className={`text-[8px] leading-none mb-0.5 ${isMajor ? 'font-bold text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {i}
              </span>
              <div className={`w-[1px] ${isMajor ? 'h-2 bg-slate-400 dark:bg-slate-500' : 'h-1 bg-slate-300 dark:bg-slate-600'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
