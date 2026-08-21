import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Highlighter, Eraser, Trash2, MousePointer, Palette, Sliders } from 'lucide-react';

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
  { label: 'Xanh lam', value: '#00b0ff' },
  { label: 'Xanh lá', value: '#00e676' },
  { label: 'Cam', value: '#ff9100' },
  { label: 'Tím hồng', value: '#e040fb' },
  { label: 'Trắng', value: '#ffffff' },
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
  const [penSize, setPenSize] = useState<number>(4);
  const [hlSize, setHlSize] = useState<number>(24);
  const [eraserSize, setEraserSize] = useState<number>(30);

  const [showColorPopover, setShowColorPopover] = useState<boolean>(false);
  const [showSizePopover, setShowSizePopover] = useState<boolean>(false);

  const isDrawingRef = useRef(false);
  const strokePointsRef = useRef<{ x: number; y: number }[]>([]);
  const snapshotRef = useRef<ImageData | null>(null);

  // Restore drawing when questionId changes or on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeAndRestore = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, rect.height);

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

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const currentSize = activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : eraserSize;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const coords = getCoordinates(e);
    strokePointsRef.current = [coords];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture snapshot for smooth continuous redraws (especially for highlighter & curves)
    const dpr = window.devicePixelRatio || 1;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, penSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, hlSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    const pts = strokePointsRef.current;
    pts.push(coords);

    if (pts.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = penSize;
      ctx.globalAlpha = 1.0;

      // Draw quadratic bezier segment for silky smooth lines
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;

      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else if (activeTool === 'highlighter') {
      // For Highlighter: Restore initial stroke snapshot and redraw the whole continuous path
      // This guarantees 100% UNIFORM opacity with ZERO overlapping circle/dot artifacts!
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = hlSize;
      ctx.globalAlpha = 0.35;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }

      if (pts.length >= 2) {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
      }

      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDrawingRef.current = false;
    strokePointsRef.current = [];
    snapshotRef.current = null;
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
            ? 'pointer-events-auto cursor-crosshair'
            : 'pointer-events-none'
        }`}
        style={{ touchAction: 'none' }}
      />

      {/* FLOATING DRAWING TOOLBAR */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex items-center gap-1.5 bg-[#0a0d18] border border-[#212c4b] p-1.5 rounded-xl shadow-2xl">
        {/* Pointer / Interact Mode */}
        <button
          onClick={() => {
            setActiveTool('none');
            setShowColorPopover(false);
            setShowSizePopover(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTool === 'none'
              ? 'bg-[#5c36f5] text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Chế độ con trỏ chuột (Chọn đáp án)"
        >
          <MousePointer size={13} />
          <span className="hidden sm:inline">Chuột</span>
        </button>

        {/* Pen Mode */}
        <button
          onClick={() => {
            setActiveTool('pen');
            setShowColorPopover(false);
            setShowSizePopover(false);
          }}
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
          onClick={() => {
            setActiveTool('highlighter');
            setShowColorPopover(false);
            setShowSizePopover(false);
          }}
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
          onClick={() => {
            setActiveTool('eraser');
            setShowColorPopover(false);
            setShowSizePopover(false);
          }}
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

        {/* Color Picker (Only for Pen & Highlighter) */}
        {activeTool !== 'none' && activeTool !== 'eraser' && (
          <div className="relative flex items-center">
            <button
              onClick={() => {
                setShowColorPopover(!showColorPopover);
                setShowSizePopover(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer border border-white/10"
              title="Chọn màu mực vẽ hoặc tùy chỉnh màu"
            >
              <div
                className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <Palette size={12} className="text-slate-400" />
            </button>

            {/* Color Popover Card */}
            {showColorPopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c0f1e] border border-[#212c4b] p-3 rounded-2xl shadow-2xl z-50 space-y-2.5 min-w-[210px]">
                <div className="text-[11px] font-bold text-slate-300">Bảng màu gợi ý</div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => {
                        setSelectedColor(c.value);
                        setShowColorPopover(false);
                      }}
                      className={`w-6 h-6 rounded-full transition cursor-pointer transform hover:scale-110 border ${
                        selectedColor.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-indigo-400 scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Màu tự chọn:</span>
                  <label className="relative cursor-pointer flex items-center gap-2 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                      {selectedColor}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Size Slider Popover (For Pen, Highlighter & Eraser) */}
        {activeTool !== 'none' && (
          <div className="relative flex items-center">
            <button
              onClick={() => {
                setShowSizePopover(!showSizePopover);
                setShowColorPopover(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer border border-white/10 text-xs font-bold text-slate-300"
              title="Chỉnh độ lớn nét vẽ / kích cỡ tẩy"
            >
              <Sliders size={12} className="text-slate-400" />
              <span>{currentSize}px</span>
            </button>

            {/* Size Slider Card */}
            {showSizePopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#0c0f1e] border border-[#212c4b] p-3 rounded-2xl shadow-2xl z-50 space-y-2 min-w-[200px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>{activeTool === 'eraser' ? 'Kích thước tẩy' : 'Độ dày nét'}</span>
                  <span className="font-mono text-indigo-400 font-black">{currentSize}px</span>
                </div>

                <div className="flex items-center gap-3 pt-1">
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
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5c36f5]"
                  />
                  <div
                    className="rounded-full shrink-0 border border-white/40"
                    style={{
                      width: Math.min(24, Math.max(4, currentSize / 2)),
                      height: Math.min(24, Math.max(4, currentSize / 2)),
                      backgroundColor: activeTool === 'eraser' ? '#ff3344' : selectedColor,
                    }}
                  />
                </div>
              </div>
            )}
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
