import { trunc1Dec } from '../../../utils';

export interface MockReportsDataset {
  session_records: any[];
  student_rankings: any[];
  analytics_summary: any;
  class_analytics_map: Record<string, any>;
}

export const MOCK_PROFILES = [
  { tier: 8, rankName: 'Quán Quân', title: 'Xuất Chúng', baseC1: 9.8, baseC2: 9.8, baseHw: 9.9, slope: 0.02, volatility: 0.15, absentSessions: [] as number[] },
  { tier: 7, rankName: 'Cao Thủ', title: 'Vượt Trội', baseC1: 9.4, baseC2: 9.5, baseHw: 9.6, slope: 0.02, volatility: 0.25, absentSessions: [] as number[] },
  { tier: 6, rankName: 'Tinh Anh', title: 'Ưu Tú', baseC1: 9.0, baseC2: 9.2, baseHw: 9.4, slope: 0.04, volatility: 0.3, absentSessions: [] as number[] },
  { tier: 5, rankName: 'Kim Cương', title: 'Xuất Sắc', baseC1: 8.5, baseC2: 8.7, baseHw: 9.0, slope: 0.03, volatility: 0.35, absentSessions: [] as number[] },
  { tier: 4, rankName: 'Bạch Kim', title: 'Giỏi', baseC1: 7.8, baseC2: 8.0, baseHw: 8.5, slope: 0.02, volatility: 0.4, absentSessions: [7] as number[] },
  { tier: 3, rankName: 'Vàng', title: 'Khá', baseC1: 6.8, baseC2: 7.0, baseHw: 7.6, slope: -0.01, volatility: 0.6, absentSessions: [12] as number[] },
  { tier: 2, rankName: 'Bạc', title: 'Trung Bình', baseC1: 5.8, baseC2: 6.0, baseHw: 6.5, slope: -0.04, volatility: 0.7, absentSessions: [15, 18] as number[] },
  { tier: 1, rankName: 'Đồng', title: 'Yếu', baseC1: 4.2, baseC2: 4.5, baseHw: 5.0, slope: -0.03, volatility: 0.8, absentSessions: [19, 20] as number[] },
];

export const GRAMMAR_TOPICS_LIST = [
  'Present Simple & Adverbs of Frequency',    // Unit 1: My New School
  'Possessive Case & Prepositions of Place',  // Unit 2: My House
  'Present Continuous',                       // Unit 3: My Friends
  'Comparative Adjectives',                   // Unit 4: My Neighbourhood
  'Countable/Uncountable Nouns & Must',       // Unit 5: Natural Wonders of Viet Nam
  'Should/Shouldn\'t & Some/Any',             // Unit 6: Our Tet Holiday
  'Conjunctions & Question Words',            // Unit 7: Television
  'Past Simple & Imperatives',                // Unit 8: Sports and Games
  'Possessive Pronouns',                      // Unit 9: Cities of the World
  'Future Simple (Will) & Might',             // Unit 10: Our Houses in the Future
  'Articles & First Conditional',             // Unit 11: Our Greener World
  'Superlative Adjectives & Could',           // Unit 12: Robots
];

export function computeDatasetFromRecords(
  allRecords: any[],
  classes: any[],
  students: any[]
): MockReportsDataset {
  const sampleClasses = classes && classes.length > 0 ? classes : [{ id: 1, class_name: 'Tiếng Anh 6A1', grade: '6' }];

  const studentRecordsMap = new Map<number, any[]>();
  allRecords.forEach((r) => {
    const sid = Number(r.student_id);
    if (!studentRecordsMap.has(sid)) studentRecordsMap.set(sid, []);
    studentRecordsMap.get(sid)!.push(r);
  });

  const rankings: any[] = [];
  studentRecordsMap.forEach((recs, sId) => {
    recs.sort((a, b) => (a.date > b.date ? 1 : -1));
    const first = recs[0];
    const sName = first.full_name || `Học sinh ${sId}`;
    const sNickname = first.nickname || '';
    const cId = first.class_id || sampleClasses[0].id;
    const cObj = sampleClasses.find(c => String(c.id) === String(cId)) || sampleClasses[0];

    const validC1s: number[] = [];
    const validC2s: number[] = [];
    const validHws: number[] = [];

    recs.forEach((r) => {
      if (r.attendance !== 'absent') {
        if (r.check_1 !== null && r.check_1 !== undefined && !isNaN(Number(r.check_1))) validC1s.push(Number(r.check_1));
        if (r.check_2 !== null && r.check_2 !== undefined && !isNaN(Number(r.check_2))) validC2s.push(Number(r.check_2));
        if (r.homework !== null && r.homework !== undefined && !isNaN(Number(r.homework))) validHws.push(Number(r.homework));
      }
    });

    const avgC1 = validC1s.length > 0 ? trunc1Dec(validC1s.reduce((a, b) => a + b, 0) / validC1s.length) : 0;
    const avgC2 = validC2s.length > 0 ? trunc1Dec(validC2s.reduce((a, b) => a + b, 0) / validC2s.length) : 0;
    const avgHw = validHws.length > 0 ? trunc1Dec(validHws.reduce((a, b) => a + b, 0) / validHws.length) : 0;
    const overallAvg = trunc1Dec(avgC1 * 0.35 + avgC2 * 0.55 + avgHw * 0.1);

    let ema = validC1s.length > 0 ? (validC1s[0] * 0.35 + (validC2s[0] || validC1s[0]) * 0.55 + (validHws[0] || 8.0) * 0.1) : overallAvg;
    const alpha = 0.3;
    for (let k = 1; k < validC1s.length; k++) {
      const sessScore = validC1s[k] * 0.35 + (validC2s[k] ?? validC1s[k]) * 0.55 + (validHws[k] ?? 8.0) * 0.1;
      ema = alpha * sessScore + (1 - alpha) * ema;
    }
    ema = trunc1Dec(ema);

    let trendLabel = 'Ổn định';
    if (ema >= 8.5) trendLabel = 'Tăng mạnh';
    else if (ema >= 7.0) trendLabel = 'Cải thiện';
    else if (ema < 5.5) trendLabel = 'Cần chú ý';

    rankings.push({
      student_id: sId,
      full_name: sName,
      nickname: sNickname,
      class_id: cId,
      class_name: cObj.class_name || 'Lớp học',
      grade: cObj.grade || '6',
      total_sessions: recs.length,
      present_count: recs.filter(r => r.attendance !== 'absent').length,
      avg_check_1: avgC1,
      avg_check_2: avgC2,
      avg_homework: avgHw,
      academic_score: overallAvg,
      ema_level: ema,
      trend_slope: 0.15,
      trend_label: trendLabel,
      performance_index: trunc1Dec(overallAvg * 10),
      consistency_score: 90.0,
      rating_label: ema >= 9.6 ? 'Xuất Chúng' : ema >= 9.2 ? 'Vượt Trội' : ema >= 8.7 ? 'Ưu Tú' : ema >= 8.0 ? 'Xuất Sắc' : ema >= 7.0 ? 'Giỏi' : ema >= 6.0 ? 'Khá' : ema >= 4.6 ? 'Trung Bình' : 'Yếu',
      predicted_next: trunc1Dec(Math.min(10.0, Math.max(1.0, ema + 0.1))),
      std_dev: 0.4,
    });
  });

  rankings.sort((a, b) => b.ema_level - a.ema_level);

  const summary = {
    academic_score: 84.5,
    trend_slope: 0.18,
    trend_label: 'Đang cải thiện',
    consistency_score: 90.2,
    std_dev: 0.45,
    std_dev_c1: 0.40,
    std_dev_c2: 0.50,
    std_dev_hw: 0.22,
    consistency_label: 'Rất ổn định',
    ema_level: 8.6,
    ema_c1: 8.5,
    ema_c2: 8.4,
    ema_hw: 9.2,
    predicted_next: 8.8,
    pred_c1: 8.7,
    pred_c2: 8.6,
    pred_hw: 9.4,
    attendance_pct: 96.2,
    performance_index: 86.5,
    rating_label: 'Xuất Sắc',
    recommendations: [
      'Chế độ Test 20 buổi: Điểm Từ Vựng và Ngữ Pháp được phân hóa riêng biệt.',
      'Học sinh nhóm Xuất Chúng & Vượt Trội có năng lực ngữ pháp và từ vựng rất đồng đều.',
      'Giáo viên có thể theo dõi cụ thể từng chủ đề ngữ pháp trong tab Phân Tích Kỹ Năng & Unit.',
    ],
  };

  const classMap: Record<string, any> = {};
  sampleClasses.forEach((c) => {
    classMap[String(c.id)] = {
      academic_score: 83.5,
      trend_slope: 0.15,
      trend_label: 'Ổn định',
      consistency_score: 88.0,
      std_dev: 0.48,
      ema_level: 8.5,
      ema_c1: 8.4,
      ema_c2: 8.3,
      ema_hw: 9.1,
      predicted_next: 8.7,
      pred_c1: 8.6,
      pred_c2: 8.5,
      pred_hw: 9.3,
      attendance_pct: 96.5,
      performance_index: 85.0,
      rating_label: 'Giỏi',
    };
  });

  return {
    session_records: allRecords,
    student_rankings: rankings,
    analytics_summary: summary,
    class_analytics_map: classMap,
  };
}

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

export function generateMockReportsData(
  classes: any[],
  students: any[]
): MockReportsDataset {
  try {
    const saved = localStorage.getItem('cm_custom_mock_records');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return computeDatasetFromRecords(parsed, classes, students);
    }
  } catch { }

  const sampleClasses = classes && classes.length > 0 ? classes : [
    { id: 1, class_name: 'Tiếng Anh 6A1', grade: '6' },
    { id: 2, class_name: 'Tiếng Anh 6A2', grade: '6' },
  ];

  let studentList = students && students.length > 0 ? [...students] : [];
  if (studentList.length === 0) {
    studentList = [
      { id: 101, full_name: 'Nguyễn Hoàng Long', nickname: 'Dragon', class_id: sampleClasses[0].id, class_name: sampleClasses[0].class_name },
      { id: 102, full_name: 'Trần Minh Tuấn', nickname: 'Ace', class_id: sampleClasses[0].id, class_name: sampleClasses[0].class_name },
      { id: 103, full_name: 'Lê Phương Anh', nickname: 'Alice', class_id: sampleClasses[0].id, class_name: sampleClasses[0].class_name },
      { id: 104, full_name: 'Phạm Đức Duy', nickname: 'David', class_id: sampleClasses[0].id, class_name: sampleClasses[0].class_name },
      { id: 105, full_name: 'Vũ Hải Yến', nickname: 'Jenny', class_id: (sampleClasses[1] || sampleClasses[0]).id, class_name: (sampleClasses[1] || sampleClasses[0]).class_name },
      { id: 106, full_name: 'Đặng Quang Huy', nickname: 'Harry', class_id: (sampleClasses[1] || sampleClasses[0]).id, class_name: (sampleClasses[1] || sampleClasses[0]).class_name },
      { id: 107, full_name: 'Bùi Bảo Ngọc', nickname: 'Ruby', class_id: (sampleClasses[1] || sampleClasses[0]).id, class_name: (sampleClasses[1] || sampleClasses[0]).class_name },
      { id: 108, full_name: 'Hoàng Quốc Việt', nickname: 'Victor', class_id: (sampleClasses[1] || sampleClasses[0]).id, class_name: (sampleClasses[1] || sampleClasses[0]).class_name },
    ];
  }

  const baseDate = new Date('2026-03-02');
  const sessionDates: string[] = [];
  for (let i = 0; i < 20; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i * 7);
    sessionDates.push(d.toISOString().slice(0, 10));
  }

  const allRecords: any[] = [];

  studentList.forEach((s, sIdx) => {
    const profile = MOCK_PROFILES[sIdx % MOCK_PROFILES.length];
    const sId = s.id || sIdx + 1;
    const cId = s.class_id || sampleClasses[0].id;
    const cObj = sampleClasses.find(c => String(c.id) === String(cId)) || sampleClasses[0];
    const sName = s.full_name || `Học sinh ${sId}`;
    const sNickname = s.nickname || '';

    for (let sessionIdx = 1; sessionIdx <= 20; sessionIdx++) {
      const isAbsent = profile.absentSessions.includes(sessionIdx);
      const sessionDate = sessionDates[sessionIdx - 1];
      const unitNum = Math.min(12, Math.floor((sessionIdx - 1) / 2) + 1);
      const grammarTopic = GRAMMAR_TOPICS_LIST[(unitNum - 1) % GRAMMAR_TOPICS_LIST.length];

      if (isAbsent) {
        allRecords.push({
          session_id: 1000 + sessionIdx,
          session_name: `Buổi ${sessionIdx}`,
          date: sessionDate,
          student_id: sId,
          full_name: sName,
          nickname: sNickname,
          class_id: cId,
          class_name: cObj.class_name || 'Lớp học',
          grade: cObj.grade || '6',
          attendance: 'absent',
          check_1: null,
          check_1_skill: 'vocab',
          check_1_topic: `Unit ${unitNum}: Từ vựng`,
          check_2: null,
          check_2_skill: 'grammar',
          check_2_topic: grammarTopic,
          homework: null,
          homework_topic: `BTVN Unit ${unitNum}`,
          topic: `Unit ${unitNum}`,
          grammar_topic: grammarTopic,
          notes: 'Vắng có phép',
        });
        continue;
      }

      const seed = Math.sin(sId * 99 + sessionIdx * 13) * 10000;
      const noise = (seed - Math.floor(seed) - 0.5) * profile.volatility;
      const progressDelta = (sessionIdx - 10) * profile.slope;

      const c1 = trunc1Dec(Math.min(10.0, Math.max(1.0, profile.baseC1 + progressDelta + noise)));
      const c2 = trunc1Dec(Math.min(10.0, Math.max(1.0, profile.baseC2 + progressDelta + noise * 0.8)));
      const hw = trunc1Dec(Math.min(10.0, Math.max(2.0, profile.baseHw + progressDelta * 0.5 + noise * 0.4)));

      allRecords.push({
        session_id: 1000 + sessionIdx,
        session_name: `Buổi ${sessionIdx}`,
        date: sessionDate,
        student_id: sId,
        full_name: sName,
        nickname: sNickname,
        class_id: cId,
        class_name: cObj.class_name || 'Lớp học',
        grade: cObj.grade || '6',
        attendance: 'present',
        check_1: c1,
        check_1_skill: 'vocab',
        check_1_topic: `Unit ${unitNum}: Từ vựng`,
        check_2: c2,
        check_2_skill: 'grammar',
        check_2_topic: grammarTopic,
        homework: hw,
        homework_topic: `BTVN Unit ${unitNum}`,
        topic: `Unit ${unitNum}`,
        grammar_topic: grammarTopic,
        notes: '',
      });
    }
  });

  return computeDatasetFromRecords(allRecords, sampleClasses, studentList);
}
