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
  isHovered: boolean;
  hoverLayoutId: string;
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
  isHovered,
  hoverLayoutId,
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
  const isEndpoint = isStartEndpoint || isEndEndpoint;

  // Check if this day is currently hovered while picking the end date
  const isHoveredTarget = isPicking && !!hoverDate && day.dateStr === hoverDate && day.dateStr !== pickingStart;

  // Ribbon connectors (clean solid ribbons without blur)
  const hasLeftConnector = inRange && !isSingleDayRange && !isStartEndpoint;
  const hasRightConnector = inRange && !isSingleDayRange && !isEndEndpoint;

  // Row edge rounding for Monday & Sunday
  const rowEdgeRounding = isFirstCol ? 'rounded-l-full' : isLastCol ? 'rounded-r-full' : '';

  // Text color styling
  const textStyle = isEndpoint
    ? 'text-white font-black'
    : isHoveredTarget
    ? 'text-blue-600 dark:text-blue-300 font-extrabold'
    : inRange
    ? 'text-blue-900 dark:text-blue-100 font-extrabold'
    : isHovered
    ? 'text-blue-600 dark:text-blue-300 font-bold'
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
      className="relative flex items-center justify-center h-7 sm:h-7.5 select-none cursor-pointer"
    >
      {/* 1. Left range connector ribbon for selected range */}
      {hasLeftConnector && (
        <div
          className={`absolute left-0 top-0.5 bottom-0.5 w-1/2 bg-blue-100/90 dark:bg-[#5c36f5]/25 pointer-events-none transition-colors duration-150 ${
            isFirstCol ? 'rounded-l-full' : ''
          }`}
        />
      )}

      {/* 2. Right range connector ribbon for selected range */}
      {hasRightConnector && (
        <div
          className={`absolute right-0 top-0.5 bottom-0.5 w-1/2 bg-blue-100/90 dark:bg-[#5c36f5]/25 pointer-events-none transition-colors duration-150 ${
            isLastCol ? 'rounded-r-full' : ''
          }`}
        />
      )}

      {/* 3. Center ribbon fill for interior days of selected range */}
      {isInterior && (
        <div
          className={`absolute inset-x-0 top-0.5 bottom-0.5 bg-blue-100/90 dark:bg-[#5c36f5]/25 pointer-events-none transition-colors duration-150 ${rowEdgeRounding}`}
        />
      )}

      {/* 4. Sliding hover pill with soft shadow/glow behind hovered day (matching segmented button indicator) */}
      {isHovered && !isEndpoint && (
        <motion.div
          layoutId={hoverLayoutId}
          className="absolute z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-200/90 dark:bg-[#5c36f5]/30 border border-slate-300/50 dark:border-[#5c36f5]/40 shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:shadow-[0_0_14px_rgba(92,54,245,0.45)] pointer-events-none"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      {/* 5. Live target preview indicator (when picking end date) */}
      {isHoveredTarget && (
        <div className="absolute z-10 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full border border-blue-500 dark:border-blue-400 bg-blue-500/15 pointer-events-none" />
      )}

      {/* 6. Crisp Solid Primary Endpoint Badge (Start / End Date) - Renders reliably across all segments */}
      {isEndpoint && (
        <div
          className={`absolute z-10 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-blue-600 dark:bg-[#5c36f5] shadow-xs pointer-events-none transition-transform duration-150 ${
            isHovered ? 'scale-105 shadow-[0_0_12px_rgba(92,54,245,0.6)]' : ''
          }`}
        />
      )}

      {/* 7. Day Number & Today Dot Indicator */}
      <div className={`relative z-20 flex flex-col items-center justify-center transition-colors duration-150 text-xs ${textStyle}`}>
        <span className="leading-none select-none">
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
