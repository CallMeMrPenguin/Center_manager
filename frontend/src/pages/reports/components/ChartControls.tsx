import React from 'react';
import { ZoomIn, ZoomOut, Clock, Plus } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';

interface ChartControlsProps {
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  onOpenPhaseModal: () => void;
  timeView: '1m' | '2m' | '3m' | 'all';
  setTimeView: (v: '1m' | '2m' | '3m' | 'all') => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  timePhases,
  selectedPhaseId,
  setSelectedPhaseId,
  onOpenPhaseModal,
  timeView,
  setTimeView,
  zoomLevel,
  setZoomLevel,
  setPanOffset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#161f33] pb-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-black">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
          <span className="text-white">Check 1 (35%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
          <span className="text-white">Check 2 (55%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span className="text-white">Homework (10%)</span>
        </div>
      </div>

      {/* Filters & Zoom */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Custom Time Phase Selector */}
        <div className="flex items-center gap-1 bg-[#141a2e] border border-[#232d4e] px-2.5 py-1 rounded-xl">
          <Clock size={13} className="text-indigo-400 shrink-0" />
          <CustomSelect
            value={selectedPhaseId}
            onChange={(val) => setSelectedPhaseId(String(val))}
            options={[
              { value: '', label: 'Tất cả mốc thời gian' },
              ...timePhases.map(p => ({ value: String(p.id), label: `${p.phase_name}` }))
            ]}
            className="w-44"
          />
          <button
            type="button"
            onClick={onOpenPhaseModal}
            className="p-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-white transition cursor-pointer"
            title="Quản lý giai đoạn học tập"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Time View Filter */}
        {!selectedPhaseId && (
          <div className="flex items-center bg-[#121626] border border-[#202842] p-0.5 rounded-xl text-xs font-bold">
            {(['1m', '2m', '3m', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeView(t)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${timeView === t ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {t === '1m' ? '1 Tháng' : t === '2m' ? '2 Tháng' : t === '3m' ? '3 Tháng' : 'Tất Cả'}
              </button>
            ))}
          </div>
        )}

        {/* Zoom Buttons */}
        <div className="flex items-center gap-1 bg-[#121626] border border-[#202842] p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(5.0, prev + 0.25))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Phóng to (Zoom In)"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(1.0, prev - 0.25))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Thu nhỏ (Zoom Out)"
          >
            <ZoomOut size={14} />
          </button>
          {zoomLevel > 1.0 && (
            <button
              type="button"
              onClick={() => { setZoomLevel(1.0); setPanOffset({ x: 0, y: 0 }); }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
            >
              100%
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
