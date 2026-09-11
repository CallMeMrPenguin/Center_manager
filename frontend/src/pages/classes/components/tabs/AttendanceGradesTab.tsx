import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../../types';
import { DataTable } from '../../../../components/DataTable';
import { CheckScoreInput } from '../CheckScoreInput';
import { SessionOverviewBanner } from './SessionOverviewBanner';
import { showToast } from '../../../../components/Toast';

interface AttendanceGradesTabProps {
  selectedClass: ClassItem;
  enrolledStudents: EnrolledStudent[];
  attendanceDate: string;
  attendanceRecords: AttendanceRecord[];
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
  onOpenStudentActionModal: (student: EnrolledStudent) => void;
  onExportExcel: () => void;
  onExportDocx: () => void;
}

export const AttendanceGradesTab: React.FC<AttendanceGradesTabProps> = ({
  selectedClass,
  enrolledStudents,
  attendanceDate,
  attendanceRecords,
  onUpdateRecord,
  parseAndFormatScore,
  onOpenStudentActionModal,
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

  const handleFilterStudentChip = (name: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(name);
      showToast(`Đã sao chép "${name}" để dán tìm kiếm`, 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. SESSION OVERVIEW BANNER (NEW REQUIREMENT) */}
      <SessionOverviewBanner
        attendanceRecords={attendanceRecords}
        attendanceDate={attendanceDate}
        onFilterStudent={handleFilterStudentChip}
      />

      {/* 2. UNIFIED ATTENDANCE & GRADES DATATABLE */}
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
