import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { getLocalDateStr } from '../../utils';
import { showToast } from '../../components/Toast';
import { DashboardStats, TodaySessionItem, StudentAlertItem, ActiveClassItem } from './types';
import { DashboardStatsGrid } from './components/DashboardStatsGrid';
import { TodaySessionsList } from './components/TodaySessionsList';
import { ActiveClassesOverview } from './components/ActiveClassesOverview';
import { DashboardSidebar } from './components/DashboardSidebar';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    todaySessionsCount: 0,
    attendanceCompletedCount: 0,
  });
  const [todaySessions, setTodaySessions] = useState<TodaySessionItem[]>([]);
  const [activeClasses, setActiveClasses] = useState<ActiveClassItem[]>([]);
  const [studentAlerts, setStudentAlerts] = useState<StudentAlertItem[]>([]);

  const todayStr = getLocalDateStr();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, classesRes, allSessionsRes] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getTeachersCM().catch(() => []),
        api.getClasses().catch(() => []),
        api.getClassSessions(0, todayStr.slice(0, 7)).catch(() => []),
      ]);

      const students = Array.isArray(studentsRes) ? studentsRes : [];
      const teachers = Array.isArray(teachersRes) ? teachersRes : [];
      const classes = Array.isArray(classesRes) ? classesRes : [];
      const rawSessions = Array.isArray(allSessionsRes) ? allSessionsRes : [];

      let completedAttendanceCount = 0;
      const todayClsSessions = rawSessions.filter((s: any) => s.date === todayStr);

      const allTodaySessions: TodaySessionItem[] = todayClsSessions.map((s: any) => {
        const hasAttendance = Boolean((s.attendance_total && s.attendance_total > 0) || (s.attended_count && s.attended_count > 0));
        if (hasAttendance) completedAttendanceCount++;
        const matchedClass = classes.find((c: any) => c.id === s.class_id);
        return {
          id: s.id,
          class_id: s.class_id,
          class_name: s.class_name || matchedClass?.class_name || 'Lớp học',
          start_time: s.start_time || '00:00',
          duration: s.duration || 90,
          teacher_name: s.teacher_name || matchedClass?.teacher_name || 'Chưa phân công',
          room: s.room || matchedClass?.room || 'Phòng học',
          status: s.status || 'Sắp diễn ra',
          isAttendanceRecorded: hasAttendance,
        };
      });

      allTodaySessions.sort((a, b) => a.start_time.localeCompare(b.start_time));

      const alerts: StudentAlertItem[] = [];
      students.forEach((st: any) => {
        if (st.status === 'Tạm dừng' || st.status === 'Bảo lưu') {
          alerts.push({
            student_id: st.id,
            student_name: st.full_name,
            class_name: st.grade || 'Học sinh',
            issue: `Trạng thái: ${st.status}`,
            severity: 'medium',
          });
        }
      });

      const activeList: ActiveClassItem[] = classes
        .filter((c: any) => c.status !== 'Đã kết thúc')
        .map((c: any) => ({
          id: c.id,
          class_name: c.class_name,
          teacher_name: c.teacher_name,
          grade: c.grade,
          subject: c.subject,
          room: c.room,
          student_count: c.student_count || 0,
          status: c.status || 'Đang hoạt động',
        }));
      setActiveClasses(activeList);

      setStats({
        totalStudents: students.filter((s: any) => s.status !== 'Đã nghỉ').length,
        totalTeachers: teachers.length,
        activeClasses: activeList.length,
        todaySessionsCount: allTodaySessions.length,
        attendanceCompletedCount: completedAttendanceCount,
      });
      setTodaySessions(allTodaySessions);
      setStudentAlerts(alerts.slice(0, 6));
    } catch (err: any) {
      showToast('Lỗi khi tải dữ liệu bảng điều khiển: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const navigateTo = (tab: string, extraData?: { classId?: number }) => {
    if (extraData?.classId) {
      sessionStorage.setItem('cm_active_class_id', String(extraData.classId));
      window.dispatchEvent(new CustomEvent('navigate-to-class', { detail: { classId: extraData.classId } }));
    }
    window.history.pushState({ tabId: tab }, '', `/${tab}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#f1f5f9] dark:bg-[#09090b] text-slate-800 dark:text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Top Executive Status Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-[#27272a]">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Bảng Điều Khiển Trung Tâm
          </h1>
        </div>
      </div>

      {/* 2. Top Stats Overview Grid */}
      <DashboardStatsGrid stats={stats} />

      {/* 3. Main Operational Split (Calendar & Active Classes on Left, Actions on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <TodaySessionsList sessions={todaySessions} onNavigate={navigateTo} />
          <ActiveClassesOverview classes={activeClasses} onNavigate={navigateTo} />
        </div>
        <div className="lg:col-span-1">
          <DashboardSidebar alerts={studentAlerts} onNavigate={navigateTo} />
        </div>
      </div>
    </div>
  );
}
