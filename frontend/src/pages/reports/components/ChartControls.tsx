import React from 'react';
import { TrendingUp, BarChart2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { DistributionStats, GradeTypeFilterKey } from '../utils/distributionAnalytics';
import { ChartDateRangePicker } from './ChartDateRangePicker';

interface ChartControlsProps {
  engine: any;
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  onOpenPhaseModal: () => void;
  timeView: '1m' | '2m' | '3m' | 'all';
  setTimeView: (v: '1m' | '2m' | '3m' | 'all') => void;
  customRange?: { startStr: string; endStr: string } | null;
  setCustomRange?: (r: { startStr: string; endStr: string } | null) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  chartViewMode: 'timeline' | 'distribution';
  setChartViewMode: (mode: 'timeline' | 'distribution') => void;
  distributionStats?: DistributionStats;
  hideDistributionToggle?: boolean;
  gradeTypesList?: any[];
  selectedGradeTypeFilter?: GradeTypeFilterKey;
  setSelectedGradeTypeFilter?: (key: GradeTypeFilterKey) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  timePhases,
  selectedPhaseId,
  setSelectedPhaseId,
  timeView,
  setTimeView,
  customRange,
  setCustomRange,
  zoomLevel,
  setZoomLevel,
  setPanOffset,
  chartViewMode,
  setChartViewMode,
  hideDistributionToggle = false,
  selectedGradeTypeFilter,
  setSelectedGradeTypeFilter,
}) => {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-[#181f36] pb-3">
      {chartViewMode === 'timeline' ? (
        /* SINGLE-ROW HEADER: TIẾN ĐỘ HỌC TẬP + INTEGRATED DATEPICKER + ZOOM + TOGGLE */
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider shrink-0">
            TIẾN ĐỘ HỌC TẬP
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 2-in-1 Integrated Schedule DatePicker: Custom Range, Presets & Phases */}
            <ChartDateRangePicker
              timeView={timeView}
              setTimeView={setTimeView}
              timePhases={timePhases}
              selectedPhaseId={selectedPhaseId}
              setSelectedPhaseId={setSelectedPhaseId}
              customRange={customRange}
              setCustomRange={setCustomRange}
            />

            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-[#181a20] rounded-xl p-0.5 border-0 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer border-0 active:scale-95"
                title="Phóng to biểu đồ"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer border-0 active:scale-95"
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
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer border-0 active:scale-95"
                title="Đặt lại góc nhìn ban đầu"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* View Mode Switcher */}
            {!hideDistributionToggle && (
              <button
                type="button"
                onClick={() => setChartViewMode('distribution')}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] border-0"
                title="Chuyển sang xem phổ điểm"
              >
                <BarChart2 size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* SINGLE-ROW HEADER: PHỔ ĐIỂM + SKILL FILTER + TOGGLE */
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider shrink-0">
            PHỔ ĐIỂM
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {selectedGradeTypeFilter && setSelectedGradeTypeFilter && (
              <SegmentedControl<GradeTypeFilterKey>
                value={selectedGradeTypeFilter}
                onChange={setSelectedGradeTypeFilter}
                options={[
                  { value: 'overall', label: 'Tất Cả' },
                  { value: 'check_1', label: 'Từ Vựng' },
                  { value: 'check_2', label: 'Ngữ Pháp' },
                  { value: 'homework', label: 'BTVN' },
                  { value: 'mock_test', label: 'Luyện Đề' },
                ]}
                activeColor="bg-[#2563eb]"
                size="sm"
              />
            )}

            {!hideDistributionToggle && (
              <button
                type="button"
                onClick={() => setChartViewMode('timeline')}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] border-0"
                title="Chuyển sang xem tiến độ học tập"
              >
                <TrendingUp size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
