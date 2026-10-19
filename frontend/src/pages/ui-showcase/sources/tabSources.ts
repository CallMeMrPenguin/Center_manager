import { ComponentSourceItem } from '../types';

export const tabSources: ComponentSourceItem[] = [
  {
    id: 'tab-segmented',
    title: 'SegmentedControl (Sliding Pill Indicator Chuẩn)',
    description: 'Thanh tab phân đoạn hiệu ứng con thoi trượt mượt mà theo AGENTS.md Rule 7, tự động căn chỉnh vị trí và độ rộng theo tab đang chọn.',
    category: 'navigation',
    dependencies: ['framer-motion'],
    filename: 'SegmentedControl.tsx',
    usageCode: `import { SegmentedControl } from '@/components/tabs';
import { useState } from 'react';

export function Example() {
  const [tab, setTab] = useState('overview');

  const options = [
    { value: 'overview', label: 'Tổng Quan' },
    { value: 'students', label: 'Học Sinh' },
    { value: 'attendance', label: 'Điểm Danh' },
    { value: 'scores', label: 'Bảng Điểm' },
  ];

  return (
    <SegmentedControl
      options={options}
      value={tab}
      onChange={setTab}
      size="md"
      fit="content"
    />
  );
}`,
    sourceCode: `import React, { useRef, useState, useLayoutEffect } from 'react';

export interface SegmentOption<T extends string = string> {
  value?: T;
  id?: T;
  label?: string | null;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string = string> {
  options?: SegmentOption<T>[];
  value?: T;
  onChange?: (val: T) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fit?: 'content' | 'fluid';
}

export function SegmentedControl<T extends string = string>({
  options = [],
  value,
  onChange,
  size = 'md',
  fit = 'content',
}: SegmentedControlProps<T>) {
  const items = options;
  const activeVal = value ?? (items[0]?.value as T);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = items.findIndex((item) => (item.value ?? item.id) === activeVal);

  useLayoutEffect(() => {
    if (activeIndex >= 0) {
      const el = buttonRefs.current[activeIndex];
      if (el) {
        setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
      }
    }
  }, [activeIndex, items]);

  return (
    <div
      className={\`relative inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#121626] border-0 select-none \${
        fit === 'fluid' ? 'w-full' : ''
      }\`}
    >
      {/* Sliding Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-[#202538] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />

      {items.map((item, idx) => {
        const itemVal = (item.value ?? item.id) as T;
        const isActive = activeVal === itemVal;
        return (
          <button
            key={String(itemVal)}
            ref={(el) => (buttonRefs.current[idx] = el)}
            type="button"
            onClick={() => onChange?.(itemVal)}
            className={\`relative z-10 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border-0 \${
              fit === 'fluid' ? 'flex-1 text-center' : ''
            } \${
              isActive
                ? 'text-blue-600 dark:text-white font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }\`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}`,
    typesCode: `export interface SegmentOption<T extends string = string> {
  value?: T;
  id?: T;
  label?: string | null;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options?: SegmentOption<T>[];
  value?: T;
  onChange?: (val: T) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fit?: 'content' | 'fluid';
}`
  },
  {
    id: 'tab-vercel',
    title: 'VercelTabs (Thanh Điều Hướng Gạch Chân Kiểu Vercel)',
    description: 'Thanh điều hướng phẳng tối giản với vạch trượt dưới chân tab đang kích hoạt và hiệu ứng nền lơ lửng khi rê chuột.',
    category: 'navigation',
    dependencies: ['framer-motion'],
    filename: 'VercelTabs.tsx',
    usageCode: `import { VercelTabs } from '@/components/tabs';
import { useState } from 'react';

export function Example() {
  const [activeTab, setActiveTab] = useState('settings');

  const tabs = [
    { value: 'profile', label: 'Hồ Sơ' },
    { value: 'security', label: 'Bảo Mật' },
    { value: 'settings', label: 'Cài Đặt Hệ Thống' },
    { value: 'billing', label: 'Thanh Toán' },
  ];

  return (
    <VercelTabs
      tabs={tabs}
      value={activeTab}
      onChange={setActiveTab}
    />
  );
}`,
    sourceCode: `import React, { useRef, useState, useLayoutEffect } from 'react';

export interface VercelTabItem<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
}

export interface VercelTabsProps<T extends string = string> {
  tabs: VercelTabItem<T>[];
  value?: T;
  onChange?: (val: T) => void;
  className?: string;
}

export function VercelTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  className = '',
}: VercelTabsProps<T>) {
  const activeTab = value ?? tabs[0]?.value;
  const [activeStyle, setActiveStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = tabs.findIndex((t) => t.value === activeTab);

  useLayoutEffect(() => {
    if (activeIndex >= 0) {
      const el = tabRefs.current[activeIndex];
      if (el) {
        setActiveStyle({ left: el.offsetLeft, width: el.offsetWidth });
      }
    }
  }, [activeIndex, tabs]);

  return (
    <div className={\`relative border-b border-slate-200 dark:border-white/10 \${className}\`}>
      <div className="flex items-center gap-4">
        {tabs.map((tab, idx) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              ref={(el) => (tabRefs.current[idx] = el)}
              type="button"
              onClick={() => onChange?.(tab.value)}
              className={\`relative pb-2.5 text-xs font-bold transition-colors cursor-pointer border-0 bg-transparent \${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }\`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Underline Pill */}
      <div
        className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-200 ease-out"
        style={{ left: activeStyle.left, width: activeStyle.width }}
      />
    </div>
  );
}`
  }
];
