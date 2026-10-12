export interface AppUser {
  id: number;
  display_name: string;
  username: string;
  role: string;
  status: 'Hoạt động' | 'Tạm khóa' | string;
  plain_password?: string;
  created_at?: string;
  last_login?: string | null;
  is_online?: boolean;
  last_active?: number;
  grade?: string;
  class_name?: string;
}

export interface RolePermission {
  id?: number;
  role: string;
  tab_id: string;
  can_access: number; // 0 or 1
}
