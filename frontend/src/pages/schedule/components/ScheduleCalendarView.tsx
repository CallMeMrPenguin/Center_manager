import React from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { 
  ClassSession, DAY_HDRS, getSessionColor, getPremiumStyle, calcEndTime 
} from '../types';
import { useTheme } from '../../../context/ThemeContext';

interface ScheduleCalendarViewProps {
  viewMode: 'month' | 'week';
  selectedMonth: string;
  totalCells: number;
  startOff: number;
  daysInMonth: number;
  yr: number;
  mo: number;
  today: string;
  sessions: ClassSession[];
  weekDays: Array<{ header: string; dateStr: string; dayNum: number }>;
  changeWeek: (dir: number) => void;
  setWeekStart: (d: Date) => void;
  openAdd: (dateStr?: string) => void;
  openEdit: (sess: ClassSession) => void;
  setCtxMenu: (menu: { x: number; y: number; dateStr: string } | null) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  viewMode,
  totalCells,
  startOff,
  daysInMonth,
  yr,
  mo,
  today,
  sessions,
  weekDays,
  changeWeek,
  setWeekStart,
  openAdd,
  openEdit,
  setCtxMenu,
}) => {
  const { isDark } = useTheme();

  if (viewMode === 'month') {
    return (
      <div className="calendar-container-depth flex-1 min-h-0 select-none">
        <div className="overflow-hidden bg-slate-100 dark:bg-[#111728] border-b-2 border-slate-300 dark:border-[#283556]">
          <div className="grid grid-cols-7">
            {DAY_HDRS.map((d, i) => (
              <div
                key={d}
                className={`py-3 text-center text-[10px] font-black uppercase tracking-widest ${
                  i >= 5 ? 'text-rose-500 dark:text-rose-400 bg-rose-500/[0.04]' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
        <div className="p-2 overflow-y-auto max-h-[calc(100vh-290px)]">
          <div className="grid grid-cols-7 gap-2 auto-rows-fr">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - startOff + 1;
              const isCurr = dayNum > 0 && dayNum <= daysInMonth;
              if (!isCurr) {
                return (
                  <div
                    key={idx}
                    className="min-h-[110px] rounded-2xl bg-slate-50/50 dark:bg-[#0c101c]/40 p-2.5 opacity-30 select-none border-0"
                  />
                );
              }

              const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === today;
              const isWknd = (idx % 7) >= 5;
              const daySess = sessions
                .filter((s) => s.date === dateStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div
                  key={idx}
                  onClick={() => openAdd(dateStr)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, dateStr });
                  }}
                  className={`min-h-[110px] rounded-2xl p-2 flex flex-col gap-1.5 transition-all cursor-pointer border-0 shadow-2xs ${
                    isToday
                      ? 'bg-blue-50/70 dark:bg-[#131a30] shadow-sm'
                      : isWknd
                      ? 'bg-slate-50/80 dark:bg-[#0e1322] hover:bg-slate-100 dark:hover:bg-[#131b30]'
                      : 'bg-white dark:bg-[#111728] hover:bg-slate-50 dark:hover:bg-[#131b30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12px] font-black flex items-center justify-center h-6 w-6 rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white font-black'
                          : isWknd
                          ? 'text-rose-500 dark:text-rose-300'
                          : 'text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {daySess.length > 0 && (
                      <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full border-0">
                        {daySess.length}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col gap-1.5">
                    {daySess.map((s) => {
                      const hex = getSessionColor(s);
                      const vs = getPremiumStyle(s.status, hex, isDark);
                      return (
                        <div
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(s);
                          }}
                          className="p-1.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border-0 shadow-xs hover:shadow-sm flex flex-col gap-0.5 overflow-hidden"
                          style={{ backgroundColor: vs.bg }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-[11px] font-black truncate text-slate-900 dark:text-white leading-tight">
                              {s.class_name}
                            </h4>
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 leading-none"
                              style={{ color: vs.color, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
                            >
                              {s.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold font-mono" style={{ color: vs.color }}>
                            <Clock size={10} className="shrink-0" />
                            <span>{s.start_time} - {calcEndTime(s.start_time, s.duration)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // WEEK VIEW
  return (
    <div className="calendar-container-depth flex-1 min-h-0 select-none flex flex-col">
      <div className="bg-slate-100 dark:bg-[#161c2c] border-b border-slate-200 dark:border-[#242f48] px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/70 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {weekDays[0].dateStr} - {weekDays[6].dateStr}
          </span>
          <button
            type="button"
            onClick={() => changeWeek(1)}
            className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/70 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            const day = d.getDay();
            const n = new Date(d);
            n.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
            setWeekStart(n);
          }}
          className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-400/50 text-blue-600 dark:text-blue-300 text-xs font-extrabold hover:bg-blue-500/25 transition cursor-pointer"
        >
          Hôm Nay
        </button>
      </div>

      <div className="overflow-hidden bg-slate-100 dark:bg-[#111728] border-b-2 border-slate-300 dark:border-[#283556] shrink-0">
        <div className="grid grid-cols-7">
          {weekDays.map((wd, idx) => {
            const isToday = wd.dateStr === today;
            const isWknd = idx >= 5;
            return (
              <div
                key={wd.dateStr}
                className={`py-2.5 text-center flex flex-col items-center gap-0.5 border-r border-slate-300 dark:border-[#283556] last:border-r-0 transition-all ${
                  isToday ? 'border-t-2 border-t-blue-500 bg-blue-500/[0.05]' : ''
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    isToday ? 'text-blue-600 dark:text-blue-400 font-black' : isWknd ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {wd.header}
                </span>
                <span
                  className={`text-sm font-black px-2 py-0.5 rounded-xl ${
                    isToday ? 'bg-blue-600 text-white font-black' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {wd.dayNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-auto flex-1 bg-slate-300 dark:bg-[#283556]">
        <div className="grid grid-cols-7 gap-[1.5px] bg-slate-300 dark:bg-[#283556] min-h-[300px]">
          {weekDays.map((wd, idx) => {
            const daySess = sessions
              .filter((s) => s.date === wd.dateStr)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = wd.dateStr === today;
            const isWknd = idx >= 5;

            return (
              <div
                key={wd.dateStr}
                onClick={() => openAdd(wd.dateStr)}
                className={`p-2.5 flex flex-col gap-2 cursor-pointer transition-all ${
                  isToday
                    ? 'bg-blue-50/70 dark:bg-[#141b2f] border-x border-blue-500/40 shadow-sm'
                    : isWknd
                    ? 'bg-slate-50/70 dark:bg-[#0f1422] hover:bg-blue-50/30 dark:hover:bg-[#161f36]'
                    : 'bg-white dark:bg-[#111728] hover:bg-blue-50/30 dark:hover:bg-[#161f36]'
                }`}
              >
                {daySess.map((s) => {
                  const hex = getSessionColor(s);
                  const vs = getPremiumStyle(s.status, hex, isDark);
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      className="p-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border-0 shadow-xs hover:shadow-sm flex flex-col gap-1 overflow-hidden"
                      style={{ backgroundColor: vs.bg }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-[11px] font-black truncate text-slate-900 dark:text-white leading-tight">
                          {s.class_name}
                        </h4>
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 leading-none"
                          style={{ color: vs.color, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono" style={{ color: vs.color }}>
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="shrink-0" />
                          <span>{s.start_time} - {calcEndTime(s.start_time, s.duration)}</span>
                        </div>
                        {s.teacher_name && (
                          <span className="text-[9px] font-sans truncate max-w-[70px] opacity-80" title={s.teacher_name}>
                            {s.teacher_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!daySess.length && (
                  <div className="text-center py-8 text-[10px] text-slate-400 dark:text-slate-600 font-bold select-none">
                    Không có ca học
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
