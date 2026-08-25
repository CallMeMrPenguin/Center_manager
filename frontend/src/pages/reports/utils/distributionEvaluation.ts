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
  const goodAndAboveCount = bands[2].count + bands[3].count;
  const goodAndAbovePct = n > 0 ? Math.round((goodAndAboveCount / n) * 100) : 0;
  const avgDiffMedian = n > 0 ? Math.abs(mean - median) : 0;

  const metrics: DistributionMetricItem[] = [
    {
      id: 'mean',
      label: 'Điểm trung bình',
      value: n > 0 ? format1Dec(mean) : '-',
      color: '#3b82f6',
      text: n > 0
        ? `Điểm trung bình đạt ${format1Dec(mean)}/10 trên tổng số ${n} lượt điểm ghi nhận. Mặt bằng kết quả học thuật chung ở mức ${mean >= 8.0 ? 'xuất sắc' : mean >= 7.0 ? 'giỏi' : mean >= 6.0 ? 'khá' : mean >= 5.0 ? 'trung bình' : 'yếu'}.`
        : 'Chưa có dữ liệu điểm kiểm tra ghi nhận cho kỹ năng này.',
      tooltipTitle: `Điểm Trung Bình ${skillName}`,
      tooltipDesc: `Mặt bằng điểm số trung bình của toàn bộ học sinh đối với phần ${skillName}.`,
      tooltipFormula: 'Mean = (Tổng điểm) / N',
      tooltipImpact: 'Đo lường độ vừa sức và chất lượng tiếp thu nội dung kiểm tra.',
    },
    {
      id: 'median',
      label: 'Trung vị & Độ lệch phân bố',
      value: n > 0 ? format1Dec(median) : '-',
      color: '#a855f7',
      text: n === 0
        ? 'Chưa có điểm kiểm tra ghi nhận cho kỹ năng này.'
        : median > mean + 0.2
        ? `Trung vị (${format1Dec(median)} đ) cao hơn điểm trung bình (${format1Dec(mean)} đ) là +${format1Dec(avgDiffMedian)} đ: Phân phối lệch trái, học sinh điển hình thực tế đạt kết quả tốt hơn, điểm trung bình bị kéo xuống bởi một số bài điểm thấp cục bộ.`
        : median < mean - 0.2
        ? `Trung vị (${format1Dec(median)} đ) thấp hơn điểm trung bình (${format1Dec(mean)} đ) là -${format1Dec(avgDiffMedian)} đ: Phân phối lệch phải, điểm trung bình được nâng lên bởi nhóm học sinh xuất sắc, phần lớn học sinh còn lại đang dưới mức trung bình.`
        : `Trung vị (${format1Dec(median)} đ) xấp xỉ điểm trung bình (${format1Dec(mean)} đ): Phân phối điểm số đạt trạng thái cân bằng và đối xứng chuẩn quanh tâm.`,
      tooltipTitle: `Trung Vị & Độ Lệch ${skillName}`,
      tooltipDesc: `Mức điểm của học sinh đứng ở vị trí 50% trung tâm bảng điểm.`,
      tooltipFormula: 'Giá trị phần tử ở vị trí trung vị 50%.',
      tooltipImpact: 'Kháng nhiễu ngoại lai, phản ánh năng lực học sinh điển hình.',
    },
    {
      id: 'sd',
      label: 'Độ lệch chuẩn (SD - σ)',
      value: n > 0 ? format1Dec(sd) : '-',
      color: '#06b6d4',
      text: n === 0
        ? 'Chưa có dữ liệu độ phân tán.'
        : sd < 0.8
        ? `Độ lệch chuẩn rất thấp (σ = ${format1Dec(sd)}): Trình độ học sinh cực kỳ đồng đều, khoảng cách điểm số giữa các em hầu như không đáng kể.`
        : sd <= 1.5
        ? `Độ lệch chuẩn ở mức vừa phải (σ = ${format1Dec(sd)}): Phân hóa học lực lành mạnh, điểm số phân bố tự nhiên theo năng lực tiếp thu.`
        : `Độ lệch chuẩn cao (σ = ${format1Dec(sd)}): Phân hóa học lực sâu sắc, khoảng cách chênh lệch lớn giữa nhóm điểm cao và nhóm điểm thấp.`,
      tooltipTitle: `Độ Lệch Chuẩn ${skillName}`,
      tooltipDesc: `Mức độ phân tán của điểm số xung quanh điểm trung bình.`,
      tooltipFormula: 'σ = sqrt[Σ(xi - Mean)² / N]',
      tooltipImpact: 'Đo lường mức độ đồng đều hay khoảng cách chênh lệch học lực.',
    },
    {
      id: 'iqr',
      label: 'Khoảng tứ phân vị (IQR & Q1-Q3)',
      value: n > 0 ? format1Dec(iqr) : '-',
      color: '#f59e0b',
      text: n === 0
        ? 'Chưa có dữ liệu tứ phân vị.'
        : `Khoảng tứ phân vị IQR = ${format1Dec(iqr)} đ: 50% học sinh ở dải trung tâm tập trung từ ${format1Dec(q1)} đ (Q1) đến ${format1Dec(q3)} đ (Q3). ${iqr <= 1.5 ? 'Vùng điểm lõi co cụm hẹp, kiến thức lớp tương đồng.' : 'Vùng điểm lõi trải rộng, biên độ năng lực đa dạng.'}`,
      tooltipTitle: `Khoảng Tứ Phân Vị ${skillName}`,
      tooltipDesc: 'Độ rộng vùng điểm chứa 50% học sinh trung tâm (từ phân vị 25% đến 75%).',
      tooltipFormula: 'IQR = Q3 - Q1',
      tooltipImpact: 'Xác định vùng năng lực an toàn của đa số học sinh.',
    },
    {
      id: 'bands_breakdown',
      label: 'Cơ cấu 4 tầng phổ điểm',
      value: n > 0 ? `${bands[3].pct}% Giỏi` : '-',
      color: '#10b981',
      text: n > 0
        ? `Phân tầng phổ điểm: Nhóm Giỏi (≥ 8đ) chiếm ${bands[3].pct}% (${bands[3].count} lượt), Nhóm Khá (6.5-7.9đ) chiếm ${bands[2].pct}% (${bands[2].count} lượt), Nhóm Trung Bình (5-6.4đ) chiếm ${bands[1].pct}% (${bands[1].count} lượt), Nhóm Cần Bổ Trợ (< 5đ) chiếm ${bands[0].pct}% (${bands[0].count} lượt).`
        : 'Chưa có dữ liệu phân tầng điểm.',
      tooltipTitle: 'Cơ Cấu Phân Tầng Học Lực',
      tooltipDesc: 'Tỷ lệ phân bố số lượng bài kiểm tra qua 4 thang bậc học lực chuẩn.',
      tooltipFormula: 'Tỷ lệ tầng = (Số bài trong tầng / N) × 100%',
      tooltipImpact: 'Cho biết bức tranh tổng thể về cơ cấu chất lượng học sinh.',
    },
  ];

  const overviewSummary = n > 0
    ? `Chất lượng kiểm tra ${skillName.toLowerCase()} đạt mức xếp loại ${distributionRating} với điểm trung bình ${format1Dec(mean)}/10 và điểm trung vị ${format1Dec(median)}/10. Tổng số có ${goodAndAbovePct}% bài kiểm tra đạt chuẩn Khá trở lên (${goodAndAboveCount}/${n} lượt), trong đó nhóm Xuất Sắc đạt ${bands[3].pct}%.`
    : `Chưa có dữ liệu bài kiểm tra ${skillName.toLowerCase()} trong cơ sở dữ liệu.`;

  const dispersionWarning = n > 0
    ? `Phổ điểm có độ lệch chuẩn σ = ${format1Dec(sd)} và khoảng tứ phân vị IQR = ${format1Dec(iqr)} đ (${format1Dec(q1)} - ${format1Dec(q3)} đ), phản ánh ${sd > 1.6 ? `sự phân cực học lực rõ nét với ${bands[0].count} bài dưới 5.0 điểm cần được theo dõi kỹ.` : `mặt bằng tiếp thu kiến thức đồng đều và ổn định.`}`
    : 'Chưa đủ dữ liệu để tính toán độ phân tán.';

  const subjectTitle = className ? `ĐÁNH GIÁ PHỔ ĐIỂM CHI TIẾT - ${className.toUpperCase()}` : 'ĐÁNH GIÁ PHỔ ĐIỂM & PHÂN PHỐI HỌC LỰC';

  const evaluation: DistributionDetailedEvaluation = {
    subjectTitle,
    skillName,
    metrics,
    conclusion: {
      overviewSummary,
      dispersionWarning,
      strategicAction: '',
    },
    pedagogicalActions: [],
  };

  const commentary = {
    headline: n > 0
      ? `Phổ điểm ${skillName.toLowerCase()} đạt mức ${distributionRating.toLowerCase()} (TB: ${format1Dec(mean)}, Trung vị: ${format1Dec(median)}).`
      : `Chưa có dữ liệu điểm phần ${skillName.toLowerCase()}.`,
    overallSummary: overviewSummary,
    meanVsMedianInsight: metrics[1].text,
    dispersionInsight: metrics[2].text,
    passExcellenceInsight: n > 0 ? `${passPct}% đạt chuẩn, ${excellentPct}% giỏi` : 'Chưa có dữ liệu',
    pedagogicalActions: [],
  };

  return { evaluation, commentary };
}
