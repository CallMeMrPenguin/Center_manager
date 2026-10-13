export interface DocumentAttachment {
  id: number;
  document_id: number;
  filename: string;
  filepath: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  filename: string;
  filepath: string;
  folder_id: number | null;
  file_type: string;
  file_size: number;
  tags: string;
  created_at: string;
  attachments?: DocumentAttachment[];
}

export interface FolderItem {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

export interface FolderTreeNode extends FolderItem {
  children: FolderTreeNode[];
}
