import { useState, useEffect, useRef } from 'react';
import { Database } from 'lucide-react';
import { TAB_DEFINITIONS } from './config/tabs';
import { Sidebar } from './components/Sidebar';
import { SyncIndicator } from './components/SyncIndicator';
import { showToast, AnimatedToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthUser, getCurrentUser, clearAuthUser } from './utils/authUtils';
import { useAutoDeploymentRefresh } from './hooks/useAutoDeploymentRefresh';
import { useWarmupDataCache } from './hooks/useWarmupDataCache';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AnimatedThemeToggle } from './components/ui/animated-theme-toggle';

function AppContent() {
  // Auto-detect and reload on new deployment
  useAutoDeploymentRefresh();

  // Persistent Login session (auto-restores user on refresh / app reopening)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Background data cache warmup for 0ms instant tab switching
  useWarmupDataCache(currentUser);
  // Helper to parse current URL path into valid tabId
  const getInitialTab = (): string => {
    const user = getCurrentUser();
    const isStudent = user?.role === 'student';
    // 1. Check path first (/students -> students)
    const rawPath = window.location.pathname.replace(/^\//, '').split('/')[0].trim();
    // 2. Check legacy hash fallback if someone opens old bookmark (/#/students -> students)
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    const candidate = rawPath || rawHash;

    if (candidate && TAB_DEFINITIONS.some((t) => t.id === candidate)) {
      if (isStudent && candidate !== 'assignments' && candidate !== 'results') {
        return 'assignments';
      }
      return candidate;
    }
    return isStudent ? 'assignments' : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab());

  // Track visited tabs to mount on-demand and keep alive for 0ms instant tab switching
  const [visitedTabIds, setVisitedTabIds] = useState<Set<string>>(() => {
    return new Set([getInitialTab()]);
  });

  // Keep URL pathname in sync with browser navigation (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '').split('/')[0].trim();
      if (path && TAB_DEFINITIONS.some((t) => t.id === path)) {
        if (currentUser?.role === 'student' && path !== 'assignments' && path !== 'results') {
          return;
        }
        setActiveTab(path);
        setVisitedTabIds((prev) => new Set([...prev, path]));
      }
    };
    window.addEventListener('popstate', handlePopState);

    // If on root '/' or using legacy '#', clean up URL to clean path without reload while preserving search params
    const currentPath = window.location.pathname;
    const expectedPath = `/${activeTab}`;
    if (currentPath !== expectedPath || window.location.hash) {
      const target = `${expectedPath}${window.location.search || ''}`;
      window.history.replaceState({ tabId: activeTab }, '', target);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, activeTab]);

  const handleSelectTab = (tabId: string) => {
    const targetPath = `/${tabId}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tabId }, '', targetPath);
    }
    setActiveTab(tabId);
    setVisitedTabIds((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
  };
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

  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', JSON.stringify(next));
      return next;
    });
  };

  const [orderedTabIds, setOrderedTabIds] = useState<string[]>(() => {
    const defaultIds = TAB_DEFINITIONS.map((t) => t.id);
    const saved = localStorage.getItem('sidebar_menu_order_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter((id: string) => defaultIds.includes(id));
        const missing = defaultIds.filter((id) => !valid.includes(id));
        return [...valid, ...missing];
      } catch (e) {
        console.error('Failed to parse sidebar order', e);
      }
    }
    return defaultIds;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newIds = [...orderedTabIds];
    const [draggedId] = newIds.splice(draggedIndex, 1);
    newIds.splice(targetIndex, 0, draggedId);
    setOrderedTabIds(newIds);
    setDraggedIndex(null);
    localStorage.setItem('sidebar_menu_order_v2', JSON.stringify(newIds));
  };

  const handleLogout = () => {
    clearAuthUser();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setVisitedTabIds(new Set(['dashboard']));
    window.history.pushState({ tabId: 'dashboard' }, '', '/dashboard');
    showToast('Đã đăng xuất tài khoản', 'success');
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    const targetTab = user.role === 'student' ? 'assignments' : 'dashboard';
    setActiveTab(targetTab);
    setVisitedTabIds(new Set([targetTab]));
    window.history.pushState({ tabId: targetTab }, '', `/${targetTab}`);
  };

  // If user is not logged in, show LoginPage
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isStudent = currentUser.role === 'student';
  const visibleTabIds = isStudent
    ? orderedTabIds.filter((id) => id === 'assignments' || id === 'results')
    : orderedTabIds;

  const visibleTabs = isStudent
    ? TAB_DEFINITIONS.filter((t) => t.id === 'assignments' || t.id === 'results')
    : TAB_DEFINITIONS;

  const { isDark } = useTheme();

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#f1f5f9] dark:bg-[#07090e] text-slate-900 dark:text-slate-50 overflow-hidden font-sans select-none transition-colors duration-200">
      <div className="relative flex flex-row flex-1 overflow-hidden z-10">
        {/* SIDEBAR NAVIGATION */}
        <Sidebar
          isSidebarExpanded={isSidebarExpanded}
          toggleSidebar={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          orderedTabIds={visibleTabIds}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          draggedIndex={draggedIndex}
          setDraggedIndex={setDraggedIndex}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          profileRef={profileRef}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* MAIN BODY SKELETON */}
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
          <main className="flex-1 overflow-hidden bg-[#f1f5f9] dark:bg-[#080b14] relative transition-colors duration-200">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isVisited = visitedTabIds.has(tab.id);
              return (
                <div key={tab.id} className={`h-full w-full ${isActive ? 'animate-tab-enter' : 'hidden'}`}>
                  {isVisited && tab.render({
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
                      if (numVersions) setPreloadedVersions(numVersions);
                      setPreloadedGrade(grade || null);
                      setPreloadedUnit(unit || null);
                      handleSelectTab('formatter');
                    },
                  })}
                </div>
              );
            })}
          </main>
        </div>
      </div>

      {/* STATUS BAR */}
      <footer className="h-8 bg-white dark:bg-[#06070a] flex items-center justify-between px-6 text-[11px] text-slate-500 dark:text-slate-400 select-none shrink-0 font-semibold z-10 border-t border-slate-200 dark:border-white/[0.04] transition-colors duration-200">
        <div className="flex items-center gap-3">
          <SyncIndicator />
          <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-white/10" />
          <AnimatedThemeToggle size="sm" />
          <span className="hidden md:inline text-slate-500 dark:text-slate-400">Local-First Engine — Tự động đồng bộ với máy chủ PostgreSQL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">Đang đăng nhập:</span>
          <strong className="text-indigo-600 dark:text-indigo-300 font-bold">{currentUser.name}</strong>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isStudent ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'}`}>
            {isStudent ? 'Học sinh' : 'Quản trị viên'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AnimatedToastProvider position="bottom-right">
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </AnimatedToastProvider>
    </ThemeProvider>
  );
}
