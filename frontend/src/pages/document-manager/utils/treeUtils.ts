import { FolderItem, FolderTreeNode } from '../types';
import { SelectOption } from '../../../components/CustomSelect';

export function buildFolderTree(folders: FolderItem[]): FolderTreeNode[] {
  const map: Record<number, FolderTreeNode> = {};
  const roots: FolderTreeNode[] = [];

  folders.forEach((f) => {
    map[f.id] = { ...f, children: [] };
  });

  folders.forEach((f) => {
    const node = map[f.id];
    if (node.parent_id !== null && map[node.parent_id]) {
      map[node.parent_id].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function getFolderSelectOptions(nodes: FolderTreeNode[], depth = 0): SelectOption[] {
  return [
    ...(depth === 0 ? [{ value: '', label: 'Trang chủ (Không có cha)' }] : []),
    ...nodes.flatMap((node) => [
      {
        value: String(node.id),
        label: `${'\u00A0\u00A0'.repeat(depth)}📁 ${node.name}`,
      },
      ...getFolderSelectOptions(node.children, depth + 1),
    ]),
  ];
}

export function getBreadcrumbsPath(folders: FolderItem[], selectedFolderId: string): FolderItem[] {
  if (selectedFolderId === 'null' || selectedFolderId === '__TRASH__') return [];
  const path: FolderItem[] = [];
  let current = folders.find((f) => String(f.id) === selectedFolderId);
  while (current) {
    path.unshift(current);
    const parentId = current.parent_id;
    current = parentId !== null ? folders.find((f) => f.id === parentId) : undefined;
  }
  return path;
}
