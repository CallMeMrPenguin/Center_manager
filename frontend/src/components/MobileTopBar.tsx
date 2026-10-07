import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { AuthUser } from '../utils/authUtils';

interface MobileTopBarProps {
  activeTab: string;
  currentUser: AuthUser | null;
  onLogout?: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  activeTab,
  currentUser,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  const currentTab = TAB_DEFINITIONS.find((t) => t.id === activeTab);
  const userInitials = currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'CM';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';
  const roleLabel = isAdmin ? 'Quản trị hệ thống' : (currentUser?.rawRole || 'Học sinh');
  const displayName = currentUser?.name && currentUser.name.toLowerCase() !== 'admin'
    ? currentUser.name
    : 'Quản Trị Viên';

  return (
    <div className="flex md:hidden items-center justify-between h-11 px-3 bg-white/95 dark:bg-[#0c0c0e]/95 border-b border-slate-200 dark:border-[#27272a] shrink-0 z-30 select-none shadow-xs">
      {/* Brand & Active Tab Indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-6 w-6 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
          <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-tight truncate">
            EduPlatform
          </span>
          <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase leading-none truncate">
            Center Manager
          </span>
        </div>
        {currentTab && (
          <span className="ml-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] shrink-0 truncate max-w-[130px]">
            {currentTab.label}
          </span>
        )}
      </div>

      {/* Profile Avatar Button */}
      <div className="relative shrink-0" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          title="Tài khoản người dùng"
        >
          <div className="w-6.5 h-6.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[11px] shrink-0 shadow-2xs">
            {userInitials}
          </div>
          <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Popover Menu */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#121626] border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 px-2 py-1.5 border-b border-slate-100 dark:border-white/5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate">
                  {roleLabel}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer text-left"
              >
                <LogOut size={14} className="shrink-0" />
                <span>Đăng xuất tài khoản</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
