import { trunc1Dec } from '../../../utils';

export function computeMockSkillBreakdown(
  records: any[],
  selectedClassId?: string,
  selectedStudentId?: string
) {
  let list = records || [];
  if (selectedClassId) list = list.filter(r => String(r.class_id) === selectedClassId);
  if (selectedStudentId) list = list.filter(r => String(r.student_id) === selectedStudentId);

  const vocabScores: number[] = [];
  const grammarScores: number[] = [];
  const mixedScores: number[] = [];

  list.forEach(r => {
    if (r.attendance !== 'absent') {
      if (r.check_1 !== null && r.check_1 !== undefined && !isNaN(Number(r.check_1))) vocabScores.push(Number(r.check_1));
      if (r.check_2 !== null && r.check_2 !== undefined && !isNaN(Number(r.check_2))) grammarScores.push(Number(r.check_2));
      if (r.homework !== null && r.homework !== undefined && !isNaN(Number(r.homework))) mixedScores.push(Number(r.homework));
    }
  });

  const vocabAvg = vocabScores.length > 0 ? trunc1Dec(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length) : 0;
  const grammarAvg = grammarScores.length > 0 ? trunc1Dec(grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length) : 0;
  const mixedAvg = mixedScores.length > 0 ? trunc1Dec(mixedScores.reduce((a, b) => a + b, 0) / mixedScores.length) : 0;

  const unitBreakdownMap = new Map<string, { skill: string; unit_key: string; scores: number[] }>();

  list.forEach(r => {
    if (r.attendance !== 'absent') {
      const uKey = r.topic || `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}`;
      const gTopic = r.check_2_topic || r.grammar_topic || 'Ngữ pháp';
      
      const vKey = `${uKey}-vocab`;
      if (!unitBreakdownMap.has(vKey)) unitBreakdownMap.set(vKey, { skill: 'vocab', unit_key: `${uKey} (Từ vựng)`, scores: [] });
      if (r.check_1 !== null && r.check_1 !== undefined) unitBreakdownMap.get(vKey)!.scores.push(Number(r.check_1));

      const gKey = `${uKey}-grammar`;
      if (!unitBreakdownMap.has(gKey)) unitBreakdownMap.set(gKey, { skill: 'grammar', unit_key: `${uKey} (${gTopic})`, scores: [] });
      if (r.check_2 !== null && r.check_2 !== undefined) unitBreakdownMap.get(gKey)!.scores.push(Number(r.check_2));
    }
  });

  let masteredCount = 0;
  let partialCount = 0;
  let notYetCount = 0;
  const unitBreakdown: any[] = [];
  const heatmapUnitsList: { unit_key: string; skill: 'vocab' | 'grammar'; avg_score: number }[] = [];

  unitBreakdownMap.forEach((val) => {
    const sc = val.scores;
    const avg = sc.length > 0 ? trunc1Dec(sc.reduce((a, b) => a + b, 0) / sc.length) : 0;
    const mCnt = sc.filter(s => s >= 8.5).length;
    const pCnt = sc.filter(s => s >= 6.5 && s < 8.5).length;
    const wCnt = sc.filter(s => s < 6.5).length;
    const total = sc.length || 1;
    const mPct = trunc1Dec((mCnt / total) * 100);

    masteredCount += mCnt;
    partialCount += pCnt;
    notYetCount += wCnt;

    let rec = "Nắm vững tốt, sẵn sàng phát triển bài tập nâng cao.";
    if (mPct < 50) rec = "Cần tăng cường bài tập củng cố và kiểm tra lại.";
    else if (mPct < 75) rec = "Nắm khá ổn định, cần bổ sung thêm bài luyện tập.";

    unitBreakdown.push({
      skill: val.skill,
      unit_key: val.unit_key,
      avg_score: avg,
      student_count: total,
      mastered_count: mCnt,
      partial_count: pCnt,
      regressed_count: 0,
      weak_count: wCnt,
      mastery_pct: mPct,
      recommendation: rec,
    });

    heatmapUnitsList.push({
      unit_key: val.unit_key,
      skill: val.skill as 'vocab' | 'grammar',
      avg_score: avg,
    });
  });

  const totalInstances = masteredCount + partialCount + notYetCount;
  const masteryRate = totalInstances > 0 ? trunc1Dec((masteredCount / totalInstances) * 100) : 0;

  const studentMap = new Map<number, { id: number; name: string; nickname: string; className: string; units: Record<string, any> }>();
  list.forEach(r => {
    const sid = Number(r.student_id);
    if (!studentMap.has(sid)) {
      studentMap.set(sid, {
        id: sid,
        name: r.full_name,
        nickname: r.nickname || '',
        className: r.class_name || '',
        units: {},
      });
    }
    const uKey = r.topic || `Unit ${Math.min(12, Math.floor(((r.session_id || 1001) - 1001) / 2) + 1)}`;
    const gTopic = r.check_2_topic || r.grammar_topic || 'Ngữ pháp';
    const stObj = studentMap.get(sid)!;

    if (r.check_1 !== null && r.check_1 !== undefined) {
      const c1 = Number(r.check_1);
      const vUnitKey = `${uKey} (Từ vựng)`;
      stObj.units[vUnitKey] = {
        skill: 'vocab',
        ema_score: trunc1Dec(c1),
        last_score: trunc1Dec(c1),
        test_count: 1,
        mastery_status: c1 >= 8.5 ? 'mastered' : c1 >= 6.5 ? 'partial' : 'not_yet',
        last_tested: r.date,
      };
    }

    if (r.check_2 !== null && r.check_2 !== undefined) {
      const c2 = Number(r.check_2);
      const gUnitKey = `${uKey} (${gTopic})`;
      stObj.units[gUnitKey] = {
        skill: 'grammar',
        ema_score: trunc1Dec(c2),
        last_score: trunc1Dec(c2),
        test_count: 1,
        mastery_status: c2 >= 8.5 ? 'mastered' : c2 >= 6.5 ? 'partial' : 'not_yet',
        last_tested: r.date,
      };
    }
  });

  const heatmapStudents = Array.from(studentMap.values()).map(s => ({
    student_id: s.id,
    student_name: s.name,
    nickname: s.nickname,
    class_name: s.className,
    units: s.units,
  }));

  const prediction = {
    has_upcoming_config: true,
    session_date: 'Buổi 21 (Dự Báo)',
    check_1_info: {
      skill: 'vocab',
      topic: 'Unit 11: Our Greener World (Môi Trường & 3Rs)',
      units: ['Unit 11 (Từ vựng)'],
    },
    check_2_info: {
      skill: 'grammar',
      topic: 'Unit 11: Articles & First Conditional (Câu điều kiện loại 1)',
      units: ['Unit 11 (Ngữ pháp)'],
    },
    at_risk_students: heatmapStudents.filter(s => {
      const vals = Object.values(s.units);
      const avg = vals.reduce((sum, u: any) => sum + (u.ema_score || 0), 0) / (vals.length || 1);
      return avg < 7.0;
    }).map(s => {
      const vals = Object.values(s.units);
      const vVals = vals.filter((u: any) => u.skill === 'vocab');
      const gVals = vals.filter((u: any) => u.skill === 'grammar');
      const avgC1 = trunc1Dec(vVals.reduce((sum, u: any) => sum + (u.ema_score || 0), 0) / (vVals.length || 1));
      const avgC2 = trunc1Dec(gVals.reduce((sum, u: any) => sum + (u.ema_score || 0), 0) / (gVals.length || 1));
      return {
        student_id: s.student_id,
        student_name: s.student_name,
        nickname: s.nickname,
        pred_c1: avgC1,
        pred_c2: avgC2,
        reason: avgC2 < 6.5 ? 'Nguy cơ điểm Ngữ Pháp thấp ở bài tới do các thì trước đó chưa nắm vững' : 'Cần trau dồi thêm vốn từ vựng học thuật',
      };
    }),
    summary: 'Dự báo kiểm tra tiếp theo: Điểm Từ Vựng & Ngữ Pháp theo dữ liệu tích lũy.',
  };

  return {
    skill_stats: {
      vocab_avg: vocabAvg,
      grammar_avg: grammarAvg,
      mixed_avg: mixedAvg,
      mastered_count: masteredCount,
      partial_count: partialCount,
      regressed_count: 0,
      not_yet_count: notYetCount,
      total_instances: totalInstances,
      mastery_rate: masteryRate,
    },
    unit_breakdown: unitBreakdown,
    mastery_heatmap: {
      units: heatmapUnitsList,
      students: heatmapStudents,
    },
    skill_aware_prediction: prediction,
  };
}
