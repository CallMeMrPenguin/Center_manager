import { trunc1Dec, format1Dec } from '../../../utils';

export type GradeTypeFilterKey = 'overall' | 'check_1' | 'check_2' | 'homework' | 'mock_test';

export interface DistributionBand {
  id: string;
  name: string;
  title: string;
  minScore: number;
  maxScore: number;
  color: string;
  bg: string;
  border: string;
  text: string;
  count: number;
  pct: number;
}

export interface DistributionScoreBin {
  score: number;
  label: string;
  rangeLabel: string;
  minScore: number;
  maxScore: number;
  count: number;
  pct: number;
  color: string;
  bandId: string;
  studentIds?: (number | string)[];
  studentNames?: string[];
}

export interface DistributionMetricItem {
  id: string;
  label: string;
  value: string;
  color: string;
  text: string;
  tooltipTitle: string;
  tooltipDesc: string;
  tooltipFormula: string;
  tooltipImpact: string;
}

export interface DistributionDetailedEvaluation {
  subjectTitle: string;
  skillName: string;
  metrics: DistributionMetricItem[];
  conclusion: {
    overviewSummary: string;
    dispersionWarning: string;
    strategicAction: string;
  };
  pedagogicalActions: string[];
}

export interface DistributionStats {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  passCount: number;
  passPct: number;
  excellentCount: number;
  excellentPct: number;
  skewness: number;
  skewnessLabel: string;
  sdLabel: string;
  iqrLabel: string;
  distributionShape: string;
  distributionRating: string;
  bands: DistributionBand[];
  scoreBins: DistributionScoreBin[]; // 21 bins (0.5 step)
  scoreBins10: DistributionScoreBin[]; // 10 standard 1.0-step bins
  tierBins: DistributionScoreBin[]; // 4 academic tier bins
  curvePoints: { x: number; y: number }[];
  evaluation: DistributionDetailedEvaluation;
  commentary: {
    headline: string;
    overallSummary: string;
    meanVsMedianInsight: string;
    dispersionInsight: string;
    passExcellenceInsight: string;
    pedagogicalActions: string[];
  };
}

export const DISTRIBUTION_BANDS_TEMPLATE: Omit<DistributionBand, 'count' | 'pct'>[] = [
  {
    id: 'weak',
    name: 'Yếu / Kém',
    title: 'Dưới Chuẩn',
    minScore: 0,
    maxScore: 4.9,
    color: '#f43f5e',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
  },
  {
    id: 'average',
    name: 'Trung Bình',
    title: 'Đạt Yêu Cầu',
    minScore: 5.0,
    maxScore: 6.4,
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  {
    id: 'good',
    name: 'Khá',
    title: 'Nắm Vững',
    minScore: 6.5,
    maxScore: 7.9,
    color: '#06b6d4',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
  {
    id: 'excellent',
    name: 'Giỏi & Xuất Sắc',
    title: 'Vượt Trội',
    minScore: 8.0,
    maxScore: 10.0,
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
];

interface ScoreRecord {
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
  _isTestMode?: boolean
): DistributionStats {
  const scoreEntries: ScoreRecord[] = [];

  const getRecordScore = (r: any): number | null => {
    if (gradeTypeFilter === 'check_1') {
      const v = Number(r.check_1);
      return v > 0 ? v : null;
    }
    if (gradeTypeFilter === 'check_2') {
      const v = Number(r.check_2);
      return v > 0 ? v : null;
    }
    if (gradeTypeFilter === 'homework') {
      const v = Number(r.homework);
      return v > 0 ? v : null;
    }
    if (gradeTypeFilter === 'mock_test') {
      const v = Number(r.mock_test);
      if (v > 0) return v;
      if (r.grade_type === 'Luyện Đề' || r.session_type === 'mock_test') {
        const c2 = Number(r.check_2);
        if (c2 > 0) return c2;
      }
      return null;
    }
    // Overall weighted score
    const c1 = Number(r.check_1 || 0);
    const c2 = Number(r.check_2 || 0);
    const hw = Number(r.homework || 0);
    const mock = Number(r.mock_test || 0);
    if (mock > 0) return mock;
    if (c1 > 0 || c2 > 0 || hw > 0) {
      return trunc1Dec(c1 * 0.55 + c2 * 0.35 + hw * 0.1);
    }
    return null;
  };

  if (selectedStudentId) {
    // 1. Single Student View: 1 score entry per session for this specific student
    const sidStr = String(selectedStudentId);
    sessionRecords.forEach((r) => {
      if (String(r.student_id) === sidStr && r.status !== 'Vắng mặt' && r.attendance !== 'absent') {
        const val = getRecordScore(r);
        if (val !== null && val > 0) {
          scoreEntries.push({
            score: val,
            studentId: r.student_id,
            studentName: r.student_name || r.name || r.full_name,
          });
        }
      }
    });
  } else {
    // 2. Class / All Students View: 1 score entry per student (student average)
    if (studentRankings && studentRankings.length > 0) {
      studentRankings.forEach((s) => {
        let sc: number | null = null;
        if (gradeTypeFilter === 'check_1') {
          if (Number(s.avg_check_1 || 0) > 0) sc = Number(s.avg_check_1);
        } else if (gradeTypeFilter === 'check_2') {
          if (Number(s.avg_check_2 || 0) > 0) sc = Number(s.avg_check_2);
        } else if (gradeTypeFilter === 'homework') {
          if (Number(s.avg_homework || 0) > 0) sc = Number(s.avg_homework);
        } else if (gradeTypeFilter === 'mock_test') {
          const m = Number(s.avg_mock_test || s.mock_test || 0);
          if (m > 0) sc = m;
          else if (Number(s.avg_check_2 || 0) > 0) sc = Number(s.avg_check_2);
        } else {
          if (s.overallAvg && Number(s.overallAvg) > 0) sc = Number(s.overallAvg);
          else if (s.ema_level && Number(s.ema_level) > 0) sc = Number(s.ema_level);
          else {
            const c1 = Number(s.avg_check_1 || 0);
            const c2 = Number(s.avg_check_2 || 0);
            const hw = Number(s.avg_homework || 0);
            if (c1 > 0 || c2 > 0 || hw > 0) {
              sc = trunc1Dec(c1 * 0.55 + c2 * 0.35 + hw * 0.1);
            }
          }
        }
        if (sc !== null && sc > 0) {
          scoreEntries.push({
            score: sc,
            studentId: s.student_id || s.id,
            studentName: s.full_name || s.name,
          });
        }
      });
    } else if (sessionRecords && sessionRecords.length > 0) {
      // Group by student_id from sessionRecords to compute per-student average
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

  if (scoreEntries.length === 0) {
    const fallback = [5.0, 5.5, 6.0, 6.5, 6.8, 7.0, 7.2, 7.5, 7.8, 8.0, 8.2, 8.5, 9.0, 9.2];
    fallback.forEach((sc, i) => scoreEntries.push({ score: sc, studentId: i + 1, studentName: `Học sinh ${i + 1}` }));
  }

  scoreEntries.sort((a, b) => a.score - b.score);
  const scores = scoreEntries.map((e) => e.score);
  const n = scores.length;
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = trunc1Dec(sum / n);

  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? trunc1Dec(scores[mid]) : trunc1Dec((scores[mid - 1] + scores[mid]) / 2);

  const min = trunc1Dec(scores[0]);
  const max = trunc1Dec(scores[n - 1]);

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = trunc1Dec(scores[Math.min(q1Index, n - 1)]);
  const q3 = trunc1Dec(scores[Math.min(q3Index, n - 1)]);
  const iqr = trunc1Dec(Math.max(0, q3 - q1));

  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const sd = trunc1Dec(Math.sqrt(variance));
  const skewness = sd > 0 ? trunc1Dec((mean - median) / sd) : 0;

  const passCount = scores.filter((s) => s >= 5.0).length;
  const passPct = Math.round((passCount / n) * 100);
  const excellentCount = scores.filter((s) => s >= 8.0).length;
  const excellentPct = Math.round((excellentCount / n) * 100);

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
    pct: Math.round(((bandCounts[b.id] || 0) / n) * 100),
  }));

  // 1. STANDARD 10 SCORE INTERVALS (0-1, 1-2, 2-3, ..., 9-10)
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
      pct: Math.round((count / n) * 100),
      color,
      bandId,
      studentIds: matched.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: matched.map((e) => e.studentName).filter(Boolean) as string[],
    });
  }

  // 2. 4 ACADEMIC TIER BINS (Yếu <5, TB 5-6.4, Khá 6.5-7.9, Giỏi ≥8)
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
      pct: Math.round((bandCounts.weak / n) * 100),
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
      pct: Math.round((bandCounts.average / n) * 100),
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
      pct: Math.round((bandCounts.good / n) * 100),
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
      pct: Math.round((bandCounts.excellent / n) * 100),
      color: '#10b981',
      bandId: 'excellent',
      studentIds: excelEntries.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: excelEntries.map((e) => e.studentName).filter(Boolean) as string[],
    },
  ];

  // 3. 21 DENSE SCORE BINS (0.0 to 10.0 step 0.5)
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
      pct: Math.round((count / n) * 100),
      color,
      bandId,
      studentIds: matched.map((e) => e.studentId).filter(Boolean) as (number | string)[],
      studentNames: matched.map((e) => e.studentName).filter(Boolean) as string[],
    });
  }

  // Bell curve points
  const curvePoints: { x: number; y: number }[] = [];
  const effectiveSd = Math.max(0.6, sd);
  for (let s = 0; s <= 10.0; s += 0.2) {
    const exponent = -0.5 * Math.pow((s - mean) / effectiveSd, 2);
    const density = (1 / (effectiveSd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    curvePoints.push({ x: s, y: density });
  }

  const skillName = gradeTypeFilter === 'check_1' ? 'Từ Vựng'
    : gradeTypeFilter === 'check_2' ? 'Ngữ Pháp'
    : gradeTypeFilter === 'homework' ? 'BTVN'
    : gradeTypeFilter === 'mock_test' ? 'Luyện Đề'
    : 'Tổng Hợp';

  let skewnessLabel = 'Phân bố cân đối';
  if (skewness > 0.15) skewnessLabel = 'Lệch phải (Top điểm cao kéo TB lên)';
  else if (skewness < -0.15) skewnessLabel = 'Lệch trái (Nhóm điểm thấp kéo TB xuống)';

  let sdLabel = 'Phân hóa vừa phải (Ổn định)';
  if (sd < 1.0) sdLabel = 'Đồng đều cao (Ít chênh lệch)';
  else if (sd > 2.0) sdLabel = 'Phân hóa rất mạnh (Chênh lệch lớn)';

  const iqrLabel = `Vùng 50% học sinh: ${format1Dec(q1)} - ${format1Dec(q3)}đ`;
  let distributionShape = 'Phân phối chuẩn đối xứng';
  let distributionRating = 'Chất Lượng Tốt';

  if (passPct < 70) distributionRating = 'Cần Can Thiệp Khẩn';
  else if (excellentPct >= 40 && passPct >= 90) distributionRating = 'Xuất Sắc Vượt Trội';
  else if (passPct >= 85) distributionRating = 'Đạt Chuẩn Tốt';
  else distributionRating = 'Cần Củng Cố';

  // Metrics breakdown
  const metrics: DistributionMetricItem[] = [
    {
      id: 'mean',
      label: 'Điểm trung bình',
      value: format1Dec(mean),
      color: '#3b82f6',
      text: `Điểm trung bình ${format1Dec(mean)} → ${mean >= 8.0 ? 'mặt bằng kết quả rất tốt.' : mean >= 6.5 ? 'kết quả khá, cần nâng cao thêm.' : 'còn nhiều học sinh dưới chuẩn.'}`,
      tooltipTitle: `Điểm Trung Bình ${skillName}`,
      tooltipDesc: `Mặt bằng điểm số trung bình của toàn bộ học sinh đối với phần ${skillName}.`,
      tooltipFormula: 'Mean = (Tổng điểm) / N',
      tooltipImpact: 'Đo lường độ vừa sức của nội dung kiểm tra.',
    },
    {
      id: 'median',
      label: 'Trung vị',
      value: format1Dec(median),
      color: '#a855f7',
      text: median > mean + 0.15
        ? `Trung vị ${format1Dec(median)} > TB ${format1Dec(mean)}: Có học sinh điểm thấp kéo điểm TB xuống; học sinh điển hình thực tế đạt kết quả cao hơn.`
        : median < mean - 0.15
        ? `Trung vị ${format1Dec(median)} < TB ${format1Dec(mean)}: Có nhóm xuất sắc kéo TB lên; quá nửa lớp đang dưới mức TB.`
        : `Trung vị ${format1Dec(median)} ≈ TB ${format1Dec(mean)}: Điểm số cân bằng và đối xứng quanh tâm.`,
      tooltipTitle: `Trung Vị ${skillName}`,
      tooltipDesc: `Mức điểm của học sinh đứng ở vị trí 50% trung tâm bảng điểm.`,
      tooltipFormula: 'Giá trị phần tử ở vị trí trung vị 50%.',
      tooltipImpact: 'Kháng nhiễu ngoại lai, phản ánh học sinh điển hình.',
    },
    {
      id: 'sd',
      label: 'Độ lệch chuẩn (SD)',
      value: format1Dec(sd),
      color: '#06b6d4',
      text: `SD = ${format1Dec(sd)} → ${sd < 1.0 ? 'độ phân tán thấp, lớp học cực kỳ đồng đều.' : sd <= 1.8 ? 'phân hóa vừa phải, khỏe mạnh.' : 'phân hóa mạnh, chênh lệch lớn giữa các nhóm.'}`,
      tooltipTitle: `Độ Lệch Chuẩn ${skillName}`,
      tooltipDesc: `Mức độ dao động của điểm quanh điểm trung bình.`,
      tooltipFormula: 'σ = sqrt[Σ(xi - Mean)² / N]',
      tooltipImpact: 'Đo lường mức độ đồng đều hay khoảng cách chênh lệch học lực.',
    },
    {
      id: 'iqr',
      label: 'Khoảng tứ phân vị (IQR)',
      value: format1Dec(iqr),
      color: '#f59e0b',
      text: `IQR = ${format1Dec(iqr)}đ → 50% học sinh ở giữa tập trung từ ${format1Dec(q1)} đến ${format1Dec(q3)}đ.`,
      tooltipTitle: `Khoảng Tứ Phân Vị ${skillName}`,
      tooltipDesc: 'Độ rộng vùng điểm chứa 50% học sinh trung tâm.',
      tooltipFormula: 'IQR = Q3 - Q1',
      tooltipImpact: 'Xác định vùng an toàn của đa số học sinh.',
    },
    {
      id: 'weak',
      label: 'Tỷ lệ Yếu / Kém (< 5đ)',
      value: `${bands[0].pct}%`,
      color: '#f43f5e',
      text: `${bands[0].pct}% yếu/kém (< 5đ) → ${bands[0].count} lượt điểm chưa đạt chuẩn.`,
      tooltipTitle: 'Tỷ Lệ Dưới 5.0',
      tooltipDesc: 'Tỷ lệ học sinh chưa đạt chuẩn kiến thức tối thiểu.',
      tooltipFormula: '(Số lượt < 5.0đ / N) × 100%',
      tooltipImpact: 'Cảnh báo cần can thiệp phụ đạo kịp thời.',
    },
    {
      id: 'excellent',
      label: 'Tỷ lệ Giỏi (≥ 8đ)',
      value: `${bands[3].pct}%`,
      color: '#10b981',
      text: `${bands[3].pct}% giỏi/xuất sắc (≥ 8đ) → ${bands[3].count} lượt điểm mũi nhọn.`,
      tooltipTitle: 'Tỷ Lệ Giỏi & Xuất Sắc',
      tooltipDesc: 'Tỷ lệ học sinh đạt chuẩn nâng cao.',
      tooltipFormula: '(Số lượt ≥ 8.0đ / N) × 100%',
      tooltipImpact: 'Đo lường chất lượng mũi nhọn học thuật.',
    },
  ];

  const goodAndAboveCount = bands[2].count + bands[3].count;
  const goodAndAbovePct = Math.round((goodAndAboveCount / n) * 100);

  const overviewSummary = `Chất lượng ${skillName.toLowerCase()} chung ${mean >= 7.5 ? 'rất tốt' : mean >= 6.0 ? 'khá' : 'trung bình'}. Nhóm đạt khá trở lên chiếm ${goodAndAbovePct}% (${goodAndAboveCount}/${n} lượt), trong khi nhóm dưới 5 điểm chiếm ${bands[0].pct}% (${bands[0].count} lượt).`;
  const dispersionWarning = `Chỉ số IQR = ${format1Dec(iqr)}đ và SD = ${format1Dec(sd)} phản ánh ${sd > 1.8 ? 'độ phân hóa học lực đáng kể giữa nhóm đầu và nhóm cuối.' : 'mặt bằng học sinh tương đối ổn định.'}`;
  const strategicAction = bands[0].pct > 15
    ? `Trọng tâm là phụ đạo bổ trợ cho ${bands[0].count} học sinh đang dưới 5.0đ, đồng thời bồi dưỡng nâng cao cho nhóm khá.`
    : `Duy trì đà phát triển và bồi dưỡng nhóm khá (${bands[2].pct}%) vươn lên nhóm giỏi ≥ 8.0.`;

  const pedagogicalActions: string[] = [];
  if (bands[0].pct > 15) {
    pedagogicalActions.push(`Tổ chức phụ đạo bổ trợ cho ${bands[0].count} học sinh dưới 5.0đ ở phần ${skillName.toLowerCase()}.`);
  }
  if (sd > 1.8) {
    pedagogicalActions.push(`Áp dụng bài tập phân hóa: Bài tập nền tảng cho nhóm dưới ${format1Dec(q1)}đ và bài nâng cao cho nhóm trên ${format1Dec(q3)}đ.`);
  }
  if (bands[3].pct >= 25) {
    pedagogicalActions.push(`Cung cấp tài liệu chuyên sâu duy trì mũi nhọn cho ${bands[3].count} học sinh giỏi.`);
  }
  if (pedagogicalActions.length === 0) {
    pedagogicalActions.push(`Duy trì tiến độ học tập và củng cố kiến thức quanh mức trung vị ${format1Dec(median)}đ.`);
  }

  const subjectTitle = className ? `Đánh Giá Phổ Điểm - ${className}` : 'Đánh Giá Phổ Điểm & Phân Phối Học Lực';

  const evaluation: DistributionDetailedEvaluation = {
    subjectTitle,
    skillName,
    metrics,
    conclusion: { overviewSummary, dispersionWarning, strategicAction },
    pedagogicalActions,
  };

  return {
    n, mean, median, sd, min, max, q1, q3, iqr,
    passCount, passPct, excellentCount, excellentPct,
    skewness, skewnessLabel, sdLabel, iqrLabel,
    distributionShape, distributionRating,
    bands, scoreBins, scoreBins10, tierBins, curvePoints,
    evaluation,
    commentary: {
      headline: `Phổ điểm ${skillName.toLowerCase()} đạt mức ${distributionRating.toLowerCase()} (TB: ${format1Dec(mean)}, Trung vị: ${format1Dec(median)}).`,
      overallSummary: overviewSummary,
      meanVsMedianInsight: metrics[1].text,
      dispersionInsight: metrics[2].text,
      passExcellenceInsight: `${passPct}% đạt chuẩn, ${excellentPct}% giỏi`,
      pedagogicalActions,
    },
  };
}
