import React, { useState } from 'react';
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

  return (
    <div
      style={toolbarPos ? { transform: `translate3d(${toolbarPos.x}px, ${toolbarPos.y}px, 0)` } : {}}
      className="fixed top-20 right-8 z-[100] pointer-events-auto flex items-center bg-[#12162a] border-2 border-[#5c36f5]/70 p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(92,54,245,0.35)] select-none ring-1 ring-white/15 overflow-hidden"
    >
      {/* Draggable Grip Handle */}
      <div
        onMouseDown={onMouseDown}
        className="p-1 text-indigo-400 hover:text-indigo-200 cursor-move shrink-0"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-black transition cursor-pointer shadow-[0_0_12px_rgba(92,54,245,0.6)] shrink-0"
          title="Mở rộng thanh vẽ"
        >
          {activeTool === 'eraser' ? (
            <Eraser size={14} className="text-rose-300" />
          ) : activeTool === 'highlighter' ? (
            <Highlighter size={14} className="text-amber-300" />
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
        className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[700px] opacity-100 ml-1'
        }`}
      >
        <button
          onClick={() => { setActiveTool('none'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'none'
              ? 'bg-[#5c36f5] text-white shadow-[0_0_12px_rgba(92,54,245,0.7)]'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Chế độ con trỏ chuột (Phím 1)"
        >
          <MousePointer size={13} />
          <span className="hidden sm:inline">Chuột</span>
        </button>

        <button
          onClick={() => { setActiveTool('pen'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'pen'
              ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.7)]'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Bút vẽ (Phím 2 | Giữ Shift kẻ đường thẳng)"
        >
          <Pen size={13} />
          <span className="hidden sm:inline">Bút</span>
        </button>

        <button
          onClick={() => { setActiveTool('highlighter'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'highlighter'
              ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]'
              : 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/10'
          }`}
          title="Dạ quang (Phím 3 | Giữ Shift gạch thẳng dòng)"
        >
          <Highlighter size={13} />
          <span className="hidden sm:inline">Dạ quang</span>
        </button>

        <button
          onClick={() => { setActiveTool('eraser'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTool === 'eraser'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.7)]'
              : 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/10'
          }`}
          title="Tẩy xóa nét vẽ (Phím 4)"
        >
          <Eraser size={13} />
          <span className="hidden sm:inline">Tẩy</span>
        </button>

        {activeTool !== 'none' && activeTool !== 'eraser' && (
          <div className="relative flex items-center shrink-0">
            <button
              onClick={() => { setShowColorPopover(!showColorPopover); setShowSizePopover(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1c2242] hover:bg-[#252d58] transition cursor-pointer border border-indigo-500/30"
              title="Chọn màu mực vẽ"
            >
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: selectedColor }} />
              <Palette size={12} className="text-slate-300" />
            </button>

            {showColorPopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#12162a] border-2 border-[#5c36f5]/60 p-3 rounded-2xl shadow-2xl z-50 space-y-2.5 min-w-[210px]">
                <div className="text-[11px] font-bold text-slate-200">Bảng màu gợi ý</div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setSelectedColor(c.value); setShowColorPopover(false); }}
                      className={`w-6 h-6 rounded-full transition cursor-pointer transform hover:scale-110 border ${
                        selectedColor.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-white scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool !== 'none' && (
          <div className="relative flex items-center shrink-0">
            <button
              onClick={() => { setShowSizePopover(!showSizePopover); setShowColorPopover(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1c2242] hover:bg-[#252d58] transition cursor-pointer border border-indigo-500/30 text-xs font-black text-indigo-300"
              title="Chỉnh độ dày"
            >
              <Sliders size={12} className="text-indigo-400" />
              <span>{currentSize}px</span>
            </button>

            {showSizePopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#12162a] border-2 border-[#5c36f5]/60 p-3 rounded-2xl shadow-2xl z-50 space-y-2 min-w-[180px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                  <span>{activeTool === 'eraser' ? 'Kích thước tẩy' : 'Độ dày nét'}</span>
                  <span className="font-mono text-indigo-400 font-black">{currentSize}px</span>
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
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5c36f5]"
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30 shrink-0"
          title="Hoàn tác (Ctrl + Z)"
        >
          <Undo2 size={13} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30 shrink-0"
          title="Làm lại (Ctrl + Y)"
        >
          <Redo2 size={13} />
        </button>

        <button
          onClick={onClearAll}
          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer shrink-0"
          title="Xóa toàn bộ nét vẽ"
        >
          <Trash2 size={13} />
        </button>

        {/* COLLAPSE TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer border-l border-white/10 ml-0.5 shrink-0"
          title="Thu gọn thanh vẽ"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
