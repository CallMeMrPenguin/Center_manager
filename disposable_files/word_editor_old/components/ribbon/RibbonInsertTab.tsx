import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Table as TableIcon, Image as ImageIcon, Minus, Sparkles, ChevronDown } from 'lucide-react';

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
  const tablePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertImagePrompt = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex items-center gap-1 text-xs select-none">
      {/* 1. Table Tool Button & Authentic Square Grid Dropdown */}
      <div className="relative" ref={tablePickerRef}>
        <button
          type="button"
          onClick={() => setShowTablePicker(!showTablePicker)}
          className="h-7 flex items-center gap-1.5 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-transparent hover:border-slate-300 dark:hover:border-white/15 rounded-[2px] transition-colors cursor-pointer font-medium text-xs"
          title="Chèn bảng"
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>Bảng</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showTablePicker && (
          <div className="absolute top-full left-0 mt-0.5 p-2.5 bg-white dark:bg-[#121626] border border-slate-300 dark:border-white/15 rounded-[2px] shadow-2xl z-[9999]">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
              Bảng {tableHover.r} x {tableHover.c}
            </div>
            {/* Authentic Square Table Grid (NO circles) */}
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
                    className={`w-4 h-4 border rounded-[1px] cursor-pointer transition-colors ${
                      r < tableHover.r && c < tableHover.c
                        ? 'bg-[#2563eb] border-[#2563eb]'
                        : 'border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:border-blue-400'
                    }`}
                  />
                ))
              )}
            </div>
            <div className="text-[10px] text-center text-slate-500 dark:text-slate-400">
              Kéo chuột để chọn kích cỡ bảng
            </div>
          </div>
        )}
      </div>

      <div className="h-6 w-[1px] bg-slate-300 dark:bg-white/10 mx-1 shrink-0" />

      {/* 2. Insert Image */}
      <button
        type="button"
        onClick={insertImagePrompt}
        className="h-7 flex items-center gap-1.5 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-transparent hover:border-slate-300 dark:hover:border-white/15 rounded-[2px] transition-colors cursor-pointer font-medium text-xs"
        title="Chèn ảnh từ URL"
      >
        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
        <span>Hình ảnh</span>
      </button>

      {/* 3. Horizontal Line */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        className="h-7 flex items-center gap-1.5 px-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-transparent hover:border-slate-300 dark:hover:border-white/15 rounded-[2px] transition-colors cursor-pointer font-medium text-xs"
        title="Chèn đường phân cách ngang"
      >
        <Minus className="w-3.5 h-3.5 text-slate-500" />
        <span>Đường kẻ ngang</span>
      </button>

      <div className="h-6 w-[1px] bg-slate-300 dark:bg-white/10 mx-1 shrink-0" />

      {/* 4. Dynamic Merge Field */}
      <button
        type="button"
        onClick={onOpenMergeModal}
        className="h-7 flex items-center gap-1.5 px-2.5 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-transparent hover:border-purple-300 dark:hover:border-purple-500/30 rounded-[2px] transition-colors cursor-pointer font-medium text-xs"
        title="Chèn thẻ dữ liệu học sinh động"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span>Trộn dữ liệu</span>
      </button>
    </div>
  );
};
