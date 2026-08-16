import React, { useState, useMemo, useCallback } from 'react';
import { FolderTree, ChevronDown, ChevronUp, Copy, Check, FileSpreadsheet } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { format1Dec, trunc1Dec } from '../../../utils';

interface SmartGroupingSectionProps {
  filteredRankings: any[];
  studentRankings: any[];
  classes: any[];
  selectedClassId: string;
}

export const SmartGroupingSection: React.FC<SmartGroupingSectionProps> = ({
  filteredRankings,
  studentRankings,
  classes,
  selectedClassId,
}) => {
  const [isGroupingSectionOpen, setIsGroupingSectionOpen] = useState(false);
  const [groupingScope, setGroupingScope] = useState<'current' | 'grade' | 'all'>('current');
  const [groupingGradeFilter, setGroupingGradeFilter] = useState('');
  const [groupingMode, setGroupingMode] = useState<'tier' | 'kmeans'>('tier');
  const [kmeansK, setKmeansK] = useState(3);
  const [copiedGroupText, setCopiedGroupText] = useState(false);

  const smartGroups = useMemo(() => {
    let pool = filteredRankings || [];
    if (pool.length === 0) return [];

    if (groupingScope === 'current' && selectedClassId) {
      pool = pool.filter(s => String(s.class_id) === selectedClassId);
    } else if (groupingScope === 'grade') {
      const currentClass = classes.find(c => String(c.id) === selectedClassId);
      const targetGrade = currentClass?.grade || groupingGradeFilter || (classes[0]?.grade ?? 'Lớp 8');
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
          themeColor: 'emerald',
          borderCls: 'border-emerald-500/40',
          headerBg: 'bg-[#102419]',
          badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotColor: '#10b981',
          ...calcGroupStats(g1Students),
          students: g1Students,
        },
        {
          id: 'tier-standard',
          title: 'Nhóm 2: Củng Cố & Chuẩn Hóa',
          subtitle: 'Đạt Chuẩn Tiến Độ (Standard)',
          pedagogyAdvice: 'Tăng cường tốc độ làm bài & kỹ năng trình bày. Hướng dẫn sửa các lỗi sai cơ bản thường gặp ở câu thông hiểu.',
          themeColor: 'blue',
          borderCls: 'border-blue-500/40',
          headerBg: 'bg-[#101b2e]',
          badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotColor: '#3b82f6',
          ...calcGroupStats(g2Students),
          students: g2Students,
        },
        {
          id: 'tier-support',
          title: 'Nhóm 3: Phụ Đạo & Nền Tảng',
          subtitle: 'Cần Hỗ Trợ Trọng Tâm (Support)',
          pedagogyAdvice: 'Hổng kiến thức nền hoặc phong độ giảm sút. Cần giảng lại lý thuyết căn bản, chia nhỏ bài tập & phụ đạo 1-1.',
          themeColor: 'amber',
          borderCls: 'border-amber-500/40',
          headerBg: 'bg-[#201810]',
          badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: '#fbbf24',
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
        { title: 'Nhóm 1: Dẫn Đầu (Top Tier)', subtitle: 'Cụm Điểm Cao Nhất', pedagogy: 'Nhóm học sinh tiếp thu vượt trội trong lớp. Giao bài tập mở rộng & thử thách tư duy.', themeColor: 'purple', borderCls: 'border-purple-500/40', headerBg: 'bg-[#18142a]', badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dotColor: '#c084fc' },
        { title: 'Nhóm 2: Trung Tâm (Core Tier)', subtitle: 'Cụm Điểm Trung Bình Khá', pedagogy: 'Lực lượng nòng cốt của lớp. Rèn luyện phương pháp làm bài & củng cố kiến thức để tiến vào nhóm dẫn đầu.', themeColor: 'blue', borderCls: 'border-blue-500/40', headerBg: 'bg-[#10182c]', badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/40', dotColor: '#60a5fa' },
        { title: 'Nhóm 3: Cần Hỗ Trợ (Focus Tier)', subtitle: 'Cụm Cần Củng Cố Nền Tảng', pedagogy: 'Cụm học sinh cần sự quan tâm đặc biệt. Ôn tập kiến thức cơ bản, sửa lỗi sai thường gặp & kèm cặp sát sao.', themeColor: 'amber', borderCls: 'border-amber-500/40', headerBg: 'bg-[#201810]', badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dotColor: '#fbbf24' },
        { title: 'Nhóm 4: Phụ Đạo Tăng Cường (Intensive Tier)', subtitle: 'Cụm Phụ Đạo 1-1', pedagogy: 'Hổng kiến thức nặng. Cần giáo viên hoặc trợ giảng hỗ trợ trực tiếp từng buổi học.', themeColor: 'rose', borderCls: 'border-rose-500/40', headerBg: 'bg-[#241216]', badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40', dotColor: '#fb7185' },
      ];

      return pairedClusters.map((pc, idx) => {
        const cfg = metaConfig[idx] || metaConfig[metaConfig.length - 1];
        return {
          id: `kmeans-group-${idx + 1}`,
          title: K === 2 && idx === 1 ? 'Nhóm 2: Cần Rèn Luyện & Hỗ Trợ' : cfg.title,
          subtitle: cfg.subtitle,
          pedagogyAdvice: cfg.pedagogy,
          themeColor: cfg.themeColor,
          borderCls: cfg.borderCls,
          headerBg: cfg.headerBg,
          badgeCls: cfg.badgeCls,
          dotColor: cfg.dotColor,
          ...calcGroupStats(pc.students),
          students: pc.students,
        };
      });
    }
  }, [filteredRankings, groupingMode, kmeansK, groupingScope, groupingGradeFilter, selectedClassId, studentRankings, classes]);

  const handleCopyGrouping = useCallback(() => {
    if (!smartGroups || smartGroups.length === 0) {
      showToast('Không có dữ liệu học sinh để phân nhóm', 'warning');
      return;
    }
    const currentClass = classes.find(c => String(c.id) === selectedClassId);
    const className = currentClass ? currentClass.class_name : 'Tất Cả Lớp';
    const modeName = groupingMode === 'tier' ? 'Theo Chuẩn Học Lực' : `Tự Động Phân Cụm K-Means (${kmeansK} Nhóm)`;
    let text = `=== KẾT QUẢ GỢI Ý PHÂN NHÓM HỌC TẬP ===\nLớp: ${className} | Tổng số: ${filteredRankings.length} học sinh\nPhương pháp: ${modeName}\n\n`;
    smartGroups.forEach(g => {
      text += `[${g.title.toUpperCase()}] (${g.students.length} học sinh | EMA TB: ${g.avgEma} | SD: ${g.groupSd})\nMục tiêu: ${g.pedagogyAdvice}\n`;
      if (g.students.length === 0) text += `  (Chưa có học sinh)\n`;
      else g.students.forEach((s, idx) => {
        const ema = s.ema_level ? format1Dec(Number(s.ema_level)) : '-';
        const slope = Number(s.trend_slope || 0);
        const trendStr = slope > 0 ? `+${format1Dec(slope)} (Tăng)` : slope < 0 ? `${format1Dec(slope)} (Giảm)` : 'Ổn định';
        const pi = s.performance_index ? format1Dec(Number(s.performance_index)) : '-';
        const nick = s.nickname ? ` (${s.nickname})` : '';
        text += `  ${idx + 1}. ${s.full_name}${nick} | EMA: ${ema} | Trend: ${trendStr} | PI: ${pi} | ${s.class_name || ''}\n`;
      });
      text += `\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopiedGroupText(true);
      showToast('Đã sao chép danh sách phân nhóm vào clipboard!', 'success');
      setTimeout(() => setCopiedGroupText(false), 2500);
    }).catch(() => showToast('Không thể sao chép vào clipboard', 'error'));
  }, [smartGroups, classes, selectedClassId, groupingMode, kmeansK, filteredRankings]);

  const handleExportGroupingExcel = useCallback(async () => {
    if (!smartGroups || smartGroups.length === 0) {
      showToast('Không có dữ liệu để xuất Excel', 'warning');
      return;
    }
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const currentClass = classes.find(c => String(c.id) === selectedClassId);
      const className = currentClass ? currentClass.class_name : 'Toan_Lop';
      const safeClassName = className.replace(/[\*\?:\/\\\[\]]/g, '').slice(0, 25) || 'Lop';
      const worksheet = workbook.addWorksheet(`Phân Nhóm ${safeClassName}`);
      const headers = ['Nhóm Học Tập', 'STT', 'Họ và Tên', 'Biệt Danh', 'Lớp Học', 'Điểm EMA', 'Tốc Độ Tiến Bộ (Trend)', 'Hiệu Suất (PI)', 'Check 1', 'Check 2', 'Homework', 'Định Hướng Sư Phạm'];
      const rows: any[] = [];
      smartGroups.forEach(g => {
        g.students.forEach((s, idx) => {
          const c1 = Number(s.avg_check_1 || 0);
          const c2 = Number(s.avg_check_2 || 0);
          const hw = Number(s.avg_homework || 0);
          rows.push([
            g.title, idx + 1, s.full_name, s.nickname || '', s.class_name || '',
            s.ema_level ? Number(format1Dec(Number(s.ema_level))) : '-',
            Number(s.trend_slope || 0) > 0 ? `+${format1Dec(Number(s.trend_slope))}` : format1Dec(Number(s.trend_slope || 0)),
            s.performance_index ? Number(format1Dec(Number(s.performance_index))) : '-',
            c1 > 0 ? Number(format1Dec(c1)) : '-', c2 > 0 ? Number(format1Dec(c2)) : '-', hw > 0 ? Number(format1Dec(hw)) : '-',
            g.pedagogyAdvice
          ]);
        });
      });

      if (rows.length > 0) {
        worksheet.addTable({
          name: `Table_Grouping_${Math.floor(Math.random() * 10000)}`,
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: { theme: 'TableStyleMedium13', showRowStripes: true },
          columns: headers.map(h => ({ name: h, filterButton: true })),
          rows,
        });
        worksheet.eachRow((row, rowNumber) => {
          const isHeader = rowNumber === 1;
          row.eachCell(cell => {
            cell.font = { name: 'Times New Roman', size: 12, bold: isHeader };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
        worksheet.columns.forEach(column => {
          let maxLength = 10;
          column.eachCell?.({ includeEmpty: true }, cell => {
            const length = cell.value ? String(cell.value).length : 0;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 4, 45);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phan_nhom_hoc_tap_${safeClassName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Xuất file Excel phân nhóm thành công!', 'success');
      }
    } catch {
      showToast('Có lỗi khi xuất file Excel', 'error');
    }
  }, [smartGroups, classes, selectedClassId]);

  return (
    <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-6 animate-cascade-3">
      <div onClick={() => setIsGroupingSectionOpen(!isGroupingSectionOpen)} className="flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none border-b border-[#161f33] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FolderTree size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              GỢI Ý PHÂN NHÓM HỌC TẬP THÔNG MINH
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Tự động chia học sinh thành các nhóm năng lực để giảng dạy phân hóa và giao bài tập phù hợp.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg text-slate-400 hover:text-white">
            {isGroupingSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isGroupingSectionOpen && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e1322] p-3 rounded-xl border border-[#1e2744]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Chế độ:</span>
              <button
                type="button"
                onClick={() => setGroupingMode('tier')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${groupingMode === 'tier' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Theo Chuẩn Học Lực (3 Nhóm)
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('kmeans')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${groupingMode === 'kmeans' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Tự Động K-Means Clustering
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGrouping}
                className="px-3 py-1.5 rounded-lg bg-[#1a233a] hover:bg-[#253252] text-slate-200 border border-[#2d3d66] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedGroupText ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedGroupText ? 'Đã chép' : 'Sao chép'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportGroupingExcel}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <FileSpreadsheet size={13} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {smartGroups.map(g => (
              <div key={g.id} className={`rounded-xl border ${g.borderCls} bg-[#0c101c] overflow-hidden flex flex-col justify-between shadow-lg`}>
                <div className={`p-4 ${g.headerBg} border-b border-white/5`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white">{g.title}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${g.badgeCls}`}>
                      {g.students.length} HS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{g.pedagogyAdvice}</p>
                </div>
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {g.students.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                      <span className="font-bold text-slate-200">{idx + 1}. {s.full_name}</span>
                      <span className="font-mono text-slate-400">{s.ema_level ? format1Dec(Number(s.ema_level)) : '-'}</span>
                    </div>
                  ))}
                  {g.students.length === 0 && <span className="text-xs text-slate-500 italic block text-center">Chưa có học sinh</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
