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
 * Auto-Alignment & Canva-Style Dimension Measurement Engine
 */
export function calculateAutoAlign(
  target: { x: number; y: number; width: number; height: number },
  otherItems: CanvasItemImage[],
  snapThreshold = 10
): { snappedX: number; snappedY: number; guides: SnapGuide[] } {
  let snappedX = target.x;
  let snappedY = target.y;
  const guides: SnapGuide[] = [];

  const targetCenterX = target.x + target.width / 2;
  const targetRight = target.x + target.width;
  const targetCenterY = target.y + target.height / 2;
  const targetBottom = target.y + target.height;

  const candidateX: { pos: number; type: string; gap?: number; neighbor?: CanvasItemImage; isGapRight?: boolean }[] = [
    { pos: 50, type: 'start' }
  ];
  const candidateY: { pos: number; type: string; gap?: number; neighbor?: CanvasItemImage; isGapBottom?: boolean }[] = [
    { pos: 50, type: 'start' }
  ];

  for (const item of otherItems) {
    candidateX.push(
      { pos: item.x, type: 'left' },
      { pos: item.x + item.width / 2, type: 'center' },
      { pos: item.x + item.width, type: 'right' },
      { pos: item.x + item.width + 30, type: 'gap-right', gap: 30, neighbor: item, isGapRight: true },
      { pos: item.x - target.width - 30, type: 'gap-left', gap: 30, neighbor: item, isGapRight: false }
    );
    candidateY.push(
      { pos: item.y, type: 'top' },
      { pos: item.y + item.height / 2, type: 'middle' },
      { pos: item.y + item.height, type: 'bottom' },
      { pos: item.y + item.height + 30, type: 'gap-bottom', gap: 30, neighbor: item, isGapBottom: true },
      { pos: item.y - target.height - 30, type: 'gap-top', gap: 30, neighbor: item, isGapBottom: false }
    );
  }

  // Snap X
  let minDiffX = snapThreshold + 1;
  let chosenSnapX: number | null = null;
  let guideLineX: SnapGuide | null = null;

  for (const c of candidateX) {
    if (Math.abs(target.x - c.pos) < minDiffX) {
      minDiffX = Math.abs(target.x - c.pos);
      chosenSnapX = c.pos;

      let gapStart: Point | undefined;
      let gapEnd: Point | undefined;
      let gapCenter: Point | undefined;

      if (c.neighbor && c.gap) {
        const midY = target.y + target.height / 2;
        if (c.isGapRight) {
          gapStart = { x: c.neighbor.x + c.neighbor.width, y: midY };
          gapEnd = { x: c.pos, y: midY };
        } else {
          gapStart = { x: c.pos + target.width, y: midY };
          gapEnd = { x: c.neighbor.x, y: midY };
        }
        gapCenter = { x: (gapStart.x + gapEnd.x) / 2, y: midY };
      }

      guideLineX = {
        type: 'vertical',
        pos: c.pos,
        start: Math.min(target.y - 100, -500),
        end: Math.max(target.y + target.height + 100, 2000),
        gapText: c.gap ? `${c.gap}px` : undefined,
        gapStart,
        gapEnd,
        gapCenter,
      };
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

  // Snap Y
  let minDiffY = snapThreshold + 1;
  let chosenSnapY: number | null = null;
  let guideLineY: SnapGuide | null = null;

  for (const c of candidateY) {
    if (Math.abs(target.y - c.pos) < minDiffY) {
      minDiffY = Math.abs(target.y - c.pos);
      chosenSnapY = c.pos;

      let gapStart: Point | undefined;
      let gapEnd: Point | undefined;
      let gapCenter: Point | undefined;

      if (c.neighbor && c.gap) {
        const midX = target.x + target.width / 2;
        if (c.isGapBottom) {
          gapStart = { x: midX, y: c.neighbor.y + c.neighbor.height };
          gapEnd = { x: midX, y: c.pos };
        } else {
          gapStart = { x: midX, y: c.pos + target.height };
          gapEnd = { x: midX, y: c.neighbor.y };
        }
        gapCenter = { x: midX, y: (gapStart.y + gapEnd.y) / 2 };
      }

      guideLineY = {
        type: 'horizontal',
        pos: c.pos,
        start: Math.min(target.x - 100, -500),
        end: Math.max(target.x + target.width + 100, 2000),
        gapText: c.gap ? `${c.gap}px` : undefined,
        gapStart,
        gapEnd,
        gapCenter,
      };
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
