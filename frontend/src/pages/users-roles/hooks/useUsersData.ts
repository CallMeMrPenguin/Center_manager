import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { AppUser, RolePermission } from '../types';

export const ROLES = ['Quản trị viên', 'Giáo viên', 'Trợ giảng', 'Kế toán'];

export function useUsersData() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPermissions, setSavingPermissions] = useState<boolean>(false);

  // Active view: 'users' | 'permissions' | 'system'
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'system'>('users');

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

  useEffect(() => {
    loadUsers();
    loadPermissions();
  }, [loadUsers, loadPermissions]);

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
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    editingUser,
    setEditingUser,
    loadUsers,
    loadPermissions,
    handleSavePermissions,
  };
}
