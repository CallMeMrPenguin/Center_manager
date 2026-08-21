import React, { useState, useRef } from 'react';
import { CanvasTextBox, Point } from '../types';

interface CanvasTextBoxOverlayProps {
  textBoxes: CanvasTextBox[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (updated: CanvasTextBox) => void;
  zoom: number;
  pan: Point;
  activeTool: string;
}

export const CanvasTextBoxOverlay: React.FC<CanvasTextBoxOverlayProps> = ({
  textBoxes,
  selectedId,
  onSelect,
  onUpdate,
  zoom,
  pan,
  activeTool,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const isResizingRef = useRef(false);
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const startDimRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  return (
    <>
      {textBoxes.map((tb) => {
        const isSelected = selectedId === tb.id;
        const isEditing = editingId === tb.id;
        const screenX = tb.x * zoom + pan.x;
        const screenY = tb.y * zoom + pan.y;
        const screenW = Math.max(100, tb.width * zoom);
        const screenH = Math.max(40, tb.height * zoom);
        const isEmpty = !tb.text || tb.text.trim() === '';

        return (
          <div
            key={tb.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(tb.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingId(tb.id);
            }}
            className="absolute select-none rounded-lg shadow-sm"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${screenW}px`,
              height: `${screenH}px`,
              backgroundColor: tb.bgColor === 'transparent' ? 'transparent' : '#ffffff',
              colorScheme: 'light',
              border: isSelected ? '2px solid #5c36f5' : '1px solid #cbd5e1',
              cursor: activeTool === 'select' ? (isEditing ? 'text' : 'move') : 'default',
              pointerEvents: activeTool === 'select' ? 'auto' : 'none',
              boxSizing: 'border-box',
            }}
          >
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
                className="w-full h-full p-2 bg-white text-base resize-none border-0 focus:outline-none leading-relaxed placeholder:text-slate-400 placeholder:italic"
                style={{
                  color: tb.color || '#ff3344',
                  backgroundColor: '#ffffff',
                  fontSize: `${Math.max(13, tb.fontSize * zoom)}px`,
                  fontFamily: '"Times New Roman", Times, serif',
                  colorScheme: 'light',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div
                className={`w-full h-full p-2 overflow-hidden whitespace-pre-wrap leading-relaxed ${
                  isEmpty ? 'text-slate-400 italic' : ''
                }`}
                style={{
                  color: isEmpty ? '#94a3b8' : (tb.color || '#ff3344'),
                  fontSize: `${Math.max(13, tb.fontSize * zoom)}px`,
                  fontFamily: '"Times New Roman", Times, serif',
                  boxSizing: 'border-box',
                }}
              >
                {isEmpty ? 'Text...' : tb.text}
              </div>
            )}

            {/* Clean Resize Handle at Bottom-Right */}
            {isSelected && !isEditing && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  isResizingRef.current = true;
                  startPosRef.current = { x: e.clientX, y: e.clientY };
                  startDimRef.current = { width: tb.width, height: tb.height };

                  const onPointerMove = (moveEvt: PointerEvent) => {
                    if (!isResizingRef.current) return;
                    const dw = (moveEvt.clientX - startPosRef.current.x) / zoom;
                    const dh = (moveEvt.clientY - startPosRef.current.y) / zoom;
                    onUpdate({
                      ...tb,
                      width: Math.max(80, startDimRef.current.width + dw),
                      height: Math.max(35, startDimRef.current.height + dh),
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
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#5c36f5] border-2 border-white rounded-full cursor-se-resize shadow-md"
                title="Kéo để thay đổi độ rộng text box"
              />
            )}
          </div>
        );
      })}
    </>
  );
};
