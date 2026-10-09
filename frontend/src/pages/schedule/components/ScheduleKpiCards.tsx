import React from 'react';

interface ScheduleKpiCardsProps {
  total: number;
  done: number;
  upcoming?: number;
  off?: number;
}

export const ScheduleKpiCards: React.FC<ScheduleKpiCardsProps> = ({
  total,
  done,
  off = 0,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-3 sm:p-4.5 rounded-xl sm:rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Tổng ca</p>
        <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 sm:mt-3">{total}</p>
      </div>
      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-3 sm:p-4.5 rounded-xl sm:rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">Hoàn thành</p>
        <p className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 sm:mt-3">{done}</p>
      </div>
      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] p-3 sm:p-4.5 rounded-xl sm:rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">Hủy</p>
        <p className="text-xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1.5 sm:mt-3">{off}</p>
      </div>
    </div>
  );
};
