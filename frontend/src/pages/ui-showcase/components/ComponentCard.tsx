import React, { useState } from 'react';
import { Code2, Copy, Check, ExternalLink, FileCode } from 'lucide-react';
import { ComponentCardProps } from '../types';
import { showToast } from '../../../components/Toast';

export const ComponentCard: React.FC<ComponentCardProps> = ({
  item,
  children,
  onViewCode,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUsage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.usageCode);
    setCopied(true);
    showToast(`Đã sao chép ví dụ sử dụng của ${item.title}!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white dark:bg-[#151821] rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between border-0 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {item.title}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold flex items-center gap-1">
              <FileCode size={12} />
              {item.filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {item.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyUsage}
            title="Sao chép ví dụ sử dụng nhanh"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition cursor-pointer border-0 shadow-2xs active:scale-95"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Chép cách dùng</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onViewCode(item)}
            title="Xem toàn bộ mã nguồn file và kiểu dữ liệu TypeScript"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition cursor-pointer border-0 shadow-2xs active:scale-95"
          >
            <Code2 size={13} />
            <span>Mã nguồn file</span>
          </button>
        </div>
      </div>

      {/* Interactive Playground Surface */}
      <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-[#0c0f1d] flex items-center justify-center min-h-[120px] overflow-x-auto">
        {children}
      </div>

      {/* Dependencies & Footer Info */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Gói cần thiết:</span>
          {item.dependencies.length > 0 ? (
            item.dependencies.map((dep) => (
              <span
                key={dep}
                className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
              >
                {dep}
              </span>
            ))
          ) : (
            <span className="font-mono text-[10px] text-slate-400">Không có phụ thuộc ngoài</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onViewCode(item)}
          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>Chi tiết mã</span>
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
};
