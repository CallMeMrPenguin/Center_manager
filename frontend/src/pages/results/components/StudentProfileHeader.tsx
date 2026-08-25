import React, { useMemo } from 'react';
import { User, BookOpen, RefreshCw, Trophy } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { StudentProfileSummary } from '../types';
import { trunc1Dec } from '../hooks/useStudentResults';
import { isStudentUser } from '../../../utils/authUtils';

interface StudentProfileHeaderProps {
  students: any[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
  classes: any[];
  selectedClassId: string;
  onSelectClass: (cid: string) => void;
  summary: StudentProfileSummary | null;
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

  const studentIdStr = summary ? String(summary.student_id).padStart(4, '0') : '0000';

  return (
    <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-2xl space-y-5">
      {/* 1. TOP FILTER BAR (Admin / Teacher Only — Strictly NEVER rendered for students) */}
      {!isStudentMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3.5">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Class Selector First */}
            <div className="w-56 max-w-full">
              <CustomSelect
                value={selectedClassId}
                onChange={(val) => onSelectClass(String(val))}
                options={classOptions}
                placeholder="Chọn lớp học..."
                icon={<BookOpen size={14} className="text-indigo-400" />}
              />
            </div>

            {/* Student Selector (Filtered strictly by class) */}
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

      {/* 2. STUDENT ID CARD (BÁO CÁO THỐNG KÊ STANDARD) */}
      {summary ? (
        <div className="space-y-4">
          {/* Card Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar Initial */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white font-black text-2xl flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.35)] shrink-0 border border-white/20">
                {summary.full_name?.charAt(0)?.toUpperCase() || 'H'}
              </div>

              {/* Identity & Badges */}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    ID: HS-{studentIdStr}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{summary.status || 'Đang theo học'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {summary.full_name}
                  </h2>
                  {summary.nickname && (
                    <span className="text-sm font-bold text-indigo-300">
                      ({summary.nickname})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Tier Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-[#131728] border border-[#263152] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Xếp Loại Học Lực
                  </span>
                  <span className={`text-base font-black ${summary.tier_color}`}>
                    {summary.tier_label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Lined Report Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Left Column: Personal Info */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Hồ Sơ Học Sinh
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">Thông tin cơ bản</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Khối / Lớp:</span>
                <span className="font-bold text-white text-right">
                  {summary.enrolled_classes || summary.grade || 'Chưa phân lớp'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Trường học:</span>
                <span className="font-bold text-slate-200 text-right">
                  {summary.school || 'Trung tâm'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Ngày sinh:</span>
                <span className="font-semibold text-slate-300">
                  {summary.date_of_birth || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Giới tính:</span>
                <span className="font-semibold text-slate-300">
                  {summary.gender || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Phụ huynh:</span>
                <span className="font-semibold text-slate-200">
                  {summary.father_name || summary.mother_name || 'Chưa cập nhật'}
                  {summary.father_phone ? ` (${summary.father_phone})` : ''}
                </span>
              </div>
            </div>

            {/* Right Column: Academic Summary & Evaluation */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Tổng Kết Năng Lực
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">Chỉ số học tập</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Điểm trung bình các bài:</span>
                <span className="font-mono font-bold text-base text-indigo-400">
                  {summary.overall_avg !== null ? trunc1Dec(summary.overall_avg) : '-'} / 10.0
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Chỉ số năng lực (PI):</span>
                <span className="font-mono font-bold text-sky-400">
                  {summary?.performance_index ?? '0.0'} / 100
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Đánh giá chung:</span>
                <span className={`font-bold ${summary?.tier_color || 'text-slate-400'}`}>
                  {summary?.evaluation_text || 'Chưa đánh giá'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Tổng số buổi đã học:</span>
                <span className="font-bold text-slate-200">
                  {summary?.total_sessions ?? 0} buổi ({summary?.present_sessions ?? 0} có mặt, {summary?.absent_sessions ?? 0} vắng)
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Tỷ lệ chuyên cần:</span>
                <span className="font-bold text-emerald-400">
                  {Math.trunc(summary?.attendance_rate ?? 100)}%
                </span>
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
