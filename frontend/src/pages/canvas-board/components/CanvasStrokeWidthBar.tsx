import React, { useRef, memo } from 'react';
import { Upload } from 'lucide-react';

interface CanvasStrokeWidthBarProps {
  excalidrawAPI: any | null;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  isImporting: boolean;
  onImportFiles: (files: FileList | File[]) => void;
}

export const CanvasStrokeWidthBar: React.FC<CanvasStrokeWidthBarProps> = memo(({
  excalidrawAPI,
  strokeWidth,
  setStrokeWidth,
  opacity,
  setOpacity,
  isImporting,
  onImportFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStrokeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 1;
    setStrokeWidth(val);

    if (excalidrawAPI) {
      const appState = excalidrawAPI.getAppState();
      const selectedIds = appState.selectedElementIds || {};
      const hasSelection = Object.keys(selectedIds).some((id) => selectedIds[id]);

      if (hasSelection) {
        const elements = excalidrawAPI.getSceneElements().map((el: any) => {
          if (selectedIds[el.id]) {
            return { ...el, strokeWidth: val };
          }
          return el;
        });
        excalidrawAPI.updateScene({
          elements,
          appState: { currentItemStrokeWidth: val },
          commitToHistory: true,
        });
      } else {
        excalidrawAPI.updateScene({
          appState: { currentItemStrokeWidth: val },
        });
      }
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 100;
    setOpacity(val);

    if (excalidrawAPI) {
      const appState = excalidrawAPI.getAppState();
      const selectedIds = appState.selectedElementIds || {};
      const hasSelection = Object.keys(selectedIds).some((id) => selectedIds[id]);

      if (hasSelection) {
        const elements = excalidrawAPI.getSceneElements().map((el: any) => {
          if (selectedIds[el.id]) {
            return { ...el, opacity: val };
          }
          return el;
        });
        excalidrawAPI.updateScene({
          elements,
          appState: { currentItemOpacity: val },
          commitToHistory: true,
        });
      } else {
        excalidrawAPI.updateScene({
          appState: { currentItemOpacity: val },
        });
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2.5 bg-white/95 dark:bg-[#0c0f1e]/95 border border-slate-200 dark:border-[#212c4b] shadow-md px-3 py-1.5 rounded-2xl select-none">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Button: Thêm Ảnh / PDF */}
      <button
        type="button"
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-xs shadow-blue-500/25"
        title="Chọn nhiều file ảnh hoặc tài liệu PDF để chèn vào bảng vẽ"
      >
        {isImporting ? (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload size={14} className="stroke-[2.5]" />
        )}
        <span>{isImporting ? 'Đang nạp...' : 'Thêm Ảnh / PDF'}</span>
      </button>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />

      {/* Slider: Độ dày nét (Stroke width slider like opacity) */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          Độ dày nét
        </span>

        <input
          type="range"
          min="1"
          max="24"
          step="0.5"
          value={strokeWidth}
          onChange={handleStrokeChange}
          className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          title={`Độ dày nét: ${strokeWidth}px`}
        />

        <div className="flex items-center gap-1.5 min-w-[46px]">
          {/* Visual dot preview */}
          <div
            className="rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 transition-all duration-100"
            style={{
              width: `${Math.min(18, Math.max(3, strokeWidth))}px`,
              height: `${Math.min(18, Math.max(3, strokeWidth))}px`,
            }}
          />
          <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
            {strokeWidth}px
          </span>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden md:block" />

      {/* Slider: Độ mờ đục (Opacity) */}
      <div className="hidden md:flex items-center gap-2 px-1">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          Độ mờ
        </span>

        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={opacity}
          onChange={handleOpacityChange}
          className="w-20 lg:w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          title={`Độ mờ đục: ${opacity}%`}
        />

        <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[34px]">
          {opacity}%
        </span>
      </div>
    </div>
  );
});

CanvasStrokeWidthBar.displayName = 'CanvasStrokeWidthBar';
