import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Pen, Eraser, RotateCcw, Trash2, Check } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  size: number;
  isEraser?: boolean;
}

interface DrawingCorrectionCanvasProps {
  isActive: boolean;
  onToggleActive?: () => void;
}

const COLORS = [
  { label: 'Đỏ (Chấm lỗi)', value: '#ef4444' },
  { label: 'Xanh lá (Đúng)', value: '#10b981' },
  { label: 'Xanh dương (Ghi chú)', value: '#3b82f6' },
  { label: 'Vàng cam (Lưu ý)', value: '#f59e0b' },
  { label: 'Tím', value: '#8b5cf6' },
];

const SIZES = [2, 4, 7];

export const DrawingCorrectionCanvas: React.FC<DrawingCorrectionCanvasProps> = memo(({
  isActive,
  onToggleActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444');
  const [size, setSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const currentPathRef = useRef<Point[]>([]);

  // Sync canvas dimensions with parent container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawAll();
    }
  }, [paths]);

  useEffect(() => {
    if (!isActive) return;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isActive, resizeCanvas]);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach((p) => {
      if (p.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      if (p.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(p.points[0].x, p.points[0].y);
      for (let i = 1; i < p.points.length; i++) {
        ctx.lineTo(p.points[i].x, p.points[i].y);
      }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [paths]);

  useEffect(() => {
    redrawAll();
  }, [paths, redrawAll]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pt = getCanvasCoords(e);
    currentPathRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive) return;
    const pt = getCanvasCoords(e);
    currentPathRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = currentPathRef.current;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      const prev = pts[pts.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current.length > 1) {
      setPaths((prev) => [
        ...prev,
        {
          points: [...currentPathRef.current],
          color,
          size,
          isEraser,
        },
      ]);
    }
    currentPathRef.current = [];
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* 1. Floating Annotation Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0c0f1e]/95 border border-[#263152] rounded-2xl px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-3 select-none animate-fade-in text-white text-xs">
        {/* Tool Mode: Pen / Eraser */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              !isEraser ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pen size={13} />
            <span>Bút vẽ</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              isEraser ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eraser size={13} />
            <span>Tẩy</span>
          </button>
        </div>

        {/* Color Palette (When using pen) */}
        {!isEraser && (
          <div className="flex items-center gap-1.5 px-2 border-l border-white/10">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-6 h-6 rounded-full transition cursor-pointer flex items-center justify-center ${
                  color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={c.label}
              >
                {color === c.value && <Check size={11} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
        )}

        {/* Stroke Size */}
        <div className="flex items-center gap-1 px-2 border-l border-white/10">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                size === s ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: `${s * 2}px`, height: `${s * 2}px` }}
              />
            </button>
          ))}
        </div>

        {/* Actions: Undo, Clear */}
        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
          <button
            type="button"
            onClick={handleUndo}
            disabled={paths.length === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
            title="Hoàn tác nét vẽ"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={paths.length === 0}
            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 disabled:opacity-40 transition cursor-pointer"
            title="Xóa toàn bộ nét vẽ"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 2. Full Canvas Overlay on top of Worksheet */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 z-20 pointer-events-auto touch-none cursor-crosshair"
      />
    </>
  );
});

DrawingCorrectionCanvas.displayName = 'DrawingCorrectionCanvas';
