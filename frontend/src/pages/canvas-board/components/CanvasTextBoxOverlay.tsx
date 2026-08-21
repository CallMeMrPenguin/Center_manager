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
            className={`absolute select-none transition-shadow ${
              isSelected ? 'ring-2 ring-[#5c36f5] shadow-lg' : ''
            }`}
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${screenW}px`,
              height: `${screenH}px`,
              backgroundColor: tb.bgColor,
              cursor: activeTool === 'select' ? (isEditing ? 'text' : 'move') : 'default',
              pointerEvents: activeTool === 'select' ? 'auto' : 'none',
              borderRadius: '6px',
            }}
          >
            {isEditing ? (
              <textarea
                autoFocus
                defaultValue={tb.text}
                onBlur={(e) => {
                  setEditingId(null);
                  onUpdate({ ...tb, text: e.target.value });
                }}
                onChange={(e) => {
                  onUpdate({ ...tb, text: e.target.value });
                }}
                className="w-full h-full p-2 bg-transparent resize-none border-0 focus:outline-none font-serif leading-relaxed"
                style={{
                  color: tb.color,
                  fontSize: `${Math.max(12, tb.fontSize * zoom)}px`,
                  fontFamily: `"${tb.fontFamily}", Times New Roman, serif`,
                }}
              />
            ) : (
              <div
                className="w-full h-full p-2 font-serif overflow-hidden whitespace-pre-wrap select-text leading-relaxed"
                style={{
                  color: tb.color,
                  fontSize: `${Math.max(12, tb.fontSize * zoom)}px`,
                  fontFamily: `"${tb.fontFamily}", Times New Roman, serif`,
                }}
              >
                {tb.text || 'Nhấp đúp để nhập chữ...'}
              </div>
            )}

            {/* Resize Handle at Bottom-Right */}
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
                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#5c36f5] border-2 border-white rounded-tl cursor-se-resize shadow-md"
                title="Kéo để thay đổi độ rộng & chiều cao text box"
              />
            )}
          </div>
        );
      })}
    </>
  );
};
