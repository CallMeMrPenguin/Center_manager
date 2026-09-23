import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  UserCheck, UserPlus, Edit3, Trash2, Phone, Calendar, RefreshCw 
} from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { TeacherCM } from '../../types';
import { DataTable } from '../../components/DataTable';
import { notifyDataChanged } from '../../utils';
import { TeacherDetailCard } from './components/TeacherDetailCard';
import { TeacherModal } from './components/TeacherModal';
import { dataCache } from '../../utils/dataCache';

export function TeachersPage() {
  const confirm = useConfirm();
  const cachedTeachers = dataCache.get<TeacherCM[]>('/api/teachers_cm?search=&role=')?.data;
  const [teachers, setTeachers] = useState<TeacherCM[]>(() => cachedTeachers || []);
  const [loading, setLoading] = useState(() => !cachedTeachers || cachedTeachers.length === 0);
  const [selectedTeachers, setSelectedTeachers] = useState<TeacherCM[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherCM | null>(null);
  const [formData, setFormData] = useState<Partial<TeacherCM>>({
    full_name: '',
    role: 'Giáo viên',
    date_of_birth: '',
    phone: '',
    notes: '',
    account_username: '',
    account_password: '',
    account_role: 'Giáo viên',
    account_status: 'Hoạt động',
  });

  const loadData = async (silent = false) => {
    const hasData = teachers.length > 0 || (cachedTeachers && cachedTeachers.length > 0);
    const isSilent = silent || hasData;
    if (!isSilent) setLoading(true);
    try {
      const data = await api.getTeachersCM();
      setTeachers(data || []);
    } catch (err: any) {
      if (!isSilent) showToast('Không thể tải danh sách giáo viên: ' + err.message, 'error');
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
    setEditingTeacher(null);
    setFormData({
      full_name: '',
      role: 'Giáo viên',
      date_of_birth: '',
      phone: '',
      notes: '',
      account_username: '',
      account_password: '',
      account_role: 'Giáo viên',
      account_status: 'Hoạt động',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = useCallback((t: TeacherCM) => {
    setEditingTeacher(t);
    setFormData({
      ...t,
      account_username: t.account_username || `gv_${String(t.id || 0).padStart(4, '0')}`,
      account_password: '',
      account_role: t.account_role || t.role || 'Giáo viên',
      account_status: t.account_status || 'Hoạt động',
    });
    setModalOpen(true);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name?.trim()) {
      showToast('Họ tên không được để trống!', 'warning');
      return;
    }
    try {
      if (editingTeacher?.id) {
        await api.updateTeacherCM(editingTeacher.id, formData);
        showToast('Đã cập nhật thông tin và tài khoản giáo viên!', 'success');
      } else {
        await api.createTeacherCM(formData);
        showToast('Đã thêm giáo viên và cấp tài khoản thành công!', 'success');
      }
      setModalOpen(false);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Lỗi khi lưu: ' + err.message, 'error');
    }
  };

  const handleDelete = async (t: TeacherCM) => {
    if (!t.id) return;
    const ok = await confirm({
      title: 'Xóa Giáo Viên',
      message: `Bạn có chắc chắn muốn xóa giáo viên ${t.full_name}? Tài khoản đăng nhập liên quan cũng sẽ bị xóa!`,
      confirmText: 'Xóa giáo viên',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteTeacherCM(t.id);
      showToast('Đã xóa giáo viên thành công!', 'success');
      setModalOpen(false);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Không thể xóa: ' + err.message, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeachers.length === 0) return;
    const ok = await confirm({
      title: 'Xóa Nhiều Nhân Sự',
      message: `Bạn có chắc chắn muốn xóa ${selectedTeachers.length} giáo viên/nhân viên đã chọn?`,
      confirmText: `Xóa ${selectedTeachers.length} người`,
      type: 'danger',
    });
    if (!ok) return;

    try {
      for (const t of selectedTeachers) {
        if (t.id) await api.deleteTeacherCM(t.id);
      }
      showToast(`Đã xóa ${selectedTeachers.length} giáo viên thành công!`, 'success');
      setSelectedTeachers([]);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast('Lỗi khi xóa: ' + err.message, 'error');
    }
  };

  const columns = useMemo<ColumnDef<TeacherCM>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      size: 55,
      cell: ({ row }) => (
        <div className="text-center font-extrabold text-slate-700 dark:text-slate-300 text-sm sm:text-base">
          {row.index + 1}
        </div>
      ),
    },
    {
      id: 'name',
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      cell: ({ row }) => {
        const t = row.original;
        const initial = t.full_name?.trim() ? t.full_name.trim().charAt(0).toUpperCase() : 'G';
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-[#1e2540] dark:border-[#343e68] dark:text-[#a5b4fc] flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
              {initial}
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-base">{t.full_name}</span>
          </div>
        );
      },
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Vai Trò',
      size: 130,
      cell: (info) => {
        const val = info.getValue<string>();
        return (
          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border ${
            val === 'Giáo viên'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-[#1e2540] dark:border-[#343e68] dark:text-[#a5b4fc]'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-[#132a22] dark:border-[#059669] dark:text-[#34d399]'
          }`}>
            {val}
          </span>
        );
      },
    },
    {
      id: 'account',
      header: 'Tài Khoản App',
      cell: ({ row }) => {
        const t = row.original;
        const username = t.account_username || `gv_${String(t.id || 0).padStart(4, '0')}`;
        return (
          <span className="font-mono text-xs font-black text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/25">
            {username}
          </span>
        );
      },
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Số Điện Thoại',
      cell: (info) => {
        const ph = info.getValue<string>();
        return ph ? (
          <a href={`tel:${ph}`} className="text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-300 text-sm font-bold font-mono">
            {ph}
          </a>
        ) : (
          <span className="text-slate-500 text-xs">-</span>
        );
      },
    },
    {
      id: 'dob',
      accessorKey: 'date_of_birth',
      header: 'Ngày Sinh',
      size: 120,
      cell: (info) => <span className="text-slate-800 dark:text-slate-200 text-sm font-bold font-mono">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'account_status',
      header: () => <div className="text-center w-full">Trạng Thái TK</div>,
      size: 110,
      cell: ({ row }) => {
        const status = row.original.account_status || 'Hoạt động';
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black border ${
              status === 'Hoạt động'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
            }`}>
              {status}
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
            className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-0 shadow-2xs hover:shadow-xs transition cursor-pointer"
            title="Sửa thông tin giáo viên"
          >
            <Edit3 size={15} />
          </button>
        </div>
      ),
    },
  ], [handleOpenEdit]);

  const teacherCount = teachers.filter((t) => t.role === 'Giáo viên').length;
  const assistantCount = teachers.filter((t) => t.role === 'Trợ giảng').length;

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-4 bg-[#f1f5f9] dark:bg-[#09090b] text-slate-800 dark:text-slate-100 select-none font-sans overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-2xl border-0 shadow-xs">
            <UserCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Quản Lý Nhân Sự & Giáo Viên</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              <span>Tổng số: <strong className="text-slate-900 dark:text-white">{teachers.length}</strong></span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-300 border-0 shadow-2xs font-bold">
                Giáo viên: {teacherCount}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 shadow-2xs font-bold">
                Trợ giảng: {assistantCount}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black border-0 shadow-md transition cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Thêm Giáo Viên Mới</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0 bg-white dark:bg-[#141417] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <DataTable<TeacherCM>
          data={teachers}
          columns={columns}
          loading={loading}
          enableRowSelection={true}
          enableRowExpansion={true}
          renderSubComponent={({ row }) => (
            <TeacherDetailCard teacher={row.original} onEdit={() => handleOpenEdit(row.original)} />
          )}
          onSelectionChange={setSelectedTeachers}
          searchPlaceholder="Tìm theo tên, SĐT, tài khoản, vai trò..."
          pageSize={20}
          exportFilename="danh_sach_giao_vien"
          toolbarRight={
            selectedTeachers.length > 0 ? (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xóa {selectedTeachers.length} mục</span>
              </button>
            ) : null
          }
        />
      </div>

      {/* Modal */}
      <TeacherModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTeacher={editingTeacher}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default TeachersPage;
