import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  UserCheck, UserPlus, Edit3, Trash2, Phone, Calendar, RefreshCw, X
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';
import { DataTable } from '../components/DataTable';

interface TeacherCM {
  id: number;
  full_name: string;
  role: 'Giáo viên' | 'Trợ giảng';
  date_of_birth?: string;
  phone?: string;
  notes?: string;
}

export default function TeachersPage() {
  const confirm = useConfirm();
  const [teachers, setTeachers] = useState<TeacherCM[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherCM | null>(null);
  const [formData, setFormData] = useState<Partial<TeacherCM>>({
    full_name: '',
    role: 'Giáo viên',
    date_of_birth: '',
    phone: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getTeachersCM();
      setTeachers(data);
    } catch (err: any) {
      showToast("Không thể tải danh sách giáo viên: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      full_name: '',
      role: 'Giáo viên',
      date_of_birth: '',
      phone: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherCM) => {
    setEditingTeacher(t);
    setFormData({ ...t });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name?.trim()) {
      showToast("Họ tên không được để trống!", "error");
      return;
    }
    try {
      if (editingTeacher) {
        await api.updateTeacherCM(editingTeacher.id, formData);
        showToast("Đã cập nhật thông tin giáo viên!", "success");
      } else {
        await api.createTeacherCM(formData);
        showToast("Đã thêm giáo viên thành công!", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Lỗi khi lưu: " + err.message, "error");
    }
  };

  const handleDelete = async (t: TeacherCM) => {
    const ok = await confirm({
      title: "Xóa Giáo Viên",
      message: `Bạn có chắc chắn muốn xóa giáo viên ${t.full_name}?`,
      confirmText: "Xóa",
      type: "danger"
    });
    if (ok) {
      try {
        await api.deleteTeacherCM(t.id);
        showToast("Đã xóa giáo viên!", "success");
        loadData();
      } catch (err: any) {
        showToast("Không thể xóa: " + err.message, "error");
      }
    }
  };

  const columns = useMemo<ColumnDef<TeacherCM>[]>(() => [
    {
      accessorKey: 'full_name',
      header: 'Họ và Tên',
      cell: (info) => (
        <span className="font-extrabold text-white text-xs">{info.getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Vai trò',
      cell: (info) => {
        const val = info.getValue<string>();
        return (
          <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${
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
      accessorKey: 'date_of_birth',
      header: 'Ngày sinh',
      cell: (info) => {
        const dob = info.getValue<string>();
        return dob ? (
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar size={11} className="text-slate-500" />
            <span>{dob}</span>
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Số điện thoại',
      cell: (info) => {
        const phone = info.getValue<string>();
        return phone ? (
          <a href={`tel:${phone}`} className="text-indigo-400 font-mono flex items-center gap-1 hover:underline">
            <Phone size={11} />
            <span>{phone}</span>
          </a>
        ) : (
          <span className="text-slate-600">—</span>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: 'Ghi chú',
      cell: (info) => (
        <span className="text-slate-400 max-w-xs truncate">{info.getValue<string>() || '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right w-full">Thao tác</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 rounded-lg bg-[#1a213a] hover:bg-[#252e50] text-indigo-300 border border-[#374368] transition cursor-pointer"
            title="Chỉnh sửa nhân sự"
          >
            <Edit3 size={13} />
          </button>
        </div>
      ),
    },
  ], []);

  const totalTeachers = teachers.filter(t => t.role === 'Giáo viên').length;
  const totalTAs = teachers.filter(t => t.role === 'Trợ giảng').length;

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <UserCheck className="h-7 w-7 text-indigo-400" />
            Quản Lý Giáo Viên & Trợ Giảng
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Quản lý đội ngũ giáo viên, trợ giảng, thông tin liên lạc và lịch làm việc.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="group flex items-center gap-0 hover:gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition-all duration-300 cursor-pointer border border-white/20 active:scale-95"
          title="Thêm Nhân Sự Mới"
        >
          <UserPlus size={16} className="shrink-0" />
          <span className="max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
            Thêm Nhân Sự Mới
          </span>
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card-purple p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">Tổng Nhân Sự</span>
            <span className="text-2xl font-black text-white">{teachers.length}</span>
          </div>
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="kpi-card-blue p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Giáo Viên Main</span>
            <span className="text-2xl font-black text-cyan-400">{totalTeachers}</span>
          </div>
          <div className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="kpi-card-green p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Trợ Giảng (TA)</span>
            <span className="text-2xl font-black text-emerald-400">{totalTAs}</span>
          </div>
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <UserCheck size={22} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-[380px] bg-[#0f1320] border border-[#28334e] rounded-2xl overflow-hidden flex flex-col">
        <DataTable
          data={teachers}
          columns={columns}
          loading={loading}
          loadingMessage="Đang tải dữ liệu nhân sự..."
          emptyMessage="Chưa có thông tin giáo viên nào"
          searchPlaceholder="Tìm theo tên, SĐT..."
          pageSize={20}
          toolbarRight={
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-[#1c243c] hover:bg-[#253050] text-slate-300 border border-[#303d62] transition cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : ''} />
            </button>
          }
        />
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" />
                <span>{editingTeacher ? 'Cập Nhật Nhân Sự' : 'Thêm Nhân Sự Mới'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Họ và Tên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nhập tên giáo viên / trợ giảng"
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vai Trò
                </label>
                <CustomSelect
                  value={formData.role || 'Giáo viên'}
                  onChange={(val) => setFormData({ ...formData, role: val as any })}
                  options={[
                    { value: 'Giáo viên', label: 'Giáo viên' },
                    { value: 'Trợ giảng', label: 'Trợ giảng' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ngày Sinh
                </label>
                <CustomDatePicker
                  value={formData.date_of_birth || ''}
                  onChange={(val) => setFormData({ ...formData, date_of_birth: val })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Số Điện Thoại
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="SĐT liên hệ"
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ghi Chú
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                {editingTeacher ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      handleDelete(editingTeacher);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Xóa Nhân Sự</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold shadow-[0_4px_12px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20"
                  >
                    Lưu Thông Tin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
