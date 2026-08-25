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

/**
 * Frustum culling helper for strokes
 */
function isStrokeInViewport(
  stroke: StrokeRecord,
  vpLeft: number,
  vpTop: number,
  vpRight: number,
  vpBottom: number
): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;
  const pad = (stroke.size || 4) + 10;
  let minX = stroke.points[0].x;
  let maxX = stroke.points[0].x;
  let minY = stroke.points[0].y;
  let maxY = stroke.points[0].y;

  for (let i = 1; i < stroke.points.length; i++) {
    const p = stroke.points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return !(maxX < vpLeft - pad || minX > vpRight + pad || maxY < vpTop - pad || minY > vpBottom + pad);
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

  // Clear and resize canvas buffer
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

  // 1. Adaptive Grid with Level-Of-Detail (LOD) & Max Iteration Guard
  if (gridType !== 'none') {
    const baseGridSize = 44;
    let step = baseGridSize;

    // Scale up grid step when zooming out to keep screen spacing >= 22px
    while (step * zoom < 22) {
      step *= 2;
    }
    // Scale down grid step when zooming in for fine alignment
    while (step * zoom > 260 && step > 10) {
      step /= 2;
    }

    const startX = Math.floor(vpLeft / step) * step;
    const endX = Math.ceil(vpRight / step) * step;
    const startY = Math.floor(vpTop / step) * step;
    const endY = Math.ceil(vpBottom / step) * step;

    // Guard against excessive iterations
    const countX = Math.max(1, Math.round((endX - startX) / step));
    const countY = Math.max(1, Math.round((endY - startY) / step));

    if (countX * countY <= 4000) {
      ctx.save();
      if (gridType === 'dots') {
        ctx.fillStyle = '#94a3b8';
        const dotRadius = Math.min(2.5, Math.max(0.8, 1.6 / zoom));
        for (let x = startX; x <= endX; x += step) {
          for (let y = startY; y <= endY; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (gridType === 'grid') {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = Math.min(2, Math.max(0.6, 1.2 / zoom));
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
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = Math.min(2, Math.max(0.6, 1.2 / zoom));
        ctx.beginPath();
        for (let y = startY; y <= endY; y += step) {
          ctx.moveTo(vpLeft - 100, y);
          ctx.lineTo(vpRight + 100, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 2. Images with Frustum Culling & Zero-Blur Performance
  for (const item of canvasImages) {
    if (item.x + item.width < vpLeft || item.x > vpRight || item.y + item.height < vpTop || item.y > vpBottom) {
      continue;
    }

    try {
      ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
    } catch {
      // Ignore broken image frame
    }

    if (item.id === selectedId && selectedType === 'image') {
      ctx.save();
      if (isCroppingImageId === item.id) {
        const cb = activeCropBox || { x: item.x, y: item.y, width: item.width, height: item.height };
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 2.5 / zoom);
        ctx.strokeRect(cb.x, cb.y, cb.width, cb.height);
        ctx.fillStyle = '#000000';
        const chs = Math.max(6, 14 / zoom);
        const barThick = Math.max(2, 4 / zoom);
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
        ctx.lineWidth = Math.max(1, 2 / zoom);
        ctx.setLineDash([Math.max(3, 6 / zoom), Math.max(3, 6 / zoom)]);
        ctx.strokeRect(item.x - 1 / zoom, item.y - 1 / zoom, item.width + 2 / zoom, item.height + 2 / zoom);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#5c36f5';
        const hs = Math.max(4, 8 / zoom);
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

  // 3. Saved Strokes with Frustum Culling
  for (const stroke of currentStrokes) {
    if (!isStrokeInViewport(stroke, vpLeft, vpTop, vpRight, vpBottom)) {
      continue;
    }
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
    ctx.lineWidth = Math.max(1, 1.5 / zoom);
    ctx.setLineDash([Math.max(2, 4 / zoom), Math.max(2, 4 / zoom)]);

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
        ctx.lineWidth = Math.max(1, 1.8 / zoom);
        ctx.setLineDash([]);
        const tick = Math.max(4, 8 / zoom);

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

        const fontSize = Math.max(8, 11 / zoom);
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(guide.gapText);
        const padX = Math.max(4, 8 / zoom);
        const padY = Math.max(2, 3.5 / zoom);
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
        ctx.lineWidth = Math.max(1, 1.2 / zoom);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, Math.max(2, 5 / zoom));
        else ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill();
        ctx.stroke();

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
    ctx.lineWidth = Math.max(1, 1.5 / zoom);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.beginPath();
    ctx.arc(hoverWorldPt.x, hoverWorldPt.y, eraserSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
