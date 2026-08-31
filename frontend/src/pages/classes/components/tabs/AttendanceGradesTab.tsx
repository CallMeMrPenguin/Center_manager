import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, Layers, UserPlus, Save, Edit3, Trash2 } from 'lucide-react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../../types';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { DataTable } from '../../../../components/DataTable';
import { CheckScoreInput } from '../CheckScoreInput';

interface AttendanceGradesTabProps {
  selectedClass: ClassItem;
  enrolledStudents: EnrolledStudent[];
  attendanceDate: string;
  attendanceRecords: AttendanceRecord[];
  savingAttendance: boolean;
  selectedClassWeeklyDays: number[];
  onDateChange: (date: string) => void;
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
  onSaveAttendance: () => void;
  onOpenTestConfigModal: () => void;
  onOpenEnrollModal: () => void;
  onOpenStudentActionModal: (student: EnrolledStudent) => void;
  onOpenEditClass: (cls: ClassItem) => void;
  onDeleteAttendanceDate?: () => void;
  onExportExcel: () => void;
  onExportDocx: () => void;
}

export const AttendanceGradesTab: React.FC<AttendanceGradesTabProps> = ({
  selectedClass,
  enrolledStudents,
  attendanceDate,
  attendanceRecords,
  savingAttendance,
  selectedClassWeeklyDays,
  onDateChange,
  onUpdateRecord,
  parseAndFormatScore,
  onSaveAttendance,
  onOpenTestConfigModal,
  onOpenEnrollModal,
  onOpenStudentActionModal,
  onOpenEditClass,
  onDeleteAttendanceDate,
  onExportExcel,
  onExportDocx,
}) => {
  const attendanceColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'stt',
        header: 'STT',
        enableSorting: false,
        cell: ({ row }) => <span className="font-bold text-slate-400">{row.index + 1}</span>,
      },
      {
        accessorKey: 'student_name',
        header: 'Họ và Tên Học Sinh',
        cell: ({ row }) => (
          <span className="font-extrabold text-white text-base block truncate">
            {row.original.student_name}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Điểm Danh',
        cell: ({ row }) => {
          const rec = row.original;
          const isAbsent = rec.status === 'Vắng mặt';
          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  const newStatus = isAbsent ? 'Có mặt' : 'Vắng mặt';
                  onUpdateRecord(rec.student_id, 'status', newStatus);
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                  isAbsent
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAbsent ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span>{rec.status || 'Có mặt'}</span>
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'check_1',
        header: 'Check 1',
        cell: ({ row }) => (
          <CheckScoreInput
            rec={row.original}
            rowIndex={row.index}
            field="check_1"
            onUpdateRecord={onUpdateRecord}
            parseAndFormatScore={parseAndFormatScore}
          />
        ),
      },
      {
        accessorKey: 'check_2',
        header: 'Check 2',
        cell: ({ row }) => (
          <CheckScoreInput
            rec={row.original}
            rowIndex={row.index}
            field="check_2"
            onUpdateRecord={onUpdateRecord}
            parseAndFormatScore={parseAndFormatScore}
          />
        ),
      },
      {
        accessorKey: 'homework',
        header: 'BTVN 1',
        cell: ({ row }) => (
          <CheckScoreInput
            rec={row.original}
            rowIndex={row.index}
            field="homework"
            onUpdateRecord={onUpdateRecord}
            parseAndFormatScore={parseAndFormatScore}
          />
        ),
      },
      {
        accessorKey: 'homework_2',
        header: 'BTVN 2',
        cell: ({ row }) => (
          <CheckScoreInput
            rec={row.original}
            rowIndex={row.index}
            field="homework_2"
            onUpdateRecord={onUpdateRecord}
            parseAndFormatScore={parseAndFormatScore}
          />
        ),
      },
      {
        accessorKey: 'mock_test',
        header: 'Luyện Đề',
        cell: ({ row }) => (
          <CheckScoreInput
            rec={row.original}
            rowIndex={row.index}
            field="mock_test"
            onUpdateRecord={onUpdateRecord}
            parseAndFormatScore={parseAndFormatScore}
          />
        ),
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const rec = row.original;
          const enrolledInfo = enrolledStudents.find((s) => s.id === rec.student_id);
          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  onOpenStudentActionModal(
                    enrolledInfo || { id: rec.student_id, full_name: rec.student_name }
                  );
                }}
                className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                title="Tùy chọn học sinh"
              >
                <Edit3 size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [enrolledStudents, onUpdateRecord, parseAndFormatScore, onOpenStudentActionModal]
  );

  return (
    <div className="space-y-4">
      {/* CLASS SUMMARY CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0d1018] border border-white/10 p-4 rounded-2xl">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
            Giáo Viên & Phòng
          </span>
          <span className="text-sm font-black text-white block">
            {selectedClass.teacher_name || 'Chưa phân công'}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Phòng: {selectedClass.room || 'Chưa xếp phòng'}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
            Khối & Môn Học
          </span>
          <span className="text-sm font-black text-white block">
            {selectedClass.grade || 'Khác'}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Môn: {selectedClass.subject || 'N/A'}
          </span>
        </div>
        <div className="space-y-1 col-span-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
              Ghi Chú Lớp Học
            </span>
            <span className="text-xs text-slate-300 block italic max-w-sm truncate">
              {selectedClass.notes || 'Không có ghi chú'}
            </span>
          </div>
          <button
            onClick={() => onOpenEditClass(selectedClass)}
            className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
            title="Sửa Thông Tin"
          >
            <Edit3 size={13} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Sửa Thông Tin
            </span>
          </button>
        </div>
      </div>

      {/* ACTION TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center bg-[#0d1018] border border-white/10 p-4 rounded-2xl gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar size={15} className="text-indigo-400" />
            <span>Ngày học:</span>
          </span>
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
              className="group flex items-center gap-0 hover:gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
              title={`Xóa buổi học và điểm danh ngày ${attendanceDate} (phòng trường hợp chọn sai ngày)`}
            >
              <Trash2 size={13} className="shrink-0" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
                Xóa Buổi Này
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTestConfigModal}
            className="group flex items-center gap-0 hover:gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
            title="Cấu Hình Bài Kiểm Tra (Check 1 & Check 2)"
          >
            <Layers size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[180px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Cấu Hình Bài Kiểm Tra
            </span>
          </button>

          <button
            onClick={onOpenEnrollModal}
            className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer"
            title="Ghi Danh Học Sinh"
          >
            <UserPlus size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Ghi Danh Học Sinh
            </span>
          </button>

          <button
            onClick={onSaveAttendance}
            disabled={savingAttendance}
            className="group flex items-center gap-0 hover:gap-1.5 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-[0_4px_12px_rgba(92,54,245,0.4)] transition-all duration-300 cursor-pointer border border-white/20"
            title="Lưu Bảng Điểm"
          >
            <Save size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              {savingAttendance ? 'Đang lưu...' : 'Lưu Bảng Điểm'}
            </span>
          </button>
        </div>
      </div>

      {/* UNIFIED ATTENDANCE & GRADES DATATABLE */}
      <DataTable
        tableId="classes-attendance-table"
        data={attendanceRecords}
        columns={attendanceColumns}
        pageSize={20}
        exportFilename={`diem_danh_${selectedClass?.class_name || ''}_${attendanceDate}`}
        onExportExcel={onExportExcel}
        onExportDocx={onExportDocx}
      />
    </div>
  );
};
