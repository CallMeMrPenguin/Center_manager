import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Users, UserPlus, Edit3, Trash2, CheckCircle2, 
  Upload, RefreshCw, Download, KeyRound, Shield
} from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { Student } from '../../types';
import { DataTable } from '../../components/DataTable';
import { getLocalDateStr, notifyDataChanged } from '../../utils';
import { StudentDetailCard } from './components/StudentDetailCard';
import { StudentModal } from './components/StudentModal';
import { CsvImportModal } from './components/CsvImportModal';
import { DuplicateWarningModal } from './components/DuplicateWarningModal';
import { createStudentColumns } from './components/studentColumns';
import { dataCache } from '../../utils/dataCache';

export function StudentsPage() {
  const confirm = useConfirm();
  const cachedStudents = dataCache.get<Student[]>('/api/students?search=&status=')?.data;
  const [students, setStudents] = useState<Student[]>(() => cachedStudents || []);
  const [loading, setLoading] = useState(() => !cachedStudents || cachedStudents.length === 0);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [duplicateWarningMsg, setDuplicateWarningMsg] = useState<string | null>(null);
  const [highlightMissingFields, setHighlightMissingFields] = useState<boolean>(false);

  // CSV Import State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);

  const [formData, setFormData] = useState<Partial<Student>>({
    full_name: '',
    nickname: '',
    grade: 'Lớp 6',
    gender: 'Nam',
    school: '',
    date_of_birth: '',
    enroll_date: getLocalDateStr(),
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
    address: '',
    notes: '',
    status: 'Đang học',
    account_username: '',
    account_password: '',
    account_status: 'Hoạt động',
  });

  const loadData = async (silent = false) => {
    const hasData = students.length > 0 || (cachedStudents && cachedStudents.length > 0);
    const isSilent = silent || hasData;
    if (!isSilent) setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data || []);
    } catch (err: any) {
      if (!isSilent) showToast('Không thể tải danh sách học sinh: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataChanged = () => loadData(true);
    window.addEventListener('data-changed', handleDataChanged);
    window.addEventListener('data-invalidated', handleDataChanged);
    return () => {
      window.removeEventListener('data-changed', handleDataChanged);
      window.removeEventListener('data-invalidated', handleDataChanged);
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setDuplicateWarningMsg(null);
    setHighlightMissingFields(false);
    setFormData({
      full_name: '',
      nickname: '',
      grade: 'Lớp 6',
      gender: 'Nam',
      school: '',
      date_of_birth: '',
      enroll_date: getLocalDateStr(),
      father_name: '',
      father_phone: '',
      mother_name: '',
      mother_phone: '',
      address: '',
      notes: '',
      status: 'Đang học',
      account_username: '',
      account_password: '',
      account_status: 'Hoạt động',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = useCallback((st: Student) => {
    setEditingStudent(st);
    setDuplicateWarningMsg(null);
    setHighlightMissingFields(false);
    setFormData({
      ...st,
      account_username: st.account_username || `hs_${String(st.id || 0).padStart(4, '0')}`,
      account_password: '',
      account_status: st.account_status || (st.status !== 'Đã nghỉ' ? 'Hoạt động' : 'Tạm khóa'),
    });
    setModalOpen(true);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = formData.full_name?.trim();
    if (!nameTrim) {
      showToast('Vui lòng nhập họ và tên học sinh', 'warning');
      return;
    }

    const formGradeTrim = formData.grade?.trim().toLowerCase() || '';
    const isDuplicateName = students.some((s) => {
      if (s.id === editingStudent?.id) return false;
      const sNameTrim = s.full_name.trim().toLowerCase();
      if (sNameTrim !== nameTrim.toLowerCase()) return false;
      const sGradeTrim = s.grade?.trim().toLowerCase() || '';
      return !(formGradeTrim && sGradeTrim && formGradeTrim !== sGradeTrim);
    });

    if (isDuplicateName) {
      const missing: string[] = [];
      if (!formData.date_of_birth?.trim()) missing.push('Ngày sinh');
      if (!formData.grade?.trim()) missing.push('Khối lớp');
      if (!formData.gender?.trim()) missing.push('Giới tính');
      if (!formData.school?.trim()) missing.push('Trường học');

      if (missing.length > 0) {
        setHighlightMissingFields(true);
        setDuplicateWarningMsg(
          `Hệ thống phát hiện học sinh trùng tên "${nameTrim}" đã tồn tại! Vui lòng điền đủ: ${missing.join(', ')} để phân biệt.`
        );
        return;
      }
    }

    try {
      if (editingStudent?.id) {
        await api.updateStudent(editingStudent.id, formData);
        showToast('Đã cập nhật thông tin và tài khoản học sinh!', 'success');
      } else {
        await api.createStudent(formData);
        showToast('Đã thêm học sinh và tạo tài khoản mới thành công!', 'success');
      }
      setModalOpen(false);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Không thể lưu dữ liệu: ' + err.message, 'error');
    }
  };

  const handleDelete = async (st: Student) => {
    if (!st.id) return;
    const isConfirmed = await confirm({
      title: 'Xóa Học Sinh',
      message: `Bạn có chắc chắn muốn xóa học sinh ${st.full_name}? Dữ liệu điểm số và tài khoản liên quan sẽ bị xóa!`,
      confirmText: 'Xóa học sinh',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.deleteStudent(st.id);
      showToast('Đã xóa học sinh thành công!', 'success');
      setModalOpen(false);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Không thể xóa: ' + err.message, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    const ok = await confirm({
      title: 'Xóa Nhiều Học Sinh',
      message: `Bạn có chắc chắn muốn xóa ${selectedStudents.length} học sinh đã chọn?`,
      confirmText: `Xóa ${selectedStudents.length} học sinh`,
      type: 'danger',
    });
    if (!ok) return;

    try {
      for (const st of selectedStudents) {
        if (st.id) await api.deleteStudent(st.id);
      }
      showToast(`Đã xóa thành công ${selectedStudents.length} học sinh!`, 'success');
      setSelectedStudents([]);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Lỗi khi xóa hàng loạt: ' + err.message, 'error');
    }
  };

  const handleConfirmCsvImport = async () => {
    if (csvPreview.length === 0) return;
    try {
      setCsvImporting(true);
      let count = 0;
      for (const row of csvPreview) {
        const full_name = row['Họ và tên'] || row['full_name'] || row['Name'] || '';
        if (full_name.trim()) {
          await api.createStudent({
            full_name: full_name.trim(),
            nickname: row['Biệt danh'] || row['nickname'] || '',
            grade: row['Khối'] || row['grade'] || 'Lớp 6',
            gender: row['Giới tính'] || row['gender'] || 'Nam',
            date_of_birth: row['Ngày sinh'] || row['date_of_birth'] || '',
            school: row['Trường'] || row['school'] || '',
            father_phone: row['SĐT'] || row['father_phone'] || '',
            enroll_date: getLocalDateStr(),
            status: 'Đang học',
          });
          count++;
        }
      }
      showToast(`Đã nhập thành công ${count} học sinh từ CSV!`, 'success');
      setCsvModalOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Lỗi khi nhập CSV: ' + err.message, 'error');
    } finally {
      setCsvImporting(false);
    }
  };

  const totalActive = students.filter((s) => s.status === 'Đang học').length;
  const totalQuit = students.filter((s) => s.status === 'Đã nghỉ').length;

  const columns = useMemo<ColumnDef<Student>[]>(
    () => createStudentColumns(handleOpenEdit),
    [handleOpenEdit]
  );

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-4 bg-[#080b14] text-slate-100 select-none font-sans overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#5c36f5]/20 text-[#5c36f5] rounded-2xl border border-[#5c36f5]/30 shadow-[0_0_15px_rgba(92,54,245,0.3)]">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Quản Lý Hồ Sơ Học Sinh</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-0.5">
              <span>Tổng số: <strong className="text-white">{students.length}</strong></span>
              <span>•</span>
              <span className="text-emerald-400">Đang học: <strong>{totalActive}</strong></span>
              <span>•</span>
              <span className="text-rose-400">Đã nghỉ: <strong>{totalQuit}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <Upload size={14} />
            <span>Nhập CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6e4af7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.45)] transition cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Thêm Học Sinh Mới</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0 bg-[#0d1018] rounded-2xl border border-[#1b2444] overflow-hidden shadow-xl">
        <DataTable<Student>
          data={students}
          columns={columns}
          loading={loading}
          enableRowSelection={true}
          enableRowExpansion={true}
          renderSubComponent={({ row }) => (
            <StudentDetailCard student={row.original} onEdit={() => handleOpenEdit(row.original)} />
          )}
          onSelectionChange={setSelectedStudents}
          searchPlaceholder="Tìm theo tên, biệt danh, SĐT, trường, tài khoản..."
          pageSize={20}
          exportFilename="danh_sach_hoc_sinh"
          toolbarRight={
            selectedStudents.length > 0 ? (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xóa {selectedStudents.length} mục</span>
              </button>
            ) : null
          }
        />
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingStudent={editingStudent}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onDelete={handleDelete}
        highlightMissingFields={highlightMissingFields}
      />

      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        csvFile={csvFile}
        setCsvFile={setCsvFile}
        csvPreview={csvPreview}
        setCsvPreview={setCsvPreview}
        csvImporting={csvImporting}
        onConfirmImport={handleConfirmCsvImport}
      />

      <DuplicateWarningModal
        message={duplicateWarningMsg}
        onClose={() => setDuplicateWarningMsg(null)}
      />
    </div>
  );
}

export default StudentsPage;
