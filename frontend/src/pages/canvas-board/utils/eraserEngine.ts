import { Point, StrokeRecord } from '../types';

/**
 * Erases any strokes that intersect with the eraser circle.
 */
export function eraseStrokesAtPoint(
  strokes: StrokeRecord[],
  eraserCenter: Point,
  eraserRadius: number
): { remainingStrokes: StrokeRecord[]; erasedCount: number } {
  let erasedCount = 0;
  const radiusSq = eraserRadius * eraserRadius;

  const remainingStrokes = strokes.filter(stroke => {
    for (const pt of stroke.points) {
      const dx = pt.x - eraserCenter.x;
      const dy = pt.y - eraserCenter.y;
      if (dx * dx + dy * dy <= radiusSq) {
        erasedCount++;
        return false; // Remove this stroke
      }
    }
    return true; // Keep this stroke
  });

  return { remainingStrokes, erasedCount };
}
