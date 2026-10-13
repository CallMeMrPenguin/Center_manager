import { useState } from 'react';
import { api } from '../../../api';
import { useConfirm } from '../../../components/ConfirmDialog';
import { showToast } from '../../../components/Toast';
import { DocumentItem, FolderItem } from '../types';

export function useDocumentTrash() {
  const confirm = useConfirm();
  const [trashFolders, setTrashFolders] = useState<FolderItem[]>([]);

  const fetchTrash = async (
    setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);
    try {
      const res = await api.getTrashDocuments();
      if (res.success) {
        setDocuments(res.documents);
        setTrashFolders(res.folders);
      }
    } catch (err: any) {
      showToast('Không thể tải thùng rác: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDocument = async (docId: number, onSuccess: () => void) => {
    try {
      const res = await api.restoreDocument(docId);
      if (res.success) {
        showToast('Đã khôi phục tài liệu!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      showToast('Khôi phục thất bại: ' + (err.message || err), 'error');
    }
  };

  const handleRestoreFolder = async (folderId: number, onSuccess: () => void) => {
    try {
      const res = await api.restoreDocumentFolder(folderId);
      if (res.success) {
        showToast('Đã khôi phục thư mục!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      showToast('Khôi phục thất bại: ' + (err.message || err), 'error');
    }
  };

  const handlePermanentDeleteDocument = async (docId: number, name: string, onSuccess: () => void) => {
    const ok = await confirm({
      title: 'Xóa vĩnh viễn',
      message: `Xóa vĩnh viễn tài liệu "${name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
    });
    if (!ok) return;
    try {
      const res = await api.permanentlyDeleteDocument(docId);
      if (res.success) {
        showToast('Đã xóa vĩnh viễn!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      showToast('Xóa thất bại: ' + (err.message || err), 'error');
    }
  };

  const handlePermanentDeleteFolder = async (folderId: number, name: string, onSuccess: () => void) => {
    const ok = await confirm({
      title: 'Xóa vĩnh viễn thư mục',
      message: `Xóa vĩnh viễn thư mục "${name}" và toàn bộ tệp bên trong?`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
    });
    if (!ok) return;
    try {
      const res = await api.permanentlyDeleteDocumentFolder(folderId);
      if (res.success) {
        showToast('Đã xóa vĩnh viễn thư mục!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      showToast('Xóa thất bại: ' + (err.message || err), 'error');
    }
  };

  return {
    trashFolders,
    setTrashFolders,
    fetchTrash,
    handleRestoreDocument,
    handleRestoreFolder,
    handlePermanentDeleteDocument,
    handlePermanentDeleteFolder,
  };
}
