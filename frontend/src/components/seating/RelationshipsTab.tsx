import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { showToast } from '../Toast';
import { useConfirm } from '../ConfirmDialog';
import { StudentItem, GroupData, TrustedSwapStudent, AddMemberModalTarget } from './relationships/types';
import { FriendGroupsSection } from './relationships/FriendGroupsSection';
import { ConflictGroupsSection } from './relationships/ConflictGroupsSection';
import { TrustedSwapsSection } from './relationships/TrustedSwapsSection';
import { AddMemberModal } from './relationships/AddMemberModal';

interface RelationshipsTabProps {
  classId: number;
  enrolledStudents: StudentItem[];
  onRefreshClass: () => void;
}

export default function RelationshipsTab({ classId, enrolledStudents, onRefreshClass }: RelationshipsTabProps) {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);

  // Data state
  const [friendGroups, setFriendGroups] = useState<GroupData[]>([]);
  const [conflictGroups, setConflictGroups] = useState<GroupData[]>([]);
  const [trustedSwaps, setTrustedSwaps] = useState<TrustedSwapStudent[]>([]);

  // Multi-Select Member Modal Target
  const [addMemberModalGroup, setAddMemberModalGroup] = useState<AddMemberModalTarget | null>(null);

  const loadAllRelationships = async () => {
    setLoading(true);
    try {
      const [fg, cg, ts] = await Promise.all([
        api.getFriendGroups(classId),
        api.getConflictGroups(classId),
        api.getTrustedSwaps(classId),
      ]);
      setFriendGroups(fg || []);
      setConflictGroups(cg || []);
      setTrustedSwaps(ts || []);
    } catch (err: any) {
      showToast('Không thể tải thông tin quan hệ học sinh: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      loadAllRelationships();
    }
  }, [classId]);

  // Friend Group Handlers
  const handleCreateFriendGroup = async (name: string) => {
    try {
      await api.createFriendGroup(classId, name);
      showToast(`Đã tạo nhóm bạn "${name}"!`, 'success');
      loadAllRelationships();
      onRefreshClass();
    } catch (err: any) {
      showToast('Tạo nhóm bạn thất bại: ' + err.message, 'error');
    }
  };

  const handleDeleteFriendGroup = async (group: GroupData) => {
    const ok = await confirm({
      title: 'Xóa Nhóm Bạn Bè',
      message: `Bạn có chắc muốn xóa nhóm "${group.group_name}"? Học sinh trong nhóm sẽ bị gỡ khỏi nhóm này.`,
      confirmText: 'Xóa nhóm',
      type: 'danger',
    });
    if (ok) {
      try {
        await api.deleteFriendGroup(classId, group.id);
        showToast('Đã xóa nhóm bạn!', 'success');
        loadAllRelationships();
        onRefreshClass();
      } catch (err: any) {
        showToast('Không thể xóa nhóm: ' + err.message, 'error');
      }
    }
  };

  const handleRemoveFriendGroupMember = async (groupId: number, studentId: number) => {
    try {
      await api.removeFriendGroupMember(classId, groupId, studentId);
      showToast('Đã gỡ học sinh khỏi nhóm!', 'success');
      loadAllRelationships();
      onRefreshClass();
    } catch (err: any) {
      showToast('Gỡ học sinh thất bại: ' + err.message, 'error');
    }
  };

  // Conflict Group Handlers
  const handleCreateConflictGroup = async (name: string) => {
    try {
      await api.createConflictGroup(classId, name);
      showToast(`Đã tạo nhóm xung đột "${name}"!`, 'success');
      loadAllRelationships();
    } catch (err: any) {
      showToast('Tạo nhóm xung đột thất bại: ' + err.message, 'error');
    }
  };

  const handleDeleteConflictGroup = async (group: GroupData) => {
    const ok = await confirm({
      title: 'Xóa Nhóm Xung Đột',
      message: `Bạn có chắc muốn xóa nhóm xung đột "${group.group_name}"?`,
      confirmText: 'Xóa nhóm',
      type: 'danger',
    });
    if (ok) {
      try {
        await api.deleteConflictGroup(classId, group.id);
        showToast('Đã xóa nhóm xung đột!', 'success');
        loadAllRelationships();
      } catch (err: any) {
        showToast('Xóa thất bại: ' + err.message, 'error');
      }
    }
  };

  const handleRemoveConflictGroupMember = async (groupId: number, studentId: number) => {
    try {
      await api.removeConflictGroupMember(classId, groupId, studentId);
      showToast('Đã gỡ học sinh khỏi nhóm xung đột!', 'success');
      loadAllRelationships();
    } catch (err: any) {
      showToast('Gỡ học sinh thất bại: ' + err.message, 'error');
    }
  };

  // Trusted Swap Handlers
  const handleDeleteTrustedSwap = async (studentId: number) => {
    try {
      await api.deleteTrustedSwapStudent(classId, studentId);
      showToast('Đã xóa khỏi danh sách tin cậy!', 'success');
      loadAllRelationships();
    } catch (err: any) {
      showToast('Xóa thất bại: ' + err.message, 'error');
    }
  };

  // Modal open handlers
  const handleOpenAddFriendMember = (group: GroupData) => {
    setAddMemberModalGroup({
      id: group.id,
      name: group.group_name,
      type: 'friend',
      currentMemberIds: new Set(group.members.map((m) => m.student_id)),
    });
  };

  const handleOpenAddConflictMember = (group: GroupData) => {
    setAddMemberModalGroup({
      id: group.id,
      name: group.group_name,
      type: 'conflict',
      currentMemberIds: new Set(group.members.map((m) => m.student_id)),
    });
  };

  const handleOpenAddTrusted = () => {
    setAddMemberModalGroup({
      id: 0,
      name: 'Danh Sách Học Sinh Tin Cậy (Chuyển bài cùng giới)',
      type: 'trusted',
      currentMemberIds: new Set(trustedSwaps.map((t) => t.student_id)),
    });
  };

  // Batch modal submit
  const handleBatchSubmit = async (studentIds: number[]) => {
    if (!addMemberModalGroup || studentIds.length === 0) return;
    try {
      if (addMemberModalGroup.type === 'friend') {
        await Promise.all(
          studentIds.map((stId) => api.addFriendGroupMember(classId, addMemberModalGroup.id, stId))
        );
        showToast(`Đã thêm ${studentIds.length} học sinh vào nhóm bạn "${addMemberModalGroup.name}"!`, 'success');
      } else if (addMemberModalGroup.type === 'conflict') {
        await Promise.all(
          studentIds.map((stId) => api.addConflictGroupMember(classId, addMemberModalGroup.id, stId))
        );
        showToast(`Đã thêm ${studentIds.length} học sinh vào nhóm xung đột "${addMemberModalGroup.name}"!`, 'success');
      } else if (addMemberModalGroup.type === 'trusted') {
        await Promise.all(studentIds.map((stId) => api.addTrustedSwapStudent(classId, stId)));
        showToast(`Đã thêm ${studentIds.length} học sinh vào danh sách tin cậy!`, 'success');
      }
      loadAllRelationships();
      onRefreshClass();
    } catch (err: any) {
      showToast('Thêm học sinh thất bại: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 pb-8 font-sans">
      {/* 1. FRIEND GROUPS (Zero card-in-card) */}
      <FriendGroupsSection
        friendGroups={friendGroups}
        loading={loading}
        onOpenAddMember={handleOpenAddFriendMember}
        onCreateGroup={handleCreateFriendGroup}
        onDeleteGroup={handleDeleteFriendGroup}
        onRemoveMember={handleRemoveFriendGroupMember}
      />

      {/* 2. CONFLICT GROUPS (Zero card-in-card) */}
      <ConflictGroupsSection
        conflictGroups={conflictGroups}
        loading={loading}
        onOpenAddMember={handleOpenAddConflictMember}
        onCreateGroup={handleCreateConflictGroup}
        onDeleteGroup={handleDeleteConflictGroup}
        onRemoveMember={handleRemoveConflictGroupMember}
      />

      {/* 3. TRUSTED SWAP INDIVIDUALS (Zero card-in-card) */}
      <TrustedSwapsSection
        trustedSwaps={trustedSwaps}
        loading={loading}
        onOpenAddTrusted={handleOpenAddTrusted}
        onDeleteTrusted={handleDeleteTrustedSwap}
      />

      {/* 4. MULTI-SELECT ADD MEMBER MODAL */}
      {addMemberModalGroup && (
        <AddMemberModal
          target={addMemberModalGroup}
          enrolledStudents={enrolledStudents}
          onClose={() => setAddMemberModalGroup(null)}
          onSubmit={handleBatchSubmit}
        />
      )}
    </div>
  );
}
