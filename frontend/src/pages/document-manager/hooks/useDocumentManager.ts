import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';
import { useConfirm } from '../../../components/ConfirmDialog';
import { showToast } from '../../../components/Toast';
import { DocumentItem, FolderItem, DocumentAttachment } from '../types';
import { buildFolderTree, getFolderSelectOptions, getBreadcrumbsPath } from '../utils/treeUtils';
import { useDocumentTrash } from './useDocumentTrash';
import { useDocumentBatchOps } from './useDocumentBatchOps';

export function useDocumentManager() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('null');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<number[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string>('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string>('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);

  const [activeDocForAttachments, setActiveDocForAttachments] = useState<DocumentItem | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [movingDoc, setMovingDoc] = useState<DocumentItem | null>(null);
  const [editingTagsDoc, setEditingTagsDoc] = useState<DocumentItem | null>(null);
  const [tempTags, setTempTags] = useState<string[]>([]);

  const [activeMediaPlayer, setActiveMediaPlayer] = useState<{ url: string; type: 'audio' | 'video'; name: string } | null>(null);

  const isTrash = selectedFolderId === '__TRASH__';

  const trash = useDocumentTrash();

  const fetchFolders = async () => {
    try {
      const res = await api.getDocumentFolders();
      if (res.success) setFolders(res.folders);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments({
        folder_id: selectedFolderId === 'null' ? '' : selectedFolderId,
        tag: selectedTag || undefined,
        search: searchQuery || undefined,
      });
      if (res.success) setDocuments(res.documents);
    } catch (err: any) {
      showToast('Không thể tải danh sách tài liệu: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const batch = useDocumentBatchOps(selectedDocIds, setSelectedDocIds, setLoading, fetchDocuments);

  useEffect(() => {
    if (isTrash) {
      trash.fetchTrash(setDocuments, setLoading);
    } else {
      fetchFolders();
      fetchDocuments();
    }
    setSelectedDocIds([]);
  }, [selectedFolderId, selectedTag, searchQuery]);

  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);
  const folderSelectOptions = useMemo(() => getFolderSelectOptions(folderTree), [folderTree]);
  const breadcrumbs = useMemo(() => getBreadcrumbsPath(folders, selectedFolderId), [folders, selectedFolderId]);
  const activeFolder = folders.find((f) => String(f.id) === selectedFolderId);

  const visibleSubfolders = useMemo(() => {
    if (isTrash) return trash.trashFolders;
    const activeId = selectedFolderId === 'null' ? null : parseInt(selectedFolderId, 10);
    return folders.filter((f) => f.parent_id === activeId);
  }, [folders, selectedFolderId, trash.trashFolders, isTrash]);

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    documents.forEach((doc) => {
      if (doc.tags) {
        doc.tags.split(',').forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet);
  }, [documents]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return showToast('Vui lòng nhập tên thư mục', 'warning');
    try {
      const parentIdNum = newFolderParentId ? parseInt(newFolderParentId, 10) : undefined;
      const res = await api.createDocumentFolder(newFolderName.trim(), parentIdNum);
      if (res.success) {
        showToast(`Đã tạo thư mục "${newFolderName}"`, 'success');
        setNewFolderName('');
        setShowFolderModal(false);
        fetchFolders();
      }
    } catch (err: any) {
      showToast('Tạo thư mục thất bại: ' + (err.message || err), 'error');
    }
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    const isConfirmed = await confirm({
      title: 'Xóa thư mục',
      message: `Bạn có chắc chắn muốn xóa thư mục "${folder.name}"? Các tài liệu và thư mục con bên trong sẽ được đưa ra cấp cha.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    });
    if (!isConfirmed) return;
    try {
      const res = await api.deleteDocumentFolder(folder.id);
      if (res.success) {
        showToast('Đã xóa thư mục', 'success');
        if (selectedFolderId === String(folder.id)) {
          setSelectedFolderId(folder.parent_id ? String(folder.parent_id) : 'null');
        }
        fetchFolders();
        fetchDocuments();
      }
    } catch (err: any) {
      showToast('Không thể xóa thư mục: ' + (err.message || err), 'error');
    }
  };

  const handleUploadDocuments = async () => {
    if (uploadFiles.length === 0) return showToast('Vui lòng chọn ít nhất một tệp tin', 'warning');
    setLoading(true);
    try {
      const tagsStr = uploadTags.join(',');
      await Promise.all(
        uploadFiles.map((file) => api.uploadDocument(file, uploadFolderId || undefined, tagsStr || undefined))
      );
      showToast(`Đã tải lên thành công ${uploadFiles.length} tài liệu!`, 'success');
      setUploadFiles([]);
      setUploadTags([]);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err: any) {
      showToast('Tải lên thất bại: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    const isConfirmed = await confirm({
      title: 'Xóa tài liệu',
      message: `Bạn có chắc muốn chuyển tài liệu "${doc.name}" vào thùng rác?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    });
    if (!isConfirmed) return;
    try {
      const res = await api.deleteDocument(doc.id);
      if (res.success) {
        showToast('Đã chuyển tài liệu vào thùng rác', 'success');
        setSelectedDocIds(selectedDocIds.filter((id) => id !== doc.id));
        fetchDocuments();
      }
    } catch (err: any) {
      showToast('Xóa tài liệu thất bại: ' + (err.message || err), 'error');
    }
  };

  const handleMoveDocument = async (folderId: number | null) => {
    if (!movingDoc) return;
    try {
      const res = await api.moveDocument(movingDoc.id, folderId !== null ? String(folderId) : null);
      if (res.success) {
        showToast('Đã di chuyển tài liệu', 'success');
        setMovingDoc(null);
        fetchDocuments();
      }
    } catch (err: any) {
      showToast('Di chuyển thất bại: ' + (err.message || err), 'error');
    }
  };

  const handleUploadAttachment = async () => {
    if (!activeDocForAttachments || !attachmentFile) return;
    try {
      showToast('Đang tải tệp đính kèm...', 'warning');
      const res = await api.uploadDocumentAttachment(activeDocForAttachments.id, attachmentFile);
      if (res.success) {
        showToast(`Đã thêm đính kèm "${attachmentFile.name}"`, 'success');
        setAttachmentFile(null);
        const docsRes = await api.getDocuments({ folder_id: selectedFolderId === 'null' ? '' : selectedFolderId });
        if (docsRes.success) {
          setDocuments(docsRes.documents);
          const updated = docsRes.documents.find((d: DocumentItem) => d.id === activeDocForAttachments.id);
          if (updated) setActiveDocForAttachments(updated);
        }
      }
    } catch (err: any) {
      showToast('Tải đính kèm thất bại: ' + (err.message || err), 'error');
    }
  };

  const handleDeleteAttachment = async (att: DocumentAttachment) => {
    const ok = await confirm({
      title: 'Xóa tệp đính kèm',
      message: `Xóa tệp đính kèm "${att.filename}"?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    });
    if (!ok) return;
    try {
      const res = await api.deleteDocumentAttachment(att.id);
      if (res.success) {
        showToast('Đã xóa đính kèm', 'success');
        const docsRes = await api.getDocuments({ folder_id: selectedFolderId === 'null' ? '' : selectedFolderId });
        if (docsRes.success) {
          setDocuments(docsRes.documents);
          const updated = docsRes.documents.find((d: DocumentItem) => d.id === activeDocForAttachments!.id);
          if (updated) setActiveDocForAttachments(updated);
        }
      }
    } catch (err: any) {
      showToast('Xóa đính kèm thất bại: ' + (err.message || err), 'error');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderIdStr: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const docIdStr = e.dataTransfer.getData('docId');
    const folderIdStr = e.dataTransfer.getData('folderId');
    const targetFolderId = targetFolderIdStr === 'null' ? null : parseInt(targetFolderIdStr, 10);

    if (docIdStr) {
      const docId = parseInt(docIdStr, 10);
      try {
        await api.moveDocument(docId, targetFolderId ? String(targetFolderId) : null);
        showToast('Đã di chuyển tài liệu thành công!', 'success');
        fetchDocuments();
      } catch (err: any) {
        showToast('Không thể di chuyển tài liệu: ' + (err.message || err), 'error');
      }
    } else if (folderIdStr) {
      const folderId = parseInt(folderIdStr, 10);
      if (targetFolderId !== null && folderId === targetFolderId) {
        return showToast('Không thể di chuyển thư mục vào chính nó!', 'warning');
      }
      try {
        await api.moveDocumentFolder(folderId, targetFolderId ? String(targetFolderId) : null);
        showToast('Đã di chuyển thư mục thành công!', 'success');
        fetchFolders();
        fetchDocuments();
      } catch (err: any) {
        showToast('Không thể di chuyển thư mục: ' + (err.message || err), 'error');
      }
    }
  };

  const reloadTrash = () => trash.fetchTrash(setDocuments, setLoading);

  return {
    documents,
    folders,
    trashFolders: trash.trashFolders,
    loading,
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
    selectedTag,
    setSelectedTag,
    expandedFolderIds,
    setExpandedFolderIds,
    dragOverFolderId,
    setDragOverFolderId,
    selectedDocIds,
    setSelectedDocIds,
    showFolderModal,
    setShowFolderModal,
    newFolderName,
    setNewFolderName,
    newFolderParentId,
    setNewFolderParentId,
    showUploadModal,
    setShowUploadModal,
    uploadFiles,
    setUploadFiles,
    uploadFolderId,
    setUploadFolderId,
    uploadTags,
    setUploadTags,
    activeDocForAttachments,
    setActiveDocForAttachments,
    attachmentFile,
    setAttachmentFile,
    movingDoc,
    setMovingDoc,
    editingTagsDoc,
    setEditingTagsDoc,
    tempTags,
    setTempTags,
    showBatchMoveModal: batch.showBatchMoveModal,
    setShowBatchMoveModal: batch.setShowBatchMoveModal,
    showBatchTagsModal: batch.showBatchTagsModal,
    setShowBatchTagsModal: batch.setShowBatchTagsModal,
    batchTags: batch.batchTags,
    setBatchTags: batch.setBatchTags,
    activeMediaPlayer,
    setActiveMediaPlayer,
    isTrash,
    folderTree,
    folderSelectOptions,
    breadcrumbs,
    activeFolder,
    visibleSubfolders,
    allUniqueTags,
    fetchDocuments,
    handleCreateFolder,
    handleDeleteFolder,
    handleUploadDocuments,
    handleDeleteDocument,
    handleRestoreDocument: (id: number) => trash.handleRestoreDocument(id, reloadTrash),
    handleRestoreFolder: (id: number) => trash.handleRestoreFolder(id, reloadTrash),
    handlePermanentDeleteDocument: (id: number, name: string) =>
      trash.handlePermanentDeleteDocument(id, name, reloadTrash),
    handlePermanentDeleteFolder: (id: number, name: string) =>
      trash.handlePermanentDeleteFolder(id, name, reloadTrash),
    handleMoveDocument,
    handleBatchMove: batch.handleBatchMove,
    handleBatchDelete: batch.handleBatchDelete,
    handleBatchUpdateTags: batch.handleBatchUpdateTags,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleDrop,
  };
}
