import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { api } from '../../api';
import { DbVocab } from '../../types';
import { useConfirm } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { showToast } from '../../components/Toast';
import { VOCAB_DIFFICULTIES, VOCAB_POS_LIST } from './constants';
import { VocabHeader } from './components/VocabHeader';
import { getVocabColumns } from './components/vocabColumns';
import { VocabEditModal } from './components/VocabEditModal';
import { VocabImportModal } from './components/VocabImportModal';
import { VocabScopedDeleteModal } from './components/VocabScopedDeleteModal';
import { VocabExportModal } from './components/VocabExportModal';
import { VocabCsvPreviewModal } from './components/VocabCsvPreviewModal';
import { useVocabExport } from './components/useVocabExport';

export default function VocabularyBank({ isActive }: { isActive?: boolean }) {
  const confirm = useConfirm();
  const [vocabList, setVocabList] = useState<DbVocab[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<DbVocab[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Modals & Sub-state
  const [editingVocab, setEditingVocab] = useState<DbVocab | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastedCsv, setPastedCsv] = useState('');
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ show: boolean; items: any[]; fileName: string }>({
    show: false,
    items: [],
    fileName: '',
  });

  const exportState = useVocabExport();

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    scope: 'all' | 'grade' | 'unit';
    grade: string;
    unit: string;
  }>({ show: false, scope: 'all', grade: '', unit: '' });

  const fetchActiveGrades = async () => {
    try {
      const res = await api.getActiveGrades();
      if (res.success) setAvailableGrades(res.grades);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVocab = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getDbVocab({});
      if (res.success) setVocabList(res.vocab);
    } catch {
      if (!silent) showToast('Không thể tải danh sách từ vựng', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveGrades();
    fetchVocab();
    const handleDataChanged = () => fetchVocab(true);
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, [fetchVocab]);

  // Single Edit & Delete
  const handleSaveEdit = async (id: number, data: Partial<DbVocab>) => {
    setLoading(true);
    try {
      const res = await api.editDbVocab(id, data);
      if (res.success) {
        showToast('Đã cập nhật từ vựng thành công!', 'success');
        setEditingVocab(null);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (e: any) {
      showToast(`Cập nhật thất bại: ${e.message || e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Xóa từ vựng',
      message: 'Bạn có chắc muốn xóa từ vựng này khỏi cơ sở dữ liệu?',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    setLoading(true);
    try {
      const res = await api.deleteDbVocab([id]);
      if (res.success) {
        showToast('Đã xóa từ vựng thành công.', 'success');
        setEditingVocab(null);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (e: any) {
      showToast(`Xóa thất bại: ${e.message || e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    const isConfirmed = await confirm({
      title: 'Xóa từ vựng đã chọn',
      message: `Bạn có chắc muốn xóa ${selectedRows.length} mục từ vựng đã chọn?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    setLoading(true);
    try {
      const ids = selectedRows.map((r) => r.id);
      const res = await api.deleteDbVocab(ids);
      if (res.success) {
        showToast(`Đã xóa thành công ${res.count} từ vựng.`, 'success');
        setSelectedRows([]);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Xóa thất bại: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Scoped Delete
  const handleScopedDelete = async () => {
    let confirmMsg = 'CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ danh sách từ vựng?';
    if (deleteModal.scope === 'grade') {
      if (!deleteModal.grade) { showToast('Vui lòng chọn Khối lớp cần xóa', 'warning'); return; }
      confirmMsg = `Bạn có chắc muốn xóa tất cả từ vựng thuộc Lớp ${deleteModal.grade}?`;
    } else if (deleteModal.scope === 'unit') {
      if (!deleteModal.grade || !deleteModal.unit.trim()) {
        showToast('Vui lòng chọn Lớp và nhập Unit cần xóa', 'warning'); return;
      }
      confirmMsg = `Bạn có chắc muốn xóa từ vựng thuộc Unit ${deleteModal.unit} Lớp ${deleteModal.grade}?`;
    }
    const isConfirmed = await confirm({
      title: 'Xác nhận xóa từ vựng',
      message: confirmMsg,
      confirmText: 'Xóa dữ liệu',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    setLoading(true);
    try {
      const res = await api.clearDbVocab(
        deleteModal.scope !== 'all' ? deleteModal.grade : undefined,
        deleteModal.scope === 'unit' ? deleteModal.unit.trim() : undefined,
      );
      if (res.success) {
        showToast('Đã xóa dữ liệu thành công.', 'success');
        setDeleteModal({ show: false, scope: 'all', grade: '', unit: '' });
        setSelectedRows([]);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Không thể xóa dữ liệu: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // CSV Import
  const handleValidateCsv = async () => {
    let fileToValidate = selectedCsvFile;
    if (!fileToValidate && pastedCsv.trim()) {
      fileToValidate = new File([pastedCsv], 'pasted_vocab.csv', { type: 'text/csv' });
    }
    if (!fileToValidate) {
      showToast('Vui lòng chọn tệp CSV hoặc dán nội dung CSV!', 'warning');
      return;
    }
    setLoading(true);
    try {
      showToast('Đang kiểm tra trùng lặp từ vựng trong CSV...', 'warning');
      const res = await api.validateDbVocabCsv(fileToValidate);
      if (res.success) {
        setCsvPreview({ show: true, items: res.items, fileName: fileToValidate.name });
        setShowImportModal(false);
        setPastedCsv('');
        setSelectedCsvFile(null);
      }
    } catch (err: any) {
      showToast(`Kiểm tra CSV thất bại: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await api.confirmDbVocabImport(csvPreview.items);
      if (res.success) {
        showToast(`Đã nhập thành công ${res.count} từ vựng mới!`, 'success');
        setCsvPreview({ show: false, items: [], fileName: '' });
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Nhập từ vựng thất bại: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => getVocabColumns((v) => setEditingVocab(v)), []);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 p-8 overflow-y-auto">
      <VocabHeader
        totalCount={vocabList.length}
        selectedCount={selectedRows.length}
        loading={loading}
        onOpenExport={() => exportState.setShowExportModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        onDeleteSelected={handleDeleteSelected}
        onOpenDeleteModal={() => setDeleteModal((prev) => ({ ...prev, show: true }))}
      />

      {exportState.lastExportedFile && (
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl flex items-center justify-between mb-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              Đã xuất tệp: <strong className="font-mono text-emerald-700">{exportState.lastExportedFile}</strong>
            </span>
          </div>
          <button
            onClick={() => exportState.setLastExportedFile(null)}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <DataTable<DbVocab>
          data={vocabList}
          columns={columns}
          pageSize={20}
          exportFilename="danh_sach_tu_vung"
          searchPlaceholder="Tìm từ vựng, loại từ, nghĩa tiếng Việt..."
          enableRowSelection={true}
          onSelectionChange={setSelectedRows}
          onRowDoubleClick={(row) => setEditingVocab(row)}
          emptyMessage="Chưa có từ vựng nào trong cơ sở dữ liệu."
        />
      </div>

      <VocabEditModal
        vocab={editingVocab}
        isOpen={editingVocab !== null}
        onClose={() => setEditingVocab(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteSingle}
        availableGrades={availableGrades}
        difficultiesList={VOCAB_DIFFICULTIES}
        posList={VOCAB_POS_LIST}
      />

      <VocabImportModal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setPastedCsv(''); setSelectedCsvFile(null); }}
        selectedCsvFile={selectedCsvFile}
        onSelectFile={setSelectedCsvFile}
        pastedCsv={pastedCsv}
        onChangePastedCsv={setPastedCsv}
        onSubmit={handleValidateCsv}
        loading={loading}
      />

      <VocabScopedDeleteModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal((prev) => ({ ...prev, show: false }))}
        scope={deleteModal.scope}
        onChangeScope={(scope) => setDeleteModal((prev) => ({ ...prev, scope }))}
        grade={deleteModal.grade}
        onChangeGrade={(grade) => setDeleteModal((prev) => ({ ...prev, grade }))}
        unit={deleteModal.unit}
        onChangeUnit={(unit) => setDeleteModal((prev) => ({ ...prev, unit }))}
        onConfirm={handleScopedDelete}
        loading={loading}
        availableGrades={availableGrades}
      />

      <VocabExportModal
        isOpen={exportState.showExportModal}
        onClose={() => exportState.setShowExportModal(false)}
        exportGrade={exportState.exportGrade}
        onChangeGrade={exportState.setExportGrade}
        exportUnit={exportState.exportUnit}
        onChangeUnit={exportState.setExportUnit}
        saveToDocs={exportState.saveToDocs}
        onChangeSaveToDocs={exportState.setSaveToDocs}
        saveFolderId={exportState.saveFolderId}
        onChangeSaveFolderId={exportState.setSaveFolderId}
        availableGrades={availableGrades}
        folderOptions={exportState.folderOptions}
        onExportDocx={exportState.handleExportDocx}
        onExportCsv={exportState.handleExportCsv}
      />

      <VocabCsvPreviewModal
        isOpen={csvPreview.show}
        onClose={() => setCsvPreview({ show: false, items: [], fileName: '' })}
        items={csvPreview.items}
        fileName={csvPreview.fileName}
        onConfirm={handleConfirmImport}
        loading={loading}
      />
    </div>
  );
}
