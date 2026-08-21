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

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: string;
}

/**
 * Universal Multi-Object Equal Spacing & Row/Column Distribution Engine (Canva & Figma Standard)
 */
export function calculateAutoAlign(
  target: Box,
  otherItems: CanvasItemImage[],
  snapThreshold = 12
): { snappedX: number; snappedY: number; guides: SnapGuide[] } {
  let snappedX = target.x;
  let snappedY = target.y;
  const guides: SnapGuide[] = [];

  const targetMidY = target.y + target.height / 2;
  const targetMidX = target.x + target.width / 2;

  // ─────────────────────────────────────────────────────────────
  // 1. UNIVERSAL MULTI-OBJECT HORIZONTAL EQUAL DISTRIBUTION
  // ─────────────────────────────────────────────────────────────
  let foundHorizontalGap = false;

  if (otherItems.length >= 2) {
    // Sort all other items from left to right
    const sortedOthers = [...otherItems].sort((a, b) => a.x - b.x);

    // Try placing target into every possible index in the row [0, 1, ..., sortedOthers.length]
    for (let insertIdx = 0; insertIdx <= sortedOthers.length; insertIdx++) {
      const fullRow: Box[] = [
        ...sortedOthers.slice(0, insertIdx),
        { ...target, x: target.x },
        ...sortedOthers.slice(insertIdx),
      ];

      // A. Interior multi-object equal distribution (between first and last items)
      if (insertIdx > 0 && insertIdx < fullRow.length - 1) {
        const first = fullRow[0];
        const last = fullRow[fullRow.length - 1];
        const totalSpan = (last.x + last.width) - first.x;
        const totalWidths = fullRow.reduce((sum, item) => sum + item.width, 0);
        const gapsCount = fullRow.length - 1;
        const equalGap = (totalSpan - totalWidths) / gapsCount;

        if (equalGap > 3) {
          // Calculate expected X position of target at insertIdx
          let expectedX = first.x;
          for (let k = 0; k < insertIdx; k++) {
            expectedX += fullRow[k].width + equalGap;
          }

          if (Math.abs(target.x - expectedX) <= snapThreshold) {
            snappedX = expectedX;
            foundHorizontalGap = true;
            const gapRounded = Math.round(equalGap);

            // Reconstruct exact positions with snapped target
            const resolvedRow: Box[] = [];
            let currX = first.x;
            for (let k = 0; k < fullRow.length; k++) {
              resolvedRow.push({ ...fullRow[k], x: currX });
              currX += fullRow[k].width + equalGap;
            }

            // Generate Canva guides for ALL pairs in this entire row!
            for (let k = 0; k < resolvedRow.length - 1; k++) {
              const a = resolvedRow[k];
              const b = resolvedRow[k + 1];
              guides.push({
                type: 'vertical',
                pos: b.x,
                start: Math.min(a.y, b.y, target.y) - 40,
                end: Math.max(a.y + a.height, b.y + b.height, target.y + target.height) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: a.x + a.width, y: targetMidY },
                gapEnd: { x: b.x, y: targetMidY },
                gapCenter: { x: (a.x + a.width + b.x) / 2, y: targetMidY },
              });
            }
            break;
          }
        }
      }

      // B. Outermost left/right matching gap extension
      if (insertIdx === 0 || insertIdx === fullRow.length - 1) {
        // Find existing gaps in other items
        for (let k = 0; k < sortedOthers.length - 1; k++) {
          const a = sortedOthers[k];
          const b = sortedOthers[k + 1];
          const g = b.x - (a.x + a.width);
          if (g > 3) {
            let snapPos: number | null = null;
            if (insertIdx === fullRow.length - 1) {
              const lastOther = sortedOthers[sortedOthers.length - 1];
              snapPos = lastOther.x + lastOther.width + g;
            } else if (insertIdx === 0) {
              const firstOther = sortedOthers[0];
              snapPos = firstOther.x - target.width - g;
            }

            if (snapPos !== null && Math.abs(target.x - snapPos) <= snapThreshold) {
              snappedX = snapPos;
              foundHorizontalGap = true;
              const gapRounded = Math.round(g);

              // Render guides for existing pairs AND new outer pair
              for (let m = 0; m < sortedOthers.length - 1; m++) {
                const p1 = sortedOthers[m];
                const p2 = sortedOthers[m + 1];
                guides.push({
                  type: 'vertical', pos: p2.x,
                  start: Math.min(p1.y, p2.y, target.y) - 40, end: Math.max(p1.y + p1.height, p2.y + p2.height, target.y + target.height) + 40,
                  gapText: `${gapRounded}px`,
                  gapStart: { x: p1.x + p1.width, y: targetMidY },
                  gapEnd: { x: p2.x, y: targetMidY },
                  gapCenter: { x: (p1.x + p1.width + p2.x) / 2, y: targetMidY },
                });
              }

              if (insertIdx === fullRow.length - 1) {
                const lastOther = sortedOthers[sortedOthers.length - 1];
                guides.push({
                  type: 'vertical', pos: snappedX,
                  start: Math.min(lastOther.y, target.y) - 40, end: Math.max(lastOther.y + lastOther.height, target.y + target.height) + 40,
                  gapText: `${gapRounded}px`,
                  gapStart: { x: lastOther.x + lastOther.width, y: targetMidY },
                  gapEnd: { x: snappedX, y: targetMidY },
                  gapCenter: { x: (lastOther.x + lastOther.width + snappedX) / 2, y: targetMidY },
                });
              } else {
                const firstOther = sortedOthers[0];
                guides.push({
                  type: 'vertical', pos: firstOther.x,
                  start: Math.min(target.y, firstOther.y) - 40, end: Math.max(target.y + target.height, firstOther.y + firstOther.height) + 40,
                  gapText: `${gapRounded}px`,
                  gapStart: { x: snappedX + target.width, y: targetMidY },
                  gapEnd: { x: firstOther.x, y: targetMidY },
                  gapCenter: { x: (snappedX + target.width + firstOther.x) / 2, y: targetMidY },
                });
              }
              break;
            }
          }
        }
      }
      if (foundHorizontalGap) break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. UNIVERSAL MULTI-OBJECT VERTICAL EQUAL DISTRIBUTION
  // ─────────────────────────────────────────────────────────────
  let foundVerticalGap = false;

  if (otherItems.length >= 2) {
    const sortedOthers = [...otherItems].sort((a, b) => a.y - b.y);

    for (let insertIdx = 0; insertIdx <= sortedOthers.length; insertIdx++) {
      const fullCol: Box[] = [
        ...sortedOthers.slice(0, insertIdx),
        { ...target, y: target.y },
        ...sortedOthers.slice(insertIdx),
      ];

      // A. Interior multi-object vertical distribution
      if (insertIdx > 0 && insertIdx < fullCol.length - 1) {
        const first = fullCol[0];
        const last = fullCol[fullCol.length - 1];
        const totalSpan = (last.y + last.height) - first.y;
        const totalHeights = fullCol.reduce((sum, item) => sum + item.height, 0);
        const gapsCount = fullCol.length - 1;
        const equalGap = (totalSpan - totalHeights) / gapsCount;

        if (equalGap > 3) {
          let expectedY = first.y;
          for (let k = 0; k < insertIdx; k++) {
            expectedY += fullCol[k].height + equalGap;
          }

          if (Math.abs(target.y - expectedY) <= snapThreshold) {
            snappedY = expectedY;
            foundVerticalGap = true;
            const gapRounded = Math.round(equalGap);

            const resolvedCol: Box[] = [];
            let currY = first.y;
            for (let k = 0; k < fullCol.length; k++) {
              resolvedCol.push({ ...fullCol[k], y: currY });
              currY += fullCol[k].height + equalGap;
            }

            for (let k = 0; k < resolvedCol.length - 1; k++) {
              const a = resolvedCol[k];
              const b = resolvedCol[k + 1];
              guides.push({
                type: 'horizontal',
                pos: b.y,
                start: Math.min(a.x, b.x, target.x) - 40,
                end: Math.max(a.x + a.width, b.x + b.width, target.x + target.width) + 40,
                gapText: `${gapRounded}px`,
                gapStart: { x: targetMidX, y: a.y + a.height },
                gapEnd: { x: targetMidX, y: b.y },
                gapCenter: { x: targetMidX, y: (a.y + a.height + b.y) / 2 },
              });
            }
            break;
          }
        }
      }

      // B. Outermost top/bottom matching gap extension
      if (insertIdx === 0 || insertIdx === fullCol.length - 1) {
        for (let k = 0; k < sortedOthers.length - 1; k++) {
          const a = sortedOthers[k];
          const b = sortedOthers[k + 1];
          const g = b.y - (a.y + a.height);
          if (g > 3) {
            let snapPos: number | null = null;
            if (insertIdx === fullCol.length - 1) {
              const lastOther = sortedOthers[sortedOthers.length - 1];
              snapPos = lastOther.y + lastOther.height + g;
            } else if (insertIdx === 0) {
              const firstOther = sortedOthers[0];
              snapPos = firstOther.y - target.height - g;
            }

            if (snapPos !== null && Math.abs(target.y - snapPos) <= snapThreshold) {
              snappedY = snapPos;
              foundVerticalGap = true;
              const gapRounded = Math.round(g);

              for (let m = 0; m < sortedOthers.length - 1; m++) {
                const p1 = sortedOthers[m];
                const p2 = sortedOthers[m + 1];
                guides.push({
                  type: 'horizontal', pos: p2.y,
                  start: Math.min(p1.x, p2.x, target.x) - 40, end: Math.max(p1.x + p1.width, p2.x + p2.width, target.x + target.width) + 40,
                  gapText: `${gapRounded}px`,
                  gapStart: { x: targetMidX, y: p1.y + p1.height },
                  gapEnd: { x: targetMidX, y: p2.y },
                  gapCenter: { x: targetMidX, y: (p1.y + p1.height + p2.y) / 2 },
                });
              }

              if (insertIdx === fullCol.length - 1) {
                const lastOther = sortedOthers[sortedOthers.length - 1];
                guides.push({
                  type: 'horizontal', pos: snappedY,
                  start: Math.min(lastOther.x, target.x) - 40, end: Math.max(lastOther.x + lastOther.width, target.x + target.width) + 40,
                  gapText: `${gapRounded}px`,
                  gapStart: { x: targetMidX, y: lastOther.y + lastOther.height },
                  gapEnd: { x: targetMidX, y: snappedY },
                  gapCenter: { x: targetMidX, y: (lastOther.y + lastOther.height + snappedY) / 2 },
                });
              } else {
                const firstOther = sortedOthers[0];
                guides.push({
                  type: 'horizontal', pos: firstOther.y,
                  start: Math.min(target.x, firstOther.x) - 40, end: Math.max(target.x + target.width, firstOther.x + firstOther.width) + 40,
                  gapText: `${gapRounded}px`,
                  gapStart: { x: targetMidX, y: snappedY + target.height },
                  gapEnd: { x: targetMidX, y: firstOther.y },
                  gapCenter: { x: targetMidX, y: (snappedY + target.height + firstOther.y) / 2 },
                });
              }
              break;
            }
          }
        }
      }
      if (foundVerticalGap) break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. STANDARD AXIS ALIGNMENT (LEFT / CENTER / RIGHT / TOP / MIDDLE / BOTTOM)
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
