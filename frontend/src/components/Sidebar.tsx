import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon, FolderOpen, LogOut, User } from 'lucide-react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { api } from '../api';
import { showToast } from './Toast';
import { AuthUser } from '../utils/authUtils';
import { AnimatedThemeToggle } from './ui/animated-theme-toggle';
import { Dock, DockItem, DockIcon, DockLabel } from './ui/dock';

export const SECTIONS = [
  { id: 'none', label: '' },
  { id: 'main', label: 'Hệ thống' },
  { id: 'assessments', label: 'Đánh giá & Đề thi' },
  { id: 'resources', label: 'Tài nguyên' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'analytics', label: 'Phân tích' },
  { id: 'settings', label: 'Thiết lập' },
];

interface SidebarProps {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (id: string) => void;
  orderedTabIds: string[];
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (index: number) => void;
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
  profileOpen: boolean;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileRef: React.RefObject<HTMLDivElement | null>;
  currentUser: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarExpanded,
  toggleSidebar,
  activeTab,
  setActiveTab,
  orderedTabIds,
  handleDragStart,
  handleDragOver,
  handleDrop,
  draggedIndex,
  setDraggedIndex,
  profileOpen,
  setProfileOpen,
  profileRef,
  currentUser,
  onLogout,
}) => {
  return (
    <aside
      className={`group relative ${
        isSidebarExpanded ? 'w-56' : 'w-16'
      } bg-white dark:bg-[#0c0c0e] border-r border-slate-200 dark:border-[#27272a] flex flex-col transition-all duration-300 select-none shrink-0 z-30 overflow-visible`}
    >
      {/* Floating Collapse / Expand Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-[#1c1c21] hover:bg-[#2563eb] text-slate-600 dark:text-slate-300 hover:text-white border border-slate-300 dark:border-[#27272a] shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer z-50 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        title={isSidebarExpanded ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
      >
        {isSidebarExpanded ? (
          <ChevronLeft size={13} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={13} strokeWidth={2.5} />
        )}
      </button>

      {/* Header logo / Title */}
      <div className={`flex items-center ${isSidebarExpanded ? 'px-3 justify-start' : 'justify-center px-0'} py-3.5 shrink-0 border-b border-slate-100 dark:border-white/5 min-w-0`}>
        <div className="h-8.5 w-8.5 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(59,130,246,0.4)]">
          <img src="/logo.png" alt="Center Manager Logo" className="h-full w-full object-contain" />
        </div>
        <div
          className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isSidebarExpanded
              ? 'opacity-100 max-w-[9rem] ml-2 translate-x-0'
              : 'opacity-0 max-w-0 ml-0 -translate-x-3 pointer-events-none'
          }`}
        >
          <span className="text-xs font-black tracking-wide uppercase text-slate-900 dark:text-white block leading-none">
            EduPlatform
          </span>
          <span className="text-[8.5px] font-black tracking-[0.18em] uppercase text-blue-600 dark:text-blue-400 block mt-1">
            Center Manager
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${isSidebarExpanded ? 'px-1.5' : 'px-1'} py-2 flex flex-col gap-1 scrollbar-none`}>
        {isSidebarExpanded ? (
          /* EXPANDED SIDEBAR VIEW */
          SECTIONS.map((section, sIdx) => {
            const sectionTabs = orderedTabIds
              .map((tabId, idx) => ({ tabId, idx }))
              .filter(({ tabId }) => {
                const item = TAB_DEFINITIONS.find((t) => t.id === tabId);
                return item && item.section === section.id;
              });

            if (sectionTabs.length === 0) return null;

            return (
              <React.Fragment key={section.id}>
                {sIdx > 0 && <div className="h-[1px] bg-slate-200 dark:bg-white/10 mx-2 my-1.5 shrink-0" />}

                <div className="flex flex-col gap-0.5 shrink-0">
                  {section.label && (
                    <div className="px-2 text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 overflow-hidden whitespace-nowrap transition-all duration-300 mt-1 mb-0.5">
                      {section.label}
                    </div>
                  )}

                  {sectionTabs.map(({ tabId, idx }) => {
                    const item = TAB_DEFINITIONS.find((t) => t.id === tabId)!;
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        draggable="true"
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDragEnd={() => setDraggedIndex(null)}
                        onDrop={() => handleDrop(idx)}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center w-full h-9 px-2.5 rounded-xl justify-start transition-all duration-150 ease-out relative group/item cursor-pointer shrink-0 active:scale-95 ${
                          isActive
                            ? 'bg-blue-600 dark:bg-blue-600 text-white font-black shadow-md shadow-blue-500/25'
                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200'
                        } ${
                          draggedIndex === idx
                            ? 'opacity-40 border border-dashed border-blue-400 bg-blue-500/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-center shrink-0 relative z-10">
                          <Icon
                            size={17}
                            className={
                              isActive
                                ? 'text-white drop-shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors'
                            }
                          />
                        </div>

                        <span
                          className={`text-xs relative z-10 whitespace-nowrap overflow-hidden ml-2.5 ${
                            isActive
                              ? 'text-white font-black'
                              : 'text-slate-800 dark:text-slate-200 font-bold group-hover/item:text-slate-900 dark:group-hover/item:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })
        ) : (
          /* COLLAPSED SIDEBAR VIEW — MACOS VERTICAL DOCK MAGNIFICATION */
          <Dock orientation="vertical" magnification={52} distance={85} className="w-full bg-transparent border-0 shadow-none p-0 gap-1">
            {SECTIONS.map((section, sIdx) => {
              const sectionTabs = orderedTabIds
                .map((tabId, idx) => ({ tabId, idx }))
                .filter(({ tabId }) => {
                  const item = TAB_DEFINITIONS.find((t) => t.id === tabId);
                  return item && item.section === section.id;
                });

              if (sectionTabs.length === 0) return null;

              return (
                <React.Fragment key={section.id}>
                  {sIdx > 0 && (
                    <div className="w-7 h-[1.5px] bg-slate-300 dark:bg-white/20 mx-auto my-1 shrink-0 rounded-full" />
                  )}

                  {sectionTabs.map(({ tabId, idx }) => {
                    const item = TAB_DEFINITIONS.find((t) => t.id === tabId)!;
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <DockItem
                        key={item.id}
                        isActive={isActive}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <DockIcon isActive={isActive}>
                          <Icon size={18} />
                        </DockIcon>
                        <DockLabel>{item.label}</DockLabel>
                      </DockItem>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </Dock>
        )}
      </div>

      {/* User profile & Theme Toggle section */}
      <div className="shrink-0 mt-auto p-1.5 border-t border-slate-100 dark:border-white/5 relative" ref={profileRef as any}>
        {profileOpen && (
          <div className="absolute z-[250] bg-white dark:bg-[#141417] border border-slate-200 dark:border-[#27272a] rounded-[14px] shadow-2xl p-1.5 animate-mac-dropdown bottom-full left-0 mb-2 w-52 origin-bottom">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 select-none mb-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {currentUser?.rawRole || (currentUser?.role === 'admin' ? 'Quản trị viên' : currentUser?.role === 'student' ? 'Học sinh' : 'Tài Khoản')}
              </p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                {currentUser?.name || 'Center Manager'}
              </p>
              {currentUser?.username && (
                <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  @{currentUser.username} {currentUser.className ? `• ${currentUser.className}` : ''}
                </p>
              )}
            </div>

            {/* Quick theme switcher row in popup */}
            <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-white/5 mb-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Chế độ hiển thị</span>
              <AnimatedThemeToggle size="sm" />
            </div>

            {currentUser?.role !== 'student' && (
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer text-left"
              >
                <SettingsIcon className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Cấu hình hệ thống</span>
              </button>
            )}

            {currentUser?.role !== 'student' && (
              <button
                onClick={async () => {
                  try {
                    await api.openWorkspaceFolder();
                    showToast('Đã mở thư mục workspace!', 'success');
                  } catch (err) {
                    showToast('Không thể mở: ' + err, 'error');
                  }
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer text-left"
              >
                <FolderOpen className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Mở thư mục Workspace</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 rounded-xl transition cursor-pointer text-left border-t border-slate-100 dark:border-white/5 mt-1 pt-2"
              >
                <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>Đăng xuất tài khoản</span>
              </button>
            )}
          </div>
        )}

        <div className={`flex items-center ${isSidebarExpanded ? 'gap-1.5' : 'flex-col gap-1.5'}`}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className={`${
              isSidebarExpanded ? 'flex-1 px-2 py-1.5 justify-start gap-2.5' : 'w-10 h-10 mx-auto p-0 justify-center'
            } flex items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10`}
            title={currentUser ? `${currentUser.name} (${currentUser.role})` : 'Tài khoản người dùng'}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 dark:border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'CM'}
            </div>
            {isSidebarExpanded && (
              <div className="flex flex-col text-left overflow-hidden min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">
                  {currentUser?.name || 'Center Manager'}
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                  {currentUser?.rawRole || (currentUser?.role === 'admin' ? 'Quản trị' : 'Học sinh')}
                </span>
              </div>
            )}
          </button>

          <AnimatedThemeToggle size="sm" />
        </div>
      </div>
    </aside>
  );
};

