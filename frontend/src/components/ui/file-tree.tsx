import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <motion.div
        onClick={handleClick}
        whileHover={{ x: 3 }}
        transition={{ duration: 0.15 }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={`relative flex items-center gap-2 py-1.5 pr-2.5 rounded-xl cursor-pointer font-bold transition-colors ${
          isSelected
            ? 'text-white font-black'
            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {isSelected && (
          <motion.div
            layoutId="file-tree-active-node"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute inset-0 bg-[#5c36f5] rounded-xl shadow-[0_0_14px_rgba(92,54,245,0.5)] z-0"
          />
        )}

        <div className="relative z-10 flex items-center gap-2 w-full truncate">
          {isFolder ? (
            <>
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400"
              >
                <ChevronRight size={13} />
              </motion.span>
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
            <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-1.5 py-0.2 rounded-md">
              {node.children.length}
            </span>
          )}
        </div>
      </motion.div>

      {/* Accordion Expand / Collapse with Framer Motion */}
      <AnimatePresence initial={false}>
        {isFolder && isExpanded && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden space-y-0.5"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className={`space-y-1 p-2 bg-[#0c0f1e]/98 border border-[#1e2746] rounded-2xl ${className}`}>
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
