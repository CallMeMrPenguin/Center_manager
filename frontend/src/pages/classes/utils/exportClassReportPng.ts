import jsPDF from 'jspdf';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { ClassItem, AttendanceRecord } from '../types';
import { trunc1Dec, format1Dec, formatExportTimestamp } from '../../../utils';
import {
  formatTopicString,
  getScoreStyle,
  wrapStudentNames,
  wrapHeaderTopic,
  REPORT_COLUMN_ALIASES,
  getFailingStudents,
  computeStudentFails,
  ExportCol,
  buildClassExportColumnsMap,
} from './reportExportHelpers';

export interface ExportClassReportPngParams {
  classItem: ClassItem;
  attendanceDate: string;
  records: AttendanceRecord[];
  testConfig?: any;
  visibleColumns?: string[];
  asPdf?: boolean;
  thresholds: {
    check_1?: number;
    check_2?: number;
    homework?: number;
    homework_2?: number;
    mock_test?: number;
    divergence?: number;
  };
}

export async function exportClassReportPng({
  classItem,
  attendanceDate,
  records,
  testConfig,
  visibleColumns,
  asPdf = false,
  thresholds,
}: ExportClassReportPngParams): Promise<void> {
  const className = classItem?.class_name || `Lop_${classItem.id}`;

  let cfg = testConfig;
  if (!cfg && classItem?.id && attendanceDate) {
    try {
      const res = await api.getSessionTestConfig(classItem.id, attendanceDate);
      cfg = res?.test_config || null;
    } catch {
      cfg = null;
    }
  }

  const c1Topic = formatTopicString(cfg?.check_1);
  const c2Topic = formatTopicString(cfg?.check_2);

  // 1. Calculate class statistics
  const sumScores = (key: keyof AttendanceRecord) => {
    let sum = 0, count = 0;
    records.forEach((r) => {
      if (r.status === 'Vắng mặt') return;
      const v = Number(r[key]);
      if (!isNaN(v) && v > 0) { sum += v; count++; }
    });
    return count > 0 ? trunc1Dec(sum / count) : 0;
  };

  const aC1 = sumScores('check_1'), aC2 = sumScores('check_2');
  const aH1 = sumScores('homework'), aH2 = sumScores('homework_2'), aMt = sumScores('mock_test');

  const tC1 = (thresholds.check_1 !== undefined && thresholds.check_1 > 0) ? trunc1Dec(thresholds.check_1) : aC1;
  const tC2 = (thresholds.check_2 !== undefined && thresholds.check_2 > 0) ? trunc1Dec(thresholds.check_2) : aC2;
  const tHw1 = (thresholds.homework !== undefined && thresholds.homework > 0) ? trunc1Dec(thresholds.homework) : aH1;
  const tHw2 = (thresholds.homework_2 !== undefined && thresholds.homework_2 > 0) ? trunc1Dec(thresholds.homework_2) : aH2;
  const tMt = (thresholds.mock_test !== undefined && thresholds.mock_test > 0) ? trunc1Dec(thresholds.mock_test) : aMt;

  const validAvgs = [tC1, tC2].filter((v) => v > 0);
  const checkComb = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;
  const diffHw = (tHw1 > 0 && checkComb > 0) ? trunc1Dec(Math.abs(tHw1 - checkComb)) : 0;

  // Failing students (Điểm > 8.0 dù thấp hơn trung bình vẫn là ĐẠT)
  const bC1 = getFailingStudents(records, 'check_1', tC1);
  const bC2 = getFailingStudents(records, 'check_2', tC2);
  const bH1 = getFailingStudents(records, 'homework', tHw1);
  const bH2 = getFailingStudents(records, 'homework_2', tHw2);
  const bMt = getFailingStudents(records, 'mock_test', tMt);

  const summaryRows = [
    { label: 'Check 1', thresh: tC1, students: bC1 },
    { label: 'Check 2', thresh: tC2, students: bC2 },
    { label: 'BTVN', thresh: tHw1, students: bH1 },
  ];
  if (tHw2 > 0 || bH2.length > 0) summaryRows.push({ label: 'BTVN 2', thresh: tHw2, students: bH2 });
  if (tMt > 0 || bMt.length > 0) summaryRows.push({ label: 'Luyện Đề', thresh: tMt, students: bMt });

  let totalSummaryH = 0;
  const preparedSummary = summaryRows.map((s) => {
    const lines = wrapStudentNames(s.students, 95);
    const rowH = Math.max(34, lines.length * 20 + 12);
    totalSummaryH += rowH;
    return { ...s, lines, rowH };
  });

  const c1Lines = wrapHeaderTopic(c1Topic, 26);
  const c2Lines = wrapHeaderTopic(c2Topic, 26);

  // 2. Build column definitions and filter strictly by visibleColumns in exact order
  const ALL_COLS_MAP = buildClassExportColumnsMap({
    c1Lines,
    c2Lines,
    tC1,
    tC2,
    tHw1,
    tHw2,
    tMt,
    diffHw,
  });

  // Resolve active columns strictly matching visibleColumns order
  let activeCols: ExportCol[] = [];
  if (visibleColumns && visibleColumns.length > 0) {
    visibleColumns.forEach((rawId) => {
      const canonical = REPORT_COLUMN_ALIASES[rawId.toLowerCase().trim()] || rawId;
      if (ALL_COLS_MAP[canonical] && !activeCols.some((c) => c.id === canonical)) {
        activeCols.push(ALL_COLS_MAP[canonical]);
      }
    });
  }
  if (activeCols.length === 0) {
    const defaultIds = ['stt', 'student_name', 'status', 'check_1', 'check_2', 'homework', 'homework_2', 'mock_test', 'score_discrepancy', 'need_improvement'];
    activeCols = defaultIds.map((id) => ALL_COLS_MAP[id]).filter(Boolean);
  }

  // Calculate layout widths
  const colW = activeCols.map((c) => c.width);
  const width = Math.max(900, colW.reduce((a, b) => a + b, 0));
  const colX: number[] = [0];
  for (let i = 0; i < colW.length; i++) colX.push(colX[i] + colW[i]);

  const maxSubLines = Math.max(...activeCols.map((c) => (c.subLines ? c.subLines.length : 0)));
  const headerH = maxSubLines >= 2 ? 66 : maxSubLines === 1 ? 52 : 36;
  const titleH = 46;
  const hasTopic = Boolean(c1Topic || c2Topic);
  const topicH = hasTopic ? 32 : 0;
  const rowH = 32, avgH = 34, gapH = 14, bottomPad = 16;
  const totalH = titleH + topicH + headerH + records.length * rowH + avgH + gapH + totalSummaryH + bottomPad;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(totalH * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    showToast('Trình duyệt không hỗ trợ Canvas để xuất ảnh', 'error');
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
  ctx.fillText(`BÁO CÁO ĐIỂM DANH & ĐIỂM BÀI HỌC - ${className.toUpperCase()} (${attendanceDate})`, width / 2, titleH / 2);

  let currentY = titleH;
  if (hasTopic) {
    ctx.fillStyle = '#EFF6FF';
    ctx.fillRect(0, currentY, width, topicH);
    ctx.strokeStyle = '#BFDBFE';
    ctx.strokeRect(0, currentY, width, topicH);
    ctx.fillStyle = '#1E40AF';
    ctx.font = `bold 12px ${fontSerif}`;
    const tParts = [c1Topic ? `Check 1: ${c1Topic}` : '', c2Topic ? `Check 2: ${c2Topic}` : ''].filter(Boolean);
    ctx.fillText(`Nội dung kiểm tra: ${tParts.join('   —   ')}`, width / 2, currentY + topicH / 2);
    currentY += topicH;
  }

  // Headers
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(0, currentY, width, headerH);
  ctx.strokeStyle = '#1D4ED8';

  activeCols.forEach((col, cIdx) => {
    const x = colX[cIdx], w = colW[cIdx];
    ctx.strokeRect(x, currentY, w, headerH);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    if (col.subLines && col.subLines.length > 0) {
      const blockH = 14 + col.subLines.length * 13;
      let textY = currentY + (headerH - blockH) / 2 + 10;
      ctx.font = `bold 12px ${fontSerif}`;
      ctx.fillText(col.header, x + w / 2, textY);
      ctx.font = `normal 10px ${fontSerif}`;
      col.subLines.forEach((l) => {
        textY += 13;
        ctx.fillText(l, x + w / 2, textY);
      });
    } else {
      ctx.font = `bold 12px ${fontSerif}`;
      ctx.fillText(col.header, x + w / 2, currentY + headerH / 2);
    }
  });
  currentY += headerH;

  // Student Rows
  records.forEach((r, idx) => {
    const isAbsent = r.status === 'Vắng mặt';
    const nC1 = Number(r.check_1), nC2 = Number(r.check_2), nH1 = Number(r.homework);
    let diffStr = '-';
    if (!isAbsent && !isNaN(nH1) && nH1 > 0) {
      const vC1 = !isNaN(nC1) && nC1 > 0, vC2 = !isNaN(nC2) && nC2 > 0;
      if (vC1 && vC2) diffStr = format1Dec(Math.abs(nH1 - (nC1 + nC2) / 2));
      else if (vC1) diffStr = format1Dec(Math.abs(nH1 - nC1));
      else if (vC2) diffStr = format1Dec(Math.abs(nH1 - nC2));
    }

    const fails = computeStudentFails(r, tC1, tC2, tHw1, tHw2, tMt);

    ctx.fillStyle = idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
    ctx.fillRect(0, currentY, width, rowH);

    activeCols.forEach((col, cIdx) => {
      const x = colX[cIdx], w = colW[cIdx];
      const cellData = col.getValue(r, idx, fails, isAbsent, diffStr);

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

  // Average Row
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(0, currentY, width, avgH);
  ctx.fillStyle = '#92400E';
  ctx.font = `bold 12px ${fontSerif}`;
  ctx.strokeStyle = '#CBD5E1';

  activeCols.forEach((col, cIdx) => {
    const x = colX[cIdx], w = colW[cIdx];
    ctx.strokeRect(x, currentY, w, avgH);
    const avgText = String(col.getAvg());
    ctx.textAlign = 'center';
    ctx.fillText(avgText, x + w / 2, currentY + avgH / 2);
  });
  currentY += avgH + gapH;

  // Summary Rows
  const halfW = Math.min(310, Math.floor(width * 0.35));
  const restW = width - halfW;
  preparedSummary.forEach((s) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, currentY, width, s.rowH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.strokeRect(0, currentY, halfW, s.rowH);
    ctx.strokeRect(halfW, currentY, restW, s.rowH);

    ctx.fillStyle = '#7F1D1D';
    ctx.font = `bold 12px ${fontSerif}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${s.label} dưới TB (< ${s.thresh > 0 ? format1Dec(s.thresh) : '-'})`, 14, currentY + s.rowH / 2);

    ctx.fillStyle = '#1E1E2F';
    ctx.font = `bold 12px ${fontSerif}`;
    if (s.lines.length === 1) {
      ctx.fillText(s.lines[0], halfW + 14, currentY + s.rowH / 2);
    } else {
      const startY = currentY + 18;
      s.lines.forEach((line, lIdx) => {
        ctx.fillText(line, halfW + 14, startY + lIdx * 20);
      });
    }
    currentY += s.rowH;
  });

  // Border outline
  ctx.strokeStyle = '#312E81';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, currentY);

  const ts = formatExportTimestamp();
  const baseName = `ClassReport_${className}_${attendanceDate}_${ts}`;

  // 3. Save as PDF or PNG/JPG
  if (asPdf) {
    const orientation = width >= totalH ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [width, totalH] });
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', 0, 0, width, totalH);
    pdf.save(`${baseName}.pdf`);
    showToast(`Đã xuất và tải xuống tài liệu PDF: ${baseName}.pdf`, 'success');
  } else {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const filename = `${baseName}.jpg`;
    const link = Object.assign(document.createElement('a'), { download: filename, href: dataUrl });
    link.click();

    let savedName = filename;
    try {
      const res = await api.saveExportPng(classItem.id, attendanceDate, dataUrl);
      if (res?.filename) savedName = res.filename;
    } catch (err) {
      console.warn('Could not save JPG to workspace_files:', err);
    }

    if (navigator.clipboard && (window as any).ClipboardItem) {
      try {
        const pngDataUrl = canvas.toDataURL('image/png');
        const byteStr = window.atob(pngDataUrl.split(',')[1]);
        const bytes = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
        await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': new Blob([bytes], { type: 'image/png' }) })]);
      } catch {}
    }
    showToast(`Đã xuất và tải xuống ảnh JPG: ${savedName}`, 'success');
  }
}
