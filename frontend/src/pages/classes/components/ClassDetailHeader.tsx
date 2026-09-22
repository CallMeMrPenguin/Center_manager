import React from 'react';
import {
  ChevronLeft,
  Edit3,
  Calendar,
  Trash2,
  UserPlus,
  BookOpen,
  User,
  MapPin,
  FileText,
} from 'lucide-react';
import { ClassItem } from '../types';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CustomDatePicker } from '../../../components/CustomDatePicker';

interface ClassDetailHeaderProps {
  selectedClass: ClassItem;
  activeSubTab: 'grades' | 'seating' | 'relationships';
  onChangeSubTab: (tab: 'grades' | 'seating' | 'relationships') => void;
  enrolledCount: number;
  attendanceDate: string;
  onDateChange: (date: string) => void;
  selectedClassWeeklyDays: number[];
  onBack: () => void;
  onOpenEditClass: (cls: ClassItem) => void;
  onDeleteAttendanceDate?: () => void;
  onOpenEnrollModal?: () => void;
}

export const ClassDetailHeader: React.FC<ClassDetailHeaderProps> = ({
  selectedClass,
  activeSubTab,
  onChangeSubTab,
  enrolledCount,
  attendanceDate,
  onDateChange,
  selectedClassWeeklyDays,
  onBack,
  onOpenEditClass,
  onDeleteAttendanceDate,
  onOpenEnrollModal,
}) => {
  return (
    <div className="bg-white dark:bg-[#0c0f1e] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4">
      {/* ROW 1: BACK + CLASS IDENTITY + BADGES + SUB-TAB SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* LEFT: BACK BUTTON & CLASS INFO */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl btn-neutral text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer border-0 shadow-xs shrink-0"
            title="Quay lại danh sách lớp"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-wide">
                {selectedClass.class_name}
              </h2>

              {selectedClass.subject && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 rounded-lg border-0 shadow-2xs flex items-center gap-1">
                  <BookOpen size={11} />
                  <span>{selectedClass.subject}</span>
                </span>
              )}

              {/* Single Pen Edit button per Rule 16 */}
              <button
                type="button"
                onClick={() => onOpenEditClass(selectedClass)}
                className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border-0 shadow-xs transition cursor-pointer"
                title="Sửa thông tin lớp học"
              >
                <Edit3 size={13} />
              </button>
            </div>

            {/* Teacher & Room metadata row using structured tags (No pipes per Rule 6) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <User size={12} className="text-emerald-500 dark:text-emerald-400" />
                <span>GV: {selectedClass.teacher_name || 'Chưa phân công'}</span>
              </span>

              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <MapPin size={12} className="text-amber-500 dark:text-amber-400" />
                <span>Phòng: {selectedClass.room || 'Chưa xếp phòng'}</span>
              </span>

              {selectedClass.notes && (
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 italic max-w-xs truncate" title={selectedClass.notes}>
                  <FileText size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{selectedClass.notes}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: SUB-TAB SEGMENTED CONTROL */}
        <SegmentedControl<'grades' | 'seating' | 'relationships'>
          value={activeSubTab}
          onChange={onChangeSubTab}
          options={[
            { value: 'grades', label: 'Điểm Danh & Điểm', badge: enrolledCount },
            { value: 'seating', label: 'Sơ Đồ Lớp' },
            { value: 'relationships', label: 'Nhóm Bạn & Xung Đột' },
          ]}
          size="md"
        />
      </div>

      {/* ROW 2: INTEGRATED ACTION TOOLBAR (DATE PICKER & ACTIONS) */}
      <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* LEFT: DATE PICKER & DELETE DATE BUTTON */}
        <div className="flex items-center gap-2">
          <CustomDatePicker
            value={attendanceDate}
            onChange={onDateChange}
            highlightDaysOfWeek={selectedClassWeeklyDays}
            className="w-44"
          />
          {onDeleteAttendanceDate && (
            <button
              type="button"
              onClick={onDeleteAttendanceDate}
              className="group flex items-center gap-0 hover:gap-1.5 bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border-0 shadow-xs hover:shadow-sm px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
              title={`Xóa buổi học và điểm danh ngày ${attendanceDate}`}
            >
              <Trash2 size={13} className="shrink-0" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
                Xóa Buổi Này
              </span>
            </button>
          )}
        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {onOpenEnrollModal && (
            <button
              type="button"
              onClick={onOpenEnrollModal}
              className="group flex items-center gap-0 hover:gap-1.5 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 border-0 shadow-xs hover:shadow-sm px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
              title="Ghi Danh Học Sinh Vào Lớp"
            >
              <UserPlus size={14} className="shrink-0" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
                Ghi Danh Học Sinh
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
