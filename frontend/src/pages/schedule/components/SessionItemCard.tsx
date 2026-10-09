import React from 'react';
import { Clock } from 'lucide-react';
import { ClassSession, getSessionColor, getPremiumStyle, calcEndTime, getDynamicSessionInfo } from '../types';

interface SessionItemCardProps {
  session: ClassSession;
  onClick: (e: React.MouseEvent) => void;
  isDark: boolean;
  compact?: boolean;
}

export const SessionItemCard: React.FC<SessionItemCardProps> = ({
  session,
  onClick,
  isDark,
  compact = false,
}) => {
  const hex = getSessionColor(session);
  const { status } = getDynamicSessionInfo(session);
  const vs = getPremiumStyle(status, hex, isDark);

  return (
    <div
      onClick={onClick}
      className={`rounded-[6px] cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-l-[3.5px] flex flex-col gap-1 overflow-hidden select-none ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
      }`}
      style={{
        backgroundColor: vs.bg,
        borderColor: vs.borderColor,
        borderLeftColor: (vs as any).accentColor || vs.borderColor,
        boxShadow: vs.shadow,
      }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <h4
          className="text-[11px] font-black truncate leading-tight tracking-tight"
          style={{ color: vs.titleColor }}
        >
          {session.class_name}
        </h4>
        <span
          className="text-[9px] font-black px-1.5 py-0.5 rounded-[4px] shrink-0 leading-none"
          style={{ backgroundColor: vs.badgeBg, color: vs.badgeColor }}
        >
          {status}
        </span>
      </div>
      <div
        className="flex items-center justify-between text-[10px] font-bold font-mono"
        style={{ color: vs.color }}
      >
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="shrink-0 opacity-80" />
          <span>
            {session.start_time} - {calcEndTime(session.start_time, session.duration)}
          </span>
        </div>
        {session.teacher_name && (
          <span
            className="text-[9px] font-sans truncate max-w-[70px] opacity-80"
            title={session.teacher_name}
          >
            {session.teacher_name}
          </span>
        )}
      </div>
    </div>
  );
};
