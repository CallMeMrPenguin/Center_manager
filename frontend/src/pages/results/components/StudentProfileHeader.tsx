import React, { useMemo } from 'react';
import { User, BookOpen, RefreshCw } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { StudentProfileSummary } from '../types';
import { getStudentTier, StudentTier } from '../../reports/types';
import { isStudentUser } from '../../../utils/authUtils';
import { format1Dec, trunc1Dec } from '../../../utils';

interface StudentProfileHeaderProps {
  students: any[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
  classes: any[];
  selectedClassId: string;
  onSelectClass: (cid: string) => void;
  summary: StudentProfileSummary | null;
  stats?: any;
  loading: boolean;
  onRefresh: () => void;
  isStudent?: boolean;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  classes,
  selectedClassId,
  onSelectClass,
  summary,
  stats,
  loading,
  onRefresh,
  isStudent = false,
}) => {
  const isStudentMode = isStudent || isStudentUser();

  const studentOptions: SelectOption[] = useMemo(() => {
    return students.map((s) => ({
      value: s.id,
      label: `${s.full_name}${s.nickname ? ` (${s.nickname})` : ''} - ${s.grade || 'Lớp ?'}`,
    }));
  }, [students]);

  const classOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ value: 'all', label: 'Tất cả lớp học' }];
    classes.forEach((c) => {
      opts.push({ value: String(c.id), label: c.class_name });
    });
    return opts;
  }, [classes]);

  const scoreNum =
    stats && stats.overall !== undefined && stats.overall !== null && stats.overall !== '-'
      ? (typeof stats.overall === 'number' ? stats.overall : parseFloat(String(stats.overall)) || 0)
      : summary?.overall_avg != null
      ? Number(summary.overall_avg)
      : 0;

  const tier: StudentTier = getStudentTier(scoreNum);

  const getRankTheme = (t: number) => {
    switch (t) {
      case 8: return { badgeText: 'text-amber-400 font-black' };
      case 7: return { badgeText: 'text-rose-400 font-black' };
      case 6: return { badgeText: 'text-purple-400 font-black' };
      case 5: return { badgeText: 'text-cyan-400 font-black' };
      case 4: return { badgeText: 'text-indigo-300 font-bold' };
      case 3: return { badgeText: 'text-yellow-400 font-bold' };
      case 2: return { badgeText: 'text-sky-300 font-bold' };
      default: return { badgeText: 'text-amber-500 font-bold' };
    }
  };

  const rankTheme = getRankTheme(tier.tier);
  const studentIdStr = summary ? String(summary.student_id).padStart(4, '0') : '0000';

  const rawGrade = summary?.grade;
  const gradeDisplay = summary?.enrolled_classes
    ? summary.enrolled_classes
    : rawGrade
    ? String(rawGrade).startsWith('Lớp') || String(rawGrade).startsWith('Khối')
      ? rawGrade
      : `Lớp ${rawGrade}`
    : 'Chưa phân lớp';

  const rawPi = summary?.performance_index != null
    ? Number(summary.performance_index)
    : scoreNum > 0
    ? scoreNum * 10
    : 0;
  const piScore = rawPi > 0 ? rawPi.toFixed(1) : (scoreNum > 0 ? (scoreNum * 10).toFixed(1) : '0.0');

  const getEvaluation = (score: number, currentTier: StudentTier) => {
    if (score <= 0) return { text: 'Chưa Đánh Giá', color: 'text-slate-400' };
    switch (currentTier.tier) {
      case 8: return { text: 'Xuất Chúng (Vững Vàng)', color: 'text-amber-400' };
      case 7: return { text: 'Vượt Trội (Ưu Tú)', color: 'text-rose-400' };
      case 6: return { text: 'Ưu Tú (Tiến Bộ Nhanh)', color: 'text-purple-400' };
      case 5: return { text: 'Xuất Sắc (Nắm Chắc)', color: 'text-cyan-400' };
      case 4: return { text: 'Giỏi (Đang Tiến Bộ)', color: 'text-indigo-300' };
      case 3: return { text: 'Khá (Đang Tiến Bộ)', color: 'text-yellow-400' };
      case 2: return { text: 'Trung Bình (Cần Củng Cố)', color: 'text-sky-400' };
      default: return { text: 'Yếu (Cần Phụ Đạo)', color: 'text-rose-400' };
    }
  };

  const evaluation = getEvaluation(scoreNum, tier);

  const overallDisplay = stats?.overall !== undefined && stats?.overall !== null && stats?.overall !== '-'
    ? String(stats.overall)
    : summary?.overall_avg !== null && summary?.overall_avg !== undefined
    ? format1Dec(summary.overall_avg)
    : '-';

  const c1Display = stats?.c1 !== undefined && stats?.c1 !== null && stats?.c1 !== '-'
    ? String(stats.c1)
    : summary?.avg_check_1 !== null && summary?.avg_check_1 !== undefined
    ? format1Dec(summary.avg_check_1)
    : '-';

  const c2Display = stats?.c2 !== undefined && stats?.c2 !== null && stats?.c2 !== '-'
    ? String(stats.c2)
    : summary?.avg_check_2 !== null && summary?.avg_check_2 !== undefined
    ? format1Dec(summary.avg_check_2)
    : '-';

  const hwDisplay = stats?.hw !== undefined && stats?.hw !== null && stats?.hw !== '-'
    ? String(stats.hw)
    : summary?.avg_homework !== null && summary?.avg_homework !== undefined
    ? format1Dec(summary.avg_homework)
    : '-';

  const attendanceDisplay = stats?.attendancePct !== undefined
    ? stats.attendancePct
    : Math.trunc(summary?.attendance_rate ?? 100);

  const sessionCountDisplay = stats?.sessionCount !== undefined
    ? stats.sessionCount
    : summary?.total_sessions ?? 0;

  const rankDisplay = stats?.rank && stats.rank !== '-' ? String(stats.rank) : '';

  return (
    <div className="select-none relative bg-[#0e1222] border border-[#1e2744] p-5 sm:p-6 rounded-2xl shadow-xl space-y-5">
      {/* 1. TOP FILTER BAR (Admin / Teacher Only) */}
      {!isStudentMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="w-56 max-w-full">
              <CustomSelect
                value={selectedClassId}
                onChange={(val) => onSelectClass(String(val))}
                options={classOptions}
                placeholder="Chọn lớp học..."
                icon={<BookOpen size={14} className="text-indigo-400" />}
              />
            </div>

            <div className="w-72 max-w-full">
              <CustomSelect
                value={selectedStudentId || ''}
                onChange={(val) => onSelectStudent(Number(val))}
                options={studentOptions}
                placeholder={students.length > 0 ? 'Chọn học sinh...' : 'Không có học sinh trong lớp'}
                searchable
                searchPlaceholder="Tìm tên học sinh..."
                disabled={students.length === 0}
                icon={<User size={14} className="text-sky-400" />}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151a2e] hover:bg-[#1e2642] text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : 'text-slate-400'} />
            <span>Làm mới</span>
          </button>
        </div>
      )}

      {/* 2. EXACT IDENTICAL STUDENT ID CARD FROM REPORTS */}
      {summary ? (
        <div className="space-y-5">
          {/* TOP HEADER: Left: Avatar + Name + Nickname + #Rank | Right: Big Rank Icon + Rank Name */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Profile Pic & Info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shrink-0">
                {summary.full_name?.slice(0, 2)?.toUpperCase() || 'HS'}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    ID: HS-{studentIdStr}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {summary.status || 'Đang theo học'}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {summary.full_name}
                  </h2>
                  {summary.nickname && (
                    <span className="text-lg font-bold text-indigo-300">
                      ({summary.nickname})
                    </span>
                  )}
                  {rankDisplay && (
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight ml-1">
                      {rankDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Big Rank Icon & Rank Name */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                <img
                  src={tier.badge}
                  alt={tier.name}
                  className={`w-full h-full object-contain ${tier.scale || 'scale-100'} drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]`}
                />
              </div>
              <span className={`text-2xl sm:text-3xl font-black leading-none ${rankTheme.badgeText}`}>
                {tier.name}
              </span>
            </div>
          </div>

          {/* MAIN BODY: 2 Balanced Columns with Matching Line Separators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-2">
            {/* LEFT COLUMN: Thông Tin Học Sinh */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Thông Tin Học Sinh
                </span>
                <span className="text-xs text-slate-500 font-medium">Hồ sơ cá nhân</span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Khối / Lớp:</span>
                <span className="font-bold text-white text-right truncate max-w-[200px] sm:max-w-none">
                  {gradeDisplay}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Trường học:</span>
                <span className="font-bold text-white text-right truncate max-w-[200px] sm:max-w-none">
                  {summary.school || 'Trung tâm'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Ngày sinh:</span>
                <span className="font-semibold text-slate-200">
                  {summary.date_of_birth || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Giới tính:</span>
                <span className="font-semibold text-slate-200">
                  {summary.gender || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Phụ huynh:</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-[200px] sm:max-w-none">
                  {summary.father_name || summary.mother_name || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Điện thoại:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {summary.father_phone || summary.mother_phone || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Địa chỉ:</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-[220px]">
                  {summary.address || 'Chưa cập nhật'}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Kết Quả Học Tập & Đánh Giá */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Kết Quả Học Tập & Đánh Giá
                </span>
                <span className="text-xs text-slate-500 font-medium">Thống kê chi tiết</span>
              </div>

              {/* Điểm Tổng Kết */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-300 font-bold">Điểm Tổng Kết</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {overallDisplay}
                </span>
              </div>

              {/* Chỉ Số PI */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-300 font-bold">Chỉ Số PI (Hiệu Suất)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono">
                    {piScore}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ 100</span>
                </div>
              </div>

              {/* Đánh Giá Năng Lực */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-300 font-bold">Đánh Giá Năng Lực</span>
                <span className={`text-sm font-black ${evaluation.color}`}>
                  {evaluation.text}
                </span>
              </div>

              {/* Từ Vựng */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Từ Vựng</span>
                <span className="text-base sm:text-lg font-black text-blue-400 font-mono">
                  {c1Display}
                </span>
              </div>

              {/* Ngữ Pháp */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Ngữ Pháp</span>
                <span className="text-base sm:text-lg font-black text-purple-400 font-mono">
                  {c2Display}
                </span>
              </div>

              {/* BTVN */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">BTVN</span>
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                  {hwDisplay}
                </span>
              </div>

              {/* Chuyên Cần */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-sm">
                <span className="text-slate-400 font-medium">Chuyên Cần</span>
                <div className="flex items-baseline gap-2">
                  {sessionCountDisplay > 0 && (
                    <span className="text-xs text-slate-400">
                      ({sessionCountDisplay} buổi)
                    </span>
                  )}
                  <span className="text-base sm:text-lg font-black text-sky-400 font-mono">
                    {attendanceDisplay}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs font-semibold">
          Chưa chọn học sinh hoặc không tìm thấy dữ liệu.
        </div>
      )}
    </div>
  );
};
