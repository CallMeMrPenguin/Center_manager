import React from 'react';

interface RequireClassSelectionPromptProps {
  classes?: any[];
  onSelectClass?: (classId: string) => void;
  tabName?: string;
  description?: string;
}

export const RequireClassSelectionPrompt: React.FC<RequireClassSelectionPromptProps> = () => {
  return (
    <div className="w-full min-h-[420px] sm:min-h-[500px] flex items-center justify-center p-6 text-center select-none animate-cascade-1">
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
        CHỌN LỚP HỌC
      </h2>
    </div>
  );
};
