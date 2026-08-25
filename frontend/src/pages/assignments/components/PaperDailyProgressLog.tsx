import React, { memo } from 'react';
import { AssignmentDailyLog } from '../types';

interface PaperDailyProgressLogProps {
  logs: AssignmentDailyLog[];
  studentName: string;
}

export const PaperDailyProgressLog: React.FC<PaperDailyProgressLogProps> = memo(({
  logs,
  studentName,
}) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4 space-y-3 my-2 text-slate-900 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Nhật Ký & Tiến Độ Làm Bài — {studentName}
          </h4>
        </div>
        <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200">
          Lộ trình {logs.length} buổi làm bài
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {logs.map((log, idx) => (
          <div key={idx} className="bg-white border border-slate-300 rounded-lg p-3 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 font-mono">
                {log.session || `Buổi ${idx + 1}`} {log.date ? `(${log.date})` : ''}
              </span>
              {log.score !== undefined && log.score !== null && (
                <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                  {log.score}/10.0 điểm
                </span>
              )}
            </div>
            {log.scope && (
              <p className="text-xs font-bold text-slate-800">
                {log.scope}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
              <span>Đã làm: <strong className="text-slate-900">{log.answered_count ?? '-'}</strong> câu</span>
              {log.correct_count !== undefined && (
                <span>Đúng: <strong className="text-emerald-700">{log.correct_count}</strong> câu</span>
              )}
            </div>
            {log.teacher_comment && (
              <div className="text-xs italic text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 mt-1">
                <strong>Nhận xét:</strong> {log.teacher_comment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
