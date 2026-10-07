import React, { useState, useEffect, useRef } from 'react';
import { Shield, Save, Check, Lock, Plus, Trash2 } from 'lucide-react';
import { TAB_DEFINITIONS } from '../../../config/tabs';
import { RolePermission } from '../types';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import { AddRoleModal } from '../components/AddRoleModal';

interface PermissionsTabProps {
  permissions: RolePermission[];
  saving: boolean;
  onSave: (updated: RolePermission[]) => void;
  onRolesChanged?: () => void;
  onOpenAddRoleModal?: () => void;
  newlyCreatedRole?: string | null;
  onClearNewlyCreatedRole?: () => void;
}

interface RoleItem {
  id?: number;
  role_name: string;
  display_name: string;
  is_system?: number;
}

const DEFAULT_SYSTEM_ROLES = [
  'Quản trị viên',
  'Giáo viên',
  'Trợ giảng',
  'Học sinh',
  'Kế toán',
];

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  permissions,
  saving,
  onSave,
  onRolesChanged,
  onOpenAddRoleModal,
  newlyCreatedRole,
  onClearNewlyCreatedRole,
}) => {
  const confirm = useConfirm();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [roles, setRoles] = useState<string[]>(DEFAULT_SYSTEM_ROLES);
  const [roleItems, setRoleItems] = useState<RoleItem[]>([]);
  const [localMap, setLocalMap] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
  const [highlightedRole, setHighlightedRole] = useState<string | null>(null);

  const loadRoles = async () => {
    try {
      const data = await api.getRoles();
      if (Array.isArray(data) && data.length > 0) {
        setRoleItems(data);
        const names = data.map((r: any) => r.role_name);
        setRoles(names);
      }
    } catch {
      // Fallback to default system roles
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Handle external or internal new role creation highlight & auto scroll
  useEffect(() => {
    if (newlyCreatedRole) {
      setHighlightedRole(newlyCreatedRole);
      loadRoles();
      setTimeout(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTo({
            left: tableContainerRef.current.scrollWidth,
            behavior: 'smooth',
          });
        }
      }, 150);
      const timer = setTimeout(() => {
        setHighlightedRole(null);
        onClearNewlyCreatedRole?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedRole, onClearNewlyCreatedRole]);

  // Initialize permission matrix from DB or sensible defaults
  useEffect(() => {
    const map: Record<string, boolean> = {};

    TAB_DEFINITIONS.forEach((tab) => {
      // Admin: always true
      map[`Quản trị viên__${tab.id}`] = true;

      // Teacher defaults
      const teacherRestricted = ['payments', 'invoices', 'users-roles', 'settings', 'ui-showcase'];
      map[`Giáo viên__${tab.id}`] = !teacherRestricted.includes(tab.id);

      // Teaching Assistant defaults
      const assistantAllowed = ['dashboard', 'students', 'classes', 'schedule', 'assignments', 'results', 'file-manager', 'reports'];
      map[`Trợ giảng__${tab.id}`] = assistantAllowed.includes(tab.id);

      // Accountant defaults
      const accountantAllowed = ['dashboard', 'payments', 'invoices', 'reports'];
      map[`Kế toán__${tab.id}`] = accountantAllowed.includes(tab.id);
    });

    // Override with saved DB permissions
    permissions.forEach((p) => {
      map[`${p.role}__${p.tab_id}`] = p.can_access === 1;
    });

    setLocalMap(map);
    setIsDirty(false);
  }, [permissions]);

  const handleToggle = (role: string, tabId: string) => {
    if (role === 'Quản trị viên') return;
    const key = `${role}__${tabId}`;
    setLocalMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const list: RolePermission[] = [];
    roles.forEach((role) => {
      TAB_DEFINITIONS.forEach((tab) => {
        const key = `${role}__${tab.id}`;
        list.push({
          role,
          tab_id: tab.id,
          can_access: localMap[key] ? 1 : 0,
        });
      });
    });
    onSave(list);
    setIsDirty(false);
  };

  const handleOpenAddModal = () => {
    if (onOpenAddRoleModal) {
      onOpenAddRoleModal();
    } else {
      setIsInternalModalOpen(true);
    }
  };

  const handleInternalRoleSuccess = async (createdName: string) => {
    await loadRoles();
    onRolesChanged?.();
    setHighlightedRole(createdName);
    setTimeout(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTo({
          left: tableContainerRef.current.scrollWidth,
          behavior: 'smooth',
        });
      }
    }, 150);
    setTimeout(() => {
      setHighlightedRole(null);
    }, 3500);
  };

  const handleDeleteRole = async (roleName: string) => {
    const ok = await confirm({
      title: 'Xóa vai trò',
      message: `Bạn có chắc muốn xóa vai trò "${roleName}"? Toàn bộ phân quyền của vai trò này sẽ bị gỡ bỏ.`,
      confirmText: 'Xóa vai trò',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteRole(roleName);
      showToast(`Đã xóa vai trò "${roleName}"!`, 'success');
      await loadRoles();
      onRolesChanged?.();
      setLocalMap((prev) => {
        const next = { ...prev };
        TAB_DEFINITIONS.forEach((tab) => {
          delete next[`${roleName}__${tab.id}`];
        });
        return next;
      });
    } catch (err: any) {
      showToast('Không thể xóa: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Ma Trận Phân Quyền Truy Cập Tab
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Cấu hình các tab được phép hiển thị và truy cập cho từng vai trò người dùng trong hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer active:scale-95 border-0"
          >
            <Plus size={14} />
            <span>Thêm Role</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 border-0 ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs'
            }`}
          >
            <Save size={14} />
            <span>{saving ? 'Đang lưu...' : isDirty ? 'Lưu Phân Quyền *' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Role Management Card (Add & Delete Roles) */}
      <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Danh sách vai trò:</span>
            {roles.map((r) => {
              const item = roleItems.find((x) => x.role_name === r);
              const isSystem = item ? item.is_system === 1 : DEFAULT_SYSTEM_ROLES.includes(r);
              const isThisHighlighted = highlightedRole === r;
              return (
                <span
                  key={r}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isThisHighlighted
                      ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {isSystem && <Lock size={11} className="text-purple-500" />}
                  <span>{r}</span>
                  {!isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(r)}
                      className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                      title={`Xóa vai trò ${r}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={13} />
            <span>Thêm Role</span>
          </button>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-[#111728] border-0 rounded-2xl overflow-hidden shadow-sm">
        <div ref={tableContainerRef} className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#161d30] border-b border-slate-200 dark:border-white/10 text-xs font-black uppercase text-slate-900 dark:text-white">
                <th className="py-3.5 px-4 min-w-[200px]">Tính Năng / Tab</th>
                {roles.map((role) => {
                  const isThisHighlighted = highlightedRole === role;
                  return (
                    <th
                      key={role}
                      className={`py-3.5 px-4 text-center min-w-[130px] transition-all duration-300 ${
                        isThisHighlighted ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400' : ''
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {role === 'Quản trị viên' && <Lock size={12} className="text-purple-500 dark:text-purple-400" />}
                        <span>{role}</span>
                        {isThisHighlighted && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400 text-black font-black uppercase">
                            MỚI
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
              {TAB_DEFINITIONS.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <tr
                    key={tab.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-white dark:bg-[#111728]' : 'bg-slate-50/70 dark:bg-[#141b2e]'
                    } hover:bg-blue-100/70 dark:hover:bg-blue-950/40 transition-colors`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                          <Icon size={14} />
                        </div>
                        <span>{tab.label}</span>
                      </div>
                    </td>

                    {roles.map((role) => {
                      const key = `${role}__${tab.id}`;
                      const isChecked = !!localMap[key];
                      const isAdmin = role === 'Quản trị viên';
                      const isThisHighlighted = highlightedRole === role;

                      return (
                        <td
                          key={role}
                          className={`py-3 px-4 text-center transition-all duration-300 ${
                            isThisHighlighted ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggle(role, tab.id)}
                            disabled={isAdmin}
                            className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition cursor-pointer ${
                              isAdmin
                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 cursor-default'
                                : isChecked
                                ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                : 'bg-slate-100 dark:bg-[#121626] border border-slate-300 dark:border-[#263152] hover:border-slate-400 dark:hover:border-slate-500 text-transparent'
                            }`}
                          >
                            <Check size={13} strokeWidth={3} className={isChecked || isAdmin ? 'opacity-100' : 'opacity-0'} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Add Role Modal fallback */}
      <AddRoleModal
        isOpen={isInternalModalOpen}
        onClose={() => setIsInternalModalOpen(false)}
        existingRoles={roles}
        onSuccess={handleInternalRoleSuccess}
      />
    </div>
  );
};
