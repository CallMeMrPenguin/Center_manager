import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, Check, Lock, RotateCcw } from 'lucide-react';
import { TAB_DEFINITIONS } from '../../../config/tabs';
import { RolePermission } from '../types';
import { ROLES } from '../hooks/useUsersData';

interface PermissionsTabProps {
  permissions: RolePermission[];
  saving: boolean;
  onSave: (updated: RolePermission[]) => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  permissions,
  saving,
  onSave,
}) => {
  // Map of permissions: `${role}__${tabId}` -> boolean
  const [localMap, setLocalMap] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize permission matrix from DB or sensible defaults
  useEffect(() => {
    const map: Record<string, boolean> = {};

    // 1. Sensible default permissions for all roles
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

    // 2. Override with saved DB permissions
    permissions.forEach((p) => {
      map[`${p.role}__${p.tab_id}`] = p.can_access === 1;
    });

    setLocalMap(map);
    setIsDirty(false);
  }, [permissions]);

  const handleToggle = (role: string, tabId: string) => {
    if (role === 'Quản trị viên') return; // Admin always has full access
    const key = `${role}__${tabId}`;
    setLocalMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const list: RolePermission[] = [];
    ROLES.forEach((role) => {
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

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200/90 dark:border-[#1e2742] rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Ma Trận Phân Quyền Truy Cập Tab
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cấu hình các tab được phép hiển thị và truy cập cho từng vai trò người dùng trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-lg transition cursor-pointer active:scale-95 disabled:opacity-50 ${
            isDirty
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
          }`}
        >
          <Save size={14} />
          <span>{saving ? 'Đang lưu...' : isDirty ? 'Lưu Phân Quyền *' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-[#0c0f1e] border border-slate-200/90 dark:border-[#1e2742] rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-slate-200 dark:bg-[#0b0e1a] border-b-2 border-slate-300 dark:border-[#212c4b] text-xs font-black uppercase text-slate-900 dark:text-white">
                <th className="py-3.5 px-4 min-w-[200px]">Tính Năng / Tab</th>
                {ROLES.map((role) => (
                  <th key={role} className="py-3.5 px-4 text-center min-w-[140px]">
                    <span className="inline-flex items-center gap-1">
                      {role === 'Quản trị viên' && <Lock size={12} className="text-purple-500 dark:text-purple-400" />}
                      <span>{role}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-[#212c4b] text-xs">
              {TAB_DEFINITIONS.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <tr
                    key={tab.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-white dark:bg-[#0f1528]' : 'bg-[#e2e8f0] dark:bg-[#151e38]'
                    } hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition-colors`}
                  >
                    {/* Tab Name & Icon */}
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                          <Icon size={14} />
                        </div>
                        <span>{tab.label}</span>
                      </div>
                    </td>

                    {/* Checkboxes per Role */}
                    {ROLES.map((role) => {
                      const key = `${role}__${tab.id}`;
                      const isChecked = !!localMap[key];
                      const isAdmin = role === 'Quản trị viên';

                      return (
                        <td key={role} className="py-3 px-4 text-center">
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
    </div>
  );
};
