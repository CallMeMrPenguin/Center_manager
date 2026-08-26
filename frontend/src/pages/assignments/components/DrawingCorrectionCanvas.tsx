import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  assignmentId?: number | string;
  studentName?: string;
  pageKey?: string;
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
  assignmentId,
  studentName,
  pageKey = 'default',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444');
  const [size, setSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const pathsRef = useRef<Path[]>([]);
  const currentPathRef = useRef<Point[]>([]);

  // Unique storage key per assignment, student, and page
  const storageKey = useMemo(() => {
    return `drawing_correction_${assignmentId || 'preview'}_${studentName || 'anon'}_${pageKey}`;
  }, [assignmentId, studentName, pageKey]);

  // Keep pathsRef in sync with state for zero-delay drawing
  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  // Reset or load paths when assignment, student, or page changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPaths(parsed);
          pathsRef.current = parsed;
          return;
        }
      }
    } catch {}
    setPaths([]);
    pathsRef.current = [];
  }, [storageKey]);

  // Function to redraw all strokes onto the canvas
  const redrawAll = useCallback((currentStrokes?: Path[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokesToDraw = currentStrokes || pathsRef.current;
    strokesToDraw.forEach((p) => {
      if (!p.points || p.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      if (p.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (p.points.length === 1) {
        ctx.arc(p.points[0].x, p.points[0].y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else {
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (let i = 1; i < p.points.length; i++) {
          ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.stroke();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // Synchronize canvas resolution and dimensions to match the full worksheet parent
  const syncDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const targetW = Math.max(parent.clientWidth || 800, parent.offsetWidth || 800);
    const targetH = Math.max(parent.scrollHeight || 1200, parent.clientHeight || 1200, parent.offsetHeight || 1200);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;
      redrawAll();
    }
  }, [redrawAll]);

  // Continuously observe parent dimensions so canvas expands dynamically with full content
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent) return;

    syncDimensions();

    const resizeObserver = new ResizeObserver(() => {
      syncDimensions();
    });
    resizeObserver.observe(parent);

    window.addEventListener('resize', syncDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncDimensions);
    };
  }, [isActive, syncDimensions]);

  useEffect(() => {
    if (isActive) {
      try {
        if (paths.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(paths));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {}
    }
  }, [paths, isActive, storageKey]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pt = getCanvasCoords(e);
    currentPathRef.current = [pt];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? 'rgba(0,0,0,1)' : color;
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.fill();
    }
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

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);
    if (currentPathRef.current.length > 0) {
      const newPath: Path = {
        points: [...currentPathRef.current],
        color,
        size,
        isEraser,
      };
      setPaths((prev) => [...prev, newPath]);
      pathsRef.current = [...pathsRef.current, newPath];
    }
    currentPathRef.current = [];
  };

  const handleUndo = () => {
    const updated = paths.slice(0, -1);
    setPaths(updated);
    pathsRef.current = updated;
    redrawAll(updated);
  };

  const handleClear = () => {
    setPaths([]);
    pathsRef.current = [];
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* 1. Fixed Floating Annotation Toolbar at Top Center */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0c0f1e]/95 border border-[#263152] rounded-2xl px-4 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-3 select-none animate-fade-in text-white text-xs backdrop-blur-none">
        {/* Tool Mode: Pen / Eraser */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              !isEraser ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pen size={13} />
            <span>Bút vẽ</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              isEraser ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eraser size={13} />
            <span>Tẩy</span>
          </button>
        </div>

        {/* Color Palette */}
        {!isEraser && (
          <div className="flex items-center gap-1.5 px-2 border-l border-white/10">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-5 h-5 rounded-full transition cursor-pointer flex items-center justify-center ${
                  color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={c.label}
              >
                {color === c.value && <Check size={10} className="text-white drop-shadow" />}
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
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition cursor-pointer ${
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
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={paths.length === 0}
            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 disabled:opacity-40 transition cursor-pointer"
            title="Xóa toàn bộ nét vẽ"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 2. Full Canvas Overlay spanning entire worksheet container */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 z-20 pointer-events-auto touch-none cursor-crosshair w-full h-full"
      />
    </>
  );
});

DrawingCorrectionCanvas.displayName = 'DrawingCorrectionCanvas';
