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
  Award,
  Activity,
  Sparkles,
  BookOpen,
  FileText,
  CheckSquare,
  CheckCircle2,
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

  // Calculate PI index (Performance Index on 0-100 scale)
  const rawPi = student.performance_index != null
    ? Number(student.performance_index)
    : (scoreNum > 0 ? scoreNum * 10 : 0);
  const piScore = rawPi > 0 ? rawPi.toFixed(1) : (scoreNum > 0 ? (scoreNum * 10).toFixed(1) : '0.0');

  // Dynamic Evaluation based on PI & Score
  const getEvaluation = (score: number, piVal: number) => {
    if (student.rating_label) {
      return { text: student.rating_label, color: 'text-emerald-400' };
    }
    if (score >= 9.5 || piVal >= 95) return { text: 'Xuất Chúng (Vững Vàng)', color: 'text-amber-400' };
    if (score >= 9.0 || piVal >= 90) return { text: 'Vượt Trội (Ưu Tú)', color: 'text-rose-400' };
    if (score >= 8.5 || piVal >= 85) return { text: 'Xuất Sắc (Tiến Bộ Nhanh)', color: 'text-purple-400' };
    if (score >= 8.0 || piVal >= 80) return { text: 'Giỏi (Nắm Chắc)', color: 'text-cyan-400' };
    if (score >= 7.0 || piVal >= 70) return { text: 'Khá (Đang Tiến Bộ)', color: 'text-blue-400' };
    if (score >= 5.5 || piVal >= 55) return { text: 'Trung Bình (Cần Củng Cố)', color: 'text-amber-400' };
    if (score > 0) return { text: 'Yếu (Cần Phụ Đạo)', color: 'text-rose-400' };
    return { text: 'Chưa Đánh Giá', color: 'text-slate-400' };
  };

  const evaluation = getEvaluation(scoreNum, rawPi);

  return (
    <div className="select-none relative bg-[#0e1222] border border-[#1e2744] p-5 sm:p-6 rounded-2xl shadow-xl space-y-5">
      {/* Top-Right Deselect Button (X icon only) */}
      <button
        onClick={onClearStudent}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-20"
        title="Bỏ chọn học sinh"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* TOP HEADER: Avatar + Name + Nickname + Rank Badge + Thứ Hạng (NO PILL BOXES / NO BORDERS) */}
      <div className="flex flex-wrap items-center gap-4 pr-10">
        {/* Avatar */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shrink-0">
          {student.full_name?.slice(0, 2)?.toUpperCase() || 'HS'}
        </div>

        {/* Identity & Rank Line */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold text-indigo-400">
              ID: HS-{studentIdStr}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {student.status || 'Đang theo học'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Student Name */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {student.full_name}
            </h2>

            {student.nickname && (
              <span className="text-lg font-bold text-indigo-300">
                ({student.nickname})
              </span>
            )}

            {/* #rank */}
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {stats.rank}
            </span>

            {/* Rank Icon */}
            <img
              src={tier.badge}
              alt={tier.name}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md"
            />

            {/* Rank Name */}
            <span className={`text-xl sm:text-2xl font-black ${rankTheme.badgeText}`}>
              {tier.name}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN BODY: 2 Balanced Columns with Matching Line Separators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-2">
        {/* LEFT COLUMN: Thông Tin Cá Nhân (Lined Rows) */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Thông Tin Học Sinh
            </span>
            <span className="text-xs text-slate-500 font-medium">Hồ sơ cá nhân</span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">Khối / Lớp:</span>
            </div>
            <span className="font-bold text-white text-right truncate max-w-[200px] sm:max-w-none">
              {gradeDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <School className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">Trường học:</span>
            </div>
            <span className="font-bold text-white text-right truncate max-w-[200px] sm:max-w-none">
              {student.school || 'Trung tâm'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">Ngày sinh:</span>
            </div>
            <span className="font-semibold text-slate-200">
              {student.date_of_birth || 'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">Giới tính:</span>
            </div>
            <span className="font-semibold text-slate-200">
              {student.gender || 'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">Phụ huynh:</span>
            </div>
            <span className="font-semibold text-slate-200 text-right truncate max-w-[200px] sm:max-w-none">
              {student.father_name || student.mother_name || 'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">Điện thoại:</span>
            </div>
            <span className="font-semibold text-slate-200 font-mono">
              {student.father_phone ||
                student.mother_phone ||
                student.phone ||
                'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              {student.address ? (
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="text-slate-400 font-medium">
                {student.address ? 'Địa chỉ:' : 'Nhập học:'}
              </span>
            </div>
            <span className="font-semibold text-slate-200 text-right truncate max-w-[220px]">
              {student.address || student.enroll_date || 'Chưa cập nhật'}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Điểm Số, Chỉ Số PI & Đánh Giá (Lined Rows) */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Kết Quả Học Tập & Đánh Giá
            </span>
            <span className="text-xs text-slate-500 font-medium">Thống kê chi tiết</span>
          </div>

          {/* Điểm Tổng Kết */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-bold">Điểm Tổng Kết</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {stats.overall}
            </span>
          </div>

          {/* Chỉ Số PI (Performance Index) */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-300 font-bold">Chỉ Số PI (Hiệu Suất)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono">
                {piScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
          </div>

          {/* Đánh Giá Năng Lực */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300 font-bold">Đánh Giá Năng Lực</span>
            </div>
            <span className={`text-sm font-black ${evaluation.color}`}>
              {evaluation.text}
            </span>
          </div>

          {/* Check 1 (Từ Vựng) */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-slate-400 font-medium">
                {isTestMode ? 'Từ Vựng (Check 1)' : 'Check 1 (Từ Vựng)'}
              </span>
            </div>
            <span className="text-base sm:text-lg font-black text-blue-400 font-mono">
              {stats.c1 ?? '-'}
            </span>
          </div>

          {/* Check 2 (Ngữ Pháp) */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <FileText className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-slate-400 font-medium">
                {isTestMode ? 'Ngữ Pháp (Check 2)' : 'Check 2 (Ngữ Pháp)'}
              </span>
            </div>
            <span className="text-base sm:text-lg font-black text-purple-400 font-mono">
              {stats.c2 ?? '-'}
            </span>
          </div>

          {/* Homework (BTVN) */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-400 font-medium">Homework (BTVN)</span>
            </div>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
              {stats.hw ?? '-'}
            </span>
          </div>

          {/* Chuyên Cần */}
          <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-slate-400 font-medium">Chuyên Cần</span>
            </div>
            <div className="flex items-baseline gap-2">
              {stats.sessionCount !== undefined && stats.sessionCount > 0 && (
                <span className="text-xs text-slate-400">
                  ({stats.sessionCount} buổi)
                </span>
              )}
              <span className="text-base sm:text-lg font-black text-sky-400 font-mono">
                {stats.attendancePct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
