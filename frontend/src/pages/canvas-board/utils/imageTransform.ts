import { Point, CanvasItemImage, SnapGuide, CropBox, StrokeRecord } from '../types';

export type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'inside' | 'none';

export function isStrokeFullyInsideImage(stroke: StrokeRecord, image: CanvasItemImage): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;
  return stroke.points.every(
    pt => pt.x >= image.x && pt.x <= image.x + image.width &&
          pt.y >= image.y && pt.y <= image.y + image.height
  );
}

export function hitTestImage(
  pt: Point,
  image: CanvasItemImage,
  handleSize = 10,
  isCropping = false
): { hit: boolean; handle: HandleType } {
  const { x, y, width, height } = image;
  const hs = handleSize;

  if (Math.abs(pt.x - x) <= hs && Math.abs(pt.y - y) <= hs) return { hit: true, handle: 'tl' };
  if (Math.abs(pt.x - (x + width)) <= hs && Math.abs(pt.y - y) <= hs) return { hit: true, handle: 'tr' };
  if (Math.abs(pt.x - x) <= hs && Math.abs(pt.y - (y + height)) <= hs) return { hit: true, handle: 'bl' };
  if (Math.abs(pt.x - (x + width)) <= hs && Math.abs(pt.y - (y + height)) <= hs) return { hit: true, handle: 'br' };

  if (isCropping) {
    if (Math.abs(pt.y - y) <= hs && pt.x >= x && pt.x <= x + width) return { hit: true, handle: 't' };
    if (Math.abs(pt.y - (y + height)) <= hs && pt.x >= x && pt.x <= x + width) return { hit: true, handle: 'b' };
    if (Math.abs(pt.x - x) <= hs && pt.y >= y && pt.y <= y + height) return { hit: true, handle: 'l' };
    if (Math.abs(pt.x - (x + width)) <= hs && pt.y >= y && pt.y <= y + height) return { hit: true, handle: 'r' };
  }

  if (pt.x >= x && pt.x <= x + width && pt.y >= y && pt.y <= y + height) {
    return { hit: true, handle: 'inside' };
  }

  return { hit: false, handle: 'none' };
}

interface RectItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a horizontal Canva-style gap measurement guide touching the exact borders of leftItem and rightItem.
 */
function createHorizontalGapGuide(leftItem: RectItem, rightItem: RectItem, gapVal: number): SnapGuide {
  const midY = (Math.max(leftItem.y, rightItem.y) + Math.min(leftItem.y + leftItem.height, rightItem.y + rightItem.height)) / 2;
  const startX = leftItem.x + leftItem.width;
  const endX = rightItem.x;
  const gapRounded = Math.round(gapVal);

  return {
    type: 'vertical',
    pos: endX,
    start: Math.min(leftItem.y, rightItem.y) - 40,
    end: Math.max(leftItem.y + leftItem.height, rightItem.y + rightItem.height) + 40,
    gapText: `${gapRounded}px`,
    gapStart: { x: startX, y: midY },
    gapEnd: { x: endX, y: midY },
    gapCenter: { x: (startX + endX) / 2, y: midY },
  };
}

/**
 * Creates a vertical Canva-style gap measurement guide touching the exact borders of topItem and bottomItem.
 */
function createVerticalGapGuide(topItem: RectItem, bottomItem: RectItem, gapVal: number): SnapGuide {
  const midX = (Math.max(topItem.x, bottomItem.x) + Math.min(topItem.x + topItem.width, bottomItem.x + bottomItem.width)) / 2;
  const startY = topItem.y + topItem.height;
  const endY = bottomItem.y;
  const gapRounded = Math.round(gapVal);

  return {
    type: 'horizontal',
    pos: endY,
    start: Math.min(topItem.x, bottomItem.x) - 40,
    end: Math.max(topItem.x + topItem.width, bottomItem.x + bottomItem.width) + 40,
    gapText: `${gapRounded}px`,
    gapStart: { x: midX, y: startY },
    gapEnd: { x: midX, y: endY },
    gapCenter: { x: midX, y: (startY + endY) / 2 },
  };
}

/**
 * Figma & Canva Professional Auto-Alignment & Border-Exact Gap Snapping Engine
 */
export function calculateAutoAlign(
  target: RectItem,
  otherItems: CanvasItemImage[],
  snapThreshold = 12
): { snappedX: number; snappedY: number; guides: SnapGuide[] } {
  let snappedX = target.x;
  let snappedY = target.y;
  const guides: SnapGuide[] = [];

  // Filter other items into valid arrays
  if (otherItems.length === 0) {
    return { snappedX, snappedY, guides };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. HORIZONTAL GAP SNAPPING (Border-Exact)
  // ─────────────────────────────────────────────────────────────
  let foundHorizontalGap = false;

  // A. Sandwich / In-Between Snapping: Target is between leftItem and rightItem
  for (let i = 0; i < otherItems.length; i++) {
    for (let j = 0; j < otherItems.length; j++) {
      if (i === j) continue;
      const leftItem = otherItems[i];
      const rightItem = otherItems[j];

      // leftItem is strictly to the left of rightItem
      if (leftItem.x + leftItem.width < rightItem.x) {
        const availableSpace = rightItem.x - (leftItem.x + leftItem.width);
        const equalGap = (availableSpace - target.width) / 2;

        if (equalGap > 3) {
          const optimalX = leftItem.x + leftItem.width + equalGap;
          if (Math.abs(target.x - optimalX) <= snapThreshold) {
            snappedX = optimalX;
            foundHorizontalGap = true;

            const snappedTarget: RectItem = { ...target, x: snappedX };
            // Guide 1: Touching leftItem right-border -> Target left-border
            guides.push(createHorizontalGapGuide(leftItem, snappedTarget, equalGap));
            // Guide 2: Touching Target right-border -> rightItem left-border
            guides.push(createHorizontalGapGuide(snappedTarget, rightItem, equalGap));
            break;
          }
        }
      }
    }
    if (foundHorizontalGap) break;
  }

  // B. Pattern / Equal Step Matching (e.g. A --G-- B --G-- Target or Target --G-- A --G-- B)
  if (!foundHorizontalGap && otherItems.length >= 2) {
    const sortedOthers = [...otherItems].sort((a, b) => a.x - b.x);

    for (let k = 0; k < sortedOthers.length - 1; k++) {
      const a = sortedOthers[k];
      const b = sortedOthers[k + 1];
      const g = b.x - (a.x + a.width);

      if (g > 3) {
        // Test placing Target to the right of b: b --G-- Target
        const rightSnapX = b.x + b.width + g;
        if (Math.abs(target.x - rightSnapX) <= snapThreshold) {
          snappedX = rightSnapX;
          foundHorizontalGap = true;

          const snappedTarget: RectItem = { ...target, x: snappedX };
          // Guide between A and B
          guides.push(createHorizontalGapGuide(a, b, g));
          // Guide between B and Target
          guides.push(createHorizontalGapGuide(b, snappedTarget, g));
          break;
        }

        // Test placing Target to the left of a: Target --G-- a
        const leftSnapX = a.x - target.width - g;
        if (Math.abs(target.x - leftSnapX) <= snapThreshold) {
          snappedX = leftSnapX;
          foundHorizontalGap = true;

          const snappedTarget: RectItem = { ...target, x: snappedX };
          // Guide between Target and A
          guides.push(createHorizontalGapGuide(snappedTarget, a, g));
          // Guide between A and B
          guides.push(createHorizontalGapGuide(a, b, g));
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VERTICAL GAP SNAPPING (Border-Exact)
  // ─────────────────────────────────────────────────────────────
  let foundVerticalGap = false;

  // A. Vertical Sandwich Snapping: Target is between topItem and bottomItem
  for (let i = 0; i < otherItems.length; i++) {
    for (let j = 0; j < otherItems.length; j++) {
      if (i === j) continue;
      const topItem = otherItems[i];
      const bottomItem = otherItems[j];

      if (topItem.y + topItem.height < bottomItem.y) {
        const availableSpace = bottomItem.y - (topItem.y + topItem.height);
        const equalGap = (availableSpace - target.height) / 2;

        if (equalGap > 3) {
          const optimalY = topItem.y + topItem.height + equalGap;
          if (Math.abs(target.y - optimalY) <= snapThreshold) {
            snappedY = optimalY;
            foundVerticalGap = true;

            const snappedTarget: RectItem = { ...target, y: snappedY };
            guides.push(createVerticalGapGuide(topItem, snappedTarget, equalGap));
            guides.push(createVerticalGapGuide(snappedTarget, bottomItem, equalGap));
            break;
          }
        }
      }
    }
    if (foundVerticalGap) break;
  }

  // B. Vertical Pattern / Equal Step Matching
  if (!foundVerticalGap && otherItems.length >= 2) {
    const sortedOthers = [...otherItems].sort((a, b) => a.y - b.y);

    for (let k = 0; k < sortedOthers.length - 1; k++) {
      const a = sortedOthers[k];
      const b = sortedOthers[k + 1];
      const g = b.y - (a.y + a.height);

      if (g > 3) {
        // Bottom placement: b --G-- Target
        const bottomSnapY = b.y + b.height + g;
        if (Math.abs(target.y - bottomSnapY) <= snapThreshold) {
          snappedY = bottomSnapY;
          foundVerticalGap = true;

          const snappedTarget: RectItem = { ...target, y: snappedY };
          guides.push(createVerticalGapGuide(a, b, g));
          guides.push(createVerticalGapGuide(b, snappedTarget, g));
          break;
        }

        // Top placement: Target --G-- a
        const topSnapY = a.y - target.height - g;
        if (Math.abs(target.y - topSnapY) <= snapThreshold) {
          snappedY = topSnapY;
          foundVerticalGap = true;

          const snappedTarget: RectItem = { ...target, y: snappedY };
          guides.push(createVerticalGapGuide(snappedTarget, a, g));
          guides.push(createVerticalGapGuide(a, b, g));
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. AXIS ALIGNMENT (Edges & Centers)
  // ─────────────────────────────────────────────────────────────
  const candidateX: { pos: number; type: string }[] = [{ pos: 50, type: 'start' }];
  for (const item of otherItems) {
    candidateX.push(
      { pos: item.x, type: 'left' },
      { pos: item.x + item.width / 2, type: 'center' },
      { pos: item.x + item.width, type: 'right' }
    );
  }

  let minDiffX = snapThreshold + 1;
  let chosenSnapX: number | null = null;
  let guideLineX: SnapGuide | null = null;

  for (const c of candidateX) {
    if (Math.abs(target.x - c.pos) < minDiffX) {
      minDiffX = Math.abs(target.x - c.pos); chosenSnapX = c.pos;
      guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
    }
    if (Math.abs((target.x + target.width / 2) - c.pos) < minDiffX) {
      minDiffX = Math.abs((target.x + target.width / 2) - c.pos); chosenSnapX = c.pos - target.width / 2;
      guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
    }
    if (Math.abs((target.x + target.width) - c.pos) < minDiffX) {
      minDiffX = Math.abs((target.x + target.width) - c.pos); chosenSnapX = c.pos - target.width;
      guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
    }
  }

  if (!foundHorizontalGap && chosenSnapX !== null && minDiffX <= snapThreshold) {
    snappedX = chosenSnapX;
    if (guideLineX) guides.push(guideLineX);
  }

  const candidateY: { pos: number; type: string }[] = [{ pos: 50, type: 'start' }];
  for (const item of otherItems) {
    candidateY.push(
      { pos: item.y, type: 'top' },
      { pos: item.y + item.height / 2, type: 'middle' },
      { pos: item.y + item.height, type: 'bottom' }
    );
  }

  let minDiffY = snapThreshold + 1;
  let chosenSnapY: number | null = null;
  let guideLineY: SnapGuide | null = null;

  for (const c of candidateY) {
    if (Math.abs(target.y - c.pos) < minDiffY) {
      minDiffY = Math.abs(target.y - c.pos); chosenSnapY = c.pos;
      guideLineY = { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
    }
    if (Math.abs((target.y + target.height / 2) - c.pos) < minDiffY) {
      minDiffY = Math.abs((target.y + target.height / 2) - c.pos); chosenSnapY = c.pos - target.height / 2;
      guideLineY = { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
    }
    if (Math.abs((target.y + target.height) - c.pos) < minDiffY) {
      minDiffY = Math.abs((target.y + target.height) - c.pos); chosenSnapY = c.pos - target.height;
      guideLineY = { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
    }
  }

  if (!foundVerticalGap && chosenSnapY !== null && minDiffY <= snapThreshold) {
    snappedY = chosenSnapY;
    if (guideLineY) guides.push(guideLineY);
  }

  return { snappedX, snappedY, guides };
}

export async function applyWordCrop(
  imageItem: CanvasItemImage,
  cropBox: CropBox
): Promise<CanvasItemImage> {
  const normCropX = Math.max(0, cropBox.x - imageItem.x);
  const normCropY = Math.max(0, cropBox.y - imageItem.y);
  const normCropW = Math.min(imageItem.width, cropBox.width);
  const normCropH = Math.min(imageItem.height, cropBox.height);

  const scaleX = imageItem.img.naturalWidth / imageItem.width;
  const scaleY = imageItem.img.naturalHeight / imageItem.height;

  const srcX = normCropX * scaleX;
  const srcY = normCropY * scaleY;
  const srcW = normCropW * scaleX;
  const srcH = normCropH * scaleY;

  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, srcW);
  offscreen.height = Math.max(1, srcH);
  const ctx = offscreen.getContext('2d');
  if (ctx) {
    ctx.drawImage(imageItem.img, srcX, srcY, srcW, srcH, 0, 0, offscreen.width, offscreen.height);
  }

  return new Promise((resolve) => {
    const croppedImg = new Image();
    croppedImg.onload = () => {
      resolve({
        id: 'img_' + Date.now(),
        img: croppedImg,
        x: imageItem.x + normCropX,
        y: imageItem.y + normCropY,
        width: normCropW,
        height: normCropH,
        originalSrc: imageItem.originalSrc,
      });
    };
    croppedImg.src = offscreen.toDataURL('image/png');
  });
}
