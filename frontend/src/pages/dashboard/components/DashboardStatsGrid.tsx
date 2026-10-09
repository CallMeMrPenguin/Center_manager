import React from 'react';
import { DashboardStats } from '../types';

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-xl sm:rounded-2xl p-3 sm:p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          Học sinh
        </span>
        <div className="mt-1.5 sm:mt-3 flex items-baseline">
          <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.totalStudents}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-xl sm:rounded-2xl p-3 sm:p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          Lớp học
        </span>
        <div className="mt-1.5 sm:mt-3 flex items-baseline">
          <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.activeClasses}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-xl sm:rounded-2xl p-3 sm:p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          Nhân sự
        </span>
        <div className="mt-1.5 sm:mt-3 flex items-baseline">
          <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.totalTeachers}
          </span>
        </div>
      </div>
    </div>
  );
};
