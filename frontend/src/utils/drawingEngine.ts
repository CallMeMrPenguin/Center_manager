export interface Point {
  x: number;
  y: number;
}

export type DrawTool = 'none' | 'select' | 'crop' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text';

export interface StrokeStyle {
  tool: DrawTool;
  color: string;
  size: number;
  isShiftPressed?: boolean;
}

/**
 * Extracts all coalesced pointer coordinates from a pointer event,
 * with viewport pan and zoom transformation applied.
 */
export function getTransformedPoint(
  e: PointerEvent | React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  pan = { x: 0, y: 0 },
  zoom = 1
): Point {
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  
  // Transform screen coordinate into world canvas coordinate
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
}

/**
 * Snaps a point to a 45-degree angle or horizontal/vertical line if Shift is pressed
 */
export function snapShiftPoint(start: Point, current: Point): Point {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const angle = Math.atan2(dy, dx);
  const dist = Math.hypot(dx, dy);

  // Snap to nearest 45-degree increment (0, 45, 90, 135, 180, -45, -90, -135)
  const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  return {
    x: start.x + dist * Math.cos(snapAngle),
    y: start.y + dist * Math.sin(snapAngle),
  };
}

/**
 * Professional stroke rendering engine
 * Renders smooth quadratic bezier curves or straight snap lines with Shift key.
 */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style: StrokeStyle
) {
  if (points.length === 0) return;

  const { tool, color, size, isShiftPressed } = style;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (tool === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.globalAlpha = 1.0;
  } else if (tool === 'highlighter') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.globalAlpha = 0.35;
  } else if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = size;
    ctx.globalAlpha = 1.0;
  } else if (['line', 'arrow', 'rect', 'circle'].includes(tool)) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;
    ctx.globalAlpha = 1.0;
  }

  // Single dot / click
  if (points.length === 1) {
    if (['pen', 'highlighter', 'eraser'].includes(tool)) {
      ctx.fillStyle = tool === 'eraser' ? '#000000' : color;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  const start = points[0];
  let end = points[points.length - 1];

  // If Shift is pressed during Pen, Highlighter, Line or Arrow: Snap straight line
  if (isShiftPressed) {
    end = snapShiftPoint(start, end);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (tool === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headlen = Math.max(12, size * 3.5);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    return;
  }

  // Freehand Pen / Highlighter / Eraser using Quadratic Bezier Spline
  if (['pen', 'highlighter', 'eraser'].includes(tool)) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }

    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    return;
  }

  // Geometric Shapes
  if (tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (tool === 'rect') {
    ctx.beginPath();
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (tool === 'circle') {
    ctx.beginPath();
    const radius = Math.hypot(end.x - start.x, end.y - start.y);
    ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headlen = Math.max(12, size * 3.5);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
}
