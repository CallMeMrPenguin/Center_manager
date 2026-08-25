export interface AuthUser {
  id: string;
  name: string;
  role: 'student' | 'admin';
  avatar?: string;
  className?: string;
  studentId?: number;
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isStudentUser(): boolean {
  const user = getCurrentUser();
  return user?.role === 'student';
}
