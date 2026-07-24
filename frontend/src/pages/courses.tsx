import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Search, Edit3, Trash2, DollarSign, Clock, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

interface Course {
  id: number;
  course_name: string;
  description?: string;
  price: number;
  duration_weeks?: number;
  status: 'Đang mở' | 'Đã đóng';
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function CoursesPage() {
  const confirm = useConfirm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({
    course_name: '',
    description: '',
    price: 0,
    duration_weeks: 12,
    status: 'Đang mở'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses(search, statusFilter);
      setCourses(data);
    } catch (err: any) {
      showToast("Không thể tải danh sách khóa học: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      course_name: '',
      description: '',
      price: 0,
      duration_weeks: 12,
      status: 'Đang mở'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setFormData({ ...c });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_name?.trim()) {
      showToast("Tên khóa học không được để trống!", "error");
      return;
    }
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, formData);
        showToast("Đã cập nhật thông tin khóa học!", "success");
      } else {
        await api.createCourse(formData);
        showToast("Đã thêm khóa học mới!", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Lỗi khi lưu: " + err.message, "error");
    }
  };

  const handleDelete = async (c: Course) => {
    const ok = await confirm({
      title: "Xóa Khóa Học",
      message: `Bạn có chắc chắn muốn xóa khóa học ${c.course_name}?`,
      confirmText: "Xóa",
      type: "danger"
    });
    if (ok) {
      try {
        await api.deleteCourse(c.id);
        showToast("Đã xóa khóa học!", "success");
        loadData();
      } catch (err: any) {
        showToast("Không thể xóa: " + err.message, "error");
      }
    }
  };

  const activeCount = courses.filter(c => c.status === 'Đang mở').length;

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-indigo-400" />
            Quản Lý Khóa Học
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Danh mục các chương trình đào tạo, học phí và thời lượng khóa học.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition-all cursor-pointer border border-white/20 active:scale-95"
        >
          <Plus size={16} />
          <span>Tạo Khóa Học Mới</span>
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="kpi-card-purple p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">Tổng Chương Trình</span>
            <span className="text-2xl font-black text-white">{courses.length}</span>
          </div>
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="kpi-card-green p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Đang Mở Tuyển Sinh</span>
            <span className="text-2xl font-black text-emerald-400">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Briefcase size={22} />
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
            placeholder="Tìm theo tên khóa học, mô tả..."
            className="w-full bg-[#161a29] border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang mở">Đang mở</option>
            <option value="Đã đóng">Đã đóng</option>
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
      <div className="flex-1 min-h-[380px] bg-[#0d1018] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
            <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
            <span className="text-xs font-bold">Đang tải dữ liệu khóa học...</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-indigo-400/60" />
            <p className="text-sm font-black text-white">Chưa có khóa học nào</p>
            <p className="text-xs text-slate-500">Hãy tạo khóa học mới để bắt đầu tuyển sinh.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121624] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-white/10">
                  <th className="py-3.5 px-4">Tên Khóa Học</th>
                  <th className="py-3.5 px-3">Mô tả</th>
                  <th className="py-3.5 px-3">Học phí</th>
                  <th className="py-3.5 px-3">Thời lượng</th>
                  <th className="py-3.5 px-3">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-white text-xs">
                      {c.course_name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] max-w-[260px] truncate">
                      {c.description || '—'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                      {formatVND(c.price || 0)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {c.duration_weeks ? (
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-500" />
                          <span>{c.duration_weeks} tuần</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        c.status === 'Đang mở'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition cursor-pointer"
                          title="Sửa"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                <span>{editingCourse ? 'Cập Nhật Khóa Học' : 'Tạo Khóa Học Mới'}</span>
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
                  Tên Khóa Học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.course_name || ''}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  placeholder="Ví dụ: Tiếng Anh Giao Tiếp Căn Bản"
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mô Tả Chương Trình
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả tóm tắt nội dung học..."
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Học Phí (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Thời Lượng (Tuần)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_weeks || ''}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || undefined })}
                    placeholder="12"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  Trạng Thái
                </label>
                <select
                  value={formData.status || 'Đang mở'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="Đang mở">Đang mở</option>
                  <option value="Đã đóng">Đã đóng</option>
                </select>
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
                  Lưu Khóa Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
