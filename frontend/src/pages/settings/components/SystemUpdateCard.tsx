import React from 'react';
import { Loader2, Download, CheckCircle2 } from 'lucide-react';

interface SystemUpdateCardProps {
  updateState: any;
  checkingUpdate: boolean;
  applyingUpdate: boolean;
  onCheckUpdate: () => void;
  onApplyUpdate: () => void;
}

export const SystemUpdateCard: React.FC<SystemUpdateCardProps> = ({
  updateState,
  checkingUpdate,
  applyingUpdate,
  onCheckUpdate,
  onApplyUpdate,
}) => {
  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-4 shadow-xs dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap gap-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Cập nhật ứng dụng
        </h3>
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
          v{updateState?.current_version ?? '1.0.0'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Status Row */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f19]/60 border border-slate-200 dark:border-[#1e2746]">
          {applyingUpdate ? (
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : updateState?.has_update ? (
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Download size={18} />
            </div>
          ) : (
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <CheckCircle2 size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {applyingUpdate
                ? 'Đang cài đặt bản cập nhật...'
                : updateState?.has_update
                ? `Có bản cập nhật mới: v${updateState.latest_version}`
                : updateState?.error
                ? 'Không thể kiểm tra cập nhật'
                : 'Ứng dụng đang dùng phiên bản mới nhất'}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {applyingUpdate
                ? (updateState?.progress ?? 'Đang xử lý...')
                : updateState?.last_checked
                ? `Kiểm tra lần cuối: ${new Date(updateState.last_checked * 1000).toLocaleTimeString('vi-VN')}`
                : 'Nhấn "Kiểm tra cập nhật" để kiểm tra phiên bản mới.'}
            </p>
            {updateState?.error && !applyingUpdate && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-mono">{updateState.error}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {updateState?.has_update && !applyingUpdate && (
              <button
                onClick={onApplyUpdate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Cài đặt ngay
              </button>
            )}
            <button
              onClick={onCheckUpdate}
              disabled={checkingUpdate || applyingUpdate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c21] dark:hover:bg-[#27272f] border border-slate-300 dark:border-[#27272a] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
            >
              {checkingUpdate ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
            </button>
          </div>
        </div>

        {/* Progress bar when applying */}
        {applyingUpdate && (
          <div className="w-full bg-slate-200 dark:bg-[#0b0f19] rounded-full h-1.5 border border-slate-300 dark:border-slate-800 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full animate-pulse w-2/3" />
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Cập nhật được tự động kiểm tra qua GitHub Releases. Dữ liệu hệ thống được bảo toàn an toàn khi cập nhật.
        </p>
      </div>
    </div>
  );
};
