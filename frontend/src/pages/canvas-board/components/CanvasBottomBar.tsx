import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Grid, ChevronLeft, ChevronRight } from 'lucide-react';

export type GridType = 'none' | 'dots' | 'grid' | 'lines';

interface CanvasBottomBarProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onResetZoom: () => void;
  onFitDocument: () => void;
  gridType: GridType;
  setGridType: (type: GridType) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const CanvasBottomBar: React.FC<CanvasBottomBarProps> = ({
  zoom,
  setZoom,
  onResetZoom,
  onFitDocument,
  gridType,
  setGridType,
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  return (
    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 select-none">
      {/* Page Navigation for Multi-page PDF */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 bg-[#0c0f1e] border border-[#212c4b] px-3 py-1.5 rounded-xl shadow-2xl">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-mono font-bold text-white px-1">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Grid Pattern Toggle */}
      <div className="flex items-center bg-[#0c0f1e] border border-[#212c4b] p-1 rounded-xl shadow-2xl gap-0.5">
        <button
          onClick={() => setGridType(gridType === 'none' ? 'dots' : gridType === 'dots' ? 'grid' : gridType === 'grid' ? 'lines' : 'none')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
            gridType !== 'none' ? 'bg-[#5c36f5] text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title="Chuyển kiểu nền: Trơn / Lưới chấm / Ô ly / Kẻ dòng"
        >
          <Grid size={13} />
          <span className="capitalize">{gridType === 'none' ? 'Trơn' : gridType === 'dots' ? 'Chấm' : gridType === 'grid' ? 'Ô ly' : 'Dòng'}</span>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center bg-[#0c0f1e] border border-[#212c4b] p-1 rounded-xl shadow-2xl gap-1">
        <button
          onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Thu nhỏ (-)"
        >
          <ZoomOut size={14} />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer min-w-[52px] text-center"
          title="Đặt lại 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => setZoom(z => Math.min(4.0, z + 0.15))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Phóng to (+)"
        >
          <ZoomIn size={14} />
        </button>

        <button
          onClick={onFitDocument}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Vừa màn hình (Fit)"
        >
          <Maximize size={13} />
        </button>
      </div>
    </div>
  );
};
