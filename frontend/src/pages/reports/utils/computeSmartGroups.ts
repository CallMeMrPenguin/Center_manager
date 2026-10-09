import { trunc1Dec } from '../../../utils';

export function computeSmartGroups({
  studentRankings,
  selectedClassId,
}: {
  studentRankings: any[];
  selectedClassId: string;
  [key: string]: any;
}) {
  let pool = studentRankings || [];
  if (pool.length === 0) return [];

  if (selectedClassId && selectedClassId !== 'all') {
    pool = pool.filter(s => String(s.class_id) === selectedClassId);
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

  const gGioi: any[] = [];
  const gKha: any[] = [];
  const gTB: any[] = [];
  const gYeu: any[] = [];
  const gKem: any[] = [];

  pool.forEach(s => {
    const score = getStudentScore(s);
    if (score >= 8.0) gGioi.push(s);
    else if (score >= 6.5) gKha.push(s);
    else if (score >= 5.0) gTB.push(s);
    else if (score >= 3.5) gYeu.push(s);
    else gKem.push(s);
  });

  gGioi.sort((a, b) => getStudentScore(b) - getStudentScore(a));
  gKha.sort((a, b) => getStudentScore(b) - getStudentScore(a));
  gTB.sort((a, b) => getStudentScore(b) - getStudentScore(a));
  gYeu.sort((a, b) => getStudentScore(b) - getStudentScore(a));
  gKem.sort((a, b) => getStudentScore(b) - getStudentScore(a));

  return [
    {
      id: 'tier-gioi',
      title: 'Giỏi',
      subtitle: 'Năng Lực Vượt Trội (≥ 8.0đ)',
      pedagogyAdvice: 'Luyện đề phân hóa chuyên sâu & nâng cao tư duy.',
      borderCls: '',
      headerBg: 'bg-emerald-500/10 dark:bg-[#102419]',
      badgeCls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      ...calcGroupStats(gGioi),
      students: gGioi,
    },
    {
      id: 'tier-kha',
      title: 'Khá',
      subtitle: 'Đạt Chuẩn Tiến Độ (6.5 – 7.9đ)',
      pedagogyAdvice: 'Rèn luyện tốc độ & củng cố kiến thức vững chắc.',
      borderCls: '',
      headerBg: 'bg-blue-500/10 dark:bg-[#101b2e]',
      badgeCls: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      ...calcGroupStats(gKha),
      students: gKha,
    },
    {
      id: 'tier-tb',
      title: 'Trung Bình',
      subtitle: 'Cần Củng Cố (5.0 – 6.4đ)',
      pedagogyAdvice: 'Sửa lỗi sai cơ bản & tăng cường làm bài tập.',
      borderCls: '',
      headerBg: 'bg-amber-500/10 dark:bg-[#201810]',
      badgeCls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      ...calcGroupStats(gTB),
      students: gTB,
    },
    {
      id: 'tier-yeu',
      title: 'Yếu',
      subtitle: 'Cần Hỗ Trợ (3.5 – 4.9đ)',
      pedagogyAdvice: 'Giảng lại lý thuyết căn bản & phụ đạo sát sao 1-1.',
      borderCls: '',
      headerBg: 'bg-orange-500/10 dark:bg-[#241712]',
      badgeCls: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
      ...calcGroupStats(gYeu),
      students: gYeu,
    },
    {
      id: 'tier-kem',
      title: 'Kém',
      subtitle: 'Báo Động (< 3.5đ)',
      pedagogyAdvice: 'Liên hệ phụ huynh & xây dựng kế hoạch bổ sung kiến thức khẩn cấp.',
      borderCls: '',
      headerBg: 'bg-rose-500/10 dark:bg-[#241216]',
      badgeCls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
      ...calcGroupStats(gKem),
      students: gKem,
    },
  ];
}
