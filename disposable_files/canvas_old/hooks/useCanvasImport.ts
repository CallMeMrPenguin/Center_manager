import { useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { showToast } from '../../../components/Toast';
import { CanvasItemImage, Point, CanvasTool } from '../types';

interface UseCanvasImportProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  pan: Point;
  zoom: number;
  canvasImages: CanvasItemImage[];
  setCanvasImages: React.Dispatch<React.SetStateAction<CanvasItemImage[]>>;
  setSelectedId: (id: string | null) => void;
  setSelectedType: (type: 'image' | 'text' | null) => void;
  setActiveTool: (tool: CanvasTool) => void;
  setPdfDoc: (doc: any) => void;
  setTotalPages: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setDocName: (name: string) => void;
  pushHistorySnapshot: () => void;
}

export function useCanvasImport({
  containerRef,
  canvasRef,
  pan,
  zoom,
  setCanvasImages,
  setSelectedId,
  setSelectedType,
  setActiveTool,
  setPdfDoc,
  setTotalPages,
  setCurrentPage,
  setDocName,
  pushHistorySnapshot,
}: UseCanvasImportProps) {
  // Helper to calculate world coordinates of viewport center
  const getViewportCenterWorld = useCallback((): Point => {
    const container = containerRef.current;
    const rect = container ? container.getBoundingClientRect() : { width: 1200, height: 800 };
    return {
      x: (rect.width / 2 - pan.x) / zoom,
      y: (rect.height / 2 - pan.y) / zoom,
    };
  }, [containerRef, pan, zoom]);

  const importFiles = useCallback(
    async (files: File[], customTargetPos?: Point) => {
      if (!files || files.length === 0) return;

      pushHistorySnapshot();
      const newItems: CanvasItemImage[] = [];
      const imageFiles: File[] = [];

      for (const file of files) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setPdfDoc(loadedPdf);
            setTotalPages(loadedPdf.numPages);
            setCurrentPage(1);
            setDocName(file.name);
            showToast(`Đã mở PDF: ${file.name} (${loadedPdf.numPages} trang)`, 'success');
          } catch (err: any) {
            showToast('Lỗi mở PDF: ' + (err?.message || 'Không thể đọc tệp PDF'), 'error');
          }
        } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(file.name)) {
          imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) return;

      // Determine center position for the imported batch
      const center = customTargetPos || getViewportCenterWorld();
      const cols = Math.min(imageFiles.length, 3);
      const cellW = 320;
      const gap = 24;

      for (let idx = 0; idx < imageFiles.length; idx++) {
        const file = imageFiles[idx];
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          let resolved = false;
          const safeResolve = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) {
              safeResolve();
              return;
            }
            const img = new Image();
            img.onload = () => {
              const imgW = Math.min(cellW, img.width || cellW);
              const imgH = (imgW / (img.width || 1)) * (img.height || 1);

              let posX = center.x - imgW / 2;
              let posY = center.y - imgH / 2;

              if (imageFiles.length > 1) {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const totalGridW = cols * cellW + (cols - 1) * gap;
                const gridStartX = center.x - totalGridW / 2;
                posX = gridStartX + col * (cellW + gap);
                posY = center.y - 120 + row * (imgH + gap);
              }

              newItems.push({
                id: 'img_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
                img,
                x: posX,
                y: posY,
                width: imgW,
                height: imgH,
                originalSrc: dataUrl,
              });
              safeResolve();
            };
            img.onerror = () => safeResolve();
            img.src = dataUrl;
          };
          reader.onerror = () => safeResolve();
          reader.readAsDataURL(file);

          // Safety timeout fallback (3 seconds)
          setTimeout(safeResolve, 3000);
        });
      }

      if (newItems.length > 0) {
        setCanvasImages((prev) => [...prev, ...newItems]);
        const lastItem = newItems[newItems.length - 1];
        setSelectedId(lastItem.id);
        setSelectedType('image');
        setActiveTool('select');
        showToast(
          newItems.length === 1 ? 'Đã thêm ảnh vào vị trí hiện tại!' : `Đã thêm ${newItems.length} ảnh vào bảng vẽ!`,
          'success'
        );
      }
    },
    [
      pushHistorySnapshot,
      getViewportCenterWorld,
      setPdfDoc,
      setTotalPages,
      setCurrentPage,
      setDocName,
      setCanvasImages,
      setSelectedId,
      setSelectedType,
      setActiveTool,
    ]
  );

  // File input change handler (always resets value to allow re-importing same file)
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      // Reset input immediately so clicking the same file again triggers onChange
      e.target.value = '';
      if (files.length > 0) {
        importFiles(files);
      }
    },
    [importFiles]
  );

  // Native Clipboard Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        importFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [importFiles]);

  return {
    importFiles,
    handleFileInputChange,
    getViewportCenterWorld,
  };
}
