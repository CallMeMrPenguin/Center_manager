import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';

interface ScheduleKpiCardsProps {
  total: number;
  done: number;
  upcoming: number;
}

export const ScheduleKpiCards: React.FC<ScheduleKpiCardsProps> = ({
  total,
  done,
  upcoming,
}) => {
  return (
    <div className="grid grid-cols-3 gap-4 shrink-0">
      <div className="bg-white dark:bg-[#141417] border-0 p-4.5 flex items-center justify-between rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Trong Tháng</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{total}</p>
        </div>
        <div className="p-2.5 bg-blue-500/10 border-0 rounded-xl text-blue-600 dark:text-blue-400">
          <CalendarIcon size={18} />
        </div>
      </div>
      <div className="bg-white dark:bg-[#141417] border-0 p-4.5 flex items-center justify-between rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Đã Hoàn Thành</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{done}</p>
        </div>
        <div className="p-2.5 bg-emerald-500/10 border-0 rounded-xl text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} />
        </div>
      </div>
      <div className="bg-white dark:bg-[#141417] border-0 p-4.5 flex items-center justify-between rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Sắp Diễn Ra</p>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{upcoming}</p>
        </div>
        <div className="p-2.5 bg-cyan-500/10 border-0 rounded-xl text-cyan-600 dark:text-cyan-400">
          <Clock size={18} />
        </div>
      </div>
    </div>
  );
};
