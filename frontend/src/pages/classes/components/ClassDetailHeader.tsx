import React from 'react';
import {
  ChevronLeft,
  Edit3,
  Trash2,
  UserPlus,
  BookOpen,
  User,
  MapPin,
  FileText,
} from 'lucide-react';
import { ClassItem } from '../types';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { Button } from '../../../components/button';

interface ClassDetailHeaderProps {
  selectedClass: ClassItem;
  activeSubTab: 'grades' | 'seating' | 'relationships';
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
  attendanceDate,
  onDateChange,
  selectedClassWeeklyDays,
  onBack,
  onOpenEditClass,
  onDeleteAttendanceDate,
  onOpenEnrollModal,
}) => {
  return (
    <div className="bg-white dark:bg-[#0c0f1e] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-wrap items-center justify-between gap-4">
      {/* LEFT: BACK BUTTON & CLASS INFO */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="white"
          size="icon-sm"
          type="button"
          onClick={onBack}
          className="shrink-0"
          title="Quay lại danh sách lớp"
        >
          <ChevronLeft size={18} />
        </Button>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-wide truncate">
              {selectedClass.class_name}
            </h2>

            {selectedClass.subject && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 rounded-lg border-0 shadow-2xs flex items-center gap-1 shrink-0">
                <BookOpen size={11} />
                <span>{selectedClass.subject}</span>
              </span>
            )}

            {/* Single Pen Edit button per Rule 16 */}
            <button
              type="button"
              onClick={() => onOpenEditClass(selectedClass)}
              className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border-0 shadow-xs transition cursor-pointer shrink-0"
              title="Sửa thông tin lớp học"
            >
              <Edit3 size={13} />
            </button>
          </div>

          {/* Teacher & Room metadata row using structured tags (No pipes per Rule 6) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <User size={12} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>GV: {selectedClass.teacher_name || 'Chưa phân công'}</span>
            </span>

            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <MapPin size={12} className="text-amber-500 dark:text-amber-400 shrink-0" />
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

      {/* RIGHT: ACTIONS (DATE PICKER & ENROLL BUTTON) */}
      <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
        {activeSubTab === 'grades' && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CustomDatePicker
              value={attendanceDate}
              onChange={onDateChange}
              highlightDaysOfWeek={selectedClassWeeklyDays}
              className="w-36 sm:w-44"
            />
            {onDeleteAttendanceDate && (
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={onDeleteAttendanceDate}
                leftIcon={<Trash2 size={13} className="shrink-0" />}
                className="group"
                title={`Xóa buổi học và điểm danh ngày ${attendanceDate}`}
              >
                <span className="max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden block">
                  Xóa Buổi Này
                </span>
              </Button>
            )}
          </div>
        )}

        {onOpenEnrollModal && (
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={onOpenEnrollModal}
            leftIcon={<UserPlus size={14} className="shrink-0" />}
            className="group shrink-0"
            title="Ghi Danh Học Sinh Vào Lớp"
          >
            <span>Ghi Danh</span>
          </Button>
        )}
      </div>
    </div>
  );
};
