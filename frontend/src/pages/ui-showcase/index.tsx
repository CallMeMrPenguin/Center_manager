import React, { useState, useMemo } from 'react';
import {
  Sparkles, Search, Copy, Check, Terminal,
  Layers, Table as TableIcon, Calendar, MousePointerClick,
  FileCode, Palette, BellRing, Wand2, ArrowRight
} from 'lucide-react';
import { UICategoryId, ComponentSourceItem } from './types';
import { ALL_COMPONENT_SOURCES } from './sources';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ComponentCard } from './components/ComponentCard';
import { ButtonsTab } from './tabs/ButtonsTab';
import { TablesTab } from './tabs/TablesTab';
import { SelectsTab } from './tabs/SelectsTab';
import { DateTimeTab } from './tabs/DateTimeTab';
import { NavigationTab } from './tabs/NavigationTab';
import { InputsModalsTab } from './tabs/InputsModalsTab';
import { ToastsChartsTab } from './tabs/ToastsChartsTab';
import { ThemeTokensTab } from './tabs/ThemeTokensTab';
import { SpecialFxTab } from './tabs/SpecialFxTab';
import { showToast } from '../../components/Toast';

const CATEGORIES: { id: UICategoryId; label: string }[] = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'buttons', label: 'Nút Bấm' },
  { id: 'tables', label: 'Bảng Dữ Liệu' },
  { id: 'selects', label: 'Dropdown Select' },
  { id: 'datetime', label: 'Ngày & Giờ' },
  { id: 'navigation', label: 'Tabs & Điều Hướng' },
  { id: 'inputs', label: 'Ô Nhập Liệu & Modal' },
  { id: 'toasts', label: 'Toasts & Biểu Đồ' },
  { id: 'tokens', label: 'Màu Sắc & Tokens' },
  { id: 'fx', label: 'Hiệu Ứng FX' },
];

export default function UIShowcasePage() {
  const [activeCategory, setActiveCategory] = useState<UICategoryId>('buttons');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<ComponentSourceItem | null>(null);
  const [copiedAllDeps, setCopiedAllDeps] = useState(false);

  // Filter sources based on search or active category
  const filteredSources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return ALL_COMPONENT_SOURCES.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.filename.toLowerCase().includes(q) ||
          item.dependencies.some((d) => d.toLowerCase().includes(q))
      );
    }
    if (activeCategory === 'all') return ALL_COMPONENT_SOURCES;
    return ALL_COMPONENT_SOURCES.filter((item) => {
      if (activeCategory === 'inputs') return item.category === 'inputs' || item.category === 'modals';
      if (activeCategory === 'toasts') return item.category === 'toasts' || item.category === 'charts';
      return item.category === activeCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleCopyAllDependencies = () => {
    const allDeps = Array.from(
      new Set(ALL_COMPONENT_SOURCES.flatMap((s) => s.dependencies))
    );
    const cmd = `npm install ${allDeps.join(' ')}`;
    navigator.clipboard.writeText(cmd);
    setCopiedAllDeps(true);
    showToast('Đã chép lệnh cài đặt toàn bộ package vào clipboard!', 'success');
    setTimeout(() => setCopiedAllDeps(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-6 overflow-y-auto select-none bg-[#f1f5f9] dark:bg-[#090a0f] text-slate-800 dark:text-slate-100">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white dark:bg-[#131620] p-5 sm:p-6 rounded-2xl shadow-xs border-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                UI Component Library & Code Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs">
                {ALL_COMPONENT_SOURCES.length} Components
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Thư viện toàn bộ component của app kèm mã nguồn đầy đủ, sẵn sàng copy sang dự án khác.
            </p>
          </div>
        </div>

        {/* Global Action: Copy all npm install */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyAllDependencies}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition cursor-pointer border-0 shadow-xs active:scale-95"
          >
            {copiedAllDeps ? (
              <>
                <Check size={14} />
                <span>Đã chép lệnh npm</span>
              </>
            ) : (
              <>
                <Terminal size={14} />
                <span>Chép tất cả packages (npm)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── CATEGORY BAR & SEARCH FILTER ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#131620] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên component, mã..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131620] text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold border-0 bg-transparent cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {searchQuery ? (
        /* Search Results Grid */
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500">
            Tìm thấy {filteredSources.length} component phù hợp với từ khóa "{searchQuery}":
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSources.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-[#131620] rounded-2xl shadow-xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 font-mono text-[10px] text-blue-600 font-bold">
                      {item.filename}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0 cursor-pointer border-0 shadow-2xs hover:bg-blue-700"
                >
                  Xem & Chép Mã
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Category Specific Tabs */
        <div>
          {activeCategory === 'buttons' && <ButtonsTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'tables' && <TablesTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'selects' && <SelectsTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'datetime' && <DateTimeTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'navigation' && <NavigationTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'inputs' && <InputsModalsTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'toasts' && <ToastsChartsTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'tokens' && <ThemeTokensTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'fx' && <SpecialFxTab onViewCode={setActiveModalItem} />}
          {activeCategory === 'all' && (
            <div className="space-y-10">
              <ButtonsTab onViewCode={setActiveModalItem} />
              <TablesTab onViewCode={setActiveModalItem} />
              <SelectsTab onViewCode={setActiveModalItem} />
              <DateTimeTab onViewCode={setActiveModalItem} />
              <NavigationTab onViewCode={setActiveModalItem} />
              <InputsModalsTab onViewCode={setActiveModalItem} />
              <ToastsChartsTab onViewCode={setActiveModalItem} />
              <ThemeTokensTab onViewCode={setActiveModalItem} />
              <SpecialFxTab onViewCode={setActiveModalItem} />
            </div>
          )}
        </div>
      )}

      {/* ── CODE VIEWER MODAL ── */}
      <CodeViewerModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}
