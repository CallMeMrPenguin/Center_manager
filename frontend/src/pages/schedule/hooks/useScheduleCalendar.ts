import { useState } from 'react';
import { getUrlParam, setUrlParams, useUrlSync } from '../../../utils/navigation';
import { getLocalDateStr } from '../../../utils';
import { DAY_HDRS } from '../types';

export function useScheduleCalendar() {
  const [viewMode, setViewMode] = useState<'week' | 'list'>(() => {
    const v = getUrlParam('view');
    if (v === 'week' || v === 'list') return v;
    return 'week';
  });

  const handleChangeViewMode = (mode: 'week' | 'list') => {
    setViewMode(mode);
    setUrlParams({ view: mode });
  };

  useUrlSync(() => {
    const v = getUrlParam('view');
    if (v === 'week' || v === 'list') {
      setViewMode(v);
    }
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const n = new Date(d);
    n.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return n;
  });

  const today = getLocalDateStr();
  const [yr, mo] = selectedMonth.split('-').map(Number);
  const firstDay = new Date(yr, mo - 1, 1);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const startOff = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalCells = Math.ceil((startOff + daysInMonth) / 7) * 7;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { header: DAY_HDRS[i], dateStr: getLocalDateStr(d), dayNum: d.getDate() };
  });

  const changeWeek = (dir: number) => {
    const n = new Date(weekStart);
    n.setDate(weekStart.getDate() + dir * 7);
    setWeekStart(n);
    const newMoStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMoStr);
  };

  const handleSetSelectedMonth = (moStr: string) => {
    setSelectedMonth(moStr);
    const [y, m] = moStr.split('-').map(Number);
    if (y && m) {
      const first = new Date(y, m - 1, 1);
      const day = first.getDay();
      const n = new Date(first);
      n.setDate(first.getDate() - day + (day === 0 ? -6 : 1));
      setWeekStart(n);
    }
  };

  return {
    viewMode,
    handleChangeViewMode,
    selectedMonth,
    setSelectedMonth: handleSetSelectedMonth,
    weekStart,
    setWeekStart,
    today,
    yr,
    mo,
    firstDay,
    daysInMonth,
    startOff,
    totalCells,
    weekDays,
    changeWeek,
  };
}
