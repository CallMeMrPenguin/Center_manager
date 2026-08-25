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
  containerRect?: { width: number; height: number };
}

export const CanvasTextBoxOverlay: React.FC<CanvasTextBoxOverlayProps> = ({
  textBoxes,
  selectedId,
  onSelect,
  onUpdate,
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
            className="absolute select-none"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${tb.width}px`,
              height: `${tb.height}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              backgroundColor: '#ffffff',
              colorScheme: 'light',
              borderRadius: '4px',
              border: isSelected ? '2px solid #5c36f5' : isEditing ? '2px solid #3b82f6' : '1px dashed #cbd5e1',
              cursor: activeTool === 'select' ? (isEditing ? 'text' : 'move') : 'default',
              pointerEvents: activeTool === 'select' ? 'auto' : 'none',
              boxSizing: 'border-box',
              zIndex: isSelected ? 40 : 20,
              willChange: 'transform, left, top',
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
                  fontSize: `${tb.fontSize}px`,
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
                  color: isEmpty ? '#94a3b8' : tb.color || '#ff3344',
                  backgroundColor: '#ffffff',
                  fontSize: `${tb.fontSize}px`,
                  fontFamily: '"Times New Roman", Times, serif',
                  boxSizing: 'border-box',
                  fontStyle: isEmpty ? 'italic' : 'normal',
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
