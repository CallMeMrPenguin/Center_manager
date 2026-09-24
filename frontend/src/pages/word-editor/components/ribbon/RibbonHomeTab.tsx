import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Subscript as SubIcon, Superscript as SuperIcon, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, RemoveFormatting
} from 'lucide-react';

interface RibbonHomeTabProps {
  editor: Editor | null;
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

export const RibbonHomeTab: React.FC<RibbonHomeTabProps> = ({ editor }) => {
  return (
    <div className="flex items-center gap-2 w-full flex-wrap">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Font Family */}
      <select
        onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
        className="bg-slate-100 dark:bg-[#121626] border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer w-28"
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
        className="bg-slate-100 dark:bg-[#121626] border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer w-28"
      >
        <option value="p">Văn bản thường</option>
        <option value="h1">Tiêu đề 1 (H1)</option>
        <option value="h2">Tiêu đề 2 (H2)</option>
        <option value="h3">Tiêu đề 3 (H3)</option>
      </select>

      <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10" />

      {/* Bold / Italic / Underline / Strike */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('bold') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('italic') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('underline') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('strike') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Gạch ngang chữ"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('subscript') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Chỉ số dưới (X₂)"
        >
          <SubIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('superscript') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Chỉ số trên (X²)"
        >
          <SuperIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-white/10">
        <label className="flex items-center gap-1 cursor-pointer" title="Màu chữ">
          <span className="font-bold underline text-blue-600 dark:text-blue-400">A</span>
          <input
            type="color"
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </label>
        <label className="flex items-center gap-1 cursor-pointer" title="Màu nền đánh dấu (Highlight)">
          <span className="font-bold bg-amber-400/30 text-amber-700 dark:text-amber-300 px-1 rounded">HL</span>
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
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
          title="Xóa định dạng"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn trái"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn giữa"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn phải"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'justify' }) ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
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
            editor?.isActive('bulletList') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Danh sách gạch đầu dòng"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('orderedList') ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Danh sách đánh số"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
