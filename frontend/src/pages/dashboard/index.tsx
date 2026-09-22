import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../api';
import { getLocalDateStr } from '../../utils';
import { showToast } from '../../components/Toast';
import { DashboardStats, TodaySessionItem, StudentAlertItem } from './types';
import { DashboardStatsGrid } from './components/DashboardStatsGrid';
import { TodaySessionsList } from './components/TodaySessionsList';
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
  const [studentAlerts, setStudentAlerts] = useState<StudentAlertItem[]>([]);

  const todayStr = getLocalDateStr();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getTeachersCM().catch(() => []),
        api.getClasses().catch(() => []),
      ]);

      const students = Array.isArray(studentsRes) ? studentsRes : [];
      const teachers = Array.isArray(teachersRes) ? teachersRes : [];
      const classes = Array.isArray(classesRes) ? classesRes : [];

      let allTodaySessions: TodaySessionItem[] = [];
      let completedAttendanceCount = 0;

      const sessionsPromises = classes.slice(0, 20).map(async (c: any) => {
        try {
          const sessions = await api.getClassSessions(c.id);
          if (Array.isArray(sessions)) {
            const todayClsSessions = sessions.filter((s: any) => s.date === todayStr);
            if (todayClsSessions.length === 0) return [];

            let hasAttendance = false;
            try {
              const attData = await api.getClassAttendance(c.id, todayStr);
              if (attData && attData.records && attData.records.length > 0) {
                hasAttendance = attData.records.some(
                  (r: any) => r.present !== null || r.check1 !== null || r.check2 !== null
                );
              }
            } catch {
              hasAttendance = false;
            }

            if (hasAttendance) completedAttendanceCount += todayClsSessions.length;

            return todayClsSessions.map((s: any) => ({
              id: s.id,
              class_id: c.id,
              class_name: c.class_name,
              start_time: s.start_time || '00:00',
              duration: s.duration || 90,
              teacher_name: s.teacher_name || c.teacher_name || 'Chưa phân công',
              room: s.room || c.room || 'Phòng học',
              status: s.status || 'Sắp diễn ra',
              isAttendanceRecorded: hasAttendance,
            }));
          }
        } catch {
          return [];
        }
        return [];
      });

      const sessionResults = await Promise.all(sessionsPromises);
      sessionResults.forEach((arr) => {
        if (arr && arr.length > 0) allTodaySessions = allTodaySessions.concat(arr);
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

      setStats({
        totalStudents: students.filter((s: any) => s.status !== 'Đã nghỉ').length,
        totalTeachers: teachers.length,
        activeClasses: classes.filter((c: any) => c.status !== 'Đã kết thúc').length,
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
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#e2e8f0] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Top Executive Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-[#1c2438]">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Bảng Điều Khiển Trung Tâm
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Dữ liệu vận hành tự động và lịch giảng dạy ngày {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#141b2d] dark:hover:bg-[#1a233a] border border-slate-300 dark:border-[#232f4d] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Cập nhật số liệu</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Overview Grid */}
      <DashboardStatsGrid stats={stats} />

      {/* 3. Main Operational Split (Calendar on Left, Actions on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <TodaySessionsList sessions={todaySessions} onNavigate={navigateTo} />
        </div>
        <div>
          <DashboardSidebar alerts={studentAlerts} onNavigate={navigateTo} />
        </div>
      </div>
    </div>
  );
}
