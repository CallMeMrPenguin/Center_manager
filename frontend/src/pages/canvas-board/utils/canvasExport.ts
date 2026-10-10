import { showToast } from '../../../components/Toast';
import { formatExportTimestamp } from '../../../utils';

export function exportCanvasJpg(
  canvas: HTMLCanvasElement | null,
  docName: string,
  currentPage: number
): void {
  if (!canvas) return;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);
  }
  const a = document.createElement('a');
  a.href = exportCanvas.toDataURL('image/jpeg', 0.95);
  a.download = `Canvas_${docName.replace(/\.[^/.]+$/, '')}_Trang${currentPage}_${formatExportTimestamp()}.jpg`;
  a.click();
  showToast('Đã tải ảnh JPG xuất thành công', 'success');
}
