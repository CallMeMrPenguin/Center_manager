import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Search, Edit3, Trash2, CheckCircle2, XCircle, 
  Phone, Home, GraduationCap, Calendar, RefreshCw, X, AlertCircle, Eye, SlidersHorizontal, Upload
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { VietnameseInput } from '../components/VietnameseInput';
import { Student } from '../types';

export default function StudentsPage() {
  const confirm = useConfirm();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Duplicate Name Warning Modal State
  const [duplicateWarningMsg, setDuplicateWarningMsg] = useState<string | null>(null);
  const [highlightMissingFields, setHighlightMissingFields] = useState<boolean>(false);

  // Column visibility state
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);
  const [visibleCols, setVisibleCols] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('student_visible_cols');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: true,
      classes: true,
      info: true,
      school: true,
      parents: true,
      enrollDate: true,
      status: true,
      actions: true
    };
  });

  useEffect(() => {
    localStorage.setItem('student_visible_cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
        setShowColPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    full_name: '',
    nickname: '',
    gender: 'Nam',
    grade: 'Lớp 6',
    date_of_birth: '',
    enroll_date: new Date().toISOString().split('T')[0],
    school: '',
    status: 'Đang học',
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
    address: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(search, statusFilter);
      setStudents(data);
    } catch (err: any) {
      showToast("Không thể tải danh sách học sinh: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setHighlightMissingFields(false);
    setFormData({
      full_name: '',
      nickname: '',
      gender: 'Nam',
      grade: 'Lớp 6',
      date_of_birth: '',
      enroll_date: new Date().toISOString().split('T')[0],
      school: '',
      status: 'Đang học',
      father_name: '',
      father_phone: '',
      mother_name: '',
      mother_phone: '',
      address: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setHighlightMissingFields(false);
    setFormData({
      full_name: st.full_name,
      nickname: st.nickname || '',
      gender: st.gender || 'Nam',
      grade: st.grade || 'Lớp 6',
      date_of_birth: st.date_of_birth || '',
      enroll_date: st.enroll_date || '',
      school: st.school || '',
      status: st.status || 'Đang học',
      father_name: st.father_name || '',
      father_phone: st.father_phone || '',
      mother_name: st.mother_name || '',
      mother_phone: st.mother_phone || '',
      address: st.address || '',
      notes: st.notes || ''
    });
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
    const isDuplicateName = students.some(
      s => s.full_name.trim().toLowerCase() === nameTrim.toLowerCase() && s.id !== editingStudent?.id
    );

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
      loadData();
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
      loadData();
    } catch (err: any) {
      showToast("Không thể xóa: " + err.message, "error");
    }
  };

  const totalActive = students.filter(s => s.status === 'Đang học').length;
  const totalQuit = students.filter(s => s.status === 'Đã nghỉ').length;

  const toggleCol = (colKey: string) => {
    setVisibleCols(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

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
        <div className="bg-[#14192b] border border-[#28334e] p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">Tổng Học Sinh</span>
            <span className="text-2xl font-black text-white">{students.length}</span>
          </div>
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-[#14192b] border border-[#28334e] p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Đang Học</span>
            <span className="text-2xl font-black text-emerald-400">{totalActive}</span>
          </div>
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-[#14192b] border border-[#28334e] p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block">Đã Nghỉ Học</span>
            <span className="text-2xl font-black text-rose-400">{totalQuit}</span>
          </div>
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* FILTER & COLUMN PICKER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14192b] border border-[#28334e] p-3.5 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <VietnameseInput
              type="text"
              placeholder="Tìm theo tên, SĐT, biệt danh, trường..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1c243c] border border-[#303d62] text-white text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1c243c] border border-[#303d62] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang học">Đang học</option>
            <option value="Đã nghỉ">Đã nghỉ</option>
          </select>
        </div>

        {/* COLUMN PICKER BUTTON */}
        <div className="relative" ref={colPickerRef}>
          <button
            onClick={() => setShowColPicker(!showColPicker)}
            className="group flex items-center gap-2 bg-[#1c243c] hover:bg-[#253050] text-slate-200 hover:text-white py-2 px-3 rounded-xl font-bold text-xs border border-[#303d62] transition-all duration-300 ease-in-out cursor-pointer overflow-hidden"
            title="Hiển Thị Cột"
          >
            <Eye size={15} className="shrink-0 text-indigo-400" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Hiển Thị Cột
            </span>
          </button>

          {showColPicker && (
            <div className="absolute right-0 mt-2 w-52 bg-[#161d33] border border-[#2d3a60] rounded-xl p-3 shadow-2xl z-30 space-y-2">
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider border-b border-white/10 pb-1.5">
                Cấu hình hiển thị cột
              </div>
              {[
                { key: 'name', label: 'Họ tên & Biệt danh' },
                { key: 'classes', label: 'Lớp Học' },
                { key: 'grade', label: 'Khối Học' },
                { key: 'gender', label: 'Giới Tính' },
                { key: 'school', label: 'Trường Học' },
                { key: 'parents', label: 'Thông tin phụ huynh' },
                { key: 'enrollDate', label: 'Ngày nhập học' },
                { key: 'status', label: 'Trạng thái' },
                { key: 'actions', label: 'Thao tác' }
              ].map(col => (
                <label key={col.key} className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer hover:text-white px-1 py-1 rounded hover:bg-[#222b48]">
                  <input
                    type="checkbox"
                    checked={!!visibleCols[col.key]}
                    onChange={() => toggleCol(col.key)}
                    className="accent-indigo-500 rounded cursor-pointer"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-[#14192b] border border-[#28334e] rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-400" />
            <span>Đang tải danh sách học sinh...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            Không tìm thấy học sinh nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#1c243c] text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-[#303d62]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  {visibleCols.name && <th className="py-3.5 px-4">Họ và Tên (Biệt danh)</th>}
                  {visibleCols.classes && <th className="py-3.5 px-4">Lớp Học</th>}
                  {visibleCols.grade && <th className="py-3.5 px-4">Khối</th>}
                  {visibleCols.gender && <th className="py-3.5 px-4">Giới Tính</th>}
                  {visibleCols.school && <th className="py-3.5 px-4">Trường Học</th>}
                  {visibleCols.parents && <th className="py-3.5 px-4">Phụ Huynh</th>}
                  {visibleCols.enrollDate && <th className="py-3.5 px-4">Ngày Nhập Học</th>}
                  {visibleCols.status && <th className="py-3.5 px-4 text-center">Trạng Thái</th>}
                  {visibleCols.actions && <th className="py-3.5 px-4 text-center w-20">Thao Tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222b45] font-medium bg-[#14192b]">
                {students.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((st, idx) => (
                  <tr key={st.id} className="hover:bg-[#1a223a] transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {visibleCols.name && (
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white text-xs">
                          {st.full_name}{st.nickname ? ` - ${st.nickname}` : ''}
                        </div>
                      </td>
                    )}

                    {visibleCols.classes && (
                      <td className="py-3.5 px-4">
                        {st.enrolled_classes ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {st.enrolled_classes}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Chưa xếp lớp</span>
                        )}
                      </td>
                    )}

                    {/* Grade Column */}
                    {visibleCols.grade && (
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#222b48] text-indigo-300 border border-indigo-500/20">
                          {st.grade || 'Lớp 6'}
                        </span>
                      </td>
                    )}

                    {/* Gender Column */}
                    {visibleCols.gender && (
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-bold text-xs">
                          <span>{st.gender || 'Nam'}</span>
                          {st.date_of_birth && <div className="text-[10px] text-slate-400 font-medium mt-0.5">Ns: {st.date_of_birth}</div>}
                        </div>
                      </td>
                    )}

                    {visibleCols.school && (
                      <td className="py-3.5 px-4 text-slate-300">
                        {st.school || '-'}
                      </td>
                    )}

                    {visibleCols.parents && (
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300">
                          {st.father_name && <div>Bố: {st.father_name} ({st.father_phone || 'Chưa có SĐT'})</div>}
                          {st.mother_name && <div>Mẹ: {st.mother_name} ({st.mother_phone || 'Chưa có SĐT'})</div>}
                          {!st.father_name && !st.mother_name && <span className="text-slate-500">-</span>}
                        </div>
                      </td>
                    )}

                    {visibleCols.enrollDate && (
                      <td className="py-3.5 px-4 text-slate-400">
                        {st.enroll_date || '-'}
                      </td>
                    )}

                    {visibleCols.status && (
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          st.status === 'Đang học'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {st.status || 'Đang học'}
                        </span>
                      </td>
                    )}

                    {/* Merged Action Button: Keep ONLY Pen (Edit) Button */}
                    {visibleCols.actions && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg bg-[#222b48] hover:bg-indigo-600 text-indigo-300 hover:text-white transition cursor-pointer"
                          title="Chỉnh sửa hồ sơ học sinh"
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {students.length > pageSize && (
              <div className="px-6 py-4 bg-[#14192b] border-t border-[#28334e] flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, students.length)} trong tổng số {students.length} học sinh
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-[#1e2540] hover:bg-[#283254] disabled:opacity-30 text-white text-xs font-bold border border-[#343e68] transition cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="px-3 text-xs text-indigo-300 font-black">
                    Trang {currentPage} / {Math.ceil(students.length / pageSize)}
                  </span>
                  <button
                    disabled={currentPage >= Math.ceil(students.length / pageSize)}
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(students.length / pageSize), p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-[#1e2540] hover:bg-[#283254] disabled:opacity-30 text-white text-xs font-bold border border-[#343e68] transition cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DUPLICATE NAME WARNING MODAL */}
      {duplicateWarningMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#14192b] border-2 border-rose-500/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 flex flex-col gap-4">
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
        </div>
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
                  <select
                    value={formData.gender || 'Nam'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className={`w-full bg-[#181d2e] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-semibold cursor-pointer border ${
                      highlightMissingFields && !formData.gender ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'border-white/10 focus:border-indigo-500'
                    }`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                    highlightMissingFields && !formData.grade ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    Khối Lớp {highlightMissingFields && <span className="text-rose-400">* (Định danh)</span>}
                  </label>
                  <select
                    value={formData.grade || 'Lớp 6'}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className={`w-full bg-[#181d2e] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-semibold cursor-pointer border ${
                      highlightMissingFields && !formData.grade ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'border-white/10 focus:border-indigo-500'
                    }`}
                  >
                    {['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                    highlightMissingFields && !formData.date_of_birth ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    Ngày Sinh {highlightMissingFields && <span className="text-rose-400">* (Định danh)</span>}
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className={`w-full bg-[#181d2e] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-semibold border ${
                      highlightMissingFields && !formData.date_of_birth ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'border-white/10 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Ngày Nhập Học
                  </label>
                  <input
                    type="date"
                    value={formData.enroll_date || ''}
                    onChange={(e) => setFormData({ ...formData, enroll_date: e.target.value })}
                    className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
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
