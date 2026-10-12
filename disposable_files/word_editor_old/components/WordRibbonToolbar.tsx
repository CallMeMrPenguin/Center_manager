import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Sparkles, Printer, Download, FolderOpen, FilePlus
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
  onNewDocument: () => void;
  onExportDocx: () => void;
  onPrint: () => void;
  onImportDocx: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onNewDocument,
  onExportDocx,
  onPrint,
  onImportDocx,
  onOpenMergeModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="relative z-30 bg-[#f9fafb] dark:bg-[#0c0f1e] border-b border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-white shrink-0 select-none shadow-xs">
      {/* 1. Word Desktop Quick Access Title & Actions Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-slate-200/80 dark:border-white/5 bg-[#f3f4f6]/80 dark:bg-[#080b14] text-xs gap-3">
        {/* Left: Word Icon & Editable Document Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-lg">
          {/* Word App Icon */}
          <div className="w-5 h-5 rounded-[2px] bg-[#2563eb] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-xs">
            W
          </div>

          {/* Document Title Input */}
          <div className="relative flex-1 min-w-[120px] max-w-sm">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full h-7 bg-transparent hover:bg-white dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#121626] border border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-[#2563eb] rounded-[2px] px-2 font-bold text-xs text-slate-800 dark:text-white focus:outline-none transition-all truncate"
              placeholder="Tên văn bản..."
            />
          </div>
        </div>

        {/* Right: Word Desktop Action Buttons */}
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
            onClick={onNewDocument}
            className="h-7 flex items-center gap-1.5 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-[3px] transition-colors cursor-pointer font-medium text-xs shrink-0 bg-white dark:bg-[#121626]"
            title="Tạo trang văn bản mới"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Văn bản mới</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 flex items-center gap-1.5 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-[3px] transition-colors cursor-pointer font-medium text-xs shrink-0 bg-white dark:bg-[#121626]"
            title="Mở file Word (.docx) từ máy tính"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Mở .docx</span>
          </button>

          <button
            type="button"
            onClick={onOpenMergeModal}
            className="h-7 flex items-center gap-1.5 px-2.5 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-300 dark:border-purple-500/30 rounded-[3px] transition-colors cursor-pointer font-medium text-xs shrink-0 bg-white dark:bg-[#121626]"
            title="Trộn thư và điền tự động dữ liệu học sinh"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Trộn thư</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="h-7 flex items-center gap-1.5 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-[3px] transition-colors cursor-pointer font-medium text-xs shrink-0 bg-white dark:bg-[#121626]"
            title="In hoặc Xuất PDF (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden lg:inline">In / PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportDocx}
            className="h-7 flex items-center gap-1.5 px-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-[3px] font-bold transition-colors cursor-pointer shadow-xs text-xs shrink-0"
            title="Tải văn bản về dạng file Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải .docx</span>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Tabs (Flat Microsoft Word Standard) */}
      <div className="flex items-center px-3 bg-[#f3f4f6] dark:bg-[#080b14] border-b border-slate-200/90 dark:border-white/5 text-xs font-semibold">
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
              className={`px-3.5 py-1.5 transition-all cursor-pointer font-medium text-xs border-b-2 ${
                isActive
                  ? 'border-[#2563eb] text-[#2563eb] dark:text-white bg-white dark:bg-[#0c0f1e] font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 3. Ribbon Controls Bar (Clean Desktop Group Layout) */}
      <div className="px-3 py-1.5 min-h-[42px] flex items-center gap-1 text-xs bg-white dark:bg-[#0c0f1e] relative z-40">
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
              className="h-7 flex items-center gap-2 px-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-[3px] font-bold transition-colors cursor-pointer shadow-xs text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
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
