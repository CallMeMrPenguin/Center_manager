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
 * Canva & Figma Smart Equal Spacing, Multi-Object Row/Column & Outermost Gap Snapping Engine
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
  // 1. HORIZONTAL EQUAL SPACING (Sandwich + Outermost Item Extension)
  // ─────────────────────────────────────────────────────────────
  let foundHorizontalGap = false;

  // A. Sandwich / In-Between Snapping
  for (let i = 0; i < otherItems.length; i++) {
    for (let j = 0; j < otherItems.length; j++) {
      if (i === j) continue;
      const leftItem = otherItems[i];
      const rightItem = otherItems[j];

      if (leftItem.x + leftItem.width < rightItem.x) {
        const availableSpace = rightItem.x - (leftItem.x + leftItem.width);
        const equalGap = (availableSpace - target.width) / 2;

        if (equalGap > 4) {
          const optimalX = leftItem.x + leftItem.width + equalGap;
          if (Math.abs(target.x - optimalX) <= snapThreshold) {
            snappedX = optimalX;
            foundHorizontalGap = true;
            const gapRounded = Math.round(equalGap);

            // Left guide
            guides.push({
              type: 'vertical', pos: snappedX,
              start: Math.min(leftItem.y, target.y) - 40, end: Math.max(leftItem.y + leftItem.height, target.y + target.height) + 40,
              gapText: `${gapRounded}px`,
              gapStart: { x: leftItem.x + leftItem.width, y: targetMidY },
              gapEnd: { x: snappedX, y: targetMidY },
              gapCenter: { x: (leftItem.x + leftItem.width + snappedX) / 2, y: targetMidY },
            });
            // Right guide
            guides.push({
              type: 'vertical', pos: snappedX + target.width,
              start: Math.min(rightItem.y, target.y) - 40, end: Math.max(rightItem.y + rightItem.height, target.y + target.height) + 40,
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
    if (foundHorizontalGap) break;
  }

  // B. Outermost Item Row Extension (e.g. A --G-- B --G-- Target or Target --G-- A --G-- B)
  if (!foundHorizontalGap) {
    for (let i = 0; i < otherItems.length; i++) {
      for (let j = 0; j < otherItems.length; j++) {
        if (i === j) continue;
        const a = otherItems[i];
        const b = otherItems[j];

        if (a.x + a.width < b.x) {
          const g = b.x - (a.x + a.width);
          if (g > 4) {
            // Outermost Right Snap: target is placed after b
            const rightSnapX = b.x + b.width + g;
            if (Math.abs(target.x - rightSnapX) <= snapThreshold) {
              snappedX = rightSnapX;
              foundHorizontalGap = true;
              const gapRounded = Math.round(g);

              // 1. Existing A-B gap guide
              guides.push({
                type: 'vertical', pos: b.x,
                start: Math.min(a.y, b.y, target.y) - 40, end: Math.max(a.y + a.height, b.y + b.height, target.y + target.height) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: a.x + a.width, y: targetMidY },
                gapEnd: { x: b.x, y: targetMidY },
                gapCenter: { x: (a.x + a.width + b.x) / 2, y: targetMidY },
              });
              // 2. New B-Target gap guide
              guides.push({
                type: 'vertical', pos: snappedX,
                start: Math.min(b.y, target.y) - 40, end: Math.max(b.y + b.height, target.y + target.height) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: b.x + b.width, y: targetMidY },
                gapEnd: { x: snappedX, y: targetMidY },
                gapCenter: { x: (b.x + b.width + snappedX) / 2, y: targetMidY },
              });
              break;
            }

            // Outermost Left Snap: target is placed before a
            const leftSnapX = a.x - target.width - g;
            if (Math.abs(target.x - leftSnapX) <= snapThreshold) {
              snappedX = leftSnapX;
              foundHorizontalGap = true;
              const gapRounded = Math.round(g);

              // 1. New Target-A gap guide
              guides.push({
                type: 'vertical', pos: a.x,
                start: Math.min(target.y, a.y) - 40, end: Math.max(target.y + target.height, a.y + a.height) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: snappedX + target.width, y: targetMidY },
                gapEnd: { x: a.x, y: targetMidY },
                gapCenter: { x: (snappedX + target.width + a.x) / 2, y: targetMidY },
              });
              // 2. Existing A-B gap guide
              guides.push({
                type: 'vertical', pos: b.x,
                start: Math.min(a.y, b.y, target.y) - 40, end: Math.max(a.y + a.height, b.y + b.height, target.y + target.height) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: a.x + a.width, y: targetMidY },
                gapEnd: { x: b.x, y: targetMidY },
                gapCenter: { x: (a.x + a.width + b.x) / 2, y: targetMidY },
              });
              break;
            }
          }
        }
      }
      if (foundHorizontalGap) break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VERTICAL EQUAL SPACING (Sandwich + Outermost Column Extension)
  // ─────────────────────────────────────────────────────────────
  let foundVerticalGap = false;

  // A. Sandwich / In-Between Snapping
  for (let i = 0; i < otherItems.length; i++) {
    for (let j = 0; j < otherItems.length; j++) {
      if (i === j) continue;
      const topItem = otherItems[i];
      const bottomItem = otherItems[j];

      if (topItem.y + topItem.height < bottomItem.y) {
        const availableSpace = bottomItem.y - (topItem.y + topItem.height);
        const equalGap = (availableSpace - target.height) / 2;

        if (equalGap > 4) {
          const optimalY = topItem.y + topItem.height + equalGap;
          if (Math.abs(target.y - optimalY) <= snapThreshold) {
            snappedY = optimalY;
            foundVerticalGap = true;
            const gapRounded = Math.round(equalGap);

            // Top guide
            guides.push({
              type: 'horizontal', pos: snappedY,
              start: Math.min(topItem.x, target.x) - 40, end: Math.max(topItem.x + topItem.width, target.x + target.width) + 40,
              gapText: `${gapRounded}px`,
              gapStart: { x: targetMidX, y: topItem.y + topItem.height },
              gapEnd: { x: targetMidX, y: snappedY },
              gapCenter: { x: targetMidX, y: (topItem.y + topItem.height + snappedY) / 2 },
            });
            // Bottom guide
            guides.push({
              type: 'horizontal', pos: snappedY + target.height,
              start: Math.min(bottomItem.x, target.x) - 40, end: Math.max(bottomItem.x + bottomItem.width, target.x + target.width) + 40,
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
    if (foundVerticalGap) break;
  }

  // B. Outermost Item Column Extension (Top / Bottom)
  if (!foundVerticalGap) {
    for (let i = 0; i < otherItems.length; i++) {
      for (let j = 0; j < otherItems.length; j++) {
        if (i === j) continue;
        const a = otherItems[i];
        const b = otherItems[j];

        if (a.y + a.height < b.y) {
          const g = b.y - (a.y + a.height);
          if (g > 4) {
            // Outermost Bottom Snap
            const bottomSnapY = b.y + b.height + g;
            if (Math.abs(target.y - bottomSnapY) <= snapThreshold) {
              snappedY = bottomSnapY;
              foundVerticalGap = true;
              const gapRounded = Math.round(g);

              guides.push({
                type: 'horizontal', pos: b.y,
                start: Math.min(a.x, b.x, target.x) - 40, end: Math.max(a.x + a.width, b.x + b.width, target.x + target.width) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: targetMidX, y: a.y + a.height },
                gapEnd: { x: targetMidX, y: b.y },
                gapCenter: { x: targetMidX, y: (a.y + a.height + b.y) / 2 },
              });
              guides.push({
                type: 'horizontal', pos: snappedY,
                start: Math.min(b.x, target.x) - 40, end: Math.max(b.x + b.width, target.x + target.width) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: targetMidX, y: b.y + b.height },
                gapEnd: { x: targetMidX, y: snappedY },
                gapCenter: { x: targetMidX, y: (b.y + b.height + snappedY) / 2 },
              });
              break;
            }

            // Outermost Top Snap
            const topSnapY = a.y - target.height - g;
            if (Math.abs(target.y - topSnapY) <= snapThreshold) {
              snappedY = topSnapY;
              foundVerticalGap = true;
              const gapRounded = Math.round(g);

              guides.push({
                type: 'horizontal', pos: a.y,
                start: Math.min(target.x, a.x) - 40, end: Math.max(target.x + target.width, a.x + a.width) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: targetMidX, y: snappedY + target.height },
                gapEnd: { x: targetMidX, y: a.y },
                gapCenter: { x: targetMidX, y: (snappedY + target.height + a.y) / 2 },
              });
              guides.push({
                type: 'horizontal', pos: b.y,
                start: Math.min(a.x, b.x, target.x) - 40, end: Math.max(a.x + a.width, b.x + b.width, target.x + target.width) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: targetMidX, y: a.y + a.height },
                gapEnd: { x: targetMidX, y: b.y },
                gapCenter: { x: targetMidX, y: (a.y + a.height + b.y) / 2 },
              });
              break;
            }
          }
        }
      }
      if (foundVerticalGap) break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. STANDARD EDGE & CENTER AXIS ALIGNMENT
  // ─────────────────────────────────────────────────────────────
  if (!foundHorizontalGap) {
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
      if (Math.abs(targetCenterX - c.pos) < minDiffX) {
        minDiffX = Math.abs(targetCenterX - c.pos); chosenSnapX = c.pos - target.width / 2;
        guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
      }
      if (Math.abs(targetRight - c.pos) < minDiffX) {
        minDiffX = Math.abs(targetRight - c.pos); chosenSnapX = c.pos - target.width;
        guideLineX = { type: 'vertical', pos: c.pos, start: Math.min(target.y - 100, -500), end: Math.max(target.y + target.height + 100, 2000) };
      }
    }

    if (chosenSnapX !== null && minDiffX <= snapThreshold) {
      snappedX = chosenSnapX;
      if (guideLineX) guides.push(guideLineX);
    }
  }

  if (!foundVerticalGap) {
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
      if (Math.abs(targetCenterY - c.pos) < minDiffY) {
        minDiffY = Math.abs(targetCenterY - c.pos); chosenSnapY = c.pos - target.height / 2;
        guideLineY = { type: 'horizontal', pos: c.pos, start: Math.min(target.x - 100, -500), end: Math.max(target.x + target.width + 100, 2000) };
      }
      if (Math.abs(targetBottom - c.pos) < minDiffY) {
        minDiffY = Math.abs(targetBottom - c.pos); chosenSnapY = c.pos - target.height;
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
