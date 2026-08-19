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
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-xl p-6 shadow-xl space-y-6 animate-cascade-1">
      {/* Header & Dual Class Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#161f33] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <GitCompare size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              SO SÁNH ĐỐI ĐẦU 2 LỚP HỌC
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Chọn 2 lớp học để so sánh trực diện các chỉ số học lực, chuyên cần, phân bố 6 hạng bậc và đà phát triển.
            </p>
          </div>
        </div>

        {/* Dual Class Selector Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getClassColor(compareClassAId, 0), boxShadow: `0 0 8px ${getClassColor(compareClassAId, 0)}80` }}
            />
            <span className="text-xs font-black text-blue-400 whitespace-nowrap shrink-0">Lớp A:</span>
            <div className="w-48 shrink-0">
              <CustomSelect
                value={compareClassAId}
                onChange={(val) => setCompareClassAId(String(val))}
                options={classes.map((c) => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))}
              />
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-[#131b2e] border border-[#22304d] font-mono font-black text-xs text-blue-300 uppercase tracking-wider shrink-0">
            VS
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getClassColor(compareClassBId, 1), boxShadow: `0 0 8px ${getClassColor(compareClassBId, 1)}80` }}
            />
            <span className="text-xs font-black text-cyan-400 whitespace-nowrap shrink-0">Lớp B:</span>
            <div className="w-48 shrink-0">
              <CustomSelect
                value={compareClassBId}
                onChange={(val) => setCompareClassBId(String(val))}
                options={classes.map((c) => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Duel KPI Comparison Rounded Square Cards - Centered Title & VS Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-cascade-2">
        {/* 1. EMA Comparison */}
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1b253b] flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-center gap-2 border-b border-white/5 pb-2 text-center">
            <BarChart3 size={14} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">ĐIỂM EMA TRUNG BÌNH</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black font-mono text-blue-400">{classComparisonData.classA.avgEma > 0 ? format1Dec(classComparisonData.classA.avgEma) : '-'}</span>
            </div>
            <span className="text-xs font-black text-slate-600 font-mono">VS</span>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black font-mono text-cyan-400">{classComparisonData.classB.avgEma > 0 ? format1Dec(classComparisonData.classB.avgEma) : '-'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-black flex items-center justify-center">
            {classComparisonData.emaDiff > 0 ? (
              <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                {classComparisonData.classA.name} cao hơn +{format1Dec(classComparisonData.emaDiff)} đ
              </span>
            ) : classComparisonData.emaDiff < 0 ? (
              <span className="text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 whitespace-nowrap">
                {classComparisonData.classB.name} cao hơn +{format1Dec(Math.abs(classComparisonData.emaDiff))} đ
              </span>
            ) : (
              <span className="text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Hai lớp bằng điểm nhau</span>
            )}
          </div>
        </div>

        {/* 2. Attendance % Comparison */}
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1b253b] flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-center gap-2 border-b border-white/5 pb-2 text-center">
            <Users size={14} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">CHUYÊN CẦN %</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{classComparisonData.classA.attendancePct}%</span>
            </div>
            <span className="text-xs font-black text-slate-600 font-mono">VS</span>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black font-mono text-teal-400">{classComparisonData.classB.attendancePct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-black flex items-center justify-center">
            {classComparisonData.attDiff > 0 ? (
              <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                {classComparisonData.classA.name} chuyên cần hơn +{classComparisonData.attDiff}%
              </span>
            ) : classComparisonData.attDiff < 0 ? (
              <span className="text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 whitespace-nowrap">
                {classComparisonData.classB.name} chuyên cần hơn +{Math.abs(classComparisonData.attDiff)}%
              </span>
            ) : (
              <span className="text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Tỷ lệ chuyên cần ngang nhau</span>
            )}
          </div>
        </div>

        {/* 3. Improving % Comparison */}
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1b253b] flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-center gap-2 border-b border-white/5 pb-2 text-center">
            <TrendingUp size={14} className="text-sky-400" />
            <span className="text-xs font-black uppercase tracking-wider text-sky-400">TỶ LỆ TIẾN BỘ</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black font-mono text-blue-400">{classComparisonData.classA.improvingPct}%</span>
            </div>
            <span className="text-xs font-black text-slate-600 font-mono">VS</span>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black font-mono text-cyan-300">{classComparisonData.classB.improvingPct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-black flex items-center justify-center">
            {classComparisonData.impDiff > 0 ? (
              <span className="text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 whitespace-nowrap">
                {classComparisonData.classA.name} tiến bộ hơn +{classComparisonData.impDiff}%
              </span>
            ) : classComparisonData.impDiff < 0 ? (
              <span className="text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 whitespace-nowrap">
                {classComparisonData.classB.name} tiến bộ hơn +{Math.abs(classComparisonData.impDiff)}%
              </span>
            ) : (
              <span className="text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Tỷ lệ tiến bộ bằng nhau</span>
            )}
          </div>
        </div>

        {/* 4. Std Dev / Homogeneity Comparison */}
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1b253b] flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-center gap-2 border-b border-white/5 pb-2 text-center">
            <Activity size={14} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">ĐỘ LỆCH CHUẨN (SD)</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-left">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black font-mono text-amber-300">σ={classComparisonData.classA.classSd}</span>
            </div>
            <span className="text-xs font-black text-slate-600 font-mono">VS</span>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold truncate max-w-[100px]">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black font-mono text-yellow-300">σ={classComparisonData.classB.classSd}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-black flex items-center justify-center">
            {classComparisonData.classA.classSd < classComparisonData.classB.classSd ? (
              <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                {classComparisonData.classA.name} đồng đều học lực hơn
              </span>
            ) : classComparisonData.classA.classSd > classComparisonData.classB.classSd ? (
              <span className="text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20 whitespace-nowrap">
                {classComparisonData.classB.name} đồng đều học lực hơn
              </span>
            ) : (
              <span className="text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg whitespace-nowrap">Mức độ phân tán ngang nhau</span>
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
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1e2744] flex items-center gap-3.5 shadow-md">
          {classComparisonData.classA.topStudent ? (
            <img
              src={getStudentTier(Number(classComparisonData.classA.topStudent.ema_level || 0)).badge}
              alt="Rank"
              className="w-10 h-10 object-contain shrink-0 drop-shadow-md"
            />
          ) : (
            <Award size={28} className="text-slate-500" />
          )}
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-blue-400 block">Học Sinh Dẫn Đầu ({classComparisonData.classA.name})</span>
            <span className="text-sm font-black text-white block">
              {classComparisonData.classA.topStudent ? classComparisonData.classA.topStudent.full_name : 'Chưa có'}
            </span>
          </div>
          {classComparisonData.classA.topStudent && (
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
              EMA {format1Dec(Number(classComparisonData.classA.topStudent.ema_level || 0))}
            </span>
          )}
        </div>

        {/* Class B Top Student */}
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1e2744] flex items-center gap-3.5 shadow-md">
          {classComparisonData.classB.topStudent ? (
            <img
              src={getStudentTier(Number(classComparisonData.classB.topStudent.ema_level || 0)).badge}
              alt="Rank"
              className="w-10 h-10 object-contain shrink-0 drop-shadow-md"
            />
          ) : (
            <Award size={28} className="text-slate-500" />
          )}
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase text-cyan-400 block">Học Sinh Dẫn Đầu ({classComparisonData.classB.name})</span>
            <span className="text-sm font-black text-white block">
              {classComparisonData.classB.topStudent ? classComparisonData.classB.topStudent.full_name : 'Chưa có'}
            </span>
          </div>
          {classComparisonData.classB.topStudent && (
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              EMA {format1Dec(Number(classComparisonData.classB.topStudent.ema_level || 0))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
