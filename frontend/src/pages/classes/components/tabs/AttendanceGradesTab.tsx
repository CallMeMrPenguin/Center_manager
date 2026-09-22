import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3, Layers, Save } from 'lucide-react';
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
  onOpenTestConfigModal?: () => void;
  onSaveAttendance?: () => void;
  savingAttendance?: boolean;
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
  onOpenTestConfigModal,
  onSaveAttendance,
  savingAttendance = false,
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
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border-0 shadow-2xs hover:shadow-xs flex items-center justify-center ${
                  isAbsent
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
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
                <span className="text-slate-400 dark:text-slate-500 font-bold font-mono text-xs">-</span>
              </div>
            );
          }
          const badgeClass =
            val >= 2.5
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              : val >= 1.5
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              : 'bg-slate-200 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200';

          return (
            <div className="flex items-center justify-center">
              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border-0 shadow-2xs transition ${badgeClass}`}
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
                className="p-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border-0 shadow-2xs hover:shadow-xs transition cursor-pointer"
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
      <div className="bg-white dark:bg-[#0d1018] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <DataTable
          tableId="classes-attendance-table"
          data={attendanceRecords}
          columns={attendanceColumns}
          pageSize={20}
          exportFilename={`diem_danh_${selectedClass?.class_name || ''}_${attendanceDate}`}
          onExportDocx={onExportDocx}
          toolbarRight={
            <div className="flex items-center gap-2">
              {onOpenTestConfigModal && (
                <button
                  type="button"
                  onClick={onOpenTestConfigModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 dark:bg-[#1a2238] dark:hover:bg-[#202b48] text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-white border-0 text-xs font-bold transition cursor-pointer shadow-xs hover:shadow-sm"
                  title="Cấu Hình Bài Kiểm Tra (Check 1 & Check 2)"
                >
                  <Layers size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="hidden sm:inline">Cấu Hình Kiểm Tra</span>
                </button>
              )}

              {onSaveAttendance && (
                <button
                  type="button"
                  onClick={onSaveAttendance}
                  disabled={savingAttendance}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs hover:shadow-sm transition cursor-pointer border-0 disabled:opacity-50"
                  title="Lưu Bảng Điểm Danh & Điểm Số"
                >
                  <Save size={13} className="shrink-0" />
                  <span>{savingAttendance ? 'Đang lưu...' : 'Lưu Bảng Điểm'}</span>
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};
