import React from 'react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { ZoomButtonGroup, ViewModeButton } from '../../../components/button';
import { DistributionStats, GradeTypeFilterKey } from '../utils/distributionAnalytics';

interface ChartControlsProps {
  engine: any;
  timePhases?: any[];
  selectedPhaseId?: string;
  setSelectedPhaseId?: (id: string) => void;
  onOpenPhaseModal?: () => void;
  timeView?: '1m' | '2m' | '3m' | 'all';
  setTimeView?: (v: '1m' | '2m' | '3m' | 'all') => void;
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
        /* SINGLE-ROW HEADER: TIẾN ĐỘ HỌC TẬP + ZOOM + TOGGLE */
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider shrink-0">
            TIẾN ĐỘ HỌC TẬP
          </h3>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Standard Zoom Button Group from src/components/button/ */}
            <ZoomButtonGroup
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              setPanOffset={setPanOffset}
            />

            {/* Standard View Mode Toggle Button from src/components/button/ */}
            {!hideDistributionToggle && (
              <ViewModeButton
                currentMode={chartViewMode}
                onToggle={setChartViewMode}
              />
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
              <ViewModeButton
                currentMode={chartViewMode}
                onToggle={setChartViewMode}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartControls;
