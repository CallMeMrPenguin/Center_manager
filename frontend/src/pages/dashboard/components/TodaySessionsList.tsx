import React from 'react';
import { Clock, ArrowRight, CheckCircle2, CheckCircle, AlertCircle } from 'lucide-react';
import { TodaySessionItem } from '../types';

interface TodaySessionsListProps {
  sessions: TodaySessionItem[];
  onNavigate: (tab: string, extraData?: { classId?: number }) => void;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export const TodaySessionsList: React.FC<TodaySessionsListProps> = ({ sessions, onNavigate }) => {
  const getSessionTiming = (startTime: string, duration: number) => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startMin = timeToMin(startTime);
    const endMin = startMin + duration;

    if (nowMin >= startMin && nowMin <= endMin) {
      return { text: 'Đang diễn ra', badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' };
    }
    if (nowMin < startMin) {
      const diff = startMin - nowMin;
      const text = diff > 90 ? `Bắt đầu lúc ${startTime}` : `Còn ${diff} phút`;
      return { text, badgeCls: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30' };
    }
    return { text: 'Đã kết thúc', badgeCls: 'bg-slate-200 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30' };
  };

  return (
    <div className="bg-white dark:bg-[#0e1322] border border-slate-200 dark:border-[#1e2742] rounded-2xl p-5 flex flex-col shadow-sm dark:shadow-none transition-colors duration-200">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-[#1c2438]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500 dark:text-blue-400">
            <Clock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide">
              Lịch Giảng Dạy & Trạng Thái Điểm Danh
            </h2>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
              {sessions.length} ca học trong ngày hôm nay
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('schedule')}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
        >
          <span>Xem toàn bộ lịch</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
          <CheckCircle2 size={36} className="text-slate-400 dark:text-slate-600 mb-2" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Không có ca học nào trong ngày hôm nay</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Các buổi học tiếp theo sẽ hiển thị tại đây</span>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
          {sessions.map((sess) => {
            const timing = getSessionTiming(sess.start_time, sess.duration);
            return (
              <div
                key={sess.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#13192c] border border-slate-200 dark:border-[#1e2844] hover:border-blue-500/40 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-black shrink-0">
                    {sess.start_time}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {sess.class_name}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${timing.badgeCls}`}>
                        {timing.text}
                      </span>
                      {sess.isAttendanceRecorded ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle size={10} />
                          Đã điểm danh
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle size={10} />
                          Chưa điểm danh
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                      <span>Giáo viên: {sess.teacher_name}</span>
                      <span>Phòng: {sess.room}</span>
                      <span>Thời lượng: {sess.duration} phút</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('classes', { classId: sess.class_id })}
                  className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-300 dark:border-blue-500/30 text-xs font-bold transition cursor-pointer shrink-0"
                >
                  Điểm danh ngay
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
