import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Table as TableIcon, Image as ImageIcon, Minus, Sparkles } from 'lucide-react';

interface RibbonInsertTabProps {
  editor: Editor | null;
  onOpenMergeModal: () => void;
}

export const RibbonInsertTab: React.FC<RibbonInsertTabProps> = ({
  editor,
  onOpenMergeModal,
}) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({ r: 3, c: 3 });

  const insertImagePrompt = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex items-center gap-3">
      {/* Table Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTablePicker(!showTablePicker)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#121626] dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-lg transition-colors cursor-pointer text-slate-800 dark:text-white"
        >
          <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Bảng ({tableHover.r}x{tableHover.c})</span>
        </button>
        {showTablePicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-[#0c0f1e] border border-slate-300 dark:border-white/15 rounded-xl shadow-2xl z-50">
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
                        ? 'bg-blue-600 border-blue-500'
                        : 'border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5'
                    }`}
                  />
                ))
              )}
            </div>
            <div className="text-[10px] text-center text-slate-500 dark:text-slate-400">
              Bấm để chèn {tableHover.r} hàng x {tableHover.c} cột
            </div>
          </div>
        )}
      </div>

      {/* Insert Image */}
      <button
        type="button"
        onClick={insertImagePrompt}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#121626] dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-lg transition-colors cursor-pointer text-slate-800 dark:text-white"
      >
        <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Chèn ảnh</span>
      </button>

      {/* Horizontal Line */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#121626] dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded-lg transition-colors cursor-pointer text-slate-800 dark:text-white"
      >
        <Minus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span>Đường kẻ ngang</span>
      </button>

      {/* Dynamic Merge Field */}
      <button
        type="button"
        onClick={onOpenMergeModal}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 rounded-lg transition-colors cursor-pointer font-medium"
      >
        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span>Trường dữ liệu động...</span>
      </button>
    </div>
  );
};
