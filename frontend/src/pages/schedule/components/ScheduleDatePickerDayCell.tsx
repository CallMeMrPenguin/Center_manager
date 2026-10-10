import React from 'react';
import { motion } from 'framer-motion';
import { WeekDayItem, DateRangeSegment } from './scheduleDatePickerHelper';

interface ScheduleDatePickerDayCellProps {
  day: WeekDayItem;
  dayIndex: number;
  segments: DateRangeSegment[];
  isPicking: boolean;
  onDayClick: (dateStr: string) => void;
  onDayHover: (dateStr: string) => void;
}

export const ScheduleDatePickerDayCell: React.FC<ScheduleDatePickerDayCellProps> = ({
  day,
  dayIndex,
  segments,
  isPicking,
  onDayClick,
  onDayHover,
}) => {
  const isFirst = dayIndex === 0;
  const isLast = dayIndex === 6;

  // Find if day belongs to any contiguous island segment
  const matchingSegment = segments.find(
    (seg) => day.dateStr >= seg.startStr && day.dateStr <= seg.endStr
  );

  const inRange = !!matchingSegment;
  const isStartEndpoint = !!matchingSegment && day.dateStr === matchingSegment.startStr;
  const isEndEndpoint = !!matchingSegment && day.dateStr === matchingSegment.endStr;
  const isEndpoint = isStartEndpoint || isEndEndpoint;

  // Horizontal ribbon connectors: connects left if in range and not start of segment and not Monday
  const hasLeftConnector = inRange && !isStartEndpoint && !isFirst;
  // Connects right if in range and not end of segment and not Sunday
  const hasRightConnector = inRange && !isEndEndpoint && !isLast;
  // Center ribbon fill
  const isInteriorHighlighted = inRange && !isStartEndpoint && !isEndEndpoint;

  const rowEdgeRounding = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';

  // Text color styling
  const textStyle = isEndpoint
    ? 'text-white font-black'
    : inRange
    ? 'text-blue-900 dark:text-blue-100 font-extrabold'
    : day.isCurrentMonth
    ? 'text-slate-700 dark:text-slate-200 font-semibold'
    : 'text-slate-300 dark:text-slate-600 font-normal';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onDayClick(day.dateStr);
      }}
      onMouseEnter={() => onDayHover(day.dateStr)}
      className="relative flex items-center justify-center h-8 select-none group cursor-pointer"
    >
      {/* 1. Left connector ribbon bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40 pointer-events-none transition-all duration-200 ease-out ${
          hasLeftConnector ? 'opacity-100 scale-x-100 origin-left' : 'opacity-0 scale-x-0 origin-right'
        }`}
      />

      {/* 2. Right connector ribbon bar */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40 pointer-events-none transition-all duration-200 ease-out ${
          hasRightConnector ? 'opacity-100 scale-x-100 origin-right' : 'opacity-0 scale-x-0 origin-left'
        }`}
      />

      {/* 3. Center highlight ribbon fill */}
      <div
        className={`absolute inset-0 bg-blue-100 dark:bg-blue-900/40 pointer-events-none transition-all duration-200 ease-out ${
          isInteriorHighlighted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        } ${rowEdgeRounding}`}
      />

      {/* 4. Subtle translucent hover pill (active on unselected days or when not endpoint) */}
      {!isEndpoint && (
        <div
          className={`absolute inset-0.5 rounded-xl bg-slate-200/60 dark:bg-white/10 transition-all duration-200 ease-out pointer-events-none ${
            isPicking ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
      )}

      {/* 5. Start endpoint badge (layoutId animated glide to destination cell) */}
      {isStartEndpoint && (
        <motion.div
          layoutId="schedule-datepicker-start-point"
          transition={{ type: 'spring', stiffness: 480, damping: 32 }}
          className="absolute z-10 w-7 h-7 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] pointer-events-none"
        />
      )}

      {/* 6. End endpoint badge (layoutId animated glide to destination cell) */}
      {isEndEndpoint && !isStartEndpoint && (
        <motion.div
          layoutId="schedule-datepicker-end-point"
          transition={{ type: 'spring', stiffness: 480, damping: 32 }}
          className="absolute z-10 w-7 h-7 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] pointer-events-none"
        />
      )}

      {/* 7. Day number text & today dot indicator */}
      <div className={`relative z-20 flex flex-col items-center justify-center transition-colors duration-200 text-xs ${textStyle}`}>
        <span className="leading-none">{day.dayNum}</span>
        {day.isToday && (
          <span
            className={`w-1 h-1 rounded-full mt-0.5 transition-colors duration-200 ${
              isEndpoint ? 'bg-white' : 'bg-rose-500'
            }`}
          />
        )}
      </div>
    </div>
  );
};
