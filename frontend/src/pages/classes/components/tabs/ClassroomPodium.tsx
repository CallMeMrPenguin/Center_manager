import React from 'react';
import { Presentation, Sparkles } from 'lucide-react';

interface ClassroomPodiumProps {
  totalOccupied: number;
  totalSeats: number;
  occupancyPct: number;
}

export const ClassroomPodium: React.FC<ClassroomPodiumProps> = ({
  totalOccupied,
  totalSeats,
  occupancyPct,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-6 flex flex-col items-center select-none">
      {/* 1. Blackboard / Teacher Podium Bar */}
      <div className="w-full relative bg-gradient-to-r from-slate-800 via-[#161f36] to-slate-800 border-2 border-slate-700/80 rounded-2xl py-3 px-6 shadow-md flex items-center justify-between text-white">
        {/* Left Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]">
            <Presentation size={17} />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
              <span>BỤC GIẢNG & BẢNG LỚP HỌC</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/40">
                Front Board
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Hướng nhìn chính của học sinh lên bảng</p>
          </div>
        </div>

        {/* Right Occupancy KPI Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-xs font-black text-emerald-400">
              {totalOccupied} / {totalSeats} chỗ
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              Lấp đầy {occupancyPct}%
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Sparkles size={12} />
            <span>Kéo thả để xếp</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Orientation Arrow Indicator */}
      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        <span>▼ Hàng ghế học sinh (nhìn từ trên xuống) ▼</span>
      </div>
    </div>
  );
};
