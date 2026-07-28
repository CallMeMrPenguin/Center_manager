import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Briefcase, Plus, Edit3, Trash2, DollarSign, Clock, RefreshCw, X
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';

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
      const data = await api.getCourses();
      setCourses(data);
    } catch (err: any) {
      showToast("Không thể tải danh sách khóa học: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDelete = async (c: Course) => {
    const ok = await confirm({
      title: "Xóa Khóa Học",
      message: `Bạn có chắc chắn muốn xóa khóa học "${c.course_name}"?`,
      confirmText: "Xóa Ngay",
      type: "danger"
    });
    if (ok) {
      try {
        await api.deleteCourse(c.id);
        showToast("Đã xóa khóa học thành công", "success");
        if (editingCourse?.id === c.id) {
          setModalOpen(false);
        }
        loadData();
      } catch (err: any) {
        showToast("Không thể xóa: " + err.message, "error");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_name?.trim()) {
      showToast("Vui lòng nhập tên khóa học", "error");
      return;
    }

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, formData);
        showToast("Cập nhật thông tin thành công", "success");
      } else {
        await api.createCourse(formData);
        showToast("Tạo khóa học mới thành công", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Lỗi khi lưu: " + err.message, "error");
    }
  };

  const columns = useMemo<ColumnDef<Course>[]>(() => [
    {
      accessorKey: 'course_name',
      header: 'Tên Khóa Học',
      cell: (info) => (
        <span className="font-extrabold text-white text-xs">{info.getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: (info) => (
        <span className="text-slate-400 text-[11px] max-w-[260px] truncate block">
          {info.getValue<string>() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Học phí',
      cell: (info) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatVND(info.getValue<number>() || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'duration_weeks',
      header: 'Thời lượng',
      cell: (info) => {
        const weeks = info.getValue<number>();
        return weeks ? (
          <span className="flex items-center gap-1 text-slate-300">
            <Clock size={11} className="text-slate-500" />
            <span>{weeks} tuần</span>
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: (info) => {
        const status = info.getValue<string>();
        return (
          <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border ${
            status === 'Đang mở'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao Tác',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition cursor-pointer"
            title="Sửa"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="p-6 h-full flex flex-col gap-5 text-slate-200">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1018] border border-white/10 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide">Quản Lý Khóa Học</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Danh mục khóa học, học phí và lộ trình đào tạo</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#14192b] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#28334e] transition cursor-pointer shadow-sm"
            title="Tải lại danh sách khóa học"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold shadow-[0_4px_16px_rgba(92,54,245,0.4)] border border-white/20 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Tạo Khóa Học Mới</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-[380px] bg-[#0d1018] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <DataTable
          data={courses}
          columns={columns}
          loading={loading}
          loadingMessage="Đang tải dữ liệu khóa học..."
          emptyMessage="Chưa có khóa học nào."
          searchPlaceholder="Tìm theo tên khóa học, mô tả..."
          pageSize={20}
        />
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
