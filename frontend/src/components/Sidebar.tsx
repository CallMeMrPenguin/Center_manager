import React from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon, FolderOpen } from 'lucide-react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { Dock, DockItem, DockIcon, DockLabel } from './ui/dock';
import { api } from '../api';
import { showToast } from './Toast';

export const SECTIONS = [
  { id: 'none', label: '' },
  { id: 'main', label: 'Hệ thống' },
  { id: 'assessments', label: 'Đánh giá & Đề thi' },
  { id: 'resources', label: 'Tài nguyên' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'analytics', label: 'Phân tích' },
  { id: 'settings', label: 'Thiết lập' }
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
}) => {
  return (
    <aside
      className={`relative ${
        isSidebarExpanded ? 'w-[13.5rem]' : 'w-[4.25rem]'
      } sidebar-glass-glow rounded-2xl flex flex-col h-full transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 shrink-0 select-none bg-[#080a12] border border-white/10`}
    >
      {/* Floating Circular Collapse / Expand Button on right edge */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#181d2e] hover:bg-[#5c36f5] text-slate-300 hover:text-white border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer z-50 active:scale-95"
        title={isSidebarExpanded ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
      >
        {isSidebarExpanded ? (
          <ChevronLeft size={13} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={13} strokeWidth={2.5} />
        )}
      </button>

      {/* Header logo / Title */}
      <div className="flex items-center px-2.5 py-3.5 shrink-0 border-b border-white/5 min-w-0">
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
          <span className="text-xs font-black tracking-wide uppercase text-white block leading-none">
            EduPlatform
          </span>
          <span className="text-[8.5px] font-black tracking-[0.18em] uppercase text-indigo-400 block mt-1">
            Center Manager
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1.5 py-2 flex flex-col gap-1 scrollbar-none">
        {/* EXPANDED SIDEBAR VIEW */}
        {isSidebarExpanded ? (
          SECTIONS.map((section) => {
            const sectionTabs = orderedTabIds
              .map((tabId, idx) => ({ tabId, idx }))
              .filter(({ tabId }) => {
                const item = TAB_DEFINITIONS.find((t) => t.id === tabId);
                return item && item.section === section.id;
              });

            if (sectionTabs.length === 0) return null;

            return (
              <div key={section.id} className="flex flex-col gap-0.5 shrink-0">
                {section.label && (
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
                      draggable="true"
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDragEnd={() => setDraggedIndex(null)}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center w-full h-9 px-2 rounded-xl transition-all duration-150 relative group cursor-pointer active:scale-95 shrink-0 ${
                        isActive
                          ? 'bg-indigo-500/25 border-2 border-indigo-400/90 shadow-[0_0_12px_rgba(92,54,245,0.4)]'
                          : 'hover:bg-white/[0.05] border-2 border-transparent'
                      } ${
                        draggedIndex === idx
                          ? 'opacity-40 border border-dashed border-indigo-400 bg-indigo-500/10'
                          : ''
                      }`}
                    >
                      <div className="w-5.5 h-5.5 flex items-center justify-center shrink-0 relative z-10">
                        <Icon
                          size={16}
                          className={
                            isActive
                              ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : 'text-slate-400 group-hover:text-white'
                          }
                        />
                      </div>

                      <span
                        className={`text-xs relative z-10 whitespace-nowrap overflow-hidden ml-2 ${
                          isActive
                            ? 'text-white font-black'
                            : 'text-slate-200 font-bold group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })
        ) : (
          /* COLLAPSED SIDEBAR VIEW (ACTUAL MACOS DOCK MAGNIFICATION) */
          <Dock orientation="vertical" magnification={52} distance={90} className="w-full bg-transparent border-0 shadow-none p-0">
            {orderedTabIds.map((tabId, idx) => {
              const item = TAB_DEFINITIONS.find((t) => t.id === tabId);
              if (!item) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <DockItem
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-10 h-10 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-500/30 border-2 border-indigo-400 shadow-[0_0_14px_rgba(92,54,245,0.6)]'
                      : 'bg-white/[0.03] hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-400/50'
                  }`}
                >
                  <DockIcon>
                    <Icon
                      size={18}
                      className={isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-slate-300'}
                    />
                  </DockIcon>
                  <DockLabel>{item.label}</DockLabel>
                </DockItem>
              );
            })}
          </Dock>
        )}
      </div>

      {/* User profile section */}
      <div className="shrink-0 mt-auto p-1.5 border-t border-white/5 relative" ref={profileRef as any}>
        {profileOpen && (
          <div className="absolute z-[250] bg-[#0d1018] border border-white/10 rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 animate-mac-dropdown bottom-full left-0 mb-2 w-48 origin-bottom">
            <div className="px-3 py-2 border-b border-white/5 select-none mb-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tài Khoản</p>
              <p className="text-xs font-extrabold text-white mt-0.5">Center Manager</p>
            </div>

            <button
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
          </div>
        )}

        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className="w-full flex items-center justify-center p-1.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition cursor-pointer border border-transparent hover:border-white/10"
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
            CM
          </div>
        </button>
      </div>
    </aside>
  );
};
