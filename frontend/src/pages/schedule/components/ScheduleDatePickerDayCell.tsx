import React from 'react';
import { motion } from 'framer-motion';
import { WeekDayItem, DateRangeSegment } from './scheduleDatePickerHelper';

interface ScheduleDatePickerDayCellProps {
  day: WeekDayItem;
  dayIndex?: number;
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
  segments,
  isPicking,
  pickingStart,
  hoverDate,
  isHovered,
  hoverLayoutId,
  onDayClick,
  onDayHover,
}) => {
  // Find if day belongs to any active segment
  const matchingSegment = segments.find(
    (seg) => day.dateStr >= seg.startStr && day.dateStr <= seg.endStr
  );

  const inRange = !!matchingSegment;
  const isStartEndpoint = !!matchingSegment && day.dateStr === matchingSegment.startStr;
  const isEndEndpoint = !!matchingSegment && day.dateStr === matchingSegment.endStr;
  const isEndpoint = isStartEndpoint || isEndEndpoint;

  // Check if this day is currently hovered while picking the end date
  const isHoveredTarget = isPicking && !!hoverDate && day.dateStr === hoverDate && day.dateStr !== pickingStart;

  // Text color styling
  const textStyle = isEndpoint
    ? 'text-white font-black'
    : isHoveredTarget
    ? 'text-blue-600 dark:text-blue-300 font-extrabold'
    : inRange
    ? 'text-blue-800 dark:text-blue-200 font-bold'
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
      {/* 1. Sliding hover pill with soft shadow/glow behind hovered day (matching segmented button indicator) */}
      {isHovered && !isEndpoint && (
        <motion.div
          layoutId={hoverLayoutId}
          className="absolute z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-200/90 dark:bg-[#5c36f5]/30 border border-slate-300/50 dark:border-[#5c36f5]/40 shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:shadow-[0_0_14px_rgba(92,54,245,0.45)] pointer-events-none"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      {/* 2. Discrete in-range circular badge (NO whole-row highlight strip) */}
      {inRange && !isEndpoint && (
        <div className="absolute z-5 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-blue-100/70 dark:bg-[#5c36f5]/20 pointer-events-none" />
      )}

      {/* 3. Live target preview indicator when dragging/picking */}
      {isHoveredTarget && (
        <div className="absolute z-10 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full border border-blue-500 dark:border-blue-400 bg-blue-500/15 pointer-events-none" />
      )}

      {/* 4. Crisp Solid Primary Endpoint Badge (Start / End Date) - No whole-row strip, renders reliably for all segments */}
      {isEndpoint && (
        <div
          className={`absolute z-10 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-blue-600 dark:bg-[#5c36f5] shadow-xs pointer-events-none transition-transform duration-150 ${
            isHovered ? 'scale-105 shadow-[0_0_12px_rgba(92,54,245,0.6)]' : ''
          }`}
        />
      )}

      {/* 5. Day Number & Today Dot Indicator */}
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
