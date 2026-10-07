import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { TAB_DEFINITIONS } from '../config/tabs';
import { AuthUser } from '../utils/authUtils';

export function useUserRolePermissions(currentUser: AuthUser | null) {
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const isAdm = currentUser.role === 'admin' || (currentUser.rawRole || '').toLowerCase() === 'quản trị viên';
    if (isAdm) return;

    api.getRolePermissions()
      .then((data) => {
        if (Array.isArray(data)) setRolePermissions(data);
      })
      .catch(() => {});
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'admin' || (currentUser?.rawRole || '').toLowerCase() === 'quản trị viên';
  const isStudent = currentUser?.role === 'student';
  const userRoleKey = (currentUser?.rawRole || currentUser?.role || '').toLowerCase();

  const allowedTabIds = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return TAB_DEFINITIONS.map((t) => t.id);
    if (isStudent) return ['assignments', 'results'];

    // Check configured permissions from DB
    const matched = rolePermissions.filter((p) => (p.role || '').toLowerCase() === userRoleKey);
    if (matched.length > 0) {
      return matched.filter((p) => p.can_access === 1).map((p) => p.tab_id);
    }

    // Role-based fallbacks while loading or unconfigured
    if (currentUser.role === 'accountant') return ['dashboard', 'payments', 'invoices', 'reports'];
    if (currentUser.role === 'assistant') return ['dashboard', 'students', 'classes', 'schedule', 'assignments', 'results', 'file-manager', 'reports'];

    // Default for teachers/staff: hide admin-only pages
    const restricted = ['payments', 'invoices', 'users-roles', 'settings', 'ui-showcase'];
    return TAB_DEFINITIONS.map((t) => t.id).filter((id) => !restricted.includes(id));
  }, [currentUser, isAdmin, isStudent, userRoleKey, rolePermissions]);

  return { isAdmin, isStudent, allowedTabIds };
}
