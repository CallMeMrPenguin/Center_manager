export const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const parseLocalDate = (val: string | null | undefined): Date | null => {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const parts = val.trim().split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  } else if (parts.length === 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    if (!isNaN(y) && !isNaN(m)) {
      return new Date(y, m, 1);
    }
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const formatToISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export interface CalendarDayItem {
  date: Date;
  isoStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isStudyDay: boolean;
}

export function buildMonthCalendarDays({
  currentYear,
  currentMonth,
  value,
  todayISO,
  cutoffDateStr,
  highlightDaysOfWeek,
  highlightDates,
}: {
  currentYear: number;
  currentMonth: number;
  value: string;
  todayISO: string;
  cutoffDateStr: string;
  highlightDaysOfWeek: number[];
  highlightDates: string[];
}): CalendarDayItem[] {
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const days: CalendarDayItem[] = [];

  // Previous month overflow days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
    d.setHours(0, 0, 0, 0);
    const iso = formatToISODate(d);
    const dayOfWeek = d.getDay();
    const isPastOrToday = iso <= cutoffDateStr;
    const isStudyDay = isPastOrToday && (
      highlightDaysOfWeek.includes(dayOfWeek) ||
      highlightDates.includes(iso)
    );

    days.push({
      date: d,
      isoStr: iso,
      dayNumber: prevMonthDays - i,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === value,
      isStudyDay,
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const d = new Date(currentYear, currentMonth, dayNum);
    d.setHours(0, 0, 0, 0);
    const iso = formatToISODate(d);
    const dayOfWeek = d.getDay();
    const isPastOrToday = iso <= cutoffDateStr;
    const isStudyDay = isPastOrToday && (
      highlightDaysOfWeek.includes(dayOfWeek) ||
      highlightDates.includes(iso)
    );

    days.push({
      date: d,
      isoStr: iso,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: iso === todayISO,
      isSelected: iso === value,
      isStudyDay,
    });
  }

  // Next month overflow days (fill to 35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(currentYear, currentMonth + 1, i);
    d.setHours(0, 0, 0, 0);
    const iso = formatToISODate(d);
    const dayOfWeek = d.getDay();
    const isPastOrToday = iso <= cutoffDateStr;
    const isStudyDay = isPastOrToday && (
      highlightDaysOfWeek.includes(dayOfWeek) ||
      highlightDates.includes(iso)
    );

    days.push({
      date: d,
      isoStr: iso,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === value,
      isStudyDay,
    });
  }

  return days;
}
