import React, { useState, useMemo } from 'react';
import { Search, Edit3 } from 'lucide-react';
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
  id: string;
  label: string;
  subLabel?: string;
  colorClass: string;
}

const METRIC_ROWS: MetricRowConfig[] = [
  { id: 'status', label: 'Điểm Danh', colorClass: 'text-slate-800 dark:text-slate-200' },
  { id: 'check_1', label: 'Check 1', subLabel: 'Từ Vựng', colorClass: 'text-blue-600 dark:text-blue-400' },
  { id: 'check_2', label: 'Check 2', subLabel: 'Ngữ Pháp', colorClass: 'text-purple-600 dark:text-purple-400' },
  { id: 'homework', label: 'BTVN 1', subLabel: 'Bài tập', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'homework_2', label: 'BTVN 2', subLabel: 'Bài tập', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'mock_test', label: 'Luyện Đề', subLabel: 'Đề thi', colorClass: 'text-amber-600 dark:text-amber-400' },
  { id: 'notes', label: 'Ghi Chú', colorClass: 'text-slate-600 dark:text-slate-400' },
  { id: 'actions', label: 'Thao Tác', colorClass: 'text-slate-600 dark:text-slate-400' },
];

export const MobileAttendanceMatrix: React.FC<MobileAttendanceMatrixProps> = ({
  attendanceRecords,
  enrolledStudents,
  onUpdateRecord,
  parseAndFormatScore,
  onOpenStudentActionModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return attendanceRecords;
    const q = searchTerm.trim().toLowerCase();
    return attendanceRecords.filter((r) =>
      (r.student_name || '').toLowerCase().includes(q)
    );
  }, [attendanceRecords, searchTerm]);

  return (
    <div className="bg-white dark:bg-[#0c0f1e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-md">
      {/* Search Header for Mobile */}
      <div className="p-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#121626]">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#080b14] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
          {filteredRecords.length}/{attendanceRecords.length} HS
        </span>
      </div>

      {/* Transposed Matrix: X-Axis = Student Names, Y-Axis = Metrics */}
      <div className="overflow-x-auto overflow-y-visible touch-pan-x">
        <table className="border-collapse text-xs w-max min-w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14192b]">
              {/* Sticky Corner Axis Indicator */}
              <th className="sticky left-0 z-30 bg-slate-100 dark:bg-[#14192b] p-3 text-left font-black text-slate-700 dark:text-slate-200 w-28 min-w-[110px] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                <span className="text-[10px] uppercase tracking-wider block text-slate-400 dark:text-slate-500">
                  Chỉ Số (Y)
                </span>
                <span>Học Sinh (X)</span>
              </th>

              {/* Student Names on the X-Axis */}
              {filteredRecords.map((rec, idx) => {
                const enrolled = enrolledStudents.find((s) => s.id === rec.student_id);
                return (
                  <th
                    key={rec.student_id}
                    className="p-3 text-center min-w-[130px] max-w-[150px] border-l border-slate-200 dark:border-white/10 font-black text-slate-900 dark:text-white align-top"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-xs truncate max-w-[125px] block" title={rec.student_name}>
                        {rec.student_name}
                      </span>
                      {enrolled && (
                        <button
                          type="button"
                          onClick={() => onOpenStudentActionModal(enrolled)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                          title="Hồ sơ học sinh"
                        >
                          <Edit3 size={11} />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {METRIC_ROWS.map((metric) => (
              <tr key={metric.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                {/* Metric Label on the Y-Axis (Sticky Left) */}
                <td className="sticky left-0 z-20 bg-white dark:bg-[#0c0f1e] p-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-white/10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                  <div className="flex flex-col">
                    <span className={`text-xs font-black ${metric.colorClass}`}>{metric.label}</span>
                    {metric.subLabel && (
                      <span className="text-[10px] text-slate-400 font-normal">{metric.subLabel}</span>
                    )}
                  </div>
                </td>

                {/* Values for each Student Column */}
                {filteredRecords.map((rec, rIdx) => {
                  const isAbsent = rec.status === 'Vắng mặt';

                  // 1. Attendance Status Row
                  if (metric.id === 'status') {
                    return (
                      <td key={rec.student_id} className="p-2.5 text-center border-l border-slate-200 dark:border-white/10">
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
                  if (
                    metric.id === 'check_1' ||
                    metric.id === 'check_2' ||
                    metric.id === 'homework' ||
                    metric.id === 'homework_2' ||
                    metric.id === 'mock_test'
                  ) {
                    return (
                      <td key={rec.student_id} className="p-2 text-center border-l border-slate-200 dark:border-white/10">
                        <div className="flex justify-center">
                          <CheckScoreInput
                            rec={rec}
                            rowIndex={rIdx}
                            field={metric.id as any}
                            onUpdateRecord={onUpdateRecord}
                            parseAndFormatScore={parseAndFormatScore}
                          />
                        </div>
                      </td>
                    );
                  }

                  // 3. Notes Row
                  if (metric.id === 'notes') {
                    return (
                      <td key={rec.student_id} className="p-2 border-l border-slate-200 dark:border-white/10">
                        <input
                          type="text"
                          value={rec.notes || ''}
                          onChange={(e) => onUpdateRecord(rec.student_id, 'notes', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full bg-slate-50 dark:bg-[#080b14] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                      </td>
                    );
                  }

                  // 4. Actions Row
                  const enrolled = enrolledStudents.find((s) => s.id === rec.student_id);
                  return (
                    <td key={rec.student_id} className="p-2 text-center border-l border-slate-200 dark:border-white/10">
                      {enrolled ? (
                        <button
                          type="button"
                          onClick={() => onOpenStudentActionModal(enrolled)}
                          className="p-1.5 rounded-lg btn-neutral text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                          title="Chỉnh sửa thông tin học sinh"
                        >
                          <Edit3 size={13} />
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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
