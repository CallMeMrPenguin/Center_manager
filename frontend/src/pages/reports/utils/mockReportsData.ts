import { trunc1Dec } from '../../../utils';
import { MOCK_PROFILES, GRAMMAR_TOPICS_LIST, MockReportsDataset } from './mockProfiles';
export * from './mockProfiles';
export * from './mockSkillBreakdown';

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

    const validVocabs: number[] = [];
    const validGrammars: number[] = [];
    const validHws: number[] = [];

    recs.forEach((r) => {
      if (r.attendance !== 'absent') {
        const c1 = r.check_1 !== null && r.check_1 !== undefined && !isNaN(Number(r.check_1)) ? Number(r.check_1) : null;
        const c2 = r.check_2 !== null && r.check_2 !== undefined && !isNaN(Number(r.check_2)) ? Number(r.check_2) : null;
        const hw = r.homework !== null && r.homework !== undefined && !isNaN(Number(r.homework)) ? Number(r.homework) : null;
        const c1Skill = String(r.check_1_skill || 'vocab').toLowerCase().trim();
        const c2Skill = String(r.check_2_skill || 'grammar').toLowerCase().trim();

        if (c1 !== null && c1 > 0) {
          if (c1Skill === 'grammar' || c1Skill === 'ngữ pháp') validGrammars.push(c1);
          else validVocabs.push(c1);
        }
        if (c2 !== null && c2 > 0) {
          if (c2Skill === 'vocab' || c2Skill === 'từ vựng') validVocabs.push(c2);
          else validGrammars.push(c2);
        }
        if (hw !== null && hw > 0) validHws.push(hw);
      }
    });

    const avgVocab = validVocabs.length > 0 ? trunc1Dec(validVocabs.reduce((a, b) => a + b, 0) / validVocabs.length) : 0;
    const avgGrammar = validGrammars.length > 0 ? trunc1Dec(validGrammars.reduce((a, b) => a + b, 0) / validGrammars.length) : 0;
    const avgHw = validHws.length > 0 ? trunc1Dec(validHws.reduce((a, b) => a + b, 0) / validHws.length) : 0;
    const overallAvg = trunc1Dec(avgVocab * 0.55 + avgGrammar * 0.35 + avgHw * 0.1);

    let ema = validVocabs.length > 0 ? (validVocabs[0] * 0.55 + (validGrammars[0] || validVocabs[0]) * 0.35 + (validHws[0] || 8.0) * 0.1) : overallAvg;
    const alpha = 0.3;
    for (let k = 1; k < validVocabs.length; k++) {
      const sessScore = validVocabs[k] * 0.55 + (validGrammars[k] ?? validVocabs[k]) * 0.35 + (validHws[k] ?? 8.0) * 0.1;
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
      avg_vocab: avgVocab,
      avg_grammar: avgGrammar,
      avg_check_1: avgVocab,
      avg_check_2: avgGrammar,
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
          student_name: sName,
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
          homework_topic: '',
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
        student_name: sName,
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
        homework_topic: '',
        topic: `Unit ${unitNum}`,
        grammar_topic: grammarTopic,
        notes: '',
      });
    }
  });

  return computeDatasetFromRecords(allRecords, sampleClasses, studentList);
}
