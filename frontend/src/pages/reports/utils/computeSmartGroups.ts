import { trunc1Dec } from '../../../utils';

export function computeSmartGroups({
  studentRankings,
  selectedClassId,
  groupingScope,
  groupingGradeFilter,
  classes,
  groupingMode,
  kmeansK,
}: {
  studentRankings: any[];
  selectedClassId: string;
  groupingScope: 'current' | 'grade' | 'all';
  groupingGradeFilter: string;
  classes: any[];
  groupingMode: 'tier' | 'kmeans';
  kmeansK: number;
}) {
  let pool = studentRankings || [];
  if (pool.length === 0) return [];

  if (groupingScope === 'current' && selectedClassId) {
    pool = pool.filter(s => String(s.class_id) === selectedClassId);
  } else if (groupingScope === 'grade') {
    const currentClass = classes.find(c => String(c.id) === selectedClassId);
    const targetGrade = groupingGradeFilter || currentClass?.grade || (classes[0]?.grade ?? 'Lớp 8');
    pool = pool.filter(s => {
      const sClass = classes.find(c => String(c.id) === String(s.class_id));
      return s.grade === targetGrade || (sClass && sClass.grade === targetGrade);
    });
  }

  if (pool.length === 0) return [];

  const getStudentScore = (s: any) => {
    if (s.ema_level && Number(s.ema_level) > 0) return Number(s.ema_level);
    const c1 = Number(s.avg_check_1 || 0);
    const c2 = Number(s.avg_check_2 || 0);
    const hw = Number(s.avg_homework || 0);
    const valid = [c1, c2, hw].filter(v => v > 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0.0;
  };

  const calcGroupStats = (studentsList: any[]) => {
    if (studentsList.length === 0) return { avgEma: 0, groupSd: 0, minScore: 0, maxScore: 0 };
    const scores = studentsList.map(getStudentScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, sc) => sum + Math.pow(sc - avg, 2), 0) / scores.length;
    const sd = Math.sqrt(variance);
    return {
      avgEma: trunc1Dec(avg),
      groupSd: trunc1Dec(sd),
      minScore: trunc1Dec(Math.min(...scores)),
      maxScore: trunc1Dec(Math.max(...scores)),
    };
  };

  if (groupingMode === 'tier') {
    const g1Students: any[] = [];
    const g2Students: any[] = [];
    const g3Students: any[] = [];

    pool.forEach(s => {
      const ema = getStudentScore(s);
      const slope = Number(s.trend_slope || 0);
      if (ema >= 8.0 || (ema >= 7.5 && slope >= 0.2)) g1Students.push(s);
      else if (ema >= 6.5 && slope >= -0.25) g2Students.push(s);
      else g3Students.push(s);
    });

    g1Students.sort((a, b) => getStudentScore(b) - getStudentScore(a));
    g2Students.sort((a, b) => getStudentScore(b) - getStudentScore(a));
    g3Students.sort((a, b) => getStudentScore(b) - getStudentScore(a));

    return [
      {
        id: 'tier-advanced',
        title: 'Nhóm 1: Bứt Phá & Nâng Cao',
        subtitle: 'Năng Lực Vượt Trội (Mastery)',
        pedagogyAdvice: 'Tập trung luyện đề phân hóa, chuyên đề khó và giao bài tập tư duy mức độ 4. Khuyến khích làm bài tập mở rộng.',
        borderCls: 'border-emerald-500/40',
        headerBg: 'bg-[#102419]',
        badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        ...calcGroupStats(g1Students),
        students: g1Students,
      },
      {
        id: 'tier-standard',
        title: 'Nhóm 2: Củng Cố & Chuẩn Hóa',
        subtitle: 'Đạt Chuẩn Tiến Độ (Standard)',
        pedagogyAdvice: 'Tăng cường tốc độ làm bài & kỹ năng trình bày. Hướng dẫn sửa các lỗi sai cơ bản thường gặp ở câu thông hiểu.',
        borderCls: 'border-blue-500/40',
        headerBg: 'bg-[#101b2e]',
        badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        ...calcGroupStats(g2Students),
        students: g2Students,
      },
      {
        id: 'tier-support',
        title: 'Nhóm 3: Phụ Đạo & Nền Tảng',
        subtitle: 'Cần Hỗ Trợ Trọng Tâm (Support)',
        pedagogyAdvice: 'Hổng kiến thức nền hoặc phong độ giảm sút. Cần giảng lại lý thuyết căn bản, chia nhỏ bài tập & phụ đạo 1-1.',
        borderCls: 'border-amber-500/40',
        headerBg: 'bg-[#201810]',
        badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ...calcGroupStats(g3Students),
        students: g3Students,
      },
    ];
  } else {
    const K = Math.min(kmeansK, pool.length);
    if (K <= 0) return [];
    const studentsWithScore = pool.map(s => ({ student: s, score: getStudentScore(s) }));
    const allScores = studentsWithScore.map(s => s.score);
    const minS = Math.min(...allScores);
    const maxS = Math.max(...allScores);

    let centroids: number[] = [];
    if (minS === maxS) {
      centroids = Array(K).fill(minS);
    } else {
      for (let i = 0; i < K; i++) centroids.push(minS + (i * (maxS - minS)) / (K - 1));
    }

    let clusters: any[][] = Array.from({ length: K }, () => []);
    for (let iter = 0; iter < 20; iter++) {
      clusters = Array.from({ length: K }, () => []);
      studentsWithScore.forEach(item => {
        let bestIdx = 0;
        let bestDist = Math.abs(item.score - centroids[0]);
        for (let c = 1; c < K; c++) {
          const dist = Math.abs(item.score - centroids[c]);
          if (dist < bestDist) { bestDist = dist; bestIdx = c; }
        }
        clusters[bestIdx].push(item.student);
      });

      let changed = false;
      for (let c = 0; c < K; c++) {
        if (clusters[c].length > 0) {
          const newMean = clusters[c].map(getStudentScore).reduce((a, b) => a + b, 0) / clusters[c].length;
          if (Math.abs(newMean - centroids[c]) > 0.001) { centroids[c] = newMean; changed = true; }
        }
      }
      if (!changed) break;
    }

    const pairedClusters = clusters.map((studs, idx) => ({
      centroid: centroids[idx],
      students: studs.sort((a, b) => getStudentScore(b) - getStudentScore(a)),
    })).sort((a, b) => b.centroid - a.centroid);

    const metaConfig = [
      { title: 'Nhóm 1: Dẫn Đầu (Top Tier)', subtitle: 'Cụm Điểm Cao Nhất', pedagogy: 'Nhóm học sinh tiếp thu vượt trội trong lớp. Giao bài tập mở rộng & thử thách tư duy.', borderCls: 'border-purple-500/40', headerBg: 'bg-[#18142a]', badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
      { title: 'Nhóm 2: Trung Tâm (Core Tier)', subtitle: 'Cụm Điểm Trung Bình Khá', pedagogy: 'Lực lượng nòng cốt của lớp. Rèn luyện phương pháp làm bài & củng cố kiến thức để tiến vào nhóm dẫn đầu.', borderCls: 'border-blue-500/40', headerBg: 'bg-[#10182c]', badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
      { title: 'Nhóm 3: Cần Hỗ Trợ (Focus Tier)', subtitle: 'Cụm Cần Củng Cố Nền Tảng', pedagogy: 'Cụm học sinh cần sự quan tâm đặc biệt. Ôn tập kiến thức cơ bản, sửa lỗi sai thường gặp & kèm cặp sát sao.', borderCls: 'border-amber-500/40', headerBg: 'bg-[#201810]', badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      { title: 'Nhóm 4: Phụ Đạo Tăng Cường (Intensive Tier)', subtitle: 'Cụm Phụ Đạo 1-1', pedagogy: 'Hổng kiến thức nặng. Cần giáo viên hoặc trợ giảng hỗ trợ trực tiếp từng buổi học.', borderCls: 'border-rose-500/40', headerBg: 'bg-[#241216]', badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    ];

    return pairedClusters.map((pc, idx) => {
      const cfg = metaConfig[idx] || metaConfig[metaConfig.length - 1];
      return {
        id: `kmeans-group-${idx + 1}`,
        title: K === 2 && idx === 1 ? 'Nhóm 2: Cần Rèn Luyện & Hỗ Trợ' : cfg.title,
        subtitle: cfg.subtitle,
        pedagogyAdvice: cfg.pedagogy,
        borderCls: cfg.borderCls,
        headerBg: cfg.headerBg,
        badgeCls: cfg.badgeCls,
        ...calcGroupStats(pc.students),
        students: pc.students,
      };
    });
  }
}
