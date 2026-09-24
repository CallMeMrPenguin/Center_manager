import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Sparkles, Printer, Download, FolderOpen, ChevronLeft, Save
} from 'lucide-react';
import { RibbonTab, MarginConfig, Orientation, PaperSize } from '../types';
import { RibbonHomeTab } from './ribbon/RibbonHomeTab';
import { RibbonInsertTab } from './ribbon/RibbonInsertTab';
import { RibbonLayoutTab } from './ribbon/RibbonLayoutTab';

interface WordRibbonToolbarProps {
  editor: Editor | null;
  title: string;
  onTitleChange: (newTitle: string) => void;
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  orientation: Orientation;
  onOrientationChange: (ori: Orientation) => void;
  margins: MarginConfig;
  onMarginsChange: (margins: MarginConfig) => void;
  onSaveNow: () => void;
  onExportDocx: () => void;
  onPrint: () => void;
  onImportDocx: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackToList: () => void;
  onOpenMergeModal: () => void;
}

export const WordRibbonToolbar: React.FC<WordRibbonToolbarProps> = ({
  editor,
  title,
  onTitleChange,
  activeTab,
  onTabChange,
  paperSize,
  onPaperSizeChange,
  orientation,
  onOrientationChange,
  margins,
  onMarginsChange,
  onSaveNow,
  onExportDocx,
  onPrint,
  onImportDocx,
  onBackToList,
  onOpenMergeModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="relative z-30 bg-white dark:bg-[#0c0f1e] border-b border-slate-200 dark:border-white/10 text-slate-800 dark:text-white shrink-0 select-none shadow-xs">
      {/* 1. Quick Access Title & Actions Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/80 dark:bg-[#080b14] text-xs gap-3">
        {/* Left: Navigation, Word Icon & Editable Document Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xl">
          <button
            type="button"
            onClick={onBackToList}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-bold shrink-0"
            title="Quay lại danh sách văn bản"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10 shrink-0" />

          {/* Word App Icon */}
          <div className="w-6 h-6 rounded bg-[#2563eb] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-xs">
            W
          </div>

          {/* Quick Save */}
          <button
            type="button"
            onClick={onSaveNow}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Lưu ngay (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          {/* Document Title Input */}
          <div className="relative flex-1 min-w-[120px] max-w-md">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-transparent hover:bg-white dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#121626] border border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-blue-500 rounded-lg px-2.5 py-1 font-bold text-sm text-slate-900 dark:text-white focus:outline-none transition-all truncate shadow-none focus:shadow-xs"
              placeholder="Tên văn bản..."
            />
          </div>
        </div>

        {/* Right: Unclipped Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={onImportDocx}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer font-semibold text-xs shrink-0"
            title="Mở file Word (.docx) từ máy tính"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Mở .docx</span>
          </button>

          <button
            type="button"
            onClick={onOpenMergeModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded-lg transition-colors cursor-pointer font-bold text-xs shrink-0"
            title="Trộn thư và điền tự động dữ liệu học sinh"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Trộn thư</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer font-semibold text-xs shrink-0"
            title="In hoặc Xuất PDF (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden lg:inline">In / PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs text-xs shrink-0"
            title="Tải văn bản về dạng file Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải .docx</span>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Tabs */}
      <div className="flex items-center px-3 bg-slate-100/80 dark:bg-[#080b14]/80 border-b border-slate-200/90 dark:border-white/5 text-xs font-semibold gap-0.5">
        {(['home', 'insert', 'layout', 'merge'] as RibbonTab[]).map((tab) => {
          const labels: Record<RibbonTab, string> = {
            home: 'Trang Đầu',
            insert: 'Chèn',
            layout: 'Bố Trí Trang',
            merge: 'Trộn Thư & Dữ Liệu',
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`px-3.5 py-1.5 transition-all cursor-pointer font-bold border-b-2 text-xs ${
                isActive
                  ? 'border-[#2563eb] text-[#2563eb] dark:text-white bg-white dark:bg-[#0c0f1e] rounded-t-md shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 3. Ribbon Controls Bar */}
      <div className="px-3 py-1.5 min-h-[46px] flex items-center gap-2 text-xs bg-white dark:bg-[#0c0f1e] relative z-40">
        {activeTab === 'home' && <RibbonHomeTab editor={editor} />}
        {activeTab === 'insert' && (
          <RibbonInsertTab editor={editor} onOpenMergeModal={onOpenMergeModal} />
        )}
        {activeTab === 'layout' && (
          <RibbonLayoutTab
            paperSize={paperSize}
            onPaperSizeChange={onPaperSizeChange}
            orientation={orientation}
            onOrientationChange={onOrientationChange}
            margins={margins}
            onMarginsChange={onMarginsChange}
          />
        )}
        {activeTab === 'merge' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMergeModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mở bảng trộn thư &amp; điền tự động dữ liệu học sinh</span>
            </button>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Tự động thay thế các thẻ {'{{ten_hoc_sinh}}'}, {'{{lop_hoc}}'} bằng dữ liệu hồ sơ trung tâm.
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
