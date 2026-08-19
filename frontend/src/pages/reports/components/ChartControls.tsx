import React from 'react';
import { BarChart3, TrendingUp, BarChart2, ZoomIn, ZoomOut, RotateCcw, Clock } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { formatSessionDate } from '../utils';
import { format1Dec } from '../../../utils';
import { BgdDistributionStats } from '../utils/bgdAnalytics';

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
  bgdStats?: BgdDistributionStats;
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
  bgdStats,
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
        <div className="relative flex bg-[#0d1222] border border-[#212c4b] p-1 rounded-xl text-xs font-black select-none w-72 sm:w-80 shrink-0">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: chartViewMode === 'timeline' ? '4px' : 'calc(50% + 1px)',
              width: 'calc(50% - 4px)',
            }}
          />
          <button
            type="button"
            onClick={() => setChartViewMode('timeline')}
            className={`flex-1 relative z-10 py-1.5 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              chartViewMode === 'timeline' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Tiến Trình Thời Gian</span>
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode('distribution')}
            className={`flex-1 relative z-10 py-1.5 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              chartViewMode === 'distribution' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={13} />
            <span>Phổ Điểm Học Lực</span>
          </button>
        </div>
      </div>

      {/* 2. SECONDARY CONTROLS */}
      {chartViewMode === 'timeline' ? (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Legend with Predictions */}
          <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              {isTestMode ? 'Từ Vựng' : 'Check 1'} (Dự đoán: {format1Dec(engine.pred_c1)})
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              {isTestMode ? 'Ngữ Pháp' : 'Check 2'} (Dự đoán: {format1Dec(engine.pred_c2)})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Homework (Dự đoán: {format1Dec(engine.pred_hw)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Interactive Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-[#141b32] border border-[#232d4e] p-1 rounded-xl text-xs font-extrabold shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(5.0, prev + 0.25))}
                className="p-1 rounded-lg hover:bg-indigo-600/30 text-slate-300 hover:text-white transition cursor-pointer"
                title="Phóng to (Zoom In)"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(1.0, prev - 0.25))}
                className="p-1 rounded-lg hover:bg-indigo-600/30 text-slate-300 hover:text-white transition cursor-pointer"
                title="Thu nhỏ (Zoom Out)"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] text-indigo-300 font-mono px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                title="Đặt lại góc nhìn (Reset View)"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Time View Filter */}
            <div className="relative flex bg-[#141b32] border border-[#232d4e] p-1 rounded-xl text-xs font-extrabold select-none w-64 shrink-0">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-indigo-600 shadow-[0_0_14px_rgba(99,102,241,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                style={{
                  left:
                    timeView === '1m'
                      ? '4px'
                      : timeView === '2m'
                      ? 'calc(25% + 1px)'
                      : timeView === '3m'
                      ? 'calc(50% + 1px)'
                      : 'calc(75% + 1px)',
                  width: 'calc(25% - 4px)',
                }}
              />
              {[
                { id: '1m', label: '1 Tháng' },
                { id: '2m', label: '2 Tháng' },
                { id: '3m', label: '3 Tháng' },
                { id: 'all', label: 'Tất Cả' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTimeView(t.id as any);
                    setSelectedPhaseId('');
                  }}
                  className={`flex-1 relative z-10 py-1 text-center transition-colors cursor-pointer ${
                    !selectedPhaseId && timeView === t.id
                      ? 'text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

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
              Tổng số mẫu: <strong className="text-white font-bold">{bgdStats?.n ?? 0}</strong> lượt
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-indigo-300">
              Điểm TB: <strong className="text-white font-bold">{format1Dec(bgdStats?.mean ?? 0)}đ</strong>
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-purple-300">
              Trung vị: <strong className="text-white font-bold">{format1Dec(bgdStats?.median ?? 0)}đ</strong>
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-cyan-300">
              Độ lệch σ: <strong className="text-white font-bold">{format1Dec(bgdStats?.sd ?? 0)}</strong>
            </span>
            <span className="bg-[#101526] border border-[#202b48] px-2.5 py-1 rounded-lg text-emerald-300">
              Đạt chuẩn: <strong className="text-white font-bold">{bgdStats?.passPct ?? 0}%</strong>
            </span>
          </div>

          <span className="bg-[#101526] border border-[#202b48] px-3 py-1 rounded-lg text-[11px] font-bold text-amber-300">
            {bgdStats?.skewnessLabel}
          </span>
        </div>
      )}
    </div>
  );
};
