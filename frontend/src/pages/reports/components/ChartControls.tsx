import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, BarChart2, ZoomIn, ZoomOut, RotateCcw, Calendar, ChevronDown } from 'lucide-react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { formatSessionDate } from '../utils';
import { DistributionStats, GradeTypeFilterKey } from '../utils/distributionAnalytics';

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
  selectedGradeTypeFilter?: GradeTypeFilterKey;
  setSelectedGradeTypeFilter?: (key: GradeTypeFilterKey) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  timePhases,
  selectedPhaseId,
  setSelectedPhaseId,
  timeView,
  setTimeView,
  zoomLevel,
  setZoomLevel,
  setPanOffset,
  chartViewMode,
  setChartViewMode,
  hideDistributionToggle = false,
  selectedGradeTypeFilter,
  setSelectedGradeTypeFilter,
}) => {
  const [phaseDropdownOpen, setPhaseDropdownOpen] = useState(false);
  const phaseRef = useRef<HTMLDivElement>(null);

  const activePhase = timePhases.find((p) => p.id === selectedPhaseId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (phaseRef.current && !phaseRef.current.contains(e.target as Node)) {
        setPhaseDropdownOpen(false);
      }
    };
    if (phaseDropdownOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [phaseDropdownOpen]);

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-[#181f36] pb-3">
      {chartViewMode === 'timeline' ? (
        /* SINGLE-ROW HEADER: TIẾN ĐỘ HỌC TẬP + TIME VIEW + DATEPICKER + ZOOM + TOGGLE */
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider shrink-0">
            TIẾN ĐỘ HỌC TẬP
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Time View Filter (1M, 2M, 3M, ALL) */}
            <div className="w-fit">
              <SegmentedControl<'1m' | '2m' | '3m' | 'all'>
                value={timeView}
                onChange={setTimeView}
                options={[
                  { value: '1m', label: '1T' },
                  { value: '2m', label: '2T' },
                  { value: '3m', label: '3T' },
                  { value: 'all', label: 'Tất cả' },
                ]}
                activeColor="bg-[#2563eb]"
                size="sm"
              />
            </div>

            {/* Time Phase DatePicker Dropdown */}
            {timePhases.length > 0 && (
              <div className="relative" ref={phaseRef}>
                <button
                  type="button"
                  onClick={() => setPhaseDropdownOpen(!phaseDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold border-0 shadow-2xs transition cursor-pointer"
                  title="Chọn giai đoạn xem tiến độ"
                >
                  <Calendar size={13} className="text-blue-500 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-[160px]">
                    {activePhase ? activePhase.phase_name : 'Giai đoạn'}
                  </span>
                  <ChevronDown size={12} className="text-slate-400 shrink-0" />
                </button>

                {phaseDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white dark:bg-[#141926] rounded-2xl shadow-xl border-0 p-1.5 space-y-1 animate-mac-dropdown">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhaseId('');
                        setPhaseDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-bold transition cursor-pointer border-0 ${
                        !selectedPhaseId
                          ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>Tất cả giai đoạn</span>
                    </button>
                    {timePhases.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhaseId(p.id);
                          setPhaseDropdownOpen(false);
                        }}
                        className={`w-full flex flex-col text-left px-3 py-2 text-xs rounded-xl font-bold transition cursor-pointer border-0 ${
                          selectedPhaseId === p.id
                            ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-extrabold">{p.phase_name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {formatSessionDate(p.start_date)} - {formatSessionDate(p.end_date)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/5 rounded-xl p-0.5 border-0 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer border-0"
                title="Phóng to biểu đồ"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer border-0"
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
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer border-0"
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
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shadow-xs border-0"
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
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shadow-xs border-0"
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
