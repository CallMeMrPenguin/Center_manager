import React from 'react';
import { AssignmentDailyLog } from '../types';

interface DailyProgressTimelineProps {
  logs: AssignmentDailyLog[];
  studentName: string;
}

export const DailyProgressTimeline: React.FC<DailyProgressTimelineProps> = ({
  logs,
  studentName,
}) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-[#0e1222] border border-[#212c4b] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
          Nhật Ký Chấm Điểm & Tiến Độ Theo Ngày — {studentName}
        </h4>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          Lộ trình {logs.length} buổi làm bài
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className="bg-[#13192e] border border-[#243154] rounded-xl p-3.5 space-y-2 hover:border-indigo-500/50 transition"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-indigo-300 font-mono">
                {log.session || `Buổi ${idx + 1}`}
              </span>
              {log.score !== undefined && log.score !== null && (
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {log.score}/10.0 điểm
                </span>
              )}
            </div>

            {log.scope && (
              <p className="text-xs font-bold text-slate-200">
                {log.scope}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
              <span>Đã làm: <strong className="text-slate-200">{log.answered_count ?? '-'}</strong> câu</span>
              {log.correct_count !== undefined && (
                <span>Đúng: <strong className="text-emerald-400">{log.correct_count}</strong> câu</span>
              )}
            </div>

            {log.teacher_comment && (
              <p className="text-xs italic text-slate-300 pt-1 border-t border-white/5 bg-[#0d1222]/60 p-2 rounded-lg leading-relaxed">
                Nhận xét: {log.teacher_comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
