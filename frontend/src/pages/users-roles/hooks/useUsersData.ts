import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { AppUser, RolePermission } from '../types';
import { getUrlParam, setUrlParams, useUrlSync } from '../../../utils/navigation';

export const ROLES = ['Quản trị viên', 'Giáo viên', 'Trợ giảng', 'Học sinh', 'Kế toán'];

export function useUsersData() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPermissions, setSavingPermissions] = useState<boolean>(false);
  const [syncingStudents, setSyncingStudents] = useState<boolean>(false);

  // Active view: 'users' | 'permissions'
  const [activeTab, setActiveTabState] = useState<'users' | 'permissions'>(() => {
    const tab = getUrlParam('tab');
    if (tab === 'permissions') return 'permissions';
    return 'users';
  });

  const setActiveTab = useCallback((tab: 'users' | 'permissions') => {
    setActiveTabState(tab);
    setUrlParams({ tab });
  }, []);

  useUrlSync(() => {
    const tab = getUrlParam('tab');
    if (tab === 'permissions' || tab === 'users') {
      setActiveTabState(tab);
    }
  });

  // User modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // 1. Fetch users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('Không thể tải danh sách tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch role permissions
  const loadPermissions = useCallback(async () => {
    try {
      const data = await api.getRolePermissions();
      setPermissions(data || []);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  }, []);

  // Roles state
  const [availableRoles, setAvailableRoles] = useState<string[]>(ROLES);

  const loadRoles = useCallback(async () => {
    try {
      const data = await api.getRoles();
      if (Array.isArray(data) && data.length > 0) {
        setAvailableRoles(data.map((r: any) => r.role_name));
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadPermissions();
    loadRoles();
  }, [loadUsers, loadPermissions, loadRoles]);

  // Sync accounts for all students
  const handleSyncStudents = async () => {
    try {
      setSyncingStudents(true);
      const res = await api.syncStudentAccounts();
      showToast(`Đã đồng bộ tài khoản cho ${res.total_students || 0} học sinh!`, 'success');
      loadUsers();
    } catch (err) {
      console.error('Failed to sync student accounts:', err);
      showToast('Lỗi khi đồng bộ tài khoản học sinh: ' + err, 'error');
    } finally {
      setSyncingStudents(false);
    }
  };

  // Sync accounts for all teachers & staff
  const handleSyncStaff = async () => {
    try {
      const res = await api.syncStaffAccounts();
      showToast(`Đã đồng bộ tài khoản cho ${res.total_teachers || 0} nhân sự!`, 'success');
      loadUsers();
    } catch (err) {
      console.error('Failed to sync staff accounts:', err);
      showToast('Lỗi khi đồng bộ tài khoản nhân sự: ' + err, 'error');
    }
  };

  // Save role permissions batch
  const handleSavePermissions = async (updatedList: RolePermission[]) => {
    try {
      setSavingPermissions(true);
      await api.saveRolePermissions(updatedList);
      showToast('Đã lưu bảng phân quyền vai trò thành công!', 'success');
      loadPermissions();
    } catch (err) {
      console.error('Failed to save permissions:', err);
      showToast('Lỗi khi lưu bảng phân quyền: ' + err, 'error');
    } finally {
      setSavingPermissions(false);
    }
  };

  return {
    users,
    permissions,
    loading,
    savingPermissions,
    syncingStudents,
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    editingUser,
    setEditingUser,
    loadUsers,
    loadPermissions,
    availableRoles,
    loadRoles,
    handleSyncStudents,
    handleSyncStaff,
    handleSavePermissions,
  };
}

