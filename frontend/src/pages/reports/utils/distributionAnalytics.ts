import { trunc1Dec, format1Dec } from '../../../utils';
import {
  GradeTypeFilterKey,
  DistributionBand,
  DistributionScoreBin,
  DistributionDetailedEvaluation,
  DistributionStats,
  DISTRIBUTION_BANDS_TEMPLATE,
} from './distributionTypes';
import { buildDistributionEvaluation } from './distributionEvaluation';

export * from './distributionTypes';
export * from './distributionEvaluation';

interface ScoreEntry {
  score: number;
  studentId?: number | string;
  studentName?: string;
}

export function computeDistributionStats(
  sessionRecords: any[],
  studentRankings: any[],
  selectedStudentId?: string,
  className?: string,
  gradeTypeFilter: GradeTypeFilterKey = 'overall',
  isTestMode?: boolean
): DistributionStats {
  const scoreEntries: ScoreEntry[] = [];

  const getRecordScore = (rec: any): number | null => {
    let raw: any = null;
    if (gradeTypeFilter === 'check_1') {
      const isC1 = String(rec.check_1_skill || '').toLowerCase().includes('vocab') || !rec.check_1_skill;
      const isC2 = String(rec.check_2_skill || '').toLowerCase().includes('vocab');
      if (isC1 && rec.check_1 !== undefined && rec.check_1 !== null) raw = rec.check_1;
      else if (isC2 && rec.check_2 !== undefined && rec.check_2 !== null) raw = rec.check_2;
      else raw = rec.check_1;
    } else if (gradeTypeFilter === 'check_2') {
      const isC2 = String(rec.check_2_skill || '').toLowerCase().includes('grammar') || !rec.check_2_skill;
      const isC1 = String(rec.check_1_skill || '').toLowerCase().includes('grammar');
      if (isC2 && rec.check_2 !== undefined && rec.check_2 !== null) raw = rec.check_2;
      else if (isC1 && rec.check_1 !== undefined && rec.check_1 !== null) raw = rec.check_1;
      else raw = rec.check_2;
    } else if (gradeTypeFilter === 'homework') {
      raw = rec.homework;
    } else if (gradeTypeFilter === 'mock_test') {
      raw = rec.mock_test ?? rec.check_2;
    } else {
      const c1 = Number(rec.check_1 || 0);
      const c2 = Number(rec.check_2 || 0);
      const hw = Number(rec.homework || 0);
      if (c1 > 0 || c2 > 0 || hw > 0) {
        return trunc1Dec(c1 * 0.55 + c2 * 0.35 + hw * 0.1);
      }
      return null;
    }

    if (raw === null || raw === undefined || raw === '') return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  };

  const getStudentRankingScore = (st: any): number | null => {
    let raw: any = null;
    if (gradeTypeFilter === 'check_1') {
      raw = st.avg_vocab ?? st.avg_check_1;
    } else if (gradeTypeFilter === 'check_2') {
      raw = st.avg_grammar ?? st.avg_check_2;
    } else if (gradeTypeFilter === 'homework') {
      raw = st.avg_homework;
    } else if (gradeTypeFilter === 'mock_test') {
      raw = st.avg_mock_test ?? st.mock_test ?? st.avg_grammar ?? st.avg_check_2;
    } else {
      if (st.overallAvg !== undefined && Number(st.overallAvg) > 0) return Number(st.overallAvg);
      if (st.ema_level !== undefined && Number(st.ema_level) > 0) return Number(st.ema_level);
      const c1 = Number(st.avg_vocab ?? st.avg_check_1 ?? 0);
      const c2 = Number(st.avg_grammar ?? st.avg_check_2 ?? 0);
      const hw = Number(st.avg_homework ?? 0);
      if (c1 > 0 || c2 > 0 || hw > 0) {
        return trunc1Dec(c1 * 0.55 + c2 * 0.35 + hw * 0.1);
      }
      return null;
    }

    if (raw === null || raw === undefined || raw === '') return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  };

  if (selectedStudentId) {
    const studentRecords = (sessionRecords || []).filter(
      (r) => String(r.student_id || r.id) === String(selectedStudentId)
    );
    studentRecords.forEach((r) => {
      if (r.status !== 'Vắng mặt' && r.attendance !== 'absent') {
        const val = getRecordScore(r);
        if (val !== null && val > 0) {
          scoreEntries.push({
            score: val,
            studentId: r.student_id || r.id,
            studentName: r.student_name || r.name || r.full_name,
          });
        }
      }
    });
  } else {
    if (studentRankings && studentRankings.length > 0) {
      studentRankings.forEach((st) => {
        const val = getStudentRankingScore(st);
        if (val !== null && val > 0) {
          scoreEntries.push({
            score: val,
            studentId: st.student_id || st.id,
            studentName: st.full_name || st.name || st.student_name || 'Học sinh',
          });
        }
      });
    } else if (sessionRecords && sessionRecords.length > 0) {
      const studentMap: Record<string, { scores: number[]; name: string; id: any }> = {};
      sessionRecords.forEach((r) => {
        if (r.status !== 'Vắng mặt' && r.attendance !== 'absent') {
          const val = getRecordScore(r);
          if (val !== null && val > 0) {
            const sid = String(r.student_id || r.id);
            if (!studentMap[sid]) {
              studentMap[sid] = {
                scores: [],
                name: r.student_name || r.name || r.full_name || 'Học sinh',
                id: r.student_id || r.id,
              };
            }
            studentMap[sid].scores.push(val);
          }
        }
      });
      Object.values(studentMap).forEach((st) => {
        if (st.scores.length > 0) {
          const avg = trunc1Dec(st.scores.reduce((a, b) => a + b, 0) / st.scores.length);
          scoreEntries.push({
            score: avg,
            studentId: st.id,
            studentName: st.name,
          });
        }
      });
    }
  }

  scoreEntries.sort((a, b) => a.score - b.score);
  const scores = scoreEntries.map((e) => e.score);
  const n = scores.length;
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = n > 0 ? trunc1Dec(sum / n) : 0;

  const mid = Math.floor(n / 2);
  const median = n > 0
    ? (n % 2 !== 0 ? trunc1Dec(scores[mid]) : trunc1Dec((scores[mid - 1] + scores[mid]) / 2))
    : 0;

  const min = n > 0 ? trunc1Dec(scores[0]) : 0;
  const max = n > 0 ? trunc1Dec(scores[n - 1]) : 0;

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = n > 0 ? trunc1Dec(scores[Math.min(q1Index, n - 1)]) : 0;
  const q3 = n > 0 ? trunc1Dec(scores[Math.min(q3Index, n - 1)]) : 0;
  const iqr = n > 0 ? trunc1Dec(Math.max(0, q3 - q1)) : 0;

  const variance = n > 0 ? scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n : 0;
  const sd = n > 0 ? trunc1Dec(Math.sqrt(variance)) : 0;
  const skewness = n > 0 && sd > 0 ? trunc1Dec((mean - median) / sd) : 0;

  const passCount = n > 0 ? scores.filter((s) => s >= 5.0).length : 0;
  const passPct = n > 0 ? Math.round((passCount / n) * 100) : 0;
  const excellentCount = n > 0 ? scores.filter((s) => s >= 8.0).length : 0;
  const excellentPct = n > 0 ? Math.round((excellentCount / n) * 100) : 0;

  const bandCounts: Record<string, number> = { weak: 0, average: 0, good: 0, excellent: 0 };
  scores.forEach((s) => {
    if (s < 5.0) bandCounts.weak++;
    else if (s < 6.5) bandCounts.average++;
    else if (s < 8.0) bandCounts.good++;
    else bandCounts.excellent++;
  });

  const bands: DistributionBand[] = DISTRIBUTION_BANDS_TEMPLATE.map((b) => ({
    ...b,
    count: bandCounts[b.id] || 0,
    pct: n > 0 ? Math.round(((bandCounts[b.id] || 0) / n) * 100) : 0,
  }));

  // 1. Standard 10 score intervals (0-1, 1-2, ..., 9-10)
  const scoreBins10: DistributionScoreBin[] = [];
  for (let i = 0; i < 10; i++) {
    const minVal = i;
    const maxVal = i === 9 ? 10.0 : i + 1.0;
    const matched = scoreEntries.filter((e) =>
      i === 9 ? e.score >= minVal && e.score <= maxVal : e.score >= minVal && e.score < maxVal
    );
    const count = matched.length;
    const midPoint = i + 0.5;

    let color = '#f43f5e';
    let bandId = 'weak';
    if (midPoint >= 8.0) { color = '#10b981'; bandId = 'excellent'; }
    else if (midPoint >= 6.5) { color = '#06b6d4'; bandId = 'good'; }
    else if (midPoint >= 5.0) { color = '#f59e0b'; bandId = 'average'; }

    scoreBins10.push({
      score: midPoint,
      label: `${i}-${i + 1}`,
      rangeLabel: `${i}.0 - ${i === 9 ? '10.0' : `${i + 1}.0`}đ`,
      minScore: minVal,
      maxScore: maxVal,
      count,
      pct: n > 0 ? Math.round((count / n) * 100) : 0,
      color,
      bandId,
      studentIds: matched.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: matched.map((e) => e.studentName).filter(Boolean) as string[],
    });
  }

  // 2. 4 Academic Tier Bins (Yếu <5, TB 5-6.4, Khá 6.5-7.9, Giỏi ≥8)
  const weakEntries = scoreEntries.filter((e) => e.score < 5.0);
  const avgEntries = scoreEntries.filter((e) => e.score >= 5.0 && e.score < 6.5);
  const goodEntries = scoreEntries.filter((e) => e.score >= 6.5 && e.score < 8.0);
  const excelEntries = scoreEntries.filter((e) => e.score >= 8.0);

  const tierBins: DistributionScoreBin[] = [
    {
      score: 2.5,
      label: 'Yếu <5.0',
      rangeLabel: '0.0 - 4.9đ (Yếu / Dưới chuẩn)',
      minScore: 0,
      maxScore: 4.9,
      count: bandCounts.weak,
      pct: n > 0 ? Math.round((bandCounts.weak / n) * 100) : 0,
      color: '#f43f5e',
      bandId: 'weak',
      studentIds: weakEntries.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: weakEntries.map((e) => e.studentName).filter(Boolean) as string[],
    },
    {
      score: 5.7,
      label: 'TB 5.0-6.4',
      rangeLabel: '5.0 - 6.4đ (Trung bình / Đạt)',
      minScore: 5.0,
      maxScore: 6.4,
      count: bandCounts.average,
      pct: n > 0 ? Math.round((bandCounts.average / n) * 100) : 0,
      color: '#f59e0b',
      bandId: 'average',
      studentIds: avgEntries.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: avgEntries.map((e) => e.studentName).filter(Boolean) as string[],
    },
    {
      score: 7.2,
      label: 'Khá 6.5-7.9',
      rangeLabel: '6.5 - 7.9đ (Khá / Nắm vững)',
      minScore: 6.5,
      maxScore: 7.9,
      count: bandCounts.good,
      pct: n > 0 ? Math.round((bandCounts.good / n) * 100) : 0,
      color: '#06b6d4',
      bandId: 'good',
      studentIds: goodEntries.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: goodEntries.map((e) => e.studentName).filter(Boolean) as string[],
    },
    {
      score: 9.0,
      label: 'Giỏi ≥8.0',
      rangeLabel: '8.0 - 10.0đ (Giỏi & Xuất sắc)',
      minScore: 8.0,
      maxScore: 10.0,
      count: bandCounts.excellent,
      pct: n > 0 ? Math.round((bandCounts.excellent / n) * 100) : 0,
      color: '#10b981',
      bandId: 'excellent',
      studentIds: excelEntries.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: excelEntries.map((e) => e.studentName).filter(Boolean) as string[],
    },
  ];

  // 3. 21 Dense Score Bins (0.0 to 10.0 step 0.5)
  const scoreBins: DistributionScoreBin[] = [];
  for (let s = 0; s <= 10.0; s += 0.5) {
    const binScore = Math.round(s * 10) / 10;
    const minRange = Math.max(0, binScore - 0.25);
    const maxRange = Math.min(10, binScore + 0.25);
    const matched = scoreEntries.filter((e) => Math.abs(e.score - binScore) < 0.25);
    const count = matched.length;
    let color = '#f43f5e';
    let bandId = 'weak';
    if (binScore >= 8.0) { color = '#10b981'; bandId = 'excellent'; }
    else if (binScore >= 6.5) { color = '#06b6d4'; bandId = 'good'; }
    else if (binScore >= 5.0) { color = '#f59e0b'; bandId = 'average'; }

    scoreBins.push({
      score: binScore,
      label: `${binScore}đ`,
      rangeLabel: `${binScore}đ`,
      minScore: minRange,
      maxScore: maxRange,
      count,
      pct: n > 0 ? Math.round((count / n) * 100) : 0,
      color,
      bandId,
      studentIds: matched.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: matched.map((e) => e.studentName).filter(Boolean) as string[],
    });
  }

  // Bell curve points
  const curvePoints: { x: number; y: number }[] = [];
  if (n > 0) {
    const effectiveSd = Math.max(0.6, sd);
    for (let s = 0; s <= 10.0; s += 0.2) {
      const exponent = -0.5 * Math.pow((s - mean) / effectiveSd, 2);
      const density = (1 / (effectiveSd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      curvePoints.push({ x: s, y: density });
    }
  }

  const skillName = gradeTypeFilter === 'check_1' ? 'Từ Vựng'
    : gradeTypeFilter === 'check_2' ? 'Ngữ Pháp'
    : gradeTypeFilter === 'homework' ? 'BTVN'
    : gradeTypeFilter === 'mock_test' ? 'Luyện Đề'
    : 'Tổng Hợp';

  let skewnessLabel = 'Phân bố cân đối';
  if (n === 0) skewnessLabel = 'Chưa có dữ liệu';
  else if (skewness > 0.15) skewnessLabel = 'Lệch phải (Top điểm cao kéo TB lên)';
  else if (skewness < -0.15) skewnessLabel = 'Lệch trái (Nhóm điểm thấp kéo TB xuống)';

  let sdLabel = 'Phân hóa vừa phải (Ổn định)';
  if (n === 0) sdLabel = 'Chưa có dữ liệu';
  else if (sd < 1.0) sdLabel = 'Đồng đều cao (Ít chênh lệch)';
  else if (sd > 2.0) sdLabel = 'Phân hóa rất mạnh (Chênh lệch lớn)';

  const iqrLabel = n > 0 ? `Vùng 50% học sinh: ${format1Dec(q1)} - ${format1Dec(q3)}đ` : 'Chưa có dữ liệu';
  let distributionShape = n > 0 ? 'Phân phối chuẩn đối xứng' : 'Chưa có dữ liệu';
  let distributionRating = n > 0 ? 'Chất Lượng Tốt' : 'Chưa Có Dữ Liệu';

  if (n > 0) {
    if (passPct < 70) distributionRating = 'Cần Can Thiệp Khẩn';
    else if (excellentPct >= 40 && passPct >= 90) distributionRating = 'Xuất Sắc Vượt Trội';
    else if (passPct >= 85) distributionRating = 'Đạt Chuẩn Tốt';
    else distributionRating = 'Cần Củng Cố';
  }

  const { evaluation, commentary } = buildDistributionEvaluation({
    n, mean, median, sd, q1, q3, iqr, passPct, excellentPct, bands, skillName, className, distributionRating
  });

  return {
    n, mean, median, sd, min, max, q1, q3, iqr,
    passCount, passPct, excellentCount, excellentPct,
    skewness, skewnessLabel, sdLabel, iqrLabel,
    distributionShape, distributionRating,
    bands, scoreBins, scoreBins10, tierBins, curvePoints,
    evaluation, commentary
  };
}
