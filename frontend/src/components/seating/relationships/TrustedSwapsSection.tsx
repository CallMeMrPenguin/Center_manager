import React from 'react';
import { ShieldCheck, UserCheck, Trash2, RefreshCw } from 'lucide-react';
import { TrustedSwapStudent } from './types';

interface TrustedSwapsSectionProps {
  trustedSwaps: TrustedSwapStudent[];
  loading: boolean;
  onOpenAddTrusted: () => void;
  onDeleteTrusted: (studentId: number) => Promise<void>;
}

export const TrustedSwapsSection: React.FC<TrustedSwapsSectionProps> = ({
  trustedSwaps,
  loading,
  onOpenAddTrusted,
  onDeleteTrusted,
}) => {
  return (
    <div className="space-y-4">
      {/* SECTION HEADER (Directly on page, zero outer card wrapper) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <span>Học Sinh Tin Cậy Chuyển Bài Cùng Giới</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Học sinh trong danh sách được phép chuyển bài với bạn cùng giới (nhưng không đổi với bạn cùng nhóm).
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddTrusted}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs border-0"
        >
          <UserCheck size={14} />
          <span>Thêm Học Sinh Tin Cậy</span>
        </button>
      </div>

      {/* CONTENT (Single visual boundary) */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-amber-500" />
          <span>Đang tải danh sách học sinh tin cậy...</span>
        </div>
      ) : trustedSwaps.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 font-medium bg-white dark:bg-[#121626] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          Chưa có học sinh nào trong danh sách tin cậy. Bấm nút phía trên để thêm học sinh.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-wrap gap-2">
            {trustedSwaps.map((ts) => (
              <div
                key={ts.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-2xs"
              >
                <ShieldCheck size={14} className="text-amber-500 dark:text-amber-400 shrink-0" />
                <span>{ts.student_name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono px-1 rounded bg-slate-200/60 dark:bg-white/10">
                  {ts.gender || 'Nam'}
                </span>

                <button
                  type="button"
                  onClick={() => onDeleteTrusted(ts.student_id)}
                  className="p-0.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition ml-1 cursor-pointer border-0"
                  title="Gỡ khỏi danh sách tin cậy"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
