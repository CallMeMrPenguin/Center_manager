import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { DualComparisonBars } from './DualComparisonBars';
import { getStudentTier } from '../types';
import { computeDuelStats } from '../utils/computeDuelStats';
import { format1Dec } from '../../../utils';

interface HeadToHeadDuelProps {
  classes: any[];
  studentRankings: any[];
  sessionRecords: any[];
  compareClassAId: string;
  setCompareClassAId: (id: string) => void;
  compareClassBId: string;
  setCompareClassBId: (id: string) => void;
  selectedClassId: string;
  analyticsSummary: any;
  classAnalyticsMap: Record<string, any>;
}

export const HeadToHeadDuel: React.FC<HeadToHeadDuelProps> = ({
  classes,
  studentRankings,
  sessionRecords,
  compareClassAId,
  setCompareClassAId,
  compareClassBId,
  setCompareClassBId,
  selectedClassId,
  analyticsSummary,
  classAnalyticsMap,
}) => {
  const classComparisonData = useMemo(() => {
    return computeDuelStats({
      classes,
      studentRankings,
      sessionRecords,
      compareClassAId,
      compareClassBId,
      selectedClassId,
      analyticsSummary,
      classAnalyticsMap,
    });
  }, [classes, studentRankings, sessionRecords, compareClassAId, compareClassBId, selectedClassId, analyticsSummary, classAnalyticsMap]);

  if (!classComparisonData) return null;

  return (
    <div className="space-y-5 animate-cascade-1">
      {/* 1. Merged Dual Class Arena — 1 Unified Symmetrical Card */}
      <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-6 shadow-sm dark:shadow-xl hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:divide-x lg:divide-slate-100 lg:dark:divide-white/5 relative">
          {/* Class A Side */}
          <div className="flex flex-col justify-between gap-5 lg:pr-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 gap-3">
              <div className="w-60 max-w-full">
                <CustomSelect
                  value={compareClassAId}
                  onChange={(val) => setCompareClassAId(String(val))}
                  options={classes.map((c) => ({ value: String(c.id), label: c.class_name }))}
                  triggerClassName="bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-lg font-black px-3.5 py-2 rounded-xl border border-blue-500/20"
                />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl shrink-0">
                {classComparisonData.classA.studentCount} Học Sinh
              </span>
            </div>

            {/* Big Stat Display */}
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Điểm EMA Trung Bình
                </span>
                <div className="text-4xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {classComparisonData.classA.avgEma > 0 ? format1Dec(classComparisonData.classA.avgEma) : '-'}
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-1">đ</span>
                </div>
              </div>

              {classComparisonData.emaDiff !== 0 && (
                <div className="text-right">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl whitespace-nowrap inline-block ${
                      classComparisonData.emaDiff > 0
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5'
                    }`}
                  >
                    {classComparisonData.emaDiff > 0
                      ? `Dẫn đầu +${format1Dec(classComparisonData.emaDiff)} đ`
                      : `Thấp hơn -${format1Dec(Math.abs(classComparisonData.emaDiff))} đ`}
                  </span>
                </div>
              )}
            </div>

            {/* 3 Key Metrics Row */}
            <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 dark:border-white/5">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                  Chuyên Cần
                </span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {classComparisonData.classA.attendancePct}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                  Tiến Bộ
                </span>
                <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {classComparisonData.classA.improvingPct}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                  Độ Lệch SD
                </span>
                <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                  {format1Dec(Number(classComparisonData.classA.classSd || 0))}
                </span>
              </div>
            </div>

            {/* Integrated Top Student */}
            <div className="flex items-center gap-3 pt-1">
              {classComparisonData.classA.topStudent ? (
                <img
                  src={getStudentTier(Number(classComparisonData.classA.topStudent.ema_level || 0)).badge}
                  alt="Rank"
                  className="w-9 h-9 object-contain shrink-0"
                />
              ) : (
                <Award size={24} className="text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Học Sinh Dẫn Đầu Lớp
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                  {classComparisonData.classA.topStudent ? classComparisonData.classA.topStudent.full_name : 'Chưa có'}
                </span>
              </div>
              {classComparisonData.classA.topStudent && (
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 shrink-0">
                  EMA {format1Dec(Number(classComparisonData.classA.topStudent.ema_level || 0))}
                </span>
              )}
            </div>
          </div>

          {/* Class B Side */}
          <div className="flex flex-col justify-between gap-5 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 gap-3">
              <div className="w-60 max-w-full">
                <CustomSelect
                  value={compareClassBId}
                  onChange={(val) => setCompareClassBId(String(val))}
                  options={classes.map((c) => ({ value: String(c.id), label: c.class_name }))}
                  triggerClassName="bg-cyan-50/80 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 text-lg font-black px-3.5 py-2 rounded-xl border border-cyan-500/20"
                />
              </div>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1.5 rounded-xl shrink-0">
                {classComparisonData.classB.studentCount} Học Sinh
              </span>
            </div>

            {/* Big Stat Display */}
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Điểm EMA Trung Bình
                </span>
                <div className="text-4xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                  {classComparisonData.classB.avgEma > 0 ? format1Dec(classComparisonData.classB.avgEma) : '-'}
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-1">đ</span>
                </div>
              </div>

              {classComparisonData.emaDiff !== 0 && (
                <div className="text-right">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl whitespace-nowrap inline-block ${
                      classComparisonData.emaDiff < 0
                        ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/15'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5'
                    }`}
                  >
                    {classComparisonData.emaDiff < 0
                      ? `Dẫn đầu +${format1Dec(Math.abs(classComparisonData.emaDiff))} đ`
                      : `Thấp hơn -${format1Dec(classComparisonData.emaDiff)} đ`}
                  </span>
                </div>
              )}
            </div>

            {/* 3 Key Metrics Row */}
            <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 dark:border-white/5">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                  Chuyên Cần
                </span>
                <span className="text-lg font-black font-mono text-teal-600 dark:text-teal-400">
                  {classComparisonData.classB.attendancePct}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                  Tiến Bộ
                </span>
                <span className="text-lg font-black font-mono text-cyan-600 dark:text-cyan-300">
                  {classComparisonData.classB.improvingPct}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                  Độ Lệch SD
                </span>
                <span className="text-lg font-black font-mono text-yellow-600 dark:text-yellow-400">
                  {format1Dec(Number(classComparisonData.classB.classSd || 0))}
                </span>
              </div>
            </div>

            {/* Integrated Top Student */}
            <div className="flex items-center gap-3 pt-1">
              {classComparisonData.classB.topStudent ? (
                <img
                  src={getStudentTier(Number(classComparisonData.classB.topStudent.ema_level || 0)).badge}
                  alt="Rank"
                  className="w-9 h-9 object-contain shrink-0"
                />
              ) : (
                <Award size={24} className="text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Học Sinh Dẫn Đầu Lớp
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                  {classComparisonData.classB.topStudent ? classComparisonData.classB.topStudent.full_name : 'Chưa có'}
                </span>
              </div>
              {classComparisonData.classB.topStudent && (
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 shrink-0">
                  EMA {format1Dec(Number(classComparisonData.classB.topStudent.ema_level || 0))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Component Scores & 6-Tier Rank Distribution */}
      <DualComparisonBars
        classA={classComparisonData.classA}
        classB={classComparisonData.classB}
        compareClassAId={compareClassAId}
        compareClassBId={compareClassBId}
      />
    </div>
  );
};
