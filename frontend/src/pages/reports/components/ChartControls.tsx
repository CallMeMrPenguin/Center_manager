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
  gradeTypesList?: any[];
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
  gradeTypesList,
}) => {
  const c1Item = gradeTypesList?.find((g: any) => g.id === 'check_1');
  const c2Item = gradeTypesList?.find((g: any) => g.id === 'check_2');
  const hwItem = gradeTypesList?.find((g: any) => g.id === 'homework');

  const c1Color = c1Item?.color || '#3b82f6';
  const c2Color = c2Item?.color || '#a855f7';
  const hwColor = hwItem?.color || '#10b981';

  const c1Label = c1Item?.label || 'Từ Vựng';
  const c2Label = c2Item?.label || 'Ngữ Pháp';
  const hwLabel = hwItem?.label || 'BTVN';

  return (
    <div className="flex flex-col gap-3.5 border-b border-slate-200 dark:border-[#181f36] pb-3">
      {/* 1. TOP HEADER: View Mode Toggle & Mode Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          {chartViewMode === 'timeline' ? (
            <TrendingUp size={18} className="text-blue-500 dark:text-blue-400" />
          ) : (
            <BarChart2 size={18} className="text-cyan-500 dark:text-cyan-400" />
          )}
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
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
            activeColor="bg-[#2563eb] shadow-[0_0_12px_rgba(37,99,235,0.5)]"
            size="sm"
          />
        )}
      </div>

      {/* Dynamic Sub-Controls depending on Active Chart Mode */}
      {chartViewMode === 'timeline' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/5 text-xs">
          {/* Legend with Predictions */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold"
              style={{
                color: c1Color,
                backgroundColor: `${c1Color}18`,
                borderColor: `${c1Color}35`,
              }}
            >
              <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: c1Color }} />
              {c1Label} (Dự đoán: {format1Dec(engine?.pred_c1 ?? 0)})
            </span>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold"
              style={{
                color: c2Color,
                backgroundColor: `${c2Color}18`,
                borderColor: `${c2Color}35`,
              }}
            >
              <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: c2Color }} />
              {c2Label} (Dự đoán: {format1Dec(engine?.pred_c2 ?? 0)})
            </span>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold"
              style={{
                color: hwColor,
                backgroundColor: `${hwColor}18`,
                borderColor: `${hwColor}35`,
              }}
            >
              <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: hwColor }} />
              {hwLabel} (Dự đoán: {format1Dec(engine?.pred_hw ?? 0)})
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
                activeColor="bg-[#2563eb] shadow-[0_0_12px_rgba(37,99,235,0.4)]"
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
                  icon={<Clock size={13} className="text-blue-400" />}
                />
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#202534] border border-slate-200 dark:border-[#2e374a] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition cursor-pointer"
                title="Phóng to biểu đồ"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition cursor-pointer"
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
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition cursor-pointer"
                title="Đặt lại góc nhìn ban đầu"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/5 text-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Biểu đồ phân phối phổ điểm học lực & tỷ lệ phân bố toàn lớp
          </div>
        </div>
      )}
    </div>
  );
};
