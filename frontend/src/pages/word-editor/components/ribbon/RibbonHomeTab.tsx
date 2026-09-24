import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Subscript as SubIcon, Superscript as SuperIcon, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, ChevronDown, Check
} from 'lucide-react';
import { ColorPickers } from './ColorPickers';

interface RibbonHomeTabProps {
  editor: Editor | null;
}

const FONT_FAMILIES = [
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const HEADING_OPTIONS = [
  { label: 'Văn bản thường', value: 'p', className: 'text-xs' },
  { label: 'Tiêu đề 1 (H1)', value: 'h1', className: 'text-base font-bold' },
  { label: 'Tiêu đề 2 (H2)', value: 'h2', className: 'text-sm font-bold' },
  { label: 'Tiêu đề 3 (H3)', value: 'h3', className: 'text-xs font-bold' },
];

export const RibbonHomeTab: React.FC<RibbonHomeTabProps> = ({ editor }) => {
  const [fontOpen, setFontOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);

  const fontRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setFontOpen(false);
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) setHeadingOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentHeadingValue = editor?.isActive('heading', { level: 1 })
    ? 'h1'
    : editor?.isActive('heading', { level: 2 })
    ? 'h2'
    : editor?.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  const currentHeadingLabel =
    HEADING_OPTIONS.find((h) => h.value === currentHeadingValue)?.label || 'Văn bản thường';

  return (
    <div className="flex items-center gap-1.5 w-full flex-wrap text-xs select-none">
      {/* 1. Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Custom Font Family Dropdown */}
      <div className="relative shrink-0" ref={fontRef}>
        <button
          type="button"
          onClick={() => setFontOpen(!fontOpen)}
          className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-slate-100/90 hover:bg-slate-200/80 dark:bg-[#121626] dark:hover:bg-white/10 border border-slate-300/80 dark:border-white/10 rounded-md text-xs font-medium text-slate-800 dark:text-slate-100 cursor-pointer min-w-[130px] transition-colors"
          title="Phông chữ"
        >
          <span className="truncate">Times New Roman</span>
          <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${fontOpen ? 'rotate-180' : ''}`} />
        </button>
        {fontOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#121626] border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  editor?.chain().focus().setFontFamily(f.value).run();
                  setFontOpen(false);
                }}
                style={{ fontFamily: f.value }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-xs text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Custom Headings Dropdown */}
      <div className="relative shrink-0" ref={headingRef}>
        <button
          type="button"
          onClick={() => setHeadingOpen(!headingOpen)}
          className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-slate-100/90 hover:bg-slate-200/80 dark:bg-[#121626] dark:hover:bg-white/10 border border-slate-300/80 dark:border-white/10 rounded-md text-xs font-medium text-slate-800 dark:text-slate-100 cursor-pointer min-w-[125px] transition-colors"
          title="Kiểu định dạng đoạn văn"
        >
          <span className="truncate">{currentHeadingLabel}</span>
          <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${headingOpen ? 'rotate-180' : ''}`} />
        </button>
        {headingOpen && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-[#121626] border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100">
            {HEADING_OPTIONS.map((h) => {
              const isSelected = currentHeadingValue === h.value;
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => {
                    if (h.value === 'p') editor?.chain().focus().setParagraph().run();
                    else if (h.value === 'h1') editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    else if (h.value === 'h2') editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    else if (h.value === 'h3') editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    setHeadingOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-500/10' : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <span className={h.className}>{h.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

      {/* 4. Text Formats: Bold, Italic, Underline, Strike, Sub, Super */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('bold') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('italic') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('underline') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('strike') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Gạch ngang chữ"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('subscript') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Chỉ số dưới (X₂)"
        >
          <SubIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('superscript') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Chỉ số trên (X²)"
        >
          <SuperIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Custom Color Pickers (Text Color, Highlight, Clear) */}
      <ColorPickers editor={editor} />

      {/* 6. Alignment */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'left' }) ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn trái"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'center' }) ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn giữa"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'right' }) ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn phải"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive({ textAlign: 'justify' }) ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Căn đều hai bên"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7. Bullet & Numbered Lists */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('bulletList') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Danh sách gạch đầu dòng"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor?.isActive('orderedList') ? 'bg-[#2563eb] text-white shadow-xs font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
          title="Danh sách đánh số"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
