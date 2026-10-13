import { UnitCurriculum } from './moetCurriculumTypes';
import { MOET_GRADES_6_7 } from './moetGrades6_7';
import { MOET_GRADES_8_9 } from './moetGrades8_9';

export type { UnitCurriculum };

export const MOET_CURRICULUM: Record<number, UnitCurriculum[]> = {
  ...MOET_GRADES_6_7,
  ...MOET_GRADES_8_9,
};

/**
 * Helper to get Unit info by grade and unit number
 */
export function getUnitCurriculum(grade: number | string, unitNumber: number): UnitCurriculum | null {
  const gNum = typeof grade === 'number' ? grade : parseInt(String(grade).replace(/\D/g, '')) || 6;
  const list = MOET_CURRICULUM[gNum] || MOET_CURRICULUM[6];
  return list.find(u => u.unitNumber === unitNumber) || null;
}
