import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { SegmentedControl, VercelTabs } from '../../../components/tabs';
import { ComponentCard } from '../components/ComponentCard';
import { tabSources } from '../sources/tabSources';
import { ComponentSourceItem } from '../types';

interface NavigationTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const NavigationTab: React.FC<NavigationTabProps> = ({ onViewCode }) => {
  const [segTab, setSegTab] = useState('overview');
  const [segSizeTab, setSegSizeTab] = useState('sm');
  const [vercelTab, setVercelTab] = useState('scores');

  const getSource = (id: string) => tabSources.find((s) => s.id === id)!;

  const segOptions = [
    { value: 'overview', label: 'Tổng Quan' },
    { value: 'students', label: 'Học Sinh' },
    { value: 'attendance', label: 'Điểm Danh' },
    { value: 'schedule', label: 'Lịch Học' },
  ];

  const vercelOptions = [
    { value: 'scores', label: 'Bảng Điểm Buổi Học' },
    { value: 'curriculum', label: 'Khung Chương Trình' },
    { value: 'homework', label: 'Bài Tập Về Nhà' },
    { value: 'analytics', label: 'Phân Tích Tiến Độ' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. SEGMENTED CONTROL */}
      <ComponentCard item={getSource('tab-segmented')} onViewCode={onViewCode}>
        <div className="w-full space-y-5">
          <div>
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Dạng Vừa Khít Nội Dung (fit="content", size="md"):
            </span>
            <SegmentedControl
              options={segOptions}
              value={segTab}
              onChange={setSegTab}
              size="md"
            />
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Dạng Toàn Chiều Rộng (fit="fluid", size="sm"):
            </span>
            <SegmentedControl
              options={segOptions}
              value={segTab}
              onChange={setSegTab}
              size="sm"
              fit="fluid"
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Tab đang chọn: <span className="font-bold text-blue-600 dark:text-blue-400">{segTab}</span>
          </div>
        </div>
      </ComponentCard>

      {/* 2. VERCEL TABS */}
      <ComponentCard item={getSource('tab-vercel')} onViewCode={onViewCode}>
        <div className="w-full space-y-4">
          <VercelTabs
            tabs={vercelOptions}
            value={vercelTab}
            onChange={setVercelTab}
          />

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Vercel Tab đang chọn: <span className="font-bold text-blue-600 dark:text-blue-400">{vercelTab}</span>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
};
