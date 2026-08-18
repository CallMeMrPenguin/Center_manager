import { trunc1Dec } from '../../../utils';

export interface MockReportsDataset {
  session_records: any[];
  student_rankings: any[];
  analytics_summary: any;
  class_analytics_map: Record<string, any>;
}

// 8 Profiles matching 8 Tiers: Đồng -> Quán Quân
export const MOCK_PROFILES = [
  { tier: 8, rankName: 'Quán Quân', title: 'Huyền Thoại', baseC1: 9.8, baseC2: 9.8, baseHw: 9.9, slope: 0.02, volatility: 0.15, absentSessions: [] as number[] },
  { tier: 7, rankName: 'Cao Thủ', title: 'Siêu Việt', baseC1: 9.4, baseC2: 9.5, baseHw: 9.6, slope: 0.02, volatility: 0.25, absentSessions: [] as number[] },
  { tier: 6, rankName: 'Tinh Anh', title: 'Tinh Hoa', baseC1: 9.0, baseC2: 9.2, baseHw: 9.4, slope: 0.04, volatility: 0.3, absentSessions: [] as number[] },
  { tier: 5, rankName: 'Kim Cương', title: 'Xuất Sắc', baseC1: 8.5, baseC2: 8.7, baseHw: 9.0, slope: 0.03, volatility: 0.35, absentSessions: [] as number[] },
  { tier: 4, rankName: 'Bạch Kim', title: 'Giỏi', baseC1: 7.8, baseC2: 8.0, baseHw: 8.5, slope: 0.02, volatility: 0.4, absentSessions: [7] as number[] },
  { tier: 3, rankName: 'Vàng', title: 'Khá', baseC1: 6.8, baseC2: 7.0, baseHw: 7.6, slope: -0.01, volatility: 0.6, absentSessions: [12] as number[] },
  { tier: 2, rankName: 'Bạc', title: 'Cơ Bản', baseC1: 5.8, baseC2: 6.0, baseHw: 6.5, slope: -0.04, volatility: 0.7, absentSessions: [15, 18] as number[] },
  { tier: 1, rankName: 'Đồng', title: 'Tập Sự', baseC1: 4.2, baseC2: 4.5, baseHw: 5.0, slope: -0.03, volatility: 0.8, absentSessions: [19, 20] as number[] },
];

const GRAMMAR_TOPICS_LIST = [
  'Present Simple',
  'Present Continuous',
  'Past Simple',
  'Past Continuous',
  'Present Perfect',
  'Comparative Adjectives',
  'Superlative Adjectives',
  'Modal Verbs (Can, Must, Should)',
  'First Conditional',
  'Second Conditional',
  'Passive Voice',
  'Relative Clauses',
];

export function computeDatasetFromRecords(
  allRecords: any[],
  classes: any[],
  students: any[]
): MockReportsDataset {
  const sampleClasses = classes && classes.length > 0
    ? classes
    : [{ id: 1, class_name: 'Tiếng Anh 6A1', grade: '6' }];

  // Group by student_id
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
        if (r.check_1 !== null && r.check_1 !== undefined && !isNaN(Number(r.check_1))) {
          validC1s.push(Number(r.check_1));
        }
        if (r.check_2 !== null && r.check_2 !== undefined && !isNaN(Number(r.check_2))) {
          validC2s.push(Number(r.check_2));
        }
        if (r.homework !== null && r.homework !== undefined && !isNaN(Number(r.homework))) {
          validHws.push(Number(r.homework));
        }
      }
    });

    const avgC1 = validC1s.length > 0 ? trunc1Dec(validC1s.reduce((a, b) => a + b, 0) / validC1s.length) : 0;
    const avgC2 = validC2s.length > 0 ? trunc1Dec(validC2s.reduce((a, b) => a + b, 0) / validC2s.length) : 0;
    const avgHw = validHws.length > 0 ? trunc1Dec(validHws.reduce((a, b) => a + b, 0) / validHws.length) : 0;
    const overallAvg = trunc1Dec(avgC1 * 0.35 + avgC2 * 0.55 + avgHw * 0.1);

    // EMA calculation
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
      rating_label: ema >= 9.7 ? 'Huyền Thoại' : ema >= 9.4 ? 'Siêu Việt' : ema >= 9.0 ? 'Tinh Hoa' : ema >= 8.5 ? 'Xuất Sắc' : ema >= 7.5 ? 'Giỏi' : ema >= 6.5 ? 'Khá' : ema >= 5.0 ? 'Cơ Bản' : 'Tập Sự',
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
      'Chế độ Test 20 buổi đang hoạt động với đầy đủ 8 cấp bậc xếp hạng (Đồng -> Quán Quân).',
      'Học sinh nhóm Quán Quân & Cao Thủ đạt phong độ xuất sắc và điểm Check 1, Check 2 vượt trội.',
      'Giáo viên có thể chỉnh sửa trực tiếp 20 buổi điểm Check 1, Check 2, BTVN và loại bài kiểm tra.',
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
  // Check if custom user-edited records exist in localStorage
  try {
    const saved = localStorage.getItem('cm_custom_mock_records');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return computeDatasetFromRecords(parsed, classes, students);
      }
    }
  } catch { }

  const sampleClasses = classes && classes.length > 0
    ? classes
    : [
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
