import React from 'react';
import { Move, X } from 'lucide-react';
import { FolderTreeNode, DocumentItem } from '../types';

interface DocumentMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  movingDoc: DocumentItem | null;
  selectedCount: number;
  folderTree: FolderTreeNode[];
  onMove: (targetFolderId: number | null) => void;
}

export const DocumentMoveModal: React.FC<DocumentMoveModalProps> = ({
  isOpen,
  onClose,
  movingDoc,
  selectedCount,
  folderTree,
  onMove,
}) => {
  if (!isOpen) return null;

  const renderFolderOptions = (nodes: FolderTreeNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <button
          onClick={() => onMove(node.id)}
          className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-semibold rounded-xl text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <span>📁 {node.name}</span>
        </button>
        {node.children && node.children.length > 0 && renderFolderOptions(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Move size={14} className="text-blue-500" />
            {movingDoc ? 'Di Chuyển Thư Mục' : 'Di Chuyển Hàng Loạt'}
          </h3>
          <button onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <p className="text-[10px] text-slate-600 leading-relaxed">
          {movingDoc ? (
            <>Chọn thư mục đích cho tài liệu <strong>{movingDoc.name}</strong>.</>
          ) : (
            <>Chọn thư mục đích cho <strong>{selectedCount}</strong> tài liệu đang chọn.</>
          )}
        </p>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => onMove(null)}
            className="w-full text-left px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold rounded-xl text-slate-700 border border-slate-200 hover:border-slate-300 transition cursor-pointer"
          >
            📁 Trang chủ
          </button>
          {renderFolderOptions(folderTree)}
        </div>
      </div>
    </div>
  );
};
