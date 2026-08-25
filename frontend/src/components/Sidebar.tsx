import React from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon, FolderOpen, LogOut } from 'lucide-react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { api } from '../api';
import { showToast } from './Toast';
import { AuthUser } from '../pages/auth/LoginPage';

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
  setActiveTab: (tab: string) => void;
  orderedTabIds: string[];
  handleDragStart: (idx: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (idx: number) => void;
  draggedIndex: number | null;
  setDraggedIndex: (idx: number | null) => void;
  profileOpen: boolean;
  setProfileOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  profileRef: React.RefObject<HTMLDivElement | null>;
  currentUser?: AuthUser | null;
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
  const isStudent = currentUser?.role === 'student';

  const visibleTabIds = isStudent
    ? orderedTabIds.filter((id) => id === 'assignments' || id === 'results')
    : orderedTabIds;

  return (
    <aside
      className={`group relative ${
        isSidebarExpanded ? 'w-56' : 'w-16'
      } bg-[#0c0f1e]/90 border border-[#212c4b] rounded-2xl flex flex-col transition-all duration-300 select-none shrink-0 z-30 shadow-xl overflow-visible`}
    >
      {/* Floating Collapse / Expand Button: Appears on hover */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#181d2e] hover:bg-[#5c36f5] text-slate-300 hover:text-white border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer z-50 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        title={isSidebarExpanded ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
      >
        {isSidebarExpanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {/* Brand Header */}
      <div className="flex items-center gap-3 p-3.5 border-b border-white/5 shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5c36f5] to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(92,54,245,0.5)] font-black text-xs">
          CM
        </div>
        {isSidebarExpanded && (
          <div className="truncate">
            <h2 className="text-xs font-black text-white tracking-wider uppercase truncate">
              {isStudent ? 'Cổng Học Sinh' : 'Center Manager'}
            </h2>
            <p className="text-[10px] text-slate-400 truncate">
              {isStudent ? (currentUser?.name || 'Học Sinh') : 'Hệ Thống Trung Tâm'}
            </p>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1.5 py-2 flex flex-col gap-1 scrollbar-none">
        {SECTIONS.map((section, sIdx) => {
          const sectionTabs = visibleTabIds
            .map((tabId, idx) => ({ tabId, idx }))
            .filter(({ tabId }) => {
              const item = TAB_DEFINITIONS.find((t) => t.id === tabId);
              return item && item.section === section.id;
            });

          if (sectionTabs.length === 0) return null;

          return (
            <React.Fragment key={section.id}>
              {/* Section Divider in Collapsed State */}
              {!isSidebarExpanded && sIdx > 0 && (
                <div className="w-5 h-[1px] bg-white/10 mx-auto my-1.5 shrink-0" />
              )}

              <div className="flex flex-col gap-0.5 shrink-0">
                {isSidebarExpanded && section.label && (
                  <div className="px-2 text-[9.5px] font-black uppercase tracking-wider text-slate-400 overflow-hidden whitespace-nowrap transition-all duration-300 mt-1 mb-0.5">
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
                      type="button"
                      draggable={!isStudent}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDragEnd={() => setDraggedIndex(null)}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center w-full h-9 px-2 rounded-xl transition-all duration-150 relative group/item cursor-pointer active:scale-95 shrink-0 ${
                        isActive
                          ? 'bg-indigo-500/25 border-2 border-indigo-400/90 shadow-[0_0_12px_rgba(92,54,245,0.4)]'
                          : 'hover:bg-white/[0.05] border-2 border-transparent'
                      } ${
                        draggedIndex === idx
                          ? 'opacity-40 border-dashed border-indigo-400'
                          : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-5.5 h-5.5 flex items-center justify-center shrink-0 relative z-10">
                        <Icon
                          size={16}
                          className={
                            isActive
                              ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : 'text-slate-400 group-hover/item:text-white'
                          }
                        />
                      </div>

                      {/* Label for expanded view */}
                      {isSidebarExpanded && (
                        <span
                          className={`text-xs relative z-10 whitespace-nowrap overflow-hidden ml-2 ${
                            isActive
                              ? 'text-white font-black'
                              : 'text-slate-200 font-bold group-hover/item:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      )}

                      {/* Clean flyout tooltip on hover when collapsed */}
                      {!isSidebarExpanded && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-all duration-150 scale-95 group-hover/item:scale-100">
                          <div className="px-2.5 py-1 rounded-xl bg-[#0c0f1e] border border-[#212c4b] text-white text-xs font-black whitespace-nowrap shadow-[0_8px_20px_rgba(0,0,0,0.9)]">
                            {item.label}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* User profile section */}
      <div className="shrink-0 mt-auto p-1.5 border-t border-white/5 relative" ref={profileRef as any}>
        {profileOpen && (
          <div className="absolute z-[250] bg-[#0d1018] border border-white/10 rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 animate-fade-in bottom-full left-1 mb-2 w-52 origin-bottom">
            <div className="px-3 py-2 border-b border-white/5 select-none mb-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {isStudent ? 'Tài Khoản Học Sinh' : 'Tài Khoản Quản Trị'}
              </p>
              <p className="text-xs font-extrabold text-white mt-0.5 truncate">
                {currentUser?.name || 'Center Manager'}
              </p>
            </div>

            {!isStudent && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-xl transition cursor-pointer text-left"
                >
                  <SettingsIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Cấu hình hệ thống</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.openWorkspaceFolder();
                      showToast('Đã mở thư mục workspace!', 'success');
                    } catch (err) {
                      showToast('Không thể mở: ' + err, 'error');
                    }
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-xl transition cursor-pointer text-left"
                >
                  <FolderOpen className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Mở thư mục Workspace</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 rounded-xl transition cursor-pointer text-left border-t border-white/5 mt-1 pt-2"
            >
              <LogOut className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Đổi vai trò / Đăng xuất</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="w-full flex items-center justify-center p-1.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition cursor-pointer border border-transparent hover:border-white/10"
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
            {isStudent ? 'HS' : 'CM'}
          </div>
        </button>
      </div>
    </aside>
  );
};
