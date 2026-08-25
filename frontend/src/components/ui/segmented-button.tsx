import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;

  const handleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (controlledActiveId === undefined) {
      setInternalActiveId(id);
    }
    onChange?.(id);
  };

  const sizeClasses = {
    sm: 'text-[11px] py-1.5 px-3',
    md: 'text-xs py-2 px-4',
    lg: 'text-sm py-2.5 px-5',
  }[size];

  return (
    <div
      onMouseLeave={() => setHoveredId(null)}
      className={`relative flex items-center bg-[#090c15] p-1.5 rounded-2xl border border-[#1b233d] select-none shrink-0 shadow-inner ${
        fullWidth ? 'w-full' : 'inline-flex'
      } ${className}`}
    >
      {buttons.map((btn) => {
        const isActive = btn.id === activeId;
        const isHovered = btn.id === hoveredId && !isActive && !btn.disabled;
        const Icon = btn.icon;

        return (
          <button
            key={btn.id}
            type="button"
            disabled={btn.disabled}
            onClick={() => handleSelect(btn.id, btn.disabled)}
            onMouseEnter={() => setHoveredId(btn.id)}
            className={`flex-1 relative z-10 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 font-bold ${sizeClasses} ${
              btn.disabled
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : isActive
                ? 'text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {/* Active Pill with Framer Motion Spring */}
            {isActive && (
              <motion.div
                layoutId="segmented-active-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-xl bg-[#5c36f5] shadow-[0_0_20px_rgba(92,54,245,0.65)] border border-white/20 z-0"
              />
            )}

            {/* Hover Glow Pill */}
            {isHovered && (
              <motion.div
                layoutId="segmented-hover-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/10 z-0"
              />
            )}

            {/* Icon */}
            {Icon && (
              <span className="relative z-10">
                <Icon size={size === 'sm' ? 13 : size === 'lg' ? 16 : 14} />
              </span>
            )}

            {/* Label */}
            <span className="relative z-10 truncate">{btn.label}</span>

            {/* Badge */}
            {btn.badge !== undefined && (
              <span
                className={`relative z-10 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/25 text-white shadow-sm'
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
