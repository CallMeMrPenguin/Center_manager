import React, { useState } from 'react';
import { Button } from '../../../components/button';
import { MiniTrendSparkline } from '../../../components/chart';
import { showToast } from '../../../components/Toast';
import { UndoToast, usePromiseToast } from '../../../components/ui/animated-toast';
import { ComponentCard } from '../components/ComponentCard';
import { toastChartSources } from '../sources/toastChartSources';
import { ComponentSourceItem } from '../types';

interface ToastsChartsTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const ToastsChartsTab: React.FC<ToastsChartsTabProps> = ({ onViewCode }) => {
  const [undoOpen, setUndoOpen] = useState(false);
  const promiseToast = usePromiseToast();

  const getSource = (id: string) => toastChartSources.find((s) => s.id === id)!;

  const handleTestPromise = async () => {
    await promiseToast({
      promise: new Promise((res) => setTimeout(() => res('Dữ liệu đã đồng bộ!'), 2000)),
      loading: 'Đang kết nối và đồng bộ máy chủ...',
      success: (data) => `Thành công: ${data}`,
      error: 'Không thể kết nối máy chủ!',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOASTS */}
      <ComponentCard item={getSource('toast-global')} onViewCode={onViewCode}>
        <div className="w-full space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Click các nút dưới đây để kích hoạt thông báo Toast:
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="success"
              onClick={() => showToast('Thao tác ghi danh học sinh thành công!', 'success')}
            >
              Success Toast
            </Button>
            <Button
              variant="danger"
              onClick={() => showToast('Đã xảy ra lỗi khi kết nối máy chủ SQLite!', 'error')}
            >
              Error Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => showToast('Cảnh báo: Điểm số của học sinh chưa được nhập đủ!', 'warning')}
            >
              Warning Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => showToast('Hệ thống đang sao lưu cơ sở dữ liệu định kỳ...', 'info')}
            >
              Info Toast
            </Button>
            <Button
              variant="primary"
              onClick={handleTestPromise}
            >
              Promise Toast (2s)
            </Button>
            <Button
              variant="white"
              onClick={() => setUndoOpen(true)}
            >
              Mở Undo Toast
            </Button>
          </div>

          <UndoToast
            open={undoOpen}
            message="Đã xóa học sinh khỏi danh sách lớp."
            onUndo={() => {
              setUndoOpen(false);
              showToast('Đã hoàn tác xóa học sinh thành công!', 'success');
            }}
            onClose={() => setUndoOpen(false)}
          />
        </div>
      </ComponentCard>

      {/* 2. SPARKLINE CHARTS */}
      <ComponentCard item={getSource('chart-sparkline')} onViewCode={onViewCode}>
        <div className="w-full space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Đồ thị đường mini SVG hiển thị tiến độ 5 buổi gần nhất. Hover vào các chấm tròn để xem hiệu ứng phóng to tâm đều không nhảy góc (AGENTS.md Rule 5):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-4 bg-white dark:bg-white/5 rounded-2xl flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Tiến bộ rõ rệt (Xanh lá)
              </span>
              <div className="py-2">
                <MiniTrendSparkline points={[6.0, 6.8, 7.5, 8.2, 9.5]} slope={0.35} />
              </div>
              <span className="text-[11px] font-mono text-slate-400">6.0 → 9.5 (slope: +0.35)</span>
            </div>

            <div className="p-4 bg-white dark:bg-white/5 rounded-2xl flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Sa sút điểm số (Đỏ)
              </span>
              <div className="py-2">
                <MiniTrendSparkline points={[8.8, 8.2, 7.5, 6.5, 5.5]} slope={-0.3} />
              </div>
              <span className="text-[11px] font-mono text-slate-400">8.8 → 5.5 (slope: -0.30)</span>
            </div>

            <div className="p-4 bg-white dark:bg-white/5 rounded-2xl flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Phong độ ổn định (Xanh dương)
              </span>
              <div className="py-2">
                <MiniTrendSparkline points={[8.0, 8.2, 8.0, 8.1, 8.2]} slope={0.01} />
              </div>
              <span className="text-[11px] font-mono text-slate-400">8.0 → 8.2 (slope: +0.01)</span>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
};
