import React, { useState } from 'react';
import {
  MousePointer, Type, Pen, Highlighter, Eraser, Minus, ArrowUpRight,
  Square, Circle, Palette, Sliders, Undo2, Redo2, Trash2
} from 'lucide-react';
import { CanvasTool, PRESET_COLORS, PRESET_BG_COLORS, FONT_FAMILIES } from '../types';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedBgColor: string;
  setSelectedBgColor: (color: string) => void;
  selectedFontFamily?: string;
  setSelectedFontFamily?: (font: string) => void;
  textSize?: number;
  setTextSize?: (size: number) => void;
  currentSize: number;
  penSize: number;
  setPenSize: (size: number) => void;
  hlSize: number;
  setHlSize: (size: number) => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  setShapeSize: (size: number) => void;
  undoStackLength: number;
  redoStackLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onClearPage: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  setActiveTool,
  selectedColor,
  setSelectedColor,
  selectedBgColor,
  setSelectedBgColor,
  selectedFontFamily = '"Times New Roman", Times, serif',
  setSelectedFontFamily,
  textSize = 20,
  setTextSize,
  currentSize,
  penSize,
  setPenSize,
  hlSize,
  setHlSize,
  eraserSize,
  setEraserSize,
  setShapeSize,
  undoStackLength,
  redoStackLength,
  onUndo,
  onRedo,
  onClearPage,
}) => {
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showSizePopover, setShowSizePopover] = useState(false);

  return (
    <div className="p-2 bg-[#0a0d18] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0 z-30 select-none">
      {/* Tool Buttons */}
      <div className="flex items-center gap-1">
        {/* Select */}
        <button
          onClick={() => setActiveTool('select')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTool === 'select' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Chọn, di chuyển ảnh/chữ (Double-click ảnh để cắt kiểu Word)"
        >
          <MousePointer size={13} />
          <span>Chọn</span>
        </button>

        {/* Text Box */}
        <button
          onClick={() => setActiveTool('text')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTool === 'text' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Thêm Text Box (Font Times New Roman, nền trắng, chữ đỏ mặc định)"
        >
          <Type size={13} />
          <span>Chèn chữ</span>
        </button>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Pen */}
        <button
          onClick={() => setActiveTool('pen')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTool === 'pen' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Bút vẽ (Giữ Shift để vẽ đường thẳng)"
        >
          <Pen size={13} />
          <span>Bút</span>
        </button>

        {/* Highlighter */}
        <button
          onClick={() => setActiveTool('highlighter')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTool === 'highlighter' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Dạ quang highlight"
        >
          <Highlighter size={13} />
          <span>Dạ quang</span>
        </button>

        {/* Eraser */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTool === 'eraser' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Tẩy xóa nét vẽ"
        >
          <Eraser size={13} />
          <span>Tẩy</span>
        </button>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Shapes */}
        <button
          onClick={() => setActiveTool('line')}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            activeTool === 'line' ? 'bg-[#5c36f5] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Đường thẳng (Giữ Shift để căn thẳng 45°)"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={() => setActiveTool('arrow')}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            activeTool === 'arrow' ? 'bg-[#5c36f5] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Mũi tên"
        >
          <ArrowUpRight size={14} />
        </button>

        <button
          onClick={() => setActiveTool('rect')}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            activeTool === 'rect' ? 'bg-[#5c36f5] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Hình chữ nhật"
        >
          <Square size={14} />
        </button>

        <button
          onClick={() => setActiveTool('circle')}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            activeTool === 'circle' ? 'bg-[#5c36f5] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Hình tròn"
        >
          <Circle size={14} />
        </button>
        {/* Font Family selector for Text tool */}
        {activeTool === 'text' && setSelectedFontFamily && (
          <div className="flex items-center gap-1.5 bg-[#141829] border border-white/15 px-2 py-1 rounded-xl ml-1">
            <span className="text-[11px] font-bold text-slate-400">Kiểu:</span>
            <select
              value={selectedFontFamily}
              onChange={(e) => setSelectedFontFamily(e.target.value)}
              className="bg-[#141829] text-white text-xs font-bold focus:outline-none cursor-pointer border-0"
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.value} value={f.value} className="bg-[#0c0f1e] text-white">{f.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Color Popover */}
        {!['select', 'eraser'].includes(activeTool) && (
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPopover(!showColorPopover);
                setShowSizePopover(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-xs text-slate-300"
            >
              <div className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: selectedColor }} />
              <Palette size={12} />
            </button>

            {showColorPopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c0f1e] border border-[#212c4b] p-3 rounded-2xl shadow-2xl z-50 space-y-3 min-w-[220px]">
                {/* Ink Color */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-300">Màu chữ / Nét vẽ</div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => {
                          setSelectedColor(c.value);
                          if (activeTool !== 'text') setShowColorPopover(false);
                        }}
                        className={`w-6 h-6 rounded-full transition cursor-pointer transform hover:scale-110 border ${
                          selectedColor === c.value ? 'ring-2 ring-indigo-400 scale-110 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Background color for Text Box */}
                {activeTool === 'text' && (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="text-[11px] font-bold text-slate-300">Màu nền Text Box</div>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_BG_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setSelectedBgColor(c.value)}
                          className={`w-6 h-6 rounded-lg transition cursor-pointer transform hover:scale-110 border ${
                            selectedBgColor === c.value ? 'ring-2 ring-indigo-400 scale-110 border-white' : 'border-white/20'
                          }`}
                          style={{ backgroundColor: c.value === 'transparent' ? '#182038' : c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Màu tự chọn:</span>
                  <label className="relative cursor-pointer flex items-center gap-2 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">{selectedColor}</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Size Slider Popover */}
        {!['select'].includes(activeTool) && (
          <div className="relative">
            <button
              onClick={() => {
                setShowSizePopover(!showSizePopover);
                setShowColorPopover(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-xs font-bold text-slate-300"
            >
              <Sliders size={12} />
              <span>{activeTool === 'text' ? (textSize || 20) : currentSize}px</span>
            </button>

            {showSizePopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c0f1e] border border-[#212c4b] p-3 rounded-2xl shadow-2xl z-50 space-y-2.5 min-w-[230px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>{activeTool === 'eraser' ? 'Kích thước tẩy' : activeTool === 'text' ? 'Cỡ chữ' : 'Độ dày nét'}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={activeTool === 'text' ? (textSize || 20) : currentSize}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(150, parseInt(e.target.value) || 1));
                        if (activeTool === 'text' && setTextSize) setTextSize(val);
                        else if (activeTool === 'pen') setPenSize(val);
                        else if (activeTool === 'highlighter') setHlSize(val);
                        else if (activeTool === 'eraser') setEraserSize(val);
                        else setShapeSize(val);
                      }}
                      className="w-14 bg-[#141829] border border-white/20 text-white rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center focus:outline-none focus:border-indigo-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">px</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={activeTool === 'pen' ? 1 : activeTool === 'highlighter' ? 8 : activeTool === 'text' ? 10 : 4}
                    max={activeTool === 'pen' ? 50 : activeTool === 'highlighter' ? 80 : activeTool === 'text' ? 80 : 120}
                    value={activeTool === 'text' ? (textSize || 20) : currentSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (activeTool === 'text' && setTextSize) setTextSize(val);
                      else if (activeTool === 'pen') setPenSize(val);
                      else if (activeTool === 'highlighter') setHlSize(val);
                      else if (activeTool === 'eraser') setEraserSize(val);
                      else setShapeSize(val);
                    }}
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5c36f5]"
                  />
                  <div
                    className="rounded-full shrink-0 border border-white/40"
                    style={{
                      width: Math.min(26, Math.max(4, (activeTool === 'text' ? (textSize || 20) : currentSize) / 2.5)),
                      height: Math.min(26, Math.max(4, (activeTool === 'text' ? (textSize || 20) : currentSize) / 2.5)),
                      backgroundColor: activeTool === 'eraser' ? '#ff3344' : selectedColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onUndo}
          disabled={undoStackLength === 0}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
          title="Hoàn tác (Ctrl + Z)"
        >
          <Undo2 size={14} />
        </button>

        <button
          onClick={onRedo}
          disabled={redoStackLength === 0}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
          title="Làm lại (Ctrl + Y)"
        >
          <Redo2 size={14} />
        </button>

        <button
          onClick={onClearPage}
          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          title="Xóa toàn bộ nét vẽ của trang này"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
