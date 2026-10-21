import { getStudentTier } from '../types';
import { format1Dec, formatExportTimestamp } from '../../../utils';
import { computeStudentOverallScore } from '../utils';

export const RANKINGS_COLUMN_ALIASES: Record<string, string> = {
  stt: 'stt',
  full_name: 'full_name',
  name: 'full_name',
  class_name: 'class_name',
  class: 'class_name',
  sessions_count: 'sessions_count',
  present_count: 'present_count',
  attendance: 'present_count',
  avg_vocab: 'avg_vocab',
  c1: 'avg_vocab',
  vocab: 'avg_vocab',
  avg_grammar: 'avg_grammar',
  c2: 'avg_grammar',
  grammar: 'avg_grammar',
  avg_homework: 'avg_homework',
  hw1: 'avg_homework',
  homework: 'avg_homework',
  avg_homework_2: 'avg_homework_2',
  hw2: 'avg_homework_2',
  homework_2: 'avg_homework_2',
  avg_mock_test: 'avg_mock_test',
  mock_test: 'avg_mock_test',
  mock: 'avg_mock_test',
  mt: 'avg_mock_test',
  trend_sparkline: 'trend_sparkline',
  trend: 'trend_sparkline',
  rankTier: 'rankTier',
  rank: 'rankTier',
  overallAvg: 'overallAvg',
  score: 'overallAvg',
  eval: 'overallAvg',
};

export async function exportRankingsExcel({
  classes,
  selectedClassId,
  studentRankings,
  filteredRankings,
  visibleColumnIds,
}: {
  classes: any[];
  selectedClassId: string;
  studentRankings: any[];
  filteredRankings: any[];
  visibleColumnIds?: string[];
}) {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();

    const ALL_COLS: Record<string, { header: string; getValue: (r: any, idx: number) => any }> = {
      stt: { header: 'STT', getValue: () => ({ formula: 'ROW()-1' }) },
      full_name: { header: 'Họ và Tên', getValue: (r) => `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}` },
      class_name: { header: 'Lớp Học', getValue: (r) => r.class_name || 'Lớp học' },
      sessions_count: { header: 'Buổi Học', getValue: (r) => `${r.present_count ?? 0}/${r.total_sessions ?? 0} buổi` },
      present_count: {
        header: 'Điểm Danh %',
        getValue: (r) => {
          const total = r.total_sessions ?? 0;
          const present = r.present_count ?? 0;
          return total > 0 ? `${Math.round((present / total) * 100)}%` : '100%';
        },
      },
      avg_vocab: {
        header: 'Từ Vựng',
        getValue: (r) => {
          const v = Number(r.avg_vocab ?? r.avg_check_1 ?? 0);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      avg_grammar: {
        header: 'Ngữ Pháp',
        getValue: (r) => {
          const v = Number(r.avg_grammar ?? r.avg_check_2 ?? 0);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      avg_homework: {
        header: 'BTVN 1',
        getValue: (r) => {
          const v = Number(r.avg_homework ?? r.avg_homework_1 ?? 0);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      avg_homework_2: {
        header: 'BTVN 2',
        getValue: (r) => {
          const v = Number(r.avg_homework_2 ?? 0);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      avg_mock_test: {
        header: 'Luyện Đề',
        getValue: (r) => {
          const v = Number(r.avg_mock_test ?? 0);
          return v > 0 ? format1Dec(v) : '-';
        },
      },
      trend_sparkline: {
        header: 'Xu Hướng',
        getValue: (r) =>
          Number(r.trend_slope || 0) > 0
            ? `+${format1Dec(Number(r.trend_slope))}/buổi`
            : `${format1Dec(Number(r.trend_slope || 0))}/buổi`,
      },
      rankTier: {
        header: 'Hạng',
        getValue: (r) => {
          const avg = computeStudentOverallScore(r);
          return avg > 0 ? `${getStudentTier(avg).name} (${getStudentTier(avg).title})` : 'Chưa xếp hạng';
        },
      },
      overallAvg: {
        header: 'Đánh Giá',
        getValue: (r) => {
          const avg = computeStudentOverallScore(r);
          return avg > 0 ? `${getStudentTier(avg).title} (${format1Dec(avg)})` : 'Chưa có điểm';
        },
      },
    };

    // Filter strictly by visible columns and preserve their exact order
    let activeColDefs: Array<{ header: string; getValue: (r: any, idx: number) => any }> = [];
    if (visibleColumnIds && visibleColumnIds.length > 0) {
      visibleColumnIds.forEach((id) => {
        const canonical = RANKINGS_COLUMN_ALIASES[id.toLowerCase().trim()] || id;
        if (ALL_COLS[canonical] && !activeColDefs.includes(ALL_COLS[canonical])) {
          activeColDefs.push(ALL_COLS[canonical]);
        }
      });
    }

    if (activeColDefs.length === 0) {
      const defaultOrder = ['stt', 'full_name', 'class_name', 'present_count', 'avg_vocab', 'avg_grammar', 'avg_homework', 'avg_mock_test', 'trend_sparkline', 'rankTier', 'overallAvg'];
      activeColDefs = defaultOrder.map((id) => ALL_COLS[id]).filter(Boolean);
    }

    const headers = activeColDefs.map((c) => c.header);

    const addClassSheet = (sheetName: string, items: any[]) => {
      const safeName = sheetName.replace(/[\*\?:\/\\\[\]]/g, '').slice(0, 31) || 'Lớp';
      const worksheet = workbook.addWorksheet(safeName);

      const rows = items.map((r, idx) => activeColDefs.map((c) => c.getValue(r, idx)));

      if (rows.length > 0) {
        worksheet.addTable({
          name: `Table_${safeName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${Math.floor(Math.random() * 10000)}`,
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: { theme: 'TableStyleMedium13', showRowStripes: true },
          columns: headers.map((h) => ({ name: h, filterButton: true })),
          rows: rows.map((r) =>
            r.map((val) => {
              if (val === null || val === undefined) return '';
              if (typeof val === 'object' && (val as any).formula) return val;
              if (typeof val === 'number') return val;
              const num = Number(val);
              if (!isNaN(num) && String(val).trim() === String(num)) return num;
              return val;
            })
          ),
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
          rows.forEach((r) => {
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
      studentRankings.forEach((r) => {
        const cName = r.class_name || 'Khác';
        if (!groups[cName]) groups[cName] = [];
        groups[cName].push(r);
      });
      Object.keys(groups).sort().forEach((cName) => addClassSheet(cName, groups[cName]));
    } else {
      const selClassObj = classes.find((c) => String(c.id) === selectedClassId);
      const name = selClassObj?.class_name || 'Bảng Xếp Hạng';
      addClassSheet(name, filteredRankings);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = formatExportTimestamp();
    a.download = `bang_xep_hang_hoc_sinh_${timestamp}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Lỗi xuất Excel xếp hạng:', err);
  }
}
