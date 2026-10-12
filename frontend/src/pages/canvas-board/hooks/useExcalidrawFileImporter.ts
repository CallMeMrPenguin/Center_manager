import { useCallback, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { showToast } from '../../../components/Toast';

// Configure pdfjs worker URL for Vite
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface ImagePayload {
  dataURL: string;
  width: number;
  height: number;
  name: string;
}

function createImageElement(opts: {
  fileId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return {
    type: 'image',
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    fileId: opts.fileId,
    status: 'saved',
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    scale: [1, 1],
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: null,
    roughness: 0,
    opacity: 100,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
  };
}

export function useExcalidrawFileImporter(excalidrawAPI: any | null) {
  const [isImporting, setIsImporting] = useState(false);

  const processAndImportFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!excalidrawAPI) {
        showToast('Bảng vẽ chưa sẵn sàng', 'error');
        return;
      }

      const rawFiles = Array.from(fileList || []);
      const validFiles = rawFiles.filter(
        (f) =>
          f.type.startsWith('image/') ||
          f.type === 'application/pdf' ||
          /\.(png|jpe?g|webp|svg|gif|bmp|pdf)$/i.test(f.name)
      );

      if (validFiles.length === 0) {
        showToast('Vui lòng chọn tệp ảnh hoặc PDF hợp lệ', 'error');
        return;
      }

      setIsImporting(true);
      showToast(`Đang nạp ${validFiles.length} tệp ảnh / PDF...`, 'info');

      try {
        const extractedItems: ImagePayload[] = [];

        for (const file of validFiles) {
          const isPdf =
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

          if (isPdf) {
            try {
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              const totalPages = pdf.numPages;

              for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 }); // 2x crisp resolution

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = viewport.width;
                offscreenCanvas.height = viewport.height;
                const ctx = offscreenCanvas.getContext('2d');

                if (ctx) {
                  // Solid white background for transparent PDF pages
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, viewport.width, viewport.height);

                  await (page.render as any)({
                    canvasContext: ctx,
                    viewport,
                    canvas: offscreenCanvas,
                  }).promise;

                  const dataURL = offscreenCanvas.toDataURL('image/png', 0.95);
                  extractedItems.push({
                    dataURL,
                    width: viewport.width,
                    height: viewport.height,
                    name: `${file.name} (Trang ${pageNum}/${totalPages})`,
                  });
                }
              }
            } catch (pdfErr: any) {
              console.error('Lỗi phân tích PDF:', pdfErr);
              showToast(`Lỗi đọc tệp ${file.name}: ${pdfErr?.message || 'Không thể mở'}`, 'error');
            }
          } else {
            // Process Image
            try {
              const dataURL = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Lỗi đọc ảnh'));
                reader.readAsDataURL(file);
              });

              const img = new Image();
              await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = dataURL;
              });

              extractedItems.push({
                dataURL,
                width: img.naturalWidth || 600,
                height: img.naturalHeight || 400,
                name: file.name,
              });
            } catch (imgErr) {
              console.error('Lỗi phân tích ảnh:', imgErr);
            }
          }
        }

        if (extractedItems.length === 0) {
          showToast('Không trích xuất được ảnh nào từ các tệp đã chọn', 'error');
          setIsImporting(false);
          return;
        }

        // Calculate layout coordinates
        const appState = excalidrawAPI.getAppState();
        const zoom = appState.zoom?.value || 1;
        const centerX = -appState.scrollX + appState.width / (2 * zoom);
        const centerY = -appState.scrollY + appState.height / (2 * zoom);

        const targetW = 560; // Max render width
        const gap = 32;

        const isVerticalStack = extractedItems.length <= 4;
        const cols = isVerticalStack ? 1 : 2;

        const binaryFiles: any[] = [];
        const newElements: any[] = [];

        let currentY = centerY - 200;

        extractedItems.forEach((item, idx) => {
          const ratio = item.width > 0 ? item.height / item.width : 0.75;
          const renderW = Math.min(targetW, item.width);
          const renderH = renderW * ratio;

          let posX: number;
          let posY: number;

          if (isVerticalStack) {
            posX = centerX - renderW / 2;
            posY = currentY;
            currentY += renderH + gap;
          } else {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const totalW = cols * renderW + (cols - 1) * gap;
            posX = centerX - totalW / 2 + col * (renderW + gap);
            posY = centerY - 150 + row * (renderH + gap);
          }

          const fileId = `file_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;

          binaryFiles.push({
            id: fileId,
            dataURL: item.dataURL,
            mimeType: 'image/png',
            created: Date.now(),
          });

          const elem = createImageElement({
            fileId,
            x: posX,
            y: posY,
            width: renderW,
            height: renderH,
          });

          newElements.push(elem);
        });

        // 1. Add binary file payloads to Excalidraw cache
        excalidrawAPI.addFiles(binaryFiles);

        // 2. Add image elements to scene
        const existing = excalidrawAPI.getSceneElements();
        excalidrawAPI.updateScene({
          elements: [...existing, ...newElements],
          commitToHistory: true,
        });

        // 3. Pan and focus newly added elements
        setTimeout(() => {
          try {
            excalidrawAPI.scrollToContent(newElements, { fitToViewport: true });
          } catch {
            // Ignore viewport scroll exceptions
          }
        }, 100);

        showToast(
          `Đã nhập thành công ${newElements.length} ảnh / trang PDF vào bảng vẽ!`,
          'success'
        );
      } catch (err: any) {
        console.error('Lỗi nhập tệp vào Canvas:', err);
        showToast('Lỗi nhập tệp: ' + (err?.message || 'Vui lòng thử lại'), 'error');
      } finally {
        setIsImporting(false);
      }
    },
    [excalidrawAPI]
  );

  return {
    isImporting,
    processAndImportFiles,
  };
}
