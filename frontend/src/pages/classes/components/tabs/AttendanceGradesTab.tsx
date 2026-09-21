import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { ClassItem, EnrolledStudent, AttendanceRecord } from '../../types';
import { DataTable } from '../../../../components/DataTable';
import { CheckScoreInput } from '../CheckScoreInput';
import { SessionOverviewBanner } from './SessionOverviewBanner';
import { showToast } from '../../../../components/Toast';
import { format1Dec } from '../../../../utils';

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
        meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
        enableSorting: false,
        cell: ({ row }) => <div className="text-center font-extrabold text-slate-700 dark:text-slate-300 text-sm sm:text-base">{row.index + 1}</div>,
      },
      {
        accessorKey: 'student_name',
        header: 'Họ và Tên Học Sinh',
        meta: { headerText: 'Họ và Tên Học Sinh', exportValue: (r: any) => r.student_name },
        cell: ({ row }) => (
          <span className="font-extrabold text-slate-900 dark:text-white text-base block truncate">
            {row.original.student_name}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Điểm Danh',
        meta: { headerText: 'Điểm Danh', exportValue: (r: any) => r.status || 'Có mặt' },
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
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAbsent ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <span>{rec.status || 'Có mặt'}</span>
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'check_1',
        header: 'Check 1',
        meta: { headerText: 'Check 1', exportValue: (r: any) => Number(r.check_1) > 0 ? format1Dec(Number(r.check_1)) : '-' },
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
        meta: { headerText: 'Check 2', exportValue: (r: any) => Number(r.check_2) > 0 ? format1Dec(Number(r.check_2)) : '-' },
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
        meta: { headerText: 'BTVN 1', exportValue: (r: any) => Number(r.homework) > 0 ? format1Dec(Number(r.homework)) : '-' },
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
        meta: { headerText: 'BTVN 2', exportValue: (r: any) => Number(r.homework_2) > 0 ? format1Dec(Number(r.homework_2)) : '-' },
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
        meta: { headerText: 'Luyện Đề', exportValue: (r: any) => Number(r.mock_test) > 0 ? format1Dec(Number(r.mock_test)) : '-' },
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
        id: 'score_discrepancy',
        header: 'Độ Lệch',
        meta: {
          headerText: 'Độ Lệch',
          exportValue: (rec: any) => {
            if (rec.status === 'Vắng mặt') return '-';
            const hw = Number(rec.homework);
            const c1 = Number(rec.check_1);
            const c2 = Number(rec.check_2);
            if (!hw || hw <= 0) return '-';
            const validC1 = !isNaN(c1) && c1 > 0;
            const validC2 = !isNaN(c2) && c2 > 0;
            if (!validC1 && !validC2) return '-';
            const checkAvg = validC1 && validC2 ? (c1 + c2) / 2 : validC1 ? c1 : c2;
            const diff = Math.abs(hw - checkAvg);
            return diff > 0 ? format1Dec(diff) : '-';
          },
        },
        accessorFn: (rec) => {
          if (rec.status === 'Vắng mặt') return -999;
          const hw =
            rec.homework !== null && rec.homework !== undefined && rec.homework !== ''
              ? Number(rec.homework)
              : null;
          if (hw === null || isNaN(hw) || hw <= 0) return -999;

          const c1 =
            rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== ''
              ? Number(rec.check_1)
              : null;
          const c2 =
            rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== ''
              ? Number(rec.check_2)
              : null;

          const validC1 = c1 !== null && !isNaN(c1);
          const validC2 = c2 !== null && !isNaN(c2);

          if (!validC1 && !validC2) return -999;

          const checkAvg = validC1 && validC2 ? (c1! + c2!) / 2 : validC1 ? c1! : c2!;
          const rawDiff = hw - checkAvg;
          const diff = Math.abs(rawDiff);
          return diff > 0 ? diff : -999;
        },
        cell: ({ getValue }) => {
          const val = getValue<number>();
          if (val === undefined || val === null || val <= 0) {
            return (
              <div className="flex items-center justify-center">
                <span className="text-slate-600 font-bold text-xs">-</span>
              </div>
            );
          }
          const isLarge = val >= 1.5;
          return (
            <div className="flex items-center justify-center">
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-black transition ${
                  isLarge
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 text-slate-300 border border-white/10'
                }`}
                title={`Độ lệch tuyệt đối: |BTVN - TB Check| = ${format1Dec(val)} điểm`}
              >
                {format1Dec(val)}
              </span>
            </div>
          );
        },
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

      {/* 2. UNIFIED ATTENDANCE & GRADES DATATABLE (Client-side Excel export respects toggled visible columns) */}
      <DataTable
        tableId="classes-attendance-table"
        data={attendanceRecords}
        columns={attendanceColumns}
        pageSize={20}
        exportFilename={`diem_danh_${selectedClass?.class_name || ''}_${attendanceDate}`}
        onExportDocx={onExportDocx}
      />
    </div>
  );
};
