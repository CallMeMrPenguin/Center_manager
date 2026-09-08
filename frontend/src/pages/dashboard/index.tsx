import React, { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, CalendarCheck, UserCheck, 
  PlusCircle, Calendar, BarChart3, FileCheck, ArrowRight,
  Clock, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { getLocalDateStr } from '../../utils';
import { showToast } from '../../components/Toast';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  todaySessionsCount: number;
}

interface TodaySessionItem {
  id: number;
  class_id: number;
  class_name: string;
  start_time: string;
  duration: number;
  teacher_name?: string;
  room?: string;
  status: string;
}

interface StudentAlertItem {
  student_id: number;
  student_name: string;
  class_name: string;
  issue: string;
  severity: 'high' | 'medium';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    todaySessionsCount: 0,
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

      // Fetch today sessions across active classes
      let allTodaySessions: TodaySessionItem[] = [];
      const sessionsPromises = classes.slice(0, 15).map(async (c: any) => {
        try {
          const sessions = await api.getClassSessions(c.id);
          if (Array.isArray(sessions)) {
            return sessions
              .filter((s: any) => s.date === todayStr)
              .map((s: any) => ({
                id: s.id,
                class_id: c.id,
                class_name: c.class_name,
                start_time: s.start_time || '00:00',
                duration: s.duration || 90,
                teacher_name: s.teacher_name || c.teacher_name || 'Chưa phân công',
                room: s.room || c.room || 'Phòng học',
                status: s.status || 'Sắp diễn ra',
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

      // Build alerts from students with notes or inactive status
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

  const navigateTo = (tab: string) => {
    window.location.hash = tab;
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#090d16] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1c2438]">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            Bảng Điều Khiển Trung Tâm
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp dữ liệu vận hành học vụ và lịch giảng dạy ngày {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141b2d] hover:bg-[#1a233a] border border-[#232f4d] text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Cập nhật số liệu</span>
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0e1322] border border-[#1e2742] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học sinh đang học</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white tracking-tight">{stats.totalStudents}</span>
            <span className="text-[11px] font-bold text-blue-400">Đang theo học</span>
          </div>
        </div>

        <div className="bg-[#0e1322] border border-[#1e2742] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp học hoạt động</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white tracking-tight">{stats.activeClasses}</span>
            <span className="text-[11px] font-bold text-indigo-400">Lớp trong kỳ</span>
          </div>
        </div>

        <div className="bg-[#0e1322] border border-[#1e2742] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ca học hôm nay</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarCheck size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white tracking-tight">{stats.todaySessionsCount}</span>
            <span className="text-[11px] font-bold text-emerald-400">Buổi lên lớp</span>
          </div>
        </div>

        <div className="bg-[#0e1322] border border-[#1e2742] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đội ngũ giáo viên</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white tracking-tight">{stats.totalTeachers}</span>
            <span className="text-[11px] font-bold text-amber-400">Giảng viên/Trợ giảng</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid: Today's Sessions & Quick Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule List */}
        <div className="lg:col-span-2 bg-[#0e1322] border border-[#1e2742] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1c2438]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">
                  Lịch Giảng Dạy & Điểm Danh Hôm Nay
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">
                  {todaySessions.length} ca học được lên lịch
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('schedule')}
              className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
            >
              <span>Xem toàn bộ lịch</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <CheckCircle2 size={36} className="text-slate-600 mb-2" />
              <span className="text-sm font-bold text-slate-300">Không có ca học nào trong ngày hôm nay</span>
              <span className="text-xs text-slate-500 mt-1">Các buổi học tiếp theo sẽ hiển thị tại đây</span>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {todaySessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#13192c] border border-[#1e2844] hover:border-blue-500/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-black">
                      {sess.start_time}
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-sm block">
                        {sess.class_name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
                        <span>Giáo viên: {sess.teacher_name}</span>
                        <span>Phòng: {sess.room}</span>
                        <span>Thời lượng: {sess.duration} phút</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('classes')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    Vào lớp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Launchpad & Attention List */}
        <div className="space-y-6">
          {/* Quick Launchpad */}
          <div className="bg-[#0e1322] border border-[#1e2742] rounded-2xl p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5">
              Phím Tắt Tác Vụ Nhanh
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigateTo('students')}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#13192c] hover:bg-[#19223c] border border-[#1e2844] text-left transition cursor-pointer"
              >
                <PlusCircle size={15} className="text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">Thêm học sinh</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('schedule')}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#13192c] hover:bg-[#19223c] border border-[#1e2844] text-left transition cursor-pointer"
              >
                <Calendar size={15} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">Xếp lịch học</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('kiemtra')}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#13192c] hover:bg-[#19223c] border border-[#1e2844] text-left transition cursor-pointer"
              >
                <FileCheck size={15} className="text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">Tạo đề thi</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('reports')}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#13192c] hover:bg-[#19223c] border border-[#1e2844] text-left transition cursor-pointer"
              >
                <BarChart3 size={15} className="text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">Xem báo cáo</span>
              </button>
            </div>
          </div>

          {/* Attention Alerts */}
          <div className="bg-[#0e1322] border border-[#1e2742] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Học Sinh Cần Lưu Ý
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {studentAlerts.length} mục
              </span>
            </div>

            {studentAlerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Tất cả học sinh đều đang trong trạng thái học tập ổn định
              </div>
            ) : (
              <div className="space-y-2">
                {studentAlerts.map((al) => (
                  <div
                    key={al.student_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#13192c] border border-[#1e2844] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-200 block leading-tight">{al.student_name}</span>
                        <span className="text-[10px] text-slate-400">{al.class_name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {al.issue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
