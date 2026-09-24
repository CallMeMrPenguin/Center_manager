import React, { useMemo, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  FileText, Plus, Copy, Trash2, Edit3, 
  Download, FolderOpen, Sparkles, Clock, Tag
} from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { WordDocument } from '../../../api/wordDocumentsApi';
import { BUILTIN_TEMPLATES } from '../templates';

interface WordDocumentListProps {
  documents: WordDocument[];
  loading: boolean;
  onOpenDocument: (doc: WordDocument) => void;
  onCreateNew: () => void;
  onCreateFromTemplate: (templateHtml: string, title: string, category: string) => void;
  onDuplicate: (docId: number) => void;
  onDelete: (docId: number) => void;
  onImportDocx: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WordDocumentList: React.FC<WordDocumentListProps> = ({
  documents,
  loading,
  onOpenDocument,
  onCreateNew,
  onCreateFromTemplate,
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
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                {doc.title}
              </div>
              {doc.description && (
                <div className="text-xs text-slate-400 truncate max-w-sm">
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
          cat === 'Thông báo' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
          cat === 'Hợp đồng' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
          cat === 'Báo cáo' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
          'bg-blue-500/10 text-blue-300 border-blue-500/30';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
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
          <span className="text-xs text-slate-300">
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
        if (!val) return <span className="text-slate-500">-</span>;
        const d = new Date(val);
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
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
              className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer"
              title="Mở chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(doc.id)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
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
    <div className="space-y-6">
      {/* 1. Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0c0f1e] p-4 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Soạn Thảo Văn Bản (Word)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Soạn thảo theo chuẩn MS Word, tự động lưu, xuất file .docx, in ấn và trộn thư thông minh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={onImportDocx}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#121626] hover:bg-[#1a2035] text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Mở file .docx</span>
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5c36f5] hover:bg-[#4d2ee0] text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-[#5c36f5]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Văn Bản Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Templates Cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Mẫu Văn Bản Tiêu Chuẩn Cho Trung Tâm
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BUILTIN_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => onCreateFromTemplate(tpl.content_html, tpl.title, tpl.category)}
              className="bg-[#0c0f1e] hover:bg-[#121626] border border-white/10 hover:border-purple-500/40 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                    {tpl.title}
                  </span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-medium">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {tpl.description}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center text-[11px] text-purple-300 font-semibold gap-1">
                <span>Dùng mẫu này</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Mandatory TanStack DataTable */}
      <div>
        <DataTable<WordDocument>
          data={documents}
          columns={columns}
          loading={loading}
          loadingMessage="Đang tải danh sách tài liệu..."
          emptyMessage="Chưa có văn bản nào. Hãy bấm 'Tạo Văn Bản Mới' hoặc chọn một mẫu ở trên!"
          pageSize={20}
          searchPlaceholder="Tìm theo tên văn bản, danh mục..."
          exportFilename="danh_sach_van_ban"
        />
      </div>
    </div>
  );
};
