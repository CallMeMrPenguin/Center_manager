import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image,
  Music,
  Video,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  children?: FileTreeNode[];
}

export interface FileTreeProps {
  data: FileTreeNode[];
  selectedId?: string;
  onSelect?: (node: FileTreeNode) => void;
  className?: string;
  defaultExpandedIds?: string[];
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'html', 'css'].includes(ext)) {
    return <FileCode size={15} className="text-amber-400 shrink-0" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet size={15} className="text-emerald-400 shrink-0" />;
  }
  if (['doc', 'docx', 'pdf', 'txt', 'md'].includes(ext)) {
    return <FileText size={15} className="text-indigo-400 shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
    return <Image size={15} className="text-cyan-400 shrink-0" />;
  }
  if (['mp3', 'wav', 'ogg'].includes(ext)) {
    return <Music size={15} className="text-purple-400 shrink-0" />;
  }
  if (['mp4', 'webm', 'mov'].includes(ext)) {
    return <Video size={15} className="text-rose-400 shrink-0" />;
  }
  return <File size={15} className="text-slate-400 shrink-0" />;
}

const FileTreeNodeItem: React.FC<{
  node: FileTreeNode;
  depth: number;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect?: (node: FileTreeNode) => void;
}> = ({ node, depth, selectedId, expandedIds, onToggleExpand, onSelect }) => {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      onToggleExpand(node.id);
    }
    onSelect?.(node);
  };

  return (
    <div className="select-none text-xs">
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex items-center gap-2 py-1.5 pr-2 rounded-xl transition cursor-pointer font-bold ${
          isSelected
            ? 'bg-[#5c36f5] text-white shadow-[0_0_12px_rgba(92,54,245,0.4)] font-black'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        {isFolder ? (
          <>
            <span className="text-slate-500 hover:text-white">
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            {isExpanded ? (
              <FolderOpen size={16} className="text-indigo-400 shrink-0" />
            ) : (
              <Folder size={16} className="text-indigo-400 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {getFileIcon(node.name)}
          </>
        )}

        <span className="truncate flex-1">{node.name}</span>

        {isFolder && node.children && (
          <span className="text-[10px] text-slate-500 font-mono">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div className="space-y-0.5 animate-in fade-in duration-150">
          {node.children.map((child) => (
            <FileTreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({
  data,
  selectedId,
  onSelect,
  className = '',
  defaultExpandedIds = [],
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds.length > 0 ? defaultExpandedIds : data.map((d) => d.id))
  );

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-0.5 p-2 bg-[#0c0f1e] border border-[#1e2746] rounded-2xl ${className}`}>
      {data.map((node) => (
        <FileTreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default FileTree;
