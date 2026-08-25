import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface InsightCommentaryProps {
  stats: {
    c1: string | number;
    c2: string | number;
    hw: string | number;
    mockTest?: string | number;
    overall: string | number;
    attendancePct: number;
    sessionCount: number;
    rank: string;
    level: string;
  };
  engine: any;
  hasSelectedStudent: boolean;
  selectedClassId: string;
  filteredRankings: any[];
  distributionStats?: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const n = (v: string | number | undefined): number =>
  v === '-' || v === undefined || v === null ? 0 : Number(v);

function classifyScore(s: number): { label: string; color: string } {
  if (s >= 8.7) return { label: 'xuất sắc', color: 'text-purple-300' };
  if (s >= 8.0) return { label: 'xuất sắc', color: 'text-cyan-400' };
  if (s >= 7.0) return { label: 'giỏi', color: 'text-indigo-400' };
  if (s >= 6.0) return { label: 'khá', color: 'text-yellow-400' };
  if (s >= 4.6) return { label: 'trung bình', color: 'text-amber-400' };
  return { label: 'yếu', color: 'text-rose-400' };
}

// ── Insight Generator ─────────────────────────────────────────────────────────
function buildInsights(
  stats: InsightCommentaryProps['stats'],
  engine: any,
  hasSelectedStudent: boolean,
  selectedClassId: string,
  filteredRankings: any[],
): Array<{ icon: string; color: string; text: string }> {
  const insights: Array<{ icon: string; color: string; text: string }> = [];

  const c1 = n(stats.c1);
  const c2 = n(stats.c2);
  const hw = n(stats.hw);
  const overall = n(stats.overall);
  const att = stats.attendancePct;
  const sessions = stats.sessionCount;
  const ema = n(engine?.ema_level);
  const trend = n(engine?.trend_slope);
  const sd = n(engine?.std_dev);
  const pi = n(engine?.performance_index);
  const predicted = n(engine?.predicted_next);

  // ── INDIVIDUAL VIEW ────────────────────────────────────────────────────────
  if (hasSelectedStudent) {
    // Overall score comment
    if (overall > 0) {
      const cls = classifyScore(overall);
      if (overall >= 8.0) {
        insights.push({ icon: '🏆', color: 'text-cyan-300', text: `Điểm tổng hợp ${overall} — ${cls.label}. Duy trì đà học tập hiện tại, cần tiếp tục phát huy để vươn lên nhóm đầu.` });
      } else if (overall >= 7.0) {
        insights.push({ icon: '✅', color: 'text-indigo-300', text: `Điểm tổng hợp ${overall} — ${cls.label}. Kết quả tốt, có thể nâng lên xuất sắc nếu cải thiện thêm từ vựng hoặc ngữ pháp.` });
      } else if (overall >= 6.0) {
        insights.push({ icon: '📈', color: 'text-yellow-300', text: `Điểm tổng hợp ${overall} — ${cls.label}. Kết quả ở mức vừa phải. Cần chú trọng hơn vào phần điểm thấp nhất để kéo tổng lên.` });
      } else if (overall >= 4.6) {
        insights.push({ icon: '⚠️', color: 'text-amber-300', text: `Điểm tổng hợp ${overall} — trung bình. Học sinh cần được hỗ trợ thêm, đặc biệt ở những kỹ năng chưa đạt 6.0.` });
      } else if (overall > 0) {
        insights.push({ icon: '🚨', color: 'text-rose-400', text: `Điểm tổng hợp ${overall} — yếu. Cần can thiệp học thuật ngay, xem xét bổ sung buổi kèm hoặc bài tập nâng cao.` });
      }
    }

    // Vocab vs Grammar gap
    if (c1 > 0 && c2 > 0) {
      const gap = Math.abs(c1 - c2);
      if (gap >= 1.5) {
        const weak = c1 < c2 ? `từ vựng (${c1})` : `ngữ pháp (${c2})`;
        const strong = c1 > c2 ? `từ vựng (${c1})` : `ngữ pháp (${c2})`;
        insights.push({ icon: '⚖️', color: 'text-amber-300', text: `Mất cân bằng kỹ năng rõ rệt — ${weak} thấp hơn ${strong} tới ${gap.toFixed(1)} điểm. Cần tăng cường luyện tập ${c1 < c2 ? 'từ vựng' : 'ngữ pháp'}.` });
      } else if (gap <= 0.5) {
        insights.push({ icon: '🎯', color: 'text-emerald-300', text: `Từ vựng và ngữ pháp phát triển đồng đều (${c1} / ${c2}). Đây là nền tảng tốt để duy trì kết quả ổn định.` });
      }
    }

    // Homework insight
    if (hw > 0 && overall > 0) {
      if (hw < 6.0) {
        insights.push({ icon: '📚', color: 'text-orange-300', text: `BTVN trung bình ${hw} — thấp hơn mức mong đợi. Học sinh cần dành thêm thời gian hoàn thành bài tập để củng cố kiến thức tại nhà.` });
      } else if (hw > overall + 1.0) {
        insights.push({ icon: '📝', color: 'text-emerald-300', text: `BTVN (${hw}) tốt hơn điểm kiểm tra (${overall}) — có thể được hỗ trợ khi làm bài ở nhà. Cần kiểm tra tính độc lập.` });
      }
    }

    // Attendance insight
    if (att < 80) {
      insights.push({ icon: '🔴', color: 'text-rose-400', text: `Tỷ lệ chuyên cần chỉ ${att}% — nghỉ nhiều ảnh hưởng trực tiếp đến kết quả. Cần trao đổi ngay với phụ huynh về việc đi học đều đặn.` });
    } else if (att < 90) {
      insights.push({ icon: '🟡', color: 'text-amber-300', text: `Tỷ lệ chuyên cần ${att}% — cần chú ý hơn. Học sinh nghỉ có thể bỏ lỡ nhiều nội dung quan trọng.` });
    } else {
      insights.push({ icon: '✨', color: 'text-emerald-300', text: `Chuyên cần ${att}% — đi học đều đặn, đây là yếu tố quan trọng giúp duy trì kết quả tốt.` });
    }

    // Trend insight
    if (trend > 0.3) {
      insights.push({ icon: '🚀', color: 'text-emerald-300', text: `Đà tiến bộ rất mạnh (+${trend}/buổi) — học sinh đang cải thiện nhanh chóng. Cần duy trì và tăng độ khó thử thách.` });
    } else if (trend > 0.1) {
      insights.push({ icon: '📈', color: 'text-cyan-300', text: `Đà tiến bộ tốt (+${trend}/buổi) — học sinh đang cải thiện dần đều. Tiếp tục hướng dẫn theo lộ trình hiện tại.` });
    } else if (trend < -0.3) {
      insights.push({ icon: '📉', color: 'text-rose-400', text: `Điểm số đang giảm nhanh (${trend}/buổi) — cần kiểm tra nguyên nhân ngay: mệt mỏi, áp lực, hoặc chưa nắm nội dung mới.` });
    } else if (trend < -0.1) {
      insights.push({ icon: '⚠️', color: 'text-amber-300', text: `Có dấu hiệu suy giảm nhẹ (${trend}/buổi). Nên xem lại bài vở gần đây và trao đổi với học sinh.` });
    }

    // Consistency insight
    if (sd > 2.0) {
      insights.push({ icon: '📊', color: 'text-rose-300', text: `Điểm số biến động mạnh (σ=${sd}) — kết quả không đều, có bài rất cao bài rất thấp. Cần tìm hiểu nguyên nhân dao động.` });
    } else if (sd < 0.5 && overall > 0) {
      insights.push({ icon: '🎯', color: 'text-emerald-300', text: `Phong độ rất ổn định (σ=${sd}) — học sinh làm bài đều tay qua các buổi, thể hiện nền tảng vững chắc.` });
    }

    // Prediction
    if (predicted > 0 && overall > 0) {
      const diff = +(predicted - overall).toFixed(1);
      if (diff > 0.5) {
        insights.push({ icon: '🔮', color: 'text-indigo-300', text: `Dự đoán buổi tới ${predicted} điểm — cao hơn mức trung bình ${diff} điểm. Kỳ vọng tiếp tục cải thiện.` });
      } else if (diff < -0.5) {
        insights.push({ icon: '🔮', color: 'text-amber-300', text: `Dự đoán buổi tới ${predicted} điểm — thấp hơn mức trung bình, cần ôn tập kỹ trước buổi học tiếp theo.` });
      }
    }

    // Rank
    if (stats.rank && stats.rank !== '#-' && filteredRankings.length > 0) {
      const rankNum = parseInt(stats.rank.replace('#', ''));
      const total = filteredRankings.length;
      const pct = Math.round((rankNum / total) * 100);
      if (rankNum === 1) {
        insights.push({ icon: '🥇', color: 'text-amber-300', text: `Xếp hạng ${stats.rank}/${total} trong lớp — dẫn đầu lớp học! Đây là thành tích xuất sắc cần được khen thưởng.` });
      } else if (pct <= 25) {
        insights.push({ icon: '🏅', color: 'text-cyan-300', text: `Xếp hạng ${stats.rank}/${total} — thuộc nhóm top 25% của lớp. Kết quả đáng khích lệ.` });
      } else if (pct >= 75) {
        insights.push({ icon: '🎯', color: 'text-amber-300', text: `Xếp hạng ${stats.rank}/${total} — ở nhóm cuối lớp (${pct}%). Cần hỗ trợ thêm để cải thiện vị trí.` });
      }
    }

    return insights;
  }

  // ── CLASS VIEW ────────────────────────────────────────────────────────────
  if (selectedClassId && !hasSelectedStudent) {
    const totalStudents = filteredRankings.length;

    if (overall > 0) {
      const cls = classifyScore(overall);
      insights.push({ icon: '📊', color: 'text-cyan-300', text: `Điểm trung bình lớp: ${overall}/10 — mức ${cls.label}. ${overall >= 7.0 ? 'Lớp đang học tốt, tiếp tục duy trì chất lượng.' : overall >= 6.0 ? 'Kết quả khá ổn, có thể cải thiện thêm.' : 'Lớp cần được hỗ trợ học thuật nhiều hơn.'}` });
    }

    if (c1 > 0 && c2 > 0) {
      const gap = +(c1 - c2).toFixed(1);
      if (Math.abs(gap) >= 1.0) {
        insights.push({ icon: '⚖️', color: 'text-amber-300', text: `Cả lớp mạnh ${c1 > c2 ? `từ vựng (${c1})` : `ngữ pháp (${c2})`} hơn ${c1 > c2 ? `ngữ pháp (${c2})` : `từ vựng (${c1})`} — ${Math.abs(gap)} điểm. Nên tập trung tiết dạy vào phần yếu hơn.` });
      }
    }

    if (att < 85) {
      insights.push({ icon: '🔴', color: 'text-rose-300', text: `Tỷ lệ chuyên cần lớp chỉ ${att}% — cần liên hệ phụ huynh những học sinh vắng nhiều để đảm bảo tiến độ chung.` });
    }

    if (trend > 0.2) {
      insights.push({ icon: '🚀', color: 'text-emerald-300', text: `Lớp đang có đà tiến bộ tốt (+${trend}/buổi). Phương pháp giảng dạy hiện tại đang phát huy hiệu quả.` });
    } else if (trend < -0.2) {
      insights.push({ icon: '📉', color: 'text-rose-300', text: `Điểm lớp đang có xu hướng giảm (${trend}/buổi). Cần xem xét lại nội dung hoặc tốc độ dạy để điều chỉnh kịp thời.` });
    }

    if (sd > 1.5) {
      insights.push({ icon: '📊', color: 'text-amber-300', text: `Điểm số cả lớp biến động (σ=${sd}) — có sự phân hóa học lực rõ ràng. Nên tổ chức nhóm học bổ trợ cho học sinh yếu.` });
    }

    if (hw < 6.0 && hw > 0) {
      insights.push({ icon: '📚', color: 'text-orange-300', text: `Điểm BTVN trung bình của lớp thấp (${hw}/10). Nên kiểm tra việc hoàn thành bài tập về nhà và nhắc nhở thêm.` });
    }

    if (totalStudents > 0) {
      const weakCount = filteredRankings.filter(r => {
        const s = Number(r.overallAvg) || Number(r.ema_level) || 0;
        return s > 0 && s < 6.0;
      }).length;
      const weakPct = Math.round((weakCount / totalStudents) * 100);
      if (weakPct >= 30) {
        insights.push({ icon: '⚠️', color: 'text-rose-300', text: `${weakPct}% học sinh trong lớp đang ở mức dưới 6.0 (${weakCount}/${totalStudents} em). Cần chú trọng hơn đến nhóm học sinh này.` });
      } else if (weakPct <= 10 && totalStudents >= 5) {
        insights.push({ icon: '🌟', color: 'text-emerald-300', text: `Chỉ ${weakPct}% học sinh dưới mức trung bình — lớp học khá đồng đều về chất lượng, đây là tín hiệu tốt.` });
      }
    }

    return insights;
  }

  // ── OVERVIEW VIEW (All Classes) ───────────────────────────────────────────
  if (!selectedClassId && !hasSelectedStudent) {
    if (overall > 0) {
      insights.push({ icon: '🏫', color: 'text-cyan-300', text: `Điểm trung bình toàn trung tâm: ${overall}/10. ${overall >= 7.5 ? 'Chất lượng giảng dạy toàn trung tâm đang rất tốt.' : overall >= 6.5 ? 'Chất lượng ở mức khá, cần tiếp tục cải thiện.' : 'Cần xem xét lại chương trình và phương pháp giảng dạy.'}` });
    }

    const total = filteredRankings.length;
    if (total > 0) {
      const excellentCount = filteredRankings.filter(r => {
        const s = Number(r.overallAvg) || Number(r.ema_level) || 0;
        return s >= 8.0;
      }).length;
      const weakCount = filteredRankings.filter(r => {
        const s = Number(r.overallAvg) || Number(r.ema_level) || 0;
        return s > 0 && s < 5.0;
      }).length;

      if (excellentCount > 0) {
        insights.push({ icon: '🌟', color: 'text-amber-300', text: `${excellentCount}/${total} học sinh đạt mức xuất sắc (≥8.0). Nhóm này có thể là học sinh nổi bật để trao học bổng hoặc phần thưởng khuyến học.` });
      }
      if (weakCount > 0) {
        const pct = Math.round((weakCount / total) * 100);
        insights.push({ icon: '🚨', color: 'text-rose-300', text: `${weakCount} học sinh (${pct}%) đang có kết quả dưới 5.0. Cần theo dõi và có kế hoạch hỗ trợ riêng cho nhóm này.` });
      }
    }

    if (att < 85 && sessions > 0) {
      insights.push({ icon: '📋', color: 'text-amber-300', text: `Tỷ lệ chuyên cần tổng thể ${att}% — cần kiểm tra và có biện pháp nâng cao ý thức đi học đúng giờ cho học sinh.` });
    }

    if (sessions > 0 && sessions < 5) {
      insights.push({ icon: '📅', color: 'text-slate-400', text: `Mới ${sessions} buổi học được ghi nhận — dữ liệu còn ít, các chỉ số sẽ chính xác hơn khi tích lũy thêm dữ liệu.` });
    }

    if (c1 > 0 && c2 > 0) {
      const gap = +(c1 - c2).toFixed(1);
      if (Math.abs(gap) >= 1.5) {
        insights.push({ icon: '⚖️', color: 'text-amber-300', text: `Toàn trung tâm: học sinh mạnh ${c1 > c2 ? 'từ vựng' : 'ngữ pháp'} hơn ${c1 > c2 ? 'ngữ pháp' : 'từ vựng'} (${Math.abs(gap)} điểm). Cân nhắc điều chỉnh tỷ trọng bài tập cho cân đối.` });
      }
    }
  }

  return insights;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const InsightCommentary: React.FC<InsightCommentaryProps> = React.memo(({
  stats, engine, hasSelectedStudent, selectedClassId, filteredRankings,
}) => {
  const [expanded, setExpanded] = useState(true);

  const insights = useMemo(() =>
    buildInsights(stats, engine, hasSelectedStudent, selectedClassId, filteredRankings),
    [stats, engine, hasSelectedStudent, selectedClassId, filteredRankings]
  );

  if (insights.length === 0) return null;

  const viewLabel = hasSelectedStudent
    ? 'Cá Nhân'
    : selectedClassId
    ? 'Theo Lớp'
    : 'Tổng Quan';

  return (
    <div className="bg-[#0c0f1e] border border-[#1e2746] rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={15} className="text-amber-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
            Nhận Xét Học Lực — Góc Nhìn {viewLabel}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {insights.length} nhận xét
          </span>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-slate-500" />
          : <ChevronDown size={14} className="text-slate-500" />
        }
      </button>

      {/* Insight List */}
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {insights.map((ins, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 bg-[#080b14] border border-[#1b2444] rounded-xl px-3.5 py-2.5 animate-cascade-1"
            >
              <span className="text-sm shrink-0 mt-0.5">{ins.icon}</span>
              <span className={`text-[11px] font-semibold leading-relaxed ${ins.color}`}>
                {ins.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
