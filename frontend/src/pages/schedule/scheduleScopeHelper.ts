import { getLocalDateStr } from '../../utils';

export interface CustomDateRange {
  startStr: string;
  endStr: string;
}

/**
 * Computes which YYYY-MM month strings must be fetched from the backend API.
 * Never fetches unneeded adjacent months.
 */
export function computeMonthsToFetch(
  scope: 'all' | 'week',
  selectedMonth: string,
  selectedWeekStarts: string[],
  customRange?: CustomDateRange | null
): string[] {
  const months = new Set<string>();

  if (scope === 'all') {
    months.add(selectedMonth);
    return Array.from(months);
  }

  if (customRange && customRange.startStr && customRange.endStr) {
    const [sy, sm] = customRange.startStr.split('-').map(Number);
    const [ey, em] = customRange.endStr.split('-').map(Number);
    const cur = new Date(sy, sm - 1, 1);
    const end = new Date(ey, em - 1, 1);
    while (cur <= end) {
      months.add(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
      cur.setMonth(cur.getMonth() + 1);
    }
    return Array.from(months);
  }

  if (selectedWeekStarts && selectedWeekStarts.length > 0) {
    selectedWeekStarts.forEach((sStr) => {
      months.add(sStr.slice(0, 7));
      const parts = sStr.split('-').map(Number);
      const endD = new Date(parts[0], parts[1] - 1, parts[2] + 6);
      months.add(getLocalDateStr(endD).slice(0, 7));
    });
    return Array.from(months);
  }

  months.add(selectedMonth);
  return Array.from(months);
}

/**
 * Filters sessions strictly to the active scope (selected month or selected time range / weeks).
 * Guarantees no sessions from outside the selected range are counted or displayed.
 */
export function filterInScopeSessions<T extends { date: string }>(
  sessions: T[],
  scope: 'all' | 'week',
  selectedMonth: string,
  selectedWeekStarts: string[],
  customRange?: CustomDateRange | null
): T[] {
  return sessions.filter((s) => {
    if (!s?.date) return false;

    if (scope === 'all') {
      return s.date.startsWith(selectedMonth);
    }

    if (customRange && customRange.startStr && customRange.endStr) {
      return s.date >= customRange.startStr && s.date <= customRange.endStr;
    }

    if (selectedWeekStarts && selectedWeekStarts.length > 0) {
      return selectedWeekStarts.some((sStr) => {
        const parts = sStr.split('-').map(Number);
        const endD = new Date(parts[0], parts[1] - 1, parts[2] + 6);
        const endStr = getLocalDateStr(endD);
        return s.date >= sStr && s.date <= endStr;
      });
    }

    return s.date.startsWith(selectedMonth);
  });
}
