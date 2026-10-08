import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
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
  const startMin = parseTimeToMinutes(session.start_time);
  const baseMin = startHour * 60;
  const rawLeft = ((startMin - baseMin) / 60) * hourWidth;
  const left = Math.max(0, rawLeft);
  const duration = session.duration || 90;
  const rawWidth = (duration / 60) * hourWidth;
  const width = Math.max(130, rawWidth);

  const hexColor = getSessionColor(session);
  const vs = getPremiumStyle(session.status, hexColor, isDark);
  const { status, isLive } = getDynamicSessionInfo(session);
  const endTime = calcEndTime(session.start_time, duration);

  // 1. Sĩ số rút gọn: SS: 20/20 hoặc SS: 18/20
  const totalStudents = session.student_count || session.attendance_total || 20;
  const attendedStudents =
    session.attended_count !== undefined && session.attended_count !== null
      ? session.attended_count
      : totalStudents;
  const ssDisplay = `SS: ${attendedStudents}/${totalStudents}`;

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
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
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
      title={`${session.class_name || 'Lớp học'} | ${teacherText}${assistantText ? ` | ${assistantText}` : ''} | ${ssDisplay} | ${session.start_time}-${endTime} | ${session.room || 'Phòng'}`}
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
  );
};
