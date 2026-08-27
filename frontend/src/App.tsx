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

function AppContent() {
  // Auto-detect and reload on new deployment
  useAutoDeploymentRefresh();

  // Persistent Login session (auto-restores user on refresh / app reopening)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Background data cache warmup for 0ms instant tab switching
  useWarmupDataCache(currentUser);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const user = getCurrentUser();
    return user?.role === 'student' ? 'assignments' : 'dashboard';
  });
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
    showToast('Đã đăng xuất tài khoản', 'success');
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      setActiveTab('assignments');
    } else {
      setActiveTab('dashboard');
    }
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

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#08090e] text-slate-50 overflow-hidden font-sans select-none">
      <div className="relative flex flex-row flex-1 overflow-hidden p-4 gap-4 z-10">
        {/* SIDEBAR NAVIGATION */}
        <Sidebar
          isSidebarExpanded={isSidebarExpanded}
          toggleSidebar={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
          <main className="flex-1 overflow-hidden bg-transparent relative gradient-border-card rounded-2xl">
            {visibleTabs.map((tab) => {
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
                      if (numVersions) setPreloadedVersions(numVersions);
                      setPreloadedGrade(grade || null);
                      setPreloadedUnit(unit || null);
                      setActiveTab('formatter');
                    },
                  })}
                </div>
              );
            })}
          </main>
        </div>
      </div>

      {/* STATUS BAR */}
      <footer className="h-8 bg-[#06070a] flex items-center justify-between px-6 text-[11px] text-slate-400 select-none shrink-0 font-semibold z-10 border-t border-white/[0.04]">
        <div className="flex items-center gap-3">
          <SyncIndicator />
          <span className="hidden md:inline text-slate-400">Local-First Engine — Tự động đồng bộ với Supabase</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Đang đăng nhập:</span>
          <strong className="text-indigo-300">{currentUser.name}</strong>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isStudent ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
            {isStudent ? 'Học sinh' : 'Quản trị viên'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AnimatedToastProvider position="bottom-right">
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </AnimatedToastProvider>
  );
}
