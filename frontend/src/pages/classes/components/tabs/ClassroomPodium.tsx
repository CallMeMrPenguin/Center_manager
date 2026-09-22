import React from 'react';
import { Presentation, GraduationCap, LogIn, Compass, Sparkles } from 'lucide-react';

interface ClassroomPodiumProps {
  totalOccupied: number;
  totalSeats: number;
  occupancyPct: number;
  teacherName?: string;
}

export const ClassroomPodium: React.FC<ClassroomPodiumProps> = ({
  totalOccupied,
  totalSeats,
  occupancyPct,
  teacherName,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-6 flex flex-col items-center select-none gap-3">
      {/* 1. Blackboard / Front Wall Banner */}
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

      {/* 2. Physical Reference Anchors: BÀN GIÁO VIÊN & CỬA RA VÀO */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary Reference: BÀN GIÁO VIÊN (Teacher's Desk) */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-[#12162a] border-2 border-indigo-500/70 dark:border-indigo-500/50 rounded-2xl p-3.5 shadow-sm shadow-indigo-500/15 transition-all">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
            <GraduationCap size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/30">
                Bàn Giáo Viên
              </span>
              <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                Mốc Chuẩn
              </span>
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white truncate mt-1">
              {teacherName ? `GV: ${teacherName}` : 'Bàn Giảng Viên'}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Khu Vực Bục</span>
            <span>Cạnh Bảng</span>
          </div>
        </div>

        {/* Secondary Reference: CỬA RA VÀO (Classroom Entrance) */}
        <div className="flex items-center justify-between bg-white dark:bg-[#12162a] border border-slate-300 dark:border-white/10 rounded-2xl p-3.5 shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <LogIn size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lối Ra Vào Lớp
              </span>
              <div className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                Cửa Chính Lớp Học
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-transparent">
            <Compass size={13} className="text-indigo-500" />
            <span>Hướng Trước</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Orientation Arrow Indicator */}
      <div className="flex items-center gap-3 mt-0.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
        <span>▼ CÁC DÃY BÀN HỌC SINH (NHÌN TỪ BỤC GIẢNG XUỐNG) ▼</span>
      </div>
    </div>
  );
};
