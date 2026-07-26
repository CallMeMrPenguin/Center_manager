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
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('app_zoom');
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    loadSettings();
    
    // Load and apply theme settings on mount
    let theme = {
      bgImage: 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/f0733c36-a64b-4f7c-b06c-3c679f8ddbc1_3840w.webp',
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
        if (!theme.bgImage || theme.bgImage === 'none') {
          theme.bgImage = 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/f0733c36-a64b-4f7c-b06c-3c679f8ddbc1_3840w.webp';
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
      } catch (e) {}
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${15 * zoomLevel}px`;
    localStorage.setItem('app_zoom', String(zoomLevel));
  }, [zoomLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoomLevel(prev => Math.min(prev + 0.1, 2));
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setZoomLevel(prev => Math.max(prev - 0.6, 0.6));
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setZoomLevel(1);
      } else if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('app-escape'));
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoomLevel(prev => Math.min(prev + 0.05, 2));
        } else {
          setZoomLevel(prev => Math.max(prev - 0.05, 0.6));
        }
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
        } catch (e) {}
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
    <div className="relative flex flex-col h-screen w-screen ambient-bg-dark text-slate-50 overflow-hidden font-sans">
      
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-500 opacity-60" 
        style={{ backgroundImage: 'var(--bg-image)' }} 
      />

      <div className="relative flex flex-row flex-1 overflow-hidden p-4 gap-4 z-10">
        
        {/* SIDEBAR NAVIGATION (Pure CSS 60fps GPU-accelerated inline hover expansion) */}
        <aside
          className="w-16 hover:w-64 group/sidebar sidebar-glass-glow rounded-2xl flex flex-col h-full overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 shrink-0"
        >
          
          {/* Header logo / Title */}
          <div className="flex items-center gap-3 px-3.5 py-4 shrink-0 border-b border-white/5 min-w-0">
            <div className="h-9 w-9 bg-indigo-500/25 border-2 border-indigo-400/80 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(92,54,245,0.8),0_0_15px_rgba(129,140,248,0.6),inset_0_0_12px_rgba(92,54,245,0.4)] shrink-0">
              <GraduationCap size={20} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]" />
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 max-w-0 group-hover/sidebar:max-w-[200px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden pointer-events-none group-hover/sidebar:pointer-events-auto">
              <span className="text-base font-black tracking-wide uppercase text-white block leading-none">
                EduPlatform
              </span>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-400 block mt-1">
                Center Manager
              </span>
            </div>
          </div>
          
          {/* Nav Menu */}
          <nav className="flex-1 overflow-y-auto min-h-0 px-2 py-3 flex flex-col gap-2 scrollbar-none">
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
                    <div className="px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-400 mt-1 mb-0.5 opacity-0 group-hover/sidebar:opacity-100 max-h-0 group-hover/sidebar:max-h-8 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden">
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
                        className={`flex items-center w-full h-11 px-2 rounded-xl transition-all duration-200 relative group cursor-pointer active:scale-95 shrink-0 overflow-hidden ${
                          isActive
                            ? 'bg-indigo-500/20 border-2 border-indigo-400/90 text-white font-black shadow-[0_0_20px_rgba(92,54,245,0.45)]'
                            : 'text-slate-300 font-bold hover:text-white hover:bg-white/5 border border-transparent'
                        } ${draggedIndex === idx ? 'opacity-40 border border-dashed border-indigo-400 bg-indigo-500/10' : ''}`}
                      >
                        {/* ICON BOX */}
                        <div className="w-9 h-9 flex items-center justify-center shrink-0 rounded-lg">
                          <Icon size={19} className={isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]' : 'text-slate-400 group-hover:text-white'} />
                        </div>

                        {/* TEXT LABEL — FADES AND SLIDES SMOOTHLY */}
                        <span className={`ml-2 text-sm font-bold opacity-0 group-hover/sidebar:opacity-100 max-w-0 group-hover/sidebar:max-w-[180px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden pointer-events-none group-hover/sidebar:pointer-events-auto ${
                          isActive ? "text-white font-extrabold" : "text-slate-200 font-bold group-hover:text-white"
                        }`}>
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
              <div className="absolute z-[250] bg-[#0d1018]/95 border border-white/10 rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 backdrop-blur-xl animate-mac-dropdown bottom-full left-0 mb-2 w-56 origin-bottom">
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
              className="flex items-center w-full h-11 px-2.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-[0_4px_14px_rgba(92,54,245,0.45)] shrink-0 border border-white/20 hover:shadow-[0_0_12px_rgba(92,54,245,0.5)] transition-all">
                CM
              </div>
              <div className="ml-3 opacity-0 group-hover/sidebar:opacity-100 max-w-0 group-hover/sidebar:max-w-[180px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden flex items-center justify-between flex-1 pointer-events-none group-hover/sidebar:pointer-events-auto">
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-black text-white truncate leading-snug">Center Manager</p>
                  <p className="text-[10px] font-extrabold text-indigo-400 truncate">Hệ thống quản lý</p>
                </div>
                <ChevronUp size={13} className={`text-slate-500 shrink-0 transition-transform ${profileOpen ? '' : 'rotate-180'}`} />
              </div>
            </button>

            <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold px-2 mt-1 opacity-0 group-hover/sidebar:opacity-100 max-h-0 group-hover/sidebar:max-h-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden">
              <span className="uppercase tracking-widest">v4.0.0</span>
              {zoomLevel !== 1 && <span className="text-indigo-400">{Math.round(zoomLevel * 100)}%</span>}
            </div>
          </div>
        </aside>

        {/* MAIN BODY SKELETON */}
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent gap-3">
          {/* HEADER BANNER */}
          <header className="macos-toolbar h-12 rounded-2xl flex items-center justify-between px-5 z-10 shrink-0">
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(92,54,245,1)]"></span>
              <span>{TAB_DEFINITIONS.find(t => t.id === activeTab)?.label}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                Center Manager EDU
              </span>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 overflow-hidden bg-transparent relative gradient-border-card rounded-2xl">
            {TAB_DEFINITIONS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} className={`h-full w-full ${isActive ? '' : 'hidden'}`}>
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
