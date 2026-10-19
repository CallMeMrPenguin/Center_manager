import { ComponentSourceItem } from '../types';

export const buttonSources: ComponentSourceItem[] = [
  {
    id: 'button-core',
    title: 'Button (Nút Bấm Đa Năng)',
    description: 'Nút chuẩn Flat UI không viền (border-0), hỗ trợ 7 variants, 7 sizes, icon, loading, disabled và active scale.',
    category: 'buttons',
    dependencies: ['lucide-react'],
    filename: 'Button.tsx',
    usageCode: `import { Button } from '@/components/button';
import { Save, Trash2, ArrowRight } from 'lucide-react';

export function Example() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" leftIcon={<Save size={14} />}>Lưu thay đổi</Button>
      <Button variant="secondary">Hủy bỏ</Button>
      <Button variant="danger" leftIcon={<Trash2 size={14} />}>Xóa mục</Button>
      <Button variant="ghost">Xem thêm</Button>
      <Button variant="success">Hoàn thành</Button>
      <Button variant="primary" loading={true}>Đang xử lý...</Button>
      <Button variant="white" size="icon"><ArrowRight size={14} /></Button>
    </div>
  );
}`,
    sourceCode: `import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonProps, ButtonVariant, ButtonSize } from './types';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_2px_10px_rgba(15,23,42,0.16),0_0_6px_rgba(15,23,42,0.08)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.22),0_0_8px_rgba(15,23,42,0.10)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] border-0 active:scale-[0.98]',
  secondary:
    'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-100 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] active:scale-[0.98]',
  danger:
    'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-0 hover:shadow-[0_2px_10px_rgba(15,23,42,0.10),0_0_4px_rgba(15,23,42,0.05)] active:scale-[0.98]',
  outline:
    'bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-800 dark:text-slate-100 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] active:scale-[0.98]',
  white:
    'bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-800 dark:text-slate-100 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] active:scale-[0.98]',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_2px_10px_rgba(15,23,42,0.16),0_0_6px_rgba(15,23,42,0.08)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.22),0_0_8px_rgba(15,23,42,0.10)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] border-0 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded-lg gap-1 font-bold',
  sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-1.5 font-bold',
  md: 'px-3.5 py-2 text-xs rounded-xl gap-2 font-bold',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2.5 font-extrabold',
  'icon-xs': 'p-1.5 rounded-lg justify-center text-xs shrink-0',
  'icon-sm': 'p-1.5 sm:p-2 rounded-xl justify-center text-xs shrink-0',
  icon: 'p-2 rounded-xl justify-center text-xs shrink-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';
    const variantClass = variantStyles[variant] || variantStyles.secondary;
    const sizeClass = sizeStyles[size] || sizeStyles.md;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={\`\${baseClasses} \${variantClass} \${sizeClass} \${className}\`}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;`,
    typesCode: `export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'white' | 'success';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-xs' | 'icon-sm' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}`
  },
  {
    id: 'button-single-pen',
    title: 'SinglePenButton (Nút Bút Sửa Duy Nhất)',
    description: 'Chuẩn Single Pen Action Button theo AGENTS.md Rule 3.5. Loại bỏ thùng rác rời rạc trên hàng, đặt nút xóa an toàn bên trong modal.',
    category: 'buttons',
    dependencies: ['lucide-react'],
    filename: 'SinglePenButton.tsx',
    usageCode: `import { SinglePenButton } from '@/components/button';

export function Example({ onEdit }: { onEdit: () => void }) {
  return (
    <SinglePenButton
      onClick={onEdit}
      title="Chỉnh sửa bản ghi (Xóa đặt trong modal)"
    />
  );
}`,
    sourceCode: `import React from 'react';
import { Edit3 } from 'lucide-react';

export interface SinglePenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
}

export const SinglePenButton: React.FC<SinglePenButtonProps> = ({
  onClick,
  title = 'Chỉnh sửa bản ghi (Xóa nằm trong modal chỉnh sửa)',
  size = 15,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={\`p-1.5 rounded-lg bg-white dark:bg-[#181a20] text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition cursor-pointer border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed \${className}\`}
      {...props}
    >
      <Edit3 size={size} />
    </button>
  );
};

export default SinglePenButton;`
  },
  {
    id: 'button-zoom-group',
    title: 'ZoomButtonGroup (Nhóm Điều Khiển Phóng To / Thu Nhỏ)',
    description: 'Cụm nút điều khiển zoom in, zoom out và reset góc nhìn cho canvas đồ thị, sơ đồ chỗ ngồi hoặc tài liệu.',
    category: 'buttons',
    dependencies: ['lucide-react'],
    filename: 'ZoomButtonGroup.tsx',
    usageCode: `import { ZoomButtonGroup } from '@/components/button';
import { useState } from 'react';

export function Example() {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  return (
    <ZoomButtonGroup
      zoomLevel={zoomLevel}
      setZoomLevel={setZoomLevel}
      setPanOffset={setPanOffset}
      minZoom={0.5}
      maxZoom={2.0}
    />
  );
}`,
    sourceCode: `import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ZoomButtonGroupProps {
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  className?: string;
}

export const ZoomButtonGroup: React.FC<ZoomButtonGroupProps> = ({
  setZoomLevel,
  setPanOffset,
  minZoom = 0.6,
  maxZoom = 2.5,
  step = 0.2,
  className = '',
}) => {
  return (
    <div
      className={\`flex items-center gap-0.5 bg-white dark:bg-[#181a20] rounded-xl p-0.5 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)] !h-8 \${className}\`}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.min(maxZoom, Number((z + step).toFixed(2))))}
        title="Phóng to"
        className="!p-1.5 text-slate-700 dark:text-slate-200"
      >
        <ZoomIn size={14} />
      </Button>

      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        onClick={() => setZoomLevel((z) => Math.max(minZoom, Number((z - step).toFixed(2))))}
        title="Thu nhỏ"
        className="!p-1.5 text-slate-700 dark:text-slate-200"
      >
        <ZoomOut size={14} />
      </Button>

      {setPanOffset && (
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={() => {
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          title="Đặt lại ban đầu"
          className="!p-1.5 text-slate-700 dark:text-slate-200"
        >
          <RotateCcw size={13} />
        </Button>
      )}
    </div>
  );
};`
  },
  {
    id: 'button-collapse',
    title: 'CollapseButton (Nút Mở Rộng / Thu Gọn)',
    description: 'Nút icon thu gọn hoặc mở rộng danh sách, khối tìm kiếm nâng cao với icon mũi tên đảo hướng.',
    category: 'buttons',
    dependencies: ['lucide-react'],
    filename: 'CollapseButton.tsx',
    usageCode: `import { CollapseButton } from '@/components/button';
import { useState } from 'react';

export function Example() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <CollapseButton
      isCollapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
    />
  );
}`,
    sourceCode: `import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  size?: 'xs' | 'sm';
  title?: string;
  className?: string;
}

export const CollapseButton: React.FC<CollapseButtonProps> = ({
  isCollapsed,
  onToggle,
  size = 'xs',
  title,
  className = '',
}) => {
  const defaultTitle = isCollapsed ? 'Mở rộng' : 'Thu gọn';
  return (
    <Button
      type="button"
      variant="white"
      size={\`icon-\${size}\` as any}
      onClick={onToggle}
      title={title || defaultTitle}
      className={\`text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition \${className}\`}
    >
      {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
    </Button>
  );
};

export default CollapseButton;`
  }
];
