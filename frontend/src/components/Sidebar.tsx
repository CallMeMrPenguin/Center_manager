import React from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon, FolderOpen, LogOut, GraduationCap, ShieldCheck } from 'lucide-react';
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
    ? orderedTabIds.filter((id) => id === 'assignments')
    : orderedTabIds;

  return (
    <aside
      className={`group relative ${
        isSidebarExpanded ? 'w-56' : 'w-16'
      } bg-[#0c0f1e]/90 border border-[#212c4b] rounded-2xl flex flex-col transition-all duration-300 select-none shrink-0 z-30 shadow-xl overflow-visible`}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-40 w-6 h-6 rounded-full bg-[#181f38] border border-[#2d3a66] flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#202b4d] shadow-md transition cursor-pointer"
        title={isSidebarExpanded ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}
      >
        {isSidebarExpanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {/* Brand Header */}
      <div className="flex items-center gap-3 p-3.5 border-b border-white/5 shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5c36f5] to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(92,54,245,0.5)] font-black text-xs">
          {isStudent ? <GraduationCap size={16} /> : <ShieldCheck size={16} />}
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

      {/* Tabs List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {visibleTabIds.map((id, idx) => {
          const tabDef = TAB_DEFINITIONS.find((t) => t.id === id);
          if (!tabDef) return null;
          const isActive = activeTab === id;
          const Icon = tabDef.icon;

          return (
            <button
              key={id}
              type="button"
              draggable={!isStudent}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                isActive
                  ? 'bg-[#5c36f5] text-white shadow-[0_0_15px_rgba(92,54,245,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={tabDef.label}
            >
              <Icon size={16} className="shrink-0" />
              {isSidebarExpanded && <span className="truncate">{tabDef.label}</span>}
            </button>
          );
        })}
      </div>

      {/* User profile section */}
      <div className="shrink-0 mt-auto p-2 border-t border-white/5 relative" ref={profileRef as any}>
        {profileOpen && (
          <div className="absolute z-[250] bg-[#0d1018] border border-white/10 rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 animate-fade-in bottom-full left-2 mb-2 w-52 origin-bottom">
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition cursor-pointer text-left"
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition cursor-pointer text-left"
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
          className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition cursor-pointer border border-transparent hover:border-white/10"
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0">
            {isStudent ? 'HS' : 'AD'}
          </div>
          {isSidebarExpanded && (
            <div className="text-left truncate flex-1">
              <div className="text-xs font-bold text-slate-200 truncate">{currentUser?.name || 'Tài khoản'}</div>
              <div className="text-[10px] text-indigo-400 font-medium">{isStudent ? (currentUser?.className || 'Học sinh') : 'Quản trị viên'}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
