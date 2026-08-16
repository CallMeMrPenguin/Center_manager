import { WarningSettings } from './types';
import { trunc1Dec } from '../../utils';

export interface StandardMoetPhase {
  id: string;
  phase_name: string;
  from_date: string;
  to_date: string;
  is_standard: boolean;
}

export const DEFAULT_WARNING_SETTINGS: WarningSettings = {
  absentPct: 15,
  consecutiveAbsent: 2,
  trendThreshold: -0.2
};

export const getSavedWarningSettings = (): WarningSettings => {
  try {
    const raw = localStorage.getItem('cm_reports_warning_settings');
    if (raw) return { ...DEFAULT_WARNING_SETTINGS, ...JSON.parse(raw) };
  } catch { }
  return DEFAULT_WARNING_SETTINGS;
};

export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export const generateAcademicYears = (): string[] => {
  const current = getCurrentAcademicYear();
  const [startYearStr] = current.split('-');
  const startYear = parseInt(startYearStr, 10) || 2026;
  const years: string[] = [];
  for (let y = startYear - 2; y <= startYear + 2; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
};

export const getStandardMoetPhases = (academicYear: string): StandardMoetPhase[] => {
  let startYear = 2026;
  try {
    const parts = academicYear.split('-');
    if (parts.length >= 2) startYear = parseInt(parts[0], 10);
  } catch { }
  const endYear = startYear + 1;

  return [
    {
      id: `moet-full-${academicYear}`,
      phase_name: `Cả Năm Học (${academicYear})`,
      from_date: `${startYear}-09-05`,
      to_date: `${endYear}-05-31`,
      is_standard: true,
    },
    {
      id: `moet-hk1-${academicYear}`,
      phase_name: 'Học Kỳ I',
      from_date: `${startYear}-09-05`,
      to_date: `${endYear}-01-15`,
      is_standard: true,
    },
    {
      id: `moet-mid-hk1-${academicYear}`,
      phase_name: 'Giữa Học Kỳ I',
      from_date: `${startYear}-09-05`,
      to_date: `${startYear}-11-05`,
      is_standard: true,
    },
    {
      id: `moet-end-hk1-${academicYear}`,
      phase_name: 'Cuối Học Kỳ I',
      from_date: `${startYear}-11-06`,
      to_date: `${endYear}-01-15`,
      is_standard: true,
    },
    {
      id: `moet-hk2-${academicYear}`,
      phase_name: 'Học Kỳ II',
      from_date: `${endYear}-01-16`,
      to_date: `${endYear}-05-31`,
      is_standard: true,
    },
    {
      id: `moet-mid-hk2-${academicYear}`,
      phase_name: 'Giữa Học Kỳ II',
      from_date: `${endYear}-01-16`,
      to_date: `${endYear}-03-31`,
      is_standard: true,
    },
    {
      id: `moet-end-hk2-${academicYear}`,
      phase_name: 'Cuối Học Kỳ II',
      from_date: `${endYear}-04-01`,
      to_date: `${endYear}-05-31`,
      is_standard: true,
    },
  ];
};

export const formatFullDate = (dStr: string): string => {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dStr;
};

export const formatSessionDate = (fullDateStr: string): string => {
  if (!fullDateStr) return '';
  try {
    const trimmed = fullDateStr.trim();
    if (trimmed.includes('-')) {
      const parts = trimmed.split(/[\sT]+/);
      const dateParts = parts[0].split('-');
      if (dateParts.length >= 3) {
        const dd = dateParts[2].padStart(2, '0');
        const mm = dateParts[1].padStart(2, '0');
        const yy = dateParts[0].slice(-2);
        const dateFormatted = `${dd}/${mm}/${yy}`;
        if (parts[1]) {
          const timeParts = parts[1].split(':');
          const hh = (timeParts[0] || '00').padStart(2, '0');
          const min = (timeParts[1] || '00').padStart(2, '0');
          const ss = (timeParts[2] || '00').split('.')[0].padStart(2, '0');
          return `${hh}:${min}:${ss} ${dateFormatted}`;
        }
        return dateFormatted;
      }
    }
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].slice(-2)}`;
      }
    }
  } catch {
    // fallback
  }
  return fullDateStr;
};

export const computeClassAnalyticsSd = (records: any[]): number => {
  if (!records || records.length === 0) return 0.0;
  const c1_list: number[] = [];
  const c2_list: number[] = [];
  const hw_list: number[] = [];

  records.forEach(r => {
    const st = r.status || 'Có mặt';
    if (st === 'Vắng mặt' || st === 'Nghỉ học') return;
    const c1 = Number(r.check_1 || 0);
    const c2 = Number(r.check_2 || 0);
    const hw = Number(r.homework || 0);
    if (c1 > 0) c1_list.push(c1);
    if (c2 > 0) c2_list.push(c2);
    if (hw > 0) hw_list.push(hw);
  });

  const getFittedEma = (vals: number[]): number[] => {
    if (vals.length === 0) return [];
    let ema = vals[0];
    return vals.map(v => {
      ema = 0.5 * v + 0.5 * ema;
      return trunc1Dec(Math.max(0, Math.min(10, ema)));
    });
  };

  const calcResidualSd = (vals: number[]): number => {
    if (vals.length < 2) return 0.0;
    const fitted = getFittedEma(vals);
    const v = vals.reduce((sum, val, idx) => sum + Math.pow(val - fitted[idx], 2), 0) / vals.length;
    return Math.sqrt(v);
  };

  const sd_c1 = calcResidualSd(c1_list);
  const sd_c2 = calcResidualSd(c2_list);
  const sd_hw = calcResidualSd(hw_list);

  let w_sum = 0.0;
  let w_tot = 0.0;
  if (hw_list.length > 0) { w_sum += sd_hw * 0.10; w_tot += 0.10; }
  if (c1_list.length > 0) { w_sum += sd_c1 * 0.35; w_tot += 0.35; }
  if (c2_list.length > 0) { w_sum += sd_c2 * 0.55; w_tot += 0.55; }

  return w_tot > 0 ? trunc1Dec(w_sum / w_tot) : 0.0;
};
