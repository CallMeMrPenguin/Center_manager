import React from 'react';
import { BarChart3, TrendingUp, BarChart2, ZoomIn, ZoomOut, RotateCcw, Clock } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { formatSessionDate } from '../utils';
import { format1Dec } from '../../../utils';
import { DistributionStats } from '../utils/distributionAnalytics';

interface ChartControlsProps {
  engine: any;
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  onOpenPhaseModal: () => void;
  timeView: '1m' | '2m' | '3m' | 'all';
  setTimeView: (v: '1m' | '2m' | '3m' | 'all') => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  chartViewMode: 'timeline' | 'distribution';
  setChartViewMode: (mode: 'timeline' | 'distribution') => void;
  distributionStats?: DistributionStats;
  isTestMode?: boolean;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  engine,
  timePhases,
  selectedPhaseId,
  setSelectedPhaseId,
  onOpenPhaseModal,
  timeView,
  setTimeView,
  zoomLevel,
  setZoomLevel,
  setPanOffset,
  chartViewMode,
  setChartViewMode,
  distributionStats,
  isTestMode,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-[#181f36] pb-3">
      {/* 1. TOP HEADER: View Mode Toggle & Mode Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          {chartViewMode === 'timeline' ? (
            <TrendingUp size={18} className="text-indigo-400" />
          ) : (
            <BarChart2 size={18} className="text-cyan-400" />
          )}
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {chartViewMode === 'timeline'
              ? 'TIẾN ĐỘ HỌC TẬP QUA CÁC KỲ & DỰ ĐOÁN XU HƯỚNG'
              : 'PHỔ ĐIỂM HỌC LỰC & PHÂN PHỐI NĂNG LỰC'}
          </h3>
        </div>

        {/* Sliding Pill Indicator for View Mode Switcher */}
        <SegmentedControl<'timeline' | 'distribution'>
          value={chartViewMode}
          onChange={setChartViewMode}
          options={[
            { value: 'timeline', label: 'Tiến Trình Thời Gian' },
            { value: 'distribution', label: 'Phổ Điểm & Histogram' },
          ]}
          activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
          className="w-72 sm:w-80 shrink-0"
          size="sm"
        />
      </div>

      {/* Dynamic Sub-Controls depending on Active Chart Mode */}
      {chartViewMode === 'timeline' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5 text-xs">
          {/* Legend with Predictions */}
          <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Từ Vựng (Dự đoán: {format1Dec(engine.pred_c1)})
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              Ngữ Pháp (Dự đoán: {format1Dec(engine.pred_c2)})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              BTVN (Dự đoán: {format1Dec(engine.pred_hw)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Zoom & Pan Controls */}
            <div className="flex items-center bg-[#141b32] border border-[#232d4e] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                title="Phóng to biểu đồ"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2340] hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                title="Thu nhỏ biểu đồ"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2340] hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-bold text-slate-400 px-1.5 tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                title="Đặt lại góc nhìn"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2340] hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 transition cursor-pointer"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Time View Filter */}
            <SegmentedControl<'1m' | '2m' | '3m' | 'all'>
              value={timeView}
              onChange={(val) => {
                setTimeView(val);
                setSelectedPhaseId('');
              }}
              options={[
                { value: '1m', label: '1 Tháng' },
                { value: '2m', label: '2 Tháng' },
                { value: '3m', label: '3 Tháng' },
                { value: 'all', label: 'Tất Cả' },
              ]}
              activeColor="bg-indigo-600 shadow-[0_0_14px_rgba(99,102,241,0.5)]"
              className="w-64 shrink-0"
              size="sm"
            />

            {/* Custom Time Phase Selector */}
            <div className="flex items-center gap-1.5">
              <CustomSelect
                value={selectedPhaseId}
                onChange={(val) => setSelectedPhaseId(String(val))}
                options={[
                  { value: '', label: 'Tất cả giai đoạn' },
                  ...timePhases.map((p) => ({
                    value: String(p.id),
                    label: `${p.phase_name} (${formatSessionDate(p.from_date)} - ${formatSessionDate(p.to_date)})`,
                  })),
                ]}
                className="w-44"
              />
              <button
                type="button"
                onClick={onOpenPhaseModal}
                className="p-2 rounded-xl bg-[#141b32] hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-[#232d4e] transition cursor-pointer"
                title="Quản Lý Giai Đoạn Học Tập Tùy Chỉnh"
              >
                <Clock size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold pt-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-slate-300">
              Tổng số mẫu: <strong className="text-white font-bold">{distributionStats?.n ?? 0}</strong> lượt
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-indigo-300">
              Điểm TB: <strong className="text-white font-bold">{format1Dec(distributionStats?.mean ?? 0)}đ</strong>
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-purple-300">
              Trung vị: <strong className="text-white font-bold">{format1Dec(distributionStats?.median ?? 0)}đ</strong>
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-cyan-300">
              Độ lệch σ: <strong className="text-white font-bold">{format1Dec(distributionStats?.sd ?? 0)}</strong>
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-emerald-300">
              Đạt chuẩn: <strong className="text-white font-bold">{distributionStats?.passPct ?? 0}%</strong>
            </span>
          </div>

          <span className="bg-[#101526] border border-[#202b48] px-3 py-1 rounded-lg text-[11px] font-bold text-amber-300">
            {distributionStats?.skewnessLabel}
          </span>
        </div>
      )}
    </div>
  );
};
