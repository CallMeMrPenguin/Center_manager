import { getUnitCurriculum } from '../../../config/moetCurriculum';
import { trunc1Dec } from '../../../utils';

export interface HeatmapUnit {
  unit_key: string;
  unit_name?: string;
  skill: string;
  unit_id?: string;
  avg_score: number;
  mastery_pct?: number;
  mastered_count?: number;
  student_count?: number;
}

export interface StudentUnitData {
  skill: string;
  unit_name?: string;
  ema_score: number;
  last_score?: number;
  test_count: number;
  mastery_status: 'mastered' | 'partial' | 'regressed' | 'not_yet';
  last_tested?: string;
}

export interface HeatmapStudent {
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  grade?: string;
  units: Record<string, StudentUnitData>;
}

export interface FormattedUnitInfo {
  unitKey: string;
  unitName: string;
  vietnameseTitle: string;
  displayTitle: string;
  fullTitle: string;
}

/**
 * Resolves full unit title, English name, and Vietnamese title
 * from unitKey, backend unit_name, and class grade.
 */
export function resolveFullUnitInfo(
  unitKey: string,
  backendUnitName?: string,
  grade?: number | string
): FormattedUnitInfo {
  const uMatch = unitKey.match(/(?:Unit|Bài)\s*(\d+)/i);
  const uNum = uMatch ? parseInt(uMatch[1], 10) : 0;

  const gMatch = unitKey.match(/\[K?(\d+)\]/i);
  const resolvedGrade = gMatch ? gMatch[1] : (grade ? String(grade).replace(/\D/g, '') : '6');

  const curr = uNum > 0 ? getUnitCurriculum(resolvedGrade || 6, uNum) : null;

  const unitName = backendUnitName || curr?.title || '';
  const vietnameseTitle = curr?.vietnameseTitle || '';

  // Clean key without [K6] for cleaner inline reading
  const cleanKey = unitKey.replace(/\[K?\d+\]\s*/i, '').trim();

  let displayTitle = cleanKey;
  if (unitName && !cleanKey.toLowerCase().includes(unitName.toLowerCase())) {
    displayTitle = `${cleanKey}: ${unitName}`;
  }

  let fullTitle = displayTitle;
  if (vietnameseTitle && !displayTitle.toLowerCase().includes(vietnameseTitle.toLowerCase())) {
    fullTitle = `${displayTitle} (${vietnameseTitle})`;
  }

  return {
    unitKey,
    unitName,
    vietnameseTitle,
    displayTitle,
    fullTitle,
  };
}

/**
 * Clean glowing badges with vibrant colors adhering to 4-tier mastery scale
 */
export function getBadgeStyle(ema?: number) {
  if (ema === undefined || ema === null || ema < 0) {
    return {
      badgeClass: 'text-slate-400 dark:text-slate-600 font-normal hover:bg-slate-100 dark:hover:bg-slate-800/40',
      label: '-',
      textColor: 'text-slate-500',
    };
  }
  const score = Number(ema);
  if (score >= 8.0) {
    return {
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 hover:scale-105 font-black',
      label: trunc1Dec(score),
      textColor: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (score >= 6.5) {
    return {
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 hover:scale-105 font-bold',
      label: trunc1Dec(score),
      textColor: 'text-amber-600 dark:text-amber-400',
    };
  }
  if (score >= 5.0) {
    return {
      badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/25 hover:scale-105 font-bold',
      label: trunc1Dec(score),
      textColor: 'text-orange-600 dark:text-orange-400',
    };
  }
  return {
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 hover:scale-105 font-black',
    label: trunc1Dec(score),
    textColor: 'text-rose-600 dark:text-rose-400',
  };
}

export function getStatusBadge(status?: string, score?: number) {
  if (score === undefined || score === null || score < 0) {
    return {
      label: 'Chưa kiểm tra',
      className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    };
  }
  if (status === 'mastered' || score >= 8.0) {
    return {
      label: 'Nắm Vững',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    };
  }
  if (status === 'regressed') {
    return {
      label: 'Giảm Phong Độ',
      className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    };
  }
  if (status === 'partial' || score >= 6.5) {
    return {
      label: 'Đang Tiến Bộ',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    };
  }
  if (score >= 5.0) {
    return {
      label: 'Cần Củng Cố',
      className: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    };
  }
  return {
    label: 'Chưa Đạt (Kèm Gấp)',
    className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };
}
