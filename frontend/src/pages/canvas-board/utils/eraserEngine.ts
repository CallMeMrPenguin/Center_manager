import { Point, StrokeRecord } from '../types';

/**
 * Calculates the shortest distance from point P to line segment AB.
 */
function distPointToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * (b.x - a.x);
  const projY = a.y + t * (b.y - a.y);
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Erases any strokes that intersect with the eraser circle border.
 * Uses continuous line-segment collision detection so strokes are cleanly erased
 * even when moving fast or when sampled points are spaced apart!
 */
export function eraseStrokesAtPoint(
  strokes: StrokeRecord[],
  eraserCenter: Point,
  eraserRadius: number
): { remainingStrokes: StrokeRecord[]; erasedCount: number } {
  let erasedCount = 0;

  const remainingStrokes = strokes.filter(stroke => {
    const pts = stroke.points;
    const strokePadding = Math.max(2, (stroke.size || 4) / 2);
    const hitRadius = eraserRadius + strokePadding;

    if (pts.length === 0) return false;

    // 1. Single dot check
    if (pts.length === 1) {
      if (Math.hypot(pts[0].x - eraserCenter.x, pts[0].y - eraserCenter.y) <= hitRadius) {
        erasedCount++;
        return false;
      }
      return true;
    }

    // 2. Check each line segment AB along the stroke path
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dist = distPointToSegment(eraserCenter, a, b);
      if (dist <= hitRadius) {
        erasedCount++;
        return false; // Erase this stroke!
      }
    }

    return true; // Keep this stroke
  });

  return { remainingStrokes, erasedCount };
}
