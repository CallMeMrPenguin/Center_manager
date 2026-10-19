import React, { useState } from 'react';
import { Layers, Code2, Copy } from 'lucide-react';
import { SegmentedControl, VercelTabs } from '../../../components/tabs';
import { showToast } from '../../../components/Toast';
import { tabSources } from '../sources/tabSources';
import { ComponentSourceItem } from '../types';

interface TabsDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const TabsDemoView: React.FC<TabsDemoViewProps> = ({ onViewCode }) => {
  const [activeSegment, setActiveSegment] = useState('overview');
  const [activeVercel, setActiveVercel] = useState('scores');

  const segmentedSource = tabSources[0]; // SegmentedControl
  const vercelSource = tabSources[1]; // VercelTabs

  const segmentOptions = [
    { value: 'overview', label: 'Tổng Quan Lớp Học' },
    { value: 'attendance', label: 'Điểm Danh & Điểm Số' },
    { value: 'seating', label: 'Sơ Đồ Chỗ Ngồi' },
    { value: 'conflicts', label: 'Nhóm Bạn & Xung Đột' },
  ];

  const vercelTabs = [
    { value: 'scores', label: 'Bảng Điểm Buổi Học' },
    { value: 'curriculum', label: 'Khung Chương Trình' },
    { value: 'homework', label: 'Bài Tập Về Nhà' },
    { value: 'analytics', label: 'Phân Tích Tiến Độ Học Sinh' },
  ];

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Thẻ Tabs & Phân Đoạn (SegmentedControl & VercelTabs)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chuẩn Sliding Pill Indicator (AGENTS.md Rule 7) với hiệu ứng vật lý trượt mượt mà (cubic-bezier), tự động bám theo chiều rộng của tab được kích hoạt.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onViewCode(segmentedSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn (SegmentedControl.tsx)</span>
          </button>
        </div>
      </div>

      {/* 1. SEGMENTED CONTROL */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            1. SegmentedControl (Sliding Pill Indicator)
          </h4>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(segmentedSource.usageCode);
              showToast('Đã chép ví dụ sử dụng SegmentedControl!', 'success');
            }}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline border-0 bg-transparent cursor-pointer"
          >
            <Copy size={12} />
            <span>Chép Cách Dùng</span>
          </button>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-6">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-2">
              Dạng Vừa Khít Nội Dung (fit="content", size="md"):
            </span>
            <SegmentedControl
              options={segmentOptions}
              value={activeSegment}
              onChange={setActiveSegment}
              size="md"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 block mb-2">
              Dạng Trải Rộng Toàn Bộ (fit="fluid", size="sm"):
            </span>
            <SegmentedControl
              options={segmentOptions}
              value={activeSegment}
              onChange={setActiveSegment}
              size="sm"
              fit="fluid"
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Tab đang chọn: <span className="font-bold text-blue-600 dark:text-blue-400">{activeSegment}</span>
          </div>
        </div>
      </div>

      {/* 2. VERCEL TABS */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            2. VercelTabs (Thanh Điều Hướng Gạch Chân Kiểu Vercel)
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(vercelSource.usageCode);
                showToast('Đã chép ví dụ sử dụng VercelTabs!', 'success');
              }}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline border-0 bg-transparent cursor-pointer"
            >
              <Copy size={12} />
              <span>Chép Cách Dùng</span>
            </button>
            <button
              type="button"
              onClick={() => onViewCode(vercelSource)}
              className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
            >
              Xem Mã Nguồn File
            </button>
          </div>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <VercelTabs
            tabs={vercelTabs}
            value={activeVercel}
            onChange={setActiveVercel}
          />

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Tab đang chọn: <span className="font-bold text-blue-600 dark:text-blue-400">{activeVercel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
