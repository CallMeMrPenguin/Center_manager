import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm shadow-blue-500/25 border border-blue-500/40 active:scale-[0.98]',
  secondary:
    'bg-slate-100 hover:bg-slate-200 dark:bg-[#151d36] dark:hover:bg-[#1d2748] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#212c4b] shadow-xs active:scale-[0.98]',
  danger:
    'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 shadow-xs active:scale-[0.98]',
  ghost:
    'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 active:scale-[0.98]',
  outline:
    'border border-slate-300 dark:border-[#212c4b] bg-white dark:bg-[#0f1528] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#151d36] shadow-xs active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-1.5 font-bold',
  md: 'px-3.5 py-2 text-xs rounded-xl gap-2 font-bold',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2.5 font-extrabold',
  icon: 'p-2 rounded-xl justify-center text-xs',
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
        className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
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
export default Button;
