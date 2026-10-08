import { ClassSession, parseTimeToMinutes } from '../types';

export interface DayRowData {
  header: string; // e.g. "Thứ 2"
  dateStr: string; // "YYYY-MM-DD"
  subText: string; // "12/10"
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Computes dynamic startHour and endHour based on visible sessions.
 * If sessions exist between 17:00 and 21:15, starts at 16:00 and ends at 22:00,
 * eliminating unnecessary empty morning columns.
 */
export function computeDynamicHourRange(sessions: ClassSession[]): {
  startHour: number;
  endHour: number;
  hours: number[];
  totalHours: number;
} {
  if (!sessions || sessions.length === 0) {
    const s = 14;
    const e = 22;
    const hrs = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    return { startHour: s, endHour: e, hours: hrs, totalHours: e - s };
  }

  let minStartMins = 24 * 60;
  let maxEndMins = 0;

  for (const s of sessions) {
    const sMin = parseTimeToMinutes(s.start_time);
    const duration = s.duration || 90;
    const eMin = sMin + duration;
    if (sMin < minStartMins) minStartMins = sMin;
    if (eMin > maxEndMins) maxEndMins = eMin;
  }

  if (minStartMins >= maxEndMins) {
    const s = 14;
    const e = 22;
    const hrs = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    return { startHour: s, endHour: e, hours: hrs, totalHours: e - s };
  }

  // 1-hour buffer before the earliest class, 1-hour buffer after the latest class
  const calcStart = Math.max(0, Math.floor(minStartMins / 60) - 1);
  const calcEnd = Math.min(24, Math.ceil(maxEndMins / 60) + 1);

  // Ensure at least 4 hours span for comfortable timeline layout
  const finalEnd = Math.max(calcEnd, calcStart + 4);
  const totalHours = finalEnd - calcStart;
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => calcStart + i);

  return {
    startHour: calcStart,
    endHour: finalEnd,
    hours,
    totalHours,
  };
}

/**
 * Computes multi-track layout for overlapping sessions within a single day.
 */
export function computeDayTrackLayouts(daySessions: ClassSession[]): {
  layouts: Array<{ session: ClassSession; trackIdx: number }>;
  rowHeight: number;
} {
  const sorted = [...daySessions].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const tracks: Array<{ endMinutes: number }> = [];

  const layouts = sorted.map((s) => {
    const sMin = parseTimeToMinutes(s.start_time);
    const eMin = sMin + (s.duration || 90);
    let trackIdx = tracks.findIndex((t) => t.endMinutes <= sMin);
    if (trackIdx === -1) {
      trackIdx = tracks.length;
      tracks.push({ endMinutes: eMin });
    } else {
      tracks[trackIdx].endMinutes = eMin;
    }
    return { session: s, trackIdx };
  });

  const trackCount = Math.max(1, tracks.length);
  const rowHeight = trackCount * 76 + 12;

  return { layouts, rowHeight };
}
