import React from 'react';
import { Loader2, Download, CheckCircle2, RefreshCw, FileSpreadsheet, FileText, FileCode } from 'lucide-react';

interface ToolItem {
  id: string;
  name: string;
  installed_version?: string;
  latest_version?: string;
  has_update?: boolean;
}

interface SystemUpdateCardProps {
  updateState: any;
  checkingUpdate: boolean;
  applyingUpdate: boolean;
  syncingTools?: boolean;
  onCheckUpdate: () => void;
  onApplyUpdate: () => void;
  onSyncTools?: () => void;
}

const DEFAULT_TOOLS: ToolItem[] = [
  { id: 'gridcraft', name: 'Bảng tính Excel (GridCraft)', installed_version: 'v0.8.0', latest_version: 'v0.8.0', has_update: false },
  { id: 'pdfcraft', name: 'Tài liệu PDF (PdfCraft)', installed_version: 'v0.9.0', latest_version: 'v0.9.0', has_update: false },
  { id: 'wordcraft', name: 'Soạn thảo Word (WordCraft)', installed_version: 'v0.8.0', latest_version: 'v0.8.0', has_update: false },
];

export const SystemUpdateCard: React.FC<SystemUpdateCardProps> = ({
  updateState,
  checkingUpdate,
  applyingUpdate,
  syncingTools = false,
  onCheckUpdate,
  onApplyUpdate,
  onSyncTools,
}) => {
  const tools: ToolItem[] = (updateState?.tools && updateState.tools.length > 0)
    ? updateState.tools
    : DEFAULT_TOOLS;

  const hasToolsUpdate = updateState?.has_tools_update || tools.some((t) => t.has_update);

  const getToolIcon = (id: string) => {
    switch (id) {
      case 'gridcraft':
        return <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />;
      case 'pdfcraft':
        return <FileText size={16} className="text-rose-600 dark:text-rose-400" />;
      default:
        return <FileCode size={16} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#141417] rounded-2xl p-6 flex flex-col gap-5 border-0 shadow-xs">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5 flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Cập nhật ứng dụng & Công cụ tích hợp
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tự động kiểm tra phát hành mới từ GitHub và bảo toàn dữ liệu người dùng
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1e1e24] px-2.5 py-1 rounded-lg">
          v{updateState?.current_version ?? '1.0.0'}
        </span>
      </div>

      {/* Center Manager Core Status Card */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f19]/60">
        {applyingUpdate ? (
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : updateState?.has_update ? (
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Download size={18} />
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 size={18} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Hệ thống Center Manager
            </h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                updateState?.has_update
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}
            >
              {updateState?.has_update ? `Có bản mới v${updateState.latest_version}` : 'Phiên bản mới nhất'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            {applyingUpdate
              ? (updateState?.progress ?? 'Đang xử lý...')
              : updateState?.last_checked
              ? `Kiểm tra lần cuối: ${new Date(updateState.last_checked * 1000).toLocaleTimeString('vi-VN')}`
              : 'Nhấn "Kiểm tra cập nhật" để kết nối GitHub.'}
          </p>
          {updateState?.error && !applyingUpdate && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-mono">{updateState.error}</p>
          )}
        </div>

        {/* Core Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {updateState?.has_update && !applyingUpdate && (
            <button
              onClick={onApplyUpdate}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition cursor-pointer border-0 shadow-xs"
            >
              Cài đặt ngay
            </button>
          )}
          <button
            onClick={onCheckUpdate}
            disabled={checkingUpdate || applyingUpdate}
            className="px-3 py-1.5 bg-slate-200/70 hover:bg-slate-200 dark:bg-[#1c1c21] dark:hover:bg-[#27272f] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer disabled:opacity-40 border-0"
          >
            {checkingUpdate ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
          </button>
        </div>
      </div>

      {/* Progress Bar when Applying */}
      {applyingUpdate && (
        <div className="w-full bg-slate-200 dark:bg-[#0b0f19] rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-full rounded-full animate-pulse w-2/3" />
        </div>
      )}

      {/* Integrated Tools Section */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            Công cụ tài liệu WebAssembly (PDF / Excel / Word)
          </span>
          {onSyncTools && (
            <button
              onClick={onSyncTools}
              disabled={syncingTools || checkingUpdate || applyingUpdate}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer border-0 ${
                hasToolsUpdate
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1c1c21] text-slate-700 dark:text-slate-300'
              } disabled:opacity-40`}
            >
              <RefreshCw size={12} className={syncingTools ? 'animate-spin' : ''} />
              {syncingTools ? 'Đang đồng bộ...' : hasToolsUpdate ? 'Cập nhật công cụ ngay' : 'Đồng bộ lại công cụ'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tools.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b0f19]/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-white dark:bg-[#1a1a22] shadow-2xs shrink-0">
                  {getToolIcon(t.id)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {t.installed_version || 'v0.8.0'}
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  t.has_update
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
              >
                {t.has_update ? `Có v${t.latest_version}` : 'Mới nhất'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
