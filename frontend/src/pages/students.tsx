import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Users, UserPlus, Edit3, Trash2, CheckCircle2, XCircle, 
  Phone, Home, GraduationCap, Calendar, RefreshCw, X, AlertCircle, Upload
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { VietnameseInput } from '../components/VietnameseInput';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';
import { Student } from '../types';
import { DataTable } from '../components/DataTable';

import { getLocalDateStr, notifyDataChanged } from '../utils';

export default function StudentsPage() {
  const confirm = useConfirm();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Duplicate Name Warning Modal State
  const [duplicateWarningMsg, setDuplicateWarningMsg] = useState<string | null>(null);
  const [highlightMissingFields, setHighlightMissingFields] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
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
    status: 'Đang học'
  });

  // CSV Import Preview Modal State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);

  const loadData = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: any) {
      if (!isSilent) showToast("Không thể tải danh sách học sinh: " + err.message, "error");
    } finally {
      if (!isSilent) setLoading(false);
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
      status: 'Đang học'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setDuplicateWarningMsg(null);
    setHighlightMissingFields(false);
    setFormData({ ...st });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = formData.full_name?.trim();
    if (!nameTrim) {
      showToast("Vui lòng nhập họ và tên học sinh", "warning");
      return;
    }

    // Check for duplicate name in existing student list
    // If another student has the same name AND same grade (or missing grade), flag as duplicate needing details.
    // If that student name is the same with another but different grade, then it's OK and no extra info is required.
    const formGradeTrim = formData.grade?.trim().toLowerCase() || '';
    const isDuplicateName = students.some(s => {
      if (s.id === editingStudent?.id) return false;
      const sNameTrim = s.full_name.trim().toLowerCase();
      if (sNameTrim !== nameTrim.toLowerCase()) return false;

      const sGradeTrim = s.grade?.trim().toLowerCase() || '';
      // If both have explicit grades and they are different, it's NOT a duplicate conflict
      if (formGradeTrim && sGradeTrim && formGradeTrim !== sGradeTrim) {
        return false;
      }
      return true;
    });

    if (isDuplicateName) {
      const missing: string[] = [];
      if (!formData.date_of_birth?.trim()) missing.push("Ngày sinh");
      if (!formData.grade?.trim()) missing.push("Khối lớp");
      if (!formData.gender?.trim()) missing.push("Giới tính");
      if (!formData.school?.trim()) missing.push("Trường học");

      if (missing.length > 0) {
        setHighlightMissingFields(true);
        setDuplicateWarningMsg(
          `Hệ thống phát hiện học sinh trùng tên "${nameTrim}" đã tồn tại! ` +
          `Vì bị trùng tên, bạn BẮT BUỘC phải điền bổ sung đầy đủ thông tin định danh: ` +
          `${missing.join(', ')} để hệ thống phân biệt hai học sinh.`
        );
        return;
      }
    }

    try {
      if (editingStudent && editingStudent.id) {
        await api.updateStudent(editingStudent.id, formData);
        showToast("Đã cập nhật thông tin học sinh!", "success");
      } else {
        await api.createStudent(formData);
        showToast("Đã thêm học sinh mới thành công!", "success");
      }
      setModalOpen(false);
      setHighlightMissingFields(false);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast("Không thể lưu dữ liệu: " + err.message, "error");
    }
  };

  const handleDelete = async (st: Student) => {
    if (!st.id) return;
    const isConfirmed = await confirm({
      title: "Xóa Học Sinh",
      message: `Bạn có chắc chắn muốn xóa học sinh ${st.full_name}? Dữ liệu điểm số và lịch học liên quan sẽ bị xóa!`,
      confirmText: "Xóa học sinh",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;

    try {
      await api.deleteStudent(st.id);
      showToast("Đã xóa học sinh!", "success");
      setModalOpen(false);
      loadData(true);
      notifyDataChanged();
    } catch (err: any) {
      showToast("Không thể xóa: " + err.message, "error");
    }
  };

  const totalActive = students.filter(s => s.status === 'Đang học').length;
  const totalQuit = students.filter(s => s.status === 'Đã nghỉ').length;

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="text-center w-full">STT</div>,
      cell: ({ row }) => <div className="text-center font-bold text-slate-400">{row.index + 1}</div>,
    },
    {
      id: 'name',
      accessorKey: 'full_name',
      header: 'Họ và Tên (Biệt danh)',
      cell: ({ row }) => {
        const st = row.original;
        return (
          <div className="font-black text-white text-base">
            {st.full_name}{st.nickname ? ` - ${st.nickname}` : ''}
          </div>
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
          <span className="inline-block px-2.5 py-1 rounded-lg text-sm font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {classes}
          </span>
        ) : (
          <span className="text-slate-500 text-sm font-semibold">Chưa xếp lớp</span>
        );
      },
    },
    {
      id: 'grade',
      accessorKey: 'grade',
      header: 'Khối',
      cell: ({ row }) => (
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-sm font-extrabold bg-[#222b48] text-indigo-300 border border-indigo-500/20">
          {row.original.grade || 'Lớp 6'}
        </span>
      ),
    },
    {
      id: 'gender',
      accessorKey: 'gender',
      header: 'Giới Tính',
      cell: ({ row }) => (
        <span className="text-slate-300 font-semibold text-sm sm:text-base">
          {row.original.gender || 'Nam'}
        </span>
      ),
    },
    {
      id: 'dob',
      accessorKey: 'date_of_birth',
      header: 'Ngày Sinh',
      cell: (info) => (
        <span className="text-slate-300 font-medium text-sm sm:text-base">
          {info.getValue<string>() || '-'}
        </span>
      ),
    },
    {
      id: 'school',
      accessorKey: 'school',
      header: 'Trường Học',
      cell: (info) => <span className="text-slate-300 font-medium text-sm sm:text-base">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'parents',
      header: 'Phụ Huynh',
      cell: ({ row }) => {
        const st = row.original;
        return (
          <div className="text-slate-300 text-sm sm:text-base font-medium">
            {st.father_name && <div>Bố: {st.father_name} ({st.father_phone || 'Chưa có SĐT'})</div>}
            {st.mother_name && <div>Mẹ: {st.mother_name} ({st.mother_phone || 'Chưa có SĐT'})</div>}
            {!st.father_name && !st.mother_name && <span className="text-slate-500">-</span>}
          </div>
        );
      },
    },
    {
      id: 'enrollDate',
      accessorKey: 'enroll_date',
      header: 'Ngày Nhập Học',
      cell: (info) => <span className="text-slate-300 font-medium text-sm sm:text-base">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Trạng Thái</div>,
      cell: (info) => {
        const st = info.getValue<string>();
        return (
          <div className="text-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
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
      cell: ({ row }) => (
        <div className="text-center">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
            title="Chỉnh sửa hồ sơ học sinh"
          >
            <Edit3 size={13} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 select-none bg-[#0d101d] font-sans scrollbar-thin">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-indigo-400" />
            Quản Lý Học Sinh
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Quản lý hồ sơ học sinh, thông tin phụ huynh, biệt danh và lớp học đang theo học.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#14192b] hover:bg-[#1e2640] text-slate-300 hover:text-white border border-[#28334e] transition cursor-pointer shadow-sm"
            title="Làm mới danh sách học sinh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="group flex items-center gap-0 hover:gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition-all duration-300 cursor-pointer border border-white/20 active:scale-95"
            title="Thêm Học Sinh Mới"
          >
            <UserPlus size={16} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Thêm Học Sinh Mới
            </span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card-purple p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">Tổng Học Sinh</span>
            <span className="text-2xl font-black text-white">{students.length}</span>
          </div>
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card-green p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Đang Học</span>
            <span className="text-2xl font-black text-emerald-400">{totalActive}</span>
          </div>
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="kpi-card-red p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block">Đã Nghỉ Học</span>
            <span className="text-2xl font-black text-rose-400">{totalQuit}</span>
          </div>
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-[#14192b] border border-[#28334e] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <DataTable
          data={students}
          columns={columns}
          loading={loading}
          enableColumnVisibility={true}
          enableRowSelection={true}
          searchPlaceholder="Tìm theo tên, SĐT, biệt danh, trường..."
          loadingMessage="Đang tải danh sách học sinh..."
          emptyMessage="Không tìm thấy học sinh nào phù hợp."
          pageSize={20}
        />
      </div>

      {/* DUPLICATE NAME WARNING MODAL */}
      {duplicateWarningMsg && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-mac-dropdown">
          <div className="bg-[#14192b] border-2 border-rose-500/50 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">CẢNH BÁO TRÙNG TÊN HỌC SINH!</h3>
                <p className="text-xs text-slate-300 font-semibold mt-1 leading-relaxed">
                  {duplicateWarningMsg}
                </p>
              </div>
            </div>

            <div className="bg-[#1c243c] border border-rose-500/30 p-3.5 rounded-xl text-xs font-bold text-rose-300 space-y-1">
              <span>Bắt buộc phải điền đầy đủ 4 thông tin định danh:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-200">
                <li>1. Ngày Sinh (Date of Birth)</li>
                <li>2. Khối Lớp (Grade)</li>
                <li>3. Giới Tính (Gender)</li>
                <li>4. Trường Học (School)</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDuplicateWarningMsg(null)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer shadow-lg"
              >
                Bổ Sung Thông Tin Ngay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141828]">
              <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                {editingStudent ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Họ và Tên <span className="text-rose-400">*</span>
                  </label>
                  <VietnameseInput
                    type="text"
                    required
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nhập tên học sinh"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider mb-1.5">
                    Biệt Danh
                  </label>
                  <VietnameseInput
                    type="text"
                    value={formData.nickname || ''}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Ví dụ: Nhím, Bo, Ken..."
                    className="w-full bg-[#181d2e] border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                    highlightMissingFields && !formData.gender ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    Giới Tính {highlightMissingFields && <span className="text-rose-400">* (Định danh)</span>}
                  </label>
                  <CustomSelect
                    value={formData.gender || 'Nam'}
                    onChange={(val) => setFormData({ ...formData, gender: val })}
                    options={[
                      { value: 'Nam', label: 'Nam' },
                      { value: 'Nữ', label: 'Nữ' },
                      { value: 'Khác', label: 'Khác' }
                    ]}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                    highlightMissingFields && !formData.grade ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    Khối Lớp {highlightMissingFields && <span className="text-rose-400">* (Định danh)</span>}
                  </label>
                  <CustomSelect
                    value={formData.grade || 'Lớp 6'}
                    onChange={(val) => setFormData({ ...formData, grade: val })}
                    options={['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map(g => ({ value: g, label: g }))}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                    highlightMissingFields && !formData.date_of_birth ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    Ngày Sinh {highlightMissingFields && <span className="text-rose-400">* (Định danh)</span>}
                  </label>
                  <CustomDatePicker
                    value={formData.date_of_birth || ''}
                    onChange={(val) => setFormData({ ...formData, date_of_birth: val })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Ngày Nhập Học
                  </label>
                  <CustomDatePicker
                    value={formData.enroll_date || ''}
                    onChange={(val) => setFormData({ ...formData, enroll_date: val })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                    highlightMissingFields && !formData.school ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    Trường Học {highlightMissingFields && <span className="text-rose-400">* (Định danh)</span>}
                  </label>
                  <VietnameseInput
                    type="text"
                    value={formData.school || ''}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="Ví dụ: THCS Lê Quý Đôn"
                    className={`w-full bg-[#181d2e] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-semibold border ${
                      highlightMissingFields && !formData.school ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'border-white/10 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Họ Tên Bố
                  </label>
                  <VietnameseInput
                    type="text"
                    value={formData.father_name || ''}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Tên bố"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    SĐT Bố
                  </label>
                  <input
                    type="text"
                    value={formData.father_phone || ''}
                    onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
                    placeholder="Số điện thoại bố"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Họ Tên Mẹ
                  </label>
                  <VietnameseInput
                    type="text"
                    value={formData.mother_name || ''}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    placeholder="Tên mẹ"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    SĐT Mẹ
                  </label>
                  <input
                    type="text"
                    value={formData.mother_phone || ''}
                    onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
                    placeholder="Số điện thoại mẹ"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Địa Chỉ Nhà
                  </label>
                  <VietnameseInput
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Địa chỉ thường trú"
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Trạng Thái
                  </label>
                  <select
                    value={formData.status || 'Đang học'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Đã nghỉ">Đã nghỉ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
                <div>
                  {editingStudent && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingStudent)}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Xóa Học Sinh Này</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#252c42] text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold border border-white/20 transition cursor-pointer shadow-md"
                  >
                    {editingStudent ? 'Cập Nhật' : 'Tạo Mới'}
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
