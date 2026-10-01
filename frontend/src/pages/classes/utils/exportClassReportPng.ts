import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { ClassItem, AttendanceRecord } from '../types';
import { trunc1Dec, format1Dec } from '../../../utils';

export interface ExportClassReportPngParams {
  classItem: ClassItem;
  attendanceDate: string;
  records: AttendanceRecord[];
  testConfig?: any;
  thresholds: {
    check_1?: number;
    check_2?: number;
    homework?: number;
    homework_2?: number;
    mock_test?: number;
    divergence?: number;
  };
}

function formatTopicString(cfg: any): string {
  if (!cfg || typeof cfg !== 'object') return '';
  const skillLabels: Record<string, string> = {
    vocab: 'Từ vựng', grammar: 'Ngữ pháp', mixed: 'Tổng hợp',
    mock_test: 'Luyện đề', reading: 'Đọc hiểu', listening: 'Nghe',
    speaking: 'Nói', writing: 'Viết',
  };
  const skillName = skillLabels[cfg.skill] || (cfg.skill ? String(cfg.skill) : '');
  const units = Array.isArray(cfg.units) ? cfg.units.join(', ') : (cfg.units || '');
  const topic = (cfg.topic || cfg.grammar_topic || '').replace(/\|/g, '-').trim();
  const detail = [units, topic].filter(Boolean).join(' - ');
  return (skillName && detail) ? `${skillName}: ${detail}` : (detail || skillName);
}

export async function exportClassReportPng({
  classItem,
  attendanceDate,
  records,
  testConfig,
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

  // 1. Calculate statistics
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

  // Failing students
  const getFails = (key: keyof AttendanceRecord, thresh: number) =>
    records.filter((r) => r.status !== 'Vắng mặt' && Number(r[key]) > 0 && thresh > 0 && Number(r[key]) < thresh).map((r) => r.student_name);

  const bC1 = getFails('check_1', tC1), bC2 = getFails('check_2', tC2), bH1 = getFails('homework', tHw1);
  const bH2 = getFails('homework_2', tHw2), bMt = getFails('mock_test', tMt);

  const summaryRows = [
    { label: 'Check 1', thresh: tC1, students: bC1 },
    { label: 'Check 2', thresh: tC2, students: bC2 },
    { label: 'BTVN', thresh: tHw1, students: bH1 },
  ];
  if (tHw2 > 0 || bH2.length > 0) summaryRows.push({ label: 'BTVN 2', thresh: tHw2, students: bH2 });
  if (tMt > 0 || bMt.length > 0) summaryRows.push({ label: 'Luyện Đề', thresh: tMt, students: bMt });

  // Wrap student names cleanly by comma to prevent any text overflow
  function wrapStudentNames(names: string[], maxChars: number = 95): string[] {
    if (!names.length) return ['Không có (Tất cả đạt)'];
    const lines: string[] = [];
    let cur = '';
    for (const name of names) {
      const test = cur ? `${cur}, ${name}` : name;
      if (test.length > maxChars && cur) { lines.push(cur); cur = name; }
      else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  let totalSummaryH = 0;
  const preparedSummary = summaryRows.map((s) => {
    const lines = wrapStudentNames(s.students, 95);
    const rowH = Math.max(34, lines.length * 20 + 12);
    totalSummaryH += rowH;
    return { ...s, lines, rowH };
  });

  // Wrap header topics into clean multi-line text without cutting off with dots
  function wrapHeaderTopic(text: string, maxChars: number = 24): string[] {
    if (!text) return [];
    const lines: string[] = [];
    let cur = '';
    for (const w of text.split(' ')) {
      const test = cur ? `${cur} ${w}` : w;
      if (test.length > maxChars && cur) { lines.push(cur); cur = w; }
      else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines.length === 1 ? [`(${lines[0]})`] : lines.map((l, i) => (i === 0 ? `(${l}` : (i === lines.length - 1 ? `${l})` : l)));
  }

  const c1Lines = wrapHeaderTopic(c1Topic, 24);
  const c2Lines = wrapHeaderTopic(c2Topic, 24);
  const maxTopicLines = Math.max(c1Lines.length, c2Lines.length);

  // 2. Direct Canvas 2D Rendering
  const scale = 2, width = 1200;
  const colW = [45, 170, 80, 165, 165, 70, 70, 75, 75, 285];
  const colX: number[] = [0];
  for (let i = 0; i < colW.length; i++) colX.push(colX[i] + colW[i]);

  const titleH = 46, hasTopic = Boolean(c1Topic || c2Topic), topicH = hasTopic ? 32 : 0;
  const headerH = maxTopicLines >= 2 ? 66 : 52, rowH = 32, avgH = 34, gapH = 14, bottomPad = 16;
  const totalH = titleH + topicH + headerH + records.length * rowH + avgH + gapH + totalSummaryH + bottomPad;

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
  ctx.fillStyle = '#1E1B4B';
  ctx.fillRect(0, 0, width, titleH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 16px ${fontSerif}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`BÁO CÁO ĐIỂM DANH & ĐIỂM BÀI HỌC - ${className.toUpperCase()} (${attendanceDate})`, width / 2, titleH / 2);

  let currentY = titleH;
  if (hasTopic) {
    ctx.fillStyle = '#EEF2FF';
    ctx.fillRect(0, currentY, width, topicH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.strokeRect(0, currentY, width, topicH);
    ctx.fillStyle = '#312E81';
    ctx.font = `bold 12px ${fontSerif}`;
    const tParts = [c1Topic ? `Check 1: ${c1Topic}` : '', c2Topic ? `Check 2: ${c2Topic}` : ''].filter(Boolean);
    ctx.fillText(`Nội dung kiểm tra: ${tParts.join('   —   ')}`, width / 2, currentY + topicH / 2);
    currentY += topicH;
  }

  // Headers
  const hdrs = ['STT', 'Họ và Tên', 'Điểm Danh', 'Check 1', 'Check 2', 'BTVN 1', 'BTVN 2', 'Luyện Đề', 'Độ Lệch', 'Cần Cố Gắng (Dưới TB)'];
  ctx.fillStyle = '#312E81';
  ctx.fillRect(0, currentY, width, headerH);
  ctx.strokeStyle = '#CBD5E1';

  for (let c = 0; c < 10; c++) {
    const x = colX[c], w = colW[c];
    ctx.strokeRect(x, currentY, w, headerH);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    if (c === 3 && c1Lines.length > 0) {
      const totalBlockH = 14 + c1Lines.length * 13;
      let textY = currentY + (headerH - totalBlockH) / 2 + 10;
      ctx.font = `bold 12px ${fontSerif}`;
      ctx.fillText('Check 1', x + w / 2, textY);
      ctx.font = `normal 10px ${fontSerif}`;
      for (const line of c1Lines) {
        textY += 13;
        ctx.fillText(line, x + w / 2, textY);
      }
    } else if (c === 4 && c2Lines.length > 0) {
      const totalBlockH = 14 + c2Lines.length * 13;
      let textY = currentY + (headerH - totalBlockH) / 2 + 10;
      ctx.font = `bold 12px ${fontSerif}`;
      ctx.fillText('Check 2', x + w / 2, textY);
      ctx.font = `normal 10px ${fontSerif}`;
      for (const line of c2Lines) {
        textY += 13;
        ctx.fillText(line, x + w / 2, textY);
      }
    } else {
      ctx.font = `bold 12px ${fontSerif}`;
      ctx.fillText(hdrs[c], x + w / 2, currentY + headerH / 2);
    }
  }
  currentY += headerH;

  // Student Rows
  records.forEach((r, idx) => {
    const isAbsent = r.status === 'Vắng mặt';
    const nC1 = Number(r.check_1), nC2 = Number(r.check_2), nH1 = Number(r.homework), nH2 = Number(r.homework_2), nMt = Number(r.mock_test);
    let diffStr = '-';
    if (!isAbsent && !isNaN(nH1) && nH1 > 0) {
      const vC1 = !isNaN(nC1) && nC1 > 0, vC2 = !isNaN(nC2) && nC2 > 0;
      if (vC1 && vC2) diffStr = format1Dec(Math.abs(nH1 - (nC1 + nC2) / 2));
      else if (vC1) diffStr = format1Dec(Math.abs(nH1 - nC1));
      else if (vC2) diffStr = format1Dec(Math.abs(nH1 - nC2));
    }

    const fails: string[] = [];
    if (!isNaN(nC1) && nC1 > 0 && tC1 > 0 && nC1 < tC1) fails.push('Check 1');
    if (!isNaN(nC2) && nC2 > 0 && tC2 > 0 && nC2 < tC2) fails.push('Check 2');
    if (!isNaN(nH1) && nH1 > 0 && tHw1 > 0 && nH1 < tHw1) fails.push('BTVN 1');
    if (!isNaN(nH2) && nH2 > 0 && tHw2 > 0 && nH2 < tHw2) fails.push('BTVN 2');
    if (!isNaN(nMt) && nMt > 0 && tMt > 0 && nMt < tMt) fails.push('Luyện Đề');

    ctx.fillStyle = idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
    ctx.fillRect(0, currentY, width, rowH);

    const rVals = [
      String(idx + 1), r.student_name, r.status || 'Có mặt',
      !isNaN(nC1) && nC1 > 0 ? format1Dec(nC1) : '-',
      !isNaN(nC2) && nC2 > 0 ? format1Dec(nC2) : '-',
      !isNaN(nH1) && nH1 > 0 ? format1Dec(nH1) : '-',
      !isNaN(nH2) && nH2 > 0 ? format1Dec(nH2) : '-',
      !isNaN(nMt) && nMt > 0 ? format1Dec(nMt) : '-',
      diffStr,
      isAbsent ? 'Vắng mặt' : (fails.length > 0 ? `Cần cố gắng (${fails.join(', ')})` : 'Đạt yêu cầu'),
    ];

    for (let c = 0; c < 10; c++) {
      const x = colX[c], w = colW[c];
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(x, currentY, w, rowH);

      const isStatusCol = c === 9;
      const isNameCol = c === 1;
      if (isStatusCol) {
        ctx.fillStyle = isAbsent ? '#64748B' : (fails.length > 0 ? '#B91C1C' : '#15803D');
      } else if (isNameCol) {
        ctx.fillStyle = '#0F172A';
      } else {
        ctx.fillStyle = '#1E293B';
      }

      let fontSize = 12;
      const weight = isStatusCol || isNameCol ? 'bold' : 'normal';
      ctx.font = `${weight} ${fontSize}px ${fontSerif}`;
      const textVal = rVals[c];
      while (fontSize > 9 && ctx.measureText(textVal).width > w - 8) {
        fontSize -= 0.5;
        ctx.font = `${weight} ${fontSize}px ${fontSerif}`;
      }

      ctx.textAlign = 'center';
      ctx.fillText(textVal, x + w / 2, currentY + rowH / 2);
    }
    currentY += rowH;
  });

  // Average Row
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(0, currentY, width, avgH);
  ctx.fillStyle = '#92400E';
  ctx.font = `bold 12px ${fontSerif}`;
  ctx.strokeStyle = '#CBD5E1';

  // Merged columns 0-2 (STT + Họ tên + Điểm danh) for Average label matching Excel
  const avgLabelW = colX[3]; // 310px
  ctx.strokeRect(0, currentY, avgLabelW, avgH);
  ctx.textAlign = 'center';
  ctx.fillText('Điểm trung bình (Average)', avgLabelW / 2, currentY + avgH / 2);

  const aVals = [
    '', '', '',
    tC1 > 0 ? format1Dec(tC1) : '-',
    tC2 > 0 ? format1Dec(tC2) : '-',
    tHw1 > 0 ? format1Dec(tHw1) : '-',
    tHw2 > 0 ? format1Dec(tHw2) : '-',
    tMt > 0 ? format1Dec(tMt) : '-',
    diffHw > 0 ? format1Dec(diffHw) : '-',
    'Đã tính TB lớp'
  ];

  // Remaining columns 3-9
  for (let c = 3; c < 10; c++) {
    const x = colX[c], w = colW[c];
    ctx.strokeRect(x, currentY, w, avgH);
    ctx.fillText(aVals[c], x + w / 2, currentY + avgH / 2);
  }
  currentY += avgH + gapH;

  // Summary Rows
  const leftW = colX[3]; // 310px (merges col 0, 1, 2)
  const rightW = width - leftW; // 890px (merges col 3-9)

  preparedSummary.forEach((s) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, currentY, width, s.rowH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.strokeRect(0, currentY, leftW, s.rowH);
    ctx.strokeRect(leftW, currentY, rightW, s.rowH);

    ctx.fillStyle = '#7F1D1D';
    ctx.font = `bold 12px ${fontSerif}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${s.label} dưới TB (< ${s.thresh > 0 ? format1Dec(s.thresh) : '-'})`, 14, currentY + s.rowH / 2);

    ctx.fillStyle = '#1E1E2F';
    ctx.font = `bold 12px ${fontSerif}`;
    if (s.lines.length === 1) {
      ctx.fillText(s.lines[0], leftW + 14, currentY + s.rowH / 2);
    } else {
      const startY = currentY + 18;
      s.lines.forEach((line, lIdx) => {
        ctx.fillText(line, leftW + 14, startY + lIdx * 20);
      });
    }
    currentY += s.rowH;
  });

  // Border outline
  ctx.strokeStyle = '#312E81';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, currentY);

  // 3. Export: Download + Desktop Save + Clipboard Copy
  const dataUrl = canvas.toDataURL('image/png');
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const filename = `ClassReport_${className}_${attendanceDate}_${ts}.png`;

  const link = Object.assign(document.createElement('a'), { download: filename, href: dataUrl });
  link.click();

  let savedName = filename;
  try {
    const res = await api.saveExportPng(classItem.id, attendanceDate, dataUrl);
    if (res?.filename) savedName = res.filename;
  } catch (err) {
    console.warn('Could not save PNG to workspace_files:', err);
  }

  // Copy to clipboard immediately
  let clipboardSuccess = false;
  if (navigator.clipboard && (window as any).ClipboardItem) {
    try {
      const byteStr = window.atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
      await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': new Blob([bytes], { type: 'image/png' }) })]);
      clipboardSuccess = true;
    } catch (clipErr) {
      console.warn('Clipboard write error:', clipErr);
    }
  }

  const clipMsg = clipboardSuccess ? ' và đã lưu vào bộ nhớ tạm (Ctrl+V để dán)' : '';
  showToast(`Đã xuất ảnh PNG${clipMsg}: ${savedName}`, 'success', 'MỞ ẢNH', () => {
    api.openLocalFile(savedName);
  });
}
