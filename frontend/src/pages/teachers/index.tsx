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

export function TeachersPage() {
  const confirm = useConfirm();
  const [teachers, setTeachers] = useState<TeacherCM[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!silent) setLoading(true);
    try {
      const data = await api.getTeachersCM();
      setTeachers(data);
    } catch (err: any) {
      if (!silent) showToast('Không thể tải danh sách giáo viên: ' + err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
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
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
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
            <div className="w-8 h-8 rounded-full bg-[#1e2540] border border-[#343e68] flex items-center justify-center text-[#a5b4fc] font-black text-xs shrink-0 shadow-inner">
              {initial}
            </div>
            <span className="font-extrabold text-white text-sm">{t.full_name}</span>
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
          <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black border ${
            val === 'Giáo viên'
              ? 'bg-[#1e2540] border-[#343e68] text-[#a5b4fc]'
              : 'bg-[#132a22] border-[#059669] text-[#34d399]'
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
          <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/25">
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
          <a href={`tel:${ph}`} className="text-slate-300 hover:text-cyan-300 text-xs font-semibold">
            {ph}
          </a>
        ) : (
          <span className="text-slate-600 text-xs">-</span>
        );
      },
    },
    {
      id: 'dob',
      accessorKey: 'date_of_birth',
      header: 'Ngày Sinh',
      size: 120,
      cell: (info) => <span className="text-slate-300 text-xs font-medium">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'account_status',
      header: () => <div className="text-center w-full">Trạng Thái TK</div>,
      size: 110,
      cell: ({ row }) => {
        const status = row.original.account_status || 'Hoạt động';
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
              status === 'Hoạt động'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
            className="p-1.5 rounded-xl bg-white/5 hover:bg-[#5c36f5]/20 text-slate-400 hover:text-indigo-300 hover:border-[#5c36f5]/40 border border-transparent transition cursor-pointer"
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
    <div className="h-full w-full flex flex-col p-6 space-y-4 bg-[#080b14] text-slate-100 select-none font-sans overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#5c36f5]/20 text-[#5c36f5] rounded-2xl border border-[#5c36f5]/30 shadow-[0_0_15px_rgba(92,54,245,0.3)]">
            <UserCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Quản Lý Nhân Sự & Giáo Viên</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-0.5">
              <span>Tổng số: <strong className="text-white">{teachers.length}</strong></span>
              <span>•</span>
              <span className="text-[#a5b4fc]">Giáo viên: <strong>{teacherCount}</strong></span>
              <span>•</span>
              <span className="text-emerald-400">Trợ giảng: <strong>{assistantCount}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6e4af7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.45)] transition cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Thêm Giáo Viên Mới</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0 bg-[#0d1018] rounded-2xl border border-[#1b2444] overflow-hidden shadow-xl">
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
