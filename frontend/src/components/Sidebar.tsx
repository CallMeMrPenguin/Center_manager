import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon, FolderOpen, LogOut } from 'lucide-react';
import { TAB_DEFINITIONS } from '../config/tabs';
import { api } from '../api';
import { showToast } from './Toast';

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
  onLogout,
}) => {
  const [hoveredTab, setHoveredTab] = useState<{
    id: string;
    label: string;
    top: number;
    isActive: boolean;
  } | null>(null);

  return (
    <aside
      className={`group relative ${
        isSidebarExpanded ? 'w-56' : 'w-16'
      } bg-[#0c0f1e]/90 border border-[#212c4b] rounded-2xl flex flex-col transition-all duration-300 select-none shrink-0 z-30 shadow-xl overflow-visible`}
    >
      {/* Floating Collapse / Expand Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#181d2e] hover:bg-[#5c36f5] text-slate-300 hover:text-white border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer z-50 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        title={isSidebarExpanded ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
      >
        {isSidebarExpanded ? (
          <ChevronLeft size={13} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={13} strokeWidth={2.5} />
        )}
      </button>

      {/* Header logo / Title */}
      <div className={`flex items-center ${isSidebarExpanded ? 'px-3 justify-start' : 'justify-center px-0'} py-3.5 shrink-0 border-b border-white/5 min-w-0`}>
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
      <div className={`flex-1 overflow-y-auto min-h-0 ${isSidebarExpanded ? 'px-1.5' : 'px-1'} py-2 flex flex-col gap-1 scrollbar-none`}>
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
              {/* Section Divider in Collapsed State */}
              {!isSidebarExpanded && sIdx > 0 && (
                <div className="w-6 h-[1px] bg-white/10 mx-auto my-1.5 shrink-0" />
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
                      draggable="true"
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDragEnd={() => setDraggedIndex(null)}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => setActiveTab(item.id)}
                      onMouseEnter={(e) => {
                        if (!isSidebarExpanded) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredTab({
                            id: item.id,
                            label: item.label,
                            top: rect.top + rect.height / 2,
                            isActive,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredTab(null)}
                      className={`flex items-center transition-all duration-150 ease-out relative group/item cursor-pointer shrink-0 ${
                        isSidebarExpanded
                          ? 'w-full h-9 px-2.5 rounded-xl justify-start active:scale-95'
                          : 'w-10 h-10 mx-auto rounded-xl justify-center p-0 hover:scale-105 active:scale-95'
                      } ${
                        isActive
                          ? 'bg-indigo-500/25 border-2 border-indigo-400/90 shadow-[0_0_12px_rgba(92,54,245,0.4)]'
                          : 'hover:bg-white/[0.08] border-2 border-transparent'
                      } ${
                        draggedIndex === idx
                          ? 'opacity-40 border border-dashed border-indigo-400 bg-indigo-500/10'
                          : ''
                      }`}
                    >
                      {/* Centered Icon Container */}
                      <div className="flex items-center justify-center shrink-0 relative z-10">
                        <Icon
                          size={17}
                          className={
                            isActive
                              ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : 'text-slate-400 group-hover/item:text-white transition-colors'
                          }
                        />
                      </div>

                      {/* Label for expanded view */}
                      {isSidebarExpanded && (
                        <span
                          className={`text-xs relative z-10 whitespace-nowrap overflow-hidden ml-2.5 ${
                            isActive
                              ? 'text-white font-black'
                              : 'text-slate-200 font-bold group-hover/item:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Floating Hover Tooltip for Collapsed Sidebar (Fixed Position to avoid overflow clipping) */}
      {!isSidebarExpanded && hoveredTab && (
        <div
          className="fixed left-[72px] z-[9999] pointer-events-none transition-all duration-150 ease-out"
          style={{ top: `${hoveredTab.top}px`, transform: 'translateY(-50%)' }}
        >
          <div className="px-3 py-1.5 rounded-xl bg-[#0c0f1e] border border-[#212c4b] text-white text-xs font-black whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.95)] flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hoveredTab.isActive ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-slate-400'
              }`}
            />
            <span>{hoveredTab.label}</span>
          </div>
        </div>
      )}

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

            {onLogout && (
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 rounded-xl transition cursor-pointer text-left border-t border-white/5 mt-1 pt-2"
              >
                <LogOut className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Đổi vai trò / Đăng xuất</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className={`${
            isSidebarExpanded ? 'w-full px-2.5 py-1.5' : 'w-10 h-10 mx-auto p-0'
          } flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition cursor-pointer border border-transparent hover:border-white/10`}
          title="Tài khoản quản trị"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
            CM
          </div>
        </button>
      </div>
    </aside>
  );
};
