import React from 'react';
import { motion } from 'framer-motion';
import { WeekDayItem, DateRangeSegment } from './scheduleDatePickerHelper';

interface ScheduleDatePickerDayCellProps {
  day: WeekDayItem;
  dayIndex: number;
  segments: DateRangeSegment[];
  isPicking: boolean;
  pickingStart?: string | null;
  hoverDate?: string | null;
  onDayClick: (dateStr: string) => void;
  onDayHover: (dateStr: string) => void;
}

export const ScheduleDatePickerDayCell: React.FC<ScheduleDatePickerDayCellProps> = ({
  day,
  dayIndex,
  segments,
  isPicking,
  pickingStart,
  hoverDate,
  onDayClick,
  onDayHover,
}) => {
  const isFirstCol = dayIndex === 0;
  const isLastCol = dayIndex === 6;

  // Find if day belongs to any active segment (including preview segment when picking)
  const matchingSegment = segments.find(
    (seg) => day.dateStr >= seg.startStr && day.dateStr <= seg.endStr
  );

  const inRange = !!matchingSegment;
  const isStartEndpoint = !!matchingSegment && day.dateStr === matchingSegment.startStr;
  const isEndEndpoint = !!matchingSegment && day.dateStr === matchingSegment.endStr;
  const isSingleDayRange = isStartEndpoint && isEndEndpoint;
  const isInterior = inRange && !isStartEndpoint && !isEndEndpoint;

  // Check if this day is currently hovered while picking the end date
  const isHoveredTarget = isPicking && !!hoverDate && day.dateStr === hoverDate && day.dateStr !== pickingStart;

  // Ribbon connectors (matching ngxsmk-datepicker range-background styling)
  const hasLeftConnector = inRange && !isSingleDayRange && (!isStartEndpoint || (isStartEndpoint && isEndEndpoint));
  const hasRightConnector = inRange && !isSingleDayRange && (!isEndEndpoint || (isStartEndpoint && isEndEndpoint));

  // Row edge rounding for Monday & Sunday
  const rowEdgeRounding = isFirstCol ? 'rounded-l-full' : isLastCol ? 'rounded-r-full' : '';

  // Text color styling
  const isEndpoint = isStartEndpoint || isEndEndpoint;
  const textStyle = isEndpoint
    ? 'text-white font-black'
    : isHoveredTarget
    ? 'text-blue-600 dark:text-blue-300 font-extrabold'
    : inRange
    ? 'text-blue-900 dark:text-blue-100 font-extrabold'
    : day.isCurrentMonth
    ? 'text-slate-700 dark:text-slate-200 font-semibold group-hover:text-blue-600 dark:group-hover:text-white'
    : 'text-slate-300 dark:text-slate-600 font-normal';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onDayClick(day.dateStr);
      }}
      onMouseEnter={() => onDayHover(day.dateStr)}
      className="relative flex items-center justify-center h-8 sm:h-8.5 select-none group cursor-pointer"
    >
      {/* 1. Left range connector ribbon */}
      {hasLeftConnector && (
        <div
          className={`absolute left-0 top-1 bottom-1 w-1/2 bg-blue-100/90 dark:bg-[#5c36f5]/25 pointer-events-none transition-all duration-150 ease-out ${
            isFirstCol ? 'rounded-l-full' : ''
          }`}
        />
      )}

      {/* 2. Right range connector ribbon */}
      {hasRightConnector && (
        <div
          className={`absolute right-0 top-1 bottom-1 w-1/2 bg-blue-100/90 dark:bg-[#5c36f5]/25 pointer-events-none transition-all duration-150 ease-out ${
            isLastCol ? 'rounded-r-full' : ''
          }`}
        />
      )}

      {/* 3. Center ribbon fill for interior days */}
      {isInterior && (
        <div
          className={`absolute inset-x-0 top-1 bottom-1 bg-blue-100/90 dark:bg-[#5c36f5]/25 pointer-events-none transition-all duration-150 ease-out ${rowEdgeRounding}`}
        />
      )}

      {/* 4. Unselected Day hover circle pill (matching ngxsmk-datepicker scale3d(1.1) hover) */}
      {!isEndpoint && !isHoveredTarget && (
        <div
          className="absolute w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-100/80 dark:bg-white/10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-105 transition-all duration-150 ease-out pointer-events-none"
        />
      )}

      {/* 5. Live target preview indicator (when dragging/hovering to pick end date) */}
      {isHoveredTarget && (
        <div className="absolute z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border-2 border-dashed border-blue-500 dark:border-blue-400 bg-blue-500/15 dark:bg-blue-400/20 scale-105 animate-pulse pointer-events-none" />
      )}

      {/* 6. Solid Primary Endpoint Badge (Start / End Date) */}
      {isStartEndpoint && (
        <motion.div
          layoutId={isSingleDayRange ? 'schedule-range-single' : 'schedule-range-start'}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-blue-600 dark:bg-[#5c36f5] shadow-[0_0_12px_rgba(92,54,245,0.45)] dark:shadow-[0_0_14px_rgba(92,54,245,0.6)] pointer-events-none"
        />
      )}

      {isEndEndpoint && !isStartEndpoint && (
        <motion.div
          layoutId="schedule-range-end"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-blue-600 dark:bg-[#5c36f5] shadow-[0_0_12px_rgba(92,54,245,0.45)] dark:shadow-[0_0_14px_rgba(92,54,245,0.6)] pointer-events-none"
        />
      )}

      {/* 7. Day Number & Today Dot Indicator */}
      <div className={`relative z-20 flex flex-col items-center justify-center transition-all duration-150 text-xs ${textStyle}`}>
        <span className="leading-none transition-transform duration-150 group-hover:scale-110">
          {day.dayNum}
        </span>
        {day.isToday && (
          <span
            className={`w-1 h-1 rounded-full mt-0.5 transition-colors duration-150 ${
              isEndpoint ? 'bg-white' : 'bg-rose-500'
            }`}
          />
        )}
      </div>
    </div>
  );
};
