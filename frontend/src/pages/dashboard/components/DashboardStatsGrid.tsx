import React from 'react';
import { Users, GraduationCap, CalendarCheck, UserCheck } from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-[#141d38] rounded-2xl p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Học sinh đang học</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
            <Users size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalStudents}</span>
          <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400">Đang theo học</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141d38] rounded-2xl p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lớp học hoạt động</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
            <GraduationCap size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.activeClasses}</span>
          <span className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400">Lớp trong kỳ</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141d38] rounded-2xl p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Điểm danh hôm nay</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
            <CalendarCheck size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.attendanceCompletedCount} / {stats.todaySessionsCount}
          </span>
          <span className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400">Ca đã điểm danh</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141d38] rounded-2xl p-4.5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Đội ngũ giáo viên</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <UserCheck size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalTeachers}</span>
          <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400">Giảng viên/Trợ giảng</span>
        </div>
      </div>
    </div>
  );
};
