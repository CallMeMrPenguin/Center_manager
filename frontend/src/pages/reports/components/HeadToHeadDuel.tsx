import React, { useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { getClassColor, TIERS_CONFIG, getStudentTier } from '../types';
import { computeClassAnalyticsSd } from '../utils';
import { trunc1Dec } from '../../../utils';

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
    if (!classes || classes.length === 0 || !studentRankings) return null;

    const classA = classes.find(c => String(c.id) === String(compareClassAId)) || classes[0];
    const classB = classes.find(c => String(c.id) === String(compareClassBId)) || (classes.length > 1 ? classes[1] : classes[0]);

    if (!classA || !classB) return null;

    const computeClassStats = (cObj: any) => {
      const cStudents = studentRankings.filter(s => String(s.class_id) === String(cObj.id));
      const totalStudents = cStudents.length;

      if (totalStudents === 0) {
        return {
          id: cObj.id,
          name: cObj.class_name,
          grade: cObj.grade || 'Lớp 6',
          studentCount: 0,
          attendancePct: 100,
          avgEma: 0,
          avgCheck1: 0,
          avgCheck2: 0,
          avgHomework: 0,
          improvingPct: 0,
          classSd: 0,
          tierDistribution: TIERS_CONFIG.slice().reverse().map(t => ({ ...t, count: 0, pct: 0 })),
          topStudent: null,
          atRiskCount: 0
        };
      }

      const emaScores = cStudents.map(s => Number(s.ema_level || 0)).filter(v => v > 0);
      const avgEma = emaScores.length > 0 ? trunc1Dec(emaScores.reduce((a, b) => a + b, 0) / emaScores.length) : 0;

      const c1Scores = cStudents.map(s => Number(s.avg_check_1 || 0)).filter(v => v > 0);
      const avgC1 = c1Scores.length > 0 ? trunc1Dec(c1Scores.reduce((a, b) => a + b, 0) / c1Scores.length) : 0;

      const c2Scores = cStudents.map(s => Number(s.avg_check_2 || 0)).filter(v => v > 0);
      const avgC2 = c2Scores.length > 0 ? trunc1Dec(c2Scores.reduce((a, b) => a + b, 0) / c2Scores.length) : 0;

      const hwScores = cStudents.map(s => Number(s.avg_homework || 0)).filter(v => v > 0);
      const avgHw = hwScores.length > 0 ? trunc1Dec(hwScores.reduce((a, b) => a + b, 0) / hwScores.length) : 0;

      const cSessionRecords = sessionRecords.filter(r => String(r.class_id) === String(cObj.id));
      const classSd = classAnalyticsMap[String(cObj.id)]?.std_dev !== undefined
        ? classAnalyticsMap[String(cObj.id)].std_dev
        : (selectedClassId === String(cObj.id) && analyticsSummary?.std_dev !== undefined)
          ? analyticsSummary.std_dev
          : computeClassAnalyticsSd(cSessionRecords);

      let totalPresent = 0, totalSessions = 0;
      cStudents.forEach(s => {
        totalPresent += s.present_count || 0;
        totalSessions += s.total_sessions || 0;
      });
      const attendancePct = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 100;

      const improvingCount = cStudents.filter(s => Number(s.trend_slope || 0) >= 0.05).length;
      const improvingPct = Math.round((improvingCount / totalStudents) * 100);

      const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      cStudents.forEach(s => {
        const sc = s.ema_level && Number(s.ema_level) > 0 ? Number(s.ema_level) : (Number(s.avg_check_1 || 0) * 0.35 + Number(s.avg_check_2 || 0) * 0.55 + Number(s.avg_homework || 0) * 0.1);
        const tierObj = getStudentTier(sc);
        tierCounts[tierObj.tier] = (tierCounts[tierObj.tier] || 0) + 1;
      });

      const tierDistribution = TIERS_CONFIG.slice().reverse().map(t => ({
        ...t,
        count: tierCounts[t.tier] || 0,
        pct: Math.round(((tierCounts[t.tier] || 0) / totalStudents) * 100)
      }));

      const sortedByScore = [...cStudents].sort((a, b) => Number(b.ema_level || 0) - Number(a.ema_level || 0));
      const topStudent = sortedByScore[0] || null;

      const atRiskCount = cStudents.filter(s => {
        const slope = Number(s.trend_slope || 0);
        const ema = Number(s.ema_level || 0);
        return slope <= -0.2 || (ema < 6.0 && ema > 0);
      }).length;

      return {
        id: cObj.id,
        name: cObj.class_name,
        grade: cObj.grade || 'Lớp 6',
        studentCount: totalStudents,
        attendancePct,
        avgEma,
        avgCheck1: avgC1,
        avgCheck2: avgC2,
        avgHomework: avgHw,
        improvingPct,
        classSd,
        tierDistribution,
        topStudent,
        atRiskCount
      };
    };

    const statsA = computeClassStats(classA);
    const statsB = computeClassStats(classB);

    return {
      classA: statsA,
      classB: statsB,
      emaDiff: trunc1Dec(statsA.avgEma - statsB.avgEma),
      attDiff: statsA.attendancePct - statsB.attendancePct,
      impDiff: statsA.improvingPct - statsB.improvingPct,
      c1Diff: trunc1Dec(statsA.avgCheck1 - statsB.avgCheck1),
      c2Diff: trunc1Dec(statsA.avgCheck2 - statsB.avgCheck2),
      hwDiff: trunc1Dec(statsA.avgHomework - statsB.avgHomework),
    };
  }, [classes, studentRankings, sessionRecords, compareClassAId, compareClassBId, selectedClassId, analyticsSummary, classAnalyticsMap]);

  if (!classComparisonData) return null;

  return (
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-xl p-6 shadow-xl space-y-6 animate-cascade-1">
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

        <div className="flex flex-wrap items-center gap-3 bg-[#070a12] px-3.5 py-2 rounded-xl border border-[#182236]">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1e2744] flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400">Điểm Học Lực EMA Trung Bình</span>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-xs text-blue-400 font-bold block">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black text-white font-mono">{classComparisonData.classA.avgEma}</span>
            </div>
            <span className={`text-xs font-mono font-black px-2 py-1 rounded-lg ${classComparisonData.emaDiff > 0 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : classComparisonData.emaDiff < 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-500/20 text-slate-300'}`}>
              {classComparisonData.emaDiff > 0 ? `+${classComparisonData.emaDiff}` : classComparisonData.emaDiff}
            </span>
            <div className="text-right">
              <span className="text-xs text-cyan-400 font-bold block">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black text-white font-mono">{classComparisonData.classB.avgEma}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1e2744] flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400">Tỷ Lệ Chuyên Cần</span>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-xs text-blue-400 font-bold block">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black text-white font-mono">{classComparisonData.classA.attendancePct}%</span>
            </div>
            <span className={`text-xs font-mono font-black px-2 py-1 rounded-lg ${classComparisonData.attDiff > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : classComparisonData.attDiff < 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-500/20 text-slate-300'}`}>
              {classComparisonData.attDiff > 0 ? `+${classComparisonData.attDiff}%` : `${classComparisonData.attDiff}%`}
            </span>
            <div className="text-right">
              <span className="text-xs text-cyan-400 font-bold block">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black text-white font-mono">{classComparisonData.classB.attendancePct}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1322] border border-[#1e2744] flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400">Tỷ Lệ Học Sinh Đang Tiến Bộ</span>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-xs text-blue-400 font-bold block">{classComparisonData.classA.name}</span>
              <span className="text-2xl font-black text-white font-mono">{classComparisonData.classA.improvingPct}%</span>
            </div>
            <span className={`text-xs font-mono font-black px-2 py-1 rounded-lg ${classComparisonData.impDiff > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : classComparisonData.impDiff < 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-500/20 text-slate-300'}`}>
              {classComparisonData.impDiff > 0 ? `+${classComparisonData.impDiff}%` : `${classComparisonData.impDiff}%`}
            </span>
            <div className="text-right">
              <span className="text-xs text-cyan-400 font-bold block">{classComparisonData.classB.name}</span>
              <span className="text-2xl font-black text-white font-mono">{classComparisonData.classB.improvingPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
