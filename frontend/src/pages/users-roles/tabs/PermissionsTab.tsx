import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Plus, Trash2 } from 'lucide-react';
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

const PROTECTED_ROLES = ['Quản trị viên'];

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  permissions,
  saving,
  onSave,
  onRolesChanged,
  onOpenAddRoleModal,
  newlyCreatedRole,
  onClearNewlyCreatedRole,
}) => {
  const [roles, setRoles] = useState<string[]>([
    'Quản trị viên',
    'Giáo viên',
    'Trợ giảng',
    'Học sinh',
    'Kế toán',
  ]);
  const [roleItems, setRoleItems] = useState<RoleItem[]>([]);
  const [localMap, setLocalMap] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
  const [highlightedRole, setHighlightedRole] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const confirm = useConfirm();

  const loadRoles = async () => {
    try {
      const list = await api.getRoles();
      if (Array.isArray(list) && list.length > 0) {
        setRoleItems(list);
        setRoles(list.map((r: any) => r.role_name));
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (newlyCreatedRole) {
      setHighlightedRole(newlyCreatedRole);
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

  // Initialize permission matrix
  useEffect(() => {
    const map: Record<string, boolean> = {};

    TAB_DEFINITIONS.forEach((tab) => {
      // Admin: full access
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
    if (role === 'Quản trị viên' && (tabId === 'users' || tabId === 'roles')) {
      showToast('Quản trị viên cần giữ quyền truy cập tài khoản để quản trị hệ thống', 'info');
      return;
    }
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
    if (PROTECTED_ROLES.includes(roleName)) {
      showToast('Không thể xóa vai trò Quản trị viên hệ thống', 'warning');
      return;
    }
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
    <div className="space-y-3.5">
      {/* Unified Role List & Action Toolbar (Single Clean Container) */}
      <div className="bg-white dark:bg-[#111728] border border-slate-200/90 dark:border-white/10 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Role Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            Vai trò:
          </span>
          {roles.map((r) => {
            const isRootAdmin = PROTECTED_ROLES.includes(r);
            const isThisHighlighted = highlightedRole === r;
            return (
              <span
                key={r}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isThisHighlighted
                    ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400'
                    : isRootAdmin
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-extrabold'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span>{r}</span>
                {!isRootAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(r)}
                    className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5 ml-0.5"
                    title={`Xóa vai trò ${r}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer active:scale-95 border-0"
          >
            <Plus size={13} />
            <span>Thêm Vai Trò</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 border ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30 animate-pulse'
                : 'bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-white/10'
            }`}
          >
            <Save size={13} />
            <span>{saving ? 'Đang lưu...' : isDirty ? 'Lưu Phân Quyền *' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-[#111728] border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
        <div ref={tableContainerRef} className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#161d30] border-b-2 border-slate-200 dark:border-white/10 text-xs font-black uppercase text-slate-800 dark:text-white">
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
                      idx % 2 === 0 ? 'bg-white dark:bg-[#111728]' : 'bg-slate-50/50 dark:bg-[#141b2e]'
                    } hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors`}
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
                            className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition cursor-pointer ${
                              isChecked
                                ? 'bg-blue-600 text-white shadow-xs border border-blue-500'
                                : 'bg-slate-100 dark:bg-[#121626] border border-slate-300 dark:border-[#263152] hover:border-slate-400 dark:hover:border-slate-500 text-transparent'
                            }`}
                          >
                            <Check size={13} strokeWidth={3} className={isChecked ? 'opacity-100' : 'opacity-0'} />
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
