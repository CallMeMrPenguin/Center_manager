import React from 'react';
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
