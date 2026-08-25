import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { AppSettings } from './types';
import {
  FolderOpen, ChevronLeft, ChevronRight, LogOut,
  Database, GraduationCap, Settings as SettingsIcon, ChevronUp
} from 'lucide-react';
import { TAB_DEFINITIONS } from './config/tabs';
import { Sidebar } from './components/Sidebar';
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

        {/* SIDEBAR NAVIGATION (With continuous macOS Dock magnification when collapsed) */}
        <Sidebar
          isSidebarExpanded={isSidebarExpanded}
          toggleSidebar={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orderedTabIds={orderedTabIds}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          draggedIndex={draggedIndex}
          setDraggedIndex={setDraggedIndex}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          profileRef={profileRef}
        />

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
