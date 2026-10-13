import React from 'react';
import { Folder, Plus, Trash2 } from 'lucide-react';
import { FolderItem } from '../types';

interface SubfolderGridProps {
  subfolders: FolderItem[];
  isTrash: boolean;
  dragOverFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onRestoreFolder: (id: number) => void;
  onPermanentDeleteFolder: (id: number, name: string) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export const SubfolderGrid: React.FC<SubfolderGridProps> = ({
  subfolders,
  isTrash,
  dragOverFolderId,
  onSelectFolder,
  onRestoreFolder,
  onPermanentDeleteFolder,
  onDeleteFolder,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  if (subfolders.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thư mục con</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {subfolders.map((sub) => {
          const isDragOverThis = dragOverFolderId === String(sub.id);
          return (
            <div
              key={sub.id}
              draggable={!isTrash}
              onDragStart={(e) => onDragStart(e, sub.id)}
              onDragOver={(e) => {
                if (!isTrash) {
                  e.preventDefault();
                  onDragOver(e, String(sub.id));
                }
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => !isTrash && onDrop(e, String(sub.id))}
              onDoubleClick={() => !isTrash && onSelectFolder(String(sub.id))}
              onClick={() => !isTrash && onSelectFolder(String(sub.id))}
              className={`flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition cursor-pointer select-none group shadow-xs ${
                isDragOverThis ? 'bg-blue-50 border-blue-400 border-2 scale-102 border-dashed' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Folder size={18} className="text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{sub.name}</span>
              </div>
              {isTrash ? (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreFolder(sub.id);
                    }}
                    className="p-1 hover:bg-slate-100 text-emerald-600 rounded transition cursor-pointer"
                    title="Khôi phục"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPermanentDeleteFolder(sub.id, sub.name);
                    }}
                    className="p-1 hover:bg-slate-100 text-rose-600 rounded transition cursor-pointer"
                    title="Xóa vĩnh viễn"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(sub);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Xóa thư mục"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
