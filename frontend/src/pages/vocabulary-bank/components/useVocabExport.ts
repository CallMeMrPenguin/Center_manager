import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

export function useVocabExport() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportGrade, setExportGrade] = useState('6');
  const [exportUnit, setExportUnit] = useState('');
  const [saveToDocs, setSaveToDocs] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [saveFolderId, setSaveFolderId] = useState('');
  const [lastExportedFile, setLastExportedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (saveToDocs && folders.length === 0) {
      api.getDocumentFolders().then((res) => {
        if (res.success) setFolders(res.folders);
      }).catch(console.error);
    }
  }, [saveToDocs, folders.length]);

  const folderOptions = useMemo(() => {
    const map: Record<number, any> = {};
    const roots: any[] = [];
    folders.forEach((f) => { map[f.id] = { ...f, children: [] }; });
    folders.forEach((f) => {
      const node = map[f.id];
      if (node.parent_id !== null && map[node.parent_id]) {
        map[node.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });
    const flat: Array<{ id: number; name: string; depth: number }> = [];
    const traverse = (nodes: any[], depth = 0) => {
      nodes.forEach((n) => {
        flat.push({ id: n.id, name: n.name, depth });
        traverse(n.children, depth + 1);
      });
    };
    traverse(roots);
    return flat;
  }, [folders]);

  const handleExportDocx = async () => {
    if (!exportGrade) { showToast('Vui lòng chọn Khối lớp cần xuất!', 'warning'); return; }
    setLoading(true);
    setShowExportModal(false);
    try {
      const res = await api.exportDbVocabDocx({
        grade: parseInt(exportGrade),
        unit: exportUnit || undefined,
        save_to_documents: saveToDocs,
        save_folder_id: saveFolderId || null,
      });
      if (res.success) {
        setLastExportedFile(res.filename);
        showToast(`Xuất file thành công: ${res.filename}`, 'success');
      }
    } catch (err: any) {
      showToast(`Xuất tệp Word thất bại: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!exportGrade) { showToast('Vui lòng chọn Khối lớp cần xuất!', 'warning'); return; }
    setLoading(true);
    setShowExportModal(false);
    try {
      const res = await api.exportDbVocabCsv({
        grade: parseInt(exportGrade),
        unit: exportUnit || undefined,
        save_to_documents: saveToDocs,
        save_folder_id: saveFolderId || null,
      });
      if (res.success) {
        setLastExportedFile(res.filename);
        showToast(`Xuất file CSV thành công: ${res.filename}`, 'success');
      }
    } catch (err: any) {
      showToast(`Xuất tệp CSV thất bại: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    showExportModal,
    setShowExportModal,
    exportGrade,
    setExportGrade,
    exportUnit,
    setExportUnit,
    saveToDocs,
    setSaveToDocs,
    saveFolderId,
    setSaveFolderId,
    lastExportedFile,
    setLastExportedFile,
    folderOptions,
    handleExportDocx,
    handleExportCsv,
    exportLoading: loading,
  };
}
