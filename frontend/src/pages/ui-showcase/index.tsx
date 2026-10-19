import React, { useState } from 'react';
import {
  Sparkles, Terminal, Check, Table as TableIcon,
  Layers, Calendar, Edit3, TrendingUp, Palette,
  Activity, SunMoon, Droplets, Compass, MousePointerClick, FolderTree, BellRing
} from 'lucide-react';
import { SegmentedButton } from '../../components/ui/segmented-button';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ComponentSourceItem } from './types';
import { ALL_COMPONENT_SOURCES } from './sources';
import { DataTableDemoView } from './views/DataTableDemoView';
import { ButtonsDemoView } from './views/ButtonsDemoView';
import { SelectsDemoView } from './views/SelectsDemoView';
import { DateTimeDemoView } from './views/DateTimeDemoView';
import { TabsDemoView } from './views/TabsDemoView';
import { InputModalDemoView } from './views/InputModalDemoView';
import { ChartDemoView } from './views/ChartDemoView';
import { ThemeTokensDemoView } from './views/ThemeTokensDemoView';
import { OriginalFxDemoView, FxSubTabId } from './views/OriginalFxDemoView';
import { showToast } from '../../components/Toast';

type AppSubTabId = 'datatable' | 'buttons' | 'selects' | 'datetime' | 'tabs' | 'inputs' | 'charts' | 'tokens';

const APP_COMPONENT_BUTTONS = [
  { id: 'datatable', label: 'DataTable', icon: TableIcon },
  { id: 'buttons', label: 'Nút Bấm', icon: Layers },
  { id: 'selects', label: 'Dropdown Select', icon: Edit3 },
  { id: 'datetime', label: 'Ngày & Giờ', icon: Calendar },
  { id: 'tabs', label: 'Tabs & Điều Hướng', icon: Layers },
  { id: 'inputs', label: 'Ô Nhập & Modal', icon: Edit3 },
  { id: 'charts', label: 'Biểu Đồ Xu Hướng', icon: TrendingUp },
  { id: 'tokens', label: 'Màu Sắc & Tokens', icon: Palette },
];

const FX_BUTTONS = [
  { id: 'beam', label: 'Animated Beam', icon: Activity },
  { id: 'toggle', label: 'Theme Toggle', icon: SunMoon },
  { id: 'liquid', label: 'Liquid Button', icon: Droplets },
  { id: 'dock', label: 'Dock', icon: Compass },
  { id: 'hover', label: 'Hover Preview', icon: MousePointerClick },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'segmented', label: 'Segmented', icon: Layers },
  { id: 'tree', label: 'File Tree', icon: FolderTree },
  { id: 'toast', label: 'Toasts', icon: BellRing },
  { id: 'table', label: 'Table', icon: TableIcon },
];

export default function UIShowcasePage() {
  const [category, setCategory] = useState<'components' | 'fx'>('components');
  const [activeAppTab, setActiveAppTab] = useState<AppSubTabId>('datatable');
  const [activeFxTab, setActiveFxTab] = useState<FxSubTabId>('beam');
  const [activeModalItem, setActiveModalItem] = useState<ComponentSourceItem | null>(null);
  const [copiedAllDeps, setCopiedAllDeps] = useState(false);

  const handleCopyAllDependencies = () => {
    const allDeps = Array.from(
      new Set(ALL_COMPONENT_SOURCES.flatMap((s) => s.dependencies))
    );
    const cmd = `npm install ${allDeps.join(' ')}`;
    navigator.clipboard.writeText(cmd);
    setCopiedAllDeps(true);
    showToast('Đã sao chép lệnh cài đặt toàn bộ package vào clipboard!', 'success');
    setTimeout(() => setCopiedAllDeps(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-6 overflow-y-auto select-none bg-[#f1f5f9] dark:bg-[#09090b] text-slate-800 dark:text-slate-100">
      {/* ── TOP HEADER WITH CATEGORY & SUBTAB CONTROLS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                UI Component Showcase & Code Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs">
                {ALL_COMPONENT_SOURCES.length} Components
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toàn bộ component thực tế của ứng dụng kèm xem và sao chép mã nguồn file hoàn chỉnh.
            </p>
          </div>
        </div>

        {/* Global Action & Category Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopyAllDependencies}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-xs"
          >
            {copiedAllDeps ? <Check size={13} /> : <Terminal size={13} />}
            <span>Chép npm install</span>
          </button>

          {/* Category Toggle */}
          <SegmentedButton
            buttons={[
              { id: 'components', label: 'Thành Phần App (Chính)' },
              { id: 'fx', label: 'Hiệu Ứng FX (Giao Diện)' },
            ]}
            activeId={category}
            onChange={(id) => setCategory(id as 'components' | 'fx')}
            fullWidth={false}
            size="sm"
          />
        </div>
      </div>

      {/* ── SUBTAB SELECTOR PILL BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {category === 'components' ? (
          <SegmentedButton
            buttons={APP_COMPONENT_BUTTONS}
            activeId={activeAppTab}
            onChange={(id) => setActiveAppTab(id as AppSubTabId)}
            fullWidth={false}
            size="sm"
          />
        ) : (
          <SegmentedButton
            buttons={FX_BUTTONS}
            activeId={activeFxTab}
            onChange={(id) => setActiveFxTab(id as FxSubTabId)}
            fullWidth={false}
            size="sm"
          />
        )}
      </div>

      {/* ── FULL-WIDTH VIEW CONTAINER (NO SMALL CRAMPED CARDS) ── */}
      <div className="flex-1">
        {category === 'components' && (
          <>
            {activeAppTab === 'datatable' && <DataTableDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'buttons' && <ButtonsDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'selects' && <SelectsDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'datetime' && <DateTimeDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'tabs' && <TabsDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'inputs' && <InputModalDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'charts' && <ChartDemoView onViewCode={setActiveModalItem} />}
            {activeAppTab === 'tokens' && <ThemeTokensDemoView onViewCode={setActiveModalItem} />}
          </>
        )}

        {category === 'fx' && (
          <OriginalFxDemoView activeSubTab={activeFxTab} onViewCode={setActiveModalItem} />
        )}
      </div>

      {/* ── CODE VIEWER MODAL ── */}
      <CodeViewerModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}
