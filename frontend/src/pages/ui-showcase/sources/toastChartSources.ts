import { ComponentSourceItem } from '../types';

export const toastChartSources: ComponentSourceItem[] = [
  {
    id: 'toast-global',
    title: 'showToast (Hệ Thống Thông Báo Toasts Toàn Cục)',
    description: 'Hàm gọi thông báo nhẹ dạng toast hỗ trợ 4 trạng thái: success, error, warning, info với tự động ẩn sau 3 giây.',
    category: 'toasts',
    dependencies: [],
    filename: 'Toast.tsx',
    usageCode: `import { showToast } from '@/components/toast';

export function Example() {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => showToast('Đã lưu bài học thành công!', 'success')}>Success</button>
      <button onClick={() => showToast('Có lỗi xảy ra khi kết nối máy chủ!', 'error')}>Error</button>
      <button onClick={() => showToast('Vui lòng chọn học sinh trước khi xuất file!', 'warning')}>Warning</button>
      <button onClick={() => showToast('Hệ thống đang đồng bộ dữ liệu...', 'info')}>Info</button>
    </div>
  );
}`,
    sourceCode: `// Toast state management and helper function
type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastListener = (message: string, type: ToastType) => void;
const listeners: ToastListener[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  listeners.forEach((listener) => listener(message, type));
}

export function subscribeToast(listener: ToastListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}`
  },
  {
    id: 'chart-sparkline',
    title: 'MiniTrendSparkline (Đồ Thị Mini Xu Hướng SVG)',
    description: 'Biểu đồ đường mini trực quan hóa chuỗi điểm số gần nhất với quy chuẩn Rule 5 (SVG center origin hover scale và không cắt viền glow).',
    category: 'charts',
    dependencies: [],
    filename: 'MiniTrendSparkline.tsx',
    usageCode: `import { MiniTrendSparkline } from '@/components/chart';

export function Example() {
  return (
    <div className="flex items-center gap-6">
      <div>
        <span className="text-xs text-slate-500 block mb-1">Điểm tăng tiến:</span>
        <MiniTrendSparkline points={[6.5, 7.0, 7.5, 8.2, 9.0]} slope={0.3} />
      </div>
      <div>
        <span className="text-xs text-slate-500 block mb-1">Điểm giảm sút:</span>
        <MiniTrendSparkline points={[8.5, 8.0, 7.2, 6.8, 6.0]} slope={-0.25} />
      </div>
      <div>
        <span className="text-xs text-slate-500 block mb-1">Ổn định:</span>
        <MiniTrendSparkline points={[8.0, 8.2, 8.0, 8.1, 8.0]} slope={0.01} />
      </div>
    </div>
  );
}`,
    sourceCode: `import React from 'react';

export interface MiniTrendSparklineProps {
  points?: number[];
  slope?: number;
}

export const MiniTrendSparkline: React.FC<MiniTrendSparklineProps> = React.memo(({ points = [], slope = 0 }) => {
  const dataPoints = points.filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);

  if (dataPoints.length < 2) {
    return <span className="text-xs font-mono text-slate-400">-</span>;
  }

  const recent = dataPoints.slice(-5);
  const minVal = Math.min(...recent);
  const maxVal = Math.max(...recent);
  const range = maxVal - minVal || 1;

  const width = 64;
  const height = 24;
  const padding = 3;

  const coords = recent.map((val, idx) => {
    const x = padding + (idx / (recent.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? \`M \${pt.x} \${pt.y}\` : \`\${acc} L \${pt.x} \${pt.y}\`;
  }, '');

  const isDeclining = slope < -0.1;
  const isImproving = slope > 0.1;
  const strokeColor = isDeclining ? '#ef4444' : isImproving ? '#10b981' : '#2563eb';

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((pt, idx) => (
        <circle
          key={idx}
          cx={pt.x}
          cy={pt.y}
          r="2.5"
          fill={strokeColor}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          className="hover:scale-150 transition-transform cursor-pointer"
        />
      ))}
    </svg>
  );
});`
  }
];
