export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  role: 'student' | 'admin' | 'manager' | 'teacher' | 'assistant' | 'accountant' | 'staff';
  rawRole?: string;
  status?: string;
  avatar?: string;
  className?: string;
  studentId?: number;
  lastLogin?: string;
  token?: string;
}

export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.trim().split('.');
    if (parts.length < 2) return true;
    let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const jsonStr = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr);
    if (!payload.exp) return false;
    return Math.floor(Date.now() / 1000) >= payload.exp;
  } catch {
    return false;
  }
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

