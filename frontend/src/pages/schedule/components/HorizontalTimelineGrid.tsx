import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ClassSession, parseTimeToMinutes, DAY_NUM, DAYS } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { HorizontalTimelineSessionCard } from './HorizontalTimelineSessionCard';

const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 15 hours: 07:00 to 22:00
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

interface DayRowData {
  header: string; // e.g. "Thứ 2"
  dateStr: string; // "YYYY-MM-DD"
  subText: string; // "12/10"
  isToday: boolean;
  isWeekend: boolean;
}

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
  const [hourWidth, setHourWidth] = useState<number>(100); // 100px per hour
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Free-Pan Drag State
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const scrollPosRef = useRef({ left: 0, top: 0 });
  const hasMovedRef = useRef(false);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setHourWidth((prev) => Math.min(180, prev + 15));
  }, []);

  const handleZoomOut = useCallback(() => {
    setHourWidth((prev) => Math.max(55, prev - 15));
  }, []);

  const handleResetZoom = useCallback(() => {
    setHourWidth(100);
  }, []);

  // Keyboard zoom shortcut (+ and -)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
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
    if (e.button !== 0) return; // Only left mouse button
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

  // Group and layout sessions per day
  const sessionsByDay = useMemo(() => {
    const map: Record<string, ClassSession[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  // Current time marker position (if today is rendered)
  const currentTimeLeft = useMemo(() => {
    const now = new Date();
    const curH = now.getHours();
    const curM = now.getMinutes();
    if (curH < START_HOUR || curH > END_HOUR) return null;
    return (((curH - START_HOUR) * 60 + curM) / 60) * hourWidth;
  }, [hourWidth]);

  const timelineTrackWidth = TOTAL_HOURS * hourWidth;

  return (
    <div className="flex-1 min-h-0 flex flex-col select-none bg-slate-100 dark:bg-[#0c101d]">
      {/* ── TIMELINE TOOLBAR (Week Nav + Zoom Controls +/-) ──────────────── */}
      <div className="bg-slate-50 dark:bg-[#131a2c] border-b border-slate-200 dark:border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Week Navigation (if in week mode) */}
        {viewMode === 'week' && changeWeek && weekRangeText ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeWeek(-1)}
              className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/70 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer border-0 shadow-2xs"
              title="Tuần trước"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-black text-slate-900 dark:text-white min-w-[150px] text-center font-mono">
              {weekRangeText}
            </span>
            <button
              type="button"
              onClick={() => changeWeek(1)}
              className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/70 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer border-0 shadow-2xs"
              title="Tuần sau"
            >
              <ChevronRight size={14} />
            </button>
            {setWeekStartToday && (
              <button
                type="button"
                onClick={setWeekStartToday}
                className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[11px] font-extrabold hover:bg-blue-500/25 transition cursor-pointer border-0 ml-1"
              >
                Hôm Nay
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>LỊCH NGANG THEO THÁNG</span>
            <span className="text-[10px] text-slate-400 font-bold">({days.length} ngày)</span>
          </div>
        )}

        {/* Right: Zoom Controls (+ and -) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-[#111728] border border-slate-200 dark:border-white/10 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={hourWidth <= 55}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Thu nhỏ tỉ lệ giờ (Phím -)"
            >
              <ZoomOut size={13} />
            </button>

            <span
              onClick={handleResetZoom}
              className="px-2 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 transition"
              title="Đặt lại mức chuẩn 100%"
            >
              {Math.round((hourWidth / 100) * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={hourWidth >= 180}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Phóng to tỉ lệ giờ (Phím +)"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Thêm buổi học mới"
          >
            <Plus size={13} />
            <span>Thêm Buổi</span>
          </button>
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
          {/* Sticky Top Header: Hour Scale */}
          <div className="sticky top-0 z-30 flex bg-slate-200/90 dark:bg-[#111728] border-b border-slate-300 dark:border-white/10 backdrop-blur-none">
            {/* Corner Cell: Y-Axis Label */}
            <div className="sticky left-0 z-40 w-[140px] shrink-0 p-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/95 dark:bg-[#111728] border-r border-slate-300 dark:border-white/10 flex items-center justify-center">
              THỨ / NGÀY
            </div>

            {/* Hour Markers */}
            <div className="flex relative" style={{ width: `${timelineTrackWidth}px` }}>
              {HOURS.slice(0, TOTAL_HOURS).map((h) => (
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

              // Calculate overlapping tracks for proper height
              const sorted = [...daySess].sort((a, b) => a.start_time.localeCompare(b.start_time));
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

              return (
                <div
                  key={d.dateStr}
                  style={{ height: `${rowHeight}px` }}
                  className={`flex relative transition-colors ${
                    isToday
                      ? 'bg-blue-50/40 dark:bg-[#131b32]/60'
                      : d.isWeekend
                      ? 'bg-rose-50/20 dark:bg-[#19111e]/40'
                      : 'bg-white dark:bg-[#0c101d]'
                  }`}
                  onDoubleClick={(e) => {
                    if (hasMovedRef.current) return;
                    openAdd(d.dateStr);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (setCtxMenu) {
                      setCtxMenu({ x: e.clientX, y: e.clientY, dateStr: d.dateStr });
                    }
                  }}
                >
                  {/* Sticky Left Day Header */}
                  <div
                    className={`sticky left-0 z-20 w-[140px] shrink-0 p-2.5 border-r border-slate-200 dark:border-white/10 flex flex-col justify-between ${
                      isToday
                        ? 'bg-blue-100/90 dark:bg-[#152042]'
                        : d.isWeekend
                        ? 'bg-rose-50/80 dark:bg-[#1c1322]'
                        : 'bg-slate-50/90 dark:bg-[#0f1424]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider ${
                          isToday
                            ? 'text-blue-600 dark:text-blue-400'
                            : d.isWeekend
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {d.header}
                      </span>
                      {isToday && (
                        <span className="text-[8.5px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                          Nay
                        </span>
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
                    {HOURS.slice(0, TOTAL_HOURS).map((h) => (
                      <div
                        key={h}
                        style={{ width: `${hourWidth}px` }}
                        className="shrink-0 h-full border-r border-slate-200/60 dark:border-white/5 relative pointer-events-none"
                      >
                        {/* 30-min subtle dashed line */}
                        <div className="absolute top-0 bottom-0 left-1/2 border-r border-dashed border-slate-200/40 dark:border-white/[0.03]" />
                      </div>
                    ))}

                    {/* Today Red Current Time Needle */}
                    {isToday && currentTimeLeft !== null && (
                      <div
                        style={{ left: `${currentTimeLeft}px` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      >
                        <div className="w-2 h-2 rounded-full bg-rose-500 -ml-[3px] -mt-1 shadow" />
                      </div>
                    )}

                    {/* Render Session Cards for this day */}
                    {layouts.map(({ session, trackIdx }) => (
                      <HorizontalTimelineSessionCard
                        key={session.id}
                        session={session}
                        hourWidth={hourWidth}
                        startHour={START_HOUR}
                        isDark={isDark}
                        topOffset={6 + trackIdx * 76}
                        height={68}
                        onClick={() => openEdit(session)}
                        onContextMenu={(e) => {
                          if (setCtxMenu) {
                            setCtxMenu({ x: e.clientX, y: e.clientY, dateStr: d.dateStr });
                          }
                        }}
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
