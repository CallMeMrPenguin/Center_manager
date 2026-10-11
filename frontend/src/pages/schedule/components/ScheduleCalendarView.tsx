import React, { useMemo } from 'react';
import { ClassSession } from '../types';
import { VerticalTimelineGrid } from './VerticalTimelineGrid';
import { getLocalDateStr } from '../../../utils';

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
  selectedWeekStarts?: string[];
  customRange?: { startStr: string; endStr: string } | null;
  changeWeek: (dir: number) => void;
  setWeekStart?: (d: Date) => void;
  setWeekStartToday?: () => void;
  openAdd: (dateStr?: string) => void;
  openEdit: (sess: ClassSession) => void;
  setCtxMenu?: (menu: { x: number; y: number; dateStr: string } | null) => void;
  viewModeToggle?: React.ReactNode;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  scope = 'all',
  daysInMonth,
  yr,
  mo,
  today,
  sessions,
  weekDays,
  selectedWeekStarts,
  customRange,
  changeWeek,
  setWeekStartToday,
  openAdd,
  openEdit,
  setCtxMenu,
  viewModeToggle,
}) => {
  // 1. Week view row items (Supports 1 or multiple weeks)
  const weekDayRows = useMemo(() => {
    if (selectedWeekStarts && selectedWeekStarts.length > 0) {
      const sortedStarts = [...selectedWeekStarts].sort();
      const allDays: Array<{
        header: string;
        dateStr: string;
        subText: string;
        isToday: boolean;
        isWeekend: boolean;
      }> = [];

      sortedStarts.forEach((sStr) => {
        const parts = sStr.split('-').map(Number);
        const mon = new Date(parts[0], parts[1] - 1, parts[2]);
        for (let i = 0; i < 7; i++) {
          const d = new Date(mon);
          d.setDate(mon.getDate() + i);
          const dStr = getLocalDateStr(d);
          const dayOfWeek = d.getDay();
          const dayName = dayOfWeek === 0 ? 'Chủ Nhật' : `Thứ ${dayOfWeek + 1}`;
          allDays.push({
            header: dayName,
            dateStr: dStr,
            subText: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
            isToday: dStr === today,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          });
        }
      });
      return allDays;
    }

    return weekDays.map((wd, idx) => ({
      header: wd.header,
      dateStr: wd.dateStr,
      subText: wd.dateStr.slice(8, 10) + '/' + wd.dateStr.slice(5, 7),
      isToday: wd.dateStr === today,
      isWeekend: idx >= 5,
    }));
  }, [selectedWeekStarts, weekDays, today]);

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

  // 3. Custom picked range row items
  const rangeDayRows = useMemo(() => {
    if (customRange && customRange.startStr && customRange.endStr) {
      const partsStart = customRange.startStr.split('-').map(Number);
      const partsEnd = customRange.endStr.split('-').map(Number);
      const startD = new Date(partsStart[0], partsStart[1] - 1, partsStart[2]);
      const endD = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);
      const rows = [];
      const cur = new Date(startD);
      while (cur <= endD) {
        const dStr = getLocalDateStr(cur);
        const dayOfWeek = cur.getDay();
        const dayName = dayOfWeek === 0 ? 'Chủ Nhật' : `Thứ ${dayOfWeek + 1}`;
        rows.push({
          header: dayName,
          dateStr: dStr,
          subText: `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`,
          isToday: dStr === today,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        });
        cur.setDate(cur.getDate() + 1);
      }
      return rows;
    }
    return null;
  }, [customRange, today]);

  const daysToRender = scope === 'all' ? monthDayRows : (rangeDayRows || weekDayRows);
  const viewModeToRender = scope === 'all' ? 'month' : 'week';
  const weekRangeText = daysToRender.length > 0 ? `${daysToRender[0].dateStr} - ${daysToRender[daysToRender.length - 1].dateStr}` : '';

  return (
    <VerticalTimelineGrid
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
      viewModeToggle={viewModeToggle}
    />
  );
};
