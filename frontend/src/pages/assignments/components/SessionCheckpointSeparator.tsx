import React, { memo } from 'react';
import { AssignmentDailyLog } from '../types';

interface SessionCheckpointSeparatorProps {
  log: AssignmentDailyLog;
  sessionIndex: number;
}

export const SessionCheckpointSeparator: React.FC<SessionCheckpointSeparatorProps> = memo(({
  log,
  sessionIndex,
}) => {
  return (
    <div className="my-6 border-2 border-indigo-300 bg-indigo-50/80 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-xs">
            {log.session || `Buổi ${sessionIndex + 1}`}
          </span>
          <h3 className="text-sm font-black text-indigo-950">
            {log.scope || `Phần bài tập ${sessionIndex + 1}`}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
          {log.date && (
            <span className="text-slate-600 font-mono">
              Ngày nộp: <strong className="text-indigo-950 font-bold">{log.date}</strong>
            </span>
          )}
          {log.score !== undefined && log.score !== null && (
            <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-black font-mono shadow-xs">
              Điểm: {log.score}/10.0 đ
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 font-medium pt-0.5">
        <div className="flex items-center gap-4">
          <span>
            Đã làm: <strong className="text-indigo-950 font-bold">{log.answered_count ?? '-'}</strong> câu
          </span>
          {log.correct_count !== undefined && (
            <span>
              Đúng: <strong className="text-emerald-700 font-bold">{log.correct_count}</strong> câu
            </span>
          )}
        </div>
        {log.teacher_comment && (
          <div className="italic text-indigo-950 bg-white border border-indigo-200/90 rounded-xl px-3.5 py-2 w-full text-xs shadow-2xs leading-relaxed">
            <strong className="text-indigo-700 not-italic font-bold">Nhận xét giáo viên:</strong> {log.teacher_comment}
          </div>
        )}
      </div>
    </div>
  );
});

SessionCheckpointSeparator.displayName = 'SessionCheckpointSeparator';
