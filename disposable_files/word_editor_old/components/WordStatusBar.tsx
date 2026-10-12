import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Maximize2, 
  Columns,
  Check
} from 'lucide-react';

interface WordStatusBarProps {
  wordCount: { words: number; chars: number };
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  viewMode: 'page' | 'full';
  onToggleViewMode: () => void;
}

export const WordStatusBar: React.FC<WordStatusBarProps> = ({
  wordCount,
  zoomLevel,
  onZoomChange,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <footer className="h-7 bg-[#f3f4f6] dark:bg-[#090c16] border-t border-slate-200/90 dark:border-white/10 px-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 select-none shrink-0 z-20 shadow-xs">
      {/* Left: Document info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Trang 1 / 1</span>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
          <span>{wordCount.words.toLocaleString()} từ</span>
          <span>{wordCount.chars.toLocaleString()} ký tự</span>
        </div>

        {/* Local settings indicator */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>Đã lưu cài đặt</span>
        </div>
      </div>

      {/* Right: Layout & Zoom slider */}
      <div className="flex items-center gap-3">
        {/* Toggle Page / Full view */}
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer text-xs ${
            viewMode === 'page'
              ? 'text-blue-700 dark:text-blue-400 bg-[#cde4f7] dark:bg-blue-600/20 font-bold border border-[#7fbae9]/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={viewMode === 'page' ? 'Chế độ khổ giấy A4' : 'Chế độ toàn chiều rộng'}
        >
          {viewMode === 'page' ? <Columns className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          <span className="hidden lg:inline">{viewMode === 'page' ? 'Khổ A4' : 'Toàn màn hình'}</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-white/10">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
            className="p-0.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            disabled={zoomLevel <= 50}
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="50"
            max="160"
            step="5"
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-16 sm:w-20 accent-blue-600 cursor-pointer h-1 bg-slate-300 dark:bg-white/20 rounded-lg appearance-none"
          />

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(160, zoomLevel + 10))}
            className="p-0.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            disabled={zoomLevel >= 160}
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span
            onClick={() => onZoomChange(100)}
            className="w-8 text-right font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer text-xs"
            title="Nhấn để đặt lại 100%"
          >
            {zoomLevel}%
          </span>
        </div>
      </div>
    </footer>
  );
};
