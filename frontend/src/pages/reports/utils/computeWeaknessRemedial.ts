import { trunc1Dec } from '../../../utils';

export interface StudentWeakUnitItem {
  unit_key: string;
  skill: 'vocab' | 'grammar';
  topic_name: string;
  avg_score: number;
  test_count: number;
}

export interface StudentRemedialSummaryRow {
  id: string;
  student_id: number;
  student_name: string;
  nickname: string;
  class_name: string;
  weak_units: StudentWeakUnitItem[];
  total_weak_count: number;
  grammar_count: number;
  vocab_count: number;
  urgent_count: number;
  lowest_score: number;
  status: string;
}

export function computeWeaknessRemedialList({
  heatmapStudents,
  sessionRecords,
  selectedClassId,
  selectedStudentId,
  isTestMode,
}: {
  heatmapStudents?: any[];
  sessionRecords: any[];
  selectedClassId: string;
  selectedStudentId?: string;
  isTestMode?: boolean;
}): StudentRemedialSummaryRow[] {
  if (heatmapStudents && heatmapStudents.length > 0) {
    const rows: StudentRemedialSummaryRow[] = [];

    heatmapStudents.forEach(st => {
      if (selectedStudentId && selectedStudentId !== '0' && selectedStudentId !== '' && String(st.student_id) !== String(selectedStudentId)) {
        return;
      }

      const weakUnits: StudentWeakUnitItem[] = [];
      Object.entries(st.units || {}).forEach(([uKey, uData]: [string, any]) => {
        if (uData.ema_score !== undefined && uData.ema_score !== null && uData.ema_score < 6.5) {
          weakUnits.push({
            unit_key: uKey,
            skill: (uData.skill as any) || 'grammar',
            topic_name: uKey,
            avg_score: trunc1Dec(uData.ema_score),
            test_count: uData.test_count || 1,
          });
        }
      });

      if (weakUnits.length > 0) {
        weakUnits.sort((a, b) => a.avg_score - b.avg_score);
        const urgentCount = weakUnits.filter(u => u.avg_score < 5.0).length;
        const grammarCount = weakUnits.filter(u => u.skill === 'grammar').length;
        const vocabCount = weakUnits.filter(u => u.skill === 'vocab').length;
        const lowestScore = weakUnits[0]?.avg_score ?? 0;

        rows.push({
          id: String(st.student_id),
          student_id: st.student_id,
          student_name: st.student_name,
          nickname: st.nickname || '',
          class_name: st.class_name || '',
          weak_units: weakUnits,
          total_weak_count: weakUnits.length,
          grammar_count: grammarCount,
          vocab_count: vocabCount,
          urgent_count: urgentCount,
          lowest_score: lowestScore,
          status: urgentCount > 0 ? 'Cần Phụ Đạo Gấp' : 'Cần Củng Cố',
        });
      }
    });

    return rows.sort((a, b) => (b.urgent_count - a.urgent_count) || (b.total_weak_count - a.total_weak_count));
  }

  // Fallback when explicit topics exist in sessionRecords
  let list = selectedClassId ? sessionRecords.filter(r => String(r.class_id) === selectedClassId) : sessionRecords;
  if (selectedStudentId && selectedStudentId !== '0' && selectedStudentId !== '') {
    list = list.filter(r => String(r.student_id) === String(selectedStudentId));
  }
  if (!list || list.length === 0) return [];

  const studentScoreMap = new Map<number, {
    name: string;
    nickname: string;
    className: string;
    unitMap: Map<string, { unit_key: string; skill: 'vocab' | 'grammar'; topic_name: string; scores: number[] }>;
  }>();

  list.forEach(r => {
    const uKey = r.topic || (isTestMode ? `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}` : null);
    if (!uKey) return;

    if (r.attendance !== 'absent') {
      const sid = Number(r.student_id);
      if (!studentScoreMap.has(sid)) {
        studentScoreMap.set(sid, {
          name: r.full_name,
          nickname: r.nickname || '',
          className: r.class_name || '',
          unitMap: new Map(),
        });
      }

      const gTopic = r.check_2_topic || r.grammar_topic || `${uKey}: Ngữ pháp`;
      const vTopic = r.check_1_topic || `${uKey}: Từ vựng`;
      const stData = studentScoreMap.get(sid)!;

      if (r.check_1 !== null && r.check_1 !== undefined) {
        const vk = `${uKey}-vocab`;
        if (!stData.unitMap.has(vk)) {
          stData.unitMap.set(vk, { unit_key: uKey, skill: 'vocab', topic_name: vTopic, scores: [] });
        }
        stData.unitMap.get(vk)!.scores.push(Number(r.check_1));
      }

      if (r.check_2 !== null && r.check_2 !== undefined) {
        const gk = `${uKey}-grammar`;
        if (!stData.unitMap.has(gk)) {
          stData.unitMap.set(gk, { unit_key: uKey, skill: 'grammar', topic_name: gTopic, scores: [] });
        }
        stData.unitMap.get(gk)!.scores.push(Number(r.check_2));
      }
    }
  });

  const rows: StudentRemedialSummaryRow[] = [];
  studentScoreMap.forEach((stData, sid) => {
    const weakUnits: StudentWeakUnitItem[] = [];

    stData.unitMap.forEach((uData) => {
      if (uData.scores.length > 0) {
        const avg = trunc1Dec(uData.scores.reduce((a, b) => a + b, 0) / uData.scores.length);
        if (avg < 6.5) {
          weakUnits.push({
            unit_key: uData.unit_key,
            skill: uData.skill,
            topic_name: uData.topic_name,
            avg_score: avg,
            test_count: uData.scores.length,
          });
        }
      }
    });

    if (weakUnits.length > 0) {
      weakUnits.sort((a, b) => a.avg_score - b.avg_score);
      const urgentCount = weakUnits.filter(u => u.avg_score < 5.0).length;
      const grammarCount = weakUnits.filter(u => u.skill === 'grammar').length;
      const vocabCount = weakUnits.filter(u => u.skill === 'vocab').length;
      const lowestScore = weakUnits[0]?.avg_score ?? 0;

      rows.push({
        id: String(sid),
        student_id: sid,
        student_name: stData.name,
        nickname: stData.nickname,
        class_name: stData.className,
        weak_units: weakUnits,
        total_weak_count: weakUnits.length,
        grammar_count: grammarCount,
        vocab_count: vocabCount,
        urgent_count: urgentCount,
        lowest_score: lowestScore,
        status: urgentCount > 0 ? 'Cần Phụ Đạo Gấp' : 'Cần Củng Cố',
      });
    }
  });

  return rows.sort((a, b) => (b.urgent_count - a.urgent_count) || (b.total_weak_count - a.total_weak_count));
}
