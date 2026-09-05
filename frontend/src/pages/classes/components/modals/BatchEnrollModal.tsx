import React, { useState } from 'react';
import { UserPlus, X, Search, CheckSquare, Square } from 'lucide-react';
import { ClassItem, EnrolledStudent } from '../../types';
import { api } from '../../../../api';
import { showToast } from '../../../../components/Toast';

interface BatchEnrollModalProps {
  isOpen: boolean;
  selectedClass: ClassItem | null;
  allStudents: any[];
  enrolledStudents: EnrolledStudent[];
  onClose: () => void;
  onEnrolled: () => void;
}

export const BatchEnrollModal: React.FC<BatchEnrollModalProps> = ({
  isOpen,
  selectedClass,
  allStudents,
  enrolledStudents,
  onClose,
  onEnrolled,
}) => {
  const [filterByClassGrade, setFilterByClassGrade] = useState(true);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedStudentIdsToEnroll, setSelectedStudentIdsToEnroll] = useState<number[]>([]);
  const [enrollingBatch, setEnrollingBatch] = useState(false);

  if (!isOpen || !selectedClass) return null;

  // Filter candidate students for enrollment
  const enrolledStudentIds = new Set(enrolledStudents.map((s) => s.id));
  const availableStudentsForEnrollment = allStudents.filter((s) => {
    if (enrolledStudentIds.has(s.id)) return false;
    if (filterByClassGrade && selectedClass?.grade) {
      if (s.grade !== selectedClass.grade) return false;
    }
    if (enrollSearch.trim()) {
      const q = enrollSearch.toLowerCase().trim();
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchSchool = s.school?.toLowerCase().includes(q);
      const matchGrade = s.grade?.toLowerCase().includes(q);
      if (!matchName && !matchSchool && !matchGrade) return false;
    }
    return true;
  });

  const allCandidateIds = availableStudentsForEnrollment.map((s) => s.id);
  const isAllSelected =
    allCandidateIds.length > 0 && allCandidateIds.every((id) => selectedStudentIdsToEnroll.includes(id));

  const toggleSelectAllCandidate = () => {
    if (isAllSelected) {
      setSelectedStudentIdsToEnroll([]);
    } else {
      setSelectedStudentIdsToEnroll(allCandidateIds);
    }
  };

  const toggleSelectStudentToEnroll = (stId: number) => {
    if (selectedStudentIdsToEnroll.includes(stId)) {
      setSelectedStudentIdsToEnroll(selectedStudentIdsToEnroll.filter((id) => id !== stId));
    } else {
      setSelectedStudentIdsToEnroll([...selectedStudentIdsToEnroll, stId]);
    }
  };

  const handleBatchEnrollStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || selectedStudentIdsToEnroll.length === 0) return;
    setEnrollingBatch(true);
    try {
      await Promise.all(
        selectedStudentIdsToEnroll.map((stId) => api.enrollStudent(selectedClass.id, stId))
      );
      showToast(
        `Đã ghi danh ${selectedStudentIdsToEnroll.length} học sinh vào lớp ${selectedClass.class_name}!`,
        'success'
      );
      setSelectedStudentIdsToEnroll([]);
      onClose();
      onEnrolled();
    } catch (err: any) {
      showToast('Ghi danh thất bại: ' + err.message, 'error');
    } finally {
      setEnrollingBatch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
      <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            <span>Ghi Danh Học Sinh Vào Lớp: {selectedClass.class_name}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleBatchEnrollStudents} className="p-5 flex flex-col space-y-4 overflow-hidden flex-1">
          {/* TOP CONTROLS: SEARCH & GRADE FILTER */}
          <div className="space-y-3 bg-[#141928] p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Lọc học sinh thuộc khối {selectedClass.grade}:</span>
              <button
                type="button"
                onClick={() => setFilterByClassGrade(!filterByClassGrade)}
                className={`px-3 py-1 rounded-lg text-[11px] font-black border transition ${
                  filterByClassGrade
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {filterByClassGrade ? 'BẬT (Khối ' + selectedClass.grade + ')' : 'TẮT (Hiện Tất Cả)'}
              </button>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                placeholder="Tìm theo tên học sinh, trường học..."
                className="w-full bg-[#0d1018] border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          {/* SELECTION BAR & COUNTER */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={toggleSelectAllCandidate}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              <span>{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả danh sách'}</span>
            </button>

            <span className="text-xs font-extrabold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              Đã chọn: <span className="text-indigo-400">{selectedStudentIdsToEnroll.length}</span> / {availableStudentsForEnrollment.length} học sinh
            </span>
          </div>

          {/* STUDENT CHECKBOX LIST */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px] max-h-[360px]">
            {availableStudentsForEnrollment.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-bold bg-[#121624] rounded-xl border border-white/5">
                Không tìm thấy học sinh phù hợp chưa ghi danh.
              </div>
            ) : (
              availableStudentsForEnrollment.map((s) => {
                const isChecked = selectedStudentIdsToEnroll.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSelectStudentToEnroll(s.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                      isChecked
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-sm'
                        : 'bg-[#121624] border-white/5 text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-white/20 bg-white/5'
                        }`}
                      >
                        {isChecked && <span className="text-xs font-black">✓</span>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{s.full_name}</span>
                          {s.nickname && <span className="text-xs text-indigo-300 font-bold">({s.nickname})</span>}
                          {s.status && s.status !== 'Đang học' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {s.status} (kích hoạt lại)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium">
                          <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-300">{s.grade || 'Lớp 6'}</span>
                          {s.school && <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{s.school}</span>}
                          {s.gender && <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{s.gender}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ACTION FOOTER */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold hover:bg-white/10 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={selectedStudentIdsToEnroll.length === 0 || enrollingBatch}
              className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] disabled:opacity-50 text-white text-xs font-extrabold border border-white/20 shadow-md transition cursor-pointer"
            >
              {enrollingBatch ? 'Đang ghi danh...' : `Thêm (${selectedStudentIdsToEnroll.length}) học sinh vào lớp`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
