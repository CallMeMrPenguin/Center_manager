import React, { useState } from 'react';
import { getStudentTier, StudentTier } from '../types';
import { showToast } from '../../../components/Toast';

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
  const [isClicked, setIsClicked] = useState(false);

  if (!student) return null;

  const scoreNum = typeof stats.overall === 'number' ? stats.overall : parseFloat(String(stats.overall)) || 0;
  const tier: StudentTier = getStudentTier(scoreNum);

  const handleRankClick = () => {
    setIsClicked(true);
    showToast(`Hạng ${tier.name} — Danh hiệu: ${tier.title} (${tier.minScore} - ${tier.maxScore} đ)`, 'success');
    setTimeout(() => setIsClicked(false), 600);
  };

  // Rank-specific glow & border theme
  const getRankTheme = (t: number) => {
    switch (t) {
      case 8: // Quán Quân
        return {
          glow: 'shadow-[0_0_28px_rgba(251,191,36,0.5)] border-amber-400/60 bg-gradient-to-b from-[#2e2308] to-[#121626]',
          badgeText: 'text-amber-300 font-black',
          aura: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        };
      case 7: // Cao Thủ
        return {
          glow: 'shadow-[0_0_28px_rgba(236,72,153,0.5)] border-pink-400/60 bg-gradient-to-b from-[#2e0f22] to-[#121626]',
          badgeText: 'text-pink-300 font-black',
          aura: 'from-pink-500/20 via-rose-500/10 to-transparent',
        };
      case 6: // Tinh Anh
        return {
          glow: 'shadow-[0_0_28px_rgba(168,85,247,0.5)] border-purple-400/60 bg-gradient-to-b from-[#250d38] to-[#121626]',
          badgeText: 'text-purple-300 font-bold',
          aura: 'from-purple-500/20 via-indigo-500/10 to-transparent',
        };
      case 5: // Kim Cương
        return {
          glow: 'shadow-[0_0_28px_rgba(6,182,212,0.5)] border-cyan-400/60 bg-gradient-to-b from-[#0b2736] to-[#121626]',
          badgeText: 'text-cyan-300 font-bold',
          aura: 'from-cyan-500/20 via-teal-500/10 to-transparent',
        };
      case 4: // Bạch Kim
        return {
          glow: 'shadow-[0_0_24px_rgba(129,140,248,0.4)] border-indigo-400/50 bg-gradient-to-b from-[#141a38] to-[#121626]',
          badgeText: 'text-indigo-300 font-bold',
          aura: 'from-indigo-500/20 via-blue-500/10 to-transparent',
        };
      case 3: // Vàng
        return {
          glow: 'shadow-[0_0_24px_rgba(234,179,8,0.4)] border-yellow-400/50 bg-gradient-to-b from-[#282108] to-[#121626]',
          badgeText: 'text-yellow-300 font-bold',
          aura: 'from-yellow-500/20 via-amber-500/10 to-transparent',
        };
      case 2: // Bạc
        return {
          glow: 'shadow-[0_0_20px_rgba(56,189,248,0.35)] border-sky-400/40 bg-gradient-to-b from-[#0e2130] to-[#121626]',
          badgeText: 'text-sky-300 font-bold',
          aura: 'from-sky-500/15 via-blue-500/5 to-transparent',
        };
      default: // Đồng
        return {
          glow: 'shadow-[0_0_20px_rgba(217,119,6,0.35)] border-amber-600/40 bg-gradient-to-b from-[#2b1708] to-[#121626]',
          badgeText: 'text-amber-500 font-bold',
          aura: 'from-amber-700/15 via-amber-600/5 to-transparent',
        };
    }
  };

  const rankTheme = getRankTheme(tier.tier);

  return (
    <div className="animate-cascade-1 select-none">
      <div className="bg-[#0e1222] border border-[#1e2744] p-6 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        {/* Left: Avatar & Info */}
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
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

        {/* Right: Stats & Glorious Rank Badge Card */}
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

          {/* Interactive Glorious Rank Badge */}
          <div
            onClick={handleRankClick}
            title={`Nhấn để xem chi tiết hạng ${tier.name}`}
            className={`group relative flex items-center gap-3.5 px-4 py-2 rounded-xl border transition-all duration-300 cursor-pointer ${
              rankTheme.glow
            } ${isClicked ? 'scale-95' : 'hover:scale-105'}`}
          >
            {/* Rank Icon with Hover Scale & Click Pulse */}
            <div className="relative">
              <img
                src={tier.badge}
                alt={tier.name}
                className="w-13 h-13 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)] group-hover:scale-120 transition-transform duration-300 ease-out"
              />
              {isClicked && (
                <span className="absolute inset-0 rounded-full animate-ping border-2 border-white pointer-events-none" />
              )}
            </div>

            {/* Rank Metadata */}
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
