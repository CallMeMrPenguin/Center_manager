import React, { useMemo } from 'react';
import { ClassSession } from '../types';
import { HorizontalTimelineGrid } from './HorizontalTimelineGrid';

interface ScheduleCalendarViewProps {
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
  setWeekStart: (d: Date) => void;
  openAdd: (dateStr?: string) => void;
  openEdit: (sess: ClassSession) => void;
  setCtxMenu: (menu: { x: number; y: number; dateStr: string } | null) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
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
      viewMode="week"
      days={weekDayRows}
      sessions={sessions}
      today={today}
      changeWeek={changeWeek}
      setWeekStartToday={handleSetWeekToday}
      weekRangeText={weekRangeText}
      openAdd={openAdd}
      openEdit={openEdit}
      setCtxMenu={setCtxMenu}
    />
  );
};
