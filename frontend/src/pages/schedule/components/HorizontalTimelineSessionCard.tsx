import React, { useState, useRef } from 'react';
import { Clock, MapPin, Users, X } from 'lucide-react';
import {
  ClassSession,
  getSessionColor,
  getPremiumStyle,
  calcEndTime,
  getDynamicSessionInfo,
  parseTimeToMinutes,
} from '../types';

interface HorizontalTimelineSessionCardProps {
  session: ClassSession;
  hourWidth: number;
  startHour?: number;
  isDark: boolean;
  topOffset?: number;
  height?: number;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const HorizontalTimelineSessionCard: React.FC<HorizontalTimelineSessionCardProps> = ({
  session,
  hourWidth,
  startHour = 7,
  isDark,
  topOffset = 6,
  height = 68,
  onClick,
  onContextMenu,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const touchTimerRef = useRef<any>(null);

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setShowPopup(true);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const startMin = parseTimeToMinutes(session.start_time);
  const baseMin = startHour * 60;
  const rawLeft = ((startMin - baseMin) / 60) * hourWidth;
  const left = Math.max(0, rawLeft);
  const duration = session.duration || 90;
  const rawWidth = (duration / 60) * hourWidth;
  const width = Math.max(130, rawWidth);

  const hexColor = getSessionColor(session);
  const { status, isLive } = getDynamicSessionInfo(session);
  const vs = getPremiumStyle(status, hexColor, isDark);
  const endTime = calcEndTime(session.start_time, duration);

  // 1. Sĩ số rút gọn: SS: 18/20, SS: 0/19 (Nghỉ), hoặc [N] HS (Sắp diễn ra)
  const totalStudents = session.student_count || session.attendance_total || 20;
  const attendedStudents = session.attended_count ?? 0;
  const ssDisplay = status === 'Sắp diễn ra'
    ? `${totalStudents} HS`
    : `SS: ${attendedStudents}/${totalStudents}`;

  // 2. Giáo viên & Trợ giảng: "GV: [Tên]" và "TG: [Tên]" (nếu có trợ giảng, nếu không có thì bỏ TG)
  const teacherName = session.teacher_name?.trim() || '';
  let assistantName = (session as any).assistant_name?.trim() || '';
  if (!assistantName && session.notes) {
    const match = session.notes.match(/(?:TG|Trợ giảng|TA):\s*([^\n,|;#]+)/i);
    if (match) assistantName = match[1].trim();
  }
  const teacherText = teacherName ? `GV: ${teacherName}` : 'GV: ---';
  const assistantText = assistantName ? `TG: ${assistantName}` : null;

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => {
          if (onContextMenu) {
            e.stopPropagation();
            onContextMenu(e);
          }
        }}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          top: `${topOffset}px`,
          height: `${height}px`,
          backgroundColor: vs.bg,
          borderColor: vs.borderColor,
          borderLeftColor: hexColor,
          boxShadow: vs.shadow,
        }}
        className={`absolute z-10 rounded-xl border border-l-[4px] p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 shadow-xs hover:shadow-md hover:z-20 hover:scale-[1.01] select-none group overflow-hidden ${
          isLive ? 'ring-2 ring-amber-500/80 animate-pulse' : ''
        }`}
        title={`${session.class_name || 'Lớp học'}, ${teacherText}${assistantText ? `, ${assistantText}` : ''}, ${ssDisplay}, ${session.start_time}-${endTime}, ${session.room || 'Phòng'}`}
      >
        {/* 1. Header: Class Name + Dynamic Status Badge */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <h4
            className="text-[11.5px] font-black truncate tracking-tight group-hover:brightness-110 transition-colors"
            style={{ color: vs.titleColor }}
          >
            {session.class_name || 'Lớp học'}
          </h4>

          <div className="flex items-center gap-1 shrink-0">
            {isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            )}
            <span
              style={{
                backgroundColor: vs.badgeBg,
                color: vs.badgeColor,
              }}
              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-[4px] tracking-wide shrink-0 leading-none"
            >
              {status}
            </span>
          </div>
        </div>

        {/* 2. Middle: GV: ... and TG: ... (nếu có) + Phòng */}
        <div
          className="flex items-center justify-between gap-1.5 text-[10px] font-bold truncate"
          style={{ color: vs.color }}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">{teacherText}</span>
            {assistantText && (
              <span className="truncate opacity-85 font-semibold">
                {assistantText}
              </span>
            )}
          </div>

          {session.room && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-80 text-[9px] font-mono">
              <MapPin size={9} className="shrink-0" />
              <span className="truncate">{session.room}</span>
            </div>
          )}
        </div>

        {/* 3. Footer: SS: 20/20 & Giờ học */}
        <div
          className="flex items-center justify-between gap-2 text-[9.5px] font-bold pt-0.5 border-t border-black/5 dark:border-white/5 font-mono"
          style={{ color: vs.color }}
        >
          <div className="flex items-center gap-1 font-mono font-bold truncate">
            <Users size={10} className="shrink-0 opacity-80" />
            <span className="truncate">{ssDisplay}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-90">
            <Clock size={10} className="shrink-0" />
            <span>
              {session.start_time}-{endTime}
            </span>
          </div>
        </div>
      </div>

      {/* POPUP CARD ON LONG-PRESS / MOBILE TAP */}
      {showPopup && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowPopup(false);
          }}
          className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-2xl p-5 shadow-2xl max-w-xs w-full space-y-3 animate-mac-dropdown"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-base font-black truncate" style={{ color: hexColor }}>
                {session.class_name || 'Lớp học'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold">{status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-bold">{session.start_time} – {endTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Giáo viên:</span>
                <span className="font-bold">{teacherName || 'Chưa phân công'}</span>
              </div>
              {assistantName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trợ giảng:</span>
                  <span className="font-bold">{assistantName}</span>
                </div>
              )}
              {session.room && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phòng học:</span>
                  <span className="font-bold">{session.room}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sĩ số:</span>
                <span className="font-bold">{ssDisplay}</span>
              </div>
              {session.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-slate-500 text-[11px] italic">
                  Ghi chú: {session.notes}
                </div>
              )}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPopup(false);
                  onClick({ stopPropagation: () => {} } as any);
                }}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer text-center"
              >
                Chi tiết / Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
