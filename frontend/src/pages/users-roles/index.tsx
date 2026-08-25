import React from 'react';
import { UserCog } from 'lucide-react';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useUsersData } from './hooks/useUsersData';
import { UsersTab } from './tabs/UsersTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { SystemSettingsTab } from './tabs/SystemSettingsTab';
import { UserModal } from './components/UserModal';
import { AppUser } from './types';

export const UsersRolesPage: React.FC = () => {
  const {
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
    handleSavePermissions,
  } = useUsersData();

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Header Banner */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <UserCog size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wide">
              Quản Lý Tài Khoản & Phân Quyền Vai Trò
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Thiết lập tài khoản người dùng, phân quyền truy cập tab hệ thống và cấu hình đồng bộ.
            </p>
          </div>
        </div>

        {/* Segmented Control */}
        <SegmentedControl<'users' | 'permissions' | 'system'>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'users', label: 'Tài Khoản Người Dùng' },
            { value: 'permissions', label: 'Phân Quyền Vai Trò' },
            { value: 'system', label: 'Hệ Thống & Đồng Bộ' },
          ]}
          activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
          size="md"
        />
      </div>

      {/* 2. Sub-views */}
      <div className="space-y-4">
        {activeTab === 'users' ? (
          <UsersTab
            users={users}
            loading={loading}
            onEditUser={handleOpenEditModal}
            onOpenCreateModal={handleOpenCreateModal}
          />
        ) : activeTab === 'permissions' ? (
          <PermissionsTab
            permissions={permissions}
            saving={savingPermissions}
            onSave={handleSavePermissions}
          />
        ) : (
          <SystemSettingsTab />
        )}
      </div>

      {/* 3. Create / Edit User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        onSuccess={loadUsers}
      />
    </div>
  );
};

export default UsersRolesPage;
