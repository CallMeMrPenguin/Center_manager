import React from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import { FolderTreeNode, FolderItem } from '../types';

interface FolderTreeProps {
  folderTree: FolderTreeNode[];
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
  expandedFolderIds: number[];
  onToggleExpand: (id: number, e: React.MouseEvent) => void;
  onOpenCreateFolder: (parentId?: string) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  dragOverFolderId: string | null;
  onDragStartFolder: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent, folderId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetFolderId: string) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folderTree,
  selectedFolderId,
  onSelectFolder,
  expandedFolderIds,
  onToggleExpand,
  onOpenCreateFolder,
  onDeleteFolder,
  dragOverFolderId,
  onDragStartFolder,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const renderTreeItem = (node: FolderTreeNode, level = 0): React.ReactNode => {
    const isExpanded = expandedFolderIds.includes(node.id);
    const isSelected = selectedFolderId === String(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isDragOver = dragOverFolderId === String(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          draggable
          onDragStart={(e) => onDragStartFolder(e, node.id)}
          onDragOver={(e) => onDragOver(e, String(node.id))}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, String(node.id))}
          className={`group relative flex items-center justify-between transition rounded-xl py-1.5 pr-2 select-none cursor-pointer text-xs ${
            isDragOver ? 'bg-blue-50 border-blue-400 border border-dashed' : ''
          } ${
            isSelected
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${level * 14 + 8}px` }}
          onClick={() => onSelectFolder(String(node.id))}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => onToggleExpand(node.id, e)}
                className={`p-0.5 rounded hover:bg-black/10 transition ${isSelected ? 'text-white' : 'text-slate-400'}`}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {isSelected ? (
              <FolderOpen size={14} className="text-white shrink-0" />
            ) : (
              <Folder size={14} className="text-blue-500 shrink-0" />
            )}

            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateFolder(String(node.id));
              }}
              className={`p-1 rounded hover:bg-black/10 transition ${isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-700'}`}
              title="Tạo thư mục con"
            >
              <Plus size={11} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(node);
              }}
              className={`p-1 rounded hover:bg-black/10 transition ${isSelected ? 'text-white' : 'text-slate-400 hover:text-red-600'}`}
              title="Xóa thư mục"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Home Button */}
      <button
        onClick={() => onSelectFolder('null')}
        onDragOver={(e) => onDragOver(e, 'null')}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, 'null')}
        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
          dragOverFolderId === 'null' ? 'bg-blue-50 border-blue-400 border border-dashed' : ''
        } ${
          selectedFolderId === 'null'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Folder size={15} className={selectedFolderId === 'null' ? 'text-white' : 'text-blue-600'} />
          <span>📁 Trang chủ (Tất cả)</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreateFolder('');
          }}
          className={`p-1 rounded hover:bg-black/10 ${selectedFolderId === 'null' ? 'text-white' : 'text-slate-400'}`}
          title="Tạo thư mục gốc"
        >
          <FolderPlus size={13} />
        </button>
      </button>

      {/* Folders List */}
      <div className="flex flex-col gap-0.5 mt-1">
        {folderTree.map((rootNode) => renderTreeItem(rootNode, 0))}
      </div>

      {/* Trash Bin */}
      <div className="pt-3 border-t border-slate-200 mt-2">
        <button
          onClick={() => onSelectFolder('__TRASH__')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedFolderId === '__TRASH__'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <Trash2 size={14} className={selectedFolderId === '__TRASH__' ? 'text-white' : 'text-rose-500'} />
          <span>Thùng Rác</span>
        </button>
      </div>
    </div>
  );
};
