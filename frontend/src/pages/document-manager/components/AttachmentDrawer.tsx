import React from 'react';
import { Upload, X, Plus, Info, Play, Eye, Download, Trash2 } from 'lucide-react';
import { DocumentItem, DocumentAttachment } from '../types';
import { api } from '../../../api';

interface AttachmentDrawerProps {
  document: DocumentItem | null;
  onClose: () => void;
  attachmentFile: File | null;
  onSetAttachmentFile: (file: File | null) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (att: DocumentAttachment) => void;
  onOpenNative: (filepath: string) => void;
  onPlayMedia: (url: string, type: 'audio' | 'video', name: string) => void;
  formatBytes: (bytes: number) => string;
  getFileIcon: (fileType: string) => React.ReactNode;
}

export const AttachmentDrawer: React.FC<AttachmentDrawerProps> = ({
  document,
  onClose,
  attachmentFile,
  onSetAttachmentFile,
  onUploadAttachment,
  onDeleteAttachment,
  onOpenNative,
  onPlayMedia,
  formatBytes,
  getFileIcon,
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose}></div>

      <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between z-10">
        <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 pr-6 line-clamp-2">{document.name}</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                Tệp gốc: {document.filename}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Upload size={12} className="text-blue-500" />
              Đính Kèm Tệp Mới
            </h4>

            <div className="flex flex-col gap-3">
              <input
                type="file"
                id="attachment-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onSetAttachmentFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="attachment-file-input"
                className="w-full py-4 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-white hover:bg-blue-50/50 transition"
              >
                <Plus size={16} className="text-slate-400" />
                <span className="text-[10px] text-slate-600 font-bold">
                  {attachmentFile ? attachmentFile.name : 'Chọn tệp MP3, MP4, PDF, Đáp án...'}
                </span>
              </label>

              {attachmentFile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onSetAttachmentFile(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={onUploadAttachment}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-[10px] text-white font-extrabold rounded-lg transition cursor-pointer"
                  >
                    Tải lên
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              Danh sách đính kèm
            </h4>

            {!document.attachments || document.attachments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <Info size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-[10px]">Chưa có tệp đính kèm nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {document.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 group/item"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-slate-100 rounded-lg">{getFileIcon(att.file_type)}</div>
                      <div className="min-w-0">
                        <span
                          onClick={() => onOpenNative(att.filepath)}
                          className="text-[10px] font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate block"
                          title={att.filename}
                        >
                          {att.filename}
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {formatBytes(att.file_size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {['mp3', 'wav', 'ogg', 'mp4', 'mov'].includes(att.file_type.toLowerCase()) && (
                        <button
                          onClick={() => {
                            const downloadUrl = api.downloadAttachmentUrl(att.id);
                            const isAudio = ['mp3', 'wav', 'ogg'].includes(att.file_type.toLowerCase());
                            onPlayMedia(downloadUrl, isAudio ? 'audio' : 'video', att.filename);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition cursor-pointer"
                          title="Phát trực tiếp"
                        >
                          <Play size={10} />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenNative(att.filepath)}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                        title="Xem nhanh tệp tin"
                      >
                        <Eye size={10} />
                      </button>

                      <a
                        href={api.downloadAttachmentUrl(att.id)}
                        download={att.filename}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                        title="Tải đính kèm"
                      >
                        <Download size={10} />
                      </a>

                      <button
                        onClick={() => onDeleteAttachment(att)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Xóa đính kèm"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
