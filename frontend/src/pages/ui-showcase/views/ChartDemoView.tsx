import React from 'react';
import { TrendingUp, Code2, Copy } from 'lucide-react';
import { MiniTrendSparkline } from '../../../components/chart';
import { showToast } from '../../../components/Toast';
import { toastChartSources } from '../sources/toastChartSources';
import { ComponentSourceItem } from '../types';

interface ChartDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const ChartDemoView: React.FC<ChartDemoViewProps> = ({ onViewCode }) => {
  const sparklineSource = toastChartSources[1]; // MiniTrendSparkline

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Đồ Thị Mini Xu Hướng & Trực Quan Hóa (MiniTrendSparkline)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đồ thị đường mini SVG tuân thủ nghiêm ngặt AGENTS.md Rule 5: Tâm phóng to điểm tròn đặt chính giữa (center-origin), không lệch góc, không cắt viền glow.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(sparklineSource.usageCode);
              showToast('Đã chép ví dụ sử dụng MiniTrendSparkline!', 'success');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition cursor-pointer border-0 shadow-2xs"
          >
            <Copy size={13} />
            <span>Chép Cách Dùng</span>
          </button>
          <button
            type="button"
            onClick={() => onViewCode(sparklineSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn (MiniTrendSparkline.tsx)</span>
          </button>
        </div>
      </div>

      {/* Grid of Sparkline Trends */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Tiến Bộ Rõ Rệt (Xanh Lá)
          </span>
          <div className="py-2">
            <MiniTrendSparkline points={[6.0, 6.8, 7.5, 8.2, 9.5]} slope={0.35} />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            [6.0, 6.8, 7.5, 8.2, 9.5]
          </span>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            Sa Sút Điểm Số (Đỏ)
          </span>
          <div className="py-2">
            <MiniTrendSparkline points={[8.8, 8.2, 7.5, 6.5, 5.5]} slope={-0.3} />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            [8.8, 8.2, 7.5, 6.5, 5.5]
          </span>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Phong Độ Ổn Định (Xanh Dương)
          </span>
          <div className="py-2">
            <MiniTrendSparkline points={[8.0, 8.2, 8.0, 8.1, 8.2]} slope={0.01} />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            [8.0, 8.2, 8.0, 8.1, 8.2]
          </span>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Chỉ Có 1 Buổi Học (Badge Đơn)
          </span>
          <div className="py-2">
            <MiniTrendSparkline points={[8.5]} />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Hiển thị điểm buổi gần nhất
          </span>
        </div>
      </div>
    </div>
  );
};
