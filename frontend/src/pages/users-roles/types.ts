export interface AppUser {
  id: number;
  display_name: string;
  username: string;
  role: string;
  status: 'Hoạt động' | 'Tạm khóa' | string;
  created_at?: string;
  last_login?: string | null;
}

export interface RolePermission {
  id?: number;
  role: string;
  tab_id: string;
  can_access: number; // 0 or 1
}
