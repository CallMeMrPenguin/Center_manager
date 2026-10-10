import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ImageIcon } from 'lucide-react';
import { Table } from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatExportTimestamp } from '../../utils';
import { getColumnHeaderText } from './types';

interface ExportDropdownProps<TData> {
  table: Table<TData>;
  filename: string;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
  onExportPng?: () => void;
}

export function ExportDropdown<TData>({
  table,
  filename,
  onExportExcel,
  onExportPdf,
  onExportDocx,
  onExportPng,
}: ExportDropdownProps<TData>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleCols = table
    .getVisibleFlatColumns()
    .filter((col) => col.id !== 'select' && col.id !== '_expander');

  const getHeaders = () =>
    visibleCols.map((col) => getColumnHeaderText(col, table));

  const getExportRows = () => {
    const rows = table.getFilteredRowModel().rows;
    return rows.map((row) =>
      visibleCols.map((col) => {
        const customExport = (col.columnDef as any)?.meta?.exportValue;
        if (typeof customExport === 'function') {
          return customExport(row.original, row.index);
        }
        const val = row.getValue(col.id);
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      })
    );
  };

  const exportExcel = async () => {
    if (onExportExcel) {
      onExportExcel();
      setOpen(false);
      return;
    }
    const headers = getHeaders();
    const rows = getExportRows();

    try {
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
      if (ExcelJS && ExcelJS.Workbook) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data', {
          views: [{ showGridLines: true }],
        });

        worksheet.addTable({
          name: 'DataTable',
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
          },
          columns: headers.map((h) => ({ name: h, filterButton: true })),
          rows: rows.map((r) =>
            r.map((cellVal) => {
              if (cellVal === null || cellVal === undefined) return '';
              if (typeof cellVal === 'object' && (cellVal as any).formula) return cellVal;
              if (typeof cellVal === 'number') return cellVal;
              const num = Number(cellVal);
              if (!isNaN(num) && String(cellVal).trim() === String(num)) return num;
              return cellVal;
            })
          ),
        });

        worksheet.eachRow((row: any, rowNumber: number) => {
          const isHeader = rowNumber === 1;
          row.eachCell((cell: any, colNumber: number) => {
            cell.font = { name: 'Times New Roman', size: 13, bold: isHeader };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (typeof cell.value === 'number' && !Number.isInteger(cell.value)) {
              cell.numFmt = '0.0';
            }

            const headerName = String(headers[colNumber - 1] || '');
            if (!isHeader && (headerName.includes('Đánh Giá') || headerName.includes('Xếp Loại'))) {
              const text = String(cell.value || '');
              if (text.includes('Xuất Sắc')) {
                cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FF15803D' } };
              } else if (text.includes('Giỏi')) {
                cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FF4338CA' } };
              } else if (text.includes('Khá')) {
                cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFB45309' } };
              } else if (text.includes('Cần Cố Gắng')) {
                cell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFB91C1C' } };
              }
            }
          });
        });

        worksheet.columns.forEach((column: any, colIdx: number) => {
          let maxLen = String(headers[colIdx] || '').length;
          rows.forEach((r) => {
            const cellVal = String(r[colIdx] ?? '');
            if (cellVal.length > maxLen) maxLen = cellVal.length;
          });
          column.width = Math.max(maxLen + 5, 14);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = formatExportTimestamp();
        const finalFilename = `${filename}_${timestamp}`;
        a.download = `${finalFilename}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('ExcelJS export failed, falling back to XLSX:', err);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const timestamp = formatExportTimestamp();
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
    }
    setOpen(false);
  };

  const exportPDF = () => {
    if (onExportPdf) {
      onExportPdf();
      setOpen(false);
      return;
    }
    const headers = getHeaders();
    const rows = getExportRows();
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(12);
    doc.text(filename, 14, 15);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 82], textColor: [200, 200, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });
    doc.save(`${filename}.pdf`);
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs border-0 outline-none shrink-0"
        title="Xuất dữ liệu"
      >
        <Download size={13} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
        <span className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 xl:max-w-none xl:opacity-100 transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden inline-block">
          Xuất
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-44 bg-white dark:bg-[#181a20] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-1.5 space-y-1 animate-mac-dropdown">
          <button
            type="button"
            onClick={exportExcel}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold transition cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Excel (.xlsx)</span>
          </button>

          {onExportDocx && (
            <button
              type="button"
              onClick={() => {
                onExportDocx();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold transition cursor-pointer"
            >
              <FileText size={14} />
              <span>Word (.docx)</span>
            </button>
          )}

          {onExportPng && (
            <button
              type="button"
              onClick={() => {
                onExportPng();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold transition cursor-pointer"
            >
              <ImageIcon size={14} />
              <span>Ảnh Báo Cáo (.jpg)</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportPDF}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold transition cursor-pointer"
          >
            <FileText size={14} />
            <span>PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}
