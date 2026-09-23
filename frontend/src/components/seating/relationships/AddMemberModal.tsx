import React, { useState, useMemo } from 'react';
import {
  Users, ShieldAlert, ShieldCheck, X, Search,
  ChevronLeft, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import { StudentItem, AddMemberModalTarget } from './types';

interface AddMemberModalProps {
  target: AddMemberModalTarget;
  enrolledStudents: StudentItem[];
  onClose: () => void;
  onSubmit: (studentIds: number[]) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  target,
  enrolledStudents,
  onClose,
  onSubmit,
}) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Eligible students: enrolled students not already in this target group
  const candidateStudents = useMemo(() => {
    return enrolledStudents.filter((st) => !target.currentMemberIds.has(st.id));
  }, [enrolledStudents, target.currentMemberIds]);

  const filteredCandidates = useMemo(() => {
    if (!modalSearch.trim()) return candidateStudents;
    const q = modalSearch.toLowerCase().trim();
    return candidateStudents.filter((s) => s.full_name.toLowerCase().includes(q));
  }, [candidateStudents, modalSearch]);

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE) || 1;
  const pagedCandidates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const isPageAllSelected = useMemo(() => {
    if (pagedCandidates.length === 0) return false;
    return pagedCandidates.every((s) => selectedStudentIds.includes(s.id));
  }, [pagedCandidates, selectedStudentIds]);

  const toggleSelectAllPage = () => {
    if (isPageAllSelected) {
      const pageIds = new Set(pagedCandidates.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const toAdd = pagedCandidates.map((s) => s.id).filter((id) => !selectedStudentIds.includes(id));
      setSelectedStudentIds((prev) => [...prev, ...toAdd]);
    }
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedStudentIds);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-white dark:bg-[#121624] border border-slate-200/80 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 shrink-0">
              {target.type === 'friend' ? (
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              ) : target.type === 'conflict' ? (
                <ShieldAlert className="h-5 w-5 text-rose-500 dark:text-rose-400" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {target.type === 'trusted' ? target.name : `Thêm Học Sinh Vào ${target.name}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Chọn nhiều học sinh từ danh sách bên dưới
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer border-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 flex flex-col space-y-3 overflow-hidden flex-1">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => {
                setModalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên học sinh..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          {/* Quick Select & Counter */}
          <div className="flex items-center justify-between text-xs px-1">
            <button
              type="button"
              onClick={toggleSelectAllPage}
              className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer border-0 bg-transparent"
            >
              {isPageAllSelected ? <CheckSquare size={15} /> : <Square size={15} />}
              <span>{isPageAllSelected ? 'Bỏ chọn trang này' : 'Chọn tất cả trang này'}</span>
            </button>

            <span className="font-bold text-slate-500 dark:text-slate-400">
              Đã chọn: <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedStudentIds.length}</span> HS
            </span>
          </div>

          {/* Student Rows (Clean single-line dividers, zero card-in-card) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 pr-1 min-h-[220px] max-h-[340px]">
            {pagedCandidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy học sinh phù hợp chưa thuộc danh sách này.
              </div>
            ) : (
              pagedCandidates.map((s) => {
                const isChecked = selectedStudentIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleStudentSelection(s.id)}
                    className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5'
                        }`}
                      >
                        {isChecked && <span className="text-[10px] font-black leading-none">✓</span>}
                      </div>

                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                          {s.full_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                            {s.grade || 'Lớp 6'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                            {s.gender || 'Nam'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2 text-xs font-bold text-slate-500">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 transition cursor-pointer border-0"
              >
                <ChevronLeft size={13} />
                <span>Trước</span>
              </button>

              <span>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 transition cursor-pointer border-0"
              >
                <span>Sau</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer border-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={selectedStudentIds.length === 0 || submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black shadow-xs transition cursor-pointer border-0"
            >
              {submitting ? 'Đang thêm...' : `Thêm (${selectedStudentIds.length}) học sinh`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
