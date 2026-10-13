import React from 'react';
import { Tag, Download, ExternalLink, Trash2, Plus } from 'lucide-react';
import { DocumentItem } from '../types';
import { api } from '../../../api';
import { getFileIcon, formatBytes } from './docHelpers';

interface DocumentCardProps {
  doc: DocumentItem;
  isSelected: boolean;
  isTrash: boolean;
  onToggleSelect: (id: number) => void;
  onOpenFileNative: (filepath: string) => void;
  onOpenAttachments: (doc: DocumentItem) => void;
  onEditTags: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onRestore?: (id: number) => void;
  onPermanentDelete?: (id: number, name: string) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  isSelected,
  isTrash,
  onToggleSelect,
  onOpenFileNative,
  onOpenAttachments,
  onEditTags,
  onDelete,
  onRestore,
  onPermanentDelete,
  onDragStart,
}) => {
  return (
    <div
      draggable={!isTrash}
      onDragStart={(e) => onDragStart && onDragStart(e, doc.id)}
      className={`flex flex-col justify-between border rounded-2xl p-4 transition shadow-xs hover:shadow-md relative group ${
        isTrash ? '' : 'cursor-grab active:cursor-grabbing'
      } ${
        isSelected
          ? 'bg-blue-50 border-blue-500'
          : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
      }`}
    >
      {!isTrash && (
        <button
          type="button"
          onClick={() => onToggleSelect(doc.id)}
          className={`absolute top-3.5 right-3.5 p-1 rounded-lg border transition-all cursor-pointer z-10 ${
            isSelected
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-white border-slate-300 text-transparent hover:text-slate-600 hover:border-slate-400'
          }`}
        >
          <Plus size={10} className={isSelected ? '' : 'opacity-0'} />
        </button>
      )}

      <div className="flex items-start gap-3 pr-6">
        <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
          {getFileIcon(doc.file_type)}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            onClick={() => !isTrash && onOpenFileNative(doc.filepath)}
            className={`text-xs font-bold truncate ${
              isTrash
                ? 'text-slate-500'
                : 'text-slate-900 hover:text-blue-600 transition cursor-pointer'
            }`}
            title={isTrash ? doc.name : 'Nhấp để mở tệp tin'}
          >
            {doc.name}
          </h4>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">
            {doc.filename}
          </p>

          <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-500 font-semibold">
            <span>{formatBytes(doc.file_size)}</span>
            <span className="text-slate-300">•</span>
            <span>{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {doc.tags && (
        <div className="flex flex-wrap gap-1 mt-3">
          {doc.tags.split(',').map((tag) => (
            <span
              key={tag}
              className="bg-slate-100 text-slate-700 border border-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
            >
              <Tag size={6} />
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4">
        {isTrash ? (
          <div className="flex gap-2 w-full justify-between animate-scale-up">
            <button
              onClick={() => onRestore && onRestore(doc.id)}
              className="px-3.5 py-2 bg-green-50 hover:bg-green-100 text-[10px] text-green-700 font-bold rounded-xl border border-green-300 transition cursor-pointer"
            >
              Khôi phục
            </button>
            <button
              onClick={() => onPermanentDelete && onPermanentDelete(doc.id, doc.name)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-[10px] text-red-700 font-bold rounded-xl border border-red-300 transition cursor-pointer"
            >
              Xóa vĩnh viễn
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1.5">
              <a
                href={api.downloadDocumentUrl(doc.id)}
                download={doc.filename}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl transition cursor-pointer"
                title="Tải tệp tin về máy"
              >
                <Download size={12} />
              </a>
              <button
                onClick={() => onOpenFileNative(doc.filepath)}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl transition cursor-pointer"
                title="Mở trực tiếp trên máy tính"
              >
                <ExternalLink size={12} />
              </button>

              <button
                onClick={() => onOpenAttachments(doc)}
                className={`px-2.5 py-1.5 text-[9px] font-bold rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                  doc.attachments && doc.attachments.length > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900'
                }`}
                title="Quản lý tệp đính kèm"
              >
                {doc.attachments && doc.attachments.length > 0
                  ? `Đã đính kèm (${doc.attachments.length})`
                  : 'Đính kèm'}
              </button>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => onEditTags(doc)}
                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition cursor-pointer"
                title="Sửa nhãn dán"
              >
                <Tag size={12} />
              </button>

              <button
                onClick={() => onDelete(doc)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-xl transition cursor-pointer"
                title="Xóa tệp"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
