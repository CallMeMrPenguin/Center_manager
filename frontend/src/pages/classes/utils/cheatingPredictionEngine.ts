import { SeatingCol, AttendanceRecord } from '../types';
import { trunc1Dec, format1Dec } from '../../../utils';

export interface SeatedStudentInfo {
  studentId: number;
  studentName: string;
  colIdx: number;
  deskIdx: number;
  posIdx: number;
  score: number | null;
  c1: number | null;
  c2: number | null;
  hw: number | null;
  expectedScore: number | null;
}

export type ProximityType = 'same_desk' | 'direct_front' | 'diagonal_front' | 'adjacent_aisle';

export interface CheatingPredictionPair {
  copierId: number;
  copierName: string;
  copierSeat: string; // e.g. "Cột 1, Bàn 2, Ghế 1"
  copierScore: number;
  copierBaseline: number | null;

  sourceId: number;
  sourceName: string;
  sourceSeat: string; // e.g. "Cột 1, Bàn 2, Ghế 2"
  sourceScore: number;

  probability: number; // 0 - 100%
  riskLevel: 'high' | 'medium' | 'low';
  proximityType: ProximityType;
  proximityLabel: string;
  reasons: string[];
}

const parseNum = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

/**
 * Predicts cheating/peeking probability between all pairs of seated students
 */
export function predictCheatingProbabilities(
  seatingGrid: SeatingCol[],
  attendanceRecords: AttendanceRecord[]
): CheatingPredictionPair[] {
  // 1. Map attendance records by student_id
  const recordMap = new Map<number, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    recordMap.set(r.student_id, r);
  });

  // 2. Flatten all seated students
  const seatedStudents: SeatedStudentInfo[] = [];

  seatingGrid.forEach((col) => {
    col.seats.forEach((seat) => {
      if (seat.student_id && seat.student_name) {
        const rec = recordMap.get(seat.student_id);
        const c1 = parseNum(rec?.check_1);
        const c2 = parseNum(rec?.check_2);
        const hw = parseNum(rec?.homework);
        const predC1 = parseNum(rec?.pred_check_1 ?? rec?.pred_c1);
        const predC2 = parseNum(rec?.pred_check_2 ?? rec?.pred_c2);

        // Compute current session test score
        let score: number | null = null;
        if (c1 !== null && c2 !== null) {
          score = (c1 + c2) / 2;
        } else if (c1 !== null) {
          score = c1;
        } else if (c2 !== null) {
          score = c2;
        }

        // Compute baseline / expected capability
        let expectedScore: number | null = null;
        if (predC1 !== null && predC2 !== null) {
          expectedScore = (predC1 + predC2) / 2;
        } else if (predC1 !== null) {
          expectedScore = predC1;
        } else if (predC2 !== null) {
          expectedScore = predC2;
        } else if (hw !== null && hw > 0) {
          expectedScore = hw;
        }

        seatedStudents.push({
          studentId: seat.student_id,
          studentName: seat.student_name,
          colIdx: col.col_index,
          deskIdx: seat.desk,
          posIdx: seat.position,
          score,
          c1,
          c2,
          hw,
          expectedScore,
        });
      }
    });
  });

  const results: CheatingPredictionPair[] = [];

  // 3. Compare every pair (A: potential copier, B: potential source)
  for (let i = 0; i < seatedStudents.length; i++) {
    const A = seatedStudents[i];
    if (A.score === null) continue; // No score to evaluate

    for (let j = 0; j < seatedStudents.length; j++) {
      if (i === j) continue;
      const B = seatedStudents[j];
      if (B.score === null) continue;

      // GEOMETRIC PROXIMITY CHECK
      let proximity: ProximityType | null = null;
      let proximityLabel = '';
      let visibilityWeight = 0;

      const sameCol = A.colIdx === B.colIdx;
      const colDiff = Math.abs(A.colIdx - B.colIdx);
      const deskDiff = A.deskIdx - B.deskIdx; // positive if A is behind B

      // Case A: Sitting side-by-side at the SAME DESK
      if (sameCol && A.deskIdx === B.deskIdx && A.posIdx !== B.posIdx) {
        proximity = 'same_desk';
        proximityLabel = 'Ngồi Cùng Bàn';
        visibilityWeight = 0.92;
      }
      // Case B: A sits directly behind B (same col, deskDiff === 1, same pos)
      else if (sameCol && deskDiff === 1 && A.posIdx === B.posIdx) {
        proximity = 'direct_front';
        proximityLabel = 'Ngồi Ngay Sau Lưng';
        visibilityWeight = 0.78;
      }
      // Case C: A sits diagonally behind B (colDiff === 1, deskDiff === 1)
      else if (colDiff === 1 && deskDiff === 1) {
        proximity = 'diagonal_front';
        proximityLabel = 'Ngồi Chéo Phía Sau';
        visibilityWeight = 0.52;
      }
      // Case D: Aisle adjacent, same row (colDiff === 1, deskDiff === 0)
      else if (colDiff === 1 && deskDiff === 0) {
        proximity = 'adjacent_aisle';
        proximityLabel = 'Bàn Liền Kề Cạnh';
        visibilityWeight = 0.38;
      }

      if (!proximity) continue; // Outside visual peeking range

      // SCORE DIRECTION & REASONING EVALUATION
      // A can only copy from B if B scored well or higher than A
      const scoreDiff = B.score - A.score;
      if (scoreDiff < -1.5) {
        // B scored much lower than A; impossible that A copied from B
        continue;
      }

      const reasons: string[] = [];
      reasons.push(proximityLabel);

      let scoreFactor = 0.5;
      const absGap = Math.abs(A.score - B.score);

      if (absGap <= 0.5) {
        scoreFactor = 1.0;
        reasons.push(`Điểm số tương đồng sát sao (chênh lệch chỉ ${format1Dec(absGap)} đ)`);
      } else if (absGap <= 1.0) {
        scoreFactor = 0.85;
        reasons.push(`Điểm số bám sát nhau (chênh lệch ${format1Dec(absGap)} đ)`);
      } else if (scoreDiff > 0) {
        scoreFactor = 0.7;
        reasons.push(`B đạt điểm cao hơn A (${format1Dec(B.score)} vs ${format1Dec(A.score)})`);
      }

      // ANOMALY CHECK (A's score today vs baseline)
      let anomalyMultiplier = 1.0;
      if (A.expectedScore !== null) {
        const jump = A.score - A.expectedScore;
        if (jump >= 2.0) {
          anomalyMultiplier = 1.35;
          reasons.push(`Điểm A hôm nay tăng đột biến +${format1Dec(jump)} đ so với năng lực`);
        } else if (jump >= 1.0) {
          anomalyMultiplier = 1.15;
        }
      }

      // High score bonus on difficult checks
      if (A.score >= 7.5 && B.score >= 8.0) {
        anomalyMultiplier *= 1.1;
      }

      // FINAL PROBABILITY CALCULATION (Sigmoidal / Normalized clamp)
      const rawProb = visibilityWeight * scoreFactor * anomalyMultiplier * 100;
      const probability = Math.min(96, Math.max(12, Math.round(rawProb)));

      if (probability >= 45) {
        const riskLevel: 'high' | 'medium' | 'low' =
          probability >= 70 ? 'high' : probability >= 50 ? 'medium' : 'low';

        results.push({
          copierId: A.studentId,
          copierName: A.studentName,
          copierSeat: `Cột ${A.colIdx + 1}, Bàn ${A.deskIdx}, Ghế ${A.posIdx}`,
          copierScore: A.score,
          copierBaseline: A.expectedScore,
          sourceId: B.studentId,
          sourceName: B.studentName,
          sourceSeat: `Cột ${B.colIdx + 1}, Bàn ${B.deskIdx}, Ghế ${B.posIdx}`,
          sourceScore: B.score,
          probability,
          riskLevel,
          proximityType: proximity,
          proximityLabel,
          reasons,
        });
      }
    }
  }

  // Sort descending by highest cheating probability
  results.sort((a, b) => b.probability - a.probability);
  return results;
}
