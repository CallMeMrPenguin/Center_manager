import React from 'react';
import { AttendanceRecord, EnrolledStudent } from '../../types';
import { CheckScoreInput } from '../CheckScoreInput';

interface MobileAttendanceMatrixProps {
  attendanceRecords: AttendanceRecord[];
  enrolledStudents: EnrolledStudent[];
  onUpdateRecord: (studentId: number, field: string, value: any, immediate?: boolean) => void;
  parseAndFormatScore: (val: any) => string;
  onOpenStudentActionModal: (student: EnrolledStudent) => void;
}

interface MetricRowConfig {
  id: 'status' | 'check_1' | 'check_2' | 'homework' | 'homework_2' | 'mock_test';
  label: string;
  colorClass: string;
}

const METRIC_ROWS: MetricRowConfig[] = [
  { id: 'status', label: 'Điểm Danh', colorClass: 'text-slate-800 dark:text-slate-200' },
  { id: 'check_1', label: 'Check 1', colorClass: 'text-blue-600 dark:text-blue-400' },
  { id: 'check_2', label: 'Check 2', colorClass: 'text-purple-600 dark:text-purple-400' },
  { id: 'homework', label: 'BTVN 1', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'homework_2', label: 'BTVN 2', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'mock_test', label: 'Luyện Đề', colorClass: 'text-amber-600 dark:text-amber-400' },
];

export const MobileAttendanceMatrix: React.FC<MobileAttendanceMatrixProps> = ({
  attendanceRecords,
  enrolledStudents,
  onUpdateRecord,
  parseAndFormatScore,
  onOpenStudentActionModal,
}) => {
  return (
    <div
      data-mobile-matrix="true"
      className="bg-white dark:bg-[#0c0f1e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-md"
    >
      {/* Transposed Matrix: X-Axis = Student Names, Y-Axis = Metrics */}
      <div className="overflow-x-auto overflow-y-visible touch-pan-x">
        <table className="border-collapse text-xs w-max min-w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14192b]">
              {/* Sticky Corner Axis Indicator */}
              <th className="sticky left-0 z-30 bg-slate-100 dark:bg-[#14192b] p-3 text-left font-black text-slate-700 dark:text-slate-200 w-24 min-w-[95px] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                Học Sinh
              </th>

              {/* Clean Student Names on the X-Axis */}
              {attendanceRecords.map((rec) => {
                const enrolled = enrolledStudents.find((s) => s.id === rec.student_id);
                return (
                  <th
                    key={rec.student_id}
                    onDoubleClick={() =>
                      onOpenStudentActionModal(
                        enrolled || { id: rec.student_id, full_name: rec.student_name }
                      )
                    }
                    className="p-3 text-center min-w-[110px] max-w-[130px] border-l border-slate-200 dark:border-white/10 font-extrabold text-slate-900 dark:text-white cursor-pointer select-none"
                    title="Nhấp đúp để mở thông tin học sinh"
                  >
                    <span className="truncate block" title={rec.student_name}>
                      {rec.student_name}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-semibold">
            {METRIC_ROWS.map((metric) => (
              <tr key={metric.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                {/* Metric Label on the Y-Axis (Sticky Left) */}
                <td className="sticky left-0 z-20 bg-white dark:bg-[#0c0f1e] p-3 font-black text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-white/10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                  <span className={`text-xs ${metric.colorClass}`}>{metric.label}</span>
                </td>

                {/* Values for each Student Column */}
                {attendanceRecords.map((rec, rIdx) => {
                  const isAbsent = rec.status === 'Vắng mặt';

                  // 1. Attendance Status Row
                  if (metric.id === 'status') {
                    return (
                      <td key={rec.student_id} className="p-2 text-center border-l border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = isAbsent ? 'Có mặt' : 'Vắng mặt';
                            onUpdateRecord(rec.student_id, 'status', newStatus);
                          }}
                          className={`w-full py-1.5 px-2 rounded-xl font-black text-xs transition cursor-pointer border-0 shadow-2xs ${
                            isAbsent
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {rec.status || 'Có mặt'}
                        </button>
                      </td>
                    );
                  }

                  // 2. Score Rows (check_1, check_2, homework, homework_2, mock_test)
                  return (
                    <td key={rec.student_id} className="p-2 text-center border-l border-slate-200 dark:border-white/10">
                      <div className="flex justify-center">
                        <CheckScoreInput
                          rec={rec}
                          rowIndex={rIdx}
                          field={metric.id}
                          onUpdateRecord={onUpdateRecord}
                          parseAndFormatScore={parseAndFormatScore}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
