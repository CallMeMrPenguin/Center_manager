import React from 'react';
import { getStudentTier, StudentTier } from '../types';

interface StudentProfileHeaderProps {
  student: any;
  stats: {
    overall: string | number;
    attendancePct: number;
    rank: string;
    level: string;
  };
  onClearStudent: () => void;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  student,
  stats,
  onClearStudent,
}) => {
  if (!student) return null;

  const scoreNum = typeof stats.overall === 'number' ? stats.overall : parseFloat(String(stats.overall)) || 0;
  const tier: StudentTier = getStudentTier(scoreNum);

  const getRankTheme = (t: number) => {
    switch (t) {
      case 8: // Quán Quân
        return {
          card: 'border-amber-400/50 bg-[#1e1708]',
          badgeText: 'text-amber-300 font-black',
        };
      case 7: // Cao Thủ
        return {
          card: 'border-pink-400/50 bg-[#200c19]',
          badgeText: 'text-pink-300 font-black',
        };
      case 6: // Tinh Anh
        return {
          card: 'border-purple-400/50 bg-[#1a0c29]',
          badgeText: 'text-purple-300 font-bold',
        };
      case 5: // Kim Cương
        return {
          card: 'border-cyan-400/50 bg-[#091f2b]',
          badgeText: 'text-cyan-300 font-bold',
        };
      case 4: // Bạch Kim
        return {
          card: 'border-indigo-400/40 bg-[#12162e]',
          badgeText: 'text-indigo-300 font-bold',
        };
      case 3: // Vàng
        return {
          card: 'border-yellow-400/40 bg-[#1f1a08]',
          badgeText: 'text-yellow-300 font-bold',
        };
      case 2: // Bạc
        return {
          card: 'border-sky-400/30 bg-[#0b1a26]',
          badgeText: 'text-sky-300 font-bold',
        };
      default: // Đồng
        return {
          card: 'border-amber-600/30 bg-[#1f1208]',
          badgeText: 'text-amber-500 font-bold',
        };
    }
  };

  const rankTheme = getRankTheme(tier.tier);

  return (
    <div className="select-none">
      <div className="bg-[#0e1222] border border-[#1e2744] p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        {/* Left: Avatar & Student Info */}
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg border border-white/20">
            {student.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{student.full_name}</h2>
              {student.nickname && (
                <span className="text-sm font-extrabold text-white">- {student.nickname}</span>
              )}
              <button
                onClick={onClearStudent}
                className="ml-3 px-2.5 py-1 rounded-lg bg-[#1a2340] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#2e3b66] text-[10px] font-bold transition cursor-pointer"
                title="Bỏ chọn học sinh"
              >
                Bỏ Chọn ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {student.grade || 'Lớp 6'} | {student.school || 'Trung tâm'} | Theo dõi tiến độ học tập qua các kỳ đánh giá
            </p>
          </div>
        </div>

        {/* Right: Stats & Clean Static Rank Badge */}
        <div className="flex flex-wrap items-center gap-4 z-10">
          {/* Stats Bar */}
          <div className="flex items-center gap-5 bg-[#141a30] border border-[#232d4e] px-5 py-3 rounded-xl">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Tổng Điểm</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{stats.overall}</span>
            </div>
            <div className="h-8 w-px bg-[#232d4e]"></div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Chuyên Cần</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{stats.attendancePct}%</span>
            </div>
            <div className="h-8 w-px bg-[#232d4e]"></div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Hạng</span>
              <span className="text-xl font-black text-amber-400 font-mono">{stats.rank}</span>
            </div>
          </div>

          {/* Clean Static Rank Badge Card */}
          <div
            className={`flex items-center gap-3.5 px-4 py-2 rounded-xl border ${rankTheme.card}`}
          >
            <img
              src={tier.badge}
              alt={tier.name}
              className="w-12 h-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
            />

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Cấp Bậc
              </span>
              <span className={`text-sm font-black ${rankTheme.badgeText}`}>
                {tier.name}
              </span>
              <span className="text-[10px] font-extrabold text-slate-300 -mt-0.5">
                {tier.title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
