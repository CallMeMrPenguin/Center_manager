export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  role: 'student' | 'admin' | 'teacher' | 'assistant' | 'accountant';
  rawRole?: string;
  status?: string;
  avatar?: string;
  className?: string;
  studentId?: number;
  lastLogin?: string;
  token?: string;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export function saveAuthToken(token: string, remember = true): void {
  try {
    if (remember) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token');
    }
  } catch {}
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  } catch {}
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser, remember = true): void {
  const jsonStr = JSON.stringify(user);
  if (remember) {
    localStorage.setItem('auth_user', jsonStr);
    localStorage.setItem('remember_me', 'true');
    if (user.username) {
      localStorage.setItem('saved_username', user.username);
    }
  } else {
    sessionStorage.setItem('auth_user', jsonStr);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('remember_me');
  }
  if (user.token) {
    saveAuthToken(user.token, remember);
  }
}

export function clearAuthUser(): void {
  localStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_user');
  localStorage.removeItem('remember_me');
  clearAuthToken();
}

export function getSavedUsername(): string {
  return localStorage.getItem('saved_username') || '';
}

export function isStudentUser(): boolean {
  const user = getCurrentUser();
  return user?.role === 'student';
}

