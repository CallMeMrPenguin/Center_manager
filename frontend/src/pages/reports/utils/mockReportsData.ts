import { trunc1Dec } from '../../../utils';

export interface MockReportsDataset {
  session_records: any[];
  student_rankings: any[];
  analytics_summary: any;
  class_analytics_map: Record<string, any>;
}

// 7 Profiles matching 7 Tiers: Đồng -> Quán Quân
const PROFILES = [
  { tier: 7, rankName: 'Quán Quân', title: 'Huyền Thoại', baseC1: 9.6, baseC2: 9.7, baseHw: 9.8, slope: 0.02, volatility: 0.2, absentSessions: [] as number[] },
  { tier: 6, rankName: 'Cao Thủ', title: 'Siêu Việt', baseC1: 9.1, baseC2: 9.2, baseHw: 9.4, slope: 0.01, volatility: 0.3, absentSessions: [] as number[] },
  { tier: 5, rankName: 'Tinh Anh', title: 'Xuất Sắc', baseC1: 8.4, baseC2: 8.6, baseHw: 9.0, slope: 0.05, volatility: 0.4, absentSessions: [] as number[] },
  { tier: 4, rankName: 'Bạch Kim', title: 'Giỏi', baseC1: 7.8, baseC2: 8.0, baseHw: 8.5, slope: 0.02, volatility: 0.4, absentSessions: [7] as number[] },
  { tier: 3, rankName: 'Vàng', title: 'Khá', baseC1: 6.8, baseC2: 7.0, baseHw: 7.6, slope: -0.01, volatility: 0.6, absentSessions: [12] as number[] },
  { tier: 2, rankName: 'Bạc', title: 'Cơ Bản', baseC1: 5.8, baseC2: 6.0, baseHw: 6.5, slope: -0.04, volatility: 0.7, absentSessions: [15, 18] as number[] },
  { tier: 1, rankName: 'Đồng', title: 'Tập Sự', baseC1: 4.2, baseC2: 4.5, baseHw: 5.0, slope: -0.03, volatility: 0.8, absentSessions: [19, 20] as number[] },
];

export function generateMockReportsData(
  classes: any[],
  students: any[]
): MockReportsDataset {
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
    ];
  }

  // Generate 20 dates (one per week)
  const baseDate = new Date('2026-03-02');
  const sessionDates: string[] = [];
  for (let i = 0; i < 20; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i * 7);
    sessionDates.push(d.toISOString().slice(0, 10));
  }

  const allRecords: any[] = [];
  const rankings: any[] = [];

  studentList.forEach((s, sIdx) => {
    const profile = PROFILES[sIdx % PROFILES.length];
    const sId = s.id || sIdx + 1;
    const cId = s.class_id || sampleClasses[0].id;
    const cObj = sampleClasses.find(c => String(c.id) === String(cId)) || sampleClasses[0];
    const sName = s.full_name || `Học sinh ${sId}`;
    const sNickname = s.nickname || '';

    const validC1s: number[] = [];
    const validC2s: number[] = [];
    const validHws: number[] = [];
    const studentRecords: any[] = [];

    for (let sessionIdx = 1; sessionIdx <= 20; sessionIdx++) {
      const isAbsent = profile.absentSessions.includes(sessionIdx);
      const sessionDate = sessionDates[sessionIdx - 1];
      const unitNum = Math.min(12, Math.floor((sessionIdx - 1) / 2) + 1);

      if (isAbsent) {
        const rec = {
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
          check_2: null,
          homework: null,
          topic: `Unit ${unitNum}`,
          grammar_topic: `Unit ${unitNum} Grammar`,
          notes: 'Vắng có phép',
        };
        studentRecords.push(rec);
        allRecords.push(rec);
        continue;
      }

      const seed = Math.sin(sId * 99 + sessionIdx * 13) * 10000;
      const noise = (seed - Math.floor(seed) - 0.5) * profile.volatility;
      const progressDelta = (sessionIdx - 10) * profile.slope;

      const c1 = trunc1Dec(Math.min(10.0, Math.max(1.0, profile.baseC1 + progressDelta + noise)));
      const c2 = trunc1Dec(Math.min(10.0, Math.max(1.0, profile.baseC2 + progressDelta + noise * 0.8)));
      const hw = trunc1Dec(Math.min(10.0, Math.max(2.0, profile.baseHw + progressDelta * 0.5 + noise * 0.4)));

      validC1s.push(c1);
      validC2s.push(c2);
      validHws.push(hw);

      const rec = {
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
        check_2: c2,
        homework: hw,
        topic: `Unit ${unitNum}`,
        grammar_topic: `Unit ${unitNum} Grammar`,
        notes: '',
      };
      studentRecords.push(rec);
      allRecords.push(rec);
    }

    const avgC1 = validC1s.length > 0 ? trunc1Dec(validC1s.reduce((a, b) => a + b, 0) / validC1s.length) : 0;
    const avgC2 = validC2s.length > 0 ? trunc1Dec(validC2s.reduce((a, b) => a + b, 0) / validC2s.length) : 0;
    const avgHw = validHws.length > 0 ? trunc1Dec(validHws.reduce((a, b) => a + b, 0) / validHws.length) : 0;
    const overallAvg = trunc1Dec(avgC1 * 0.35 + avgC2 * 0.55 + avgHw * 0.1);

    let ema = validC1s.length > 0 ? (validC1s[0] * 0.35 + validC2s[0] * 0.55 + validHws[0] * 0.1) : overallAvg;
    const alpha = 0.3;
    for (let k = 1; k < validC1s.length; k++) {
      const sessScore = validC1s[k] * 0.35 + validC2s[k] * 0.55 + validHws[k] * 0.1;
      ema = alpha * sessScore + (1 - alpha) * ema;
    }
    ema = trunc1Dec(ema);

    let trendLabel = 'Ổn định';
    if (profile.slope > 0.03) trendLabel = 'Tăng mạnh';
    else if (profile.slope > 0) trendLabel = 'Cải thiện';
    else if (profile.slope < -0.02) trendLabel = 'Cần chú ý';

    rankings.push({
      student_id: sId,
      full_name: sName,
      nickname: sNickname,
      class_id: cId,
      class_name: cObj.class_name || 'Lớp học',
      grade: cObj.grade || '6',
      total_sessions: 20,
      present_count: validC1s.length,
      avg_check_1: avgC1,
      avg_check_2: avgC2,
      avg_homework: avgHw,
      academic_score: overallAvg,
      ema_level: ema,
      trend_slope: trunc1Dec(profile.slope * 10),
      trend_label: trendLabel,
      performance_index: trunc1Dec(overallAvg * 10),
      consistency_score: trunc1Dec(Math.max(60, 100 - profile.volatility * 40)),
      rating_label: profile.title,
      predicted_next: trunc1Dec(Math.min(10.0, Math.max(1.0, ema + profile.slope * 2))),
      std_dev: trunc1Dec(profile.volatility),
    });
  });

  rankings.sort((a, b) => b.ema_level - a.ema_level);

  const summary = {
    academic_score: 83.2,
    trend_slope: 0.18,
    trend_label: 'Đang cải thiện',
    consistency_score: 88.5,
    std_dev: 0.48,
    std_dev_c1: 0.42,
    std_dev_c2: 0.55,
    std_dev_hw: 0.25,
    consistency_label: 'Rất ổn định',
    ema_level: 8.5,
    ema_c1: 8.4,
    ema_c2: 8.3,
    ema_hw: 9.1,
    predicted_next: 8.7,
    pred_c1: 8.6,
    pred_c2: 8.5,
    pred_hw: 9.3,
    attendance_pct: 95.7,
    performance_index: 85.0,
    rating_label: 'Xuất Sắc',
    recommendations: [
      'Chế độ Test 20 buổi đang hoạt động với đầy đủ 7 cấp bậc xếp hạng (Đồng -> Quán Quân).',
      'Học sinh nhóm Quán Quân & Cao Thủ đạt phong độ xuất sắc và điểm Check 1, Check 2 vượt trội.',
      'Học sinh nhóm Đồng & Bạc cần được hỗ trợ thêm về bài tập về nhà và cải thiện chuyên cần.',
    ],
  };

  const classMap: Record<string, any> = {};
  sampleClasses.forEach((c) => {
    classMap[String(c.id)] = {
      academic_score: 82.0,
      trend_slope: 0.15,
      trend_label: 'Ổn định',
      consistency_score: 87.0,
      std_dev: 0.5,
      ema_level: 8.4,
      ema_c1: 8.3,
      ema_c2: 8.2,
      ema_hw: 9.0,
      predicted_next: 8.6,
      pred_c1: 8.5,
      pred_c2: 8.4,
      pred_hw: 9.2,
      attendance_pct: 96.0,
      performance_index: 83.5,
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
