import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { trunc1Dec } from '../../../../utils';
import { useSessionOverview } from './useSessionOverview';
import { BelowThresholdCard, DivergenceCard } from './SessionOverviewCards';

interface SessionOverviewBannerProps {
  attendanceRecords: AttendanceRecord[];
  attendanceDate: string;
  onFilterStudent?: (studentName: string) => void;
}

export const SessionOverviewBanner: React.FC<SessionOverviewBannerProps> = ({
  attendanceRecords,
  attendanceDate,
  onFilterStudent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    stats,
    belowAvgData,
    divergenceStudents,
    hasAlerts,
    thresholdMode,
    divergenceMin,
    setDivergenceMin,
    threshC1Input,
    threshC2Input,
    threshHwInput,
    handleC1Change,
    handleC2Change,
    handleHwChange,
    handleApplyAllCustom,
    handleSetStandard,
    handleSetClassAvg,
    handleSetCustom,
  } = useSessionOverview(attendanceRecords);

  return (
    <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-4 shadow-xl transition-all">
      {/* 1. MASTER HEADER STRIP (No medal icon per user request) */}
      <div className="flex flex-wrap items-center justify-between gap-3 select-none">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white tracking-wide uppercase">
              Tổng Quan Buổi Học
            </h3>
            <span className="text-[11px] font-bold text-slate-400">({attendanceDate})</span>
            {hasAlerts ? (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {belowAvgData.belowC1.length +
                  belowAvgData.belowC2.length +
                  belowAvgData.belowHw.length +
                  divergenceStudents.length}{' '}
                Cảnh báo
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 size={11} /> 100% Đạt Chuẩn
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Đánh giá điểm trung bình và phát hiện sớm các trường hợp lệch điểm bất thường
          </p>
        </div>

        {/* RIGHT: CLASS AVERAGE STATS & EXPAND TOGGLE */}
        <div className="flex items-center gap-2">
          {/* Average metrics pills */}
          <div className="hidden sm:flex items-center gap-2.5 bg-[#080b14] px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">TB Check 1:</span>
              <span className="text-blue-400 font-extrabold">{trunc1Dec(stats.avgC1)}</span>
            </div>
            <div className="flex items-center gap-1 pl-2.5 border-l border-white/10">
              <span className="text-slate-400">TB Check 2:</span>
              <span className="text-purple-400 font-extrabold">{trunc1Dec(stats.avgC2)}</span>
            </div>
            <div className="flex items-center gap-1 pl-2.5 border-l border-white/10">
              <span className="text-slate-400">TB BTVN:</span>
              <span className="text-emerald-400 font-extrabold">{trunc1Dec(stats.avgHw)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/5 cursor-pointer"
            title={isExpanded ? 'Thu gọn tổng quan' : 'Mở rộng tổng quan'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* 2. EXPANDED CONTENT BODY */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-white/5 space-y-4">
          {/* CONTROL STRIP: THRESHOLD SELECTION & DISCREPANCY SENSITIVITY */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#080b14] p-2.5 rounded-xl border border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <SlidersHorizontal size={12} className="text-indigo-400" />
                Chuẩn điểm dưới:
              </span>
              <button
                type="button"
                onClick={handleSetStandard}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  thresholdMode === 'standard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                Dưới 5.0 (Chuẩn VN)
              </button>
              <button
                type="button"
                onClick={handleSetClassAvg}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  thresholdMode === 'classAvg'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                Dưới TB Buổi Học
              </button>
              <button
                type="button"
                onClick={handleSetCustom}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  thresholdMode === 'custom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                Tùy chỉnh
              </button>

              {thresholdMode === 'custom' && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                  <span>Tất cả:</span>
                  <span className="text-indigo-400 font-bold">&lt;</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Điểm"
                    onChange={(e) => handleApplyAllCustom(e.target.value)}
                    className="w-10 bg-transparent text-white font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    title="Nhập mức điểm áp dụng chung cho cả 3 cột Check 1, Check 2, BTVN"
                  />
                  <span>đ</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-400" />
                Mức độ lệch BTVN &gt; Check:
              </span>
              {[
                { label: '≥ 1.5 đ', val: 1.5 },
                { label: '≥ 2.0 đ', val: 2.0 },
                { label: 'Tất cả (> 0)', val: 0.1 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDivergenceMin(opt.val)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    divergenceMin === opt.val
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. METRIC CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CARD 1: CHECK 1 */}
            <BelowThresholdCard
              title="Check 1"
              theme="blue"
              threshInput={threshC1Input}
              onThreshChange={handleC1Change}
              students={belowAvgData.belowC1}
              onFilterStudent={onFilterStudent}
            />

            {/* CARD 2: CHECK 2 */}
            <BelowThresholdCard
              title="Check 2"
              theme="purple"
              threshInput={threshC2Input}
              onThreshChange={handleC2Change}
              students={belowAvgData.belowC2}
              onFilterStudent={onFilterStudent}
            />

            {/* CARD 3: BTVN */}
            <BelowThresholdCard
              title="BTVN"
              theme="emerald"
              threshInput={threshHwInput}
              onThreshChange={handleHwChange}
              students={belowAvgData.belowHw}
              onFilterStudent={onFilterStudent}
            />

            {/* CARD 4: CẢNH BÁO ĐỘ LỆCH (BTVN > TRÊN LỚP) */}
            <DivergenceCard
              students={divergenceStudents}
              onFilterStudent={onFilterStudent}
            />
          </div>
        </div>
      )}
    </div>
  );
};
