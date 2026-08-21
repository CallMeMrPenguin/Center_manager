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
        const screenW = Math.max(120, tb.width * zoom);
        const screenH = Math.max(38, tb.height * zoom);
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
            className="absolute select-none"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${screenW}px`,
              height: `${screenH}px`,
              backgroundColor: '#ffffff',
              colorScheme: 'light',
              borderRadius: '4px',
              border: isSelected ? '2px solid #5c36f5' : isEditing ? '2px solid #3b82f6' : '1px dashed #cbd5e1',
              boxShadow: isSelected ? '0 2px 8px rgba(92, 54, 245, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.08)',
              cursor: activeTool === 'select' ? (isEditing ? 'text' : 'move') : 'default',
              pointerEvents: activeTool === 'select' ? 'auto' : 'none',
              boxSizing: 'border-box',
              zIndex: isSelected ? 40 : 20,
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
                className="w-full h-full p-1.5 resize-none border-0 focus:outline-none leading-normal"
                style={{
                  color: '#ff3344',
                  backgroundColor: '#ffffff',
                  fontSize: `${Math.max(14, tb.fontSize * zoom)}px`,
                  fontFamily: '"Times New Roman", Times, serif',
                  colorScheme: 'light',
                  boxSizing: 'border-box',
                  outline: 'none',
                  border: 'none',
                  display: 'block',
                  lineHeight: '1.3',
                }}
              />
            ) : (
              <div
                className="w-full h-full p-1.5 overflow-hidden whitespace-pre-wrap leading-normal"
                style={{
                  color: isEmpty ? '#94a3b8' : (tb.color || '#ff3344'),
                  backgroundColor: '#ffffff',
                  fontSize: `${Math.max(14, tb.fontSize * zoom)}px`,
                  fontFamily: '"Times New Roman", Times, serif',
                  boxSizing: 'border-box',
                  fontStyle: isEmpty ? 'italic' : 'normal',
                  lineHeight: '1.3',
                }}
              >
                {isEmpty ? 'Text...' : tb.text}
              </div>
            )}

            {/* Professional Corner Resize Handle */}
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
                      width: Math.max(90, resizeStartDimRef.current.width + dw),
                      height: Math.max(32, resizeStartDimRef.current.height + dh),
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
                title="Kéo để chỉnh kích thước"
              />
            )}
          </div>
        );
      })}
    </>
  );
};
