import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  ClassSession, DAY_HDRS, getSessionColor, getPremiumStyle, calcEndTime 
} from '../types';

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
  if (viewMode === 'month') {
    return (
      <div className="calendar-container-depth flex-1 min-h-0 select-none">
        <div className="overflow-hidden bg-[#161c2c] border-b border-[#242f48]">
          <div className="grid grid-cols-7">
            {DAY_HDRS.map((d, i) => (
              <div
                key={d}
                className={`py-3 text-center text-[10px] font-extrabold uppercase tracking-widest ${
                  i >= 5 ? 'text-rose-400 bg-rose-500/[0.03]' : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-auto max-h-[calc(100vh-360px)] bg-[#0c101a]">
          <div className="grid grid-cols-7 gap-[1px] bg-[#1e273e]">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOff + 1;
              const inMonth = dayNum > 0 && dayNum <= daysInMonth;
              if (!inMonth) return <div key={`e-${i}`} className="bg-[#0c101a] min-h-[140px]" />;
              const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const daySess = sessions
                .filter((s) => s.date === dateStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              const isToday = dateStr === today;
              const isWknd = i % 7 >= 5;

              return (
                <div
                  key={dayNum}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, dateStr });
                  }}
                  onClick={() => openAdd(dateStr)}
                  className={`min-h-[140px] p-2 flex flex-col gap-1.5 transition-all cursor-pointer ${
                    isToday
                      ? 'bg-[#141b2f] z-10 border border-blue-500/50'
                      : `${isWknd ? 'bg-[#0f1422]' : 'bg-[#111728]'} hover:bg-[#161f36]`
                  }`}
                >
                  <div className="flex justify-between items-center shrink-0">
                    <span
                      className={`text-[12px] font-black flex items-center justify-center h-6 w-6 rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white font-black'
                          : isWknd
                          ? 'text-rose-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {daySess.length > 0 && (
                      <span className="text-[9px] font-extrabold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                        {daySess.length}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col gap-1.5">
                    {daySess.map((s) => {
                      const hex = getSessionColor(s);
                      const vs = getPremiumStyle(s.status, hex);
                      return (
                        <div
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(s);
                          }}
                          className="flex rounded-xl cursor-pointer transition-all active:scale-[0.98] min-h-[46px] border border-solid event-float overflow-hidden"
                          style={{ backgroundColor: vs.bg, borderColor: vs.border, boxShadow: vs.shadow }}
                        >
                          <div
                            className="flex flex-col justify-center items-center px-1.5 py-1 text-[9px] font-black w-[42px] shrink-0 text-center border-r border-solid"
                            style={{ borderColor: vs.innerBorder, color: vs.color }}
                          >
                            <span className="leading-none">{s.start_time}</span>
                            <span className="text-[7px] my-0.5 opacity-50">↓</span>
                            <span className="leading-none">{calcEndTime(s.start_time, s.duration)}</span>
                          </div>
                          <div className="flex-grow p-1.5 flex flex-col justify-center overflow-hidden">
                            <h4 className="text-[11px] font-black truncate text-white">{s.class_name}</h4>
                            <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: vs.color }}>
                              {s.status}
                            </div>
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
      <div className="bg-[#161c2c] border-b border-[#242f48] px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-black text-white">
            {weekDays[0].dateStr} - {weekDays[6].dateStr}
          </span>
          <button
            type="button"
            onClick={() => changeWeek(1)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
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
          className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-400 text-blue-300 text-xs font-extrabold hover:bg-blue-600/30 transition cursor-pointer"
        >
          Hôm Nay
        </button>
      </div>

      <div className="overflow-hidden bg-[#161c2c] border-b border-[#242f48] shrink-0">
        <div className="grid grid-cols-7">
          {weekDays.map((wd, idx) => {
            const isToday = wd.dateStr === today;
            const isWknd = idx >= 5;
            return (
              <div
                key={wd.dateStr}
                className={`py-2.5 text-center flex flex-col items-center gap-0.5 border-r border-[#242f48] last:border-r-0 transition-all ${
                  isToday ? 'border-t-2 border-t-blue-500 bg-blue-500/[0.05]' : ''
                }`}
              >
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest ${
                    isToday ? 'text-blue-400 font-black' : isWknd ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {wd.header}
                </span>
                <span
                  className={`text-sm font-black px-2 py-0.5 rounded-xl ${
                    isToday ? 'bg-blue-600 text-white font-black' : 'text-white'
                  }`}
                >
                  {wd.dayNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-auto flex-1 bg-[#0c101a]">
        <div className="grid grid-cols-7 gap-[1px] bg-[#1e273e] min-h-[300px]">
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
                    ? 'bg-[#141b2f] border-x border-blue-500/40'
                    : isWknd
                    ? 'bg-[#0f1422] hover:bg-[#161f36]'
                    : 'bg-[#111728] hover:bg-[#161f36]'
                }`}
              >
                {daySess.map((s) => {
                  const hex = getSessionColor(s);
                  const vs = getPremiumStyle(s.status, hex);
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      className="flex rounded-xl cursor-pointer transition-all active:scale-[0.98] min-h-[52px] border border-solid event-float overflow-hidden"
                      style={{ backgroundColor: vs.bg, borderColor: vs.border, boxShadow: vs.shadow }}
                    >
                      <div
                        className="flex flex-col justify-center items-center px-1.5 py-1 text-[9px] font-black w-[42px] shrink-0 text-center border-r"
                        style={{ borderColor: vs.innerBorder, color: vs.color }}
                      >
                        <span className="leading-none">{s.start_time}</span>
                        <span className="text-[7px] my-0.5 opacity-60">↓</span>
                        <span className="leading-none">{calcEndTime(s.start_time, s.duration)}</span>
                      </div>
                      <div className="flex-grow p-1.5 flex flex-col justify-center overflow-hidden">
                        <h4 className="text-[11px] font-black truncate text-white">{s.class_name}</h4>
                        <div className="text-[9px] font-bold mt-0.5" style={{ color: vs.color }}>
                          {s.teacher_name || 'GV'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!daySess.length && (
                  <div className="text-center py-8 text-[10px] text-slate-600 font-bold select-none">
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
