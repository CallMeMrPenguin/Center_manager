import React, { useState } from 'react';

export interface SegmentedButtonItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  badge?: number | string;
  disabled?: boolean;
}

export interface SegmentedButtonProps {
  buttons: SegmentedButtonItem[];
  activeId?: string;
  defaultActive?: string;
  onChange?: (activeId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
}

export const SegmentedButton: React.FC<SegmentedButtonProps> = ({
  buttons,
  activeId: controlledActiveId,
  defaultActive,
  onChange,
  size = 'md',
  className = '',
  fullWidth = true,
}) => {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultActive || (buttons.length > 0 ? buttons[0].id : '')
  );

  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;
  const activeIndex = Math.max(0, buttons.findIndex((b) => b.id === activeId));
  const count = buttons.length || 1;

  const handleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (controlledActiveId === undefined) {
      setInternalActiveId(id);
    }
    onChange?.(id);
  };

  const sizeClasses = {
    sm: 'text-[11px] py-1 px-2.5',
    md: 'text-xs py-1.5 px-3',
    lg: 'text-sm py-2 px-4',
  }[size];

  return (
    <div
      className={`relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 select-none shrink-0 ${
        fullWidth ? 'w-full' : 'inline-flex'
      } ${className}`}
    >
      {/* Sliding Indicator Backdrop (Rule 7 Standard) */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
        style={{
          left: activeIndex === 0 ? '4px' : `calc((100% / ${count}) * ${activeIndex} + 1px)`,
          width: `calc((100% / ${count}) - 4px)`,
        }}
      />

      {/* Button Options */}
      {buttons.map((btn) => {
        const isActive = btn.id === activeId;
        const Icon = btn.icon;

        return (
          <button
            key={btn.id}
            type="button"
            disabled={btn.disabled}
            onClick={() => handleSelect(btn.id, btn.disabled)}
            className={`flex-1 relative z-10 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-bold ${sizeClasses} ${
              btn.disabled
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : isActive
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="shrink-0" />}
            <span className="truncate">{btn.label}</span>
            {btn.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {btn.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedButton;
