import { getLocalDateStr } from '../../../utils';

export interface WeekDayItem {
  date: Date;
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface WeekInfo {
  index: number;
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  rangeLabel: string;
  days: WeekDayItem[];
}

export interface DateRangeSegment {
  startStr: string;
  endStr: string;
}

export function computeMonthWeeks(yr: number, mo: number, today: string): WeekInfo[] {
  const firstDay = new Date(yr, mo - 1, 1);
  const dayOfWeek = firstDay.getDay();
  const monOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const firstMon = new Date(yr, mo - 1, 1 - monOffset);

  const result: WeekInfo[] = [];
  let curMon = new Date(firstMon);
  let idx = 1;

  while (true) {
    const weekEnd = new Date(curMon);
    weekEnd.setDate(curMon.getDate() + 6);

    const days: WeekDayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curMon);
      d.setDate(curMon.getDate() + i);
      const dStr = getLocalDateStr(d);
      days.push({
        date: d,
        dateStr: dStr,
        dayNum: d.getDate(),
        isCurrentMonth: d.getFullYear() === yr && d.getMonth() === mo - 1,
        isToday: dStr === today,
      });
    }

    const sNum = curMon.getDate();
    const sMo = curMon.getMonth() + 1;
    const eNum = weekEnd.getDate();
    const eMo = weekEnd.getMonth() + 1;
    const rangeLabel = `${String(sNum).padStart(2, '0')}/${String(sMo).padStart(2, '0')} - ${String(eNum).padStart(2, '0')}/${String(eMo).padStart(2, '0')}`;

    result.push({
      index: idx,
      start: new Date(curMon),
      end: weekEnd,
      startStr: getLocalDateStr(curMon),
      endStr: getLocalDateStr(weekEnd),
      rangeLabel,
      days,
    });

    curMon.setDate(curMon.getDate() + 7);
    idx++;

    if (curMon.getFullYear() > yr || (curMon.getFullYear() === yr && curMon.getMonth() > mo - 1)) {
      break;
    }
    if (idx > 6) break;
  }

  return result;
}

/**
 * Groups multiple selected weeks into contiguous island segments.
 * For example: Week 1 + Week 3, 4, 5 => [Segment 1: Week 1], [Segment 2: Weeks 3-5].
 */
export function computeSegmentsFromWeeks(selectedWeeks: WeekInfo[]): DateRangeSegment[] {
  if (selectedWeeks.length === 0) return [];
  const sorted = [...selectedWeeks].sort((a, b) => a.startStr.localeCompare(b.startStr));
  const segments: DateRangeSegment[] = [];
  let currentSegment: DateRangeSegment = {
    startStr: sorted[0].startStr,
    endStr: sorted[0].endStr,
  };

  for (let i = 1; i < sorted.length; i++) {
    const nextWk = sorted[i];
    const prevEndDate = new Date(currentSegment.endStr);
    prevEndDate.setDate(prevEndDate.getDate() + 1);
    const expectedNextStart = getLocalDateStr(prevEndDate);

    if (nextWk.startStr === expectedNextStart) {
      currentSegment.endStr = nextWk.endStr;
    } else {
      segments.push(currentSegment);
      currentSegment = {
        startStr: nextWk.startStr,
        endStr: nextWk.endStr,
      };
    }
  }
  segments.push(currentSegment);
  return segments;
}

/**
 * Finds all week starts intersecting a custom range [startStr, endStr].
 */
export function findWeeksIntersectingRange(weeks: WeekInfo[], startStr: string, endStr: string): string[] {
  const minStr = startStr <= endStr ? startStr : endStr;
  const maxStr = startStr <= endStr ? endStr : startStr;
  return weeks
    .filter((w) => w.startStr <= maxStr && w.endStr >= minStr)
    .map((w) => w.startStr);
}

export function computeTriggerLabel(
  scope: 'all' | 'week',
  mo: number,
  yr: number,
  selectedWeeksList: WeekInfo[],
  isConsecutiveWeeks: boolean
): string {
  if (scope === 'all') {
    return `Tháng ${mo}/${yr}`;
  }
  if (selectedWeeksList.length === 0) return `Tháng ${mo}/${yr}`;
  if (selectedWeeksList.length === 1) {
    return `Tuần ${selectedWeeksList[0].index} (${selectedWeeksList[0].rangeLabel})`;
  }
  const minStart = selectedWeeksList[0].rangeLabel.split(' - ')[0];
  const maxEnd = selectedWeeksList[selectedWeeksList.length - 1].rangeLabel.split(' - ')[1];
  const indices = selectedWeeksList.map((w) => w.index);
  if (isConsecutiveWeeks) {
    return `Tuần ${indices[0]} - ${indices[indices.length - 1]} (${minStart} - ${maxEnd})`;
  }
  return `Tuần ${indices.join(', ')} (${minStart} - ${maxEnd})`;
}
