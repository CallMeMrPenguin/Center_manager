import React, { useMemo, useState } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { trunc1Dec, format1Dec } from '../../../../utils';

interface SessionOverviewBannerProps {
  attendanceRecords: AttendanceRecord[];
  attendanceDate: string;
  onFilterStudent?: (studentName: string) => void;
}

interface DiscrepancyStudent {
  student_id: number;
  student_name: string;
  homework: number;
  checkAvg: number;
  diff: number;
  c1: number | null;
  c2: number | null;
}

export const SessionOverviewBanner: React.FC<SessionOverviewBannerProps> = ({
  attendanceRecords,
  attendanceDate,
  onFilterStudent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [thresholdMode, setThresholdMode] = useState<'standard' | 'classAvg'>('standard'); // standard: < 5.0, classAvg: < avg
  const [divergenceMin, setDivergenceMin] = useState<number>(1.5); // 1.5, 2.0, 0
  const [activeTab, setActiveTab] = useState<'all' | 'c1' | 'c2' | 'hw' | 'divergence'>('all');

  // 1. Calculate class statistics
  const stats = useMemo(() => {
    let sumC1 = 0;
    let countC1 = 0;
    let sumC2 = 0;
    let countC2 = 0;
    let sumHw = 0;
    let countHw = 0;

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Vắng mặt') return;

      if (rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== '') {
        const val = Number(rec.check_1);
        if (!isNaN(val)) {
          sumC1 += val;
          countC1++;
        }
      }
      if (rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== '') {
        const val = Number(rec.check_2);
        if (!isNaN(val)) {
          sumC2 += val;
          countC2++;
        }
      }
      if (rec.homework !== null && rec.homework !== undefined && rec.homework !== '') {
        const val = Number(rec.homework);
        if (!isNaN(val)) {
          sumHw += val;
          countHw++;
        }
      }
    });

    const avgC1 = countC1 > 0 ? sumC1 / countC1 : 0;
    const avgC2 = countC2 > 0 ? sumC2 / countC2 : 0;
    const avgHw = countHw > 0 ? sumHw / countHw : 0;

    return {
      avgC1,
      avgC2,
      avgHw,
      countC1,
      countC2,
      countHw,
    };
  }, [attendanceRecords]);

  // 2. Identify students below average
  const belowAvgData = useMemo(() => {
    const threshC1 = thresholdMode === 'standard' ? 5.0 : stats.avgC1;
    const threshC2 = thresholdMode === 'standard' ? 5.0 : stats.avgC2;
    const threshHw = thresholdMode === 'standard' ? 5.0 : stats.avgHw;

    const belowC1: { student_id: number; student_name: string; score: number }[] = [];
    const belowC2: { student_id: number; student_name: string; score: number }[] = [];
    const belowHw: { student_id: number; student_name: string; score: number }[] = [];

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Vắng mặt') return;

      if (rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== '') {
        const val = Number(rec.check_1);
        if (!isNaN(val) && val < threshC1) {
          belowC1.push({ student_id: rec.student_id, student_name: rec.student_name, score: val });
        }
      }
      if (rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== '') {
        const val = Number(rec.check_2);
        if (!isNaN(val) && val < threshC2) {
          belowC2.push({ student_id: rec.student_id, student_name: rec.student_name, score: val });
        }
      }
      if (rec.homework !== null && rec.homework !== undefined && rec.homework !== '') {
        const val = Number(rec.homework);
        if (!isNaN(val) && val < threshHw) {
          belowHw.push({ student_id: rec.student_id, student_name: rec.student_name, score: val });
        }
      }
    });

    belowC1.sort((a, b) => a.score - b.score);
    belowC2.sort((a, b) => a.score - b.score);
    belowHw.sort((a, b) => a.score - b.score);

    return { belowC1, belowC2, belowHw, threshC1, threshC2, threshHw };
  }, [attendanceRecords, thresholdMode, stats]);

  // 3. Identify students with large discrepancy:
  // (điểm về nhà - trung bình c1vs2 lấy giá trị dương và ko áp dụng với học sinh điểm về nhà 0:ko btvn)
  const divergenceStudents = useMemo<DiscrepancyStudent[]>(() => {
    const list: DiscrepancyStudent[] = [];

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Vắng mặt') return;

      if (rec.homework === null || rec.homework === undefined || rec.homework === '') return;
      const hwVal = Number(rec.homework);
      if (isNaN(hwVal) || hwVal <= 0) return; // Do not apply to homework = 0 or missing

      const c1Val =
        rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== ''
          ? Number(rec.check_1)
          : null;
      const c2Val =
        rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== ''
          ? Number(rec.check_2)
          : null;

      const validC1 = c1Val !== null && !isNaN(c1Val);
      const validC2 = c2Val !== null && !isNaN(c2Val);

      if (!validC1 && !validC2) return;

      let checkAvg = 0;
      if (validC1 && validC2) {
        checkAvg = (c1Val! + c2Val!) / 2;
      } else if (validC1) {
        checkAvg = c1Val!;
      } else {
        checkAvg = c2Val!;
      }

      const diff = hwVal - checkAvg;
      if (diff > 0 && diff >= divergenceMin) {
        list.push({
          student_id: rec.student_id,
          student_name: rec.student_name,
          homework: hwVal,
          checkAvg,
          diff,
          c1: validC1 ? c1Val : null,
          c2: validC2 ? c2Val : null,
        });
      }
    });

    list.sort((a, b) => b.diff - a.diff);
    return list;
  }, [attendanceRecords, divergenceMin]);

  const hasAlerts =
    belowAvgData.belowC1.length > 0 ||
    belowAvgData.belowC2.length > 0 ||
    belowAvgData.belowHw.length > 0 ||
    divergenceStudents.length > 0;

  return (
    <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-4 shadow-xl transition-all">
      {/* 1. MASTER HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Award size={18} />
          </div>
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
        </div>

        {/* RIGHT: CLASS AVERAGE STATS & EXPAND TOGGLE */}
        <div className="flex items-center gap-2">
          {/* Average metrics pills */}
          <div className="hidden sm:flex items-center gap-2 bg-[#080b14] px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold">
            <span className="text-slate-400">TB Check 1:</span>
            <span className="text-blue-400 font-extrabold">{trunc1Dec(stats.avgC1)}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600 mx-1" />
            <span className="text-slate-400">TB Check 2:</span>
            <span className="text-purple-400 font-extrabold">{trunc1Dec(stats.avgC2)}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600 mx-1" />
            <span className="text-slate-400">TB BTVN:</span>
            <span className="text-emerald-400 font-extrabold">{trunc1Dec(stats.avgHw)}</span>
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
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <SlidersHorizontal size={12} className="text-indigo-400" />
                Chuẩn điểm dưới TB:
              </span>
              <button
                type="button"
                onClick={() => setThresholdMode('standard')}
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
                onClick={() => setThresholdMode('classAvg')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  thresholdMode === 'classAvg'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                Dưới TB Buổi Học
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-400" />
                Mức độ lệch BTVN &gt; Check:
              </span>
              {[
                { label: '≥ 1.5 đ', val: 1.5 },
                { label: '≥ 2.0 đ', val: 2.0 },
                { label: 'Tất cả (&gt; 0)', val: 0.1 },
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
            {/* CARD 1: CHECK 1 DƯỚI TB */}
            <div className="bg-[#080b14] border border-blue-500/20 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-wider">
                    Dưới TB Check 1
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                      belowAvgData.belowC1.length > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {belowAvgData.belowC1.length} HS
                  </span>
                </div>
                {belowAvgData.belowC1.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {belowAvgData.belowC1.map((s) => (
                      <button
                        key={s.student_id}
                        type="button"
                        onClick={() => onFilterStudent?.(s.student_name)}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Bấm để lọc học sinh này"
                      >
                        <span>{s.student_name}</span>
                        <span className="text-rose-400 font-black">({format1Dec(s.score)})</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-2">
                    Không có học sinh dưới điểm chuẩn
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                Ngưỡng: &lt; {format1Dec(belowAvgData.threshC1)}
              </span>
            </div>

            {/* CARD 2: CHECK 2 DƯỚI TB */}
            <div className="bg-[#080b14] border border-purple-500/20 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                    Dưới TB Check 2
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                      belowAvgData.belowC2.length > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {belowAvgData.belowC2.length} HS
                  </span>
                </div>
                {belowAvgData.belowC2.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {belowAvgData.belowC2.map((s) => (
                      <button
                        key={s.student_id}
                        type="button"
                        onClick={() => onFilterStudent?.(s.student_name)}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Bấm để lọc học sinh này"
                      >
                        <span>{s.student_name}</span>
                        <span className="text-rose-400 font-black">({format1Dec(s.score)})</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-2">
                    Không có học sinh dưới điểm chuẩn
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                Ngưỡng: &lt; {format1Dec(belowAvgData.threshC2)}
              </span>
            </div>

            {/* CARD 3: BTVN DƯỚI TB */}
            <div className="bg-[#080b14] border border-emerald-500/20 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Dưới TB BTVN
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                      belowAvgData.belowHw.length > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {belowAvgData.belowHw.length} HS
                  </span>
                </div>
                {belowAvgData.belowHw.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {belowAvgData.belowHw.map((s) => (
                      <button
                        key={s.student_id}
                        type="button"
                        onClick={() => onFilterStudent?.(s.student_name)}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Bấm để lọc học sinh này"
                      >
                        <span>{s.student_name}</span>
                        <span className="text-rose-400 font-black">({format1Dec(s.score)})</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-2">
                    Không có học sinh dưới điểm chuẩn
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                Ngưỡng: &lt; {format1Dec(belowAvgData.threshHw)}
              </span>
            </div>

            {/* CARD 4: CẢNH BÁO LỆCH ĐIỂM LỚN (BTVN > TRÊN LỚP) */}
            <div className="bg-[#080b14] border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-400" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Điểm Lệch Lớn
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                      divergenceStudents.length > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {divergenceStudents.length} HS
                  </span>
                </div>
                {divergenceStudents.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {divergenceStudents.map((s) => (
                      <button
                        key={s.student_id}
                        type="button"
                        onClick={() => onFilterStudent?.(s.student_name)}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-xs font-bold flex items-center justify-between transition cursor-pointer text-left"
                        title={`BTVN: ${format1Dec(s.homework)} | TB Check: ${format1Dec(s.checkAvg)}. Bấm để lọc.`}
                      >
                        <span className="truncate max-w-[120px]">{s.student_name}</span>
                        <span className="text-amber-400 font-black shrink-0">
                          +{format1Dec(s.diff)} đ
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-2">
                    Không có trường hợp lệch điểm bất thường
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block font-medium">
                Công thức: BTVN - TB(Check 1,2) &gt; 0 (Bỏ qua BTVN=0)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
