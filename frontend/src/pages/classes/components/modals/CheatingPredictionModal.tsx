import React, { useState, useMemo } from 'react';
import {
  X,
  Eye,
  AlertTriangle,
  ArrowRight,
  Shuffle,
  CheckCircle2,
  SlidersHorizontal,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { SeatingCol, AttendanceRecord } from '../../types';
import {
  predictCheatingProbabilities,
  CheatingPredictionPair,
} from '../../utils/cheatingPredictionEngine';
import { format1Dec } from '../../../../utils';
import { showToast } from '../../../../components/Toast';

interface CheatingPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seatingGrid: SeatingCol[];
  attendanceRecords: AttendanceRecord[];
  attendanceDate: string;
  onSwapSeats?: (studentAId: number, studentBId: number) => void;
}

export const CheatingPredictionModal: React.FC<CheatingPredictionModalProps> = ({
  isOpen,
  onClose,
  seatingGrid,
  attendanceRecords,
  attendanceDate,
  onSwapSeats,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'same_desk'>('all');

  // Compute cheating probability pairs
  const pairs = useMemo(() => {
    if (!isOpen) return [];
    return predictCheatingProbabilities(seatingGrid, attendanceRecords);
  }, [isOpen, seatingGrid, attendanceRecords]);

  const filteredPairs = useMemo(() => {
    if (filterMode === 'high') {
      return pairs.filter((p) => p.riskLevel === 'high');
    }
    if (filterMode === 'same_desk') {
      return pairs.filter((p) => p.proximityType === 'same_desk');
    }
    return pairs;
  }, [pairs, filterMode]);

  const highRiskCount = pairs.filter((p) => p.riskLevel === 'high').length;
  const mediumRiskCount = pairs.filter((p) => p.riskLevel === 'medium').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-3xl bg-[#0c0f1e] border border-[#1e2742] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#080b14] select-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Eye size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Dự Đoán Tỉ Lệ Nhìn Bài
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {attendanceDate}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Mô hình AI đối soát tọa độ chỗ ngồi, khoảng cách tầm nhìn và điểm số buổi học
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer border border-white/5"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* SUMMARY KPI STRIP & FILTER PILLS */}
        <div className="p-4 bg-[#0a0d18] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Phát hiện:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-black text-white">
              {pairs.length} Cặp nghi vấn
            </span>
            {highRiskCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black">
                {highRiskCount} Nguy cơ cao (≥ 70%)
              </span>
            )}
            {mediumRiskCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
                {mediumRiskCount} Cần lưu ý (50-69%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-[#080b14] p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: `Tất cả (${pairs.length})` },
              { id: 'high', label: `Nguy cơ cao (${highRiskCount})` },
              { id: 'same_desk', label: 'Cùng bàn' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* PAIRS LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredPairs.length > 0 ? (
            filteredPairs.map((p, idx) => {
              const isHigh = p.riskLevel === 'high';
              return (
                <div
                  key={`${p.copierId}-${p.sourceId}-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isHigh
                      ? 'bg-[#121626] border-rose-500/40 hover:border-rose-500/70'
                      : 'bg-[#0f1320] border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    {/* RISK METER BADGE */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                          isHigh
                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <Eye size={13} />
                        <span>Xác suất nhìn bài: {p.probability}%</span>
                      </span>

                      <span className="text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {p.proximityLabel}
                      </span>
                    </div>

                    {/* SEAT SWAP BUTTON */}
                    {onSwapSeats && (
                      <button
                        type="button"
                        onClick={() => {
                          onSwapSeats(p.copierId, p.sourceId);
                          showToast(`Đã đổi chỗ giữa ${p.copierName} và ${p.sourceName}`, 'success');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
                        title="Đổi chỗ ngay để phá vỡ cặp nghi vấn này"
                      >
                        <Shuffle size={12} />
                        <span>Đổi Chỗ Cặp Này</span>
                      </button>
                    )}
                  </div>

                  {/* COPIER -> SOURCE INTERACTION ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center bg-[#080b14] p-3 rounded-xl border border-white/5">
                    {/* LEFT: POTENTIAL COPIER (A) */}
                    <div className="md:col-span-3 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                        Nghi vấn nhìn bài (Học sinh A)
                      </span>
                      <p className="text-sm font-black text-white">{p.copierName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-indigo-400" />
                          <span>{p.copierSeat}</span>
                        </span>
                        <span className="font-extrabold text-blue-400">
                          Điểm Check: {format1Dec(p.copierScore)}
                        </span>
                      </div>
                    </div>

                    {/* MIDDLE: DIRECTION ARROW */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center text-slate-500 py-1">
                      <span className="text-[10px] font-bold text-amber-400">Liếc sang</span>
                      <ArrowRight size={18} className="text-amber-400" />
                    </div>

                    {/* RIGHT: SOURCE STUDENT (B) */}
                    <div className="md:col-span-3 space-y-1 md:text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                        Nguồn bị nhìn bài (Học sinh B)
                      </span>
                      <p className="text-sm font-black text-white">{p.sourceName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 md:justify-end">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-indigo-400" />
                          <span>{p.sourceSeat}</span>
                        </span>
                        <span className="font-extrabold text-emerald-400">
                          Điểm Check: {format1Dec(p.sourceScore)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REASONS EXPLAINABLE AI TAGS */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Cơ sở đánh giá:</span>
                    {p.reasons.map((r, rIdx) => (
                      <span
                        key={rIdx}
                        className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 text-[11px] font-medium"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-black text-white">
                Không Phát Hiện Nguy Cơ Nhìn Bài Bất Thường
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Các học sinh ngồi trong tầm mắt có điểm số phân hóa tự nhiên hoặc không có cơ hội nhìn bài
                của nhau trong buổi học này.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-white/10 bg-[#080b14] flex items-center justify-between text-xs text-slate-400 select-none">
          <span>Mô hình kết hợp hình học chỗ ngồi và sai số điểm số</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
