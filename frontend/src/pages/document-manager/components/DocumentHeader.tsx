import React from 'react';
import {
  Upload,
  FolderPlus,
  Search,
  Tag,
  Trash2,
  Move,
  X,
  ChevronRight,
} from 'lucide-react';
import { FolderItem } from '../types';

interface DocumentHeaderProps {
  breadcrumbs: FolderItem[];
  activeFolderName: string;
  isTrash: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  allUniqueTags: string[];
  selectedCount: number;
  onClearSelection: () => void;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onOpenBatchMove: () => void;
  onOpenBatchTags: () => void;
  onDeleteBatch: () => void;
  onEmptyTrash?: () => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  breadcrumbs,
  activeFolderName,
  isTrash,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  allUniqueTags,
  selectedCount,
  onClearSelection,
  onOpenUpload,
  onOpenCreateFolder,
  onOpenBatchMove,
  onOpenBatchTags,
  onDeleteBatch,
  onEmptyTrash,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Top row: Title/breadcrumbs & main action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-1">
            <span>Tài liệu</span>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={12} />
                <span>{b.name}</span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {isTrash ? 'Thùng Rác' : activeFolderName || 'Tất Cả Tài Liệu'}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isTrash ? (
            <>
              <button
                onClick={onOpenCreateFolder}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <FolderPlus size={14} className="text-blue-600" />
                <span>Tạo Thư Mục</span>
              </button>

              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                <Upload size={14} />
                <span>Tải Lên</span>
              </button>
            </>
          ) : (
            onEmptyTrash && (
              <button
                onClick={onEmptyTrash}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <Trash2 size={14} />
                <span>Dọn Sạch Thùng Rác</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Second row: Search & Tag Cloud */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tài liệu theo tên, tệp tin..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition"
          />
        </div>

        {allUniqueTags.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto max-w-lg py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Nhãn:
            </span>
            {selectedTag && (
              <button
                onClick={() => onSelectTag('')}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-bold hover:bg-rose-100 transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                <span>Xóa lọc</span>
                <X size={10} />
              </button>
            )}
            {allUniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag(selectedTag === tag ? '' : tag)}
                className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Tag size={9} />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Batch Selection Action Bar */}
      {selectedCount > 0 && !isTrash && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl shadow-xs animate-slide-up">
          <span className="text-xs font-bold text-blue-800">
            Đã chọn <strong>{selectedCount}</strong> tài liệu
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBatchMove}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Move size={12} />
              <span>Di chuyển</span>
            </button>

            <button
              onClick={onOpenBatchTags}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Tag size={12} />
              <span>Gắn nhãn</span>
            </button>

            <button
              onClick={onDeleteBatch}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Xóa</span>
            </button>

            <button
              onClick={onClearSelection}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              title="Bỏ chọn"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
