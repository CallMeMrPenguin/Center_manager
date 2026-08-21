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
 * Calculates total arc length of a sequence of points.
 */
function getSegmentLength(points: Point[]): number {
  if (!points || points.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return len;
}

/**
 * Subdivides a sequence of points so consecutive points are separated by at most maxDist (e.g. 2.5px).
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
 * High-Speed Partial Vector Eraser with Micro-Speck Filtering & Residual Noise Pruning
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
    if (maxX >= sweepMinX && minX <= sweepMaxX && maxY >= sweepMinY && minY <= sweepMaxY) {
      hasAnyCandidate = true;
      break;
    }
  }

  // If no strokes are anywhere near the eraser trajectory, exit immediately
  if (!hasAnyCandidate) {
    return { strokes, hasChanged: false };
  }

  // 3. Sub-step along the path for candidate strokes
  const pathDist = Math.hypot(currentPt.x - prevPt.x, currentPt.y - prevPt.y);
  const numSteps = Math.max(1, Math.min(10, Math.ceil(pathDist / Math.max(3, eraserRadius / 3))));

  const resultStrokes: StrokeRecord[] = [];
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
      resultStrokes.push(stroke);
      continue;
    }

    // Effective hit radius includes stroke padding plus slight buffer to avoid edge residue
    const strokePadding = Math.max(1.5, (stroke.size || 4) / 2);
    const hitRadius = eraserRadius + strokePadding + 1.0;
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
      resultStrokes.push(stroke);
      continue;
    }

    // Stroke was hit: Densify and split into clean sub-segments
    globalChanged = true;
    const densePts = densifyPoints(pts, 2.5);
    const subSegments: Point[][] = [];
    let currentSeg: Point[] = [];

    for (const p of densePts) {
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

    // Prune micro-specks, residual cut stubs, and dangling single points!
    const minResidualLength = Math.max(6, (stroke.size || 4) * 0.9);

    for (let i = 0; i < subSegments.length; i++) {
      const seg = subSegments[i];
      // Discard single isolated points or segments shorter than the stroke thickness
      if (seg.length >= 2 && getSegmentLength(seg) >= minResidualLength) {
        resultStrokes.push({
          id: `${stroke.id}_cut_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
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
