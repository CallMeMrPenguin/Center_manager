import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Highlighter, ChevronDown, RemoveFormatting } from 'lucide-react';

const TEXT_COLORS = [
  { label: 'Đen mặc định', color: '#0f172a' },
  { label: 'Xám than', color: '#334155' },
  { label: 'Xanh dương đậm', color: '#1d4ed8' },
  { label: 'Xanh Word', color: '#2563eb' },
  { label: 'Xanh lục', color: '#059669' },
  { label: 'Hổ phách', color: '#d97706' },
  { label: 'Đỏ thẫm', color: '#dc2626' },
  { label: 'Tím đậm', color: '#7c3aed' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Vàng rực', color: '#fef08a' },
  { label: 'Xanh ngọc', color: '#bbf7d0' },
  { label: 'Xanh da trời', color: '#bae6fd' },
  { label: 'Hồng phấn', color: '#fbcfe8' },
  { label: 'Cam nhạt', color: '#fed7aa' },
];

interface ColorPickersProps {
  editor: Editor | null;
}

export const ColorPickers: React.FC<ColorPickersProps> = ({ editor }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState('#0f172a');

  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setColorOpen(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) setHighlightOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-white/10 shrink-0">
      {/* Text Color Popover */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          onClick={() => setColorOpen(!colorOpen)}
          className="flex flex-col items-center justify-center px-1.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          title="Màu chữ"
        >
          <span className="font-extrabold text-xs leading-none text-slate-800 dark:text-slate-100">A</span>
          <span className="w-3.5 h-1 rounded-full mt-0.5" style={{ backgroundColor: currentColor }} />
        </button>
        {colorOpen && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-[#121626] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl z-50 w-44 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Màu chữ</div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc.color}
                  type="button"
                  onClick={() => {
                    setCurrentColor(tc.color);
                    editor?.chain().focus().setColor(tc.color).run();
                    setColorOpen(false);
                  }}
                  style={{ backgroundColor: tc.color }}
                  className="w-7 h-7 rounded-md border border-slate-300/60 dark:border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                  title={tc.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight Popover */}
      <div className="relative" ref={highlightRef}>
        <button
          type="button"
          onClick={() => setHighlightOpen(!highlightOpen)}
          className="flex items-center gap-0.5 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer text-slate-700 dark:text-slate-300"
          title="Màu đánh dấu (Highlight)"
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>
        {highlightOpen && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-[#121626] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl z-50 w-44 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bút dạ quang</div>
            <div className="flex items-center gap-1.5 mb-2">
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.color}
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().toggleHighlight({ color: hc.color }).run();
                    setHighlightOpen(false);
                  }}
                  style={{ backgroundColor: hc.color }}
                  className="w-6 h-6 rounded-md border border-slate-300/60 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                  title={hc.label}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().unsetHighlight().run();
                setHighlightOpen(false);
              }}
              className="w-full py-1 text-center text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded cursor-pointer font-medium"
            >
              Không màu
            </button>
          </div>
        )}
      </div>

      {/* Clear formatting */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
        title="Xóa toàn bộ định dạng"
      >
        <RemoveFormatting className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
