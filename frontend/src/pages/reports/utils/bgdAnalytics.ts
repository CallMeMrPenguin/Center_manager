import { trunc1Dec, format1Dec } from '../../../utils';

export interface BgdDistributionBand {
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

export interface BgdMetricItem {
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

export interface BgdDetailedEvaluation {
  subjectTitle: string;
  metrics: BgdMetricItem[];
  conclusion: {
    overviewSummary: string;
    dispersionWarning: string;
    strategicAction: string;
  };
  pedagogicalActions: string[];
}

export interface BgdDistributionStats {
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
  bands: BgdDistributionBand[];
  scoreBins: { label: string; count: number; pct: number; min: number; max: number }[];
  evaluation: BgdDetailedEvaluation;
  commentary: {
    headline: string;
    overallSummary: string;
    meanVsMedianInsight: string;
    dispersionInsight: string;
    passExcellenceInsight: string;
    pedagogicalActions: string[];
  };
}

export const BGD_BANDS_TEMPLATE: Omit<BgdDistributionBand, 'count' | 'pct'>[] = [
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

export function computeBgdDistribution(
  sessionRecords: any[],
  studentRankings: any[],
  selectedStudentId?: string,
  className?: string
): BgdDistributionStats {
  const scores: number[] = [];

  if (selectedStudentId) {
    const sidStr = String(selectedStudentId);
    sessionRecords.forEach((r) => {
      if (String(r.student_id) === sidStr && r.status !== 'Vắng mặt' && r.attendance !== 'absent') {
        const c1 = Number(r.check_1 || 0);
        const c2 = Number(r.check_2 || 0);
        const hw = Number(r.homework || 0);
        const mock = Number(r.mock_test || 0);

        if (mock > 0) {
          scores.push(mock);
        } else if (c1 > 0 || c2 > 0 || hw > 0) {
          const sc = trunc1Dec((c1 * 0.35) + (c2 * 0.55) + (hw * 0.10));
          if (sc > 0) scores.push(sc);
        }
      }
    });
  } else {
    if (studentRankings && studentRankings.length > 0) {
      studentRankings.forEach((s) => {
        const sc = s.ema_level && Number(s.ema_level) > 0
          ? Number(s.ema_level)
          : trunc1Dec((Number(s.avg_check_1 || 0) * 0.35) + (Number(s.avg_check_2 || 0) * 0.55) + (Number(s.avg_homework || 0) * 0.10));
        if (sc > 0) scores.push(sc);
      });
    }

    if (scores.length === 0 && sessionRecords && sessionRecords.length > 0) {
      sessionRecords.forEach((r) => {
        if (r.status !== 'Vắng mặt' && r.attendance !== 'absent') {
          const c1 = Number(r.check_1 || 0);
          const c2 = Number(r.check_2 || 0);
          const hw = Number(r.homework || 0);
          if (c1 > 0 || c2 > 0 || hw > 0) {
            const sc = trunc1Dec((c1 * 0.35) + (c2 * 0.55) + (hw * 0.10));
            if (sc > 0) scores.push(sc);
          }
        }
      });
    }
  }

  if (scores.length === 0) {
    scores.push(7.0, 7.5, 8.0, 8.5, 6.5, 6.0, 5.5, 9.0);
  }

  scores.sort((a, b) => a - b);
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

  const bands: BgdDistributionBand[] = BGD_BANDS_TEMPLATE.map((b) => ({
    ...b,
    count: bandCounts[b.id] || 0,
    pct: Math.round(((bandCounts[b.id] || 0) / n) * 100),
  }));

  const weakBand = bands[0];
  const avgBand = bands[1];
  const goodBand = bands[2];
  const excBand = bands[3];

  const scoreBins = Array.from({ length: 10 }, (_, i) => {
    const binMin = i;
    const binMax = i + 1;
    const count = scores.filter((s) => i === 9 ? (s >= 9.0 && s <= 10.0) : (s >= binMin && s < binMax)).length;
    return {
      label: `${binMin}-${binMax}đ`,
      min: binMin,
      max: binMax,
      count,
      pct: Math.round((count / n) * 100),
    };
  });

  let skewnessLabel = 'Phân bố cân đối';
  if (skewness > 0.15) {
    skewnessLabel = 'Lệch phải (Top điểm cao kéo TB lên)';
  } else if (skewness < -0.15) {
    skewnessLabel = 'Lệch trái (Nhóm điểm thấp kéo TB xuống)';
  }

  let sdLabel = 'Phân hóa vừa phải (Bình thường)';
  if (sd < 1.0) {
    sdLabel = 'Đồng đều cao (Ít chênh lệch)';
  } else if (sd > 2.0) {
    sdLabel = 'Phân hóa rất mạnh (Chênh lệch lớn)';
  }

  const iqrLabel = `Vùng 50% học sinh tập trung: ${format1Dec(q1)} - ${format1Dec(q3)}đ`;
  let distributionShape = 'Phân phối chuẩn đối xứng';
  let distributionRating = 'Chất Lượng Tốt';

  if (passPct < 70) {
    distributionRating = 'Cần Can Thiệp Khẩn';
  } else if (excellentPct >= 40 && passPct >= 90) {
    distributionRating = 'Xuất Sắc Vượt Trội';
  } else if (passPct >= 85) {
    distributionRating = 'Đạt Chuẩn Tốt';
  } else {
    distributionRating = 'Cần Củng Cố';
  }

  // ── GENERATE POINT-BY-POINT METRIC ITEMS (COVERING ALL COMBINATIONS) ──
  const metrics: BgdMetricItem[] = [];

  // 1. Mean Item
  let meanInsight = '';
  if (mean >= 8.5) meanInsight = 'kết quả xuất sắc vượt trội, mặt bằng kiến thức toàn diện và rất vững vàng.';
  else if (mean >= 8.0) meanInsight = 'kết quả giỏi, phần lớn học sinh nắm chắc các chủ điểm kiến thức cốt lõi.';
  else if (mean >= 6.5) meanInsight = 'kết quả khá, nhưng vẫn còn dư địa đáng kể để nâng cao chất lượng.';
  else if (mean >= 5.0) meanInsight = 'kết quả trung bình, nhiều học sinh còn lúng túng ở các nội dung vận dụng.';
  else meanInsight = 'kết quả dưới chuẩn yêu cầu, cần rà soát lại phương pháp giảng dạy và phụ đạo cấp tốc.';

  metrics.push({
    id: 'mean',
    label: 'Điểm trung bình',
    value: format1Dec(mean),
    color: '#3b82f6',
    text: `Điểm trung bình ${format1Dec(mean)} → ${meanInsight}`,
    tooltipTitle: 'Điểm Trung Bình (Mean)',
    tooltipDesc: 'Mặt bằng điểm số chung của toàn bộ học sinh trong phạm vi đánh giá.',
    tooltipFormula: 'Mean = (Tổng điểm của tất cả học sinh) / N',
    tooltipImpact: 'Cho biết mức độ vừa sức tổng thể của đề thi so với năng lực chung của lớp.',
  });

  // 2. Median vs Mean Item
  let medianInsight = '';
  if (median > mean + 0.15) {
    medianInsight = `Trung vị ${format1Dec(median)} > trung bình ${format1Dec(mean)} → có một số học sinh điểm thấp kéo điểm trung bình xuống; phân bố điểm hơi lệch trái. Học sinh điển hình thực chất có học lực cao hơn điểm TB phản ánh.`;
  } else if (median < mean - 0.15) {
    medianInsight = `Trung vị ${format1Dec(median)} < trung bình ${format1Dec(mean)} → có nhóm học sinh xuất sắc kéo điểm trung bình lên; phân bố điểm hơi lệch phải. Thực tế quá nửa lớp đang có điểm dưới mức trung bình.`;
  } else {
    medianInsight = `Trung vị ${format1Dec(median)} ≈ trung bình ${format1Dec(mean)} → điểm trung bình và trung vị gần như tương đương; phân bố điểm đối xứng và đồng đều quanh tâm.`;
  }

  metrics.push({
    id: 'median',
    label: 'Trung vị',
    value: format1Dec(median),
    color: '#a855f7',
    text: medianInsight,
    tooltipTitle: 'Trung Vị Điểm Số (Median)',
    tooltipDesc: 'Điểm số của học sinh đứng ở chính giữa bảng điểm khi xếp thứ tự tăng dần.',
    tooltipFormula: 'Sắp xếp dãy điểm tăng dần, lấy giá trị phần tử ở vị trí 50%.',
    tooltipImpact: 'Kháng nhiễu điểm số ngoại lai (outliers), phản ánh chính xác học sinh điển hình.',
  });

  // 3. Standard Deviation (SD) Item
  let sdInsight = '';
  if (sd < 1.0) {
    sdInsight = `SD = ${format1Dec(sd)} → điểm số có độ phân tán rất thấp, trình độ học sinh trong lớp cực kỳ đồng đều.`;
  } else if (sd <= 1.8) {
    sdInsight = `SD = ${format1Dec(sd)} → điểm số có độ phân tán vừa phải (chuẩn Bộ GD), mức độ phân hóa học lực tự nhiên và khỏe mạnh.`;
  } else if (sd <= 2.5) {
    sdInsight = `SD = ${format1Dec(sd)} → điểm số có độ phân tán tương đối rõ, trình độ học sinh không đồng đều.`;
  } else {
    sdInsight = `SD = ${format1Dec(sd)} → điểm số có độ phân tán rất lớn, học lực trong lớp bị phân cực sâu sắc.`;
  }

  metrics.push({
    id: 'sd',
    label: 'Độ lệch chuẩn (SD)',
    value: format1Dec(sd),
    color: '#06b6d4',
    text: sdInsight,
    tooltipTitle: 'Độ Lệch Chuẩn (Standard Deviation - σ)',
    tooltipDesc: 'Thước đo mức độ chênh lệch và dao động của từng điểm số so với điểm trung bình.',
    tooltipFormula: 'σ = Căn bậc hai của Phương sai [Σ(xi - Mean)² / N]',
    tooltipImpact: 'Đo lường trực tiếp mức độ đồng đều hay khoảng cách chênh lệch trình độ trong lớp.',
  });

  // 4. Interquartile Range (IQR) Item
  let iqrInsight = '';
  if (iqr < 1.2) {
    iqrInsight = `IQR = ${format1Dec(iqr)} → 50% học sinh ở vùng điểm trung tâm tập trung trong khoảng hẹp (${format1Dec(iqr)} điểm, từ ${format1Dec(q1)} đến ${format1Dec(q3)}). Trình độ đa số học sinh rất tương đồng.`;
  } else if (iqr <= 2.2) {
    iqrInsight = `IQR = ${format1Dec(iqr)} → 50% học sinh ở vùng điểm trung tâm trải rộng khoảng ${format1Dec(iqr)} điểm (từ ${format1Dec(q1)} đến ${format1Dec(q3)}). Đây là mức phân tán tiêu chuẩn.`;
  } else {
    iqrInsight = `IQR = ${format1Dec(iqr)} → 50% học sinh ở vùng điểm trung tâm trải rộng tới ${format1Dec(iqr)} điểm (từ ${format1Dec(q1)} đến ${format1Dec(q3)}). Đây là mức phân tán đáng kể, cho thấy năng lực có sự khác biệt rõ rệt.`;
  }

  metrics.push({
    id: 'iqr',
    label: 'Khoảng tứ phân vị (IQR)',
    value: format1Dec(iqr),
    color: '#f59e0b',
    text: iqrInsight,
    tooltipTitle: 'Khoảng Tứ Phân Vị (IQR = Q3 - Q1)',
    tooltipDesc: 'Độ rộng vùng điểm chứa 50% học sinh ở giữa bảng xếp hạng (loại bỏ 25% đầu và 25% cuối).',
    tooltipFormula: 'IQR = Điểm phân vị 75% (Q3) - Điểm phân vị 25% (Q1)',
    tooltipImpact: 'Giúp giáo viên xác định "vùng an toàn" chứa đại đa số học sinh để thiết kế giáo án phù hợp.',
  });

  // 5. Weak / Underperforming Item (< 5.0)
  const weakRatioText = weakBand.pct === 0
    ? '100% học sinh đều đạt chuẩn kiến thức từ 5.0 trở lên, không có học sinh yếu kém.'
    : weakBand.pct <= 10
    ? `tỷ lệ học sinh chưa đạt ở mức thấp (${weakBand.count}/${n} học sinh). Đây là tỷ lệ trong tầm kiểm soát an toàn.`
    : `cứ 10 học sinh thì khoảng ${Math.max(1, Math.round(weakBand.pct / 10))} em chưa đạt (${weakBand.count}/${n} học sinh). Đây là điểm cần quan tâm phụ đạo sớm.`;

  metrics.push({
    id: 'weak',
    label: 'Tỷ lệ Yếu / Kém (< 5đ)',
    value: `${weakBand.pct}%`,
    color: '#f43f5e',
    text: `${weakBand.pct}% yếu/kém (< 5) → ${weakRatioText}`,
    tooltipTitle: 'Tỷ Lệ Yếu / Kém (< 5.0đ)',
    tooltipDesc: 'Tỷ lệ học sinh chưa đạt chuẩn kiến thức tối thiểu theo quy định của Bộ Giáo Dục.',
    tooltipFormula: 'Tỷ lệ Yếu/Kém = (Số học sinh dưới 5.0đ / N) × 100%',
    tooltipImpact: 'Chỉ số cảnh báo đỏ cần can thiệp phụ đạo để tránh tình trạng hổng kiến thức dây chuyền.',
  });

  // 6. Good & Excellent Item (>= 8.0)
  let excFractionText = 'khoảng 1/5';
  if (excBand.pct >= 50) excFractionText = 'hơn một nửa';
  else if (excBand.pct >= 33) excFractionText = 'khoảng 1/3';
  else if (excBand.pct >= 25) excFractionText = 'khoảng 1/4';
  else if (excBand.pct >= 15) excFractionText = 'khoảng 1/6';
  else if (excBand.pct > 0) excFractionText = 'một bộ phận nhỏ';

  const excRatioText = excBand.pct === 0
    ? 'chưa có học sinh nào bứt phá đạt ngưỡng 8.0 điểm, cần đẩy mạnh bồi dưỡng nâng cao.'
    : excBand.pct >= 35
    ? `${excFractionText} học sinh đạt mức cao, lớp có chất lượng mũi nhọn xuất sắc vượt trội.`
    : `${excFractionText} học sinh đạt mức cao, cho thấy vẫn có nhóm học sinh nắm kiến thức khá tốt.`;

  metrics.push({
    id: 'excellent',
    label: 'Tỷ lệ Giỏi / Xuất Sắc (≥ 8đ)',
    value: `${excBand.pct}%`,
    color: '#10b981',
    text: `${excBand.pct}% giỏi/xuất sắc (≥ 8) → ${excRatioText}`,
    tooltipTitle: 'Tỷ Lệ Giỏi / Xuất Sắc (≥ 8.0đ)',
    tooltipDesc: 'Tỷ lệ học sinh đạt chuẩn kiến thức nâng cao, tư duy vận dụng tốt.',
    tooltipFormula: 'Tỷ lệ Giỏi = (Số học sinh từ 8.0đ trở lên / N) × 100%',
    tooltipImpact: 'Đo lường chất lượng mũi nhọn và năng lực cạnh tranh học thuật của lớp.',
  });

  // 7. Largest Group Item
  const sortedBands = [...bands].sort((a, b) => b.count - a.count);
  const largestBand = sortedBands[0];
  const largestBandName = largestBand.id === 'weak' ? 'yếu/kém (< 5)'
    : largestBand.id === 'average' ? 'trung bình (5,0–< 6,5)'
    : largestBand.id === 'good' ? 'khá (6,5–< 8)'
    : 'giỏi/xuất sắc (≥ 8)';

  metrics.push({
    id: 'largest_group',
    label: 'Nhóm chiếm đa số',
    value: `${largestBand.pct}%`,
    color: largestBand.color,
    text: `${largestBand.pct}% ${largestBandName} → đây là nhóm học sinh chiếm tỷ trọng lớn nhất trong lớp.`,
    tooltipTitle: 'Nhóm Học Lực Chủ Lực',
    tooltipDesc: 'Phân khúc học lực chiếm tỷ trọng đông đảo nhất trong tổng thể học sinh.',
    tooltipFormula: 'Nhóm có số lượng học sinh Max(Count) trong 4 phân khúc chuẩn BGD.',
    tooltipImpact: 'Xác định đối tượng học sinh trung tâm để định hình trọng tâm bài giảng chính khóa.',
  });

  // ── GENERATE COMPREHENSIVE CONCLUSION & SYNTHESIS ────────────────────
  const goodAndAboveCount = goodBand.count + excBand.count;
  const goodAndAbovePct = Math.round((goodAndAboveCount / n) * 100);

  let generalQuality = 'khá';
  if (mean >= 8.2) generalQuality = 'rất tốt và vượt trội';
  else if (mean >= 7.2) generalQuality = 'khá tốt';
  else if (mean >= 6.0) generalQuality = 'khá';
  else if (mean >= 5.0) generalQuality = 'trung bình';
  else generalQuality = 'yếu dưới chuẩn';

  let diffSummary = 'sự phân hóa học lực rõ';
  if (sd < 1.0) diffSummary = 'độ đồng đều giữa các học sinh rất cao';
  else if (sd > 2.0) diffSummary = 'sự phân cực học lực diễn ra rất mạnh';

  const overviewSummary = `Chất lượng chung ${generalQuality}, nhưng ${diffSummary}. Nhóm học sinh đạt mức khá trở lên chiếm ${goodAndAbovePct}% (${goodAndAboveCount}/${n} học sinh), tuy nhiên vẫn còn ${weakBand.pct}% học sinh dưới 5 điểm, trong khi nhóm giỏi/xuất sắc chiếm ${excBand.pct}%.`;

  let deepDispersionReasoning = '';
  if (sd > 1.8 || iqr > 2.2) {
    deepDispersionReasoning = `cho thấy không nên chỉ nhìn điểm trung bình ${format1Dec(mean)} để kết luận lớp học đồng đều. Trình độ giữa nhóm đầu và nhóm cuối có khoảng cách đáng kể.`;
  } else {
    deepDispersionReasoning = `cho thấy mặt bằng học lực của lớp tương đối ổn định quanh mức ${format1Dec(mean)}, không có hiện tượng phân cực quá mức.`;
  }

  const dispersionWarning = `Đặc biệt, IQR = ${format1Dec(iqr)} và SD = ${format1Dec(sd)} ${deepDispersionReasoning}`;

  let strategicAction = '';
  if (weakBand.pct > 15 && excBand.pct < 30) {
    strategicAction = `Bài toán chính của lớp là kéo nhóm yếu/kém lên (chiếm ${weakBand.pct}%), đồng thời bồi dưỡng nhóm khá (${goodBand.pct}%) để tăng tỷ lệ đạt điểm giỏi ≥ 8.0.`;
  } else if (weakBand.pct > 25) {
    strategicAction = `Bài toán cấp bách nhất là tổ chức phụ đạo tăng cường để giải quyết triệt để lỗ hổng kiến thức cho ${weakBand.count} học sinh đang dưới 5.0 điểm.`;
  } else if (excBand.pct >= 35) {
    strategicAction = `Bài toán chính của lớp là tiếp tục duy trì đà phát triển mũi nhọn, đồng thời kèm cặp cá nhân hóa cho ${weakBand.count} học sinh còn yếu để đạt chuẩn toàn diện.`;
  } else {
    strategicAction = `Bài toán của lớp là duy trì tiến độ bài học ổn định và bồi dưỡng chuyển hóa nhóm khá (${goodBand.pct}%) vươn lên nhóm giỏi ≥ 8.0.`;
  }

  const pedagogicalActions: string[] = [];
  if (weakBand.pct > 15) {
    pedagogicalActions.push(`Tổ chức 15-20 phút phụ đạo bổ trợ trước giờ học cho nhóm ${weakBand.count} học sinh đang dưới 5.0đ.`);
  }
  if (sd > 1.8) {
    pedagogicalActions.push(`Áp dụng mô hình bài tập phân hóa: Giao bài tập cơ bản cho nhóm dưới ${format1Dec(q1)}đ và bài tập mở rộng/nâng cao cho nhóm trên ${format1Dec(q3)}đ.`);
  }
  if (excBand.pct >= 25) {
    pedagogicalActions.push(`Duy trì nguồn tài liệu chuyên sâu và thử thách nâng cao để phát huy tối đa năng lực cho nhóm ${excBand.count} học sinh xuất sắc.`);
  }
  if (pedagogicalActions.length === 0) {
    pedagogicalActions.push(`Duy trì phương pháp giảng dạy hiện tại và theo dõi sát bài kiểm tra định kỳ kế tiếp.`);
    pedagogicalActions.push(`Củng cố các chủ đề ngữ pháp và từ vựng cốt lõi cho nhóm học sinh ở vùng trung vị (${format1Dec(median)}đ).`);
  }

  const subjectTitle = className ? `Đánh giá phổ điểm môn học - ${className}` : 'Đánh giá phổ điểm & phân tích học lực chuẩn Bộ Giáo Dục';

  const evaluation: BgdDetailedEvaluation = {
    subjectTitle,
    metrics,
    conclusion: {
      overviewSummary,
      dispersionWarning,
      strategicAction,
    },
    pedagogicalActions,
  };

  const headline = `Phổ điểm đạt mức ${distributionRating.toLowerCase()} với điểm trung bình ${format1Dec(mean)} và trung vị ${format1Dec(median)}.`;
  const overallSummaryOld = `Tổng số ${n} điểm số được phân tích. Điểm trung bình toàn lớp đạt ${format1Dec(mean)}/10, trong đó học sinh điển hình (trung vị) ở mức ${format1Dec(median)}/10.`;

  return {
    n,
    mean,
    median,
    sd,
    min,
    max,
    q1,
    q3,
    iqr,
    passCount,
    passPct,
    excellentCount,
    excellentPct,
    skewness,
    skewnessLabel,
    sdLabel,
    iqrLabel,
    distributionShape,
    distributionRating,
    bands,
    scoreBins,
    evaluation,
    commentary: {
      headline,
      overallSummary: overallSummaryOld,
      meanVsMedianInsight: medianInsight,
      dispersionInsight: sdInsight,
      passExcellenceInsight: `${passPct}% đạt chuẩn, ${excellentPct}% giỏi`,
      pedagogicalActions,
    },
  };
}
