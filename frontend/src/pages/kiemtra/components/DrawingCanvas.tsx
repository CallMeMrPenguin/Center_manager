import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Highlighter, Eraser, Trash2, MousePointer, Palette, Sliders, Undo2, Redo2, GripVertical } from 'lucide-react';
import { DrawTool, Point, renderStroke, getTransformedPoint } from '../../../utils/drawingEngine';

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

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Draggable toolbar state
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingToolbarRef = useRef(false);
  const toolbarDragOffsetRef = useRef({ x: 0, y: 0 });

  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const startSnapshotRef = useRef<ImageData | null>(null);
  const isShiftPressedRef = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { isShiftPressedRef.current = e.shiftKey; };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const savedData = drawings[questionId];
    if (savedData) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = savedData;
      setUndoStack([savedData]);
    } else {
      setUndoStack([]);
    }
    setRedoStack([]);
  }, [questionId]);

  const saveCurrentState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawing(questionId, dataUrl);
    setUndoStack(prev => [...prev.slice(-25), dataUrl]);
    setRedoStack([]);
  }, [questionId, onSaveDrawing]);

  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) {
      if (undoStack.length === 1) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        onClearDrawing(questionId);
        setRedoStack(prev => [...prev, undoStack[0]]);
        setUndoStack([]);
      }
      return;
    }

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];
    const newUndo = undoStack.slice(0, -1);

    setRedoStack(prev => [...prev, current]);
    setUndoStack(newUndo);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      onSaveDrawing(questionId, previous);
    };
    img.src = previous;
  }, [undoStack, questionId, onSaveDrawing, onClearDrawing]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    setUndoStack(prev => [...prev, next]);
    setRedoStack(newRedo);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      onSaveDrawing(questionId, next);
    };
    img.src = next;
  }, [redoStack, questionId, onSaveDrawing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const currentSize = activeTool === 'pen' ? penSize : activeTool === 'highlighter' ? hlSize : eraserSize;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getTransformedPoint(e, canvas);
    currentPointsRef.current = [coords];

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    startSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    renderStroke(ctx, currentPointsRef.current, {
      tool: activeTool, color: selectedColor, size: currentSize, isShiftPressed: e.shiftKey || isShiftPressedRef.current,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nativeEvent = e.nativeEvent as PointerEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];

    for (const evt of coalesced) {
      const pt = getTransformedPoint(evt, canvas);
      const prevPt = currentPointsRef.current[currentPointsRef.current.length - 1];
      if (!prevPt || Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y) >= 1.2) {
        currentPointsRef.current.push(pt);
      }
    }

    if (startSnapshotRef.current) ctx.putImageData(startSnapshotRef.current, 0, 0);
    renderStroke(ctx, currentPointsRef.current, {
      tool: activeTool, color: selectedColor, size: currentSize, isShiftPressed: e.shiftKey || isShiftPressedRef.current,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    isDrawingRef.current = false;
    currentPointsRef.current = [];
    startSnapshotRef.current = null;
    saveCurrentState();
  };

  const handleClearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    onClearDrawing(questionId);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    isDraggingToolbarRef.current = true;
    const currentX = toolbarPos ? toolbarPos.x : 0;
    const currentY = toolbarPos ? toolbarPos.y : 0;
    toolbarDragOffsetRef.current = { x: e.clientX - currentX, y: e.clientY - currentY };

    const onMove = (moveEvt: MouseEvent) => {
      if (!isDraggingToolbarRef.current) return;
      setToolbarPos({
        x: moveEvt.clientX - toolbarDragOffsetRef.current.x,
        y: moveEvt.clientY - toolbarDragOffsetRef.current.y,
      });
    };

    const onUp = () => {
      isDraggingToolbarRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full ${activeTool !== 'none' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
        style={{ touchAction: 'none' }}
      />

      {/* FLOATING DRAGGABLE DRAWING TOOLBAR - Fixed on screen with rich contrast & vibrant border */}
      <div
        style={toolbarPos ? { transform: `translate3d(${toolbarPos.x}px, ${toolbarPos.y}px, 0)` } : {}}
        className="fixed top-20 right-8 z-[100] pointer-events-auto flex items-center gap-1.5 bg-[#12162a] border-2 border-[#5c36f5]/70 p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(92,54,245,0.35)] select-none ring-1 ring-white/15"
      >
        <div
          onMouseDown={handleToolbarMouseDown}
          className="p-1 text-indigo-400 hover:text-indigo-200 cursor-move"
          title="Kéo thả để di chuyển thanh công cụ vẽ"
        >
          <GripVertical size={14} />
        </div>

        <button
          onClick={() => { setActiveTool('none'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTool === 'none'
              ? 'bg-[#5c36f5] text-white shadow-[0_0_12px_rgba(92,54,245,0.7)]'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Chế độ con trỏ chuột"
        >
          <MousePointer size={13} />
          <span className="hidden sm:inline">Chuột</span>
        </button>

        <button
          onClick={() => { setActiveTool('pen'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTool === 'pen'
              ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.7)]'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Bút vẽ (Giữ Shift để kẻ đường thẳng)"
        >
          <Pen size={13} />
          <span className="hidden sm:inline">Bút</span>
        </button>

        <button
          onClick={() => { setActiveTool('highlighter'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTool === 'highlighter'
              ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]'
              : 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/10'
          }`}
          title="Dạ quang (Giữ Shift để gạch thẳng dòng)"
        >
          <Highlighter size={13} />
          <span className="hidden sm:inline">Dạ quang</span>
        </button>

        <button
          onClick={() => { setActiveTool('eraser'); setShowColorPopover(false); setShowSizePopover(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.7)]'
              : 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/10'
          }`}
          title="Tẩy xóa nét vẽ"
        >
          <Eraser size={13} />
          <span className="hidden sm:inline">Tẩy</span>
        </button>

        {activeTool !== 'none' && activeTool !== 'eraser' && (
          <div className="relative flex items-center">
            <button
              onClick={() => { setShowColorPopover(!showColorPopover); setShowSizePopover(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1c2242] hover:bg-[#252d58] transition cursor-pointer border border-indigo-500/30"
              title="Chọn màu mực vẽ"
            >
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: selectedColor }} />
              <Palette size={12} className="text-slate-300" />
            </button>

            {showColorPopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#12162a] border-2 border-[#5c36f5]/60 p-3 rounded-2xl shadow-2xl z-50 space-y-2.5 min-w-[210px]">
                <div className="text-[11px] font-bold text-slate-200">Bảng màu gợi ý</div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setSelectedColor(c.value); setShowColorPopover(false); }}
                      className={`w-6 h-6 rounded-full transition cursor-pointer transform hover:scale-110 border ${
                        selectedColor.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-white scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool !== 'none' && (
          <div className="relative flex items-center">
            <button
              onClick={() => { setShowSizePopover(!showSizePopover); setShowColorPopover(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1c2242] hover:bg-[#252d58] transition cursor-pointer border border-indigo-500/30 text-xs font-black text-indigo-300"
              title="Chỉnh độ dày"
            >
              <Sliders size={12} className="text-indigo-400" />
              <span>{currentSize}px</span>
            </button>

            {showSizePopover && (
              <div className="absolute top-full right-0 mt-2 bg-[#12162a] border-2 border-[#5c36f5]/60 p-3 rounded-2xl shadow-2xl z-50 space-y-2 min-w-[180px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                  <span>{activeTool === 'eraser' ? 'Kích thước tẩy' : 'Độ dày nét'}</span>
                  <span className="font-mono text-indigo-400 font-black">{currentSize}px</span>
                </div>
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
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5c36f5]"
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
          title="Hoàn tác (Ctrl + Z)"
        >
          <Undo2 size={13} />
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
          title="Làm lại (Ctrl + Y)"
        >
          <Redo2 size={13} />
        </button>

        <button
          onClick={handleClearAll}
          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer ml-0.5"
          title="Xóa toàn bộ nét vẽ"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
