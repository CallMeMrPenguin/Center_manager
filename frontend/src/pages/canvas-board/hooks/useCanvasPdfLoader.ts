import { useEffect } from 'react';
import { CanvasItemImage, Point } from '../types';

interface UseCanvasPdfLoaderProps {
  pdfDoc: any;
  currentPage: number;
  getViewportCenterWorld: () => Point;
  setCanvasImages: React.Dispatch<React.SetStateAction<CanvasItemImage[]>>;
  setSelectedId: (id: string | null) => void;
  setSelectedType: (type: 'image' | 'text' | null) => void;
}

export function useCanvasPdfLoader({
  pdfDoc,
  currentPage,
  getViewportCenterWorld,
  setCanvasImages,
  setSelectedId,
  setSelectedType,
}: UseCanvasPdfLoaderProps) {
  useEffect(() => {
    if (!pdfDoc) return;
    let isCancelled = false;
    pdfDoc.getPage(currentPage).then(async (page: any) => {
      const viewport = page.getViewport({ scale: 2.0 });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!isCancelled) {
          const img = new Image();
          img.onload = () => {
            const center = getViewportCenterWorld();
            const w = viewport.width / 2;
            const h = viewport.height / 2;
            const newImgItem: CanvasItemImage = {
              id: 'pdf_page_' + currentPage,
              img,
              x: center.x - w / 2,
              y: center.y - h / 2,
              width: w,
              height: h,
            };
            setCanvasImages([newImgItem]);
            setSelectedId(newImgItem.id);
            setSelectedType('image');
          };
          img.src = tempCanvas.toDataURL('image/png');
        }
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, getViewportCenterWorld, setCanvasImages, setSelectedId, setSelectedType]);
}
