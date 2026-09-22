import React, { useState, useRef, useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Trash2,
  MousePointer,
  Palette,
  Sliders,
  Undo2,
  Redo2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { DrawTool } from '../../../utils/drawingEngine';

interface DrawingToolbarProps {
  activeTool: DrawTool;
  setActiveTool: (tool: DrawTool) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  currentSize: number;
  penSize: number;
  setPenSize: (size: number) => void;
  hlSize: number;
  setHlSize: (size: number) => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  toolbarPos: { x: number; y: number } | null;
  onMouseDown: (e: React.MouseEvent) => void;
}

const PRESET_COLORS = [
  { label: 'Vàng', value: '#ffd600' },
  { label: 'Đỏ', value: '#ff3344' },
  { label: 'Xanh lam', value: '#00b0ff' },
  { label: 'Xanh lá', value: '#00e676' },
  { label: 'Cam', value: '#ff9100' },
  { label: 'Tím hồng', value: '#e040fb' },
  { label: 'Trắng', value: '#ffffff' },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  selectedColor,
  setSelectedColor,
  currentSize,
  penSize,
  setPenSize,
  hlSize,
  setHlSize,
  eraserSize,
  setEraserSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAll,
  toolbarPos,
  onMouseDown,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showColorPopover, setShowColorPopover] = useState<boolean>(false);
  const [showSizePopover, setShowSizePopover] = useState<boolean>(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPopover(false);
        setShowSizePopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div
      ref={toolbarRef}
      style={toolbarPos ? { transform: `translate3d(${toolbarPos.x}px, ${toolbarPos.y}px, 0)` } : {}}
      className="fixed top-20 right-8 z-[100] pointer-events-auto flex items-center bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xl select-none overflow-visible"
    >
      {/* Draggable Grip Handle */}
      <div
        onMouseDown={onMouseDown}
        className="p-1 text-slate-400 hover:text-slate-600 cursor-move shrink-0"
        title="Kéo thả để di chuyển thanh công cụ vẽ"
      >
        <GripVertical size={14} />
      </div>

      {/* COLLAPSED MINI-BUTTON (With smooth sliding animation) */}
      <div
        className={`flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? 'max-w-[120px] opacity-100 ml-1' : 'max-w-0 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition cursor-pointer shadow-md shrink-0"
          title="Mở rộng thanh vẽ"
        >
          {activeTool === 'eraser' ? (
            <Eraser size={14} className="text-rose-200" />
          ) : activeTool === 'highlighter' ? (
            <Highlighter size={14} className="text-amber-200" />
          ) : activeTool === 'pen' ? (
            <Pen size={14} className="text-indigo-200" />
          ) : (
            <MousePointer size={14} />
          )}
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* EXPANDED FULL TOOLBAR (With smooth folding animation) */}
      <div
        className={`flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? 'max-w-0 opacity-0 pointer-events-none overflow-hidden' : 'max-w-[700px] opacity-100 ml-1 overflow-visible'
        }`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveTool('none'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'none'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Chế độ con trỏ chuột (Phím 1)"
        >
          <MousePointer size={13} />
          <span className="hidden sm:inline">Chuột</span>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveTool('pen'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'pen'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Bút vẽ (Phím 2 | Giữ Shift kẻ đường thẳng)"
        >
          <Pen size={13} />
          <span className="hidden sm:inline">Bút</span>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveTool('highlighter'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'highlighter'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
          title="Dạ quang (Phím 3 | Giữ Shift gạch thẳng dòng)"
        >
          <Highlighter size={13} />
          <span className="hidden sm:inline">Dạ quang</span>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveTool('eraser'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'eraser'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
          title="Tẩy xóa nét vẽ (Phím 4)"
        >
          <Eraser size={13} />
          <span className="hidden sm:inline">Tẩy</span>
        </button>

        {activeTool !== 'none' && activeTool !== 'eraser' && (
          <div className="relative flex items-center shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowColorPopover(!showColorPopover); setShowSizePopover(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer border border-slate-200 shadow-xs"
              title="Chọn màu mực vẽ"
            >
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-xs shrink-0" style={{ backgroundColor: selectedColor }} />
              <Palette size={13} className="text-slate-600" />
            </button>

            {showColorPopover && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2 bg-white border border-slate-200 p-3 rounded-2xl shadow-2xl z-[200] space-y-3 min-w-[220px]"
              >
                <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Bảng màu gợi ý</div>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedColor(c.value);
                        setShowColorPopover(false);
                      }}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer transform hover:scale-115 active:scale-95 border-2 ${
                        selectedColor.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-slate-800 scale-110 border-white shadow-sm' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600">Tùy chỉnh:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border border-slate-300 p-0"
                      title="Chọn màu tự do"
                    />
                    <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase">{selectedColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool !== 'none' && (
          <div className="relative flex items-center shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowSizePopover(!showSizePopover); setShowColorPopover(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer border border-slate-200 text-xs font-black text-indigo-600 shadow-xs"
              title="Chỉnh độ dày"
            >
              <Sliders size={13} className="text-indigo-600" />
              <span>{currentSize}px</span>
            </button>

            {showSizePopover && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-2 bg-white border border-slate-200 p-3 rounded-2xl shadow-2xl z-[200] space-y-2.5 min-w-[200px]"
              >
                <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-900 tracking-wider">
                  <span>{activeTool === 'eraser' ? 'Kích thước tẩy' : 'Độ dày nét'}</span>
                  <span className="font-mono text-slate-900 font-black">{currentSize}px</span>
                </div>
                <input
                  type="range"
                  min={activeTool === 'pen' ? 1 : activeTool === 'highlighter' ? 8 : 10}
                  max={activeTool === 'pen' ? 30 : activeTool === 'highlighter' ? 60 : 80}
                  value={currentSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (activeTool === 'pen') setPenSize(val);
                    else if (activeTool === 'highlighter') setHlSize(val);
                    else setEraserSize(val);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer disabled:opacity-30 shrink-0"
          title="Hoàn tác (Ctrl + Z)"
        >
          <Undo2 size={13} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer disabled:opacity-30 shrink-0"
          title="Làm lại (Ctrl + Y)"
        >
          <Redo2 size={13} />
        </button>

        <button
          onClick={onClearAll}
          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
          title="Xóa toàn bộ nét vẽ"
        >
          <Trash2 size={13} />
        </button>

        {/* COLLAPSE TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer border-l border-slate-200 ml-0.5 shrink-0"
          title="Thu gọn thanh vẽ"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
