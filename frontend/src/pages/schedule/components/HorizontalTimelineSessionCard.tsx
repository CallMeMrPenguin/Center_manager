import React from 'react';
import { Clock, User, MapPin, Users } from 'lucide-react';
import { ClassSession, getSessionColor, calcEndTime, getDynamicSessionInfo, parseTimeToMinutes } from '../types';

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
  const { status, statusColor, studentDisplay, isLive } = getDynamicSessionInfo(session);

  const endTime = calcEndTime(session.start_time, duration);

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
        borderColor: isDark ? `${hexColor}66` : `${hexColor}99`,
        borderLeftColor: hexColor,
        backgroundColor: isDark ? '#111728' : '#ffffff',
      }}
      className={`absolute z-10 rounded-xl border border-l-[4px] p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 shadow-xs hover:shadow-md hover:z-20 hover:scale-[1.01] select-none group overflow-hidden ${
        isLive ? 'ring-2 ring-amber-500/80 animate-pulse' : ''
      }`}
      title={`${session.class_name || 'Lớp học'} | ${session.teacher_name || 'GV'} | ${studentDisplay} | ${session.start_time}-${endTime} | ${session.room || 'Phòng'}`}
    >
      {/* 1. Header: Class Name + Dynamic Status Badge */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <h4 className="text-[11.5px] font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {session.class_name || 'Lớp học'}
        </h4>

        <div className="flex items-center gap-1 shrink-0">
          {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          )}
          <span
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
            className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-[4px] tracking-wide shrink-0 leading-none"
          >
            {status}
          </span>
        </div>
      </div>

      {/* 2. Middle: Teacher & Room */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600 dark:text-slate-300 font-semibold truncate">
        <div className="flex items-center gap-1 truncate">
          <User size={10} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.teacher_name || 'Chưa phân công'}</span>
        </div>

        {session.room && (
          <div className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-slate-400">
            <MapPin size={10} className="shrink-0 text-slate-400" />
            <span className="truncate">{session.room}</span>
          </div>
        )}
      </div>

      {/* 3. Footer: Students Count & Time Range */}
      <div className="flex items-center justify-between gap-2 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-white/5 font-mono">
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-sans font-bold truncate">
          <Users size={10} className="shrink-0" />
          <span className="truncate">{studentDisplay}</span>
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
