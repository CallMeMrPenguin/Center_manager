import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { CanvasTextBox, Point, FONT_FAMILIES } from '../types';

interface CanvasTextBoxOverlayProps {
  textBoxes: CanvasTextBox[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (updated: CanvasTextBox) => void;
  onDelete?: (id: string) => void;
  zoom: number;
  pan: Point;
  activeTool: string;
  containerRect?: { width: number; height: number };
}

export const CanvasTextBoxOverlay: React.FC<CanvasTextBoxOverlayProps> = ({
  textBoxes,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  zoom,
  pan,
  activeTool,
  containerRect = { width: window.innerWidth, height: window.innerHeight },
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drag-to-move state
  const isDraggingRef = useRef(false);
  const dragStartMouseRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartTbPosRef = useRef<Point>({ x: 0, y: 0 });

  // Drag-to-resize state
  const isResizingRef = useRef(false);
  const resizeStartMouseRef = useRef<Point>({ x: 0, y: 0 });
  const resizeStartDimRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  return (
    <>
      {textBoxes.map((tb) => {
        const isSelected = selectedId === tb.id;
        const isEditing = editingId === tb.id;
        const screenX = tb.x * zoom + pan.x;
        const screenY = tb.y * zoom + pan.y;
        const screenW = tb.width * zoom;
        const screenH = tb.height * zoom;

        // Frustum culling: Don't render off-screen text boxes in the DOM
        if (
          !isSelected &&
          !isEditing &&
          (screenX + screenW < -100 ||
            screenX > containerRect.width + 100 ||
            screenY + screenH < -100 ||
            screenY > containerRect.height + 100)
        ) {
          return null;
        }

        const isEmpty = !tb.text || tb.text.trim() === '';

        return (
          <div
            key={tb.id}
            onPointerDown={(e) => {
              if (activeTool !== 'select' || isEditing) return;
              e.stopPropagation();
              onSelect(tb.id);

              isDraggingRef.current = true;
              dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
              dragStartTbPosRef.current = { x: tb.x, y: tb.y };

              const onPointerMove = (moveEvt: PointerEvent) => {
                if (!isDraggingRef.current) return;
                const dx = (moveEvt.clientX - dragStartMouseRef.current.x) / zoom;
                const dy = (moveEvt.clientY - dragStartMouseRef.current.y) / zoom;
                onUpdate({
                  ...tb,
                  x: dragStartTbPosRef.current.x + dx,
                  y: dragStartTbPosRef.current.y + dy,
                });
              };

              const onPointerUp = () => {
                isDraggingRef.current = false;
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
              };

              window.addEventListener('pointermove', onPointerMove);
              window.addEventListener('pointerup', onPointerUp);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onSelect(tb.id);
              setEditingId(tb.id);
            }}
            className="absolute select-none group"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${tb.width}px`,
              height: `${tb.height}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              backgroundColor: tb.bgColor && tb.bgColor !== 'transparent' ? tb.bgColor : 'transparent',
              borderRadius: '2px',
              border: isSelected
                ? '2px solid #5c36f5'
                : isEditing
                ? '2px solid #3b82f6'
                : '1px dashed transparent',
              cursor: activeTool === 'select' ? (isEditing ? 'text' : 'move') : 'default',
              pointerEvents: activeTool === 'select' ? 'auto' : 'none',
              boxSizing: 'border-box',
              zIndex: isSelected ? 40 : 20,
              willChange: 'transform, left, top',
            }}
          >
            {/* FLOATING FORMATTING BAR FOR SELECTED TEXT BOX */}
            {isSelected && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute -top-11 left-0 flex items-center gap-1.5 bg-[#0c0f1e] border border-[#212c4b] px-2 py-1 rounded-xl shadow-2xl z-50 select-none whitespace-nowrap"
                style={{
                  transform: `scale(${Math.max(0.65, 1 / zoom)})`,
                  transformOrigin: 'bottom left',
                }}
              >
                {/* Font Family Selector */}
                <select
                  value={tb.fontFamily || '"Times New Roman", Times, serif'}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdate({ ...tb, fontFamily: e.target.value });
                  }}
                  className="bg-[#141829] border border-white/20 text-white rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.value} value={f.value} className="bg-[#0c0f1e] text-white">{f.label}</option>
                  ))}
                </select>

                {/* Font Size Controls */}
                <div className="flex items-center gap-1 bg-[#141829] border border-white/10 px-1.5 py-0.5 rounded-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ ...tb, fontSize: Math.max(8, (tb.fontSize || 20) - 2) });
                    }}
                    className="text-slate-300 hover:text-white font-bold text-xs px-1 cursor-pointer"
                    title="Giảm cỡ chữ"
                  >-</button>
                  <span className="text-xs font-mono font-bold text-indigo-300 min-w-[20px] text-center">
                    {tb.fontSize || 20}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ ...tb, fontSize: Math.min(96, (tb.fontSize || 20) + 2) });
                    }}
                    className="text-slate-300 hover:text-white font-bold text-xs px-1 cursor-pointer"
                    title="Tăng cỡ chữ"
                  >+</button>
                </div>

                {/* Bold Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ ...tb, fontWeight: tb.fontWeight === 'bold' ? 'normal' : 'bold' });
                  }}
                  className={`px-1.5 py-0.5 rounded-lg text-xs font-black transition cursor-pointer border ${
                    tb.fontWeight === 'bold' ? 'bg-[#5c36f5] text-white border-indigo-400' : 'bg-transparent text-slate-300 border-white/10 hover:text-white'
                  }`}
                  title="In đậm (Bold)"
                >
                  B
                </button>

                {/* Italic Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ ...tb, fontStyle: tb.fontStyle === 'italic' ? 'normal' : 'italic' });
                  }}
                  className={`px-1.5 py-0.5 rounded-lg text-xs font-serif italic transition cursor-pointer border ${
                    tb.fontStyle === 'italic' ? 'bg-[#5c36f5] text-white border-indigo-400' : 'bg-transparent text-slate-300 border-white/10 hover:text-white'
                  }`}
                  title="In nghiêng (Italic)"
                >
                  I
                </button>

                {/* Color Input */}
                <label className="relative cursor-pointer flex items-center p-0.5 rounded-lg border border-white/15 hover:border-white/40" title="Đổi màu chữ">
                  <input
                    type="color"
                    value={tb.color || '#ff3344'}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdate({ ...tb, color: e.target.value });
                    }}
                    className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-0"
                  />
                </label>

                {/* Background Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isTrans = !tb.bgColor || tb.bgColor === 'transparent';
                    onUpdate({ ...tb, bgColor: isTrans ? '#ffffff' : 'transparent' });
                  }}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    tb.bgColor && tb.bgColor !== 'transparent' ? 'bg-white text-black border-slate-300' : 'text-slate-400 border-white/10 hover:text-white'
                  }`}
                  title="Bật/Tắt nền trắng"
                >
                  {tb.bgColor && tb.bgColor !== 'transparent' ? 'Nền trắng' : 'Nền trong'}
                </button>

                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(tb.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer ml-0.5"
                    title="Xóa Text Box"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}

            {isEditing ? (
              <textarea
                autoFocus
                defaultValue={tb.text}
                placeholder="Text..."
                onBlur={(e) => {
                  setEditingId(null);
                  onUpdate({ ...tb, text: e.target.value });
                }}
                onChange={(e) => {
                  onUpdate({ ...tb, text: e.target.value });
                }}
                className="canvas-text-editor w-full h-full p-1 leading-normal"
                style={{
                  color: tb.color || '#ff3344',
                  fontSize: `${tb.fontSize || 20}px`,
                  fontFamily: tb.fontFamily || '"Times New Roman", Times, serif',
                  fontWeight: tb.fontWeight || 'normal',
                  fontStyle: tb.fontStyle || 'normal',
                  display: 'block',
                  lineHeight: '1.3',
                }}
              />
            ) : (
              <div
                className="w-full h-full p-1 overflow-hidden whitespace-pre-wrap leading-normal"
                style={{
                  color: isEmpty ? '#94a3b8' : tb.color || '#ff3344',
                  fontSize: `${tb.fontSize || 20}px`,
                  fontFamily: tb.fontFamily || '"Times New Roman", Times, serif',
                  fontWeight: tb.fontWeight || 'normal',
                  boxSizing: 'border-box',
                  fontStyle: isEmpty ? 'italic' : (tb.fontStyle || 'normal'),
                  lineHeight: '1.3',
                }}
              >
                {isEmpty ? 'Text...' : tb.text}
              </div>
            )}

            {/* Corner Resize Handle */}
            {isSelected && !isEditing && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  isResizingRef.current = true;
                  resizeStartMouseRef.current = { x: e.clientX, y: e.clientY };
                  resizeStartDimRef.current = { width: tb.width, height: tb.height };

                  const onPointerMove = (moveEvt: PointerEvent) => {
                    if (!isResizingRef.current) return;
                    const dw = (moveEvt.clientX - resizeStartMouseRef.current.x) / zoom;
                    const dh = (moveEvt.clientY - resizeStartMouseRef.current.y) / zoom;
                    onUpdate({
                      ...tb,
                      width: Math.max(60, resizeStartDimRef.current.width + dw),
                      height: Math.max(24, resizeStartDimRef.current.height + dh),
                    });
                  };

                  const onPointerUp = () => {
                    isResizingRef.current = false;
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);
                  };

                  window.addEventListener('pointermove', onPointerMove);
                  window.addEventListener('pointerup', onPointerUp);
                }}
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#5c36f5] border-2 border-white rounded-[2px] cursor-se-resize shadow-md"
                style={{
                  transform: `scale(${Math.max(0.4, 1 / zoom)})`,
                  transformOrigin: 'bottom right',
                }}
                title="Kéo để chỉnh kích thước"
              />
            )}
          </div>
        );
      })}
    </>
  );
};
