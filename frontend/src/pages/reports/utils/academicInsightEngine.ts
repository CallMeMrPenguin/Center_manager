import { format1Dec, trunc1Dec } from '../../../utils';
import { getStudentTier } from '../types';

export interface InsightMetricItem {
  id: string;
  label: string;
  dotColor: string;
  text: string;
  tooltipTitle: string;
  tooltipDesc: string;
  tooltipFormula?: string;
  tooltipImpact?: string;
}

export interface AcademicInsightReport {
  subjectTitle: string;
  overallBadge: string;
  badgeColor: string;
  metrics: InsightMetricItem[];
  conclusion: {
    overviewSummary: string;
    riskAlert: string;
  };
}

const n = (v: any): number => (v === '-' || v === undefined || v === null || isNaN(Number(v)) ? 0 : Number(v));

export function generateAcademicInsights(params: {
  stats: any;
  engine: any;
  hasSelectedStudent: boolean;
  selectedStudentObj?: any;
  selectedClassId: string;
  classes?: any[];
  filteredRankings: any[];
  distributionStats?: any;
}): AcademicInsightReport {
  const { stats, engine, hasSelectedStudent, selectedStudentObj, selectedClassId, classes = [], filteredRankings = [], distributionStats } = params;

  const c1 = n(stats?.c1);
  const c2 = n(stats?.c2);
  const hw = n(stats?.hw);
  const mockTest = n(stats?.mockTest);
  const overall = n(stats?.overall);
  const attPct = stats?.attendancePct ?? 100;
  const sessions = stats?.sessionCount ?? 0;
  const ema = n(engine?.ema_level);
  const emaC1 = n(engine?.ema_c1);
  const emaC2 = n(engine?.ema_c2);
  const emaHw = n(engine?.ema_hw);
  const trend = n(engine?.trend_slope);
  const trendLabel = engine?.trend_label ?? 'Ổn định';
  const sd = n(engine?.std_dev);
  const consistencyLabel = engine?.consistency_label ?? 'Ổn định';
  const pi = n(engine?.performance_index) || (overall > 0 ? trunc1Dec(overall * 10) : 80);
  const predNext = n(engine?.predicted_next);
  const predModel = engine?.prediction_model ?? 'Smart Predict';
  const predC1 = n(engine?.pred_c1);
  const predC2 = n(engine?.pred_c2);
  const predHw = n(engine?.pred_hw);
  const selectedClass = classes.find((c) => String(c.id) === String(selectedClassId));
  const className = selectedClass?.class_name ?? 'Lớp Học';

  // ───────────────────────────────────────────────────────────────────────────
  // 1. INDIVIDUAL STUDENT VIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (hasSelectedStudent && selectedStudentObj) {
    const studentName = selectedStudentObj.full_name || 'Học sinh';
    const tier = getStudentTier(overall > 0 ? overall : ema);
    const metrics: InsightMetricItem[] = [];

    // Metric 1: Năng lực thực chất & EMA
    const emaDiff = ema > 0 && overall > 0 ? trunc1Dec(ema - overall) : 0;
    const emaStatusText =
      emaDiff > 0.3
        ? `Năng lực hiện tại đạt EMA ${ema} đ (Hạng ${tier.name}), cao hơn bình quân cả kỳ (${overall} đ) là +${emaDiff} đ: Học sinh đang bứt phá phong độ rõ rệt.`
        : emaDiff < -0.3
        ? `Năng lực gần nhất đạt EMA ${ema} đ (Hạng ${tier.name}), giảm so với điểm bình quân (${overall} đ) là ${emaDiff} đ: Có dấu hiệu chững lại ở các bài học gần nhất.`
        : `Năng lực gần nhất đạt EMA ${ema} đ (Hạng ${tier.name}), tương đồng với bình quân quá trình (${overall} đ): Học lực duy trì ổn định.`;

    metrics.push({
      id: 'actual_capacity',
      label: 'Năng Lực Thực Chất (EMA)',
      dotColor: ema >= 8.0 ? '#10b981' : ema >= 6.5 ? '#3b82f6' : ema >= 5.0 ? '#f59e0b' : '#ef4444',
      text: `${emaStatusText} Chi tiết kỹ năng gần nhất: Từ Vựng đạt ${emaC1 || c1} đ, Ngữ Pháp đạt ${emaC2 || c2} đ, BTVN đạt ${emaHw || hw} đ.`,
      tooltipTitle: 'Điểm Trung Bình Trượt Hàm Mũ (EMA)',
      tooltipDesc: 'Tính toán năng lực thực chất bằng cách đặt trọng số cao hơn vào các buổi kiểm tra gần nhất.',
      tooltipFormula: 'EMA_mới = 0.5 × Điểm_mới + 0.5 × EMA_cũ',
      tooltipImpact: 'Phản ánh chính xác phong độ thực tại, loại bỏ sai lệch từ điểm số quá cũ ở đầu kỳ.',
    });

    // Metric 2: Cân bằng kỹ năng Từ vựng vs Ngữ pháp
    const skillGap = Math.abs(c1 - c2);
    let skillBalanceText = '';
    let skillDotColor = '#10b981';
    if (c1 > 0 && c2 > 0) {
      if (skillGap >= 1.5) {
        skillDotColor = '#f59e0b';
        const strong = c1 > c2 ? 'Từ Vựng' : 'Ngữ Pháp';
        const weak = c1 > c2 ? 'Ngữ Pháp' : 'Từ Vựng';
        const sScore = c1 > c2 ? c1 : c2;
        const wScore = c1 > c2 ? c2 : c1;
        skillBalanceText = `Mất cân bằng kỹ năng rõ rệt: ${strong} (${sScore} đ) vượt trội hơn ${weak} (${wScore} đ) tới ${skillGap.toFixed(1)} đ. Cần ưu tiên tăng cường luyện tập ${weak}.`;
      } else if (skillGap >= 0.8) {
        skillDotColor = '#3b82f6';
        skillBalanceText = `Có độ chênh lệch nhẹ: Từ Vựng đạt ${c1} đ so với Ngữ Pháp đạt ${c2} đ (chênh lệch ${skillGap.toFixed(1)} đ), mức độ phân hóa vẫn trong tầm kiểm soát.`;
      } else {
        skillBalanceText = `Từ Vựng (${c1} đ) và Ngữ Pháp (${c2} đ) phát triển rất đồng đều (độ lệch chỉ ${skillGap.toFixed(1)} đ), tạo nền tảng vững chắc cho phản xạ toàn diện.`;
      }
    } else {
      skillBalanceText = `Đang cập nhật thêm dữ liệu điểm thành phần kỹ năng.`;
    }

    metrics.push({
      id: 'skill_balance',
      label: 'Cân Bằng Kỹ Năng',
      dotColor: skillDotColor,
      text: skillBalanceText,
      tooltipTitle: 'Phân Tích Cân Bằng Kỹ Năng',
      tooltipDesc: 'So sánh mức độ thành thạo giữa hai trụ cột cốt lõi: Vốn Từ Vựng và Cấu Trúc Ngữ Pháp.',
      tooltipFormula: 'Skill Gap = abs(Điểm Từ Vựng - Điểm Ngữ Pháp)',
      tooltipImpact: 'Độ lệch > 1.5 điểm yêu cầu điều chỉnh phân bổ thời gian học tập cho kỹ năng còn yếu.',
    });

    // Metric 3: Ý thức làm BTVN vs Điểm kiểm tra
    if (hw > 0 && overall > 0) {
      const hwGap = trunc1Dec(hw - overall);
      const hwDot = hw < 6.0 ? '#f97316' : hwGap >= 1.5 ? '#3b82f6' : '#10b981';
      const hwText =
        hw < 6.0
          ? `Điểm BTVN trung bình thấp (${hw} đ < chuẩn 7.0 đ): Học sinh chưa đầu tư thời gian tự học đầy đủ tại nhà, làm hạn chế củng cố bài giảng.`
          : hwGap >= 1.5
          ? `BTVN đạt ${hw} đ cao hơn điểm kiểm tra trực tiếp (${overall} đ) là +${hwGap} đ: Cần tăng cường kiểm tra độc lập tại lớp để đảm bảo hiểu sâu.`
          : `Điểm BTVN (${hw} đ) phản ánh đúng thực lực kiểm tra tại lớp (${overall} đ): Học sinh duy trì thái độ tự học nghiêm túc và thực chất.`;

      metrics.push({
        id: 'homework_habit',
        label: 'Ý Thức Tự Học & BTVN',
        dotColor: hwDot,
        text: hwText,
        tooltipTitle: 'Tương Quan BTVN & Kiểm Tra',
        tooltipDesc: 'Đối chiếu tính chuyên cần làm bài tập tại nhà với kết quả bài kiểm tra độc lập tại trung tâm.',
        tooltipFormula: 'HW Gap = Điểm BTVN - Điểm Tổng Hợp',
        tooltipImpact: 'Giúp nhận diện học sinh tự giác hay ỷ lại vào sự trợ giúp khi làm bài ở nhà.',
      });
    }

    // Metric 4: Tốc độ tăng trưởng
    const trendText =
      trend > 0.3
        ? `Tốc độ tiến bộ vượt bậc (+${trend} đ/buổi, ${trendLabel}): Học sinh tiếp thu bài rất nhanh và có sự bứt phá mạnh mẽ qua từng buổi.`
        : trend > 0.1
        ? `Quỹ đạo tiến bộ đều đặn (+${trend} đ/buổi, ${trendLabel}): Học sinh đang đi đúng hướng theo lộ trình giảng dạy.`
        : trend >= -0.1
        ? `Phong độ duy trì ổn định (${trend >= 0 ? '+' : ''}${trend} đ/buổi, ${trendLabel}): Điểm số không có đột biến lớn.`
        : trend >= -0.3
        ? `Có dấu hiệu suy giảm nhẹ (${trend} đ/buổi, ${trendLabel}): Cần rà soát lại các nội dung ngữ pháp hoặc từ vựng gần đây.`
        : `Điểm số đang giảm nhanh (${trend} đ/buổi, ${trendLabel}): Cần trao đổi trực tiếp với học sinh và phụ huynh để tháo gỡ khó khăn.`;

    metrics.push({
      id: 'growth_trajectory',
      label: 'Tốc Độ Tăng Trưởng',
      dotColor: trend > 0.1 ? '#10b981' : trend >= -0.1 ? '#8b5cf6' : '#ef4444',
      text: trendText,
      tooltipTitle: 'Tốc Độ Tăng Trưởng (Trend Rate)',
      tooltipDesc: 'Hệ số góc của đường hồi quy biểu diễn mức thay đổi điểm số trung bình sau mỗi buổi học.',
      tooltipFormula: 'y = ax + b (a là hệ số góc tăng trưởng)',
      tooltipImpact: 'Xác định đà phát triển của học sinh đang tiến lên hay sa sút để can thiệp sớm.',
    });

    // Metric 5: Độ ổn định SD
    const sdText =
      sd < 0.5
        ? `Độ lệch chuẩn cực thấp (σ = ${sd}, ${consistencyLabel}): Học sinh làm bài rất đều tay, phong độ vững vàng trong mọi bài kiểm tra.`
        : sd <= 1.2
        ? `Độ ổn định tốt (σ = ${sd}, ${consistencyLabel}): Sự dao động điểm số nằm trong biên độ tự nhiên cho phép.`
        : sd <= 2.0
        ? `Điểm số có sự trồi sụt (σ = ${sd}, ${consistencyLabel}): Kết quả có bài điểm cao bài điểm thấp, thể hiện tâm lý thi cử chưa ổn định.`
        : `Điểm số biến động rất mạnh (σ = ${sd}, ${consistencyLabel}): Cần theo dõi sát sao từng bài kiểm tra để củng cố kỹ năng làm bài.`;

    metrics.push({
      id: 'score_consistency',
      label: 'Độ Ổn Định & Phong Độ',
      dotColor: sd <= 1.2 ? '#06b6d4' : sd <= 2.0 ? '#f59e0b' : '#ef4444',
      text: sdText,
      tooltipTitle: 'Độ Lệch Chuẩn Điểm Số (SD - σ)',
      tooltipDesc: 'Đo lường mức độ phân tán của các điểm số xung quanh giá trị trung bình.',
      tooltipFormula: 'σ = sqrt( Tổng( (x_i - x_tb)^2 ) / n )',
      tooltipImpact: 'Độ lệch chuẩn càng nhỏ thể hiện phong độ làm bài càng vững vàng và ít bị ảnh hưởng bởi tâm lý.',
    });

    // Metric 6: Chỉ số PI & Dự báo
    metrics.push({
      id: 'performance_prediction',
      label: 'Chỉ Số Toàn Diện & Dự Báo',
      dotColor: pi >= 80 ? '#10b981' : pi >= 65 ? '#6366f1' : '#f59e0b',
      text: `Chỉ số phong độ toàn diện đạt ${pi}/100 (Hạng ${tier.name}). Thuật toán ${predModel} dự báo buổi tới học sinh đạt ${predNext} điểm (Từ Vựng: ${predC1} đ, Ngữ Pháp: ${predC2} đ, BTVN: ${predHw} đ).`,
      tooltipTitle: 'Chỉ Số Phong Độ PI & Dự Báo',
      tooltipDesc: 'Tổng hợp 5 trụ cột (40% EMA, 25% Trend, 15% Độ ổn định, 10% Lịch sử, 10% Chuyên cần) và mô hình chuỗi thời gian.',
      tooltipFormula: 'PI = 0.4*EMA + 0.25*Trend + 0.15*Consistency + 0.1*History + 0.1*Att',
      tooltipImpact: 'Định hướng mức độ thử thách phù hợp cho buổi học tiếp theo.',
    });

    // Metric 7: Vị thế trong lớp & Chuyên cần
    const totalStudents = filteredRankings.length;
    const rankNum = parseInt(stats.rank?.replace('#', '') || '1') || 1;
    const pct = totalStudents > 0 ? Math.round((rankNum / totalStudents) * 100) : 100;
    const rankText = stats.rank && stats.rank !== '#-' ? `Xếp hạng ${stats.rank}/${totalStudents} học sinh trong lớp (nhóm Top ${pct}%). ` : '';
    const attText =
      attPct >= 95
        ? `Chuyên cần đạt ${attPct}% (${sessions} buổi học) — chuyên cần xuất sắc.`
        : attPct >= 85
        ? `Chuyên cần đạt ${attPct}% — cần duy trì đi học đều đặn.`
        : `Chuyên cần chỉ đạt ${attPct}% (${sessions} buổi) — vắng học nhiều là nguyên nhân trực tiếp kéo tụt kết quả.`;

    metrics.push({
      id: 'rank_attendance',
      label: 'Vị Thế Trong Lớp & Chuyên Cần',
      dotColor: attPct >= 85 ? '#10b981' : '#ef4444',
      text: `${rankText}${attText}`,
      tooltipTitle: 'Vị Thế Phân Vị & Chuyên Cần',
      tooltipDesc: 'Đo lường sự chuyên cần và vị trí tương đối của học sinh so với toàn thể các bạn cùng lớp.',
      tooltipFormula: 'Percentile = (Thứ hạng / Tổng sĩ số) * 100%',
      tooltipImpact: 'Chuyên cần là điều kiện tiên quyết để đảm bảo tiếp thu trọn vẹn chương trình học.',
    });

    const isGood = overall >= 8.0;
    const isMedium = overall >= 6.5;
    return {
      subjectTitle: `ĐÁNH GIÁ CHI TIẾT HỌC SINH: ${studentName.toUpperCase()}`,
      overallBadge: `HẠNG ${tier.name.toUpperCase()} (PI ${pi})`,
      badgeColor: tier.color,
      metrics,
      conclusion: {
        overviewSummary: isGood
          ? `Học sinh ${studentName} thể hiện năng lực học tập xuất sắc với nền tảng kiến thức vững vàng (PI ${pi}/100, Hạng ${tier.name}).`
          : isMedium
          ? `Học sinh ${studentName} có học lực Khá vững (PI ${pi}/100, Hạng ${tier.name}), có tiềm năng bứt phá lên nhóm Cao Thủ / Quán Quân nếu khắc phục các điểm nghẽn kỹ năng.`
          : `Học sinh ${studentName} hiện đang ở nhóm Cần Hỗ Trợ (Hạng ${tier.name}, PI ${pi}/100), cần sự quan tâm sát sao từ giáo viên và gia đình.`,
        riskAlert: isGood
          ? skillGap >= 1.2
            ? `Lưu ý cân bằng giữa ${c1 < c2 ? 'Từ Vựng' : 'Ngữ Pháp'} để không bị mất điểm ở các câu phân loại cao cấp.`
            : `Cần giữ vững phong độ ổn định và tính cẩn thận, tránh chủ quan khi gặp các bài tập nâng cao.`
          : isMedium
          ? c1 < 6.5
            ? `Điểm Từ Vựng (${c1} đ) đang là rào cản chính cần được cải thiện gấp.`
            : c2 < 6.5
            ? `Điểm Ngữ Pháp (${c2} đ) chưa thật sự chắc chắn, cần ôn tập lại các cấu trúc trọng điểm.`
            : `Cần cải thiện độ ổn định và giảm biên độ dao động điểm số qua các buổi kiểm tra.`
          : `Hổng kiến thức nền tảng ở cả Từ Vựng (${c1} đ) và Ngữ Pháp (${c2} đ), nguy cơ không theo kịp tiến độ các bài học kế tiếp.`,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CLASS VIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (selectedClassId && !hasSelectedStudent) {
    const totalStudents = filteredRankings.length;
    const dist = distributionStats;
    const metrics: InsightMetricItem[] = [];

    const passCount = filteredRankings.filter((r) => (Number(r.overallAvg) || Number(r.ema_level) || 0) >= 5.0).length;
    const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 100;
    const goodCount = filteredRankings.filter((r) => (Number(r.overallAvg) || Number(r.ema_level) || 0) >= 7.0).length;
    const goodRate = totalStudents > 0 ? Math.round((goodCount / totalStudents) * 100) : 0;
    const weakCount = totalStudents - passCount;
    const weakRate = totalStudents > 0 ? Math.round((weakCount / totalStudents) * 100) : 0;

    metrics.push({
      id: 'class_overall_quality',
      label: 'Mặt Bằng Học Lực Chung',
      dotColor: overall >= 7.5 ? '#10b981' : overall >= 6.0 ? '#3b82f6' : '#f59e0b',
      text: `Điểm trung bình toàn lớp đạt ${overall}/10 trên tổng số ${sessions} đầu điểm kiểm tra ghi nhận. Tỷ lệ học sinh đạt chuẩn từ Khá trở lên (≥ 7.0 đ) chiếm ${goodRate}% (${goodCount}/${totalStudents} học sinh), tỷ lệ đạt yêu cầu chung chiếm ${passRate}%.`,
      tooltipTitle: 'Chất Lượng Học Thuật Lớp',
      tooltipDesc: 'Đánh giá mức độ hoàn thành mục tiêu chuẩn đầu ra chung của toàn thể học sinh trong lớp.',
      tooltipFormula: 'Điểm TB Lớp = Tổng điểm học sinh / Sĩ số',
      tooltipImpact: 'Cho biết mặt bằng chung để giáo viên điều chỉnh độ khó bài giảng cho phù hợp.',
    });

    const gap = Math.abs(c1 - c2);
    const dominantSkill = c1 >= c2 ? 'Từ Vựng' : 'Ngữ Pháp';
    const subSkill = c1 >= c2 ? 'Ngữ Pháp' : 'Từ Vựng';
    const dominantScore = c1 >= c2 ? c1 : c2;
    const subScore = c1 >= c2 ? c2 : c1;

    metrics.push({
      id: 'class_skill_comparison',
      label: 'Cơ Cấu Kỹ Năng Toàn Lớp',
      dotColor: gap >= 1.0 ? '#f59e0b' : '#10b981',
      text: `Lớp có xu hướng mạnh về ${dominantSkill} (${dominantScore} đ) hơn ${subSkill} (${subScore} đ), độ chênh lệch bình quân ${gap.toFixed(1)} đ. ${gap >= 1.0 ? `Cần phân bổ thêm thời lượng bài giảng cho các tiết luyện tập ${subSkill}.` : `Hai kỹ năng đang được phát triển cân đối.`}`,
      tooltipTitle: 'Phân Tích Kỹ Năng Tập Thể',
      tooltipDesc: 'So sánh điểm trung bình giữa Từ Vựng và Ngữ Pháp trên quy mô toàn lớp.',
      tooltipFormula: 'Độ lệch = abs(TB Từ Vựng - TB Ngữ Pháp)',
      tooltipImpact: 'Giúp điều chỉnh trọng tâm giảng dạy vào kỹ năng lớp đang còn yếu.',
    });

    const classSd = dist?.stdDev ?? sd;
    const isDispersed = classSd > 1.4;

    metrics.push({
      id: 'class_dispersion',
      label: 'Mức Độ Phân Hóa Học Lực',
      dotColor: isDispersed ? '#f59e0b' : '#06b6d4',
      text: isDispersed
        ? `Độ lệch chuẩn điểm số của lớp ở mức cao (σ = ${classSd}): Có sự phân hóa học lực rõ nét giữa nhóm học sinh dẫn đầu và nhóm học sinh cần bổ trợ.`
        : `Độ lệch chuẩn ở mức thấp (σ = ${classSd}): Trình độ học sinh trong lớp khá đồng đều, thuận lợi cho triển khai giáo án chung.`,
      tooltipTitle: 'Độ Phân Hóa Lớp Học',
      tooltipDesc: 'Đo lường khoảng cách học lực giữa các học sinh trong cùng một tập thể lớp.',
      tooltipFormula: 'σ = Độ lệch chuẩn phân phối điểm lớp',
      tooltipImpact: 'Độ lệch chuẩn cao đòi hỏi phân tầng bài tập để không bỏ rơi học sinh yếu.',
    });

    metrics.push({
      id: 'class_habit',
      label: 'BTVN & Chuyên Cần Toàn Lớp',
      dotColor: attPct >= 90 && hw >= 7.0 ? '#10b981' : '#f59e0b',
      text: `Điểm BTVN trung bình của lớp đạt ${hw}/10. Tỷ lệ chuyên cần chung đạt ${attPct}%. ${attPct < 88 ? 'Cần siết chặt theo dõi điểm danh và nhắc nhở học sinh vắng.' : 'Nền nếp đi học của lớp duy trì rất tốt.'}`,
      tooltipTitle: 'Kỷ Luật Học Tập Của Lớp',
      tooltipDesc: 'Tổng hợp tỷ lệ tham gia lớp học và mức độ hoàn thành bài tập về nhà của tập thể.',
      tooltipFormula: 'Chuyên cần = (Tổng lượt có mặt / Tổng lượt học) * 100%',
      tooltipImpact: 'Tạo động lực thi đua học tập tích cực trong toàn lớp.',
    });

    return {
      subjectTitle: `TỔNG KẾT HỌC THUẬT LỚP: ${className.toUpperCase()} (${totalStudents} HỌC SINH)`,
      overallBadge: `${goodRate >= 50 ? 'LỚP CHẤT LƯỢNG TỐT' : 'LỚP CẦN NÂNG CAO'} (ĐIỂM TB ${overall})`,
      badgeColor: overall >= 7.0 ? '#10b981' : '#6366f1',
      metrics,
      conclusion: {
        overviewSummary: `Tập thể lớp ${className} có sĩ số ${totalStudents} học sinh, điểm trung bình đạt ${overall}/10 với tỷ lệ học sinh khá giỏi chiếm ${goodRate}%.`,
        riskAlert: weakRate > 0
          ? `Hiện có ${weakCount} học sinh (${weakRate}%) có điểm số dưới mức 5.0 đ, cần có kế hoạch phụ đạo riêng để đảm bảo tỷ lệ hoàn thành chương trình.`
          : `Không có học sinh trong diện nguy cơ, lớp duy trì phong độ đồng đều.`,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. CENTER-WIDE OVERVIEW VIEW
  // ───────────────────────────────────────────────────────────────────────────
  const totalStudents = filteredRankings.length;
  const totalClasses = classes.length;
  const metrics: InsightMetricItem[] = [];

  const excellentCount = filteredRankings.filter((r) => (Number(r.overallAvg) || Number(r.ema_level) || 0) >= 8.0).length;
  const excellentPct = totalStudents > 0 ? Math.round((excellentCount / totalStudents) * 100) : 0;
  const riskCount = filteredRankings.filter((r) => {
    const s = Number(r.overallAvg) || Number(r.ema_level) || 0;
    return s > 0 && s < 5.0;
  }).length;
  const riskPct = totalStudents > 0 ? Math.round((riskCount / totalStudents) * 100) : 0;

  metrics.push({
    id: 'center_overall_quality',
    label: 'Chất Lượng Đào Tạo Toàn Hệ Thống',
    dotColor: overall >= 7.0 ? '#10b981' : '#3b82f6',
    text: `Điểm trung bình toàn trung tâm đạt ${overall}/10 trên tổng số ${totalStudents} học sinh thuộc ${totalClasses} lớp học. Chất lượng đào tạo duy trì ở mức ${overall >= 7.5 ? 'rất cao' : 'ổn định'}.`,
    tooltipTitle: 'Chất Lượng Toàn Trung Tâm',
    tooltipDesc: 'Đánh giá tổng thể hiệu quả đào tạo trên toàn bộ các lớp và khóa học.',
    tooltipFormula: 'TB Trung Tâm = Bình quân điểm tất cả học sinh',
    tooltipImpact: 'Thước đo đánh giá chất lượng học thuật và giáo trình của trung tâm.',
  });

  metrics.push({
    id: 'center_tier_distribution',
    label: 'Cơ Cấu Phân Tầng Học Lực',
    dotColor: '#8b5cf6',
    text: `Toàn trung tâm có ${excellentCount} học sinh (${excellentPct}%) đạt mức Xuất Sắc (≥ 8.0 đ). Số lượng học sinh cần hỗ trợ đặc biệt (< 5.0 đ) là ${riskCount} em (${riskPct}%).`,
    tooltipTitle: 'Cơ Cấu Phân Tầng',
    tooltipDesc: 'Tỷ lệ học sinh đạt chuẩn Xuất Sắc / Khá / Trung Bình / Yếu trên quy mô hệ thống.',
    tooltipFormula: 'Tỷ lệ % = (Số lượng / Tổng học sinh) * 100',
    tooltipImpact: 'Cung cấp cơ sở dữ liệu để hoạch định chính sách học bổng và mở lớp phụ đạo.',
  });

  metrics.push({
    id: 'center_skill_balance',
    label: 'Tương Quan Kỹ Năng Hệ Thống',
    dotColor: '#06b6d4',
    text: `Điểm Từ Vựng toàn trung tâm đạt ${c1} đ, Ngữ Pháp đạt ${c2} đ, BTVN đạt ${hw} đ. Tỷ lệ chuyên cần bình quân toàn hệ thống đạt ${attPct}%.`,
    tooltipTitle: 'Chỉ Số Kỹ Năng Toàn Diện',
    tooltipDesc: 'Đối chiếu năng lực các kỹ năng học thuật chính trên toàn bộ học sinh trung tâm.',
    tooltipFormula: 'Tổng hợp điểm trung bình các kỹ năng',
    tooltipImpact: 'Giúp ban chuyên môn đánh giá tính hiệu quả của giáo trình giảng dạy.',
  });

  return {
    subjectTitle: `TỔNG QUAN HỌC LỰC TOÀN TRUNG TÂM (${totalStudents} HỌC SINH - ${totalClasses} LỚP)`,
    overallBadge: `CHẤT LƯỢNG TOÀN DIỆN (ĐIỂM TB ${overall})`,
    badgeColor: '#10b981',
    metrics,
    conclusion: {
      overviewSummary: `Hệ thống đào tạo đang vận hành hiệu quả với ${totalStudents} học sinh, điểm trung bình toàn trung tâm đạt ${overall}/10 và ${excellentPct}% học sinh đạt mức Xuất Sắc.`,
      riskAlert: riskCount > 0
        ? `Ghi nhận ${riskCount} học sinh (${riskPct}%) có nguy cơ hổng kiến thức căn bản trên toàn hệ thống.`
        : `Không có học sinh trong nhóm nguy cơ cao.`,
    },
  };
}
