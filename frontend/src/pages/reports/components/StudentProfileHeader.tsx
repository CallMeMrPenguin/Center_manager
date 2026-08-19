import React from 'react';
import {
  GraduationCap,
  School,
  Calendar,
  User,
  Users,
  Phone,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { getStudentTier, StudentTier } from '../types';

interface StudentProfileHeaderProps {
  student: any;
  stats: {
    overall: string | number;
    c1?: string | number;
    c2?: string | number;
    hw?: string | number;
    attendancePct: number;
    sessionCount?: number;
    rank: string;
    level: string;
  };
  onClearStudent: () => void;
  isTestMode?: boolean;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  student,
  stats,
  onClearStudent,
  isTestMode,
}) => {
  if (!student) return null;

  const scoreNum =
    typeof stats.overall === 'number'
      ? stats.overall
      : parseFloat(String(stats.overall)) || 0;
  const tier: StudentTier = getStudentTier(scoreNum);

  const getRankTheme = (t: number) => {
    switch (t) {
      case 8: // Quán Quân
        return { badgeText: 'text-amber-400 font-black' };
      case 7: // Cao Thủ
        return { badgeText: 'text-rose-400 font-black' };
      case 6: // Tinh Anh
        return { badgeText: 'text-purple-400 font-black' };
      case 5: // Kim Cương
        return { badgeText: 'text-cyan-400 font-black' };
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

  const studentIdStr = (student.id || student.student_id || 1)
    .toString()
    .padStart(4, '0');

  const gradeDisplay = student.enrolled_classes
    ? student.enrolled_classes
    : student.grade
    ? String(student.grade).startsWith('Lớp') ||
      String(student.grade).startsWith('Khối')
      ? student.grade
      : `Lớp ${student.grade}`
    : 'Lớp 6';

  return (
    <div className="select-none relative bg-[#0e1222] border border-[#1e2744] p-6 rounded-2xl shadow-xl">
      {/* Top-Right Deselect Button (X icon only) */}
      <button
        onClick={onClearStudent}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-20"
        title="Bỏ chọn học sinh"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT: Student ID Card Information (cols 1-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Avatar & Main Identification */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg border border-white/20 ring-4 ring-indigo-500/10 shrink-0">
              {student.full_name?.slice(0, 2)?.toUpperCase() || 'HS'}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded">
                  ID: HS-{studentIdStr}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {student.status || 'Đang theo học'}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {student.full_name}
                </h2>
                {student.nickname && (
                  <span className="text-sm font-bold text-indigo-300">
                    ({student.nickname})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium min-w-[70px]">
                Khối / Lớp:
              </span>
              <span className="font-semibold text-white truncate">
                {gradeDisplay}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium min-w-[70px]">
                Trường học:
              </span>
              <span className="font-semibold text-white truncate">
                {student.school || 'Trung tâm'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium min-w-[70px]">
                Ngày sinh:
              </span>
              <span className="font-semibold text-white">
                {student.date_of_birth || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium min-w-[70px]">
                Giới tính:
              </span>
              <span className="font-semibold text-white">
                {student.gender || 'Chưa cập nhật'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium min-w-[70px]">
                Phụ huynh:
              </span>
              <span className="font-semibold text-white truncate">
                {student.father_name ||
                  student.mother_name ||
                  'Chưa cập nhật'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium min-w-[70px]">
                Điện thoại:
              </span>
              <span className="font-semibold text-white">
                {student.father_phone ||
                  student.mother_phone ||
                  student.phone ||
                  'Chưa cập nhật'}
              </span>
            </div>

            {student.enroll_date && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-medium min-w-[70px]">
                  Nhập học:
                </span>
                <span className="font-semibold text-white">
                  {student.enroll_date}
                </span>
              </div>
            )}

            {student.address && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-medium min-w-[70px]">
                  Địa chỉ:
                </span>
                <span className="font-semibold text-white truncate">
                  {student.address}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detailed Vertical Scores & Performance (cols 8-12) */}
        <div className="lg:col-span-5 lg:border-l lg:border-white/10 lg:pl-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10 space-y-4">
          {/* Tier & Rank Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={tier.badge}
                alt={tier.name}
                className="w-12 h-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Cấp Bậc
                </span>
                <span className={`text-base font-black ${rankTheme.badgeText}`}>
                  {tier.name}
                </span>
                <span className="text-xs font-semibold text-slate-300 block">
                  {tier.title}
                </span>
              </div>
            </div>

            <div className="text-right pr-6 lg:pr-8">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Thứ Hạng
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {stats.rank}
              </span>
            </div>
          </div>

          {/* Vertical Scores Breakdown */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Điểm Tổng Kết
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {stats.overall}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isTestMode ? 'Từ Vựng (Check 1)' : 'Check 1'}
              </span>
              <span className="text-xl font-black text-blue-400 font-mono">
                {stats.c1 ?? '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isTestMode ? 'Ngữ Pháp (Check 2)' : 'Check 2'}
              </span>
              <span className="text-xl font-black text-purple-400 font-mono">
                {stats.c2 ?? '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Homework (BTVN)
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {stats.hw ?? '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Chuyên Cần
              </span>
              <div className="flex items-baseline gap-2">
                {stats.sessionCount !== undefined && stats.sessionCount > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({stats.sessionCount} buổi)
                  </span>
                )}
                <span className="text-xl font-black text-sky-400 font-mono">
                  {stats.attendancePct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
