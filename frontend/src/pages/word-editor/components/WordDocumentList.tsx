import React, { useMemo, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  FileText, Plus, Copy, Trash2, Edit3, 
  FolderOpen, Clock, Tag
} from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { WordDocument } from '../../../api/wordDocumentsApi';

interface WordDocumentListProps {
  documents: WordDocument[];
  loading: boolean;
  onOpenDocument: (doc: WordDocument) => void;
  onCreateNew: () => void;
  onDuplicate: (docId: number) => void;
  onDelete: (docId: number) => void;
  onImportDocx: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WordDocumentList: React.FC<WordDocumentListProps> = ({
  documents,
  loading,
  onOpenDocument,
  onCreateNew,
  onDuplicate,
  onDelete,
  onImportDocx,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = useMemo<ColumnDef<WordDocument>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Tiêu Đề Văn Bản',
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div 
            onClick={() => onOpenDocument(doc)}
            className="flex items-center gap-3 cursor-pointer group py-1"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                {doc.title}
              </div>
              {doc.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                  {doc.description}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Danh Mục',
      cell: ({ getValue }) => {
        const cat = getValue<string>() || 'Chung';
        const colorClass =
          cat === 'Thông báo' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' :
          cat === 'Hợp đồng' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30' :
          cat === 'Báo cáo' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
          'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
            <Tag className="w-3 h-3" />
            {cat}
          </span>
        );
      },
    },
    {
      id: 'page_format',
      header: 'Khổ Giấy',
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            {doc.paper_size || 'A4'} ({doc.orientation === 'landscape' ? 'Ngang' : 'Dọc'})
          </span>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Lần Sửa Cuối',
      cell: ({ getValue }) => {
        const val = getValue<string>();
        if (!val) return <span className="text-slate-400">-</span>;
        const d = new Date(val);
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{d.toLocaleDateString('vi-VN')} {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao Tác',
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenDocument(doc)}
              className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer"
              title="Mở chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(doc.id)}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tạo bản sao"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Bạn có chắc muốn xóa văn bản "${doc.title}"?`)) {
                  onDelete(doc.id);
                }
              }}
              className="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
              title="Xóa văn bản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ], [onOpenDocument, onDuplicate, onDelete]);

  return (
    <div className="h-full w-full flex flex-col space-y-4">
      {/* 1. Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#141417] p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/25 shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">
              Soạn Thảo Văn Bản (Word)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Soạn thảo văn bản, tự động lưu, mở và tải file chuẩn .docx, in ấn và trộn thư.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={onImportDocx}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold border border-slate-200 dark:border-white/10 transition cursor-pointer shadow-sm"
          >
            <FolderOpen className="w-4 h-4 text-amber-500" />
            <span>Mở file .docx</span>
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black shadow-[0_0_15px_rgba(37,99,235,0.35)] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Văn Bản Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Main Table Card Container (Crisp boundary & Distinct from background) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-[#141417] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden p-3 sm:p-4">
        <DataTable<WordDocument>
          data={documents}
          columns={columns}
          loading={loading}
          loadingMessage="Đang tải danh sách tài liệu..."
          emptyMessage="Chưa có văn bản nào. Hãy bấm 'Tạo Văn Bản Mới' hoặc 'Mở file .docx'!"
          pageSize={20}
          searchPlaceholder="Tìm theo tên văn bản, danh mục..."
          exportFilename="danh_sach_van_ban"
        />
      </div>
    </div>
  );
};
