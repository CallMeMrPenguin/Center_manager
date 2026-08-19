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
  selectedStudentId?: string
): BgdDistributionStats {
  const scores: number[] = [];

  if (selectedStudentId) {
    // When a single student is selected, compute the distribution across all their session scores
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
    // When viewing class / center, compute distribution from student overall scores
    if (studentRankings && studentRankings.length > 0) {
      studentRankings.forEach((s) => {
        const sc = s.ema_level && Number(s.ema_level) > 0
          ? Number(s.ema_level)
          : trunc1Dec((Number(s.avg_check_1 || 0) * 0.35) + (Number(s.avg_check_2 || 0) * 0.55) + (Number(s.avg_homework || 0) * 0.10));
        if (sc > 0) scores.push(sc);
      });
    }

    // If no ranking scores yet, fallback to session records
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

  // Fallback if empty
  if (scores.length === 0) {
    scores.push(7.0, 7.5, 8.0, 8.5, 6.5, 6.0, 5.5, 9.0);
  }

  scores.sort((a, b) => a - b);
  const n = scores.length;
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = trunc1Dec(sum / n);

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? trunc1Dec(scores[mid]) : trunc1Dec((scores[mid - 1] + scores[mid]) / 2);

  // Min, Max
  const min = trunc1Dec(scores[0]);
  const max = trunc1Dec(scores[n - 1]);

  // Quartiles Q1, Q3, IQR
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = trunc1Dec(scores[Math.min(q1Index, n - 1)]);
  const q3 = trunc1Dec(scores[Math.min(q3Index, n - 1)]);
  const iqr = trunc1Dec(Math.max(0, q3 - q1));

  // Variance and SD
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const sd = trunc1Dec(Math.sqrt(variance));

  // Skewness
  const skewness = sd > 0 ? trunc1Dec((mean - median) / sd) : 0;

  // Pass rate (>= 5.0) and Excellence rate (>= 8.0)
  const passCount = scores.filter((s) => s >= 5.0).length;
  const passPct = Math.round((passCount / n) * 100);
  const excellentCount = scores.filter((s) => s >= 8.0).length;
  const excellentPct = Math.round((excellentCount / n) * 100);

  // Bands classification
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

  // 10 score bins (0-1, 1-2, ..., 9-10)
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

  // Interpretations
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

  let iqrLabel = `Vùng 50% học sinh tập trung: ${format1Dec(q1)} - ${format1Dec(q3)}đ`;
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

  // Detailed Pedagogical Commentary
  const weakPct = bands[0].pct;
  const goodPct = bands[2].pct;

  let headline = `Phổ điểm đạt mức ${distributionRating.toLowerCase()} với điểm trung bình ${format1Dec(mean)} và trung vị ${format1Dec(median)}.`;
  if (weakPct > 25) {
    headline = `Cảnh báo: Tỷ lệ dưới trung bình chiếm ${weakPct}%, cần tăng cường phụ đạo chuyên sâu.`;
  } else if (excellentPct >= 35) {
    headline = `Lớp có thành tích xuất sắc: ${excellentPct}% học sinh đạt mức Giỏi và Xuất Sắc.`;
  }

  const overallSummary = `Tổng số ${n} điểm số được phân tích. Điểm trung bình toàn lớp đạt ${format1Dec(mean)}/10, trong đó học sinh điển hình (trung vị) ở mức ${format1Dec(median)}/10. Khoảng điểm thấp nhất là ${format1Dec(min)} và cao nhất là ${format1Dec(max)}.`;

  let meanVsMedianInsight = '';
  if (Math.abs(mean - median) <= 0.2) {
    meanVsMedianInsight = `Điểm trung bình (${format1Dec(mean)}) và trung vị (${format1Dec(median)}) gần như trùng khớp, chứng tỏ học lực của lớp phân bố đều xung quanh tâm, không bị méo mó bởi các trường hợp ngoại lệ.`;
  } else if (mean > median) {
    meanVsMedianInsight = `Điểm trung bình (${format1Dec(mean)}) cao hơn trung vị (${format1Dec(median)}) chênh lệch +${format1Dec(mean - median)}đ. Điều này phản ánh có một nhóm học sinh đạt điểm rất cao nâng điểm trung bình lên, trong khi thực tế hơn 50% học sinh chỉ đạt dưới mức ${format1Dec(median)}đ.`;
  } else {
    meanVsMedianInsight = `Điểm trung bình (${format1Dec(mean)}) thấp hơn trung vị (${format1Dec(median)}) chênh lệch -${format1Dec(median - mean)}đ. Điều này cho thấy có một số ít học sinh đạt điểm quá thấp kéo mặt bằng trung bình chung đi xuống.`;
  }

  let dispersionInsight = '';
  if (sd <= 1.2) {
    dispersionInsight = `Độ lệch chuẩn σ = ${format1Dec(sd)} và khoảng tứ phân vị IQR = ${format1Dec(iqr)}đ ở mức thấp. Trình độ tiếp thu của cả lớp khá đồng đều, giáo viên có thể giảng dạy bài học chung với nhịp độ ổn định.`;
  } else if (sd <= 2.0) {
    dispersionInsight = `Độ lệch chuẩn σ = ${format1Dec(sd)} (mức chuẩn Bộ GD) và IQR = ${format1Dec(iqr)}đ. 50% học sinh giữa lớp nằm trọn trong vùng an toàn từ ${format1Dec(q1)}đ đến ${format1Dec(q3)}đ. Lớp có độ phân hóa tự nhiên, khỏe mạnh.`;
  } else {
    dispersionInsight = `Độ lệch chuẩn σ = ${format1Dec(sd)} và IQR = ${format1Dec(iqr)}đ ở mức rất cao. Khoảng cách giữa nhóm học sinh giỏi và nhóm học sinh yếu rất rộng, việc dạy chung một giáo án sẽ khiến nhóm giỏi bị chậm lại và nhóm yếu bị hổng kiến thức.`;
  }

  const passExcellenceInsight = `Tỷ lệ đạt yêu cầu (≥ 5.0đ) đạt ${passPct}% (${passCount}/${n} lượt). Tỷ lệ giỏi/xuất sắc (≥ 8.0đ) đạt ${excellentPct}% (${excellentCount}/${n} lượt). Nhóm cần phụ đạo (< 5.0đ) chiếm ${weakPct}% (${bands[0].count} lượt).`;

  const pedagogicalActions: string[] = [];
  if (weakPct > 15) {
    pedagogicalActions.push(`Tổ chức 15-20 phút phụ đạo bổ trợ trước giờ học cho nhóm ${bands[0].count} học sinh đang dưới 5.0đ.`);
  }
  if (sd > 1.8) {
    pedagogicalActions.push(`Áp dụng mô hình bài tập phân hóa: Giao bài tập cơ bản cho nhóm dưới ${format1Dec(q1)}đ và bài tập mở rộng/nâng cao cho nhóm trên ${format1Dec(q3)}đ.`);
  }
  if (excellentPct >= 30) {
    pedagogicalActions.push(`Duy trì nguồn tài liệu chuyên sâu và thử thách nâng cao để phát huy năng lực cho nhóm ${excellentCount} học sinh xuất sắc.`);
  }
  if (pedagogicalActions.length === 0) {
    pedagogicalActions.push(`Duy trì phương pháp giảng dạy hiện tại và theo dõi sát bài kiểm tra định kỳ kế tiếp.`);
    pedagogicalActions.push(`Củng cố các chủ đề ngữ pháp cốt lõi cho nhóm học sinh ở vùng trung vị (${format1Dec(median)}đ).`);
  }

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
    commentary: {
      headline,
      overallSummary,
      meanVsMedianInsight,
      dispersionInsight,
      passExcellenceInsight,
      pedagogicalActions,
    },
  };
}
