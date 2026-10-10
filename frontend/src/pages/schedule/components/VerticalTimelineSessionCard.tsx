import React, { useState, useRef } from 'react';
import { Clock, MapPin, Users, X } from 'lucide-react';
import {
  ClassSession,
  getSessionColor,
  getPremiumStyle,
  calcEndTime,
  getDynamicSessionInfo,
} from '../types';

interface VerticalTimelineSessionCardProps {
  session: ClassSession;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
  isDark: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const VerticalTimelineSessionCard: React.FC<VerticalTimelineSessionCardProps> = ({
  session,
  top,
  height,
  leftPct,
  widthPct,
  isDark,
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

  const duration = session.duration || 90;
  const hexColor = getSessionColor(session);
  const { status, isLive } = getDynamicSessionInfo(session);
  const vs = getPremiumStyle(status, hexColor, isDark);
  const endTime = calcEndTime(session.start_time, duration);

  // Sĩ số
  const totalStudents = session.student_count || session.attendance_total || 20;
  const attendedStudents = session.attended_count ?? 0;
  const ssDisplay = status === 'Sắp diễn ra'
    ? `${totalStudents} HS`
    : `SS: ${attendedStudents}/${totalStudents}`;

  // Giáo viên & Trợ giảng
  const teacherName = session.teacher_name?.trim() || '';
  let assistantName = (session as any).assistant_name?.trim() || '';
  if (!assistantName && session.notes) {
    const match = session.notes.match(/(?:TG|Trợ giảng|TA):\s*([^\n,|;#]+)/i);
    if (match) assistantName = match[1].trim();
  }
  const teacherText = teacherName ? `GV: ${teacherName}` : 'GV: ---';
  const assistantText = assistantName ? `TG: ${assistantName}` : null;

  const isCompact = height < 58;

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
          top: `${top}px`,
          height: `${height}px`,
          left: `calc(${leftPct}% + 1.5px)`,
          width: `calc(${widthPct}% - 3px)`,
          backgroundColor: vs.bg,
          borderColor: vs.borderColor,
          borderLeftColor: hexColor,
          boxShadow: vs.shadow,
        }}
        className={`absolute z-10 rounded-xl border border-l-[3.5px] p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-150 shadow-xs hover:shadow-md hover:z-20 active:z-20 hover:scale-[1.01] select-none group overflow-hidden ${
          isLive ? 'ring-2 ring-amber-500/80 animate-pulse' : ''
        }`}
        title={`${session.class_name || 'Lớp học'}, ${teacherText}${assistantText ? `, ${assistantText}` : ''}, ${ssDisplay}, ${session.start_time}-${endTime}, ${session.room || 'Phòng'}`}
      >
        {/* 1. Header: Class Name + Dynamic Status Badge */}
        <div className="flex items-center justify-between gap-1 min-w-0">
          <h4
            className="text-[11px] font-black truncate tracking-tight group-hover:brightness-110 transition-colors leading-tight"
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
              className="text-[8.5px] font-black uppercase px-1 py-0.2 rounded tracking-wide shrink-0 leading-none"
            >
              {status}
            </span>
          </div>
        </div>

        {/* 2. Middle: GV & Room (nếu đủ chiều cao) */}
        {!isCompact && (
          <div
            className="flex items-center justify-between gap-1 text-[9.5px] font-bold truncate my-0.5"
            style={{ color: vs.color }}
          >
            <span className="truncate">{teacherText}</span>
            {session.room && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-80 text-[8.5px] font-mono">
                <MapPin size={8} className="shrink-0" />
                <span className="truncate">{session.room}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Footer: SS & Giờ học */}
        <div
          className="flex items-center justify-between gap-1 text-[9px] font-bold border-t border-black/5 dark:border-white/5 font-mono pt-0.5"
          style={{ color: vs.color }}
        >
          <div className="flex items-center gap-0.5 font-mono font-bold truncate">
            <Users size={8.5} className="shrink-0 opacity-80" />
            <span className="truncate">{ssDisplay}</span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 opacity-90">
            <Clock size={8.5} className="shrink-0" />
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:white"
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
