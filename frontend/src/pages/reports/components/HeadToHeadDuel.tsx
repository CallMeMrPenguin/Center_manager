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
    <div className="space-y-5 animate-cascade-1">
      {/* 1. Header & Dual Class Selector — Standalone White Card */}
      <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
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

          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181d2e] border-0 shadow-2xs font-mono font-black text-xs text-blue-600 dark:text-blue-300 uppercase tracking-wider shrink-0">
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

      {/* 2. 4 Duel KPI Comparison Cards — Standalone White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-cascade-2">
        {/* Card 1: EMA */}
        <div className="bg-white dark:bg-[#111728] border-0 p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">ĐIỂM EMA TRUNG BÌNH</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BarChart3 size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">{classComparisonData.classA.avgEma > 0 ? format1Dec(classComparisonData.classA.avgEma) : '-'}</span>
            </div>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">{classComparisonData.classB.avgEma > 0 ? format1Dec(classComparisonData.classB.avgEma) : '-'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.emaDiff > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classA.name} cao hơn +{format1Dec(classComparisonData.emaDiff)} đ
              </span>
            ) : classComparisonData.emaDiff < 0 ? (
              <span className="text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classB.name} cao hơn +{format1Dec(Math.abs(classComparisonData.emaDiff))} đ
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Hai lớp bằng điểm nhau</span>
            )}
          </div>
        </div>

        {/* Card 2: Chuyên Cần */}
        <div className="bg-white dark:bg-[#111728] border-0 p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">CHUYÊN CẦN %</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">{classComparisonData.classA.attendancePct}%</span>
            </div>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400">{classComparisonData.classB.attendancePct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.attDiff > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classA.name} chuyên cần hơn +{classComparisonData.attDiff}%
              </span>
            ) : classComparisonData.attDiff < 0 ? (
              <span className="text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classB.name} chuyên cần hơn +{Math.abs(classComparisonData.attDiff)}%
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Tỷ lệ chuyên cần ngang nhau</span>
            )}
          </div>
        </div>

        {/* Card 3: Tiến Bộ */}
        <div className="bg-white dark:bg-[#111728] border-0 p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">TỶ LỆ TIẾN BỘ</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">{classComparisonData.classA.improvingPct}%</span>
            </div>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-300">{classComparisonData.classB.improvingPct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.impDiff > 0 ? (
              <span className="text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classA.name} tiến bộ hơn +{classComparisonData.impDiff}%
              </span>
            ) : classComparisonData.impDiff < 0 ? (
              <span className="text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classB.name} tiến bộ hơn +{Math.abs(classComparisonData.impDiff)}%
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Tỷ lệ tiến bộ bằng nhau</span>
            )}
          </div>
        </div>

        {/* Card 4: Độ Lệch Chuẩn (SD) */}
        <div className="bg-white dark:bg-[#111728] border-0 p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">ĐỘ LỆCH CHUẨN (SD)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Activity size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classA.name}</span>
              <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{classComparisonData.classA.classSd}</span>
            </div>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono">VS</span>
            <div className="text-right">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 block font-extrabold truncate max-w-[110px]">{classComparisonData.classB.name}</span>
              <span className="text-3xl font-black font-mono text-yellow-600 dark:text-yellow-400">{classComparisonData.classB.classSd}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-black flex items-center justify-center">
            {classComparisonData.classA.classSd < classComparisonData.classB.classSd ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classA.name} đồng đều học lực hơn
              </span>
            ) : classComparisonData.classA.classSd > classComparisonData.classB.classSd ? (
              <span className="text-amber-700 dark:text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {classComparisonData.classB.name} đồng đều học lực hơn
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Mức độ phân tán ngang nhau</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Side-by-Side Component Scores & 6-Tier Rank Distribution */}
      <DualComparisonBars
        classA={classComparisonData.classA}
        classB={classComparisonData.classB}
        compareClassAId={compareClassAId}
        compareClassBId={compareClassBId}
      />

      {/* 4. Leading Student Badges — 2 Standalone White Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-cascade-4">
        {/* Class A Top Student */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border-0 flex items-center gap-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
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
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border-0 flex items-center gap-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
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
