import React, { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useUsersData } from './hooks/useUsersData';
import { UsersTab } from './tabs/UsersTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { UserModal } from './components/UserModal';
import { AddRoleModal } from './components/AddRoleModal';
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
    loadPermissions,
    availableRoles,
    loadRoles,
    handleSavePermissions,
  } = useUsersData();

  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newlyCreatedRole, setNewlyCreatedRole] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleRoleCreated = async (newRole: string) => {
    await loadRoles();
    await loadPermissions();
    setNewlyCreatedRole(newRole);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[var(--background)] text-slate-900 dark:text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Transparent Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Quản Lý Tài Khoản & Phân Quyền
          </h2>
        </div>

        {/* Segmented Control */}
        <SegmentedControl<'users' | 'permissions'>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'users', label: 'Tài Khoản Người Dùng' },
            { value: 'permissions', label: 'Phân Quyền Vai Trò' },
          ]}
          activeColor="bg-[#2563eb]"
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
        ) : (
          <PermissionsTab
            permissions={permissions}
            saving={savingPermissions}
            onSave={handleSavePermissions}
            onRolesChanged={() => {
              loadRoles();
              loadPermissions();
            }}
            onOpenAddRoleModal={() => setIsAddRoleModalOpen(true)}
            newlyCreatedRole={newlyCreatedRole}
            onClearNewlyCreatedRole={() => setNewlyCreatedRole(null)}
          />
        )}
      </div>

      {/* 3. Create / Edit User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        availableRoles={availableRoles}
        onSuccess={loadUsers}
      />

      {/* 4. Add Role & Assign Permissions Modal */}
      <AddRoleModal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        existingRoles={availableRoles}
        onSuccess={handleRoleCreated}
      />
    </div>
  );
};

export default UsersRolesPage;
