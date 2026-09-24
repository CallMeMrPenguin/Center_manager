import React from 'react';
import { 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Maximize2, 
  Columns
} from 'lucide-react';
import { SaveStatus } from '../types';

interface WordStatusBarProps {
  wordCount: { words: number; chars: number };
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  viewMode: 'page' | 'full';
  onToggleViewMode: () => void;
  onSaveNow: () => void;
}

export const WordStatusBar: React.FC<WordStatusBarProps> = ({
  wordCount,
  saveStatus,
  lastSavedAt,
  zoomLevel,
  onZoomChange,
  viewMode,
  onToggleViewMode,
  onSaveNow,
}) => {
  const formatTime = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <footer className="h-8 bg-white dark:bg-[#090c16] border-t border-slate-200 dark:border-white/10 px-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 select-none shrink-0 z-20 shadow-xs">
      {/* Left: Document info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Trang 1 / 1</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
          <span>{wordCount.words.toLocaleString()} từ</span>
          <span>{wordCount.chars.toLocaleString()} ký tự</span>
        </div>

        {/* Save indicator */}
        <button
          onClick={onSaveNow}
          title="Bấm để lưu ngay (Ctrl+S)"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Đã lưu {lastSavedAt ? `(${formatTime(lastSavedAt)})` : ''}</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
              <span>Đang lưu...</span>
            </span>
          )}
          {saveStatus === 'dirty' && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Chưa lưu</span>
            </span>
          )}
          {saveStatus === 'offline' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium" title="Đã lưu tạm trên máy, sẽ đồng bộ khi có mạng">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Lưu tạm máy</span>
            </span>
          )}
        </button>
      </div>

      {/* Right: Layout & Zoom slider */}
      <div className="flex items-center gap-3">
        {/* Toggle Page / Full view */}
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
            viewMode === 'page'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={viewMode === 'page' ? 'Chế độ khổ giấy A4' : 'Chế độ toàn chiều rộng'}
        >
          {viewMode === 'page' ? <Columns className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{viewMode === 'page' ? 'Khổ A4' : 'Toàn màn hình'}</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
          <button
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
            className="p-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
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
            className="w-16 sm:w-20 accent-blue-600 cursor-pointer h-1 bg-slate-200 dark:bg-white/20 rounded-lg appearance-none"
          />

          <button
            onClick={() => onZoomChange(Math.min(160, zoomLevel + 10))}
            className="p-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            disabled={zoomLevel >= 160}
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span
            onClick={() => onZoomChange(100)}
            className="w-9 text-right font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Nhấn để đặt lại 100%"
          >
            {zoomLevel}%
          </span>
        </div>
      </div>
    </footer>
  );
};
