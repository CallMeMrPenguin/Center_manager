/**
 * CENTER MANAGER APP — CENTRALIZED COLOR SYSTEM & THEME CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * File duy nhất quản lý TOÀN BỘ mã màu, bảng màu giao diện, biến CSS,
 * màu sắc biểu đồ, màu badge và màu sắc các thành phần trong toàn bộ app.
 * Để thay đổi bất kỳ màu sắc nào trong ứng dụng, bạn chỉ cần sửa file này!
 */

export const THEME_COLORS = {
  // ─── 1. BỀ MẶT GIAO DIỆN (SURFACES & BACKGROUNDS) ───────────────────────
  appBackground: '#090b14',          // Nền chính tối sâu của toàn bộ ứng dụng
  sidebarBackground: '#080a12',      // Nền sidebar thanh điều hướng bên trái
  cardBackground: '#0e1222',         // Nền các thẻ card, container bảng, panel
  cardBackgroundRaised: '#12172b',   // Nền bề mặt nổi: Nút bấm, sub-card, input box
  cardBackgroundHighlight: '#1a223e',// Nền khi hover chuột vào item/nút
  navBackground: '#090d16',          // Nền thanh điều hướng phụ, segmented tab bar
  modalBackdrop: 'rgba(0, 0, 0, 0.85)', // Nền che mờ modal popup

  // ─── 2. ĐƯỜNG VIỀN GIAO DIỆN (BORDERS) ─────────────────────────────────
  borderPrimary: '#1b253b',          // Viền card, viền bảng chính
  borderSubtle: '#181f36',           // Viền ngăn cách nhẹ giữa các phần tử
  borderActive: '#2563eb',           // Viền khi được chọn, viền active
  borderHover: '#3b82f6',            // Viền khi hover
  borderGlow: 'rgba(59, 130, 246, 0.35)',

  // ─── 3. MÀU CHỮ VÀ VĂN BẢN (TYPOGRAPHY) ────────────────────────────────
  textPrimary: '#ffffff',            // Chữ chính màu trắng sáng tuyệt đối
  textSecondary: '#cbd5e1',          // Chữ phụ (Slate 300)
  textMuted: '#94a3b8',              // Chữ chú thích, mô tả (Slate 400)
  textSubtle: '#64748b',             // Chữ mờ tối (Slate 500)

  // ─── 4. MÀU CHỦ ĐẠO & ĐIỂM NHẤN (ACCENT & BRAND COLORS) ────────────────
  primary: '#2563eb',                // Màu xanh dương chủ đạo (Royal Blue)
  primaryHover: '#1d4ed8',           // Xanh dương đậm khi hover
  primaryGlow: 'rgba(37, 99, 235, 0.45)',
  primaryLight: 'rgba(37, 99, 235, 0.15)',

  indigo: '#5c36f5',                 // Màu tím Indigo (Pill highlight, accent)
  indigoHover: '#4f2ee0',
  indigoGlow: 'rgba(92, 54, 245, 0.5)',
  indigoLight: 'rgba(92, 54, 245, 0.15)',

  // ─── 5. MÀU TRẠNG THÁI VÀ CHỈ SỐ (SEMANTIC STATUS COLORS) ──────────────
  // Thành công / Xuất sắc / Có mặt (Xanh lá)
  success: '#10b981',
  successText: '#34d399',
  successBg: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.35)',

  // Cảnh báo / Khá / Cần chú ý (Hổ phách / Cam)
  warning: '#f59e0b',
  warningText: '#fbbf24',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.35)',

  // Nguy cơ / Giảm sút / Vắng mặt / Xóa (Đỏ hồng)
  danger: '#ef4444',
  dangerText: '#f87171',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.35)',

  // Thông tin / Tiến bộ / Phân tích (Xanh Cyan / Sky)
  info: '#06b6d4',
  infoText: '#22d3ee',
  infoBg: 'rgba(6, 182, 212, 0.15)',
  infoBorder: 'rgba(6, 182, 212, 0.35)',

  // Cao thủ / Nâng cao (Tím Purple)
  purple: '#a855f7',
  purpleText: '#c084fc',
  purpleBg: 'rgba(168, 85, 247, 0.15)',
  purpleBorder: 'rgba(168, 85, 247, 0.35)',

  // ─── 6. BẢNG MÀU 8 CẤP BẬC HỌC LỰC (TIER COLORS) ───────────────────────
  tiers: {
    tier8_quanQuan: '#10b981',     // Quán Quân - Emerald
    tier7_caoThu: '#06b6d4',       // Cao Thủ - Cyan
    tier6_tinhAnh: '#3b82f6',      // Tinh Anh - Blue
    tier5_kimCuong: '#8b5cf6',     // Kim Cương - Purple
    tier4_bachKim: '#ec4899',      // Bạch Kim - Pink
    tier3_vang: '#f59e0b',         // Vàng - Amber
    tier2_bac: '#94a3b8',          // Bạc - Slate
    tier1_dong: '#d97706',         // Đồng - Bronze/Brown
  },

  // ─── 7. MÀU SẮC BIỂU ĐỒ & ĐỒ THỊ (CHART PALETTE) ────────────────────────
  charts: {
    check1_vocab: '#3b82f6',       // Check 1 / Từ vựng: Xanh dương
    check2_grammar: '#a855f7',     // Check 2 / Ngữ pháp: Tím
    homework: '#10b981',           // BTVN: Xanh lá
    ema_overall: '#f59e0b',        // Điểm EMA tổng thể: Vàng hổ phách
    gridLine: 'rgba(255, 255, 255, 0.06)',
    axisText: '#94a3b8',
  }
} as const;

export type ThemeColorsType = typeof THEME_COLORS;

/**
 * Hàm nạp cấu hình Theme và cập nhật toàn bộ CSS Custom Properties lên document :root
 */
export const applyTheme = (customTheme?: any) => {
  const root = document.documentElement;

  // 1. Áp dụng bảng màu chuẩn
  root.style.setProperty('--background', THEME_COLORS.appBackground);
  root.style.setProperty('--surface', THEME_COLORS.cardBackground);
  root.style.setProperty('--surface-nav', THEME_COLORS.navBackground);
  root.style.setProperty('--surface-raised', THEME_COLORS.cardBackgroundRaised);
  root.style.setProperty('--surface-highlight', THEME_COLORS.cardBackgroundHighlight);

  root.style.setProperty('--border-color', THEME_COLORS.borderPrimary);
  root.style.setProperty('--border-subtle', THEME_COLORS.borderSubtle);
  root.style.setProperty('--border-active', THEME_COLORS.borderActive);

  root.style.setProperty('--foreground', THEME_COLORS.textPrimary);
  root.style.setProperty('--text-main', THEME_COLORS.textPrimary);
  root.style.setProperty('--text-muted', THEME_COLORS.textMuted);
  root.style.setProperty('--text-subtle', THEME_COLORS.textSubtle);

  root.style.setProperty('--primary', THEME_COLORS.primary);
  root.style.setProperty('--primary-hover', THEME_COLORS.primaryHover);
  root.style.setProperty('--primary-glow', THEME_COLORS.primaryGlow);

  root.style.setProperty('--indigo', THEME_COLORS.indigo);
  root.style.setProperty('--indigo-glow', THEME_COLORS.indigoGlow);

  root.style.setProperty('--success', THEME_COLORS.success);
  root.style.setProperty('--warning', THEME_COLORS.warning);
  root.style.setProperty('--danger', THEME_COLORS.danger);
  root.style.setProperty('--info', THEME_COLORS.info);
  root.style.setProperty('--purple', THEME_COLORS.purple);

  // 2. Glassmorphism & background image settings
  const opacity = customTheme?.opacity !== undefined ? customTheme.opacity : 0.08;
  const blur = customTheme?.blur !== undefined ? customTheme.blur : 24;
  const borderOpacity = customTheme?.borderOpacity !== undefined ? customTheme.borderOpacity : 0.15;
  const saturate = customTheme?.saturate !== undefined ? customTheme.saturate : 180;

  root.style.setProperty('--glass-bg-opacity', String(opacity));
  root.style.setProperty('--glass-blur', `${blur}px`);
  root.style.setProperty('--glass-border-opacity', String(borderOpacity));
  root.style.setProperty('--glass-saturate', `${saturate}%`);

  const bgImg = (!customTheme?.bgImage || customTheme.bgImage === 'none')
    ? 'none'
    : customTheme.bgImage;
  root.style.setProperty('--bg-image', bgImg === 'none' ? 'none' : `url('${bgImg}')`);

  let styleEl = document.getElementById('dynamic-glass-blur-styles') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-glass-blur-styles';
    document.head.appendChild(styleEl);
  }

  const glassClasses = [
    '.glass-panel',
    '.glass-panel-dark',
    '.premium-card'
  ];

  styleEl.innerHTML = `
    ${glassClasses.join(',\n')} {
      background-color: rgba(${customTheme?.bgColorRGB || '255, 255, 255'}, ${opacity});
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-color: rgba(255, 255, 255, ${borderOpacity});
    }
  `;
};
