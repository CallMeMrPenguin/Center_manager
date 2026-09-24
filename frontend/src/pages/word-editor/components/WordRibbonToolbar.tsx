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
    <header className="bg-white dark:bg-[#0c0f1e] border-b border-slate-200 dark:border-white/10 text-slate-800 dark:text-white shrink-0 select-none shadow-xs">
      {/* 1. Quick Access Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080b14] text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <button
            onClick={onBackToList}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-bold"
            title="Quay lại danh sách văn bản"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10" />

          {/* Quick save button */}
          <button
            onClick={onSaveNow}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
            title="Lưu ngay (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 bg-transparent hover:bg-slate-200/50 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#121626] border border-transparent focus:border-blue-500/50 rounded-lg px-2 py-1 font-bold text-slate-900 dark:text-white focus:outline-none transition-all truncate"
            placeholder="Tên văn bản..."
          />
        </div>

        {/* Action Buttons: Import, Export, Print */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={onImportDocx}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-medium"
            title="Mở file Word (.docx) từ máy tính"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Mở .docx</span>
          </button>

          <button
            onClick={onExportDocx}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs shadow-blue-500/20"
            title="Tải văn bản về dạng file Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải .docx</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-medium"
            title="In hoặc Xuất PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">In / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Tabs */}
      <div className="flex items-center px-3 bg-slate-100/70 dark:bg-[#080b14]/70 border-b border-slate-200 dark:border-white/5 text-xs font-semibold gap-1">
        {(['home', 'insert', 'layout', 'merge'] as RibbonTab[]).map((tab) => {
          const labels: Record<RibbonTab, string> = {
            home: 'Trang Đầu',
            insert: 'Chèn',
            layout: 'Bố Trí Trang',
            merge: 'Trộn Thư & Dữ Liệu',
          };
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-[#5c36f5] text-blue-600 dark:text-white bg-blue-500/10 dark:bg-[#5c36f5]/10 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 3. Ribbon Toolbar Controls per Tab */}
      <div className="p-2 min-h-[48px] flex items-center gap-2 overflow-x-auto text-xs bg-white dark:bg-[#0c0f1e]">
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
              className="flex items-center gap-2 px-3 py-1.5 bg-[#5c36f5] hover:bg-[#4d2ee0] text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mở bảng trộn thư &amp; điền tự động dữ liệu học sinh</span>
            </button>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Tự động thay thế các thẻ {'{{ten_hoc_sinh}}'}, {'{{lop_hoc}}'} bằng hồ sơ trung tâm.
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
