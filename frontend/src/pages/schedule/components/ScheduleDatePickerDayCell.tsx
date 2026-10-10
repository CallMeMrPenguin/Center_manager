import React from 'react';
import { WeekDayItem, WeekInfo } from './scheduleDatePickerHelper';

interface ScheduleDatePickerDayCellProps {
  day: WeekDayItem;
  dayIndex: number;
  scope: 'all' | 'week';
  daysInMonth: number;
  isConsecutiveWeeks: boolean;
  selectedWeeksList: WeekInfo[];
  isWeekRowSelected: boolean;
  minSelectedStartStr: string;
  maxSelectedEndStr: string;
}

export const ScheduleDatePickerDayCell: React.FC<ScheduleDatePickerDayCellProps> = ({
  day,
  dayIndex,
  scope,
  daysInMonth,
  isConsecutiveWeeks,
  selectedWeeksList,
  isWeekRowSelected,
  minSelectedStartStr,
  maxSelectedEndStr,
}) => {
  const isFirst = dayIndex === 0;
  const isLast = dayIndex === 6;

  // 1. Full Month Highlight
  if (scope === 'all') {
    if (!day.isCurrentMonth) {
      return (
        <div className="relative flex flex-col items-center justify-center h-8 text-xs text-slate-300 dark:text-slate-600">
          <span className="leading-none">{day.dayNum}</span>
        </div>
      );
    }

    const isStartPoint = day.dayNum === 1;
    const isEndPoint = day.dayNum === daysInMonth;

    if (isStartPoint || isEndPoint) {
      return (
        <div className="relative flex items-center justify-center h-8">
          {isStartPoint && !isLast && <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
          {isEndPoint && !isFirst && <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
          <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 text-white font-black flex flex-col items-center justify-center shadow-xs text-xs">
            <span className="leading-none">{day.dayNum}</span>
            {day.isToday && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </div>
        </div>
      );
    }

    const roundCls = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
    return (
      <div className="relative flex items-center justify-center h-8">
        <div className={`absolute inset-0 bg-blue-100 dark:bg-blue-900/40 ${roundCls}`} />
        <div className="relative z-10 text-xs font-bold text-blue-900 dark:text-blue-100 flex flex-col items-center">
          <span className="leading-none">{day.dayNum}</span>
          {day.isToday && <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
        </div>
      </div>
    );
  }

  // 2. Week Range Highlight (Single or Multi-Week)
  if (scope === 'week' && isConsecutiveWeeks && selectedWeeksList.length > 0) {
    const inRange = day.dateStr >= minSelectedStartStr && day.dateStr <= maxSelectedEndStr;
    if (inRange) {
      const isStart = day.dateStr === minSelectedStartStr;
      const isEnd = day.dateStr === maxSelectedEndStr;

      if (isStart || isEnd) {
        return (
          <div className="relative flex items-center justify-center h-8">
            {isStart && !isLast && <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
            {isEnd && !isFirst && <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
            <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 text-white font-black flex flex-col items-center justify-center shadow-xs text-xs">
              <span className="leading-none">{day.dayNum}</span>
              {day.isToday && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
            </div>
          </div>
        );
      }

      const roundCls = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
      return (
        <div className="relative flex items-center justify-center h-8">
          <div className={`absolute inset-0 bg-blue-100 dark:bg-blue-900/40 ${roundCls}`} />
          <div className="relative z-10 text-xs font-bold text-blue-900 dark:text-blue-100 flex flex-col items-center">
            <span className="leading-none">{day.dayNum}</span>
            {day.isToday && <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
          </div>
        </div>
      );
    }
  } else if (scope === 'week' && isWeekRowSelected) {
    return (
      <div className="relative flex items-center justify-center h-8">
        {isFirst && <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
        {isLast && <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
        {!isFirst && !isLast && <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/40" />}
        {isFirst || isLast ? (
          <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 text-white font-black flex flex-col items-center justify-center shadow-xs text-xs">
            <span className="leading-none">{day.dayNum}</span>
            {day.isToday && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </div>
        ) : (
          <div className="relative z-10 text-xs font-bold text-blue-900 dark:text-blue-100 flex flex-col items-center">
            <span className="leading-none">{day.dayNum}</span>
            {day.isToday && <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
          </div>
        )}
      </div>
    );
  }

  // 3. Inactive day
  const textCls = day.isCurrentMonth
    ? 'text-slate-700 dark:text-slate-200 font-semibold'
    : 'text-slate-300 dark:text-slate-600';
  const cornerCls = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';

  return (
    <div className={`relative flex flex-col items-center justify-center h-8 text-xs group-hover:bg-slate-100 dark:group-hover:bg-white/5 ${textCls} ${cornerCls}`}>
      <span className="leading-none">{day.dayNum}</span>
      {day.isToday && <span className="w-1 h-1 rounded-full mt-0.5 bg-rose-500" />}
    </div>
  );
};
