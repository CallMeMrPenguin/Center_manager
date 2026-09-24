import React, { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Subscript as SubIcon, Superscript as SuperIcon, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Table as TableIcon,
  Image as ImageIcon, Minus, Sparkles, Printer, Download,
  FolderOpen, ChevronLeft, Save, RemoveFormatting, FileText, Check
} from 'lucide-react';
import { RibbonTab, MarginConfig, Orientation, PaperSize } from '../types';

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

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
];

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
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({ r: 3, c: 3 });

  const insertImagePrompt = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <header className="bg-[#0c0f1e] border-b border-white/10 text-white shrink-0 select-none">
      {/* 1. Quick Access Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#080b14] text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <button
            onClick={onBackToList}
            className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Quay lại danh sách văn bản"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold hidden sm:inline">Danh sách</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Quick save button */}
          <button
            onClick={onSaveNow}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
            title="Lưu ngay (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 bg-transparent hover:bg-white/5 focus:bg-[#121626] border border-transparent focus:border-blue-500/50 rounded-lg px-2 py-1 font-semibold text-white focus:outline-none transition-all truncate"
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
            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Mở file Word (.docx) từ máy tính"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Mở .docx</span>
          </button>

          <button
            onClick={onExportDocx}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            title="Tải văn bản về dạng file Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải .docx</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="In hoặc Xuất PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">In / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Tabs */}
      <div className="flex items-center px-3 bg-[#080b14]/70 border-b border-white/5 text-xs font-semibold gap-1">
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
                  ? 'border-[#5c36f5] text-white bg-[#5c36f5]/10 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 3. Ribbon Toolbar Controls per Tab */}
      <div className="p-2 min-h-[52px] flex items-center gap-2 overflow-x-auto text-xs bg-[#0c0f1e]">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2 w-full flex-wrap">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
              <button
                type="button"
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor?.can().undo()}
                className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 cursor-pointer"
                title="Hoàn tác (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor?.can().redo()}
                className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 cursor-pointer"
                title="Làm lại (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Family */}
            <select
              onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
              className="bg-[#121626] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer w-28"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            {/* Headings */}
            <select
              value={
                editor?.isActive('heading', { level: 1 }) ? 'h1' :
                editor?.isActive('heading', { level: 2 }) ? 'h2' :
                editor?.isActive('heading', { level: 3 }) ? 'h3' : 'p'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'p') editor?.chain().focus().setParagraph().run();
                else if (val === 'h1') editor?.chain().focus().toggleHeading({ level: 1 }).run();
                else if (val === 'h2') editor?.chain().focus().toggleHeading({ level: 2 }).run();
                else if (val === 'h3') editor?.chain().focus().toggleHeading({ level: 3 }).run();
              }}
              className="bg-[#121626] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer w-28"
            >
              <option value="p">Văn bản thường</option>
              <option value="h1">Tiêu đề 1 (H1)</option>
              <option value="h2">Tiêu đề 2 (H2)</option>
              <option value="h3">Tiêu đề 3 (H3)</option>
            </select>

            <div className="h-5 w-[1px] bg-white/10" />

            {/* Bold / Italic / Underline / Strike */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('bold') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="In đậm (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('italic') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="In nghiêng (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('underline') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Gạch chân (Ctrl+U)"
              >
                <UnderlineIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('strike') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Gạch ngang chữ"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleSubscript().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('subscript') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Chỉ số dưới (X₂)"
              >
                <SubIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('superscript') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Chỉ số trên (X²)"
              >
                <SuperIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
              <label className="flex items-center gap-1 cursor-pointer" title="Màu chữ">
                <span className="font-bold underline text-blue-400">A</span>
                <input
                  type="color"
                  onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </label>
              <label className="flex items-center gap-1 cursor-pointer" title="Màu nền đánh dấu (Highlight)">
                <span className="font-bold bg-amber-400/20 text-amber-300 px-1 rounded">HL</span>
                <input
                  type="color"
                  defaultValue="#fef08a"
                  onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </label>
              <button
                type="button"
                onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-300 cursor-pointer"
                title="Xóa định dạng"
              >
                <RemoveFormatting className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Căn trái"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Căn giữa"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Căn phải"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive({ textAlign: 'justify' }) ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Căn đều hai bên"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('bulletList') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Danh sách gạch đầu dòng"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  editor?.isActive('orderedList') ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
                title="Danh sách đánh số"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INSERT */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-3">
            {/* Table Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTablePicker(!showTablePicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121626] hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <TableIcon className="w-4 h-4 text-blue-400" />
                <span>Bảng ({tableHover.r}x{tableHover.c})</span>
              </button>
              {showTablePicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-[#0c0f1e] border border-white/15 rounded-xl shadow-2xl z-50">
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {Array.from({ length: 6 }).map((_, r) =>
                      Array.from({ length: 6 }).map((_, c) => (
                        <div
                          key={`${r}-${c}`}
                          onMouseEnter={() => setTableHover({ r: r + 1, c: c + 1 })}
                          onClick={() => {
                            editor?.chain().focus().insertTable({ rows: r + 1, cols: c + 1, withHeaderRow: true }).run();
                            setShowTablePicker(false);
                          }}
                          className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${
                            r < tableHover.r && c < tableHover.c
                              ? 'bg-blue-500 border-blue-400'
                              : 'border-white/20 bg-white/5'
                          }`}
                        />
                      ))
                    )}
                  </div>
                  <div className="text-[10px] text-center text-slate-400">
                    Bấm để chèn {tableHover.r} hàng x {tableHover.c} cột
                  </div>
                </div>
              )}
            </div>

            {/* Insert Image */}
            <button
              type="button"
              onClick={insertImagePrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121626] hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Chèn ảnh</span>
            </button>

            {/* Horizontal Line */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121626] hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4 text-slate-400" />
              <span>Đường kẻ ngang</span>
            </button>

            {/* Dynamic Merge Field */}
            <button
              type="button"
              onClick={onOpenMergeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Trường dữ liệu động...</span>
            </button>
          </div>
        )}

        {/* TAB 3: LAYOUT */}
        {activeTab === 'layout' && (
          <div className="flex items-center gap-4">
            {/* Paper Size */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Khổ giấy:</span>
              <select
                value={paperSize}
                onChange={(e) => onPaperSizeChange(e.target.value as PaperSize)}
                className="bg-[#121626] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="Letter">Letter (8.5 x 11 in)</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Hướng giấy:</span>
              <button
                type="button"
                onClick={() => onOrientationChange('portrait')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  orientation === 'portrait' ? 'bg-blue-600 text-white' : 'bg-[#121626] text-slate-400'
                }`}
              >
                Dọc
              </button>
              <button
                type="button"
                onClick={() => onOrientationChange('landscape')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  orientation === 'landscape' ? 'bg-blue-600 text-white' : 'bg-[#121626] text-slate-400'
                }`}
              >
                Ngang
              </button>
            </div>

            {/* Margins */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Lề:</span>
              <button
                type="button"
                onClick={() => onMarginsChange({ top: 20, bottom: 20, left: 25, right: 20 })}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  margins.left === 25 ? 'bg-blue-600 text-white' : 'bg-[#121626] text-slate-400'
                }`}
              >
                Chuẩn (2.5cm)
              </button>
              <button
                type="button"
                onClick={() => onMarginsChange({ top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 })}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  margins.left === 12.7 ? 'bg-blue-600 text-white' : 'bg-[#121626] text-slate-400'
                }`}
              >
                Hẹp (1.27cm)
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MERGE */}
        {activeTab === 'merge' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMergeModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#5c36f5] hover:bg-[#4d2ee0] text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mở bảng trộn thư &amp; điền tự động dữ liệu học sinh</span>
            </button>
            <span className="text-slate-400 text-xs">
              Tự động thay thế các thẻ {'{{ten_hoc_sinh}}'}, {'{{lop_hoc}}'}, {'{{hoc_phi}}'} bằng hồ sơ trung tâm.
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
