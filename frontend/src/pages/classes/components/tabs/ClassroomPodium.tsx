import React from 'react';
import { GraduationCap } from 'lucide-react';

export const ClassroomPodium: React.FC = () => {
  return (
    <div className="w-full flex justify-center mb-4 select-none">
      {/* BÀN GIÁO VIÊN (Classroom Front Reference) */}
      <div className="flex items-center justify-center gap-2.5 bg-white dark:bg-[#12162a] border-2 border-indigo-500/70 dark:border-indigo-500/50 rounded-2xl py-2 px-6 shadow-sm">
        <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
          <GraduationCap size={14} />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
          Bàn Giáo Viên
        </span>
      </div>
    </div>
  );
};
