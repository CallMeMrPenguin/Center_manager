import React, { useMemo } from 'react';
import { ClassSession } from '../types';
import { HorizontalTimelineGrid } from './HorizontalTimelineGrid';

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
  // Week view row items
  const weekDayRows = useMemo(() => {
    return weekDays.map((wd, idx) => ({
      header: wd.header,
      dateStr: wd.dateStr,
      subText: wd.dateStr.slice(8, 10) + '/' + wd.dateStr.slice(5, 7),
      isToday: wd.dateStr === today,
      isWeekend: idx >= 5,
    }));
  }, [weekDays, today]);

  // Month view row items (every day of the month as a horizontal row)
  const monthDayRows = useMemo(() => {
    const weekdayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(yr, mo - 1, d);
      const dayOfWeek = dateObj.getDay();
      list.push({
        header: weekdayNames[dayOfWeek],
        dateStr: dStr,
        subText: `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}`,
        isToday: dStr === today,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return list;
  }, [yr, mo, daysInMonth, today]);

  const handleSetWeekToday = () => {
    const d = new Date();
    const day = d.getDay();
    const n = new Date(d);
    n.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    setWeekStart(n);
  };

  const weekRangeText = weekDays.length >= 7 ? `${weekDays[0].dateStr} - ${weekDays[6].dateStr}` : '';

  return (
    <HorizontalTimelineGrid
      viewMode={viewMode}
      days={viewMode === 'week' ? weekDayRows : monthDayRows}
      sessions={sessions}
      today={today}
      changeWeek={viewMode === 'week' ? changeWeek : undefined}
      setWeekStartToday={viewMode === 'week' ? handleSetWeekToday : undefined}
      weekRangeText={weekRangeText}
      openAdd={openAdd}
      openEdit={openEdit}
      setCtxMenu={setCtxMenu}
    />
  );
};
