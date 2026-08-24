import { format1Dec } from '../../../utils';
import {
  DistributionBand,
  DistributionMetricItem,
  DistributionDetailedEvaluation
} from './distributionTypes';

interface BuildEvaluationParams {
  n: number;
  mean: number;
  median: number;
  sd: number;
  q1: number;
  q3: number;
  iqr: number;
  passPct: number;
  excellentPct: number;
  bands: DistributionBand[];
  skillName: string;
  className?: string;
  distributionRating: string;
}

export function buildDistributionEvaluation({
  n,
  mean,
  median,
  sd,
  q1,
  q3,
  iqr,
  passPct,
  excellentPct,
  bands,
  skillName,
  className,
  distributionRating,
}: BuildEvaluationParams) {
  const metrics: DistributionMetricItem[] = [
    {
      id: 'mean',
      label: 'Điểm trung bình',
      value: n > 0 ? format1Dec(mean) : '-',
      color: '#3b82f6',
      text: n > 0
        ? `Điểm trung bình ${format1Dec(mean)} → ${mean >= 8.0 ? 'mặt bằng kết quả rất tốt.' : mean >= 6.5 ? 'kết quả khá, cần nâng cao thêm.' : 'còn nhiều học sinh dưới chuẩn.'}`
        : 'Chưa có điểm kiểm tra ghi nhận cho kỹ năng này.',
      tooltipTitle: `Điểm Trung Bình ${skillName}`,
      tooltipDesc: `Mặt bằng điểm số trung bình của toàn bộ học sinh đối với phần ${skillName}.`,
      tooltipFormula: 'Mean = (Tổng điểm) / N',
      tooltipImpact: 'Đo lường độ vừa sức của nội dung kiểm tra.',
    },
    {
      id: 'median',
      label: 'Trung vị',
      value: n > 0 ? format1Dec(median) : '-',
      color: '#a855f7',
      text: n === 0
        ? 'Chưa có điểm kiểm tra ghi nhận cho kỹ năng này.'
        : median > mean + 0.15
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
      value: n > 0 ? format1Dec(sd) : '-',
      color: '#06b6d4',
      text: n === 0
        ? 'Chưa có dữ liệu độ phân tán.'
        : `SD = ${format1Dec(sd)} → ${sd < 1.0 ? 'độ phân tán thấp, lớp học cực kỳ đồng đều.' : sd <= 1.8 ? 'phân hóa vừa phải, khỏe mạnh.' : 'phân hóa mạnh, chênh lệch lớn giữa các nhóm.'}`,
      tooltipTitle: `Độ Lệch Chuẩn ${skillName}`,
      tooltipDesc: `Mức độ dao động của điểm quanh điểm trung bình.`,
      tooltipFormula: 'σ = sqrt[Σ(xi - Mean)² / N]',
      tooltipImpact: 'Đo lường mức độ đồng đều hay khoảng cách chênh lệch học lực.',
    },
    {
      id: 'iqr',
      label: 'Khoảng tứ phân vị (IQR)',
      value: n > 0 ? format1Dec(iqr) : '-',
      color: '#f59e0b',
      text: n === 0
        ? 'Chưa có dữ liệu tứ phân vị.'
        : `IQR = ${format1Dec(iqr)}đ → 50% học sinh ở giữa tập trung từ ${format1Dec(q1)} đến ${format1Dec(q3)}đ.`,
      tooltipTitle: `Khoảng Tứ Phân Vị ${skillName}`,
      tooltipDesc: 'Độ rộng vùng điểm chứa 50% học sinh trung tâm.',
      tooltipFormula: 'IQR = Q3 - Q1',
      tooltipImpact: 'Xác định vùng an toàn của đa số học sinh.',
    },
    {
      id: 'weak',
      label: 'Tỷ lệ Yếu / Kém (< 5đ)',
      value: n > 0 ? `${bands[0].pct}%` : '-',
      color: '#f43f5e',
      text: n > 0 ? `${bands[0].pct}% yếu/kém (< 5đ) → ${bands[0].count} lượt điểm chưa đạt chuẩn.` : 'Chưa có dữ liệu.',
      tooltipTitle: 'Tỷ Lệ Dưới 5.0',
      tooltipDesc: 'Tỷ lệ học sinh chưa đạt chuẩn kiến thức tối thiểu.',
      tooltipFormula: '(Số lượt < 5.0đ / N) × 100%',
      tooltipImpact: 'Cảnh báo cần can thiệp phụ đạo kịp thời.',
    },
    {
      id: 'excellent',
      label: 'Tỷ lệ Giỏi (≥ 8đ)',
      value: n > 0 ? `${bands[3].pct}%` : '-',
      color: '#10b981',
      text: n > 0 ? `${bands[3].pct}% giỏi/xuất sắc (≥ 8đ) → ${bands[3].count} lượt điểm mũi nhọn.` : 'Chưa có dữ liệu.',
      tooltipTitle: 'Tỷ Lệ Giỏi & Xuất Sắc',
      tooltipDesc: 'Tỷ lệ học sinh đạt chuẩn nâng cao.',
      tooltipFormula: '(Số lượt ≥ 8.0đ / N) × 100%',
      tooltipImpact: 'Đo lường chất lượng mũi nhọn học thuật.',
    },
  ];

  const goodAndAboveCount = bands[2].count + bands[3].count;
  const goodAndAbovePct = n > 0 ? Math.round((goodAndAboveCount / n) * 100) : 0;

  const overviewSummary = n > 0
    ? `Chất lượng ${skillName.toLowerCase()} chung ${mean >= 7.5 ? 'rất tốt' : mean >= 6.0 ? 'khá' : 'trung bình'}. Nhóm đạt khá trở lên chiếm ${goodAndAbovePct}% (${goodAndAboveCount}/${n} lượt), trong khi nhóm dưới 5 điểm chiếm ${bands[0].pct}% (${bands[0].count} lượt).`
    : `Chưa có dữ liệu bài kiểm tra ${skillName.toLowerCase()} trong cơ sở dữ liệu.`;
  const dispersionWarning = n > 0
    ? `Chỉ số IQR = ${format1Dec(iqr)}đ và SD = ${format1Dec(sd)} phản ánh ${sd > 1.8 ? 'độ phân hóa học lực đáng kể giữa nhóm đầu và nhóm cuối.' : 'mặt bằng học sinh tương đối ổn định.'}`
    : 'Chưa đủ dữ liệu để tính toán độ phân tán.';
  const strategicAction = n === 0
    ? `Tổ chức bài kiểm tra phần ${skillName.toLowerCase()} để hệ thống phân tích phổ điểm chi tiết.`
    : bands[0].pct > 15
    ? `Trọng tâm là phụ đạo bổ trợ cho ${bands[0].count} học sinh đang dưới 5.0đ, đồng thời bồi dưỡng nâng cao cho nhóm khá.`
    : `Duy trì đà phát triển và bồi dưỡng nhóm khá (${bands[2].pct}%) vươn lên nhóm giỏi ≥ 8.0.`;

  const pedagogicalActions: string[] = [];
  if (n === 0) {
    pedagogicalActions.push(`Nhập điểm kiểm tra cho phần ${skillName.toLowerCase()} trong trang Điểm Danh & Điểm để tự động kích hoạt biểu đồ phổ điểm.`);
  } else {
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
  }

  const subjectTitle = className ? `Đánh Giá Phổ Điểm - ${className}` : 'Đánh Giá Phổ Điểm & Phân Phối Học Lực';

  const evaluation: DistributionDetailedEvaluation = {
    subjectTitle,
    skillName,
    metrics,
    conclusion: { overviewSummary, dispersionWarning, strategicAction },
    pedagogicalActions,
  };

  const commentary = {
    headline: n > 0
      ? `Phổ điểm ${skillName.toLowerCase()} đạt mức ${distributionRating.toLowerCase()} (TB: ${format1Dec(mean)}, Trung vị: ${format1Dec(median)}).`
      : `Chưa có dữ liệu điểm phần ${skillName.toLowerCase()}.`,
    overallSummary: overviewSummary,
    meanVsMedianInsight: metrics[1].text,
    dispersionInsight: metrics[2].text,
    passExcellenceInsight: n > 0 ? `${passPct}% đạt chuẩn, ${excellentPct}% giỏi` : 'Chưa có dữ liệu',
    pedagogicalActions,
  };

  return { evaluation, commentary };
}
