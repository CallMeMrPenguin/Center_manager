import React, { useState } from 'react';
import { Users, Plus, Trash2, UserPlus, X, RefreshCw } from 'lucide-react';
import { GroupData } from './types';
import { showToast } from '../../Toast';

interface FriendGroupsSectionProps {
  friendGroups: GroupData[];
  loading: boolean;
  onOpenAddMember: (group: GroupData) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onDeleteGroup: (group: GroupData) => Promise<void>;
  onRemoveMember: (groupId: number, studentId: number) => Promise<void>;
}

export const FriendGroupsSection: React.FC<FriendGroupsSectionProps> = ({
  friendGroups,
  loading,
  onOpenAddMember,
  onCreateGroup,
  onDeleteGroup,
  onRemoveMember,
}) => {
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast('Tên nhóm bạn không được để trống!', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateGroup(groupName.trim());
      setGroupName('');
      setCreating(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SECTION HEADER (Directly on page, zero outer card wrapper) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Nhóm Bạn Bè</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Học sinh cùng nhóm bạn sẽ không ngồi cạnh nhau và không chuyển bài cho nhau.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs border-0"
        >
          <Plus size={14} />
          <span>Tạo Nhóm Bạn</span>
        </button>
      </div>

      {/* CREATE FORM (Single clean card) */}
      {creating && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#121626] border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-2xl shadow-xs space-y-3"
        >
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Tên Nhóm Bạn
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ví dụ: Nhóm Bạn Thân 1, Nhóm A..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-400 text-xs font-bold transition cursor-pointer border-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition border-0 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu Nhóm'}
            </button>
          </div>
        </form>
      )}

      {/* GROUPS GRID (Single visual boundary per card) */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-indigo-500" />
          <span>Đang tải danh sách nhóm bạn...</span>
        </div>
      ) : friendGroups.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 font-medium bg-white dark:bg-[#121626] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          Chưa có nhóm bạn nào được tạo. Bấm "Tạo Nhóm Bạn" để thêm nhóm.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friendGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-xs hover:shadow-sm transition"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {group.group_name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      ({group.members.length} HS)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteGroup(group)}
                    className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition cursor-pointer border-0"
                    title="Xóa nhóm"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Member chips with clean neutral background */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {group.members.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Chưa có thành viên</span>
                  ) : (
                    group.members.map((m) => (
                      <span
                        key={m.student_id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200"
                      >
                        <span>{m.full_name}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveMember(group.id, m.student_id)}
                          className="hover:bg-rose-100 dark:hover:bg-rose-500/30 rounded p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition cursor-pointer border-0"
                          title="Gỡ khỏi nhóm"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Add member button */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => onOpenAddMember(group)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer border-0 bg-transparent"
                >
                  <UserPlus size={13} />
                  <span>+ Thêm học sinh vào nhóm</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
