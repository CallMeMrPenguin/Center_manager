import React, { useMemo } from 'react';
import { ClassSession } from '../types';
import { HorizontalTimelineGrid } from './HorizontalTimelineGrid';

interface ScheduleCalendarViewProps {
  scope?: 'all' | 'week';
  viewMode?: 'week';
  selectedMonth: string;
  totalCells?: number;
  startOff?: number;
  daysInMonth?: number;
  yr?: number;
  mo?: number;
  today: string;
  sessions: ClassSession[];
  weekDays: Array<{ header: string; dateStr: string; dayNum: number }>;
  changeWeek: (dir: number) => void;
  setWeekStart?: (d: Date) => void;
  setWeekStartToday?: () => void;
  openAdd: (dateStr?: string) => void;
  openEdit: (sess: ClassSession) => void;
  setCtxMenu?: (menu: { x: number; y: number; dateStr: string } | null) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  scope = 'all',
  daysInMonth,
  yr,
  mo,
  today,
  sessions,
  weekDays,
  changeWeek,
  setWeekStartToday,
  openAdd,
  openEdit,
  setCtxMenu,
}) => {
  // 1. Week view row items (7 days)
  const weekDayRows = useMemo(() => {
    return weekDays.map((wd, idx) => ({
      header: wd.header,
      dateStr: wd.dateStr,
      subText: wd.dateStr.slice(8, 10) + '/' + wd.dateStr.slice(5, 7),
      isToday: wd.dateStr === today,
      isWeekend: idx >= 5,
    }));
  }, [weekDays, today]);

  // 2. Month view row items (All days in month: 1 to daysInMonth)
  const monthDayRows = useMemo(() => {
    if (!daysInMonth || !yr || !mo) return [];
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(yr, mo - 1, d);
      const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = dateObj.getDay();
      const dayName = dayOfWeek === 0 ? 'Chủ Nhật' : `Thứ ${dayOfWeek + 1}`;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      rows.push({
        header: dayName,
        dateStr,
        subText: `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}`,
        isToday: dateStr === today,
        isWeekend,
      });
    }
    return rows;
  }, [daysInMonth, yr, mo, today]);

  const daysToRender = scope === 'all' ? monthDayRows : weekDayRows;
  const viewModeToRender = scope === 'all' ? 'month' : 'week';
  const weekRangeText = weekDays.length >= 7 ? `${weekDays[0].dateStr} - ${weekDays[6].dateStr}` : '';

  return (
    <HorizontalTimelineGrid
      viewMode={viewModeToRender}
      days={daysToRender}
      sessions={sessions}
      today={today}
      changeWeek={changeWeek}
      setWeekStartToday={setWeekStartToday}
      weekRangeText={weekRangeText}
      openAdd={openAdd}
      openEdit={openEdit}
      setCtxMenu={setCtxMenu}
    />
  );
};
