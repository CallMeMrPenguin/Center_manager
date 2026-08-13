import React from 'react';
import { 
  FileCode, Database, BookOpen, Settings as SettingsIcon, FolderOpen, LucideIcon,
  LayoutDashboard, Users, UserCheck, Briefcase, ClipboardList, Award, 
  CreditCard, Receipt, BarChart3, CalendarCheck, UserCog, FileCheck, GraduationCap
} from 'lucide-react';
import TestFormatter from '../pages/test-formatter';
import QuestionBank from '../pages/question-bank';
import VocabularyBank from '../pages/vocabulary-bank';
import UnitConfig from '../pages/unit-config';
import Settings from '../pages/settings';
import DocumentManager from '../pages/document-manager';
import WaitingForDevelopment from '../components/WaitingForDevelopment';
import StudentsPage from '../pages/students';
import TeachersPage from '../pages/teachers';
import ClassesPage from '../pages/classes';
import CoursesPage from '../pages/courses';
import KiemTraPage from '../pages/kiemtra';
import SchedulePage from '../pages/schedule';
import ReportsPage from '../pages/reports';

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

export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    id: 'dashboard',
    label: 'Bảng Điều Khiển',
    icon: LayoutDashboard,
    section: 'none',
    render: () => <WaitingForDevelopment title="Bảng Điều Khiển" />
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
  {
    id: 'formatter',
    label: 'Trình Tạo Đề Thi',
    icon: FileCode,
    section: 'assessments',
    render: (props) => (
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
    section: 'assessments',
    render: (props) => (
      <QuestionBank onCreateTest={props.onCreateTest} isActive={props.isActive} />
    )
  },
  {
    id: 'assignments',
    label: 'Bài Tập Về Nhà',
    icon: ClipboardList,
    section: 'assessments',
    render: () => <WaitingForDevelopment title="Bài Tập Về Nhà" />
  },
  {
    id: 'results',
    label: 'Kết Quả Học Tập',
    icon: Award,
    section: 'assessments',
    render: () => <WaitingForDevelopment title="Kết Quả Học Tập" />
  },
  {
    id: 'vocab-bank',
    label: 'Từ Vựng Chủ Đề',
    icon: BookOpen,
    section: 'resources',
    render: (props) => <VocabularyBank isActive={props.isActive} />
  },
  {
    id: 'unit-config',
    label: 'Cấu Hình Unit',
    icon: SettingsIcon,
    section: 'resources',
    render: () => <UnitConfig />
  },
  {
    id: 'file-manager',
    label: 'Tài Liệu',
    icon: FolderOpen,
    section: 'resources',
    render: () => <DocumentManager />
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
    render: () => <WaitingForDevelopment title="Quyền & Vai Trò" />
  },
  {
    id: 'settings',
    label: 'Cấu Hình Hệ Thống',
    icon: SettingsIcon,
    section: 'settings',
    render: () => <Settings />
  }
];
