import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonProps, ButtonVariant, ButtonSize } from './types';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs border-0 active:scale-[0.98]',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 border-0 shadow-2xs active:scale-[0.98]',
  danger:
    'bg-rose-50 hover:bg-rose-100 text-rose-600 border-0 shadow-2xs active:scale-[0.98]',
  ghost:
    'hover:bg-slate-100 text-slate-700 border-0 active:scale-[0.98]',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-2xs active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5 font-bold',
  md: 'px-3.5 py-2 text-xs rounded-lg gap-2 font-bold',
  lg: 'px-5 py-2.5 text-sm rounded-lg gap-2.5 font-extrabold',
  icon: 'p-2 rounded-lg justify-center text-xs',
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
