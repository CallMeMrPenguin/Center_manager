import React from 'react';
import { User, UserPlus, X, AlertCircle } from 'lucide-react';

interface DeskCardProps {
  colIdx: number;
  deskIdx: number;
  seatLeft: any;
  seatRight: any;
  isLeftAbsent: boolean;
  isRightAbsent: boolean;
  onClearSeat: (colIdx: number, deskIdx: number, posIdx: number) => void;
  onDropOnSeat: (targetColIdx: number, targetDeskIdx: number, targetPosIdx: number) => void;
  onDragStartSeat: (seatPos: { colIdx: number; deskIdx: number; posIdx: number }) => void;
}

export const DeskCard: React.FC<DeskCardProps> = ({
  colIdx,
  deskIdx,
  seatLeft,
  seatRight,
  isLeftAbsent,
  isRightAbsent,
  onClearSeat,
  onDropOnSeat,
  onDragStartSeat,
}) => {
  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderSeat = (seat: any, isAbsent: boolean, posIdx: number) => {
    const hasStudent = Boolean(seat?.student_name);

    if (hasStudent) {
      const initials = getInitials(seat.student_name);

      return (
        <div
          draggable
          onDragStart={() => onDragStartSeat({ colIdx, deskIdx, posIdx })}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDropOnSeat(colIdx, deskIdx, posIdx)}
          className={`group/seat relative p-2 rounded-xl border flex items-center gap-2 min-h-[56px] cursor-grab active:cursor-grabbing transition-all select-none shadow-xs ${
            isAbsent
              ? 'bg-rose-50/80 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 hover:border-rose-400'
              : 'bg-indigo-50/70 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/35 text-slate-900 dark:text-white hover:border-indigo-400 hover:shadow-sm'
          }`}
        >
          {/* Quick Clear Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearSeat(colIdx, deskIdx, posIdx);
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-all shadow-md cursor-pointer z-10 hover:scale-110 active:scale-95"
            title="Bỏ xếp chỗ học sinh này"
          >
            <X size={11} strokeWidth={3} />
          </button>

          {/* Student Avatar Icon/Initials */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 font-mono shadow-xs ${
            isAbsent
              ? 'bg-rose-200 text-rose-800 dark:bg-rose-500/30 dark:text-rose-300'
              : 'bg-indigo-600 text-white dark:bg-indigo-500/30 dark:text-indigo-300'
          }`}>
            {initials || <User size={12} />}
          </div>

          {/* Student Name and Status */}
          <div className="min-w-0 flex-1 py-0.5 overflow-hidden">
            <span
              className={`text-xs font-black block leading-snug break-words line-clamp-2 ${
                isAbsent ? 'line-through text-rose-700 dark:text-rose-300 opacity-90' : 'text-slate-900 dark:text-white'
              }`}
              title={seat.student_name}
            >
              {seat.student_name}
            </span>
            {isAbsent && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-300 mt-0.5">
                <AlertCircle size={9} /> Vắng mặt
              </span>
            )}
          </div>
        </div>
      );
    }

    // Empty Seat Dropzone
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropOnSeat(colIdx, deskIdx, posIdx)}
        className="group/drop relative p-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-400/60 bg-slate-50/80 dark:bg-white/[0.02] hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 flex items-center justify-center gap-1.5 min-h-[56px] text-center transition-all cursor-pointer"
      >
        <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-white/5 group-hover/drop:bg-indigo-500/20 text-slate-400 dark:text-slate-500 group-hover/drop:text-indigo-500 flex items-center justify-center transition-colors shrink-0">
          <UserPlus size={13} />
        </div>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 group-hover/drop:text-indigo-600 dark:group-hover/drop:text-indigo-400 transition-colors">
          Thả vào đây
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#11162a] p-3 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-lg transition-all w-[310px] flex flex-col gap-2.5">
      {/* Desk Title Plaque */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-1.5 px-0.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Bàn {deskIdx + 1}
        </span>
        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
          Dãy {colIdx + 1}
        </span>
      </div>

      {/* Double Seats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {renderSeat(seatLeft, isLeftAbsent, 0)}
        {renderSeat(seatRight, isRightAbsent, 1)}
      </div>
    </div>
  );
};
