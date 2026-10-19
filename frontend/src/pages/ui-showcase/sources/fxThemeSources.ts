import { ComponentSourceItem } from '../types';

export const fxThemeSources: ComponentSourceItem[] = [
  {
    id: 'theme-tokens',
    title: 'Design Tokens & Single Class Color (tokens.ts)',
    description: 'Bảng màu chuẩn hóa duy nhất toàn ứng dụng (AGENTS.md Rule 3.7 & 10.1). Bao gồm token surfaces, border, chữ và hàm cấp màu lớp cố định xuyên suốt app.',
    category: 'tokens',
    dependencies: [],
    filename: 'tokens.ts',
    usageCode: `import { DARK_THEME_COLORS, getDeterministicClassColor } from '@/theme';

export function Example() {
  // Lấy màu cố định cho lớp học dựa theo ID hoặc tên lớp
  const classStyle = getDeterministicClassColor('Lớp 12A1 Toán');

  return (
    <div className="flex items-center gap-3">
      <div
        className="px-3 py-1.5 rounded-xl font-bold text-xs"
        style={{ backgroundColor: classStyle.bg, color: classStyle.text }}
      >
        12A1 Toán (Màu đồng bộ Lịch & Lớp)
      </div>
    </div>
  );
}`,
    sourceCode: `export const THEME_COLORS = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

// Deterministic class color palette (1 Class - 1 Color rule)
const CLASS_PALETTES = [
  { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', border: '#2563eb' },
  { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: '#10b981' },
  { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333ea', border: '#a855f7' },
  { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: '#f59e0b' },
  { bg: 'rgba(236, 72, 153, 0.12)', text: '#db2777', border: '#ec4899' },
];

export function getDeterministicClassColor(identifier: string | number) {
  const str = String(identifier || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CLASS_PALETTES.length;
  return CLASS_PALETTES[index];
}`
  },
  {
    id: 'fx-dock',
    title: 'Dock (macOS Interactive Magnification Dock)',
    description: 'Thanh dock phóng to biểu tượng kiểu macOS với vật lý lò xo mượt mà khi rê chuột.',
    category: 'fx',
    dependencies: ['framer-motion'],
    filename: 'dock.tsx',
    usageCode: `import { Dock, DockItem, DockIcon, DockLabel } from '@/components/ui/dock';
import { Compass, Calendar, Layers } from 'lucide-react';

export function Example() {
  return (
    <Dock>
      <DockItem onClick={() => console.log('La bàn')}>
        <DockIcon><Compass className="w-6 h-6 text-blue-500" /></DockIcon>
        <DockLabel>La Bàn</DockLabel>
      </DockItem>
      <DockItem onClick={() => console.log('Lịch học')}>
        <DockIcon><Calendar className="w-6 h-6 text-purple-500" /></DockIcon>
        <DockLabel>Lịch Học</DockLabel>
      </DockItem>
    </Dock>
  );
}`,
    sourceCode: `import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function Dock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={\`flex items-end h-16 gap-3 px-4 pb-3 rounded-2xl bg-white dark:bg-[#181a20] shadow-xl border border-slate-200 dark:border-white/10 \${className}\`}
    >
      {React.Children.map(children, (child) => {
        return React.isValidElement(child) ? React.cloneElement(child as any, { mouseX }) : child;
      })}
    </motion.div>
  );
}

export function DockItem({ children, onClick, mouseX }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onClick={onClick}
      className="aspect-square rounded-2xl flex items-center justify-center cursor-pointer bg-slate-100 dark:bg-white/10"
    >
      {children}
    </motion.div>
  );
}

export function DockIcon({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center">{children}</div>;
}

export function DockLabel({ children }: { children: React.ReactNode }) {
  return null;
}`
  },
  {
    id: 'fx-liquid-button',
    title: 'LiquidFillButton (Nút Rót Nước Sóng Lỏng)',
    description: 'Nút tương tác với hiệu ứng sóng nước dâng đầy theo phần trăm tiến độ, hoàn hảo cho các tác vụ lưu dữ liệu, nạp file.',
    category: 'fx',
    dependencies: ['framer-motion'],
    filename: 'liquid-button.tsx',
    usageCode: `import { LiquidFillButton } from '@/components/ui/liquid-button';
import { Save } from 'lucide-react';
import { useState } from 'react';

export function Example() {
  const [level, setLevel] = useState(70);

  return (
    <LiquidFillButton
      level={level}
      variant="indigo"
      icon={<Save size={16} />}
      onClick={() => setLevel((l) => (l >= 100 ? 0 : l + 20))}
    >
      Lưu Dữ Liệu ({level}%)
    </LiquidFillButton>
  );
}`,
    sourceCode: `import React from 'react';

export function LiquidFillButton({ children, level = 50, icon, onClick, variant = 'indigo' }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-5 py-2.5 rounded-xl font-bold text-xs text-white overflow-hidden bg-slate-800 border-0 cursor-pointer shadow-md"
    >
      <div
        className="absolute inset-0 bg-blue-600 transition-all duration-300 pointer-events-none"
        style={{ top: \`\${100 - level}%\` }}
      />
      <div className="relative z-10 flex items-center gap-2">
        {icon}
        <span>{children}</span>
      </div>
    </button>
  );
}`
  }
];
