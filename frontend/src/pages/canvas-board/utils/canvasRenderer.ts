import { GridType } from '../components/CanvasBottomBar';
import { CanvasItemImage, CropBox, SnapGuide, StrokeRecord, Point, CanvasTool } from '../types';
import { renderStroke } from '../../../utils/drawingEngine';

interface RenderCanvasOptions {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  containerRect: { width: number; height: number };
  dpr: number;
  pan: Point;
  zoom: number;
  gridType: GridType;
  canvasImages: CanvasItemImage[];
  selectedId: string | null;
  selectedType: 'image' | 'text' | null;
  isCroppingImageId: string | null;
  activeCropBox: CropBox | null;
  currentStrokes: StrokeRecord[];
  inProgressStroke: {
    points: Point[];
    tool: CanvasTool;
    color: string;
    size: number;
    isShiftPressed?: boolean;
  } | null;
  activeSnapGuides: SnapGuide[];
  hoverWorldPt: Point | null;
  eraserSize: number;
  activeTool: CanvasTool;
}

export function renderCanvasFrame(options: RenderCanvasOptions) {
  const {
    ctx,
    canvas,
    containerRect,
    dpr,
    pan,
    zoom,
    gridType,
    canvasImages,
    selectedId,
    selectedType,
    isCroppingImageId,
    activeCropBox,
    currentStrokes,
    inProgressStroke,
    activeSnapGuides,
    hoverWorldPt,
    eraserSize,
    activeTool,
  } = options;

  // Clear and resize canvas buffer if needed
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  const vpLeft = -pan.x / zoom;
  const vpTop = -pan.y / zoom;
  const vpRight = (containerRect.width - pan.x) / zoom;
  const vpBottom = (containerRect.height - pan.y) / zoom;

  // 1. Adaptive Grid with Level-Of-Detail (LOD)
  if (gridType !== 'none') {
    const baseGridSize = 44;
    let step = baseGridSize;
    // Scale up grid step when zooming out to keep screen spacing >= 18px and prevent freezing
    while (step * zoom < 18) {
      step *= 2;
    }
    // Scale down grid step when zooming way in (>10x) for precision
    while (step * zoom > 300 && step > 10) {
      step /= 2;
    }

    const startX = Math.floor(vpLeft / step) * step;
    const endX = Math.ceil(vpRight / step) * step;
    const startY = Math.floor(vpTop / step) * step;
    const endY = Math.ceil(vpBottom / step) * step;

    ctx.save();
    if (gridType === 'dots') {
      ctx.fillStyle = '#64748b';
      for (let x = startX; x <= endX; x += step) {
        for (let y = startY; y <= endY; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8 / zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridType === 'grid') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4 / zoom;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += step) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += step) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    } else if (gridType === 'lines') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4 / zoom;
      ctx.beginPath();
      for (let y = startY; y <= endY; y += step) {
        ctx.moveTo(vpLeft - 500, y);
        ctx.lineTo(vpRight + 500, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Images with Frustum Culling
  for (const item of canvasImages) {
    if (item.x + item.width < vpLeft || item.x > vpRight || item.y + item.height < vpTop || item.y > vpBottom) {
      continue;
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = Math.min(20, 10 * zoom);
    try {
      ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
    } catch {
      // Ignore broken image frames
    }
    ctx.restore();

    if (item.id === selectedId && selectedType === 'image') {
      ctx.save();
      if (isCroppingImageId === item.id) {
        const cb = activeCropBox || { x: item.x, y: item.y, width: item.width, height: item.height };
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3 / zoom;
        ctx.strokeRect(cb.x, cb.y, cb.width, cb.height);
        ctx.fillStyle = '#000000';
        const chs = 14 / zoom;
        const barThick = 4 / zoom;
        ctx.fillRect(cb.x, cb.y, chs, barThick);
        ctx.fillRect(cb.x, cb.y, barThick, chs);
        ctx.fillRect(cb.x + cb.width - chs, cb.y, chs, barThick);
        ctx.fillRect(cb.x + cb.width - barThick, cb.y, barThick, chs);
        ctx.fillRect(cb.x, cb.y + cb.height - barThick, chs, barThick);
        ctx.fillRect(cb.x, cb.y + cb.height - chs, barThick, chs);
        ctx.fillRect(cb.x + cb.width - chs, cb.y + cb.height - barThick, chs, barThick);
        ctx.fillRect(cb.x + cb.width - barThick, cb.y + cb.height - chs, barThick, chs);
      } else {
        ctx.strokeStyle = '#5c36f5';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 6 / zoom]);
        ctx.strokeRect(item.x - 2 / zoom, item.y - 2 / zoom, item.width + 4 / zoom, item.height + 4 / zoom);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#5c36f5';
        const hs = 8 / zoom;
        const corners = [
          { x: item.x, y: item.y },
          { x: item.x + item.width, y: item.y },
          { x: item.x, y: item.y + item.height },
          { x: item.x + item.width, y: item.y + item.height },
        ];
        for (const c of corners) {
          ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
          ctx.strokeRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
        }
      }
      ctx.restore();
    }
  }

  // 3. Saved Strokes
  for (const stroke of currentStrokes) {
    renderStroke(ctx, stroke.points, {
      tool: stroke.tool,
      color: stroke.color,
      size: stroke.size,
      isShiftPressed: stroke.isShiftPressed,
    });
  }

  // 4. In-progress Stroke
  if (inProgressStroke && inProgressStroke.points.length > 0) {
    renderStroke(ctx, inProgressStroke.points, {
      tool: inProgressStroke.tool,
      color: inProgressStroke.color,
      size: inProgressStroke.size,
      isShiftPressed: inProgressStroke.isShiftPressed,
    });
  }

  // 5. Active Snap Alignment Guides
  if (activeSnapGuides.length > 0) {
    ctx.save();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);

    for (const guide of activeSnapGuides) {
      ctx.beginPath();
      if (guide.type === 'vertical') {
        ctx.moveTo(guide.pos, guide.start);
        ctx.lineTo(guide.pos, guide.end);
      } else {
        ctx.moveTo(guide.start, guide.pos);
        ctx.lineTo(guide.end, guide.pos);
      }
      ctx.stroke();

      if (guide.gapStart && guide.gapEnd && guide.gapText) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.8 / zoom;
        ctx.setLineDash([]);
        const tick = 8 / zoom;

        ctx.beginPath();
        if (guide.type === 'vertical') {
          ctx.moveTo(guide.gapStart.x, guide.gapStart.y);
          ctx.lineTo(guide.gapEnd.x, guide.gapEnd.y);
          ctx.moveTo(guide.gapStart.x - tick / 2, guide.gapStart.y);
          ctx.lineTo(guide.gapStart.x + tick / 2, guide.gapStart.y);
          ctx.moveTo(guide.gapEnd.x - tick / 2, guide.gapEnd.y);
          ctx.lineTo(guide.gapEnd.x + tick / 2, guide.gapEnd.y);
        } else {
          ctx.moveTo(guide.gapStart.x, guide.gapStart.y);
          ctx.lineTo(guide.gapEnd.x, guide.gapEnd.y);
          ctx.moveTo(guide.gapStart.x, guide.gapStart.y - tick / 2);
          ctx.lineTo(guide.gapStart.x, guide.gapStart.y + tick / 2);
          ctx.moveTo(guide.gapEnd.x, guide.gapEnd.y - tick / 2);
          ctx.lineTo(guide.gapEnd.x, guide.gapEnd.y + tick / 2);
        }
        ctx.stroke();

        const fontSize = 11 / zoom;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(guide.gapText);
        const padX = 8 / zoom;
        const padY = 3.5 / zoom;
        const pillW = textMetrics.width + padX * 2;
        const pillH = fontSize + padY * 2;
        const center = guide.gapCenter || {
          x: (guide.gapStart.x + guide.gapEnd.x) / 2,
          y: (guide.gapStart.y + guide.gapEnd.y) / 2,
        };
        const pillX = center.x - pillW / 2;
        const pillY = center.y - pillH / 2;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.2 / zoom;
        ctx.shadowColor = 'rgba(244, 63, 94, 0.4)';
        ctx.shadowBlur = 6 / zoom;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 5 / zoom);
        else ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(guide.gapText, center.x, center.y);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // 6. Eraser Circle Indicator
  if (activeTool === 'eraser' && hoverWorldPt) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5 / zoom;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.beginPath();
    ctx.arc(hoverWorldPt.x, hoverWorldPt.y, eraserSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
