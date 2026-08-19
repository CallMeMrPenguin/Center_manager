import React from 'react';
import { GraduationCap, School, Calendar, User, Phone, X } from 'lucide-react';
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
        return { badgeText: 'text-amber-400 font-black' };
      case 7: // Cao Thủ
        return { badgeText: 'text-rose-400 font-black' };
      case 6: // Tinh Anh
        return { badgeText: 'text-purple-400 font-bold' };
      case 5: // Kim Cương
        return { badgeText: 'text-cyan-400 font-bold' };
      case 4: // Bạch Kim
        return { badgeText: 'text-indigo-300 font-bold' };
      case 3: // Vàng
        return { badgeText: 'text-yellow-400 font-bold' };
      case 2: // Bạc
        return { badgeText: 'text-sky-300 font-bold' };
      default: // Đồng
        return { badgeText: 'text-amber-500 font-bold' };
    }
  };

  const rankTheme = getRankTheme(tier.tier);

  const gradeText = student.grade
    ? (String(student.grade).startsWith('Lớp') || String(student.grade).startsWith('Khối') ? student.grade : `Lớp ${student.grade}`)
    : (student.enrolled_classes || 'Lớp 6');

  return (
    <div className="select-none">
      <div className="bg-[#0e1222] border border-[#1e2744] p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative">
        {/* Left: Basic Student Information */}
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
            {student.full_name?.slice(0, 2)?.toUpperCase() || 'HS'}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Top row: Name, Nickname & Clear Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                {student.full_name}
              </h2>

              {student.nickname && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-xs font-bold">
                  {student.nickname}
                </span>
              )}

              <button
                onClick={onClearStudent}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#182038] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#2a3760] hover:border-rose-500/40 text-[11px] font-bold transition cursor-pointer"
                title="Bỏ chọn học sinh"
              >
                <X className="w-3 h-3 text-white" />
                <span>Bỏ Chọn</span>
              </button>
            </div>

            {/* Basic Info Metadata Items - NO PIPE (|) SEPARATOR */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-medium">Khối / Lớp:</span>
                <span className="font-semibold text-white">{gradeText}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-medium">Trường:</span>
                <span className="font-semibold text-white">{student.school || 'Trung tâm'}</span>
              </div>

              {student.gender && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400 font-medium">Giới tính:</span>
                  <span className="font-semibold text-white">{student.gender}</span>
                </div>
              )}

              {student.date_of_birth && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400 font-medium">Ngày sinh:</span>
                  <span className="font-semibold text-white">{student.date_of_birth}</span>
                </div>
              )}

              {(student.father_phone || student.mother_phone || student.phone) && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400 font-medium">SĐT:</span>
                  <span className="font-semibold text-white">
                    {student.father_phone || student.mother_phone || student.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Scores & Tier (Điểm) - Direct Layout Without Nested Sub-Cards or Inner Borders */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-4 xl:pt-0 border-t xl:border-t-0 border-white/5 shrink-0">
          {/* Tổng Điểm */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Tổng Điểm
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {stats.overall}
            </span>
          </div>

          {/* Chuyên Cần */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Chuyên Cần
            </span>
            <span className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight">
              {stats.attendancePct}%
            </span>
          </div>

          {/* Thứ Hạng */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Hạng
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {stats.rank}
            </span>
          </div>

          {/* Cấp Bậc (Tier) - Clean Layout with No Inner Card Container */}
          <div className="flex items-center gap-3">
            <img
              src={tier.badge}
              alt={tier.name}
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Cấp Bậc
              </span>
              <span className={`text-sm sm:text-base font-black ${rankTheme.badgeText}`}>
                {tier.name}
              </span>
              <span className="text-[11px] font-bold text-slate-300 -mt-0.5">
                {tier.title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
