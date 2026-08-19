import React, { useState, useMemo, useCallback } from 'react';
import { FolderTree, ChevronDown, ChevronUp, Copy, Check, FileSpreadsheet } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { GroupCardItem } from './GroupCardItem';
import { computeSmartGroups } from '../utils/computeSmartGroups';
import { showToast } from '../../../components/Toast';
import { format1Dec } from '../../../utils';

interface SmartGroupingSectionProps {
  filteredRankings: any[];
  studentRankings: any[];
  classes: any[];
  selectedClassId: string;
  onSelectRankingStudent?: (studentId: number) => void;
}

export const SmartGroupingSection: React.FC<SmartGroupingSectionProps> = ({
  filteredRankings,
  studentRankings,
  classes,
  selectedClassId,
  onSelectRankingStudent,
}) => {
  const [isGroupingSectionOpen, setIsGroupingSectionOpen] = useState(false);
  const [groupingScope, setGroupingScope] = useState<'current' | 'grade' | 'all'>('current');
  const [groupingGradeFilter, setGroupingGradeFilter] = useState('');
  const [groupingMode, setGroupingMode] = useState<'tier' | 'kmeans'>('tier');
  const [kmeansK, setKmeansK] = useState(3);
  const [copiedGroupText, setCopiedGroupText] = useState(false);

  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    classes.forEach(c => { if (c.grade) gradesSet.add(c.grade); });
    return Array.from(gradesSet).sort();
  }, [classes]);

  const smartGroups = useMemo(() => {
    return computeSmartGroups({
      studentRankings,
      selectedClassId,
      groupingScope,
      groupingGradeFilter,
      classes,
      groupingMode,
      kmeansK,
    });
  }, [studentRankings, selectedClassId, groupingScope, groupingGradeFilter, classes, groupingMode, kmeansK]);

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
      else g.students.forEach((s: any, idx: number) => {
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
      const headers = ['Nhóm Học Tập', 'STT', 'Họ và Tên', 'Biệt Danh', 'Lớp Học', 'Điểm EMA', 'Tốc Độ Tiến Bộ (Trend)', 'Hiệu Suất (PI)', 'Từ Vựng', 'Ngữ Pháp', 'BTVN', 'Định Hướng Sư Phạm'];
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
      {/* Header Bar */}
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
          {/* Scope, Algorithm & Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e1322] p-4 rounded-xl border border-[#1e2744]">
            <div className="flex flex-wrap items-center gap-4">
              {/* Scope Selector */}
              <div className="flex items-center gap-1.5 bg-[#090d16] p-1 rounded-xl border border-[#182236] text-xs font-bold">
                <span className="text-[10px] uppercase font-black text-slate-400 px-2">Phạm Vi:</span>
                <button
                  type="button"
                  onClick={() => setGroupingScope('current')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${groupingScope === 'current' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Lớp Hiện Tại
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingScope('grade')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${groupingScope === 'grade' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Toàn Bộ Khối
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingScope('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${groupingScope === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Toàn Trung Tâm
                </button>
              </div>

              {/* Grade Selector when groupingScope === 'grade' */}
              {groupingScope === 'grade' && availableGrades.length > 0 && (
                <div className="w-36">
                  <CustomSelect
                    value={groupingGradeFilter}
                    onChange={(val) => setGroupingGradeFilter(String(val))}
                    options={availableGrades.map(g => ({ value: g, label: g }))}
                  />
                </div>
              )}

              {/* Algorithm Mode */}
              <div className="flex items-center gap-1.5 bg-[#090d16] p-1 rounded-xl border border-[#182236] text-xs font-bold">
                <span className="text-[10px] uppercase font-black text-slate-400 px-2">Thuật Toán:</span>
                <button
                  type="button"
                  onClick={() => setGroupingMode('tier')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${groupingMode === 'tier' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Theo Chuẩn Học Lực (3 Nhóm)
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingMode('kmeans')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${groupingMode === 'kmeans' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Tự Động K-Means
                </button>

                {groupingMode === 'kmeans' && (
                  <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                    {[2, 3, 4].map(k => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKmeansK(k)}
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${kmeansK === k ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export Actions */}
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

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {smartGroups.map(g => (
              <GroupCardItem
                key={g.id}
                group={g}
                onSelectRankingStudent={onSelectRankingStudent}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
