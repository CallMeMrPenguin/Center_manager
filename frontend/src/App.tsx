import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { AppSettings } from './types';
import {
  FolderOpen, ChevronLeft, ChevronRight, LogOut,
  Database, GraduationCap, Settings as SettingsIcon, ChevronUp
} from 'lucide-react';
import { TAB_DEFINITIONS } from './config/tabs';
import ToastContainer, { showToast } from './components/Toast';
import { applyTheme } from './theme';
import { ConfirmProvider, useConfirm } from './components/ConfirmDialog';

const SECTIONS = [
  { id: 'none', label: '' },
  { id: 'main', label: 'Hệ thống' },
  { id: 'assessments', label: 'Đánh giá & Đề thi' },
  { id: 'resources', label: 'Tài nguyên' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'analytics', label: 'Phân tích' },
  { id: 'settings', label: 'Thiết lập' }
];

function AppContent() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  const [preloadedQuestions, setPreloadedQuestions] = useState<any[] | null>(null);
  const [preloadedVersions, setPreloadedVersions] = useState<number | null>(null);
  const [preloadedGrade, setPreloadedGrade] = useState<string | null>(null);
  const [preloadedUnit, setPreloadedUnit] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('app_zoom');
    return saved ? parseFloat(saved) : 1;
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    loadSettings();

    // Load and apply theme settings on mount
    let theme = {
      bgImage: 'none',
      opacity: 0.08,
      blur: 24,
      borderOpacity: 0.15,
      saturate: 180
    };
    const savedTheme = localStorage.getItem('app_theme_settings');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        theme = { ...theme, ...parsed };
        if (theme.bgImage && (theme.bgImage.includes('supabase.co') || theme.bgImage === 'none')) {
          theme.bgImage = 'none';
        }
      } catch (e) {
        console.error("Failed to load theme settings:", e);
      }
    }
    applyTheme(theme);

    // Periodically refresh configuration settings & check server boot time for auto-reload
    let lastBootTime: number | null = null;
    const interval = setInterval(async () => {
      loadSettings();
      try {
        const res = await fetch('/api/system/version');
        if (res.ok) {
          const data = await res.json();
          if (lastBootTime !== null && lastBootTime !== data.boot_time) {
            console.log("Server updated/restarted. Auto-reloading page...");
            window.location.reload();
          }
          lastBootTime = data.boot_time;
        }
      } catch (e) { }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const currentZoomRef = useRef<number>(zoomLevel);

  const applyZoom = (newZoom: number) => {
    const clamped = Math.round(Math.min(Math.max(newZoom, 0.6), 2) * 100) / 100;
    currentZoomRef.current = clamped;
    document.documentElement.style.fontSize = `${15 * clamped}px`;
    localStorage.setItem('app_zoom', String(clamped));
    setZoomLevel(clamped);
  };

  useEffect(() => {
    document.documentElement.style.fontSize = `${15 * zoomLevel}px`;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        applyZoom(currentZoomRef.current + 0.1);
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        applyZoom(currentZoomRef.current - 0.1);
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        applyZoom(1);
      } else if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('app-escape'));
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        applyZoom(currentZoomRef.current + delta);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    const handleSwitchTab = (e: any) => {
      if (e.detail?.tabId) {
        setActiveTab(e.detail.tabId);
      }
    };
    window.addEventListener('switch-tab', handleSwitchTab);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('switch-tab', handleSwitchTab);
    };
  }, []);
  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data && (data as any).theme) {
        applyTheme((data as any).theme);
        try {
          localStorage.setItem('app_theme_settings', JSON.stringify((data as any).theme));
        } catch (e) { }
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };



  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderedTabIds, setOrderedTabIds] = useState<string[]>(() => {
    const defaultIds = TAB_DEFINITIONS.map(tab => tab.id);

    // Load from v2 (string IDs)
    const savedV2 = localStorage.getItem('sidebar_menu_order_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2) as string[];
        const validParsed = parsed.filter(id => defaultIds.includes(id));

        // Append missing tab IDs
        defaultIds.forEach(id => {
          if (!validParsed.includes(id)) {
            validParsed.push(id);
          }
        });
        return validParsed;
      } catch (e) {
        console.error("Failed to parse sidebar_menu_order_v2:", e);
      }
    }

    // Migrate from legacy v1 (numeric indexes)
    const savedV1 = localStorage.getItem('sidebar_menu_order');
    if (savedV1) {
      try {
        const legacyMap: Record<number, string> = {
          0: 'formatter',
          1: 'question-bank',
          2: 'vocab-bank',
          3: 'unit-config',
          4: 'file-manager',
          5: 'settings'
        };
        const parsed = JSON.parse(savedV1) as number[];
        const migrated = parsed
          .map(idx => legacyMap[idx])
          .filter(Boolean) as string[];

        defaultIds.forEach(id => {
          if (!migrated.includes(id)) {
            migrated.push(id);
          }
        });

        localStorage.setItem('sidebar_menu_order_v2', JSON.stringify(migrated));
        return migrated;
      } catch (e) {
        console.error("Failed to migrate legacy sidebar_menu_order:", e);
      }
    }

    return defaultIds;
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newIds = [...orderedTabIds];
    const draggedId = newIds[draggedIndex];

    newIds.splice(draggedIndex, 1);
    newIds.splice(targetIndex, 0, draggedId);

    setOrderedTabIds(newIds);
    setDraggedIndex(null);

    localStorage.setItem('sidebar_menu_order_v2', JSON.stringify(newIds));
  };

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#08090e] text-slate-50 overflow-hidden font-sans select-none">
      <div className="relative flex flex-row flex-1 overflow-hidden p-4 gap-4 z-10">

        {/* SIDEBAR NAVIGATION (Floating circle toggle button on right edge) */}
        <aside
          className={`relative ${isSidebarExpanded ? 'w-[270px]' : 'w-20'} sidebar-glass-glow rounded-2xl flex flex-col h-full transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 shrink-0 select-none`}
        >
          {/* Floating Circular Collapse / Expand Button on right edge */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-6.5 w-6 h-6 rounded-full bg-[#181d2e] hover:bg-[#5c36f5] text-slate-300 hover:text-white border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-115 cursor-pointer z-50 active:scale-95"
            title={isSidebarExpanded ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
          >
            {isSidebarExpanded ? <ChevronLeft size={13} strokeWidth={2.5} /> : <ChevronRight size={13} strokeWidth={2.5} />}
          </button>

          {/* Header logo / Title */}
          <div className="flex items-center px-3.5 py-4 shrink-0 border-b border-white/5 min-w-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(59,130,246,0.4)]">
              <img src="/logo.png" alt="Center Manager Logo" className="h-full w-full object-contain" />
            </div>
            <div className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isSidebarExpanded ? 'opacity-100 max-w-[200px] ml-3 translate-x-0' : 'opacity-0 max-w-0 ml-0 -translate-x-3 pointer-events-none'
            }`}>
              <span className="text-base font-black tracking-wide uppercase text-white block leading-none">
                EduPlatform
              </span>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-400 block mt-1">
                Center Manager
              </span>
            </div>
          </div>

          {/* Nav Menu */}
          <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-3 flex flex-col gap-2 scrollbar-none">
            {SECTIONS.map((section) => {
              const sectionTabs = orderedTabIds
                .map((tabId, idx) => ({ tabId, idx }))
                .filter(({ tabId }) => {
                  const item = TAB_DEFINITIONS.find(t => t.id === tabId);
                  return item && item.section === section.id;
                });

              if (sectionTabs.length === 0) return null;

              return (
                <div key={section.id} className="flex flex-col gap-1 shrink-0">
                  {section.label && (
                    <div className={`px-3 text-xs font-black uppercase tracking-wider text-slate-400 overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isSidebarExpanded ? 'opacity-100 max-h-6 mt-1 mb-0.5' : 'opacity-0 max-h-0 mt-0 mb-0 pointer-events-none'
                    }`}>
                      {section.label}
                    </div>
                  )}
                  {sectionTabs.map(({ tabId, idx }) => {
                    const item = TAB_DEFINITIONS.find(t => t.id === tabId)!;
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
                        className={`flex items-center w-full h-11 rounded-xl transition-all duration-150 relative group cursor-pointer active:scale-95 shrink-0 ${draggedIndex === idx ? 'opacity-40 border border-dashed border-indigo-400 bg-indigo-500/10' : ''
                          }`}
                      >
                        {isActive && (
                          <div className={`absolute transition-all duration-300 pointer-events-none bg-indigo-500/25 border-2 border-indigo-400/90 shadow-[0_0_16px_rgba(92,54,245,0.5)] ${
                            isSidebarExpanded
                              ? 'top-[3px] left-[5px] w-[calc(100%-10px)] h-[calc(100%-6px)] rounded-xl'
                              : 'top-[2px] left-[4px] w-10 h-10 rounded-full'
                          }`} />
                        )}

                        {/* ICON BOX */}
                        <div className="w-12 h-11 flex items-center justify-center shrink-0 relative z-10">
                          <Icon size={20} className={isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]' : 'text-slate-400 group-hover:text-white'} />
                        </div>

                        {/* TEXT LABEL WITH SYNCHRONIZED SMOOTH FADE & SLIDE */}
                        <span className={`text-sm relative z-10 whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          isSidebarExpanded ? 'opacity-100 max-w-[195px] ml-1.5 translate-x-0' : 'opacity-0 max-w-0 ml-0 -translate-x-3 pointer-events-none'
                        } ${isActive ? "text-white font-black" : "text-slate-200 font-bold group-hover:text-white"}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* User profile section — click-to-open flyout popup */}
          <div className="shrink-0 mt-auto p-2.5 border-t border-white/5 relative" ref={profileRef}>
            {/* Profile flyout popup (opens upward) */}
            {profileOpen && (
              <div className="absolute z-[250] bg-[#0d1018] border border-white/10 rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 animate-mac-dropdown bottom-full left-0 mb-2 w-56 origin-bottom">
                <div className="px-3.5 py-2.5 border-b border-white/5 select-none mb-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tài Khoản</p>
                  <p className="text-xs font-extrabold text-white mt-0.5">Center Manager</p>
                </div>

                {/* Settings */}
                <button
                  onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-xl transition cursor-pointer text-left"
                >
                  <SettingsIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Cấu hình hệ thống</span>
                </button>

                {/* Open Workspace Folder */}
                <button
                  onClick={async () => {
                    try { await api.openWorkspaceFolder(); showToast('Đã mở thư mục workspace!', 'success'); }
                    catch (err) { showToast('Không thể mở: ' + err, 'error'); }
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-xl transition cursor-pointer text-left"
                >
                  <FolderOpen className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Mở thư mục Workspace</span>
                </button>

                {/* Quit */}
                <button
                  onClick={async () => {
                    const ok = await confirm({ title: 'Đóng ứng dụng', message: 'Bạn có chắc muốn đóng ứng dụng?', confirmText: 'Đóng ứng dụng', cancelText: 'Hủy', type: 'warning' });
                    if (ok) window.close();
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer text-left border-t border-white/5 mt-1 pt-2"
                >
                  <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Đóng ứng dụng</span>
                </button>
              </div>
            )}

            {/* Clickable Profile Row */}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center w-full h-11 px-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer overflow-hidden"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-[0_4px_14px_rgba(92,54,245,0.45)] shrink-0 border border-white/20 hover:shadow-[0_0_12px_rgba(92,54,245,0.5)] transition-all">
                CM
              </div>
              <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden flex items-center justify-between flex-1 ${
                isSidebarExpanded ? 'opacity-100 max-w-[200px] ml-3 translate-x-0' : 'opacity-0 max-w-0 ml-0 -translate-x-3 pointer-events-none'
              }`}>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-black text-white truncate leading-snug">Center Manager</p>
                  <p className="text-[10px] font-extrabold text-indigo-400 truncate">Hệ thống quản lý</p>
                </div>
                <ChevronUp size={13} className={`text-slate-500 shrink-0 transition-transform ${profileOpen ? '' : 'rotate-180'}`} />
              </div>
            </button>

            <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold px-2 mt-1 transition-opacity duration-200 ease-out whitespace-nowrap overflow-hidden">
              <span className="uppercase tracking-widest">{isSidebarExpanded ? 'v4.0.0' : 'v4'}</span>
            </div>
          </div>
        </aside>

        {/* MAIN BODY SKELETON */}
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 overflow-hidden bg-transparent relative gradient-border-card rounded-2xl">
            {TAB_DEFINITIONS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} className={`h-full w-full ${isActive ? 'animate-tab-enter' : 'hidden'}`}>
                  {tab.render({
                    isActive,
                    preloadedQuestions,
                    preloadedVersions,
                    preloadedGrade,
                    preloadedUnit,
                    clearPreloadedQuestions: () => {
                      setPreloadedQuestions(null);
                      setPreloadedVersions(null);
                      setPreloadedGrade(null);
                      setPreloadedUnit(null);
                    },
                    onCreateTest: (questions, numVersions, grade, unit) => {
                      setPreloadedQuestions(questions);
                      if (numVersions) {
                        setPreloadedVersions(numVersions);
                      }
                      setPreloadedGrade(grade || null);
                      setPreloadedUnit(unit || null);
                      setActiveTab('formatter');
                    }
                  })}
                </div>
              );
            })}
          </main>
        </div>
      </div>

      {/* STATUS BAR */}
      <footer className="h-7 bg-[#06070a]/90 backdrop-blur-md flex items-center justify-between px-6 text-[11px] text-slate-400 select-none shrink-0 font-semibold z-10 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Database size={12} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span>Hỗ trợ ngoại tuyến (Offline-First) — 100% bảo mật dữ liệu cục bộ</span>
        </div>
      </footer>

      {/* Toast container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <AppContent />
    </ConfirmProvider>
  );
}
