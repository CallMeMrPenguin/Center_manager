import React from 'react';
import { TrendingUp, BarChart2, ZoomIn, ZoomOut, RotateCcw, Clock } from 'lucide-react';
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
}) => {
  return (
    <div className="flex flex-col gap-3.5 border-b border-[#181f36] pb-3">
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          {/* Legend with Predictions */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Từ Vựng (Dự đoán: {format1Dec(engine.pred_c1)})
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              Ngữ Pháp (Dự đoán: {format1Dec(engine.pred_c2)})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              BTVN (Dự đoán: {format1Dec(engine.pred_hw)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Zoom & Pan Controls */}
            <div className="flex items-center bg-[#090d16] border border-[#1b253b] rounded-xl p-0.5 gap-0.5 h-8">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                title="Phóng to biểu đồ"
                className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-[#141b32] hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition cursor-pointer"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                title="Thu nhỏ biểu đồ"
                className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-[#141b32] hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition cursor-pointer"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[10px] font-bold text-slate-400 px-1 tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                title="Đặt lại góc nhìn"
                className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-[#141b32] hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 transition cursor-pointer"
              >
                <RotateCcw size={11} />
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
              className="w-60 shrink-0 h-8"
              size="sm"
            />

            {/* Custom Time Phase Selector with explicit spacing */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
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
                className="w-48"
              />
              <button
                type="button"
                onClick={onOpenPhaseModal}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#090d16] hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-[#1b253b] transition cursor-pointer shrink-0"
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
