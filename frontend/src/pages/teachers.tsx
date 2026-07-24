import React, { useState, useEffect } from 'react';
import { 
  UserCheck, UserPlus, Search, Edit3, Trash2, Phone, Calendar, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

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
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
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
      const data = await api.getTeachersCM(search, roleFilter);
      setTeachers(data);
    } catch (err: any) {
      showToast("Không thể tải danh sách giáo viên: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter]);

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
          className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition-all cursor-pointer border border-white/20 active:scale-95"
        >
          <UserPlus size={16} />
          <span>Thêm Nhân Nhân Sự Mới</span>
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

      {/* FILTER & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f131f] border border-white/10 p-3.5 rounded-2xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên giáo viên, số điện thoại..."
            className="w-full bg-[#161a29] border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Giáo viên">Giáo viên</option>
            <option value="Trợ giảng">Trợ giảng</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-[#161a29] hover:bg-[#20263a] text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-[380px] bg-[#0f1320] border border-[#28334e] rounded-2xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
            <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
            <span className="text-xs font-bold">Đang tải dữ liệu nhân sự...</span>
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-indigo-400/60" />
            <p className="text-sm font-black text-white">Chưa có thông tin giáo viên nào</p>
            <p className="text-xs text-slate-400">Hãy click nút thêm mới phía trên.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[#161b2e] text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-[#28334e] shadow-sm">
                <tr>
                  <th className="py-3.5 px-4">Họ và Tên</th>
                  <th className="py-3.5 px-3">Vai trò</th>
                  <th className="py-3.5 px-3">Ngày sinh</th>
                  <th className="py-3.5 px-3">Số điện thoại</th>
                  <th className="py-3.5 px-3">Ghi chú</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#28334e] font-medium bg-[#101422]">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#1a2034] transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-white text-xs">
                      {t.full_name}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        t.role === 'Giáo viên'
                          ? 'bg-[#1e2540] border-[#343e68] text-[#a5b4fc]'
                          : 'bg-[#132a22] border-[#059669] text-[#34d399]'
                      }`}>
                        {t.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {t.date_of_birth ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-500" />
                          <span>{t.date_of_birth}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {t.phone ? (
                        <a href={`tel:${t.phone}`} className="text-indigo-400 font-mono flex items-center gap-1 hover:underline">
                          <Phone size={11} />
                          <span>{t.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 max-w-xs truncate">
                      {t.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg bg-[#1a213a] hover:bg-[#252e50] text-indigo-300 border border-[#374368] transition cursor-pointer"
                          title="Sửa"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 rounded-lg bg-[#2c151c] hover:bg-[#3d1c27] text-rose-300 border border-[#dc2626]/50 transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <select
                  value={formData.role || 'Giáo viên'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Trợ giảng">Trợ giảng</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ngày Sinh
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
