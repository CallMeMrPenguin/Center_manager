import { Point, StrokeRecord } from '../types';

/**
 * Subdivides a sequence of points so consecutive points are separated by at most maxDist (e.g. 2px).
 */
function densifyPoints(points: Point[], maxDist = 2.5): Point[] {
  if (points.length <= 1) return points;
  const dense: Point[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    if (dist > maxDist) {
      const steps = Math.ceil(dist / maxDist);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        dense.push({
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y),
        });
      }
    }
    dense.push(p2);
  }

  return dense;
}

/**
 * Erases the portions of a stroke that fall within the eraser circle,
 * splitting the remaining points into 0, 1, or multiple sub-strokes (Partial Vector Eraser).
 */
export function eraseAndSplitStroke(
  stroke: StrokeRecord,
  eraserCenter: Point,
  eraserRadius: number
): StrokeRecord[] {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return [];

  // Effective hit radius includes stroke half-width for precision
  const strokePadding = Math.max(1, (stroke.size || 4) / 2);
  const effectiveRadius = eraserRadius + strokePadding;
  const radiusSq = effectiveRadius * effectiveRadius;

  // 1. Densify points for smooth sub-segment cutting
  const densePts = densifyPoints(pts, 2.5);

  const newSubSegments: Point[][] = [];
  let currentSegment: Point[] = [];

  for (const pt of densePts) {
    const dx = pt.x - eraserCenter.x;
    const dy = pt.y - eraserCenter.y;
    const isInside = dx * dx + dy * dy <= radiusSq;

    if (!isInside) {
      currentSegment.push(pt);
    } else {
      if (currentSegment.length > 0) {
        newSubSegments.push(currentSegment);
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 0) {
    newSubSegments.push(currentSegment);
  }

  // Convert valid sub-segments back to StrokeRecord objects
  const result: StrokeRecord[] = [];
  for (let i = 0; i < newSubSegments.length; i++) {
    const seg = newSubSegments[i];
    // Keep segments that have at least 1 point
    if (seg.length > 0) {
      result.push({
        id: `${stroke.id}_seg_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        points: seg,
        tool: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        isShiftPressed: stroke.isShiftPressed,
        imageId: stroke.imageId,
      });
    }
  }

  return result;
}

/**
 * Erases strokes along a continuous trajectory from prevPt to currentPt (with sub-stepping)
 * so that fast mouse/stylus movements never leave gaps.
 */
export function eraseStrokesAlongPath(
  strokes: StrokeRecord[],
  prevPt: Point,
  currentPt: Point,
  eraserRadius: number
): StrokeRecord[] {
  const dist = Math.hypot(currentPt.x - prevPt.x, currentPt.y - prevPt.y);
  const stepSize = Math.max(2, eraserRadius / 3);
  const numSteps = Math.max(1, Math.ceil(dist / stepSize));

  let currentStrokes = strokes;

  for (let s = 0; s <= numSteps; s++) {
    const t = s / numSteps;
    const center: Point = {
      x: prevPt.x + t * (currentPt.x - prevPt.x),
      y: prevPt.y + t * (currentPt.y - prevPt.y),
    };

    let updatedStrokes: StrokeRecord[] = [];
    let hadChanges = false;

    for (const stroke of currentStrokes) {
      const splitStrokes = eraseAndSplitStroke(stroke, center, eraserRadius);
      // If the stroke was modified or erased
      if (splitStrokes.length !== 1 || splitStrokes[0].points.length !== stroke.points.length) {
        hadChanges = true;
      }
      updatedStrokes.push(...splitStrokes);
    }

    if (hadChanges) {
      currentStrokes = updatedStrokes;
    }
  }

  return currentStrokes;
}
