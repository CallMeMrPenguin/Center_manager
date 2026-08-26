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

export function StudentsPage() {
  const confirm = useConfirm();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!silent) setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: any) {
      if (!silent) showToast('Không thể tải danh sách học sinh: ' + err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataChanged = () => loadData(true);
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
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

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      size: 55,
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
    },
    {
      id: 'name',
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      cell: ({ row }) => {
        const st = row.original;
        const initial = st.full_name?.trim() ? st.full_name.trim().charAt(0).toUpperCase() : 'H';
        return (
          <div className="flex items-center gap-3">
            {/* Avatar Circle with Initial */}
            <div className="w-8 h-8 rounded-full bg-[#1b2344] border border-[#2d3b6f] flex items-center justify-center text-[#a5b4fc] font-black text-xs shrink-0 shadow-inner">
              {initial}
            </div>
            <div className="font-extrabold text-white text-sm">
              <span>{st.full_name}</span>
              {st.nickname && (
                <span className="ml-1.5 text-xs text-indigo-400 font-semibold">({st.nickname})</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'account',
      header: 'Tài Khoản App',
      cell: ({ row }) => {
        const st = row.original;
        const username = st.account_username || `hs_${String(st.id || 0).padStart(4, '0')}`;
        return (
          <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/25">
            {username}
          </span>
        );
      },
    },
    {
      id: 'classes',
      accessorKey: 'enrolled_classes',
      header: 'Lớp Học',
      cell: ({ row }) => {
        const classes = row.original.enrolled_classes;
        return classes ? (
          <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {classes}
          </span>
        ) : (
          <span className="text-slate-500 text-xs font-semibold">Chưa xếp lớp</span>
        );
      },
    },
    {
      id: 'grade',
      accessorKey: 'grade',
      header: 'Khối',
      size: 80,
      cell: ({ row }) => (
        <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-extrabold bg-[#222b48] text-indigo-300 border border-indigo-500/20">
          {row.original.grade || 'Lớp 6'}
        </span>
      ),
    },
    {
      id: 'gender',
      accessorKey: 'gender',
      header: 'Giới Tính',
      size: 90,
      cell: ({ row }) => <span className="text-slate-300 text-xs font-semibold">{row.original.gender || 'Nam'}</span>,
    },
    {
      id: 'dob',
      accessorKey: 'date_of_birth',
      header: 'Ngày Sinh',
      cell: (info) => <span className="text-slate-300 text-xs font-medium">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'parents',
      header: 'Phụ Huynh',
      cell: ({ row }) => {
        const st = row.original;
        return (
          <div className="text-slate-300 text-xs font-medium">
            {st.father_phone && <div>Bố: {st.father_phone}</div>}
            {st.mother_phone && <div>Mẹ: {st.mother_phone}</div>}
            {!st.father_phone && !st.mother_phone && <span className="text-slate-500">-</span>}
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Trạng Thái</div>,
      size: 110,
      cell: (info) => {
        const st = info.getValue<string>();
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
              st === 'Đang học'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {st || 'Đang học'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Thao Tác</div>,
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-[#5c36f5]/20 text-slate-400 hover:text-indigo-300 hover:border-[#5c36f5]/40 border border-transparent transition cursor-pointer"
            title="Sửa thông tin học sinh"
          >
            <Edit3 size={15} />
          </button>
        </div>
      ),
    },
  ], [handleOpenEdit]);

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
