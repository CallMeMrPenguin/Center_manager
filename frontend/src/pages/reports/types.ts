import { GradeTypeItem } from '../../types';

export interface StudentTier {
  tier: number;
  name: string;
  title: string;
  badge: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  minScore: number;
  maxScore: number;
}

export const TIERS_CONFIG: StudentTier[] = [
  { tier: 1, name: 'Đồng', title: 'Tập Sự', badge: '/ranks/tier_1.png', color: '#d97706', bg: 'bg-amber-700/10', border: 'border-amber-700/30', text: 'text-amber-500', minScore: 0, maxScore: 4.9 },
  { tier: 2, name: 'Bạc', title: 'Cơ Bản', badge: '/ranks/tier_2.png', color: '#38bdf8', bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', minScore: 5.0, maxScore: 6.4 },
  { tier: 3, name: 'Vàng', title: 'Khá', badge: '/ranks/tier_3.png', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', minScore: 6.5, maxScore: 7.4 },
  { tier: 4, name: 'Bạch Kim', title: 'Giỏi', badge: '/ranks/tier_4.png', color: '#818cf8', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300', minScore: 7.5, maxScore: 8.4 },
  { tier: 5, name: 'Tinh Anh', title: 'Xuất Sắc', badge: '/ranks/tier_5.png', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', minScore: 8.5, maxScore: 8.9 },
  { tier: 6, name: 'Cao Thủ', title: 'Siêu Việt', badge: '/ranks/tier_6.png', color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', minScore: 9.0, maxScore: 9.4 },
  { tier: 7, name: 'Quán Quân', title: 'Huyền Thoại', badge: '/ranks/tier_7.png', color: '#fbbf24', bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', minScore: 9.5, maxScore: 10.0 }
];

export const getStudentTier = (score: number): StudentTier => {
  if (score >= 9.5) return TIERS_CONFIG[6];
  if (score >= 9.0) return TIERS_CONFIG[5];
  if (score >= 8.5) return TIERS_CONFIG[4];
  if (score >= 7.5) return TIERS_CONFIG[3];
  if (score >= 6.5) return TIERS_CONFIG[2];
  if (score >= 5.0) return TIERS_CONFIG[1];
  return TIERS_CONFIG[0];
};

export const CLASS_PALETTE_36: string[] = [
  '#3b82f6', '#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#ec4899',
  '#6366f1', '#14b8a6', '#84cc16', '#f97316', '#8b5cf6', '#e11d48',
  '#0284c7', '#059669', '#d97706', '#d946ef', '#4f46e5', '#10b981',
  '#eab308', '#f43f5e', '#7c3aed', '#0ea5e9', '#22c55e', '#fb923c',
  '#c084fc', '#fb7185', '#38bdf8', '#4ade80', '#facc15', '#f472b6',
  '#818cf8', '#2dd4bf', '#a3e635', '#fdba74', '#e879f9', '#67e8f9'
];

export const getClassColor = (classId: string | number, fallbackIndex: number = 0): string => {
  if (!classId) return CLASS_PALETTE_36[fallbackIndex % CLASS_PALETTE_36.length];
  const str = String(classId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CLASS_PALETTE_36.length;
  return CLASS_PALETTE_36[index];
};

export interface WarningSettings {
  absentPct: number;
  consecutiveAbsent: number;
  trendThreshold: number;
}

export interface HoveredChartPoint {
  index: number;
  sessionName: string;
  fullDate: string;
  check1: number;
  check2: number;
  homework: number;
  x: number;
  fittedC1: number | null;
  fittedC2: number | null;
  fittedHw: number | null;
  predModel: string;
}

export interface ChartSessionItem {
  sessionName: string;
  fullDate: string;
  check1: number;
  check2: number;
  homework: number;
  overall: number;
}
