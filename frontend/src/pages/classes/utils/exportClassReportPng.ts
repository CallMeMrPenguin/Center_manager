import { toPng } from 'html-to-image';
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
    vocab: 'Từ vựng',
    grammar: 'Ngữ pháp',
    mixed: 'Tổng hợp',
    mock_test: 'Luyện đề',
    reading: 'Đọc hiểu',
    listening: 'Nghe',
    speaking: 'Nói',
    writing: 'Viết',
  };
  const skillName = skillLabels[cfg.skill] || (cfg.skill ? String(cfg.skill) : '');
  const units = Array.isArray(cfg.units) ? cfg.units.join(', ') : (cfg.units || '');
  const topic = (cfg.topic || cfg.grammar_topic || '').replace(/\|/g, '-').trim();

  const parts = [units, topic].filter(Boolean);
  const detail = parts.join(' - ');
  if (skillName && detail) return `${skillName}: ${detail}`;
  return detail || skillName;
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

  // 1. Calculate class statistics
  let sumC1 = 0, countC1 = 0;
  let sumC2 = 0, countC2 = 0;
  let sumHw1 = 0, countHw1 = 0;
  let sumHw2 = 0, countHw2 = 0;
  let sumMt = 0, countMt = 0;

  records.forEach((r) => {
    if (r.status === 'Vắng mặt') return;
    const nC1 = Number(r.check_1);
    if (!isNaN(nC1) && nC1 > 0) { sumC1 += nC1; countC1++; }
    const nC2 = Number(r.check_2);
    if (!isNaN(nC2) && nC2 > 0) { sumC2 += nC2; countC2++; }
    const nHw1 = Number(r.homework);
    if (!isNaN(nHw1) && nHw1 > 0) { sumHw1 += nHw1; countHw1++; }
    const nHw2 = Number(r.homework_2);
    if (!isNaN(nHw2) && nHw2 > 0) { sumHw2 += nHw2; countHw2++; }
    const nMt = Number(r.mock_test);
    if (!isNaN(nMt) && nMt > 0) { sumMt += nMt; countMt++; }
  });

  const avgC1 = countC1 > 0 ? trunc1Dec(sumC1 / countC1) : 0;
  const avgC2 = countC2 > 0 ? trunc1Dec(sumC2 / countC2) : 0;
  const avgHw1 = countHw1 > 0 ? trunc1Dec(sumHw1 / countHw1) : 0;
  const avgHw2 = countHw2 > 0 ? trunc1Dec(sumHw2 / countHw2) : 0;
  const avgMt = countMt > 0 ? trunc1Dec(sumMt / countMt) : 0;

  // Thresholds prioritize UI settings
  const tC1 = (thresholds.check_1 !== undefined && thresholds.check_1 > 0) ? trunc1Dec(thresholds.check_1) : avgC1;
  const tC2 = (thresholds.check_2 !== undefined && thresholds.check_2 > 0) ? trunc1Dec(thresholds.check_2) : avgC2;
  const tHw1 = (thresholds.homework !== undefined && thresholds.homework > 0) ? trunc1Dec(thresholds.homework) : avgHw1;
  const tHw2 = (thresholds.homework_2 !== undefined && thresholds.homework_2 > 0) ? trunc1Dec(thresholds.homework_2) : avgHw2;
  const tMt = (thresholds.mock_test !== undefined && thresholds.mock_test > 0) ? trunc1Dec(thresholds.mock_test) : avgMt;

  const validAvgs = [tC1, tC2].filter((v) => v > 0);
  const checkComb = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;
  const diffHw = (tHw1 > 0 && checkComb > 0) ? trunc1Dec(Math.abs(tHw1 - checkComb)) : 0;

  // 2. Identify failing students per category
  const belowC1: string[] = [];
  const belowC2: string[] = [];
  const belowHw1: string[] = [];
  const belowHw2: string[] = [];
  const belowMt: string[] = [];

  records.forEach((r) => {
    if (r.status === 'Vắng mặt') return;
    const nC1 = Number(r.check_1);
    if (!isNaN(nC1) && nC1 > 0 && tC1 > 0 && nC1 < tC1) belowC1.push(r.student_name);
    const nC2 = Number(r.check_2);
    if (!isNaN(nC2) && nC2 > 0 && tC2 > 0 && nC2 < tC2) belowC2.push(r.student_name);
    const nHw1 = Number(r.homework);
    if (!isNaN(nHw1) && nHw1 > 0 && tHw1 > 0 && nHw1 < tHw1) belowHw1.push(r.student_name);
    const nHw2 = Number(r.homework_2);
    if (!isNaN(nHw2) && nHw2 > 0 && tHw2 > 0 && nHw2 < tHw2) belowHw2.push(r.student_name);
    const nMt = Number(r.mock_test);
    if (!isNaN(nMt) && nMt > 0 && tMt > 0 && nMt < tMt) belowMt.push(r.student_name);
  });

  // 3. Construct pristine DOM container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1260px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = "'Times New Roman', Times, serif";
  container.style.color = '#0f172a';
  container.style.boxSizing = 'border-box';
  container.style.padding = '0';
  container.style.margin = '0';

  const rowsHtml = records
    .map((r, idx) => {
      const isAbsent = r.status === 'Vắng mặt';
      const nC1 = Number(r.check_1);
      const nC2 = Number(r.check_2);
      const nHw1 = Number(r.homework);
      const nHw2 = Number(r.homework_2);
      const nMt = Number(r.mock_test);

      // Diff
      let diffStr = '-';
      if (!isAbsent && !isNaN(nHw1) && nHw1 > 0) {
        const vC1 = !isNaN(nC1) && nC1 > 0;
        const vC2 = !isNaN(nC2) && nC2 > 0;
        if (vC1 && vC2) diffStr = format1Dec(Math.abs(nHw1 - (nC1 + nC2) / 2));
        else if (vC1) diffStr = format1Dec(Math.abs(nHw1 - nC1));
        else if (vC2) diffStr = format1Dec(Math.abs(nHw1 - nC2));
      }

      // Status
      let statusHtml = '';
      if (isAbsent) {
        statusHtml = '<span style="color: #64748b; font-weight: bold;">Vắng mặt</span>';
      } else {
        const fails: string[] = [];
        if (!isNaN(nC1) && nC1 > 0 && tC1 > 0 && nC1 < tC1) fails.push('Check 1');
        if (!isNaN(nC2) && nC2 > 0 && tC2 > 0 && nC2 < tC2) fails.push('Check 2');
        if (!isNaN(nHw1) && nHw1 > 0 && tHw1 > 0 && nHw1 < tHw1) fails.push('BTVN 1');
        if (!isNaN(nHw2) && nHw2 > 0 && tHw2 > 0 && nHw2 < tHw2) fails.push('BTVN 2');
        if (!isNaN(nMt) && nMt > 0 && tMt > 0 && nMt < tMt) fails.push('Luyện Đề');

        if (fails.length > 0) {
          statusHtml = `<span style="color: #b91c1c; font-weight: bold;">Cần cố gắng (${fails.join(', ')})</span>`;
        } else {
          statusHtml = '<span style="color: #15803d; font-weight: bold;">Đạt yêu cầu</span>';
        }
      }

      const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
      return `
        <tr style="background-color: ${rowBg}; text-align: center; height: 32px; font-size: 13px;">
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-weight: bold;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold; color: #0f172a;">${r.student_name}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px;">${r.status || 'Có mặt'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-family: monospace; font-size: 13px;">${!isNaN(nC1) && nC1 > 0 ? format1Dec(nC1) : '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-family: monospace; font-size: 13px;">${!isNaN(nC2) && nC2 > 0 ? format1Dec(nC2) : '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-family: monospace; font-size: 13px;">${!isNaN(nHw1) && nHw1 > 0 ? format1Dec(nHw1) : '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-family: monospace; font-size: 13px;">${!isNaN(nHw2) && nHw2 > 0 ? format1Dec(nHw2) : '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-family: monospace; font-size: 13px;">${!isNaN(nMt) && nMt > 0 ? format1Dec(nMt) : '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 4px; font-family: monospace; font-size: 13px;">${diffStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">${statusHtml}</td>
        </tr>
      `;
    })
    .join('');

  // Summary sections
  const summaryRows: { label: string; thresh: number; students: string[] }[] = [
    { label: c1Topic ? `Check 1 (${c1Topic})` : 'Check 1', thresh: tC1, students: belowC1 },
    { label: c2Topic ? `Check 2 (${c2Topic})` : 'Check 2', thresh: tC2, students: belowC2 },
    { label: 'BTVN', thresh: tHw1, students: belowHw1 },
  ];
  if (tHw2 > 0 || belowHw2.length > 0) summaryRows.push({ label: 'BTVN 2', thresh: tHw2, students: belowHw2 });
  if (tMt > 0 || belowMt.length > 0) summaryRows.push({ label: 'Luyện Đề', thresh: tMt, students: belowMt });

  const summaryHtml = summaryRows
    .map(
      (s) => `
      <tr style="height: 34px; font-size: 13px;">
        <td colspan="2" style="border: 1px solid #cbd5e1; background-color: #ffffff; color: #7f1d1d; font-weight: bold; padding: 6px 12px; text-align: left; width: 34%;">
          ${s.label} dưới TB (&lt; ${format1Dec(s.thresh)})
        </td>
        <td colspan="8" style="border: 1px solid #cbd5e1; background-color: #ffffff; color: #1e1e2f; font-weight: bold; padding: 6px 12px; text-align: left;">
          ${s.students.length > 0 ? s.students.join(', ') : 'Không có (Tất cả đạt)'}
        </td>
      </tr>
    `
    )
    .join('');

  container.innerHTML = `
    <div style="width: 100%; border: 2px solid #312e81; background: #ffffff;">
      <!-- ROW 1: HEADER BANNER -->
      <div style="background-color: #1e1b4b; color: #ffffff; font-size: 17px; font-weight: bold; text-align: center; padding: 14px 10px; text-transform: uppercase; letter-spacing: 0.5px;">
        BÁO CÁO ĐIỂM DANH &amp; ĐIỂM BÀI HỌC - ${className.toUpperCase()} (${attendanceDate})
      </div>

      <!-- ROW 2: TEST TOPIC STRIP -->
      ${
        c1Topic || c2Topic
          ? `<div style="background-color: #eef2ff; color: #312e81; font-size: 12.5px; font-weight: bold; text-align: center; padding: 8px 10px; border-bottom: 1px solid #cbd5e1;">
              Nội dung kiểm tra: ${c1Topic ? `Check 1: ${c1Topic}` : ''} ${c1Topic && c2Topic ? ' — ' : ''} ${c2Topic ? `Check 2: ${c2Topic}` : ''}
            </div>`
          : ''
      }

      <!-- TABLE -->
      <table style="width: 100%; border-collapse: collapse; border: none;">
        <thead>
          <tr style="background-color: #312e81; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center; height: 50px;">
            <th style="border: 1px solid #cbd5e1; width: 44px; padding: 4px;">STT</th>
            <th style="border: 1px solid #cbd5e1; width: 170px; padding: 4px;">Họ và Tên</th>
            <th style="border: 1px solid #cbd5e1; width: 90px; padding: 4px;">Điểm Danh</th>
            <th style="border: 1px solid #cbd5e1; width: 140px; padding: 4px;">Check 1${c1Topic ? `<br/><span style="font-size: 11px; font-weight: normal; opacity: 0.9;">(${c1Topic})</span>` : ''}</th>
            <th style="border: 1px solid #cbd5e1; width: 140px; padding: 4px;">Check 2${c2Topic ? `<br/><span style="font-size: 11px; font-weight: normal; opacity: 0.9;">(${c2Topic})</span>` : ''}</th>
            <th style="border: 1px solid #cbd5e1; width: 70px; padding: 4px;">BTVN 1</th>
            <th style="border: 1px solid #cbd5e1; width: 70px; padding: 4px;">BTVN 2</th>
            <th style="border: 1px solid #cbd5e1; width: 75px; padding: 4px;">Luyện Đề</th>
            <th style="border: 1px solid #cbd5e1; width: 75px; padding: 4px;">Độ Lệch</th>
            <th style="border: 1px solid #cbd5e1; width: 220px; padding: 4px;">Cần Cố Gắng (Dưới TB)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <!-- AVERAGE ROW -->
          <tr style="background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; height: 34px; font-size: 13px;">
            <td style="border: 1px solid #cbd5e1;"></td>
            <td style="border: 1px solid #cbd5e1; text-align: center;">Điểm trung bình (Average)</td>
            <td style="border: 1px solid #cbd5e1;"></td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${tC1 > 0 ? format1Dec(tC1) : '-'}</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${tC2 > 0 ? format1Dec(tC2) : '-'}</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${tHw1 > 0 ? format1Dec(tHw1) : '-'}</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${tHw2 > 0 ? format1Dec(tHw2) : '-'}</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${tMt > 0 ? format1Dec(tMt) : '-'}</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${diffHw > 0 ? format1Dec(diffHw) : '-'}</td>
            <td style="border: 1px solid #cbd5e1; text-align: center;">Đã tính TB lớp</td>
          </tr>
          <!-- SPACING ROW -->
          <tr style="height: 14px; background-color: #ffffff;"><td colspan="10" style="border: none;"></td></tr>
          <!-- SUMMARY ROWS -->
          ${summaryHtml}
        </tbody>
      </table>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const dataUrl = await toPng(container, {
      pixelRatio: 2.2,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });

    // 4. Download file in browser
    const link = document.createElement('a');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `ClassReport_${className}_${attendanceDate}_${ts}.png`;
    link.download = filename;
    link.href = dataUrl;
    link.click();

    // 5. Save to backend for native desktop file opening
    try {
      const res = await api.saveExportPng(classItem.id, attendanceDate, dataUrl);
      const savedName = res?.filename || filename;
      showToast(`Đã xuất ảnh PNG: ${savedName}`, 'success', 'MỞ ẢNH', () => {
        api.openLocalFile(savedName);
      });
    } catch {
      showToast(`Đã xuất ảnh PNG: ${filename}`, 'success');
    }
  } catch (err: any) {
    showToast('Xuất ảnh PNG thất bại: ' + (err?.message || String(err)), 'error');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
