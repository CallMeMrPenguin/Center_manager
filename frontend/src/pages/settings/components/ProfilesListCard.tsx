import React from 'react';
import { Trash2 } from 'lucide-react';

interface ProfilesListCardProps {
  profiles: Record<string, any>;
  onDeleteProfile: (name: string) => void;
}

export const ProfilesListCard: React.FC<ProfilesListCardProps> = ({
  profiles,
  onDeleteProfile,
}) => {
  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-4 shadow-xs dark:shadow-none border border-slate-200 dark:border-[#27272a] self-start">
      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-3">
        Hồ sơ định dạng đã lưu
      </h3>

      <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
        {Object.keys(profiles).length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Chưa có hồ sơ định dạng nào được lưu.</p>
        ) : (
          Object.keys(profiles).map((name) => {
            const isDefault = name === 'Default Settings';
            return (
              <div
                key={name}
                className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#0b0f19]/50 border border-slate-200 dark:border-[#1e2746] transition"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[160px]">
                  {name}
                </span>
                {!isDefault ? (
                  <button
                    onClick={() => onDeleteProfile(name)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    title="Xóa hồ sơ này"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    Mặc định
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
