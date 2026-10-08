import React, { lazy } from 'react';
import { 
  FileCode, Database, BookOpen, Settings as SettingsIcon, FolderOpen, LucideIcon,
  LayoutDashboard, Users, UserCheck, Briefcase, ClipboardList, Award, 
  CreditCard, Receipt, BarChart3, CalendarCheck, UserCog, FileCheck, GraduationCap,
  PenTool, Sparkles, FileText
} from 'lucide-react';

import WaitingForDevelopment from '../components/WaitingForDevelopment';

const TestFormatter = lazy(() => import('../pages/test-formatter'));
const QuestionBank = lazy(() => import('../pages/question-bank'));
const VocabularyBank = lazy(() => import('../pages/vocabulary-bank'));
const UnitConfig = lazy(() => import('../pages/unit-config'));
const Settings = lazy(() => import('../pages/settings'));
const DocumentManager = lazy(() => import('../pages/document-manager'));
const CanvasBoardPage = lazy(() => import('../pages/canvas-board'));
const WordEditorPage = lazy(() => import('../pages/word-editor'));
const DashboardPage = lazy(() => import('../pages/dashboard'));
const StudentsPage = lazy(() => import('../pages/students'));
const TeachersPage = lazy(() => import('../pages/teachers'));
const ClassesPage = lazy(() => import('../pages/classes'));
const CoursesPage = lazy(() => import('../pages/courses'));
const KiemTraPage = lazy(() => import('../pages/kiemtra'));
const SchedulePage = lazy(() => import('../pages/schedule'));
const ReportsPage = lazy(() => import('../pages/reports'));
const UIShowcasePage = lazy(() => import('../pages/ui-showcase'));
const ResultsPage = lazy(() => import('../pages/results'));
const AssignmentsPage = lazy(() => import('../pages/assignments'));
const UsersRolesPage = lazy(() => import('../pages/users-roles'));


export interface TabDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  section: 'none' | 'main' | 'assessments' | 'resources' | 'finance' | 'analytics' | 'settings';
  render: (props: {
    isActive?: boolean;
    preloadedQuestions: any[] | null;
    preloadedVersions: number | null;
    preloadedGrade: string | null;
    preloadedUnit: string | null;
    clearPreloadedQuestions: () => void;
    onCreateTest: (questions: any[], numVersions?: number, grade?: string, unit?: string) => void;
  }) => React.ReactNode;
}

// Auto-detect environment:
// 1. If VITE_APP_MODE is explicitly set, honor it.
// 2. Otherwise auto-detect: if domain is not localhost/127.0.0.1 (e.g. remote web domain), default to Web mode.
const isRunningOnWeb = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1' &&
  !window.location.hostname.startsWith('192.168.');

export const isLocalMode = import.meta.env.VITE_APP_MODE === 'local'
  ? true
  : (import.meta.env.VITE_APP_MODE === 'web' ? false : !isRunningOnWeb);

export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    id: 'dashboard',
    label: 'Bảng Điều Khiển',
    icon: LayoutDashboard,
    section: 'none',
    render: () => <DashboardPage />
  },
  {
    id: 'students',
    label: 'Học Sinh',
    icon: Users,
    section: 'main',
    render: () => <StudentsPage />
  },
  {
    id: 'classes',
    label: 'Lớp Học',
    icon: GraduationCap,
    section: 'main',
    render: () => <ClassesPage />
  },
  {
    id: 'schedule',
    label: 'Lịch Học',
    icon: CalendarCheck,
    section: 'main',
    render: () => <SchedulePage />
  },
  {
    id: 'teachers',
    label: 'Nhân Sự',
    icon: UserCheck,
    section: 'main',
    render: () => <TeachersPage />
  },
  {
    id: 'courses',
    label: 'Khóa Học',
    icon: Briefcase,
    section: 'main',
    render: () => <CoursesPage />
  },
  {
    id: 'kiemtra',
    label: 'Kiểm Tra & Quiz',
    icon: FileCheck,
    section: 'assessments',
    render: () => <KiemTraPage />
  },
  // --- Local Desktop Only Tabs (Soạn đề & Tài nguyên offline) ---
  ...(isLocalMode ? [
    {
      id: 'formatter',
      label: 'Trình Tạo Đề Thi',
      icon: FileCode,
      section: 'assessments' as const,
      render: (props: any) => (
        <TestFormatter
          preloadedQuestions={props.preloadedQuestions}
          preloadedVersions={props.preloadedVersions}
          preloadedGrade={props.preloadedGrade}
          preloadedUnit={props.preloadedUnit}
          clearPreloadedQuestions={props.clearPreloadedQuestions}
        />
      )
    },
    {
      id: 'question-bank',
      label: 'Ngân Hàng Câu Hỏi',
      icon: Database,
      section: 'assessments' as const,
      render: (props: any) => (
        <QuestionBank onCreateTest={props.onCreateTest} isActive={props.isActive} />
      )
    },
  ] : []),
  {
    id: 'assignments',
    label: 'Bài Tập Về Nhà',
    icon: ClipboardList,
    section: 'assessments',
    render: () => <AssignmentsPage />
  },
  {
    id: 'results',
    label: 'Kết Quả Học Tập',
    icon: Award,
    section: 'assessments',
    render: () => <ResultsPage />
  },
  // --- Local Resources Only Tabs ---
  ...(isLocalMode ? [
    {
      id: 'vocab-bank',
      label: 'Từ Vựng Chủ Đề',
      icon: BookOpen,
      section: 'resources' as const,
      render: (props: any) => <VocabularyBank isActive={props.isActive} />
    },
    {
      id: 'unit-config',
      label: 'Cấu Hình Unit',
      icon: SettingsIcon,
      section: 'resources' as const,
      render: () => <UnitConfig />
    },
    {
      id: 'file-manager',
      label: 'Tài Liệu',
      icon: FolderOpen,
      section: 'resources' as const,
      render: () => <DocumentManager />
    },
  ] : []),
  {
    id: 'word-editor',
    label: 'Soạn Thảo Văn Bản',
    icon: FileText,
    section: 'resources',
    render: () => <WordEditorPage />
  },
  {
    id: 'canvas-board',
    label: 'Canvas',
    icon: PenTool,
    section: 'resources',
    render: () => <CanvasBoardPage />
  },
  {
    id: 'payments',
    label: 'Thanh Toán',
    icon: CreditCard,
    section: 'finance',
    render: () => <WaitingForDevelopment title="Quản Lý Thanh Toán" />
  },
  {
    id: 'invoices',
    label: 'Hóa Đơn',
    icon: Receipt,
    section: 'finance',
    render: () => <WaitingForDevelopment title="Quản Lý Hóa Đơn" />
  },
  {
    id: 'reports',
    label: 'Báo Cáo Thống Kê',
    icon: BarChart3,
    section: 'main',
    render: () => <ReportsPage />
  },
  {
    id: 'users-roles',
    label: 'Quyền & Vai Trò',
    icon: UserCog,
    section: 'settings',
    render: () => <UsersRolesPage />
  },
  ...(isLocalMode ? [
    {
      id: 'ui-showcase',
      label: 'UI Showcase',
      icon: Sparkles,
      section: 'settings' as const,
      render: () => <UIShowcasePage />
    }
  ] : []),
  {
    id: 'settings',
    label: 'Cấu Hình Hệ Thống',
    icon: SettingsIcon,
    section: 'settings',
    render: () => <Settings />
  }
];
