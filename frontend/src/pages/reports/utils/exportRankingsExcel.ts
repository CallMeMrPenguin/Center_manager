import { getStudentTier } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';

export async function exportRankingsExcel({
  classes,
  selectedClassId,
  studentRankings,
  filteredRankings,
}: {
  classes: any[];
  selectedClassId: string;
  studentRankings: any[];
  filteredRankings: any[];
}) {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    // Headers without Rank ('Hạng') column
    const headers = ['STT', 'Họ và Tên', 'Lớp Học', 'Buổi Học', 'Điểm Danh %', 'Từ Vựng', 'Ngữ Pháp', 'BTVN', 'Đánh Giá'];

    const addClassSheet = (sheetName: string, items: any[]) => {
      const safeName = sheetName.replace(/[\*\?:\/\\\[\]]/g, '').slice(0, 31) || 'Lớp';
      const worksheet = workbook.addWorksheet(safeName);

      const rows = items.map((r) => {
        const present = r.present_count ?? 0;
        const total = r.total_sessions ?? 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;
        const c1 = Number(r.avg_check_1 || 0);
        const c2 = Number(r.avg_check_2 || 0);
        const hw = Number(r.avg_homework || 0);
        const valid = [c1, c2, hw].filter(v => v > 0);
        let evalStr = 'Chưa có điểm';
        if (valid.length > 0) {
          const avg = trunc1Dec(valid.reduce((a, b) => a + b, 0) / valid.length);
          let label = 'Xuất Sắc';
          if (avg >= 9.7) label = 'Xuất Chúng';
          else if (avg >= 9.4) label = 'Vượt Trội';
          else if (avg >= 9.0) label = 'Ưu Tú';
          else if (avg >= 8.5) label = 'Xuất Sắc';
          else if (avg >= 7.5) label = 'Giỏi';
          else if (avg >= 6.5) label = 'Khá';
          else if (avg >= 5.0) label = 'Trung Bình';
          else label = 'Yếu';
          evalStr = `${label} (${format1Dec(avg)})`;
        }

        return [
          { formula: 'ROW()-1' },
          `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}`,
          r.class_name || 'Lớp học',
          `${present}/${total} buổi`,
          `${pct}%`,
          c1 > 0 ? format1Dec(c1) : '-',
          c2 > 0 ? format1Dec(c2) : '-',
          hw > 0 ? format1Dec(hw) : '-',
          evalStr
        ];
      });

      if (rows.length > 0) {
        worksheet.addTable({
          name: `Table_${safeName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${Math.floor(Math.random() * 10000)}`,
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: { theme: 'TableStyleMedium13', showRowStripes: true },
          columns: headers.map(h => ({ name: h, filterButton: true })),
          rows: rows.map(r => r.map(val => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'object' && (val as any).formula) return val;
            if (typeof val === 'number') return val;
            const num = Number(val);
            if (!isNaN(num) && String(val).trim() === String(num)) return num;
            return val;
          })),
        });

        worksheet.eachRow((row, rowNumber) => {
          const isHeader = rowNumber === 1;
          row.height = isHeader ? 26 : 28;
          row.eachCell((cell) => {
            cell.font = { name: 'Times New Roman', size: 13, bold: isHeader };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (typeof cell.value === 'number' && !Number.isInteger(cell.value)) cell.numFmt = '0.0';
          });
        });

        worksheet.columns.forEach((col, colIdx) => {
          let maxLen = String(headers[colIdx] || '').length;
          rows.forEach(r => {
            const cellVal = String(r[colIdx] ?? '');
            if (cellVal.length > maxLen) maxLen = cellVal.length;
          });
          col.width = Math.max(maxLen + 5, 14);
        });
      }
    };

    if (!selectedClassId) {
      addClassSheet('Tất Cả Lớp', studentRankings);
      const groups: Record<string, any[]> = {};
      studentRankings.forEach(r => {
        const cName = r.class_name || 'Khác';
        if (!groups[cName]) groups[cName] = [];
        groups[cName].push(r);
      });
      Object.keys(groups).sort().forEach(cName => addClassSheet(cName, groups[cName]));
    } else {
      const selClassObj = classes.find(c => String(c.id) === selectedClassId);
      const name = selClassObj?.class_name || 'Bảng Xếp Hạng';
      addClassSheet(name, filteredRankings);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    a.download = `bang_xep_hang_hoc_sinh_${timestamp}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Lỗi xuất Excel xếp hạng:", err);
  }
}
