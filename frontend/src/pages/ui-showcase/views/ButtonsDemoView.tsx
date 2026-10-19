import React, { useState } from 'react';
import { Save, Trash2, ArrowRight, Download, Check, RefreshCw, Code2, Copy } from 'lucide-react';
import { Button, SinglePenButton, ZoomButtonGroup, CollapseButton, ViewModeButton } from '../../../components/button';
import { showToast } from '../../../components/Toast';
import { buttonSources } from '../sources/buttonSources';
import { ComponentSourceItem } from '../types';

interface ButtonsDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const ButtonsDemoView: React.FC<ButtonsDemoViewProps> = ({ onViewCode }) => {
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'distribution'>('timeline');

  const mainSource = buttonSources[0]; // Button.tsx

  const handleTestLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Thao tác lưu dữ liệu hoàn tất!', 'success');
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Hệ Thống Nút Bấm & Cụm Nút Điều Khiển (Button Components)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thiết kế Flat UI không viền (border-0) kết hợp đổ bóng tự nhiên, hỗ trợ 7 variants, 7 sizes, icon, loading và active animation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(mainSource.usageCode);
              showToast('Đã sao chép ví dụ sử dụng Button!', 'success');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition cursor-pointer border-0 shadow-2xs"
          >
            <Copy size={13} />
            <span>Chép Cách Dùng</span>
          </button>
          <button
            type="button"
            onClick={() => onViewCode(mainSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn File (Button.tsx)</span>
          </button>
        </div>
      </div>

      {/* 1. BUTTON VARIANTS */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          1. Biến Thể Màu Sắc (Variants)
        </h4>
        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5">
          <Button
            variant="primary"
            leftIcon={<Save size={14} />}
            loading={loading}
            onClick={handleTestLoading}
          >
            Primary (Lưu Thay Đổi)
          </Button>
          <Button variant="secondary" onClick={() => showToast('Nhấn Secondary', 'info')}>
            Secondary (Hủy Bỏ)
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 size={14} />}
            onClick={() => showToast('Nhấn Danger', 'error')}
          >
            Danger (Xóa Mục)
          </Button>
          <Button variant="success" leftIcon={<Check size={14} />}>
            Success (Hoàn Thành)
          </Button>
          <Button variant="ghost">Ghost (Nút Trong Suốt)</Button>
          <Button variant="outline">Outline (Đường Viền Mảnh)</Button>
          <Button variant="white" leftIcon={<Download size={14} />}>
            White (Nền Trắng Sáng)
          </Button>
          <Button disabled>Disabled (Bị Khóa)</Button>
        </div>
      </div>

      {/* 2. BUTTON SIZES */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          2. Kích Thước (Sizes)
        </h4>
        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5">
          <Button size="xs" variant="primary">Kích thước XS</Button>
          <Button size="sm" variant="primary">Kích thước SM</Button>
          <Button size="md" variant="primary">Kích thước MD (Mặc định)</Button>
          <Button size="lg" variant="primary">Kích thước LG (Nổi bật)</Button>
          <Button size="icon" variant="primary" title="Nút icon"><ArrowRight size={14} /></Button>
          <Button size="icon-sm" variant="secondary" title="Nút icon nhỏ"><RefreshCw size={14} /></Button>
        </div>
      </div>

      {/* 3. SPECIAL APP BUTTONS */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          3. Cụm Nút Nghiệp Vụ Chuyên Biệt
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Single Pen Button */}
          <div className="p-4 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">SinglePenButton:</span>
              <button
                type="button"
                onClick={() => onViewCode(buttonSources[1])}
                className="text-[11px] font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Mã nguồn
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Chuẩn Rule 3.5: 1 bút sửa duy nhất, xóa nằm trong modal.</p>
            <div className="pt-1">
              <SinglePenButton onClick={() => showToast('Mở Modal chỉnh sửa!', 'info')} />
            </div>
          </div>

          {/* Zoom Button Group */}
          <div className="p-4 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">ZoomButtonGroup:</span>
              <button
                type="button"
                onClick={() => onViewCode(buttonSources[2])}
                className="text-[11px] font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Mã nguồn
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Phóng to, thu nhỏ và reset cho canvas/đồ thị.</p>
            <div className="flex items-center gap-3 pt-1">
              <ZoomButtonGroup
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                setPanOffset={setPanOffset}
              />
              <span className="text-xs font-mono font-bold text-blue-600">{Math.round(zoomLevel * 100)}%</span>
            </div>
          </div>

          {/* ViewMode & Collapse Button */}
          <div className="p-4 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">ViewMode & Collapse:</span>
              <button
                type="button"
                onClick={() => onViewCode(buttonSources[3])}
                className="text-[11px] font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Mã nguồn
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Nút chuyển góc nhìn và mở rộng/thu gọn khối.</p>
            <div className="flex items-center gap-3 pt-1">
              <ViewModeButton currentMode={viewMode} onToggle={setViewMode} />
              <CollapseButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
              <span className="text-xs font-bold text-slate-500">{viewMode} | {isCollapsed ? 'Thu' : 'Mở'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
