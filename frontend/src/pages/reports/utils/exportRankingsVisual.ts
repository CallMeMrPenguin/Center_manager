import jsPDF from 'jspdf';
import { format1Dec, formatExportTimestamp } from '../../../utils';
import { getStudentTier } from '../types';
import { computeStudentOverallScore } from '../utils';
import { showToast } from '../../../components/Toast';
import { RANKINGS_COLUMN_ALIASES } from './exportRankingsExcel';

export interface ExportRankingsVisualOptions {
  className?: string;
  rankings: any[];
  visibleColumnIds?: string[];
  asPdf?: boolean;
}

interface RankingsVisualCol {
  id: string;
  header: string;
  width: number;
  getValue: (r: any, idx: number) => { text: string; bg?: string; textCol?: string; bold?: boolean };
}

export async function exportRankingsVisual({
  className = 'Tất Cả Lớp',
  rankings,
  visibleColumnIds,
  asPdf = false,
}: ExportRankingsVisualOptions): Promise<void> {
  const ALL_COLS_MAP: Record<string, RankingsVisualCol> = {
    stt: {
      id: 'stt',
      header: 'STT',
      width: 45,
      getValue: (_r, idx) => ({ text: String(idx + 1), bold: true }),
    },
    full_name: {
      id: 'full_name',
      header: 'Họ và Tên',
      width: 190,
      getValue: (r) => ({ text: `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}`, bold: true, textCol: '#0F172A' }),
    },
    class_name: {
      id: 'class_name',
      header: 'Lớp Học',
      width: 110,
      getValue: (r) => ({ text: r.class_name || 'Lớp học' }),
    },
    present_count: {
      id: 'present_count',
      header: 'Điểm Danh',
      width: 95,
      getValue: (r) => {
        const total = r.total_sessions || 0;
        const present = r.present_count || 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;
        return {
          text: `${pct}% (${present}/${total})`,
          textCol: pct < 75 ? '#BE123C' : '#0369A1',
          bold: true,
        };
      },
    },
    avg_vocab: {
      id: 'avg_vocab',
      header: 'Từ Vựng',
      width: 80,
      getValue: (r) => {
        const v = Number(r.avg_vocab ?? r.avg_check_1 ?? 0);
        return { text: v > 0 ? format1Dec(v) : '-', textCol: '#2563EB', bold: true };
      },
    },
    avg_grammar: {
      id: 'avg_grammar',
      header: 'Ngữ Pháp',
      width: 80,
      getValue: (r) => {
        const v = Number(r.avg_grammar ?? r.avg_check_2 ?? 0);
        return { text: v > 0 ? format1Dec(v) : '-', textCol: '#7C3AED', bold: true };
      },
    },
    avg_homework: {
      id: 'avg_homework',
      header: 'BTVN 1',
      width: 80,
      getValue: (r) => {
        const v = Number(r.avg_homework ?? r.avg_homework_1 ?? 0);
        return { text: v > 0 ? format1Dec(v) : '-', textCol: '#059669', bold: true };
      },
    },
    avg_homework_2: {
      id: 'avg_homework_2',
      header: 'BTVN 2',
      width: 80,
      getValue: (r) => {
        const v = Number(r.avg_homework_2 ?? 0);
        return { text: v > 0 ? format1Dec(v) : '-', textCol: '#059669', bold: true };
      },
    },
    trend_sparkline: {
      id: 'trend_sparkline',
      header: 'Xu Hướng',
      width: 90,
      getValue: (r) => {
        const s = Number(r.trend_slope || 0);
        return { text: s > 0 ? `+${format1Dec(s)}` : `${format1Dec(s)}`, textCol: s > 0 ? '#15803D' : s < 0 ? '#BE123C' : '#64748B' };
      },
    },
    rankTier: {
      id: 'rankTier',
      header: 'Hạng',
      width: 120,
      getValue: (r) => {
        const avg = computeStudentOverallScore(r);
        if (avg === 0) return { text: 'Chưa xếp hạng', textCol: '#64748B' };
        const tier = getStudentTier(avg);
        return { text: `${tier.name} (${tier.title})`, bold: true };
      },
    },
    overallAvg: {
      id: 'overallAvg',
      header: 'Đánh Giá',
      width: 120,
      getValue: (r) => {
        const avg = computeStudentOverallScore(r);
        if (avg === 0) return { text: 'Chưa có điểm', textCol: '#64748B' };
        const tier = getStudentTier(avg);
        return { text: `${tier.title} (${format1Dec(avg)})`, bold: true, bg: avg >= 8.0 ? '#DCFCE7' : '#FEF3C7' };
      },
    },
  };

  // Filter strictly by visible columns and preserve their exact order
  let activeCols: RankingsVisualCol[] = [];
  if (visibleColumnIds && visibleColumnIds.length > 0) {
    visibleColumnIds.forEach((rawId) => {
      const canonical = RANKINGS_COLUMN_ALIASES[rawId.toLowerCase().trim()] || rawId;
      if (ALL_COLS_MAP[canonical] && !activeCols.some((c) => c.id === canonical)) {
        activeCols.push(ALL_COLS_MAP[canonical]);
      }
    });
  }
  if (activeCols.length === 0) {
    const defaultIds = ['stt', 'full_name', 'class_name', 'present_count', 'avg_vocab', 'avg_grammar', 'avg_homework', 'trend_sparkline', 'rankTier', 'overallAvg'];
    activeCols = defaultIds.map((id) => ALL_COLS_MAP[id]).filter(Boolean);
  }

  const colW = activeCols.map((c) => c.width);
  const width = Math.max(900, colW.reduce((a, b) => a + b, 0));
  const colX: number[] = [0];
  for (let i = 0; i < colW.length; i++) colX.push(colX[i] + colW[i]);

  const titleH = 46, headerH = 36, rowH = 32, bottomPad = 16;
  const totalH = titleH + headerH + rankings.length * rowH + bottomPad;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(totalH * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    showToast('Trình duyệt không hỗ trợ Canvas để xuất tài liệu', 'error');
    return;
  }
  ctx.scale(scale, scale);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, totalH);
  const fontSerif = "'Times New Roman', Times, serif";

  // Banner
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, width, titleH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 16px ${fontSerif}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`BẢNG XẾP HẠNG & KẾT QUẢ HỌC TẬP - ${className.toUpperCase()}`, width / 2, titleH / 2);

  // Headers
  let currentY = titleH;
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(0, currentY, width, headerH);
  ctx.strokeStyle = '#1D4ED8';

  activeCols.forEach((col, cIdx) => {
    const x = colX[cIdx], w = colW[cIdx];
    ctx.strokeRect(x, currentY, w, headerH);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 12px ${fontSerif}`;
    ctx.textAlign = 'center';
    ctx.fillText(col.header, x + w / 2, currentY + headerH / 2);
  });
  currentY += headerH;

  // Student Rows
  rankings.forEach((r, idx) => {
    ctx.fillStyle = idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
    ctx.fillRect(0, currentY, width, rowH);

    activeCols.forEach((col, cIdx) => {
      const x = colX[cIdx], w = colW[cIdx];
      const cellData = col.getValue(r, idx);

      if (cellData.bg) {
        ctx.fillStyle = cellData.bg;
        ctx.fillRect(x, currentY, w, rowH);
      }
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(x, currentY, w, rowH);

      ctx.fillStyle = cellData.textCol || '#1E293B';
      let fontSize = 12;
      const weight = cellData.bold ? 'bold' : 'normal';
      ctx.font = `${weight} ${fontSize}px ${fontSerif}`;
      while (fontSize > 9 && ctx.measureText(cellData.text).width > w - 8) {
        fontSize -= 0.5;
        ctx.font = `${weight} ${fontSize}px ${fontSerif}`;
      }
      ctx.textAlign = 'center';
      ctx.fillText(cellData.text, x + w / 2, currentY + rowH / 2);
    });
    currentY += rowH;
  });

  // Border outline
  ctx.strokeStyle = '#312E81';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, currentY);

  const ts = formatExportTimestamp();
  const baseName = `BangXepHang_${className.replace(/\s+/g, '_')}_${ts}`;

  if (asPdf) {
    const orientation = width >= totalH ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [width, totalH] });
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', 0, 0, width, totalH);
    pdf.save(`${baseName}.pdf`);
    showToast(`Đã xuất và tải xuống tài liệu PDF: ${baseName}.pdf`, 'success');
  } else {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = Object.assign(document.createElement('a'), { download: `${baseName}.jpg`, href: dataUrl });
    link.click();

    if (navigator.clipboard && (window as any).ClipboardItem) {
      try {
        const pngDataUrl = canvas.toDataURL('image/png');
        const byteStr = window.atob(pngDataUrl.split(',')[1]);
        const bytes = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
        await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': new Blob([bytes], { type: 'image/png' }) })]);
      } catch {}
    }
    showToast(`Đã xuất và tải xuống ảnh JPG: ${baseName}.jpg`, 'success');
  }
}
