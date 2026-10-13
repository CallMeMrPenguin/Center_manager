import { useState } from 'react';
import { api } from '../../../api';
import { useConfirm } from '../../../components/ConfirmDialog';
import { showToast } from '../../../components/Toast';

export function useDocumentBatchOps(
  selectedDocIds: number[],
  setSelectedDocIds: React.Dispatch<React.SetStateAction<number[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  fetchDocuments: () => void
) {
  const confirm = useConfirm();
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false);
  const [showBatchTagsModal, setShowBatchTagsModal] = useState(false);
  const [batchTags, setBatchTags] = useState<string[]>([]);

  const handleBatchMove = async (folderId: number | null) => {
    if (selectedDocIds.length === 0) return;
    setLoading(true);
    try {
      const targetStr = folderId !== null ? String(folderId) : null;
      await Promise.all(selectedDocIds.map((id) => api.moveDocument(id, targetStr)));
      showToast(`Đã di chuyển ${selectedDocIds.length} tài liệu!`, 'success');
      setSelectedDocIds([]);
      setShowBatchMoveModal(false);
      fetchDocuments();
    } catch (err: any) {
      showToast('Di chuyển đồng loạt thất bại: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedDocIds.length === 0) return;
    const ok = await confirm({
      title: 'Xóa hàng loạt',
      message: `Chuyển ${selectedDocIds.length} tài liệu đã chọn vào thùng rác?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    });
    if (!ok) return;
    setLoading(true);
    try {
      await Promise.all(selectedDocIds.map((id) => api.deleteDocument(id)));
      showToast(`Đã xóa ${selectedDocIds.length} tài liệu!`, 'success');
      setSelectedDocIds([]);
      fetchDocuments();
    } catch (err: any) {
      showToast('Xóa thất bại: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpdateTags = async () => {
    if (selectedDocIds.length === 0) return;
    setLoading(true);
    try {
      const tagsStr = batchTags.join(',');
      await Promise.all(selectedDocIds.map((id) => api.updateDocumentTags(id, tagsStr)));
      showToast(`Đã cập nhật nhãn cho ${selectedDocIds.length} tài liệu!`, 'success');
      setSelectedDocIds([]);
      setShowBatchTagsModal(false);
      fetchDocuments();
    } catch (err: any) {
      showToast('Cập nhật thất bại: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    showBatchMoveModal,
    setShowBatchMoveModal,
    showBatchTagsModal,
    setShowBatchTagsModal,
    batchTags,
    setBatchTags,
    handleBatchMove,
    handleBatchDelete,
    handleBatchUpdateTags,
  };
}
