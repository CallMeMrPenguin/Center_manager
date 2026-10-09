import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ClassSession } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { HorizontalTimelineSessionCard } from './HorizontalTimelineSessionCard';
import { getVietnamHoliday } from '../../../utils/vietnamHolidays';
import {
  DayRowData,
  computeDynamicHourRange,
  computeDayTrackLayouts,
} from './timelineHelpers';

export type { DayRowData };

interface HorizontalTimelineGridProps {
  viewMode: 'month' | 'week';
  days: DayRowData[];
  sessions: ClassSession[];
  today: string;
  changeWeek?: (dir: number) => void;
  setWeekStartToday?: () => void;
  weekRangeText?: string;
  openAdd: (dateStr?: string) => void;
  openEdit: (sess: ClassSession) => void;
  setCtxMenu?: (menu: { x: number; y: number; dateStr: string } | null) => void;
}

export const HorizontalTimelineGrid: React.FC<HorizontalTimelineGridProps> = ({
  viewMode,
  days,
  sessions,
  today,
  changeWeek,
  setWeekStartToday,
  weekRangeText,
  openAdd,
  openEdit,
  setCtxMenu,
}) => {
  const { isDark } = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Default hour column width: 70px on mobile (50%), 140px on desktop (100%)
  const [hourWidth, setHourWidth] = useState<number>(() => (isMobile ? 70 : 140));
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

  // Zoom handlers: min 50% (70px), max 200% (280px)
  const handleZoomIn = useCallback(() => {
    setHourWidth((prev) => Math.min(280, prev + 15));
  }, []);

  const handleZoomOut = useCallback(() => {
    setHourWidth((prev) => Math.max(70, prev - 15));
  }, []);

  const handleResetZoom = useCallback(() => {
    setHourWidth(isMobile ? 70 : 140);
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

  const timelineTrackWidth = totalHours * hourWidth;

  return (
    <div className="flex-1 min-h-0 flex flex-col select-none bg-slate-100 dark:bg-[#0c101d]">
      {/* ── TIMELINE TOOLBAR (Week Nav + Zoom Controls +/-) ──────────────── */}
      <div className="bg-slate-50 dark:bg-[#131a2c] border-b border-slate-200 dark:border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Timeline title */}
        <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span>{viewMode === 'week' ? 'LỊCH HỌC THEO TUẦN' : 'LỊCH HỌC THEO THÁNG'}</span>
          <span className="text-[11px] text-slate-400 font-bold font-mono">({days.length} ngày)</span>
        </div>

        {/* Right: Zoom Controls (+ and -) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-[#111728] border border-slate-200 dark:border-white/10 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={hourWidth <= 75}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Thu nhỏ tỉ lệ giờ (Phím -)"
            >
              <ZoomOut size={13} />
            </button>

            <span
              onClick={handleResetZoom}
              className="px-2 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 transition"
              title="Đặt lại mức chuẩn 140px"
            >
              {Math.round((hourWidth / 140) * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={hourWidth >= 280}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Phóng to tỉ lệ giờ (Phím +)"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TIMELINE CANVAS (2D Drag Pan Viewport) ───────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 min-h-0 overflow-auto cursor-grab relative"
        style={{ scrollBehavior: 'auto' }}
      >
        <div style={{ minWidth: `${140 + timelineTrackWidth}px` }} className="relative flex flex-col">
          {/* Sticky Top Header: Hour Scale (Solid 100% Opaque, No Transparency) */}
          <div className="sticky top-0 z-30 flex bg-slate-200 dark:bg-[#111728] border-b border-slate-300 dark:border-white/10">
            {/* Corner Cell: Y-Axis Label */}
            <div className="sticky left-0 z-40 w-[140px] shrink-0 p-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-[#111728] border-r border-slate-300 dark:border-white/10 flex items-center justify-center">
              THỨ / NGÀY
            </div>

            {/* Hour Markers */}
            <div className="flex relative" style={{ width: `${timelineTrackWidth}px` }}>
              {hours.slice(0, totalHours).map((h) => (
                <div
                  key={h}
                  style={{ width: `${hourWidth}px` }}
                  className="shrink-0 border-r border-slate-300/70 dark:border-white/10 text-center py-2 text-[10px] font-mono font-extrabold text-slate-600 dark:text-slate-400"
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Day Rows */}
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {days.map((d) => {
              const daySess = sessionsByDay[d.dateStr] || [];
              const isToday = d.dateStr === today;
              const holiday = getVietnamHoliday(d.dateStr);
              const { layouts, rowHeight } = computeDayTrackLayouts(daySess);

              return (
                <div
                  key={d.dateStr}
                  style={{ height: `${rowHeight}px` }}
                  className={`flex relative transition-colors ${
                    isToday
                      ? 'bg-blue-50/40 dark:bg-[#131b32]/60'
                      : holiday?.isPublicHoliday
                      ? 'bg-rose-50/30 dark:bg-[#20121a]/50'
                      : d.isWeekend
                      ? 'bg-rose-50/15 dark:bg-[#19111e]/30'
                      : 'bg-white dark:bg-[#0c101d]'
                  }`}
                  onDoubleClick={() => {
                    if (hasMovedRef.current) return;
                    openAdd(d.dateStr);
                  }}
                >
                  {/* Sticky Left Day Header (Solid 100% Opaque, No Transparency) */}
                  <div
                    className={`sticky left-0 z-20 w-[140px] shrink-0 p-2 border-r border-slate-300 dark:border-white/10 flex flex-col justify-between ${
                      isToday
                        ? 'bg-blue-100 dark:bg-[#152042]'
                        : holiday?.isPublicHoliday
                        ? 'bg-rose-100 dark:bg-[#24131d]'
                        : d.isWeekend
                        ? 'bg-rose-50 dark:bg-[#1c1322]'
                        : 'bg-slate-100 dark:bg-[#0f1424]'
                    }`}
                  >
                    <div>
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

                      {/* Holiday Badge (Tết, 30/4, 1/5, 2/9, Giỗ Tổ, etc.) */}
                      {holiday && (
                        <div
                          className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center justify-between gap-1 max-w-full overflow-hidden ${
                            holiday.isPublicHoliday
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          }`}
                          title={holiday.name}
                        >
                          <span className="truncate block max-w-full leading-tight select-none" title={holiday.name}>
                            {holiday.name}
                          </span>
                          {holiday.isPublicHoliday && (
                            <span className="shrink-0 text-[7.5px] font-black uppercase tracking-tight">
                              Nghỉ
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      <span>{d.subText}</span>
                      {daySess.length > 0 && (
                        <span className="text-[9.5px] font-sans font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300">
                          {daySess.length} ca
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Timeline Track */}
                  <div
                    style={{ width: `${timelineTrackWidth}px` }}
                    className="relative shrink-0 flex"
                  >
                    {/* Hour Vertical Grid Lines */}
                    {hours.slice(0, totalHours).map((h) => (
                      <div
                        key={h}
                        style={{ width: `${hourWidth}px` }}
                        className="shrink-0 h-full border-r border-slate-200/60 dark:border-white/5 relative pointer-events-none"
                      >
                        {/* 30-min subtle dashed line */}
                        <div className="absolute top-0 bottom-0 left-1/2 border-r border-dashed border-slate-200/40 dark:border-white/[0.03]" />
                      </div>
                    ))}

                    {/* Render Session Cards for this day */}
                    {layouts.map(({ session, trackIdx }) => (
                      <HorizontalTimelineSessionCard
                        key={session.id}
                        session={session}
                        hourWidth={hourWidth}
                        startHour={startHour}
                        isDark={isDark}
                        topOffset={6 + trackIdx * 76}
                        height={68}
                        onClick={() => openEdit(session)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
