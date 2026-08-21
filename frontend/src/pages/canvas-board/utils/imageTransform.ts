import { Point, CanvasItemImage, SnapGuide, CropBox, StrokeRecord } from '../types';

export type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'inside' | 'none';

/**
 * Checks if a stroke is 100% fully contained within an image boundary.
 */
export function isStrokeFullyInsideImage(stroke: StrokeRecord, image: CanvasItemImage): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;
  return stroke.points.every(
    pt => pt.x >= image.x && pt.x <= image.x + image.width &&
          pt.y >= image.y && pt.y <= image.y + image.height
  );
}

/**
 * Checks if a point is inside an image or its handles.
 */
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

/**
 * Canva & Figma Smart Equal Spacing & Midpoint / Center Alignment Engine
 */
export function calculateAutoAlign(
  target: { x: number; y: number; width: number; height: number },
  otherItems: CanvasItemImage[],
  snapThreshold = 12
): { snappedX: number; snappedY: number; guides: SnapGuide[] } {
  let snappedX = target.x;
  let snappedY = target.y;
  const guides: SnapGuide[] = [];

  const targetCenterX = target.x + target.width / 2;
  const targetRight = target.x + target.width;
  const targetCenterY = target.y + target.height / 2;
  const targetBottom = target.y + target.height;
  const targetMidY = target.y + target.height / 2;
  const targetMidX = target.x + target.width / 2;

  // ─────────────────────────────────────────────────────────────
  // 1. HORIZONTAL IN-BETWEEN (SANDWICH) EQUAL SPACING
  // ─────────────────────────────────────────────────────────────
  let foundHorizontalSandwich = false;
  for (let i = 0; i < otherItems.length; i++) {
    for (let j = 0; j < otherItems.length; j++) {
      if (i === j) continue;
      const leftItem = otherItems[i];
      const rightItem = otherItems[j];

      // leftItem is strictly to the left of rightItem
      if (leftItem.x + leftItem.width < rightItem.x) {
        const availableSpace = rightItem.x - (leftItem.x + leftItem.width);
        const equalGap = (availableSpace - target.width) / 2;

        if (equalGap > 5) {
          const optimalX = leftItem.x + leftItem.width + equalGap;
          if (Math.abs(target.x - optimalX) <= snapThreshold) {
            snappedX = optimalX;
            foundHorizontalSandwich = true;

            const gapRounded = Math.round(equalGap);
            // Left guide
            guides.push({
              type: 'vertical',
              pos: snappedX,
              start: Math.min(leftItem.y, target.y) - 50,
              end: Math.max(leftItem.y + leftItem.height, target.y + target.height) + 50,
              gapText: `${gapRounded}px`,
              gapStart: { x: leftItem.x + leftItem.width, y: targetMidY },
              gapEnd: { x: snappedX, y: targetMidY },
              gapCenter: { x: (leftItem.x + leftItem.width + snappedX) / 2, y: targetMidY },
            });
            // Right guide
            guides.push({
              type: 'vertical',
              pos: snappedX + target.width,
              start: Math.min(rightItem.y, target.y) - 50,
              end: Math.max(rightItem.y + rightItem.height, target.y + target.height) + 50,
              gapText: `${gapRounded}px`,
              gapStart: { x: snappedX + target.width, y: targetMidY },
              gapEnd: { x: rightItem.x, y: targetMidY },
              gapCenter: { x: (snappedX + target.width + rightItem.x) / 2, y: targetMidY },
            });
            break;
          }
        }
      }
    }
    if (foundHorizontalSandwich) break;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VERTICAL IN-BETWEEN (SANDWICH) EQUAL SPACING
  // ─────────────────────────────────────────────────────────────
  let foundVerticalSandwich = false;
  for (let i = 0; i < otherItems.length; i++) {
    for (let j = 0; j < otherItems.length; j++) {
      if (i === j) continue;
      const topItem = otherItems[i];
      const bottomItem = otherItems[j];

      if (topItem.y + topItem.height < bottomItem.y) {
        const availableSpace = bottomItem.y - (topItem.y + topItem.height);
        const equalGap = (availableSpace - target.height) / 2;

        if (equalGap > 5) {
          const optimalY = topItem.y + topItem.height + equalGap;
          if (Math.abs(target.y - optimalY) <= snapThreshold) {
            snappedY = optimalY;
            foundVerticalSandwich = true;

            const gapRounded = Math.round(equalGap);
            // Top guide
            guides.push({
              type: 'horizontal',
              pos: snappedY,
              start: Math.min(topItem.x, target.x) - 50,
              end: Math.max(topItem.x + topItem.width, target.x + target.width) + 50,
              gapText: `${gapRounded}px`,
              gapStart: { x: targetMidX, y: topItem.y + topItem.height },
              gapEnd: { x: targetMidX, y: snappedY },
              gapCenter: { x: targetMidX, y: (topItem.y + topItem.height + snappedY) / 2 },
            });
            // Bottom guide
            guides.push({
              type: 'horizontal',
              pos: snappedY + target.height,
              start: Math.min(bottomItem.x, target.x) - 50,
              end: Math.max(bottomItem.x + bottomItem.width, target.x + target.width) + 50,
              gapText: `${gapRounded}px`,
              gapStart: { x: targetMidX, y: snappedY + target.height },
              gapEnd: { x: targetMidX, y: bottomItem.y },
              gapCenter: { x: targetMidX, y: (snappedY + target.height + bottomItem.y) / 2 },
            });
            break;
          }
        }
      }
    }
    if (foundVerticalSandwich) break;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. MATCHING EXISTING PAIR DISTANCES & AXES (If not in sandwich)
  // ─────────────────────────────────────────────────────────────
  if (!foundHorizontalSandwich) {
    const candidateX: { pos: number; type: string; guide?: SnapGuide }[] = [
      { pos: 50, type: 'start' }
    ];

    for (const item of otherItems) {
      candidateX.push(
        { pos: item.x, type: 'left' },
        { pos: item.x + item.width / 2, type: 'center' },
        { pos: item.x + item.width, type: 'right' }
      );
    }

    // Check if other pairs have a gap G, snap target to right of neighbor with gap G
    for (let i = 0; i < otherItems.length; i++) {
      for (let j = 0; j < otherItems.length; j++) {
        if (i === j) continue;
        const a = otherItems[i];
        const b = otherItems[j];
        if (a.x + a.width < b.x) {
          const g = b.x - (a.x + a.width);
          if (g > 10) {
            // Snap to right of b with gap g
            const snapPos = b.x + b.width + g;
            candidateX.push({
              pos: snapPos,
              type: 'match-gap',
              guide: {
                type: 'vertical',
                pos: snapPos,
                start: Math.min(b.y, target.y) - 50,
                end: Math.max(b.y + b.height, target.y + target.height) + 50,
                gapText: `${Math.round(g)}px`,
                gapStart: { x: b.x + b.width, y: targetMidY },
                gapEnd: { x: snapPos, y: targetMidY },
                gapCenter: { x: (b.x + b.width + snapPos) / 2, y: targetMidY },
              }
            });
          }
        }
      }
    }

    let minDiffX = snapThreshold + 1;
    let chosenSnapX: number | null = null;
    let guideLineX: SnapGuide | null = null;

    for (const c of candidateX) {
      if (Math.abs(target.x - c.pos) < minDiffX) {
        minDiffX = Math.abs(target.x - c.pos);
        chosenSnapX = c.pos;
        guideLineX = c.guide || { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
      }
      if (Math.abs(targetCenterX - c.pos) < minDiffX) {
        minDiffX = Math.abs(targetCenterX - c.pos);
        chosenSnapX = c.pos - target.width / 2;
        guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
      }
      if (Math.abs(targetRight - c.pos) < minDiffX) {
        minDiffX = Math.abs(targetRight - c.pos);
        chosenSnapX = c.pos - target.width;
        guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
      }
    }

    if (chosenSnapX !== null && minDiffX <= snapThreshold) {
      snappedX = chosenSnapX;
      if (guideLineX) guides.push(guideLineX);
    }
  }

  if (!foundVerticalSandwich) {
    const candidateY: { pos: number; type: string; guide?: SnapGuide }[] = [
      { pos: 50, type: 'start' }
    ];

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
        minDiffY = Math.abs(target.y - c.pos);
        chosenSnapY = c.pos;
        guideLineY = c.guide || { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
      }
      if (Math.abs(targetCenterY - c.pos) < minDiffY) {
        minDiffY = Math.abs(targetCenterY - c.pos);
        chosenSnapY = c.pos - target.height / 2;
        guideLineY = { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
      }
      if (Math.abs(targetBottom - c.pos) < minDiffY) {
        minDiffY = Math.abs(targetBottom - c.pos);
        chosenSnapY = c.pos - target.height;
        guideLineY = { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
      }
    }

    if (chosenSnapY !== null && minDiffY <= snapThreshold) {
      snappedY = chosenSnapY;
      if (guideLineY) guides.push(guideLineY);
    }
  }

  return { snappedX, snappedY, guides };
}

/**
 * Applies Word-style crop on an image item.
 */
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
