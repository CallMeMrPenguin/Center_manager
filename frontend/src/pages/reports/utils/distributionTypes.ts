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
    title: 'Đạt Chuẩn',
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
    name: 'Giỏi / Xuất Sắc',
    title: 'Nâng Cao',
    minScore: 8.0,
    maxScore: 10.0,
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
];
