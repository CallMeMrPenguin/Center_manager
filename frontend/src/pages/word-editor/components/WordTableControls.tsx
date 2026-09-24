import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Rows, 
  Columns, 
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
    <div className="flex items-center gap-1 bg-white dark:bg-[#121626] border border-blue-500/40 rounded-xl p-1 text-xs shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-2 border-r border-slate-200 dark:border-white/10 flex items-center gap-1">
        <Rows className="w-3 h-3" />
        Bảng
      </span>

      {/* Row operations */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Thêm hàng phía trên"
        >
          <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Hàng trên</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Thêm hàng phía dưới"
        >
          <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Hàng dưới</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
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
          className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Thêm cột bên trái"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Cột trái</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Thêm cột bên phải"
        >
          <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Cột phải</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
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
          className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Gộp các ô đang chọn"
        >
          <Merge className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().splitCell().run()}
          className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Tách ô"
        >
          <Split className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-1 font-bold"
          title="Xóa toàn bộ bảng"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Xóa bảng</span>
        </button>
      </div>
    </div>
  );
};
