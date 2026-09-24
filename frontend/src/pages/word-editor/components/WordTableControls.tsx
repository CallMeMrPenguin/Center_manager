import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Rows, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Merge, 
  Split 
} from 'lucide-react';

interface WordTableControlsProps {
  editor: Editor | null;
}

export const WordTableControls: React.FC<WordTableControlsProps> = ({ editor }) => {
  if (!editor || !editor.can().deleteTable()) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-[#121626] border border-slate-300 dark:border-white/15 rounded-[2px] px-2 py-0.5 text-xs shadow-md">
      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider pr-1.5 border-r border-slate-200 dark:border-white/10 flex items-center gap-1">
        <Rows className="w-3 h-3" />
        Bảng
      </span>

      {/* Row operations */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="h-6 px-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer text-xs"
          title="Thêm hàng phía trên"
        >
          <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Hàng trên</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="h-6 px-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer text-xs"
          title="Thêm hàng phía dưới"
        >
          <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Hàng dưới</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="h-6 px-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer text-xs"
          title="Xóa hàng hiện tại"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xóa hàng</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

      {/* Column operations */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="h-6 px-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer text-xs"
          title="Thêm cột bên trái"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Cột trái</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="h-6 px-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer text-xs"
          title="Thêm cột bên phải"
        >
          <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Cột phải</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="h-6 px-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer text-xs"
          title="Xóa cột hiện tại"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xóa cột</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

      {/* Cell merge / split & delete table */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().mergeCells().run()}
          className="h-6 px-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[2px] transition-colors cursor-pointer text-xs"
          title="Gộp các ô đang chọn"
        >
          <Merge className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().splitCell().run()}
          className="h-6 px-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[2px] transition-colors cursor-pointer text-xs"
          title="Tách ô"
        >
          <Split className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="h-6 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer ml-1 font-bold text-xs"
          title="Xóa toàn bộ bảng"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Xóa bảng</span>
        </button>
      </div>
    </div>
  );
};
