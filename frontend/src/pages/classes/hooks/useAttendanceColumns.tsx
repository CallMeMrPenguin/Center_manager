import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { EnrolledStudent, AttendanceRecord } from '../types';
import { CheckScoreInput } from '../components/CheckScoreInput';
import { format1Dec, trunc1Dec } from '../../../utils';

interface UseAttendanceColumnsProps {
  attendanceRecords: AttendanceRecord[];
  enrolledStudents: EnrolledStudent[];
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
  onOpenStudentActionModal: (student: EnrolledStudent) => void;
}

export function useAttendanceColumns({
  attendanceRecords,
  enrolledStudents,
  onUpdateRecord,
  parseAndFormatScore,
  onOpenStudentActionModal,
}: UseAttendanceColumnsProps) {
  const colAverages = useMemo(() => {
    let sumC1 = 0, countC1 = 0;
    let sumC2 = 0, countC2 = 0;
    let sumHw1 = 0, countHw1 = 0;
    let sumHw2 = 0, countHw2 = 0;
    let sumMock = 0, countMock = 0;

    attendanceRecords.forEach((r) => {
      if (r.status === 'Vắng mặt') return;
      if (r.check_1 !== null && r.check_1 !== undefined && r.check_1 !== '') {
        const v = Number(r.check_1);
        if (!isNaN(v) && v >= 0) { sumC1 += v; countC1++; }
      }
      if (r.check_2 !== null && r.check_2 !== undefined && r.check_2 !== '') {
        const v = Number(r.check_2);
        if (!isNaN(v) && v >= 0) { sumC2 += v; countC2++; }
      }
      if (r.homework !== null && r.homework !== undefined && r.homework !== '') {
        const v = Number(r.homework);
        if (!isNaN(v) && v >= 0) { sumHw1 += v; countHw1++; }
      }
      if (r.homework_2 !== null && r.homework_2 !== undefined && r.homework_2 !== '') {
        const v = Number(r.homework_2);
        if (!isNaN(v) && v >= 0) { sumHw2 += v; countHw2++; }
      }
      if (r.mock_test !== null && r.mock_test !== undefined && r.mock_test !== '') {
        const v = Number(r.mock_test);
        if (!isNaN(v) && v >= 0) { sumMock += v; countMock++; }
      }
    });

    return {
      c1: countC1 > 0 ? trunc1Dec(sumC1 / countC1) : null,
      c2: countC2 > 0 ? trunc1Dec(sumC2 / countC2) : null,
      hw1: countHw1 > 0 ? trunc1Dec(sumHw1 / countHw1) : null,
      hw2: countHw2 > 0 ? trunc1Dec(sumHw2 / countHw2) : null,
      mock: countMock > 0 ? trunc1Dec(sumMock / countMock) : null,
    };
  }, [attendanceRecords]);

  const attendanceColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'stt',
        header: 'STT',
        size: 50,
        minSize: 45,
        maxSize: 55,
        meta: { headerText: 'STT', exportValue: (_: any, idx: number) => idx + 1 },
        enableSorting: false,
        cell: ({ row }) => <div className="text-center font-extrabold text-slate-700 dark:text-slate-300 text-sm sm:text-base">{row.index + 1}</div>,
      },
      {
        accessorKey: 'student_name',
        header: 'Họ tên',
        size: 150,
        minSize: 130,
        meta: { headerText: 'Họ tên', exportValue: (r: any) => r.student_name },
        cell: ({ row }) => (
          <div className="pr-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
              {row.original.student_name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Điểm Danh',
        size: 105,
        minSize: 95,
        maxSize: 115,
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
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border-0 shadow-2xs hover:shadow-xs whitespace-nowrap flex items-center justify-center ${
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
        size: 90,
        minSize: 85,
        maxSize: 100,
        header: () => (
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="font-extrabold text-xs sm:text-sm">Check 1</span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {colAverages.c1 !== null ? colAverages.c1 : '-'}
            </span>
          </div>
        ),
        meta: { headerText: 'Check 1', exportValue: (r: any) => Number(r.check_1) > 0 ? format1Dec(Number(r.check_1)) : '-' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CheckScoreInput
              rec={row.original}
              rowIndex={row.index}
              field="check_1"
              onUpdateRecord={onUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
            />
          </div>
        ),
      },
      {
        accessorKey: 'check_2',
        size: 90,
        minSize: 85,
        maxSize: 100,
        header: () => (
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="font-extrabold text-xs sm:text-sm">Check 2</span>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {colAverages.c2 !== null ? colAverages.c2 : '-'}
            </span>
          </div>
        ),
        meta: { headerText: 'Check 2', exportValue: (r: any) => Number(r.check_2) > 0 ? format1Dec(Number(r.check_2)) : '-' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CheckScoreInput
              rec={row.original}
              rowIndex={row.index}
              field="check_2"
              onUpdateRecord={onUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
            />
          </div>
        ),
      },
      {
        accessorKey: 'homework',
        size: 90,
        minSize: 85,
        maxSize: 100,
        header: () => (
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="font-extrabold text-xs sm:text-sm">BTVN 1</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {colAverages.hw1 !== null ? colAverages.hw1 : '-'}
            </span>
          </div>
        ),
        meta: { headerText: 'BTVN 1', exportValue: (r: any) => Number(r.homework) > 0 ? format1Dec(Number(r.homework)) : '-' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CheckScoreInput
              rec={row.original}
              rowIndex={row.index}
              field="homework"
              onUpdateRecord={onUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
            />
          </div>
        ),
      },
      {
        accessorKey: 'homework_2',
        size: 90,
        minSize: 85,
        maxSize: 100,
        header: () => (
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="font-extrabold text-xs sm:text-sm">BTVN 2</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {colAverages.hw2 !== null ? colAverages.hw2 : '-'}
            </span>
          </div>
        ),
        meta: { headerText: 'BTVN 2', exportValue: (r: any) => Number(r.homework_2) > 0 ? format1Dec(Number(r.homework_2)) : '-' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CheckScoreInput
              rec={row.original}
              rowIndex={row.index}
              field="homework_2"
              onUpdateRecord={onUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
            />
          </div>
        ),
      },
      {
        accessorKey: 'mock_test',
        size: 90,
        minSize: 85,
        maxSize: 100,
        header: () => (
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="font-extrabold text-xs sm:text-sm">Luyện Đề</span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {colAverages.mock !== null ? colAverages.mock : '-'}
            </span>
          </div>
        ),
        meta: { headerText: 'Luyện Đề', exportValue: (r: any) => Number(r.mock_test) > 0 ? format1Dec(Number(r.mock_test)) : '-' },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CheckScoreInput
              rec={row.original}
              rowIndex={row.index}
              field="mock_test"
              onUpdateRecord={onUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
            />
          </div>
        ),
      },
      {
        id: 'score_discrepancy',
        header: 'Độ Lệch',
        size: 85,
        minSize: 75,
        maxSize: 95,
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
        size: 60,
        minSize: 50,
        maxSize: 70,
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
    [enrolledStudents, onUpdateRecord, parseAndFormatScore, onOpenStudentActionModal, colAverages]
  );

  return { attendanceColumns, colAverages };
}
