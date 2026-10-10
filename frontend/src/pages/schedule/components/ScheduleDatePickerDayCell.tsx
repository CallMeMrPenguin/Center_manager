import React from 'react';
import { motion } from 'framer-motion';
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

  // Determine highlight range and endpoints
  let inRange = false;
  let isStartEndpoint = false;
  let isEndEndpoint = false;

  if (scope === 'all') {
    if (day.isCurrentMonth) {
      inRange = true;
      isStartEndpoint = day.dayNum === 1;
      isEndEndpoint = day.dayNum === daysInMonth;
    }
  } else if (scope === 'week') {
    if (isConsecutiveWeeks && selectedWeeksList.length > 0) {
      if (day.dateStr >= minSelectedStartStr && day.dateStr <= maxSelectedEndStr) {
        inRange = true;
        isStartEndpoint = day.dateStr === minSelectedStartStr;
        isEndEndpoint = day.dateStr === maxSelectedEndStr;
      }
    } else if (isWeekRowSelected) {
      inRange = true;
      isStartEndpoint = isFirst;
      isEndEndpoint = isLast;
    }
  }

  const isEndpoint = isStartEndpoint || isEndEndpoint;

  // Connector states for continuous highlight ribbon
  const hasLeftConnector = inRange && !isStartEndpoint && !isFirst;
  const hasRightConnector = inRange && !isEndEndpoint && !isLast;
  const isInteriorHighlighted = inRange && !isStartEndpoint && !isEndEndpoint;

  // Row edge rounding
  const rowEdgeRounding = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';

  // Determine text color styles
  const textStyle = isEndpoint
    ? 'text-white font-black'
    : inRange
    ? 'text-blue-900 dark:text-blue-100 font-extrabold'
    : day.isCurrentMonth
    ? 'text-slate-700 dark:text-slate-200 font-semibold'
    : 'text-slate-300 dark:text-slate-600 font-normal';

  return (
    <div className="relative flex items-center justify-center h-8 select-none group">
      {/* 1. Left connector ribbon bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          hasLeftConnector ? 'opacity-100 scale-x-100 origin-left' : 'opacity-0 scale-x-0 origin-right'
        }`}
      />

      {/* 2. Right connector ribbon bar */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          hasRightConnector ? 'opacity-100 scale-x-100 origin-right' : 'opacity-0 scale-x-0 origin-left'
        }`}
      />

      {/* 3. Center highlight ribbon fill for interior days */}
      <div
        className={`absolute inset-0 bg-blue-100 dark:bg-blue-900/40 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isInteriorHighlighted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        } ${rowEdgeRounding}`}
      />

      {/* 4. Subtle translucent hover pill (matches segmented button / horizontal menu in reports) */}
      {!isEndpoint && (
        <div className="absolute inset-0.5 rounded-xl bg-slate-200/60 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none" />
      )}

      {/* 5. Start endpoint gliding pill badge (layoutId animation glides to destination cell) */}
      {isStartEndpoint && (
        <motion.div
          layoutId="schedule-datepicker-start-point"
          transition={{ type: 'spring', stiffness: 460, damping: 32 }}
          className="absolute z-10 w-7 h-7 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] pointer-events-none"
        />
      )}

      {/* 6. End endpoint gliding pill badge (layoutId animation glides to destination cell) */}
      {isEndEndpoint && !isStartEndpoint && (
        <motion.div
          layoutId="schedule-datepicker-end-point"
          transition={{ type: 'spring', stiffness: 460, damping: 32 }}
          className="absolute z-10 w-7 h-7 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] pointer-events-none"
        />
      )}

      {/* 7. Day number text & today dot indicator */}
      <div className={`relative z-20 flex flex-col items-center justify-center transition-colors duration-300 text-xs ${textStyle}`}>
        <span className="leading-none">{day.dayNum}</span>
        {day.isToday && (
          <span
            className={`w-1 h-1 rounded-full mt-0.5 transition-colors duration-300 ${
              isEndpoint ? 'bg-white' : 'bg-rose-500'
            }`}
          />
        )}
      </div>
    </div>
  );
};
