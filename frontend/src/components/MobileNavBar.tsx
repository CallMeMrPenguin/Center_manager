import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User, Sparkles } from 'lucide-react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { AuthUser } from '../utils/authUtils';

interface MobileNavBarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  orderedTabIds: string[];
  currentUser: AuthUser | null;
  onLogout?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  setActiveTab,
  orderedTabIds,
  currentUser,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view in horizontal strip
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  // Close profile on click outside
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
    <div className="flex md:hidden flex-col shrink-0 bg-white dark:bg-[#0c0c0e] border-b border-slate-200 dark:border-[#27272a] z-30 select-none shadow-xs">
      {/* ── TOP APP BAR ──────────────────────────────────────────────────────── */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-slate-100 dark:border-white/5">
        {/* Brand & Active Tab Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white leading-tight truncate">
              EduPlatform
            </span>
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase leading-none truncate">
              Center Manager
            </span>
          </div>
          {currentTab && (
            <span className="ml-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] shrink-0 truncate max-w-[110px]">
              {currentTab.label}
            </span>
          )}
        </div>

        {/* Profile Avatar Button */}
        <div className="relative shrink-0" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            title="Tài khoản người dùng"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              {userInitials}
            </div>
            <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Popover Menu */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#121626] border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
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

      {/* ── HORIZONTAL SCROLLABLE TAB STRIP ──────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 px-2.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full"
      >
        {orderedTabIds.map((tabId) => {
          const tab = TAB_DEFINITIONS.find((t) => t.id === tabId);
          if (!tab) return null;
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs shrink-0 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white font-black shadow-sm shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white shrink-0' : 'text-slate-500 dark:text-slate-400 shrink-0'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
