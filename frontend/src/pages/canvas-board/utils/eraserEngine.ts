import { Point, StrokeRecord } from '../types';

/**
 * Calculates the shortest distance from point P to line segment AB.
 */
function distPointToSegmentSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    const dpx = px - ax;
    const dpy = py - ay;
    return dpx * dpx + dpy * dpy;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const diffX = px - projX;
  const diffY = py - projY;
  return diffX * diffX + diffY * diffY;
}

/**
 * Subdivides a sequence of points so consecutive points are separated by at most maxDist (e.g. 3px).
 */
function densifyPoints(points: Point[], maxDist = 3): Point[] {
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
 * High-Speed Partial Vector Eraser with Bounding Box Fast Rejection
 */
export function eraseStrokesAlongPath(
  strokes: StrokeRecord[],
  prevPt: Point,
  currentPt: Point,
  eraserRadius: number
): { strokes: StrokeRecord[]; hasChanged: boolean } {
  if (!strokes || strokes.length === 0) {
    return { strokes, hasChanged: false };
  }

  // 1. Compute sweeping bounding box of the eraser stroke
  const sweepMinX = Math.min(prevPt.x, currentPt.x) - eraserRadius - 10;
  const sweepMaxX = Math.max(prevPt.x, currentPt.x) + eraserRadius + 10;
  const sweepMinY = Math.min(prevPt.y, currentPt.y) - eraserRadius - 10;
  const sweepMaxY = Math.max(prevPt.y, currentPt.y) + eraserRadius + 10;

  // 2. Pre-filter candidate strokes that actually intersect the eraser sweep box
  let hasAnyCandidate = false;
  for (const st of strokes) {
    if (!st.points || st.points.length === 0) continue;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of st.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    // Check AABB overlap
    if (maxX >= sweepMinX && minX <= sweepMaxX && maxY >= sweepMinY && minY <= sweepMaxY) {
      hasAnyCandidate = true;
      break;
    }
  }

  // If no strokes are anywhere near the eraser trajectory, EXIT IMMEDIATELY in 0.001ms!
  if (!hasAnyCandidate) {
    return { strokes, hasChanged: false };
  }

  // 3. Sub-step along the path for candidate strokes
  const pathDist = Math.hypot(currentPt.x - prevPt.x, currentPt.y - prevPt.y);
  const numSteps = Math.max(1, Math.min(8, Math.ceil(pathDist / Math.max(4, eraserRadius / 2))));

  let resultStrokes: StrokeRecord[] = [];
  let globalChanged = false;

  for (const stroke of strokes) {
    const pts = stroke.points;
    if (!pts || pts.length === 0) continue;

    // Check individual stroke AABB
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    if (maxX < sweepMinX || minX > sweepMaxX || maxY < sweepMinY || minY > sweepMaxY) {
      resultStrokes.push(stroke); // Untouched stroke
      continue;
    }

    // Check if any segment of this stroke is actually hit
    const strokePadding = Math.max(1, (stroke.size || 4) / 2);
    const hitRadius = eraserRadius + strokePadding;
    const hitRadiusSq = hitRadius * hitRadius;

    let wasHit = false;
    for (let s = 0; s <= numSteps; s++) {
      const t = s / numSteps;
      const ex = prevPt.x + t * (currentPt.x - prevPt.x);
      const ey = prevPt.y + t * (currentPt.y - prevPt.y);

      for (let i = 0; i < pts.length - 1; i++) {
        if (distPointToSegmentSq(ex, ey, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= hitRadiusSq) {
          wasHit = true;
          break;
        }
      }
      if (wasHit) break;
    }

    if (!wasHit) {
      resultStrokes.push(stroke); // Untouched stroke
      continue;
    }

    // This stroke was hit: Densify and split into remaining sub-segments
    globalChanged = true;
    const densePts = densifyPoints(pts, 3);
    const subSegments: Point[][] = [];
    let currentSeg: Point[] = [];

    for (const p of densePts) {
      // Check if point p is erased at any step along the path
      let pointErased = false;
      for (let s = 0; s <= numSteps; s++) {
        const t = s / numSteps;
        const ex = prevPt.x + t * (currentPt.x - prevPt.x);
        const ey = prevPt.y + t * (currentPt.y - prevPt.y);
        const dx = p.x - ex;
        const dy = p.y - ey;
        if (dx * dx + dy * dy <= hitRadiusSq) {
          pointErased = true;
          break;
        }
      }

      if (!pointErased) {
        currentSeg.push(p);
      } else {
        if (currentSeg.length > 0) {
          subSegments.push(currentSeg);
          currentSeg = [];
        }
      }
    }

    if (currentSeg.length > 0) {
      subSegments.push(currentSeg);
    }

    for (let i = 0; i < subSegments.length; i++) {
      const seg = subSegments[i];
      if (seg.length > 0) {
        resultStrokes.push({
          id: `${stroke.id}_cut_${Date.now()}_${i}`,
          points: seg,
          tool: stroke.tool,
          color: stroke.color,
          size: stroke.size,
          isShiftPressed: stroke.isShiftPressed,
          imageId: stroke.imageId,
        });
      }
    }
  }

  return { strokes: globalChanged ? resultStrokes : strokes, hasChanged: globalChanged };
}
