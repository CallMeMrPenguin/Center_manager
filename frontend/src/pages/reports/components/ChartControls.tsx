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
  hideDistributionToggle?: boolean;
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
  hideDistributionToggle = false,
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

        {/* Sliding Pill Indicator for View Mode Switcher (Hidden in student mode) */}
        {!hideDistributionToggle && (
          <SegmentedControl<'timeline' | 'distribution'>
            value={chartViewMode}
            onChange={setChartViewMode}
            options={[
              { value: 'timeline', label: 'Tiến Trình Thời Gian' },
              { value: 'distribution', label: 'Phổ Điểm & Histogram' },
            ]}
            activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
            size="sm"
          />
        )}
      </div>

      {/* Dynamic Sub-Controls depending on Active Chart Mode */}
      {chartViewMode === 'timeline' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          {/* Legend with Predictions */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Từ Vựng (Dự đoán: {format1Dec(engine?.pred_c1 ?? 0)})
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              Ngữ Pháp (Dự đoán: {format1Dec(engine?.pred_c2 ?? 0)})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              BTVN (Dự đoán: {format1Dec(engine?.pred_hw ?? 0)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time View Filter (1M, 2M, 3M, ALL) */}
            <div className="w-48">
              <SegmentedControl<'1m' | '2m' | '3m' | 'all'>
                value={timeView}
                onChange={setTimeView}
                options={[
                  { value: '1m', label: '1T' },
                  { value: '2m', label: '2T' },
                  { value: '3m', label: '3T' },
                  { value: 'all', label: 'Tất cả' },
                ]}
                activeColor="bg-[#5c36f5] shadow-[0_0_12px_rgba(92,54,245,0.4)]"
                size="sm"
              />
            </div>

            {/* Time Phase Dropdown */}
            {timePhases.length > 0 && (
              <div className="w-44">
                <CustomSelect
                  value={selectedPhaseId}
                  onChange={(val) => setSelectedPhaseId(String(val))}
                  options={[
                    { value: '', label: 'Tất cả giai đoạn' },
                    ...timePhases.map((p) => ({
                      value: p.id,
                      label: `${p.phase_name} (${formatSessionDate(p.start_date)} - ${formatSessionDate(p.end_date)})`,
                    })),
                  ]}
                  placeholder="Giai đoạn..."
                  icon={<Clock size={13} className="text-indigo-400" />}
                />
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-[#121626] border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Phóng to biểu đồ"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Thu nhỏ biểu đồ"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Đặt lại góc nhìn ban đầu"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          <div className="text-xs text-slate-400 font-semibold">
            Biểu đồ phân phối phổ điểm học lực & tỷ lệ phân bố toàn lớp
          </div>
        </div>
      )}
    </div>
  );
};
