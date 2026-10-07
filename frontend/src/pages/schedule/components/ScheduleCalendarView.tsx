import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from 'lucide-react';
import { ClassSession, DAY_HDRS, getSessionColor } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { SessionItemCard } from './SessionItemCard';

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
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>(today);

  if (viewMode === 'month') {
    const mobileDateSessions = sessions
      .filter((s) => s.date === mobileSelectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
      <div className="flex-1 min-h-0 select-none flex flex-col">
        {/* Month Day Headers */}
        <div className="overflow-hidden bg-slate-100/90 dark:bg-[#111728] border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="grid grid-cols-7 divide-x divide-slate-200/80 dark:divide-white/5">
            {DAY_HDRS.map((d, i) => (
              <div
                key={d}
                className={`py-2 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                  i >= 5 ? 'text-rose-500 dark:text-rose-400 bg-rose-500/[0.04]' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Month Calendar Grid */}
        <div className="overflow-y-auto max-h-[calc(100vh-250px)] bg-slate-200/80 dark:bg-white/10">
          <div className="grid grid-cols-7 gap-px bg-slate-200/80 dark:bg-white/10 auto-rows-fr">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - startOff + 1;
              const isCurr = dayNum > 0 && dayNum <= daysInMonth;
              const isWknd = (idx % 7) >= 5;

              if (!isCurr) {
                const prevMoLastDate = new Date(yr, mo - 1, 0).getDate();
                const trailingDayNum = dayNum <= 0 ? prevMoLastDate + dayNum : dayNum - daysInMonth;

                return (
                  <div
                    key={idx}
                    className="min-h-[50px] sm:min-h-[115px] bg-slate-50/70 dark:bg-[#090d18]/50 p-1.5 sm:p-2 select-none pointer-events-none flex flex-col justify-between"
                  >
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400/80 dark:text-slate-600">
                      {trailingDayNum}
                    </span>
                  </div>
                );
              }

              const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === today;
              const isSelectedMobile = dateStr === mobileSelectedDate;
              const daySess = sessions
                .filter((s) => s.date === dateStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setMobileSelectedDate(dateStr);
                    if (window.innerWidth >= 640) {
                      openAdd(dateStr);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, dateStr });
                  }}
                  className={`min-h-[52px] sm:min-h-[115px] p-1 sm:p-2 flex flex-col justify-between sm:justify-start gap-1 transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-blue-50/70 dark:bg-[#131b32]'
                      : isSelectedMobile
                      ? 'bg-blue-50/40 dark:bg-[#151f38] ring-1 ring-inset ring-blue-500/50 sm:ring-0'
                      : isWknd
                      ? 'bg-rose-50/30 dark:bg-[#19111e] hover:bg-rose-50/60 dark:hover:bg-[#201528]'
                      : 'bg-white dark:bg-[#111728] hover:bg-blue-50/30 dark:hover:bg-[#131b30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-[12px] font-black flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full transition-transform ${
                        isToday
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : isSelectedMobile
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 font-black'
                          : isWknd
                          ? 'text-rose-600 dark:text-rose-400 font-black'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {daySess.length > 0 && (
                      <span className="hidden sm:inline-block text-[9px] font-extrabold text-blue-600 dark:text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-md border-0">
                        {daySess.length}
                      </span>
                    )}
                  </div>

                  {/* Mobile Indicator Dots (Zero clutter on small screens) */}
                  {daySess.length > 0 && (
                    <div className="flex sm:hidden items-center justify-center gap-0.5 pb-0.5">
                      {daySess.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: getSessionColor(s) }}
                        />
                      ))}
                      {daySess.length > 3 && (
                        <span className="text-[8px] font-bold text-slate-400 leading-none">+</span>
                      )}
                    </div>
                  )}

                  {/* Desktop Session Cards */}
                  <div className="hidden sm:flex flex-grow flex-col gap-1">
                    {daySess.map((s) => (
                      <SessionItemCard
                        key={s.id}
                        session={s}
                        isDark={isDark}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(s);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dedicated Mobile Day Agenda View (Clear, full-width session cards) */}
          <div className="block sm:hidden bg-white dark:bg-[#111728] border-t border-slate-200 dark:border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalIcon size={14} className="text-blue-500" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Lịch ngày {mobileSelectedDate.split('-').reverse().join('/')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-300">
                  {mobileDateSessions.length} buổi
                </span>
              </div>
              <button
                type="button"
                onClick={() => openAdd(mobileSelectedDate)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition"
              >
                <Plus size={12} />
                <span>Thêm</span>
              </button>
            </div>

            {mobileDateSessions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
                Không có buổi học nào vào ngày này.
              </p>
            ) : (
              <div className="space-y-2">
                {mobileDateSessions.map((s) => (
                  <SessionItemCard
                    key={s.id}
                    session={s}
                    isDark={isDark}
                    onClick={() => openEdit(s)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // WEEK VIEW
  return (
    <div className="flex-1 min-h-0 select-none flex flex-col">
      <div className="bg-slate-50 dark:bg-[#131a2c] border-b border-slate-200 dark:border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/70 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer border-0 shadow-2xs"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {weekDays[0].dateStr} - {weekDays[6].dateStr}
          </span>
          <button
            type="button"
            onClick={() => changeWeek(1)}
            className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/70 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer border-0 shadow-2xs"
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
          className="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300 text-xs font-extrabold hover:bg-blue-500/25 transition cursor-pointer border-0 shadow-2xs"
        >
          Hôm Nay
        </button>
      </div>

      <div className="overflow-x-auto flex-1 bg-slate-100 dark:bg-[#0c101d]">
        <div className="min-w-[640px] sm:min-w-0">
          <div className="overflow-hidden bg-slate-100/90 dark:bg-[#111728] border-b border-slate-200 dark:border-white/10 shrink-0">
            <div className="grid grid-cols-7 divide-x divide-slate-200/80 dark:divide-white/5">
              {weekDays.map((wd, idx) => {
                const isToday = wd.dateStr === today;
                const isWknd = idx >= 5;
                return (
                  <div
                    key={wd.dateStr}
                    className={`py-2 text-center flex flex-col items-center gap-0.5 transition-all ${
                      isToday ? 'border-t-2 border-t-blue-500 bg-blue-500/[0.05]' : ''
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isToday ? 'text-blue-600 dark:text-blue-400 font-black' : isWknd ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {wd.header}
                    </span>
                    <span
                      className={`text-sm font-black px-2 py-0.5 rounded-lg ${
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

          <div className="grid grid-cols-7 divide-x divide-slate-200/80 dark:divide-white/5 min-h-[300px]">
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
                  className={`p-2 sm:p-2.5 flex flex-col gap-2 cursor-pointer transition-all ${
                    isToday
                      ? 'bg-blue-50/70 dark:bg-[#141b2f]'
                      : isWknd
                      ? 'bg-slate-50/70 dark:bg-[#0f1422] hover:bg-blue-50/25 dark:hover:bg-[#161f36]'
                      : 'bg-white dark:bg-[#111728] hover:bg-blue-50/25 dark:hover:bg-[#161f36]'
                  }`}
                >
                  {daySess.map((s) => (
                    <SessionItemCard
                      key={s.id}
                      session={s}
                      isDark={isDark}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                    />
                  ))}
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
    </div>
  );
};
