import React from 'react';
import { GraduationCap } from 'lucide-react';

interface ClassItem {
  id: number | string;
  class_name: string;
  [key: string]: any;
}

interface RequireClassSelectionPromptProps {
  classes?: ClassItem[];
  onSelectClass?: (classId: string) => void;
  tabName?: string;
  description?: string;
}

export const RequireClassSelectionPrompt: React.FC<RequireClassSelectionPromptProps> = ({
  classes = [],
  onSelectClass,
  tabName,
  description,
}) => {
  const defaultDesc = tabName
    ? `Vui lòng chọn một lớp học cụ thể để xem toàn bộ dữ liệu và phân tích ${tabName}.`
    : 'Vui lòng chọn một lớp học cụ thể để xem toàn bộ dữ liệu và phân tích chi tiết.';

  return (
    <div className="w-full min-h-[480px] sm:min-h-[540px] flex flex-col items-center justify-center p-6 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#0c0f1e] border border-slate-200 dark:border-[#212c4b] shadow-xl my-4 animate-cascade-1 select-none">
      {/* 1. Large Glowing Icon Badge */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-[#5c36f5]/15 border border-[#5c36f5]/30 flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(92,54,245,0.25)]">
        <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-[#5c36f5] dark:text-[#8b6cfd]" />
      </div>

      {/* 2. Prominent Centered Heading */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-3">
        Yêu Cầu Chọn Lớp Học
      </h2>

      {/* 3. Subtitle / Guidance */}
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed mb-8 font-medium">
        {description || defaultDesc}
      </p>

      {/* 4. Direct Quick-Select Class Buttons */}
      {classes && classes.length > 0 && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Chọn Nhanh Lớp Học
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {classes.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => onSelectClass?.(String(cls.id))}
                className="group flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-slate-100 hover:bg-[#5c36f5]/15 dark:bg-[#12162a] dark:hover:bg-[#1b223c] border border-slate-200 dark:border-[#212c4b] hover:border-[#5c36f5]/50 text-slate-800 dark:text-slate-200 hover:text-[#5c36f5] dark:hover:text-white font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#5c36f5] group-hover:bg-[#8b6cfd] shadow-[0_0_8px_rgba(92,54,245,0.6)]" />
                <span>{cls.class_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Helpful Hint */}
      <div className="text-xs text-slate-400 dark:text-slate-500 mt-8 font-medium">
        Hoặc chọn từ danh sách lớp học ở thanh công cụ phía trên cùng.
      </div>
    </div>
  );
};
