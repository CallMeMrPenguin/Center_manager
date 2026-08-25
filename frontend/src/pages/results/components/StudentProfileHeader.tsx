import React, { useMemo } from 'react';
import { User, School, BookOpen, RefreshCw } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { StudentProfileSummary } from '../types';

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
}) => {
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

  return (
    <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-lg space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="w-64 max-w-full">
            <CustomSelect
              value={selectedStudentId || ''}
              onChange={(val) => onSelectStudent(Number(val))}
              options={studentOptions}
              placeholder="Chọn học sinh..."
              searchable
              searchPlaceholder="Tìm tên học sinh..."
              icon={<User size={14} className="text-indigo-400" />}
            />
          </div>

          <div className="w-52 max-w-full">
            <CustomSelect
              value={selectedClassId}
              onChange={(val) => onSelectClass(String(val))}
              options={classOptions}
              placeholder="Lọc theo lớp..."
              icon={<BookOpen size={14} className="text-sky-400" />}
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

      {/* Student Overview Banner */}
      {summary ? (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4">
            {/* Avatar Initials */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] shrink-0 border border-white/20">
              {summary.full_name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-white tracking-wide">
                  {summary.full_name}
                </h2>
                {summary.nickname && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    {summary.nickname}
                  </span>
                )}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border ${summary.tier_badge_bg} ${summary.tier_color}`}>
                  {summary.tier_label}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                {summary.grade && (
                  <div className="flex items-center gap-1">
                    <BookOpen size={12} className="text-slate-400" />
                    <span>{summary.grade}</span>
                  </div>
                )}
                {summary.school && (
                  <div className="flex items-center gap-1">
                    <School size={12} className="text-slate-400" />
                    <span>{summary.school}</span>
                  </div>
                )}
                {summary.enrolled_classes && (
                  <span className="text-slate-400">
                    Lớp: <strong className="text-slate-200">{summary.enrolled_classes}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-3">
            <div className="bg-[#121628] border border-[#232c49] rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                Tổng Buổi Học
              </span>
              <span className="text-base font-black text-white">
                {summary.total_sessions}
              </span>
            </div>
            <div className="bg-[#121628] border border-[#232c49] rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                Điểm Trung Bình
              </span>
              <span className="text-base font-black text-indigo-400">
                {summary.overall_avg !== null ? Math.trunc(summary.overall_avg * 10) / 10 : '-'}
              </span>
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
