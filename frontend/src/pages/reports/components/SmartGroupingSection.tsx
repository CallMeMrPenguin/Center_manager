import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, FileSpreadsheet } from 'lucide-react';
import { GroupCardItem } from './GroupCardItem';
import { computeSmartGroups } from '../utils/computeSmartGroups';
import { showToast } from '../../../components/Toast';
import { format1Dec, formatExportTimestamp } from '../../../utils';

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
  const [copiedGroupText, setCopiedGroupText] = useState(false);

  const smartGroups = useMemo(() => {
    return computeSmartGroups({
      studentRankings,
      selectedClassId,
    });
  }, [studentRankings, selectedClassId]);

  const handleCopyGrouping = useCallback(() => {
    if (!smartGroups || smartGroups.length === 0) {
      showToast('Không có dữ liệu học sinh để phân nhóm', 'warning');
      return;
    }
    const currentClass = classes.find(c => String(c.id) === selectedClassId);
    const className = currentClass ? currentClass.class_name : 'Tất Cả Lớp';
    let text = `=== KẾT QUẢ GỢI Ý PHÂN NHÓM HỌC TẬP ===\nLớp: ${className} | Tổng số: ${filteredRankings.length} học sinh\nPhương pháp: Theo Học Lực\n\n`;
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
  }, [smartGroups, classes, selectedClassId, filteredRankings]);

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
        a.download = `phan_nhom_hoc_tap_${safeClassName}_${formatExportTimestamp()}.xlsx`;
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

  if (!selectedClassId || selectedClassId === 'all') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5 animate-cascade-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 select-none pb-1 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Phân Nhóm
          </h3>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyGrouping}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1a233a] dark:hover:bg-[#253252] text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            {copiedGroupText ? <Check size={13} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedGroupText ? 'Đã chép' : 'Sao chép'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportGroupingExcel}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet size={13} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* 5 Group Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {smartGroups.map(g => (
          <GroupCardItem
            key={g.id}
            group={g}
            onSelectRankingStudent={onSelectRankingStudent}
          />
        ))}
      </div>
    </div>
  );
};
