import { getVietnamHoliday } from '../../utils/vietnamHolidays';

export interface ClassSession {
  id: number;
  class_id: number;
  class_name?: string;
  date: string;
  start_time: string;
  duration: number;
  status: string;
  teacher_id?: number;
  teacher_name?: string;
  notes?: string;
  color?: string;
  room?: string;
  student_count?: number;
  attended_count?: number;
  attendance_total?: number;
}

export interface DayCfg {
  checked: boolean;
  time: string;
  duration: number;
}

export const PALETTE_20 = [
  '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#fb7185',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#eab308', '#22c55e',
  '#60a5fa', '#a855f7', '#f472b6', '#38bdf8', '#e879f9'
];

export function hexToHSL(hex: string) {
  if (!hex || typeof hex !== 'string') hex = '#2563eb';
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function getPremiumStyle(status: string, hexColor = '#2563eb', isDarkParam?: boolean) {
  const isDark = isDarkParam !== undefined ? isDarkParam : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false);

  if (status === 'Hủy' || status === 'Nghỉ') {
    if (isDark) {
      return {
        bg: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
        accentColor: '#ef4444',
        color: '#fca5a5',
        titleColor: '#fda4af',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
        badgeColor: '#f87171',
        shadow: '0 1px 3px rgba(0,0,0,0.2)',
      };
    } else {
      return {
        bg: '#fef2f2',
        borderColor: '#fecaca',
        accentColor: '#ef4444',
        color: '#b91c1c',
        titleColor: '#991b1b',
        badgeBg: '#fee2e2',
        badgeColor: '#dc2626',
        shadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
      };
    }
  }

  const { h } = hexToHSL(hexColor);
  const isDone = status === 'Đã học';

  if (isDark) {
    // Sắc thái Dark Mode: Nền tối có chiều sâu, tương phản cao, chữ trắng sắc nét
    const bg = isDone ? `hsla(${h}, 35%, 16%, 0.95)` : `hsla(${h}, 42%, 18%, 0.95)`;
    const borderColor = isDone ? `hsla(${h}, 40%, 30%, 0.75)` : `hsla(${h}, 55%, 38%, 0.85)`;
    const accentColor = `hsl(${h}, 80%, 58%)`;
    const color = isDone ? `hsla(${h}, 60%, 82%, 0.95)` : `hsla(${h}, 75%, 86%, 0.98)`;
    const titleColor = '#ffffff';
    const badgeBg = isDone ? `hsla(${h}, 40%, 25%, 0.95)` : `hsla(${h}, 65%, 28%, 0.95)`;
    const badgeColor = isDone ? `hsla(${h}, 75%, 88%, 1)` : `hsla(${h}, 95%, 90%, 1)`;
    const shadow = '0 2px 6px rgba(0,0,0,0.3)';
    return { bg, borderColor, accentColor, color, titleColor, badgeBg, badgeColor, shadow };
  } else {
    // Sắc thái Light Mode: Tươi sáng, sạch sẽ, hài hòa, dải màu nhận diện rõ rệt, KHÔNG bị tối đen
    const bg = isDone 
      ? `hsla(${h}, 70%, 94%, 1)` 
      : `hsla(${h}, 80%, 92%, 1)`;
    const borderColor = isDone 
      ? `hsla(${h}, 50%, 80%, 1)` 
      : `hsla(${h}, 65%, 75%, 1)`;
    const accentColor = `hsl(${h}, 80%, 48%)`;
    const titleColor = `hsla(${h}, 85%, 24%, 1)`;
    const color = `hsla(${h}, 50%, 35%, 0.95)`;
    const badgeBg = isDone 
      ? `hsla(${h}, 50%, 85%, 1)` 
      : `hsla(${h}, 75%, 84%, 1)`;
    const badgeColor = isDone 
      ? `hsla(${h}, 85%, 22%, 1)` 
      : `hsla(${h}, 90%, 20%, 1)`;
    const shadow = '0 1px 3px rgba(15, 23, 42, 0.05)';
    return { bg, borderColor, accentColor, color, titleColor, badgeBg, badgeColor, shadow };
  }
}

export function getSessionColor(sess: ClassSession): string {
  if (sess.color && sess.color.startsWith('#')) return sess.color;
  const match = (sess.notes || '').match(/#COLOR:(#[0-9a-fA-F]{6})/);
  if (match) return match[1];
  const cid = sess.class_id || 1;
  return PALETTE_20[(cid * 3 + 1) % PALETTE_20.length];
}

export function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const str = t.trim().toLowerCase();
  const isPM = str.includes('pm') || str.includes('ch');
  const isAM = str.includes('am') || str.includes('sa');
  const clean = str.replace(/[^0-9:]/g, '');
  const parts = clean.split(':').map(Number);
  let h = parts[0] || 0;
  const m = parts[1] || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calcEndTime(start: string, mins: number): string {
  const startMin = parseTimeToMinutes(start);
  return formatMinutesToTime(startMin + mins);
}

export function timeToMin(t: string): number {
  return parseTimeToMinutes(t);
}

export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
export const DAY_HDRS = ['THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7', 'CHỦ NHẬT'];
export const DAY_NUM: Record<string, number> = {
  'Thứ 2': 1,
  'Thứ 3': 2,
  'Thứ 4': 3,
  'Thứ 5': 4,
  'Thứ 6': 5,
  'Thứ 7': 6,
  'Chủ nhật': 0,
};

export function getDynamicSessionInfo(sess: ClassSession): {
  status: 'Sắp diễn ra' | 'Đang học' | 'Đã học' | 'Nghỉ';
  statusColor: string;
  studentDisplay: string;
  isLive: boolean;
} {
  const rawStatus = (sess.status || '').trim();
  if (rawStatus === 'Nghỉ' || rawStatus === 'Hủy' || rawStatus === 'Nghỉ học') {
    return {
      status: 'Nghỉ',
      statusColor: '#ef4444',
      studentDisplay: `${sess.student_count || 0} HS (Nghỉ)`,
      isLive: false,
    };
  }

  const holiday = getVietnamHoliday(sess.date);
  const isPublicHoliday = Boolean(holiday?.isPublicHoliday);

  const attendedCount = sess.attended_count ?? 0;
  const hasActualAttendance = attendedCount > 0;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${nowYear}-${nowMonth}-${nowDay}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const sessDate = sess.date;
  const startMin = parseTimeToMinutes(sess.start_time);
  const endMin = startMin + (sess.duration || 90);

  // 1. Uu tien si so thuc te: Neu co hoc sinh di hoc (attendedCount > 0), buoi hoc da/dang dien ra (ke ca ngay le)
  if (hasActualAttendance) {
    if (sessDate < todayStr || (sessDate === todayStr && nowMinutes > endMin)) {
      return {
        status: 'Đã học',
        statusColor: '#10b981',
        studentDisplay: `${attendedCount} HS có mặt`,
        isLive: false,
      };
    }
    if (sessDate === todayStr && nowMinutes >= startMin && nowMinutes <= endMin) {
      return {
        status: 'Đang học',
        statusColor: '#f59e0b',
        studentDisplay: `${attendedCount} HS có mặt`,
        isLive: true,
      };
    }
    return {
      status: 'Đã học',
      statusColor: '#10b981',
      studentDisplay: `${attendedCount} HS có mặt`,
      isLive: false,
    };
  }

  // 2. Lich bao nghi le & khong co hoc sinh di hoc (si so = 0) -> Nghi
  if (isPublicHoliday) {
    return {
      status: 'Nghỉ',
      statusColor: '#ef4444',
      studentDisplay: holiday?.shortName ? `Nghỉ ${holiday.shortName}` : 'Nghỉ lễ',
      isLive: false,
    };
  }

  // 3. Qua khu hoac da het gio hom nay nhung si so 0/xx (khong ai di hoc) -> Nghi
  if (sessDate < todayStr || (sessDate === todayStr && nowMinutes > endMin)) {
    return {
      status: 'Nghỉ',
      statusColor: '#ef4444',
      studentDisplay: `0/${sess.student_count || sess.attendance_total || 0} HS`,
      isLive: false,
    };
  }

  // 4. Hom nay - Dang trong gio hoc
  if (sessDate === todayStr && nowMinutes >= startMin && nowMinutes <= endMin) {
    return {
      status: 'Đang học',
      statusColor: '#f59e0b',
      studentDisplay: `${sess.student_count || 0} HS`,
      isLive: true,
    };
  }

  // 5. Tuong lai hoac chua toi gio hom nay -> Sap dien ra
  return {
    status: 'Sắp diễn ra',
    statusColor: '#0ea5e9',
    studentDisplay: `${sess.student_count || 0} HS`,
    isLive: false,
  };
}

