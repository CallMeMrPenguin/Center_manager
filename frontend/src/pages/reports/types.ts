import { GradeTypeItem } from '../../types';

export interface StudentTier {
  tier: number;
  name: string;
  title: string;
  badge: string;
  scale?: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  minScore: number;
  maxScore: number;
}

export const TIERS_CONFIG: StudentTier[] = [
  { tier: 1, name: 'Đồng', title: 'Yếu', badge: '/ranks/tier_1.png', scale: 'scale-[1.45]', color: '#d97706', bg: 'bg-amber-700/10', border: 'border-amber-700/30', text: 'text-amber-500', minScore: 0, maxScore: 4.5 },
  { tier: 2, name: 'Bạc', title: 'Trung Bình', badge: '/ranks/tier_2.png', scale: 'scale-[1.45]', color: '#38bdf8', bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', minScore: 4.6, maxScore: 5.9 },
  { tier: 3, name: 'Vàng', title: 'Khá', badge: '/ranks/tier_3.png', scale: 'scale-[1.7]', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', minScore: 6.0, maxScore: 6.9 },
  { tier: 4, name: 'Bạch Kim', title: 'Giỏi', badge: '/ranks/tier_4.png', scale: 'scale-[1.25]', color: '#818cf8', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300', minScore: 7.0, maxScore: 7.9 },
  { tier: 5, name: 'Kim Cương', title: 'Xuất Sắc', badge: '/ranks/tier_5.png', scale: 'scale-100', color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', minScore: 8.0, maxScore: 8.6 },
  { tier: 6, name: 'Tinh Anh', title: 'Ưu Tú', badge: '/ranks/tier_6.png', scale: 'scale-[1.3]', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', minScore: 8.7, maxScore: 9.1 },
  { tier: 7, name: 'Cao Thủ', title: 'Vượt Trội', badge: '/ranks/tier_7.png', scale: 'scale-[1.75]', color: '#ec4899', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', minScore: 9.2, maxScore: 9.5 },
  { tier: 8, name: 'Quán Quân', title: 'Xuất Chúng', badge: '/ranks/tier_8.png', scale: 'scale-[1.3]', color: '#fbbf24', bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', minScore: 9.6, maxScore: 10.0 }
];

export const getStudentTier = (score: number): StudentTier => {
  if (score >= 9.6) return TIERS_CONFIG[7];
  if (score >= 9.2) return TIERS_CONFIG[6];
  if (score >= 8.7) return TIERS_CONFIG[5];
  if (score >= 8.0) return TIERS_CONFIG[4];
  if (score >= 7.0) return TIERS_CONFIG[3];
  if (score >= 6.0) return TIERS_CONFIG[2];
  if (score >= 4.6) return TIERS_CONFIG[1];
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
