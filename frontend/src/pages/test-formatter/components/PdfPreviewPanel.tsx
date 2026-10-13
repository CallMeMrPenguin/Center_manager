import React from 'react';
import { Eye, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface PdfPreviewPanelProps {
  pdfUrl: string | null;
  pdfLoading: boolean;
  pdfZoom: number;
  setPdfZoom: React.Dispatch<React.SetStateAction<number>>;
  handleGeneratePdfPreview: () => void;
  hasExercises: boolean;
}

export const PdfPreviewPanel: React.FC<PdfPreviewPanelProps> = ({
  pdfUrl,
  pdfLoading,
  pdfZoom,
  setPdfZoom,
  handleGeneratePdfPreview,
  hasExercises,
}) => {
  return (
    <section className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0d101d]">
      <div className="h-14 border-b border-slate-200 dark:border-[#202842] bg-white dark:bg-[#121629] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-indigo-600" />
          <span className="text-xs font-black text-slate-900 dark:text-white">XEM TRƯỚC BẢN IN PDF</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGeneratePdfPreview}
            disabled={pdfLoading}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={`mr-1.5 ${pdfLoading ? 'animate-spin' : ''}`} />
            <span>{pdfLoading ? 'Đang tạo PDF...' : 'Cập Nhật Xem Trước'}</span>
          </button>
          {pdfUrl && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white dark:bg-[#181a20] rounded-xl p-1 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] gap-0.5">
                <button
                  onClick={() => setPdfZoom((prev) => Math.max(prev - 10, 50))}
                  aria-label="Thu nhỏ"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer border-0"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-200 font-mono w-12 text-center select-none">
                  {pdfZoom}%
                </span>
                <button
                  onClick={() => setPdfZoom((prev) => Math.min(prev + 10, 200))}
                  aria-label="Phóng to"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer border-0"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] transition cursor-pointer text-xs font-bold"
              >
                Mở tab mới
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
        {pdfUrl ? (
          <div
            style={{ width: `${pdfZoom}%`, maxWidth: '100%', height: '100%' }}
            className="transition-all duration-200 shadow-2xl rounded-xl overflow-hidden bg-white"
          >
            <iframe src={pdfUrl} title="Bản xem trước PDF" className="w-full h-full border-0" />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <Eye size={36} className="opacity-40" />
            <p className="text-xs font-bold">Chưa có bản xem trước PDF</p>
            <button
              onClick={handleGeneratePdfPreview}
              disabled={pdfLoading || !hasExercises}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm"
            >
              Tạo bản xem trước ngay
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
