import { TIERS_CONFIG, getStudentTier } from '../types';
import { computeClassAnalyticsSd } from '../utils';
import { trunc1Dec } from '../../../utils';

export function computeDuelStats({
  classes,
  studentRankings,
  sessionRecords,
  compareClassAId,
  compareClassBId,
  selectedClassId,
  analyticsSummary,
  classAnalyticsMap,
}: {
  classes: any[];
  studentRankings: any[];
  sessionRecords: any[];
  compareClassAId: string;
  compareClassBId: string;
  selectedClassId: string;
  analyticsSummary: any;
  classAnalyticsMap: Record<string, any>;
}) {
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
        grade: cObj.grade || 'Chưa phân lớp',
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
}
