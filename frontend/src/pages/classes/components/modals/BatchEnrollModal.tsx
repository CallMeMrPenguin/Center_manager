import React, { useState } from 'react';
import { X, Search, CheckSquare, Square, Trash2 } from 'lucide-react';
import { ClassItem, EnrolledStudent } from '../../types';
import { api } from '../../../../api';
import { showToast } from '../../../../components/Toast';
import { Button } from '../../../../components/button';
import { SegmentedControl } from '../../../../components/SegmentedControl';

interface BatchEnrollModalProps {
  isOpen: boolean;
  selectedClass: ClassItem | null;
  allStudents: any[];
  enrolledStudents: EnrolledStudent[];
  onClose: () => void;
  onEnrolled: () => void;
  onUnenroll?: (studentId: number) => Promise<void> | void;
}

export const BatchEnrollModal: React.FC<BatchEnrollModalProps> = ({
  isOpen,
  selectedClass,
  allStudents,
  enrolledStudents,
  onClose,
  onEnrolled,
  onUnenroll,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('available');
  const [filterByClassGrade, setFilterByClassGrade] = useState(true);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrolledSearch, setEnrolledSearch] = useState('');
  const [selectedStudentIdsToEnroll, setSelectedStudentIdsToEnroll] = useState<number[]>([]);
  const [enrollingBatch, setEnrollingBatch] = useState(false);
  const [unenrollingId, setUnenrollingId] = useState<number | null>(null);

  if (!isOpen || !selectedClass) return null;

  // Filter candidate students for enrollment (Tab 1)
  const enrolledStudentIds = new Set(enrolledStudents.map((s) => s.id));
  const availableStudentsForEnrollment = allStudents.filter((s) => {
    if (enrolledStudentIds.has(s.id)) return false;
    if (selectedClass?.grade && s.grade !== selectedClass.grade) return false;
    if (enrollSearch.trim()) {
      const q = enrollSearch.toLowerCase().trim();
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchSchool = s.school?.toLowerCase().includes(q);
      const matchGrade = s.grade?.toLowerCase().includes(q);
      if (!matchName && !matchSchool && !matchGrade) return false;
    }
    return true;
  });

  // Filter enrolled students (Tab 2)
  const filteredEnrolledStudents = enrolledStudents.filter((s) => {
    if (!enrolledSearch.trim()) return true;
    const q = enrolledSearch.toLowerCase().trim();
    const matchName = s.full_name?.toLowerCase().includes(q);
    const matchNick = s.nickname?.toLowerCase().includes(q);
    const matchSchool = (s as any).school?.toLowerCase().includes(q);
    const matchGrade = (s as any).grade?.toLowerCase().includes(q);
    return matchName || matchNick || matchSchool || matchGrade;
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
        `Đã thêm ${selectedStudentIdsToEnroll.length} học sinh vào lớp ${selectedClass.class_name}!`,
        'success'
      );
      setSelectedStudentIdsToEnroll([]);
      onEnrolled();
    } catch (err: any) {
      showToast('Ghi danh thất bại: ' + err.message, 'error');
    } finally {
      setEnrollingBatch(false);
    }
  };

  const handleUnenrollStudentFromModal = async (stId: number, stName: string) => {
    if (!selectedClass) return;
    setUnenrollingId(stId);
    try {
      if (onUnenroll) {
        await onUnenroll(stId);
      } else {
        await api.unenrollStudent(selectedClass.id, stId);
        showToast(`Đã rút học sinh ${stName} khỏi lớp!`, 'success');
        onEnrolled();
      }
    } catch (err: any) {
      showToast('Không thể rút học sinh khỏi lớp: ' + err.message, 'error');
    } finally {
      setUnenrollingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-dropdown">
      <div className="bg-white dark:bg-[#0f1320] border-0 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#14192b]">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Quản Lý Học Sinh Lớp: {selectedClass.class_name}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer border-0">
            <X size={16} />
          </button>
        </div>

        {/* SLIDING SEGMENTED CONTROL TAB PILL */}
        <div className="px-5 pt-4">
          <SegmentedControl
            options={[
              { value: 'available', label: `Thêm Học Sinh Mới (${availableStudentsForEnrollment.length})` },
              { value: 'enrolled', label: `Đang Trong Lớp (${enrolledStudents.length})` },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            size="sm"
            fit="fluid"
          />
        </div>

        {/* TAB 1: ADD NEW STUDENTS */}
        {activeTab === 'available' && (
          <form onSubmit={handleBatchEnrollStudents} className="p-5 flex flex-col space-y-4 overflow-hidden flex-1">
            {/* TOP CONTROLS: SEARCH */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                placeholder="Tìm theo tên học sinh, trường học..."
                className="w-full bg-slate-50 dark:bg-[#141928] border-0 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)]"
              />
            </div>

            {/* SELECTION BAR & COUNTER */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleSelectAllCandidate}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition cursor-pointer border-0"
              >
                {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả danh sách'}</span>
              </button>

              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border-0 shadow-2xs">
                Đã chọn: <span className="text-blue-600 dark:text-blue-400">{selectedStudentIdsToEnroll.length}</span> /{' '}
                {availableStudentsForEnrollment.length} học sinh
              </span>
            </div>

            {/* STUDENT TABLE LIST */}
            <div className="flex-1 overflow-y-auto border-0 rounded-xl bg-slate-50 dark:bg-[#141928] shadow-xs min-h-[220px] max-h-[340px]">
              <div className="sticky top-0 bg-slate-100 dark:bg-[#181f36] px-3 py-2 flex items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 z-10">
                <div className="w-8 shrink-0">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAllCandidate}
                    className="rounded accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1">Họ và tên</div>
                <div className="w-16 text-center">Khối</div>
                <div className="w-16 text-center">Giới tính</div>
                <div className="w-28 text-right">Trường</div>
              </div>

              {availableStudentsForEnrollment.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                  Không tìm thấy học sinh phù hợp chưa ghi danh.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {availableStudentsForEnrollment.map((s) => {
                    const isChecked = selectedStudentIdsToEnroll.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSelectStudentToEnroll(s.id)}
                        className={`px-3 py-2 flex items-center text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                            : 'hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectStudentToEnroll(s.id)}
                            className="rounded accent-blue-600 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 font-bold truncate">
                          {s.full_name}
                          {s.nickname && <span className="text-blue-500 font-normal ml-1">({s.nickname})</span>}
                        </div>
                        <div className="w-16 text-center text-[11px] text-slate-500 dark:text-slate-400">{s.grade || selectedClass.grade}</div>
                        <div className="w-16 text-center text-[11px] text-slate-500 dark:text-slate-400">{s.gender || '—'}</div>
                        <div className="w-28 text-right text-[11px] text-slate-400 truncate">{s.school || '—'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={onClose}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={selectedStudentIdsToEnroll.length === 0 || enrollingBatch}
                loading={enrollingBatch}
              >
                {enrollingBatch ? 'Đang thêm...' : `Thêm (${selectedStudentIdsToEnroll.length}) học sinh vào lớp`}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: CURRENT ENROLLED STUDENTS (WITH REMOVE OPTION) */}
        {activeTab === 'enrolled' && (
          <div className="p-5 flex flex-col space-y-4 overflow-hidden flex-1">
            {/* SEARCH IN ENROLLED */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={enrolledSearch}
                onChange={(e) => setEnrolledSearch(e.target.value)}
                placeholder="Tìm học sinh trong lớp theo tên, biệt danh..."
                className="w-full bg-slate-50 dark:bg-[#141928] border-0 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)]"
              />
            </div>

            {/* ENROLLED COUNTER */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Danh sách học sinh đang theo học trong lớp
              </span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border-0 shadow-2xs">
                Tổng số: <span className="text-blue-600 dark:text-blue-400">{filteredEnrolledStudents.length}</span> học sinh
              </span>
            </div>

            {/* ENROLLED TABLE LIST */}
            <div className="flex-1 overflow-y-auto border-0 rounded-xl bg-slate-50 dark:bg-[#141928] shadow-xs min-h-[220px] max-h-[340px]">
              <div className="sticky top-0 bg-slate-100 dark:bg-[#181f36] px-3 py-2 flex items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 z-10">
                <div className="w-8 shrink-0 text-center">#</div>
                <div className="flex-1">Họ và tên</div>
                <div className="w-16 text-center">Khối</div>
                <div className="w-28 text-right">Trường</div>
                <div className="w-16 text-right">Thao tác</div>
              </div>

              {filteredEnrolledStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                  Không tìm thấy học sinh nào trong lớp.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredEnrolledStudents.map((s, idx) => {
                    const isBusy = unenrollingId === s.id;
                    return (
                      <div
                        key={s.id}
                        className="px-3 py-2 flex items-center text-xs hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 transition"
                      >
                        <div className="w-8 shrink-0 text-center text-[11px] font-bold text-slate-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1 font-bold truncate">
                          {s.full_name}
                          {s.nickname && <span className="text-blue-500 font-normal ml-1">({s.nickname})</span>}
                        </div>
                        <div className="w-16 text-center text-[11px] text-slate-500 dark:text-slate-400">{s.grade || selectedClass.grade}</div>
                        <div className="w-28 text-right text-[11px] text-slate-400 truncate">{s.school || '—'}</div>
                        <div className="w-16 text-right">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUnenrollStudentFromModal(s.id, s.full_name)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer border-0"
                            title={`Bỏ học sinh ${s.full_name} khỏi lớp`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={onClose}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
