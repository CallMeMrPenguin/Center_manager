import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Highlighter, Eraser, Trash2, MousePointer, Palette } from 'lucide-react';

export type DrawTool = 'none' | 'pen' | 'highlighter' | 'eraser';

interface DrawingCanvasProps {
  questionId: number;
  drawings: Record<number, string>;
  onSaveDrawing: (questionId: number, dataUrl: string) => void;
  onClearDrawing: (questionId: number) => void;
}

const PRESET_COLORS = [
  { label: 'Vàng', value: '#ffd600' },
  { label: 'Đỏ', value: '#ff3344' },
  { label: 'Xanh ngọc', value: '#00e5ff' },
  { label: 'Xanh lá', value: '#00e676' },
  { label: 'Tím hồng', value: '#e040fb' },
  { label: 'Trắng', value: '#ffffff' },
];

const STROKE_WIDTHS = [
  { label: 'Mảnh', pen: 2.5, hl: 16 },
  { label: 'Vừa', pen: 4.5, hl: 24 },
  { label: 'Dày', pen: 7, hl: 36 },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  questionId,
  drawings,
  onSaveDrawing,
  onClearDrawing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>('none');
  const [selectedColor, setSelectedColor] = useState<string>('#ffd600');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(1);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Restore drawing when questionId changes or on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeAndRestore = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Only resize if dimensions changed
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Restore saved drawing for this question
      const savedData = drawings[questionId];
      if (savedData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = savedData;
      }
    };

    resizeAndRestore();
  }, [questionId, drawings]);

  const saveCurrentState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawing(questionId, dataUrl);
  }, [questionId, onSaveDrawing]);

  // Pointer event handlers for drawing
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw single dot on click
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = STROKE_WIDTHS[selectedSizeIndex].pen;
      ctx.globalAlpha = 1.0;
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = STROKE_WIDTHS[selectedSizeIndex].hl;
      ctx.globalAlpha = 0.35;
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 28;
      ctx.globalAlpha = 1.0;
    }

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'none' || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = STROKE_WIDTHS[selectedSizeIndex].pen;
      ctx.globalAlpha = 1.0;
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = STROKE_WIDTHS[selectedSizeIndex].hl;
      ctx.globalAlpha = 0.35;
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 28;
      ctx.globalAlpha = 1.0;
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDrawingRef.current = false;
    lastPointRef.current = null;
    saveCurrentState();
  };

  const handleClearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClearDrawing(questionId);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* DRAWING CANVAS LAYER */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full ${
          activeTool !== 'none'
            ? activeTool === 'eraser'
              ? 'pointer-events-auto cursor-crosshair'
              : 'pointer-events-auto cursor-crosshair'
            : 'pointer-events-none'
        }`}
        style={{ touchAction: 'none' }}
      />

      {/* FLOATING DRAWING TOOLBAR */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex items-center gap-1.5 bg-[#0a0d18] border border-[#212c4b] p-1.5 rounded-xl shadow-2xl">
        {/* Pointer / Interact Mode */}
        <button
          onClick={() => setActiveTool('none')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTool === 'none'
              ? 'bg-[#5c36f5] text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Chế độ chọn đáp án (Không vẽ)"
        >
          <MousePointer size={13} />
          <span className="hidden sm:inline">Chuột</span>
        </button>

        {/* Pen Mode */}
        <button
          onClick={() => setActiveTool('pen')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTool === 'pen'
              ? 'bg-[#5c36f5] text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Bút vẽ tự do"
        >
          <Pen size={13} />
          <span className="hidden sm:inline">Bút</span>
        </button>

        {/* Highlighter Mode */}
        <button
          onClick={() => setActiveTool('highlighter')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTool === 'highlighter'
              ? 'bg-[#5c36f5] text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Bút dạ quang (Highlight)"
        >
          <Highlighter size={13} />
          <span className="hidden sm:inline">Dạ quang</span>
        </button>

        {/* Eraser Mode */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Tẩy xóa nét vẽ"
        >
          <Eraser size={13} />
          <span className="hidden sm:inline">Tẩy</span>
        </button>

        {/* Color Picker Toggle */}
        {activeTool !== 'none' && activeTool !== 'eraser' && (
          <div className="relative flex items-center">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer border border-white/10"
              title="Chọn màu mực vẽ"
            >
              <div
                className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <Palette size={12} className="text-slate-400" />
            </button>

            {/* Color Popover */}
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c0f1e] border border-[#212c4b] p-2.5 rounded-xl shadow-2xl flex items-center gap-2 z-50">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setSelectedColor(c.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full transition cursor-pointer transform hover:scale-110 border ${
                      selectedColor === c.value ? 'ring-2 ring-indigo-400 scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stroke Size Selector */}
        {activeTool !== 'none' && activeTool !== 'eraser' && (
          <div className="flex items-center gap-1 pl-1 border-l border-white/10">
            {STROKE_WIDTHS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSizeIndex(idx)}
                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition cursor-pointer ${
                  selectedSizeIndex === idx ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={`Nét ${s.label}`}
              >
                {idx === 0 ? '•' : idx === 1 ? '●' : '⬤'}
              </button>
            ))}
          </div>
        )}

        {/* Clear All Drawing Button */}
        <button
          onClick={handleClearAll}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer ml-0.5"
          title="Xóa toàn bộ nét vẽ của câu này"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
