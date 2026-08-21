import { Point, CanvasItemImage, SnapGuide, CropBox } from '../types';

export type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'inside' | 'none';

/**
 * Checks if a point is inside an image or its corner resize handles.
 */
export function hitTestImage(
  pt: Point,
  image: CanvasItemImage,
  handleSize = 10
): { hit: boolean; handle: HandleType } {
  const { x, y, width, height } = image;
  const hs = handleSize;

  // Corner handle checks
  if (Math.abs(pt.x - x) <= hs && Math.abs(pt.y - y) <= hs) return { hit: true, handle: 'tl' };
  if (Math.abs(pt.x - (x + width)) <= hs && Math.abs(pt.y - y) <= hs) return { hit: true, handle: 'tr' };
  if (Math.abs(pt.x - x) <= hs && Math.abs(pt.y - (y + height)) <= hs) return { hit: true, handle: 'bl' };
  if (Math.abs(pt.x - (x + width)) <= hs && Math.abs(pt.y - (y + height)) <= hs) return { hit: true, handle: 'br' };

  // Inside body
  if (pt.x >= x && pt.x <= x + width && pt.y >= y && pt.y <= y + height) {
    return { hit: true, handle: 'inside' };
  }

  return { hit: false, handle: 'none' };
}

/**
 * Auto-Alignment & Equal Spacing Snapping Engine
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

  // Candidate alignment lines
  const candidateX: { pos: number; type: string }[] = [{ pos: 50, type: 'start' }];
  const candidateY: { pos: number; type: string }[] = [{ pos: 50, type: 'start' }];

  for (const item of otherItems) {
    candidateX.push(
      { pos: item.x, type: 'left' },
      { pos: item.x + item.width / 2, type: 'center' },
      { pos: item.x + item.width, type: 'right' }
    );
    candidateY.push(
      { pos: item.y, type: 'top' },
      { pos: item.y + item.height / 2, type: 'middle' },
      { pos: item.y + item.height, type: 'bottom' }
    );
  }

  // Equal Spacing / Gap calculation (Horizontal gaps between elements)
  if (otherItems.length >= 1) {
    for (const item of otherItems) {
      // Standard gap of 30px between cards
      const rightSnap = item.x + item.width + 30;
      const leftSnap = item.x - target.width - 30;
      candidateX.push({ pos: rightSnap, type: 'gap-right' });
      candidateX.push({ pos: leftSnap + target.width, type: 'gap-left' });
    }
  }

  // Snap X
  let minDiffX = snapThreshold + 1;
  let chosenSnapX: number | null = null;
  let guideLineX: number | null = null;

  for (const c of candidateX) {
    if (Math.abs(target.x - c.pos) < minDiffX) {
      minDiffX = Math.abs(target.x - c.pos);
      chosenSnapX = c.pos;
      guideLineX = c.pos;
    }
    if (Math.abs(targetCenterX - c.pos) < minDiffX) {
      minDiffX = Math.abs(targetCenterX - c.pos);
      chosenSnapX = c.pos - target.width / 2;
      guideLineX = c.pos;
    }
    if (Math.abs(targetRight - c.pos) < minDiffX) {
      minDiffX = Math.abs(targetRight - c.pos);
      chosenSnapX = c.pos - target.width;
      guideLineX = c.pos;
    }
  }

  if (chosenSnapX !== null && minDiffX <= snapThreshold) {
    snappedX = chosenSnapX;
    if (guideLineX !== null) {
      guides.push({
        type: 'vertical',
        pos: guideLineX,
        start: Math.min(target.y - 150, -500),
        end: Math.max(target.y + target.height + 150, 2000),
      });
    }
  }

  // Snap Y
  let minDiffY = snapThreshold + 1;
  let chosenSnapY: number | null = null;
  let guideLineY: number | null = null;

  for (const c of candidateY) {
    if (Math.abs(target.y - c.pos) < minDiffY) {
      minDiffY = Math.abs(target.y - c.pos);
      chosenSnapY = c.pos;
      guideLineY = c.pos;
    }
    if (Math.abs(targetCenterY - c.pos) < minDiffY) {
      minDiffY = Math.abs(targetCenterY - c.pos);
      chosenSnapY = c.pos - target.height / 2;
      guideLineY = c.pos;
    }
    if (Math.abs(targetBottom - c.pos) < minDiffY) {
      minDiffY = Math.abs(targetBottom - c.pos);
      chosenSnapY = c.pos - target.height;
      guideLineY = c.pos;
    }
  }

  if (chosenSnapY !== null && minDiffY <= snapThreshold) {
    snappedY = chosenSnapY;
    if (guideLineY !== null) {
      guides.push({
        type: 'horizontal',
        pos: guideLineY,
        start: Math.min(target.x - 150, -500),
        end: Math.max(target.x + target.width + 150, 2000),
      });
    }
  }

  return { snappedX, snappedY, guides };
}

/**
 * Crops a selected region of an image and returns a new cropped HTMLImageElement.
 */
export async function cropImageItem(
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
    ctx.drawImage(
      imageItem.img,
      srcX, srcY, srcW, srcH,
      0, 0, offscreen.width, offscreen.height
    );
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
