/**
 * Vietnam National Holidays & Commemorative Dates Engine
 * Includes official Vietnam Public Holidays (Nghỉ lễ Nhà nước)
 * and Google Calendar Vietnam standard holiday feed.
 */

export interface HolidayInfo {
  date: string; // YYYY-MM-DD
  name: string;
  isPublicHoliday: boolean; // Nghỉ lễ chính thức của nhà nước
  shortName?: string;
}

// Lunar & State Holiday calendar mapping for 2024 - 2028
const VARIABLE_HOLIDAYS: Record<string, { name: string; isPublic: boolean; short?: string }> = {
  // ── 2024 ──────────────────────────────────────────────
  '2024-02-08': { name: '29 Tết Giáp Thìn', isPublic: true, short: 'Nghỉ Tết' },
  '2024-02-09': { name: '30 Tết (Giao thừa)', isPublic: true, short: 'Giao thừa' },
  '2024-02-10': { name: 'Mùng 1 Tết Giáp Thìn', isPublic: true, short: 'Mùng 1 Tết' },
  '2024-02-11': { name: 'Mùng 2 Tết Giáp Thìn', isPublic: true, short: 'Mùng 2 Tết' },
  '2024-02-12': { name: 'Mùng 3 Tết Giáp Thìn', isPublic: true, short: 'Mùng 3 Tết' },
  '2024-02-13': { name: 'Mùng 4 Tết Giáp Thìn', isPublic: true, short: 'Nghỉ Tết' },
  '2024-02-14': { name: 'Mùng 5 Tết Giáp Thìn', isPublic: true, short: 'Nghỉ Tết' },
  '2024-04-18': { name: 'Giỗ Tổ Hùng Vương (10/3 AL)', isPublic: true, short: 'Giỗ Tổ' },
  '2024-09-17': { name: 'Tết Trung thu (15/8 AL)', isPublic: false, short: 'Trung thu' },

  // ── 2025 ──────────────────────────────────────────────
  '2025-01-25': { name: '26 Tết Ất Tỵ (Nghỉ Tết)', isPublic: true, short: 'Nghỉ Tết' },
  '2025-01-26': { name: '27 Tết Ất Tỵ (Nghỉ Tết)', isPublic: true, short: 'Nghỉ Tết' },
  '2025-01-27': { name: '28 Tết Ất Tỵ (Nghỉ Tết)', isPublic: true, short: 'Nghỉ Tết' },
  '2025-01-28': { name: '29 Tết (Giao thừa)', isPublic: true, short: 'Giao thừa' },
  '2025-01-29': { name: 'Mùng 1 Tết Ất Tỵ', isPublic: true, short: 'Mùng 1 Tết' },
  '2025-01-30': { name: 'Mùng 2 Tết Ất Tỵ', isPublic: true, short: 'Mùng 2 Tết' },
  '2025-01-31': { name: 'Mùng 3 Tết Ất Tỵ', isPublic: true, short: 'Mùng 3 Tết' },
  '2025-02-01': { name: 'Mùng 4 Tết (Nghỉ Tết)', isPublic: true, short: 'Mùng 4 Tết' },
  '2025-02-02': { name: 'Mùng 5 Tết (Nghỉ Tết)', isPublic: true, short: 'Mùng 5 Tết' },
  '2025-04-07': { name: 'Giỗ Tổ Hùng Vương (10/3 AL)', isPublic: true, short: 'Giỗ Tổ' },
  '2025-10-06': { name: 'Tết Trung thu (15/8 AL)', isPublic: false, short: 'Trung thu' },

  // ── 2026 ──────────────────────────────────────────────
  '2026-02-14': { name: '27 Tết Bính Ngọ (Nghỉ Tết)', isPublic: true, short: 'Nghỉ Tết' },
  '2026-02-15': { name: '28 Tết Bính Ngọ (Nghỉ Tết)', isPublic: true, short: 'Nghỉ Tết' },
  '2026-02-16': { name: '29 Tết (Giao thừa)', isPublic: true, short: 'Giao thừa' },
  '2026-02-17': { name: 'Mùng 1 Tết Bính Ngọ', isPublic: true, short: 'Mùng 1 Tết' },
  '2026-02-18': { name: 'Mùng 2 Tết Bính Ngọ', isPublic: true, short: 'Mùng 2 Tết' },
  '2026-02-19': { name: 'Mùng 3 Tết Bính Ngọ', isPublic: true, short: 'Mùng 3 Tết' },
  '2026-02-20': { name: 'Mùng 4 Tết (Nghỉ bù)', isPublic: true, short: 'Mùng 4 Tết' },
  '2026-02-21': { name: 'Mùng 5 Tết (Nghỉ bù)', isPublic: true, short: 'Mùng 5 Tết' },
  '2026-02-22': { name: 'Mùng 6 Tết (Nghỉ Tết)', isPublic: true, short: 'Nghỉ Tết' },
  '2026-04-26': { name: 'Giỗ Tổ Hùng Vương (10/3 AL)', isPublic: true, short: 'Giỗ Tổ' },
  '2026-04-27': { name: 'Nghỉ bù Giỗ Tổ Hùng Vương', isPublic: true, short: 'Nghỉ bù' },
  '2026-09-01': { name: 'Nghỉ Lễ Quốc khánh', isPublic: true, short: 'Nghỉ Quốc khánh' },
  '2026-09-25': { name: 'Tết Trung thu (15/8 AL)', isPublic: false, short: 'Trung thu' },

  // ── 2027 ──────────────────────────────────────────────
  '2027-02-05': { name: '28 Tết Đinh Mùi', isPublic: true, short: 'Nghỉ Tết' },
  '2027-02-06': { name: 'Mùng 1 Tết Đinh Mùi', isPublic: true, short: 'Mùng 1 Tết' },
  '2027-02-07': { name: 'Mùng 2 Tết Đinh Mùi', isPublic: true, short: 'Mùng 2 Tết' },
  '2027-02-08': { name: 'Mùng 3 Tết Đinh Mùi', isPublic: true, short: 'Mùng 3 Tết' },
  '2027-04-15': { name: 'Giỗ Tổ Hùng Vương (10/3 AL)', isPublic: true, short: 'Giỗ Tổ' },
};

// Fixed solar holidays occurring every year
const FIXED_ANNUAL_HOLIDAYS: Record<string, { name: string; isPublic: boolean; short?: string }> = {
  '01-01': { name: 'Tết Dương lịch', isPublic: true, short: 'Tết DL' },
  '02-14': { name: 'Lễ Tình nhân (Valentine)', isPublic: false, short: 'Valentine' },
  '03-08': { name: 'Quốc tế Phụ nữ (8/3)', isPublic: false, short: '8/3' },
  '04-30': { name: 'Ngày Giải phóng Miền Nam', isPublic: true, short: '30/4' },
  '05-01': { name: 'Quốc tế Lao động', isPublic: true, short: '1/5' },
  '06-01': { name: 'Quốc tế Thiếu nhi', isPublic: false, short: '1/6' },
  '09-02': { name: 'Quốc khánh nước CHXHCN Việt Nam', isPublic: true, short: 'Quốc khánh' },
  '10-20': { name: 'Ngày Phụ nữ Việt Nam (20/10)', isPublic: false, short: '20/10' },
  '11-20': { name: 'Ngày Nhà giáo Việt Nam (20/11)', isPublic: false, short: '20/11' },
  '12-22': { name: 'Ngày thành lập QĐND Việt Nam', isPublic: false, short: '22/12' },
  '12-25': { name: 'Lễ Giáng sinh (Noel)', isPublic: false, short: 'Noel' },
};

// Runtime dynamic cache for Google Calendar synced events
const dynamicGoogleHolidays: Map<string, HolidayInfo> = new Map();

/**
 * Register holidays fetched from Google Calendar or backend sync
 */
export function registerGoogleHolidays(holidays: HolidayInfo[]) {
  if (!Array.isArray(holidays)) return;
  for (const h of holidays) {
    if (h && h.date) {
      dynamicGoogleHolidays.set(h.date, h);
    }
  }
}

/**
 * Get holiday details for any given date string 'YYYY-MM-DD'
 */
export function getVietnamHoliday(dateStr: string): HolidayInfo | null {
  if (!dateStr || dateStr.length < 10) return null;

  // 1. Check Google Calendar dynamic events first
  if (dynamicGoogleHolidays.has(dateStr)) {
    return dynamicGoogleHolidays.get(dateStr)!;
  }

  // 2. Check variable Lunar / State government holiday decisions
  if (VARIABLE_HOLIDAYS[dateStr]) {
    const item = VARIABLE_HOLIDAYS[dateStr];
    return {
      date: dateStr,
      name: item.name,
      isPublicHoliday: item.isPublic,
      shortName: item.short || item.name,
    };
  }

  // 3. Check fixed annual holidays (MM-DD)
  const mmdd = dateStr.slice(5, 10);
  if (FIXED_ANNUAL_HOLIDAYS[mmdd]) {
    const item = FIXED_ANNUAL_HOLIDAYS[mmdd];
    return {
      date: dateStr,
      name: item.name,
      isPublicHoliday: item.isPublic,
      shortName: item.short || item.name,
    };
  }

  return null;
}
