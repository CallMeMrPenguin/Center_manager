import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api';
import { DbQuestion } from '../../types';
import { useConfirm } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { showToast } from '../../components/Toast';
import { QuestionHeader } from './components/QuestionHeader';
import { getQuestionColumns } from './components/questionColumns';
import { QuestionEditModal } from './components/QuestionEditModal';
import { QuestionCreateTestModal } from './components/QuestionCreateTestModal';
import { QuestionImportModal } from './components/QuestionImportModal';
import { QuestionCsvPreviewModal } from './components/QuestionCsvPreviewModal';
import { QuestionScopedDeleteModal } from './components/QuestionScopedDeleteModal';
import {
  CreateTestConfig,
  buildTestQuestionPool,
} from './utils/testGeneration';

interface QuestionBankProps {
  onCreateTest: (questions: DbQuestion[], numVersions?: number, grade?: string, unit?: string) => void;
  isActive?: boolean;
}

export default function QuestionBank({ onCreateTest, isActive }: QuestionBankProps) {
  const confirm = useConfirm();
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<DbQuestion[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Modals
  const [editingQuestion, setEditingQuestion] = useState<DbQuestion | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastedCsv, setPastedCsv] = useState('');
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ show: boolean; items: any[]; fileName: string }>({
    show: false,
    items: [],
    fileName: '',
  });

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    scope: 'all' | 'grade' | 'unit';
    grade: string;
    unit: string;
  }>({ show: false, scope: 'all', grade: '', unit: '' });

  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [createTestConfig, setCreateTestConfig] = useState<CreateTestConfig>({
    source: 'bank',
    grade: '',
    unit: '',
    respectDifficulty: false,
    targetDifficulty: 'NHẬN BIẾT',
    useTypeDistribution: false,
    useDifficultyDistribution: false,
    difficultyPctNhanBiet: 30,
    difficultyPctThongHieu: 40,
    difficultyPctVanDung: 30,
    totalCount: 20,
    typeCounts: {},
    numVersions: 1,
    typeOrder: [],
    includedTypes: [],
  });

  const fetchActiveGrades = async () => {
    try {
      const res = await api.getActiveGrades();
      if (res.success) setAvailableGrades(res.grades);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuestions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getDbQuestions({});
      if (res.success) setQuestions(res.questions);
    } catch {
      if (!silent) showToast('Không thể tải danh sách câu hỏi', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveGrades();
    fetchQuestions();
    const handleDataChanged = () => fetchQuestions(true);
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, [fetchQuestions]);

  // Single Edit & Delete
  const handleSaveEdit = async (id: number, data: Partial<DbQuestion>) => {
    setLoading(true);
    try {
      const res = await api.editDbQuestion(id, data);
      if (res.success) {
        showToast('Đã cập nhật câu hỏi thành công!', 'success');
        setEditingQuestion(null);
        fetchQuestions();
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
      title: 'Xóa câu hỏi',
      message: 'Bạn có chắc muốn xóa câu hỏi này khỏi ngân hàng câu hỏi?',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    setLoading(true);
    try {
      const res = await api.deleteDbQuestions([id]);
      if (res.success) {
        showToast('Đã xóa câu hỏi thành công.', 'success');
        setEditingQuestion(null);
        fetchQuestions();
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
      title: 'Xóa câu hỏi đã chọn',
      message: `Bạn có chắc muốn xóa ${selectedRows.length} câu hỏi đã chọn?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    setLoading(true);
    try {
      const ids = selectedRows.map((r) => r.id);
      const res = await api.deleteDbQuestions(ids);
      if (res.success) {
        showToast(`Đã xóa thành công ${res.count} câu hỏi.`, 'success');
        setSelectedRows([]);
        fetchQuestions();
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
    let confirmMsg = 'CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ danh sách câu hỏi?';
    if (deleteModal.scope === 'grade') {
      if (!deleteModal.grade) { showToast('Vui lòng chọn Khối lớp cần xóa', 'warning'); return; }
      confirmMsg = `Bạn có chắc muốn xóa tất cả câu hỏi thuộc Lớp ${deleteModal.grade}?`;
    } else if (deleteModal.scope === 'unit') {
      if (!deleteModal.grade || !deleteModal.unit.trim()) {
        showToast('Vui lòng chọn Lớp và nhập Unit cần xóa', 'warning'); return;
      }
      confirmMsg = `Bạn có chắc muốn xóa câu hỏi thuộc Unit ${deleteModal.unit} Lớp ${deleteModal.grade}?`;
    }
    const isConfirmed = await confirm({
      title: 'Xác nhận xóa câu hỏi',
      message: confirmMsg,
      confirmText: 'Xóa dữ liệu',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    setLoading(true);
    try {
      const res = await api.clearDbQuestions(
        deleteModal.scope !== 'all' ? deleteModal.grade : undefined,
        deleteModal.scope === 'unit' ? deleteModal.unit.trim() : undefined,
      );
      if (res.success) {
        showToast('Đã xóa dữ liệu thành công.', 'success');
        setDeleteModal({ show: false, scope: 'all', grade: '', unit: '' });
        setSelectedRows([]);
        fetchQuestions();
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
      fileToValidate = new File([pastedCsv], 'pasted_questions.csv', { type: 'text/csv' });
    }
    if (!fileToValidate) {
      showToast('Vui lòng chọn tệp CSV hoặc dán nội dung CSV!', 'warning');
      return;
    }
    setLoading(true);
    try {
      showToast('Đang kiểm tra trùng lặp câu hỏi trong CSV...', 'warning');
      const res = await api.validateDbQuestionsCsv(fileToValidate);
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
      const res = await api.confirmDbQuestionsImport(csvPreview.items);
      if (res.success) {
        showToast(`Đã nhập thành công ${res.count} câu hỏi mới!`, 'success');
        setCsvPreview({ show: false, items: [], fileName: '' });
        fetchQuestions();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Nhập câu hỏi thất bại: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test Generation
  const handleOpenCreateTest = () => {
    const currentUniqueTypes = Array.from(new Set(questions.map((q) => q.t).filter(Boolean)));
    const defaultCounts: Record<string, number> = {};
    currentUniqueTypes.forEach((t) => { defaultCounts[t] = 0; });
    if (defaultCounts['fb'] !== undefined) defaultCounts['fb'] = 10;
    else if (defaultCounts['mq'] !== undefined) defaultCounts['mq'] = 10;

    setCreateTestConfig({
      source: selectedRows.length > 0 ? 'selected' : 'bank',
      grade: '',
      unit: '',
      respectDifficulty: false,
      targetDifficulty: 'NHẬN BIẾT',
      useTypeDistribution: false,
      useDifficultyDistribution: false,
      difficultyPctNhanBiet: 30,
      difficultyPctThongHieu: 40,
      difficultyPctVanDung: 30,
      totalCount: 20,
      typeCounts: defaultCounts,
      numVersions: 1,
      typeOrder: currentUniqueTypes,
      includedTypes: [...currentUniqueTypes],
    });
    setShowCreateTestModal(true);
  };

  const handleExecuteCreateTest = async () => {
    setLoading(true);
    try {
      const selectedIds = selectedRows.map((r) => r.id);
      const { selectedPool } = buildTestQuestionPool(createTestConfig, questions, selectedIds);

      if (selectedPool.length === 0) {
        showToast('Không có câu hỏi nào được chọn để tạo đề!', 'error');
        return;
      }

      const idsToIncrement = selectedPool.map((q) => q.id);
      try {
        await api.incrementDbQuestionsFrequency(idsToIncrement);
      } catch (err) {
        console.error('Failed to increment frequency:', err);
      }

      setShowCreateTestModal(false);
      onCreateTest(selectedPool, createTestConfig.numVersions, createTestConfig.grade, createTestConfig.unit);
      showToast(`Đã tạo thành công đề với ${selectedPool.length} câu hỏi!`, 'success');
    } catch (e: any) {
      showToast('Lỗi tạo đề thi: ' + (e.message || e), 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => getQuestionColumns((q) => setEditingQuestion(q)), []);
  const uniqueTypes = useMemo(() => Array.from(new Set(questions.map((q) => q.t).filter(Boolean))), [questions]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 p-8 overflow-y-auto">
      <QuestionHeader
        totalCount={questions.length}
        selectedCount={selectedRows.length}
        loading={loading}
        onOpenCreateTest={handleOpenCreateTest}
        onOpenImport={() => setShowImportModal(true)}
        onDeleteSelected={handleDeleteSelected}
        onOpenDeleteModal={() => setDeleteModal((prev) => ({ ...prev, show: true }))}
      />

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <DataTable<DbQuestion>
          data={questions}
          columns={columns}
          loading={loading}
          loadingMessage="Đang tải danh sách câu hỏi..."
          pageSize={20}
          exportFilename="ngan_hang_cau_hoi"
          searchPlaceholder="Tìm kiếm câu hỏi, dạng bài, đáp án..."
          enableRowSelection={true}
          onSelectionChange={setSelectedRows}
          onRowDoubleClick={(row) => setEditingQuestion(row)}
          emptyMessage="Chưa có câu hỏi nào trong ngân hàng."
        />
      </div>

      <QuestionEditModal
        question={editingQuestion}
        isOpen={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteSingle}
        availableGrades={availableGrades}
      />

      <QuestionCreateTestModal
        isOpen={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        config={createTestConfig}
        onChangeConfig={setCreateTestConfig}
        onSubmit={handleExecuteCreateTest}
        selectedCount={selectedRows.length}
        availableGrades={availableGrades}
        uniqueTypesInBank={uniqueTypes}
      />

      <QuestionImportModal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setPastedCsv(''); setSelectedCsvFile(null); }}
        selectedCsvFile={selectedCsvFile}
        onSelectFile={setSelectedCsvFile}
        pastedCsv={pastedCsv}
        onChangePastedCsv={setPastedCsv}
        onSubmit={handleValidateCsv}
        loading={loading}
      />

      <QuestionScopedDeleteModal
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

      <QuestionCsvPreviewModal
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
