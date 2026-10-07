import React from 'react';
import { GraduationCap, ArrowRight, Users, DoorOpen, User } from 'lucide-react';
import { ActiveClassItem } from '../types';

interface ActiveClassesOverviewProps {
  classes: ActiveClassItem[];
  onNavigate: (tab: string, extraData?: { classId?: number }) => void;
}

export const ActiveClassesOverview: React.FC<ActiveClassesOverviewProps> = ({ classes, onNavigate }) => {
  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
      <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-200 dark:border-[#27272a]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
            <GraduationCap size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide">
              Lớp Học Đang Hoạt Động
            </h2>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
              {classes.length} lớp học trong kỳ hiện tại
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('classes')}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer"
        >
          <span>Quản lý tất cả lớp</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Chưa có lớp học nào đang hoạt động
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-[#222228]">
          {classes.slice(0, 6).map((cls) => (
            <div
              key={cls.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18181f] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                  {cls.class_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {cls.class_name}
                    </span>
                    {cls.grade && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#202028] text-slate-600 dark:text-slate-300">
                        {cls.grade}
                      </span>
                    )}
                    {cls.subject && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {cls.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      {cls.teacher_name || 'Chưa phân công'}
                    </span>
                    {cls.room && (
                      <span className="flex items-center gap-1">
                        <DoorOpen size={12} className="text-slate-400" />
                        {cls.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#202028] px-2.5 py-1 rounded-lg">
                  <Users size={12} className="text-slate-400" />
                  {cls.student_count || 0} học sinh
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('classes', { classId: cls.id })}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-[#202028] dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 text-xs font-bold transition cursor-pointer"
                >
                  Vào lớp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
