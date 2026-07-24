import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Trash2, ShieldAlert, ShieldCheck, UserPlus, X, RefreshCw,
  UserCheck, Search, ChevronLeft, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../Toast';
import { useConfirm } from '../ConfirmDialog';

interface StudentItem {
  id: number;
  full_name: string;
  gender?: string;
  grade?: string;
}

interface GroupData {
  id: number;
  class_id: number;
  group_name: string;
  members: { student_id: number; full_name: string }[];
}

interface TrustedSwapStudent {
  id: number;
  class_id: number;
  student_id: number;
  student_name: string;
  gender?: string;
}

interface RelationshipsTabProps {
  classId: number;
  enrolledStudents: StudentItem[];
  onRefreshClass: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function RelationshipsTab({ classId, enrolledStudents, onRefreshClass }: RelationshipsTabProps) {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);

  // Data state
  const [friendGroups, setFriendGroups] = useState<GroupData[]>([]);
  const [conflictGroups, setConflictGroups] = useState<GroupData[]>([]);
  const [trustedSwaps, setTrustedSwaps] = useState<TrustedSwapStudent[]>([]);

  // Friend Group Creation Form
  const [newFriendGroupName, setNewFriendGroupName] = useState('');
  const [creatingFriendGroup, setCreatingFriendGroup] = useState(false);

  // Conflict Group Creation Form
  const [newConflictGroupName, setNewConflictGroupName] = useState('');
  const [creatingConflictGroup, setCreatingConflictGroup] = useState(false);

  // Multi-Select Member Modal State (Friend, Conflict & Trusted Swaps)
  const [addMemberModalGroup, setAddMemberModalGroup] = useState<{
    id: number;
    name: string;
    type: 'friend' | 'conflict' | 'trusted';
    currentMemberIds: Set<number>;
  } | null>(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const loadAllRelationships = async () => {
    setLoading(true);
    try {
      const [fg, cg, ts] = await Promise.all([
        api.getFriendGroups(classId),
        api.getConflictGroups(classId),
        api.getTrustedSwaps(classId)
      ]);
      setFriendGroups(fg || []);
      setConflictGroups(cg || []);
      setTrustedSwaps(ts || []);
    } catch (err: any) {
      showToast("Không thể tải thông tin quan hệ học sinh: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      loadAllRelationships();
    }
  }, [classId]);

  // --- 1. FRIEND GROUP HANDLERS ---
  const handleCreateFriendGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendGroupName.trim()) {
      showToast("Tên nhóm bạn không được để trống!", "warning");
      return;
    }
    try {
      await api.createFriendGroup(classId, newFriendGroupName.trim());
      showToast(`Đã tạo nhóm bạn "${newFriendGroupName}"!`, "success");
      setNewFriendGroupName('');
      setCreatingFriendGroup(false);
      loadAllRelationships();
      onRefreshClass();
    } catch (err: any) {
      showToast("Tạo nhóm bạn thất bại: " + err.message, "error");
    }
  };

  const handleDeleteFriendGroup = async (group: GroupData) => {
    const ok = await confirm({
      title: "Xóa Nhóm Bạn Bè",
      message: `Bạn có chắc muốn xóa nhóm "${group.group_name}"? Học sinh trong nhóm sẽ bị gỡ khỏi nhóm này.`,
      confirmText: "Xóa nhóm",
      type: "danger"
    });
    if (ok) {
      try {
        await api.deleteFriendGroup(classId, group.id);
        showToast("Đã xóa nhóm bạn!", "success");
        loadAllRelationships();
        onRefreshClass();
      } catch (err: any) {
        showToast("Không thể xóa nhóm: " + err.message, "error");
      }
    }
  };

  const handleRemoveFriendGroupMember = async (groupId: number, studentId: number) => {
    try {
      await api.removeFriendGroupMember(classId, groupId, studentId);
      showToast("Đã gỡ học sinh khỏi nhóm!", "success");
      loadAllRelationships();
      onRefreshClass();
    } catch (err: any) {
      showToast("Gỡ học sinh thất bại: " + err.message, "error");
    }
  };

  // --- 2. CONFLICT GROUP HANDLERS ---
  const handleCreateConflictGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConflictGroupName.trim()) {
      showToast("Tên nhóm xung đột không được để trống!", "warning");
      return;
    }
    try {
      await api.createConflictGroup(classId, newConflictGroupName.trim());
      showToast(`Đã tạo nhóm xung đột "${newConflictGroupName}"!`, "success");
      setNewConflictGroupName('');
      setCreatingConflictGroup(false);
      loadAllRelationships();
    } catch (err: any) {
      showToast("Tạo nhóm xung đột thất bại: " + err.message, "error");
    }
  };

  const handleDeleteConflictGroup = async (group: GroupData) => {
    const ok = await confirm({
      title: "Xóa Nhóm Xung Đột",
      message: `Bạn có chắc muốn xóa nhóm xung đột "${group.group_name}"?`,
      confirmText: "Xóa nhóm",
      type: "danger"
    });
    if (ok) {
      try {
        await api.deleteConflictGroup(classId, group.id);
        showToast("Đã xóa nhóm xung đột!", "success");
        loadAllRelationships();
      } catch (err: any) {
        showToast("Xóa thất bại: " + err.message, "error");
      }
    }
  };

  const handleRemoveConflictGroupMember = async (groupId: number, studentId: number) => {
    try {
      await api.removeConflictGroupMember(classId, groupId, studentId);
      showToast("Đã gỡ học sinh khỏi nhóm xung đột!", "success");
      loadAllRelationships();
    } catch (err: any) {
      showToast("Gỡ học sinh thất bại: " + err.message, "error");
    }
  };

  // --- 3. TRUSTED SWAP INDIVIDUAL HANDLERS ---
  const handleDeleteTrustedSwapStudent = async (studentId: number) => {
    try {
      await api.deleteTrustedSwapStudent(classId, studentId);
      showToast("Đã xóa khỏi danh sách tin cậy!", "success");
      loadAllRelationships();
    } catch (err: any) {
      showToast("Xóa thất bại: " + err.message, "error");
    }
  };

  const trustedStudentIds = useMemo(() => new Set(trustedSwaps.map(t => t.student_id)), [trustedSwaps]);

  // --- 4. MULTI-SELECT MEMBER MODAL HANDLERS ---
  const handleOpenAddMemberModal = (group: GroupData, type: 'friend' | 'conflict') => {
    const memberSet = new Set(group.members.map(m => m.student_id));
    setAddMemberModalGroup({
      id: group.id,
      name: group.group_name,
      type,
      currentMemberIds: memberSet
    });
    setSelectedStudentIds([]);
    setModalSearch('');
    setCurrentPage(1);
  };

  const handleOpenAddTrustedModal = () => {
    setAddMemberModalGroup({
      id: 0,
      name: 'Danh Sách Học Sinh Tin Cậy (Đổi bài cùng giới)',
      type: 'trusted',
      currentMemberIds: trustedStudentIds
    });
    setSelectedStudentIds([]);
    setModalSearch('');
    setCurrentPage(1);
  };

  const candidateStudents = useMemo(() => {
    if (!addMemberModalGroup) return [];
    return enrolledStudents.filter(st => {
      if (addMemberModalGroup.currentMemberIds.has(st.id)) return false;
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase().trim();
        const nameMatch = st.full_name?.toLowerCase().includes(q);
        const gradeMatch = st.grade?.toLowerCase().includes(q);
        if (!nameMatch && !gradeMatch) return false;
      }
      return true;
    });
  }, [enrolledStudents, addMemberModalGroup, modalSearch]);

  const totalPages = Math.ceil(candidateStudents.length / ITEMS_PER_PAGE) || 1;
  const pagedCandidates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return candidateStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [candidateStudents, currentPage]);

  const pagedCandidateIds = useMemo(() => pagedCandidates.map(c => c.id), [pagedCandidates]);
  const isPageAllSelected = pagedCandidateIds.length > 0 && pagedCandidateIds.every(id => selectedStudentIds.includes(id));

  const toggleSelectAllPage = () => {
    if (isPageAllSelected) {
      setSelectedStudentIds(selectedStudentIds.filter(id => !pagedCandidateIds.includes(id)));
    } else {
      const newSet = new Set([...selectedStudentIds, ...pagedCandidateIds]);
      setSelectedStudentIds(Array.from(newSet));
    }
  };

  const toggleStudentSelection = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(stId => stId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleBatchAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberModalGroup || selectedStudentIds.length === 0) return;
    setSubmittingBatch(true);
    try {
      if (addMemberModalGroup.type === 'friend') {
        await Promise.all(
          selectedStudentIds.map(stId => api.addFriendGroupMember(classId, addMemberModalGroup.id, stId))
        );
        showToast(`Đã thêm ${selectedStudentIds.length} học sinh vào nhóm bạn "${addMemberModalGroup.name}"!`, "success");
      } else if (addMemberModalGroup.type === 'conflict') {
        await Promise.all(
          selectedStudentIds.map(stId => api.addConflictGroupMember(classId, addMemberModalGroup.id, stId))
        );
        showToast(`Đã thêm ${selectedStudentIds.length} học sinh vào nhóm xung đột "${addMemberModalGroup.name}"!`, "success");
      } else if (addMemberModalGroup.type === 'trusted') {
        await Promise.all(
          selectedStudentIds.map(stId => api.addTrustedSwapStudent(classId, stId))
        );
        showToast(`Đã thêm ${selectedStudentIds.length} học sinh vào danh sách tin cậy đổi bài cùng giới!`, "success");
      }
      setAddMemberModalGroup(null);
      setSelectedStudentIds([]);
      loadAllRelationships();
      onRefreshClass();
    } catch (err: any) {
      showToast("Thêm học sinh thất bại: " + err.message, "error");
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* SECTION 1: FRIEND GROUPS */}
      <div className="bg-[#0d1018] border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>Nhóm Bạn Bè (Friend Groups)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Tất cả các học sinh cùng nằm trong 1 Nhóm Bạn Bè sẽ tự động bị tính là xung đột (không ngồi cạnh nhau và tuyệt đối **không đổi bài kiểm tra cho nhau**).
            </p>
          </div>

          <button
            onClick={() => setCreatingFriendGroup(true)}
            className="group flex items-center gap-0 hover:gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer border border-white/10 shadow-md"
            title="Tạo Nhóm Bạn"
          >
            <Plus size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Tạo Nhóm Bạn
            </span>
          </button>
        </div>

        {/* Create Friend Group Form */}
        {creatingFriendGroup && (
          <form onSubmit={handleCreateFriendGroup} className="bg-[#141928] p-4 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tên Nhóm Bạn</label>
                <input
                  type="text"
                  required
                  value={newFriendGroupName}
                  onChange={(e) => setNewFriendGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm Bạn Thân 1, Nhóm A..."
                  className="w-full bg-[#0d1018] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setCreatingFriendGroup(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition border border-white/10 cursor-pointer"
              >
                Lưu Nhóm
              </button>
            </div>
          </form>
        )}

        {/* Friend Groups Cards */}
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-indigo-400" />
            <span>Đang tải danh sách...</span>
          </div>
        ) : friendGroups.length === 0 ? (
          <div className="p-5 text-center text-xs text-slate-500 font-medium bg-[#121624] rounded-xl border border-white/5">
            Chưa có nhóm bạn nào được tạo. Bấm "Tạo Nhóm Bạn" để thêm nhóm.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendGroups.map(group => (
              <div key={group.id} className="bg-[#121624] border border-indigo-500/20 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-indigo-400" />
                      <span className="text-sm font-black text-white">{group.group_name}</span>
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {group.members.length} học sinh
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteFriendGroup(group)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                      title="Xóa nhóm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Members list */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.members.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Chưa có thành viên</span>
                    ) : (
                      group.members.map(m => (
                        <span
                          key={m.student_id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-200"
                        >
                          <span>{m.full_name}</span>
                          <button
                            onClick={() => handleRemoveFriendGroupMember(group.id, m.student_id)}
                            className="hover:bg-rose-500/30 rounded p-0.5 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="Gỡ khỏi nhóm"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Add member button launching multi-select modal */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleOpenAddMemberModal(group, 'friend')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>+ Thêm học sinh vào nhóm (Chọn nhiều)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CONFLICT GROUPS */}
      <div className="bg-[#0d1018] border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <span>Nhóm Xung Đột (Conflict Groups)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Các học sinh thuộc cùng một Nhóm Xung Đột sẽ tuyệt đối không được ngồi cạnh nhau (hoặc cùng khối 2x2) và không được đổi bài kiểm tra cho nhau.
            </p>
          </div>

          <button
            onClick={() => setCreatingConflictGroup(true)}
            className="group flex items-center gap-0 hover:gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer border border-white/10 shadow-md"
            title="Tạo Nhóm Xung Đột"
          >
            <Plus size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Tạo Nhóm Xung Đột
            </span>
          </button>
        </div>

        {/* Create Conflict Group Form */}
        {creatingConflictGroup && (
          <form onSubmit={handleCreateConflictGroup} className="bg-[#141928] p-4 rounded-xl border border-rose-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tên Nhóm Xung Đột</label>
                <input
                  type="text"
                  required
                  value={newConflictGroupName}
                  onChange={(e) => setNewConflictGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm Mâu Thuẫn 1, Nhóm Xung Đột A..."
                  className="w-full bg-[#0d1018] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setCreatingConflictGroup(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition border border-white/10 cursor-pointer"
              >
                Lưu Nhóm
              </button>
            </div>
          </form>
        )}

        {/* Conflict Groups Cards */}
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-rose-400" />
            <span>Đang tải danh sách...</span>
          </div>
        ) : conflictGroups.length === 0 ? (
          <div className="p-5 text-center text-xs text-slate-500 font-medium bg-[#121624] rounded-xl border border-white/5">
            Chưa có nhóm xung đột nào. Bấm "Tạo Nhóm Xung Đột" để thêm nhóm.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conflictGroups.map(group => (
              <div key={group.id} className="bg-[#121624] border border-rose-500/20 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-rose-400" />
                      <span className="text-sm font-black text-white">{group.group_name}</span>
                      <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/20">
                        {group.members.length} học sinh
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteConflictGroup(group)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                      title="Xóa nhóm xung đột"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Members list */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.members.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Chưa có thành viên</span>
                    ) : (
                      group.members.map(m => (
                        <span
                          key={m.student_id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 border border-rose-500/25 text-rose-200"
                        >
                          <span>{m.full_name}</span>
                          <button
                            onClick={() => handleRemoveConflictGroupMember(group.id, m.student_id)}
                            className="hover:bg-rose-500/30 rounded p-0.5 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="Gỡ khỏi nhóm"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Add member button launching multi-select modal */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleOpenAddMemberModal(group, 'conflict')}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>+ Thêm học sinh vào nhóm xung đột (Chọn nhiều)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: TRUSTED SWAP INDIVIDUALS */}
      <div className="bg-[#0d1018] border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span>Học Sinh Tin Cậy Đổi Bài Cùng Giới (Trusted Swap Individuals)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Theo mặc định, thuật toán đổi bài không cho phép học sinh cùng giới tính đổi bài cho nhau. Học sinh nằm trong danh sách tin cậy này được cấp quyền đặc biệt để **đổi bài kiểm tra với bạn cùng giới** (tuy nhiên **tuyệt đối không được đổi bài với bạn thân trong cùng Nhóm Bạn**).
            </p>
          </div>

          <button
            onClick={handleOpenAddTrustedModal}
            className="group flex items-center gap-0 hover:gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer border border-white/10 shadow-lg"
            title="Thêm Học Sinh Tin Cậy"
          >
            <UserCheck size={14} className="shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[180px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden block">
              Thêm Học Sinh Tin Cậy
            </span>
          </button>
        </div>

        {/* Trusted Swap List */}
        <div className="space-y-2 pt-2">
          {trustedSwaps.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#121624] border border-white/5 text-center text-xs text-slate-500 font-medium">
              Chưa có học sinh nào được thêm vào danh sách tin cậy đổi bài cùng giới. Bấm nút phía trên để chọn nhiều học sinh.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trustedSwaps.map(ts => (
                <div
                  key={ts.id}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs font-extrabold text-amber-200"
                >
                  <ShieldCheck size={15} className="text-amber-400" />
                  <span>{ts.student_name}</span>
                  <span className="text-[10px] text-amber-400/80 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                    {ts.gender || 'Nam'}
                  </span>

                  <button
                    onClick={() => handleDeleteTrustedSwapStudent(ts.student_id)}
                    className="p-1 rounded-lg hover:bg-rose-500/30 text-amber-300 hover:text-rose-300 transition ml-1 cursor-pointer"
                    title="Gỡ khỏi danh sách tin cậy"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MULTI-SELECT ADD MEMBER MODAL (PAGINATED 10/PAGE & HIGH PERFORMANCE) */}
      {addMemberModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {addMemberModalGroup.type === 'friend' ? (
                  <Users className="h-5 w-5 text-indigo-400" />
                ) : addMemberModalGroup.type === 'conflict' ? (
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                )}
                <span>{addMemberModalGroup.type === 'trusted' ? addMemberModalGroup.name : `Thêm Thành Viên Vào ${addMemberModalGroup.name}`}</span>
              </h3>
              <button
                onClick={() => setAddMemberModalGroup(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBatchAddMembers} className="p-5 flex flex-col space-y-4 overflow-hidden flex-1">
              {/* SEARCH BAR */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => {
                    setModalSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên học sinh..."
                  className="w-full bg-[#141928] border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* SELECTION BAR & COUNTER */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={toggleSelectAllPage}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  {isPageAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>{isPageAllSelected ? 'Bỏ chọn trang này' : 'Chọn tất cả trang này'}</span>
                </button>

                <span className="text-xs font-extrabold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  Đã chọn: <span className="text-indigo-400 font-black">{selectedStudentIds.length}</span> học sinh
                </span>
              </div>

              {/* STUDENT LIST (10 ITEMS PER PAGE - ZERO LAG) */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[260px] max-h-[380px]">
                {pagedCandidates.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 font-bold bg-[#121624] rounded-xl border border-white/5">
                    Không tìm thấy học sinh phù hợp chưa thuộc danh sách này.
                  </div>
                ) : (
                  pagedCandidates.map(s => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStudentSelection(s.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${isChecked
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-sm'
                            : 'bg-[#121624] border-white/5 text-slate-300 hover:bg-white/[0.04]'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-white/20 bg-white/5'
                            }`}>
                            {isChecked && <span className="text-xs font-black">✓</span>}
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-white block">{s.full_name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {s.grade || 'Lớp 6'} | {s.gender || 'Nam'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PAGINATION BAR (10 PER PAGE) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold text-slate-300">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Trang trước</span>
                  </button>

                  <span className="text-slate-400 font-extrabold">
                    Trang <span className="text-white">{currentPage}</span> / {totalPages} (Tổng {candidateStudents.length} học sinh)
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                  >
                    <span>Trang sau</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddMemberModalGroup(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold hover:bg-white/10 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={selectedStudentIds.length === 0 || submittingBatch}
                  className="px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] disabled:opacity-50 text-white text-xs font-extrabold border border-white/20 shadow-md transition cursor-pointer"
                >
                  {submittingBatch ? 'Đang thêm...' : `Thêm (${selectedStudentIds.length}) học sinh vào danh sách`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
