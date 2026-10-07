import React from 'react';
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemCheck } from '../../../types';

interface SystemDiagnosticsCardProps {
  systemCheck: SystemCheck | null;
  loadingDiagnostics: boolean;
  onRefresh: () => void;
}

export const SystemDiagnosticsCard: React.FC<SystemDiagnosticsCardProps> = ({
  systemCheck,
  loadingDiagnostics,
  onRefresh,
}) => {
  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-4 shadow-xs dark:shadow-none border border-slate-200 dark:border-[#27272a]">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Chẩn đoán môi trường chạy máy tính
        </h3>
        <button
          onClick={onRefresh}
          disabled={loadingDiagnostics}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c21] dark:hover:bg-[#27272f] border border-slate-300 dark:border-[#27272a] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition"
        >
          {loadingDiagnostics ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
        </button>
      </div>

      {systemCheck ? (
        <div className="flex flex-col gap-3">
          {/* Word status indicator */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0b0f19]/60 border border-slate-200 dark:border-[#1e2746]">
            <div className="mt-0.5 shrink-0">
              {systemCheck.word_installed ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <AlertTriangle size={16} className="text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Microsoft Word: {systemCheck.word_installed ? 'Đã cài đặt sẵn' : 'Chưa phát hiện'}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {systemCheck.word_installed
                  ? 'Máy tính đã có MS Word hỗ trợ xuất báo cáo và đề thi trực tiếp.'
                  : 'Chưa cài đặt MS Word. Hệ thống sẽ sử dụng bộ công cụ chuyển đổi nội bộ.'}
              </p>
            </div>
          </div>

          {/* Python Environment */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0b0f19]/60 border border-slate-200 dark:border-[#1e2746]">
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Python: {systemCheck.python_version || 'Sẵn sàng'}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Backend FastAPI đang chạy ổn định trên cổng cục bộ.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-4 text-center">Đang kiểm tra chẩn đoán hệ thống...</p>
      )}
    </div>
  );
};
