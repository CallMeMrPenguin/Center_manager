import React, { useMemo } from 'react';
import { GitCompare, BarChart3, Users, TrendingUp, Activity, Award } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { DualComparisonBars } from './DualComparisonBars';
import { getClassColor, getStudentTier } from '../types';
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
    <div className="bg-white dark:bg-[#0b0f19] border border-slate-300 dark:border-[#1b253b] rounded-2xl p-6 shadow-md dark:shadow-xl space-y-6 animate-cascade-1">
      {/* Header & Dual Class Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-[#161f33] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <GitCompare size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              SO SÁNH 2 LỚP HỌC
            </h3>
          </div>
        </div>

        {/* Dual Class Selector Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getClassColor(compareClassAId, 0), boxShadow: `0 0 8px ${getClassColor(compareClassAId, 0)}80` }}
            />
            <div className="w-48 shrink-0">
              <CustomSelect
                value={compareClassAId}
                onChange={(val) => setCompareClassAId(String(val))}
                options={classes.map((c) => ({ value: String(c.id), label: c.class_name }))}
              />
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#131b2e] border-0 shadow-2xs font-mono font-black text-xs text-blue-600 dark:text-blue-300 uppercase tracking-wider shrink-0">
            VS
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getClassColor(compareClassBId, 1), boxShadow: `0 0 8px ${getClassColor(compareClassBId, 1)}80` }}
            />
            <div className="w-48 shrink-0">
              <CustomSelect
                value={compareClassBId}
                onChange={(val) => setCompareClassBId(String(val))}
                options={classes.map((c) => ({ value: String(c.id), label: c.class_name }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Duel KPI Comparison Rounded Cards - Curated Soft Tint & Shadow Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-cascade-2">
        {/* 1. EMA Comparison - Soft Blue Theme */}
        <div className="p-4 rounded-2xl bg-blue-50/60 hover:bg-blue-50/90 dark:bg-[#0c1424] border border-blue-200/90 dark:border-blue-500/25 flex flex-col justify-between gap-3 shadow-[0_4px_16px_rgba(37,99,235,0.06)] hover:shadow-md transition-all">
          <div className="flex items-center justify-center gap-2 border-b border-blue-200/70 dark:border-white/5 pb-2 text-center">
            <div className="p-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <BarChart3 size={14} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">ĐIỂM EMA TRUNG BÌNH</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">{classComparisonData.classA.avgEma > 0 ? format1Dec(classComparisonData.classA.avgEma) : '-'}</span>
            </div>
            <span className="text-sm font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">{classComparisonData.classB.avgEma > 0 ? format1Dec(classComparisonData.classB.avgEma) : '-'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-blue-200/70 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.emaDiff > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classA.name} cao hơn +{format1Dec(classComparisonData.emaDiff)} đ
              </span>
            ) : classComparisonData.emaDiff < 0 ? (
              <span className="text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classB.name} cao hơn +{format1Dec(Math.abs(classComparisonData.emaDiff))} đ
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Hai lớp bằng điểm nhau</span>
            )}
          </div>
        </div>

        {/* 2. Attendance % Comparison - Soft Emerald Theme */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50/90 dark:bg-[#071d17] border border-emerald-200/90 dark:border-emerald-500/25 flex flex-col justify-between gap-3 shadow-[0_4px_16px_rgba(16,185,129,0.06)] hover:shadow-md transition-all">
          <div className="flex items-center justify-center gap-2 border-b border-emerald-200/70 dark:border-white/5 pb-2 text-center">
            <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Users size={14} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">CHUYÊN CẦN %</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">{classComparisonData.classA.attendancePct}%</span>
            </div>
            <span className="text-sm font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400">{classComparisonData.classB.attendancePct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-200/70 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.attDiff > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classA.name} chuyên cần hơn +{classComparisonData.attDiff}%
              </span>
            ) : classComparisonData.attDiff < 0 ? (
              <span className="text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classB.name} chuyên cần hơn +{Math.abs(classComparisonData.attDiff)}%
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Tỷ lệ chuyên cần ngang nhau</span>
            )}
          </div>
        </div>

        {/* 3. Improving % Comparison - Soft Indigo Theme */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 hover:bg-indigo-50/90 dark:bg-[#13112a] border border-indigo-200/90 dark:border-indigo-500/25 flex flex-col justify-between gap-3 shadow-[0_4px_16px_rgba(99,102,241,0.06)] hover:shadow-md transition-all">
          <div className="flex items-center justify-center gap-2 border-b border-indigo-200/70 dark:border-white/5 pb-2 text-center">
            <div className="p-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={14} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">TỶ LỆ TIẾN BỘ</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">{classComparisonData.classA.improvingPct}%</span>
            </div>
            <span className="text-sm font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-300">{classComparisonData.classB.improvingPct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-indigo-200/70 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.impDiff > 0 ? (
              <span className="text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classA.name} tiến bộ hơn +{classComparisonData.impDiff}%
              </span>
            ) : classComparisonData.impDiff < 0 ? (
              <span className="text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classB.name} tiến bộ hơn +{Math.abs(classComparisonData.impDiff)}%
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Tỷ lệ tiến bộ bằng nhau</span>
            )}
          </div>
        </div>

        {/* 4. Std Dev / Homogeneity Comparison - Soft Amber Theme */}
        <div className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-50/90 dark:bg-[#221808] border border-amber-200/90 dark:border-amber-500/25 flex flex-col justify-between gap-3 shadow-[0_4px_16px_rgba(245,158,11,0.06)] hover:shadow-md transition-all">
          <div className="flex items-center justify-center gap-2 border-b border-amber-200/70 dark:border-white/5 pb-2 text-center">
            <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Activity size={14} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">ĐỘ LỆCH CHUẨN (SD)</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">σ={classComparisonData.classA.classSd}</span>
            </div>
            <span className="text-sm font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-yellow-600 dark:text-yellow-400">σ={classComparisonData.classB.classSd}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200/70 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.classA.classSd < classComparisonData.classB.classSd ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classA.name} đồng đều học lực hơn
              </span>
            ) : classComparisonData.classA.classSd > classComparisonData.classB.classSd ? (
              <span className="text-amber-700 dark:text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20 whitespace-nowrap shadow-2xs">
                {classComparisonData.classB.name} đồng đều học lực hơn
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Mức độ phân tán ngang nhau</span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Component Scores & 6-Tier Rank Distribution */}
      <DualComparisonBars
        classA={classComparisonData.classA}
        classB={classComparisonData.classB}
        compareClassAId={compareClassAId}
        compareClassBId={compareClassBId}
      />

      {/* Leading Student Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-cascade-4">
        {/* Class A Top Student */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-[#0c1424] border border-blue-200/80 dark:border-blue-500/25 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-shadow">
          {classComparisonData.classA.topStudent ? (
            <img
              src={getStudentTier(Number(classComparisonData.classA.topStudent.ema_level || 0)).badge}
              alt="Rank"
              className="w-11 h-11 object-contain shrink-0"
            />
          ) : (
            <Award size={28} className="text-slate-400 dark:text-slate-500" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 block truncate">Học Sinh Dẫn Đầu ({classComparisonData.classA.name})</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white block truncate">
              {classComparisonData.classA.topStudent ? classComparisonData.classA.topStudent.full_name : 'Chưa có'}
            </span>
          </div>
          {classComparisonData.classA.topStudent && (
            <span className="text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
              EMA {format1Dec(Number(classComparisonData.classA.topStudent.ema_level || 0))}
            </span>
          )}
        </div>

        {/* Class B Top Student */}
        <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-[#061d24] border border-cyan-200/80 dark:border-cyan-500/25 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-shadow">
          {classComparisonData.classB.topStudent ? (
            <img
              src={getStudentTier(Number(classComparisonData.classB.topStudent.ema_level || 0)).badge}
              alt="Rank"
              className="w-11 h-11 object-contain shrink-0"
            />
          ) : (
            <Award size={28} className="text-slate-400 dark:text-slate-500" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 block truncate">Học Sinh Dẫn Đầu ({classComparisonData.classB.name})</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white block truncate">
              {classComparisonData.classB.topStudent ? classComparisonData.classB.topStudent.full_name : 'Chưa có'}
            </span>
          </div>
          {classComparisonData.classB.topStudent && (
            <span className="text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shrink-0">
              EMA {format1Dec(Number(classComparisonData.classB.topStudent.ema_level || 0))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
