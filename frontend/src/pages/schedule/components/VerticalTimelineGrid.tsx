import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { ClassSession } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { getVietnamHoliday } from '../../../utils/vietnamHolidays';
import { computeDynamicHourRange } from './timelineHelpers';
import {
  DayColumnData,
  computeVerticalDayLayouts,
} from './verticalTimelineHelpers';
import { VerticalTimelineSessionCard } from './VerticalTimelineSessionCard';

interface VerticalTimelineGridProps {
  viewMode: 'month' | 'week';
  days: DayColumnData[];
  sessions: ClassSession[];
  today: string;
  changeWeek?: (dir: number) => void;
  setWeekStartToday?: () => void;
  weekRangeText?: string;
  openAdd: (dateStr?: string) => void;
  openEdit: (sess: ClassSession) => void;
  setCtxMenu?: (menu: { x: number; y: number; dateStr: string } | null) => void;
  viewModeToggle?: React.ReactNode;
}

export const VerticalTimelineGrid: React.FC<VerticalTimelineGridProps> = ({
  days,
  sessions,
  today,
  openAdd,
  openEdit,
  viewModeToggle,
}) => {
  const { isDark } = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Default hour row height: 55px on mobile, 70px on desktop
  const [hourHeight, setHourHeight] = useState<number>(() => (isMobile ? 55 : 70));
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Free-Pan Drag State
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const scrollPosRef = useRef({ left: 0, top: 0 });
  const hasMovedRef = useRef(false);

  // Dynamic Hour Range based on visible sessions
  const { startHour, hours, totalHours } = useMemo(
    () => computeDynamicHourRange(sessions),
    [sessions]
  );

  // Zoom handlers: min 45px, max 140px
  const handleZoomIn = useCallback(() => {
    setHourHeight((prev) => Math.min(140, prev + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setHourHeight((prev) => Math.max(45, prev - 10));
  }, []);

  const handleResetZoom = useCallback(() => {
    setHourHeight(isMobile ? 55 : 70);
  }, [isMobile]);

  // Keyboard zoom shortcuts (+ and -)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut]);

  // Mouse drag pan event listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    scrollPosRef.current = { left: container.scrollLeft, top: container.scrollTop };
    container.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }
    container.scrollLeft = scrollPosRef.current.left - dx;
    container.scrollTop = scrollPosRef.current.top - dy;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  // Group sessions per day
  const sessionsByDay = useMemo(() => {
    const map: Record<string, ClassSession[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const totalGridHeight = totalHours * hourHeight;
  const isFewDays = days.length <= 7;

  return (
    <div className="flex-1 min-h-0 flex flex-col select-none bg-slate-100 dark:bg-[#0c101d]">
      {/* ── TOOLBAR: Zoom Controls & View Mode ──────── */}
      <div className="bg-slate-50 dark:bg-[#131a2c] border-b border-slate-200 dark:border-white/10 px-4 py-2 flex items-center justify-end gap-2.5 shrink-0">
        {/* Zoom Controls (+ and -) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-[#111728] border border-slate-200 dark:border-white/10 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={hourHeight <= 45}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer border-0"
              title="Thu nhỏ tỉ lệ giờ (Phím -)"
            >
              <ZoomOut size={13} />
            </button>

            <span
              onClick={handleResetZoom}
              className="px-2 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 transition"
              title="Đặt lại mức chuẩn 70px"
            >
              {Math.round((hourHeight / 70) * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={hourHeight >= 140}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer border-0"
              title="Phóng to tỉ lệ giờ (Phím +)"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {viewModeToggle}
        </div>
      </div>

      {/* ── VERTICAL CANVAS (X=Days as Columns, Y=Hours as Rows) ──────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 min-h-0 overflow-auto cursor-grab relative"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="min-w-full flex flex-col relative" style={{ minWidth: isFewDays ? '100%' : `${64 + days.length * 150}px` }}>
          {/* Sticky Top Header: Day Columns (100% Solid, No Transparency) */}
          <div className="sticky top-0 z-30 flex bg-slate-200 dark:bg-[#111728] border-b border-slate-300 dark:border-white/10">
            {/* Top-Left Corner Cell: Hour Axis Label */}
            <div className="sticky left-0 z-40 w-[64px] shrink-0 p-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-[#111728] border-r border-slate-300 dark:border-white/10 flex items-center justify-center">
              GIỜ
            </div>

            {/* Day Column Headers */}
            <div className="flex flex-1 min-w-0">
              {days.map((d) => {
                const daySess = sessionsByDay[d.dateStr] || [];
                const isToday = d.dateStr === today;
                const holiday = getVietnamHoliday(d.dateStr);

                return (
                  <div
                    key={d.dateStr}
                    className={`border-r border-slate-300 dark:border-white/10 p-2 flex flex-col justify-between ${
                      isFewDays ? 'flex-1 min-w-[130px]' : 'w-[150px] shrink-0'
                    } ${
                      isToday
                        ? 'bg-blue-100 dark:bg-[#152042]'
                        : holiday?.isPublicHoliday
                        ? 'bg-rose-100 dark:bg-[#24131d]'
                        : d.isWeekend
                        ? 'bg-rose-50 dark:bg-[#1c1322]'
                        : 'bg-slate-100 dark:bg-[#0f1424]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider ${
                          isToday
                            ? 'text-blue-600 dark:text-blue-400'
                            : holiday?.isPublicHoliday
                            ? 'text-rose-600 dark:text-rose-400'
                            : d.isWeekend
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {d.header}
                      </span>
                      {isToday && (
                        <span className="text-[8.5px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    {/* Holiday Badge (nếu có) - Wrap thoải mái & loại bỏ (date) thừa */}
                    {holiday && (() => {
                      const cleanHolidayName = holiday.name
                        .replace(/\s*\(\s*\d+[\/-]\d+(\s*(?:AL|DL))?\s*\)/gi, '')
                        .trim();

                      return (
                        <div
                          className={`mt-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded flex items-start justify-between gap-1 max-w-full ${
                            holiday.isPublicHoliday
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          }`}
                          title={holiday.name}
                        >
                          <span className="whitespace-normal break-words leading-tight flex-1">
                            {cleanHolidayName}
                          </span>
                          {holiday.isPublicHoliday && (
                            <span className="shrink-0 text-[7px] font-black uppercase px-1 py-0.2 rounded bg-rose-500/25 text-rose-600 dark:text-rose-200 mt-0.5">
                              Nghỉ
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{d.subText}</span>
                      {daySess.length > 0 && (
                        <span className="text-[9px] font-sans font-extrabold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300">
                          {daySess.length} ca
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Body: Sticky Left Hours + Day Columns */}
          <div className="flex relative" style={{ height: `${totalGridHeight}px` }}>
            {/* Sticky Left Hour Column (Solid 100% Opaque) */}
            <div className="sticky left-0 z-20 w-[64px] shrink-0 bg-slate-100 dark:bg-[#111728] border-r border-slate-300 dark:border-white/10 flex flex-col">
              {hours.slice(0, totalHours).map((h) => (
                <div
                  key={h}
                  style={{ height: `${hourHeight}px` }}
                  className="border-b border-slate-200/80 dark:border-white/10 text-center pt-1 text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400 relative"
                >
                  <span>{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Day Columns Track */}
            <div className="flex flex-1 min-w-0 relative">
              {days.map((d) => {
                const daySess = sessionsByDay[d.dateStr] || [];
                const isToday = d.dateStr === today;
                const holiday = getVietnamHoliday(d.dateStr);
                const sessionLayouts = computeVerticalDayLayouts(daySess, startHour, hourHeight);

                return (
                  <div
                    key={d.dateStr}
                    className={`border-r border-slate-200/70 dark:border-white/10 relative transition-colors ${
                      isFewDays ? 'flex-1 min-w-[130px]' : 'w-[150px] shrink-0'
                    } ${
                      isToday
                        ? 'bg-blue-50/20 dark:bg-[#131b32]/35'
                        : holiday?.isPublicHoliday
                        ? 'bg-rose-50/15 dark:bg-[#20121a]/25'
                        : d.isWeekend
                        ? 'bg-rose-50/10 dark:bg-[#19111e]/15'
                        : 'bg-white dark:bg-[#0c101d]'
                    }`}
                    onDoubleClick={() => {
                      if (hasMovedRef.current) return;
                      openAdd(d.dateStr);
                    }}
                  >
                    {/* Hour Horizontal Grid Lines */}
                    {hours.slice(0, totalHours).map((h) => (
                      <div
                        key={h}
                        style={{ height: `${hourHeight}px` }}
                        className="w-full border-b border-slate-200/60 dark:border-white/5 relative pointer-events-none"
                      >
                        {/* 30-min subtle dashed line */}
                        <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-200/40 dark:border-white/[0.03]" />
                      </div>
                    ))}

                    {/* Render Session Cards within this day column */}
                    {sessionLayouts.map(({ session, top, height, leftPct, widthPct }) => (
                      <VerticalTimelineSessionCard
                        key={session.id}
                        session={session}
                        top={top}
                        height={height}
                        leftPct={leftPct}
                        widthPct={widthPct}
                        isDark={isDark}
                        onClick={() => openEdit(session)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
