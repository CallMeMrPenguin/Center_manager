import React, { useState, useEffect } from 'react';
import { Plus, List, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { CustomSelect } from '../../components/CustomSelect';
import { ScheduleDatePicker } from './components/ScheduleDatePicker';
import { DataTable } from '../../components/DataTable';
import { getLocalDateStr } from '../../utils';
import { registerGoogleHolidays } from '../../utils/vietnamHolidays';
import {
  ClassSession, DayCfg, PALETTE_20, DAY_HDRS, DAYS, DAY_NUM,
  getSessionColor, getDynamicSessionInfo
} from './types';
import { SessionModal } from './components/SessionModal';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleKpiCards } from './components/ScheduleKpiCards';
import { useScheduleColumns } from './hooks/useScheduleColumns';
import { useScheduleActions } from './hooks/useScheduleActions';
import { useScheduleCalendar } from './hooks/useScheduleCalendar';
import { dataCache } from '../../utils/dataCache';

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const {
    viewMode,
    handleChangeViewMode,
    selectedMonth,
    setSelectedMonth,
    weekStart,
    setWeekStart,
    setWeekStartToday,
    jumpToDate,
    today,
    yr,
    mo,
    firstDay,
    daysInMonth,
    startOff,
    totalCells,
    weekDays,
    changeWeek,
  } = useScheduleCalendar();
  const [scheduleScope, setScheduleScope] = useState<'all' | 'week'>('all');

  const changeMonth = (delta: number) => {
    const nextDate = new Date(yr, mo - 1 + delta, 1);
    const newMo = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMo);
    const d = nextDate.getDay();
    const monOffset = d === 0 ? 6 : d - 1;
    const mon = new Date(nextDate);
    mon.setDate(nextDate.getDate() - monOffset);
    setWeekStart(mon);
  };
  const cachedClasses = dataCache.get<any[]>('/api/classes?search=')?.data;
  const [classesList, setClassesList] = useState<any[]>(() => cachedClasses || []);
  const [classFilter, setClassFilter] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [mode, setMode] = useState<'single' | 'weekdays'>('weekdays');
  const [color, setColor] = useState('#2563eb');
  const [form, setForm] = useState<Partial<ClassSession>>({
    class_id: undefined,
    date: getLocalDateStr(),
    start_time: '18:00',
    duration: 90,
    status: 'Sắp diễn ra',
    notes: '',
  });

  const defaultDayCfgs = () =>
    DAYS.reduce((a, d) => {
      a[d] = { checked: d === 'Thứ 2' || d === 'Thứ 4', time: '18:00', duration: 90 };
      return a;
    }, {} as Record<string, DayCfg>);

  const [dayCfgs, setDayCfgs] = useState<Record<string, DayCfg>>(defaultDayCfgs());

  const loadData = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const targetClassId = classFilter ? Number(classFilter) : 0;
      const m1 = weekDays[0]?.dateStr?.slice(0, 7) || selectedMonth;
      const m2 = weekDays[6]?.dateStr?.slice(0, 7) || selectedMonth;
      const monthsToFetch = Array.from(new Set([m1, m2, selectedMonth]));

      const [cls, ...sessionArrays] = await Promise.all([
        api.getClasses().catch(() => []),
        ...monthsToFetch.map(m => api.getClassSessions(targetClassId, m).catch(() => [])),
      ]);
      setClassesList(cls);

      const sessionMap = new Map<number, any>();
      sessionArrays.flat().forEach((s: any) => {
        if (s?.id) sessionMap.set(s.id, s);
      });
      const ss = Array.from(sessionMap.values());

      const all: ClassSession[] = ss.map((s: any) => {
        const matchedClass = cls.find((c: any) => c.id === s.class_id);
        return {
          ...s,
          class_name: s.class_name || matchedClass?.class_name || '',
          teacher_name: s.teacher_name || matchedClass?.teacher_name || '',
          room: s.room || matchedClass?.room || '',
          student_count: s.student_count !== undefined ? s.student_count : (matchedClass?.student_count || 0),
        };
      });
      all.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
      setSessions(all);

      // Background sync holidays for the selected year
      const [yearStr] = selectedMonth.split('-');
      const year = parseInt(yearStr) || new Date().getFullYear();
      api.getHolidays(year, true).then((holidays: any[]) => {
        if (holidays && Array.isArray(holidays)) {
          registerGoogleHolidays(holidays);
        }
      }).catch(() => {});
    } catch (e: any) {
      if (!isSilent) showToast('Không thể tải lịch học: ' + e.message, 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const h = () => loadData(true);
    window.addEventListener('data-changed', h);
    return () => window.removeEventListener('data-changed', h);
  }, [selectedMonth, classFilter, weekDays[0]?.dateStr]);


  const applyClassSchedule = async (cid: number, targetDateStr?: string) => {
    try {
      const slots = await api.getClassWeeklySchedule(cid);
      const newCfgs: Record<string, DayCfg> = DAYS.reduce((acc, d) => {
        acc[d] = { checked: false, time: '18:00', duration: 90 };
        return acc;
      }, {} as Record<string, DayCfg>);

      let matchedTime = '18:00';
      let matchedDur = 90;

      if (slots && slots.length > 0) {
        slots.forEach((s: any) => {
          if (newCfgs[s.day_of_week]) {
            newCfgs[s.day_of_week] = {
              checked: true,
              time: s.start_time || '18:00',
              duration: s.duration || 90,
            };
          }
        });

        if (targetDateStr) {
          const dt = new Date(targetDateStr);
          const dayName = DAYS.find((k) => DAY_NUM[k] === dt.getDay());
          const found = slots.find((s: any) => s.day_of_week === dayName);
          matchedTime = (found || slots[0]).start_time;
          matchedDur = (found || slots[0]).duration;
        } else {
          matchedTime = slots[0].start_time;
          matchedDur = slots[0].duration;
        }
      } else {
        newCfgs['Thứ 2'] = { checked: true, time: '18:00', duration: 90 };
        newCfgs['Thứ 4'] = { checked: true, time: '18:00', duration: 90 };
      }

      setDayCfgs(newCfgs);
      setForm((prev) => ({
        ...prev,
        start_time: matchedTime,
        duration: matchedDur,
      }));
    } catch {
      // Ignore errors fetching class schedule
    }
  };

  const openAdd = async (dateStr?: string) => {
    setEditing(null);
    setMode(dateStr ? 'single' : 'weekdays');
    const selectedCid = (classFilter && Number(classFilter) > 0) ? Number(classFilter) : (classesList[0]?.id || 1);
    const targetCls = classesList.find((c) => c.id === selectedCid) || classesList[0];
    const initialColor = targetCls?.color || PALETTE_20[(selectedCid * 3 + 1) % PALETTE_20.length];
    setColor(initialColor);
    const dStr = dateStr || today;
    setForm({
      class_id: selectedCid,
      date: dStr,
      start_time: '18:00',
      duration: 90,
      status: 'Sắp diễn ra',
      notes: '',
    });
    setModalOpen(true);
    if (selectedCid) {
      await applyClassSchedule(selectedCid, dStr);
    }
  };

  const openEdit = (sess: ClassSession) => {
    setEditing(sess);
    setMode('single');
    setColor(getSessionColor(sess));
    setForm({ ...sess });
    setModalOpen(true);
  };

  const { save, del } = useScheduleActions({
    classesList,
    sessions,
    selectedMonth,
    daysInMonth,
    yr,
    mo,
    loadData,
    form,
    color,
    editing,
    mode,
    dayCfgs,
    setModalOpen,
  });

  const total = sessions.length;
  const done = sessions.filter((s) => getDynamicSessionInfo(s).status === 'Đã học').length;
  const upcoming = sessions.filter((s) => getDynamicSessionInfo(s).status === 'Sắp diễn ra').length;
  const off = sessions.filter((s) => getDynamicSessionInfo(s).status === 'Nghỉ').length;

  const sessionColumns = useScheduleColumns(openEdit);

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 pb-28 sm:pb-5 gap-4 sm:gap-5 overflow-y-auto bg-[#f1f5f9] dark:bg-[#09090b] text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            BẢNG LỊCH HỌC
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAdd()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer border-0 shadow-xs hover:shadow-sm"
            title="Thêm Lịch Học"
          >
            <Plus size={14} />
            <span>Thêm Lịch Học</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ScheduleKpiCards total={total} done={done} upcoming={upcoming} off={off} />

      {/* UNIFIED CONTAINER: Integrated Toolbar + Calendar / List */}
      <div className="bg-white dark:bg-[#111728] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs flex-1 min-h-0 select-none flex flex-col">
        {/* Integrated Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111728] border-b border-slate-200 dark:border-white/10 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Merged Date & Scope Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (scheduleScope === 'all') {
                    changeMonth(-1);
                  } else {
                    changeWeek(-1);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer border-0"
                title={scheduleScope === 'all' ? 'Tháng trước' : 'Tuần trước'}
              >
                <ChevronLeft size={14} />
              </button>
              <ScheduleDatePicker
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                scope={scheduleScope}
                onSelectScope={setScheduleScope}
                weekStart={weekStart}
                onSelectWeekStart={setWeekStart}
                today={today}
              />
              <button
                type="button"
                onClick={() => {
                  if (scheduleScope === 'all') {
                    changeMonth(1);
                  } else {
                    changeWeek(1);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white transition cursor-pointer border-0"
                title={scheduleScope === 'all' ? 'Tháng sau' : 'Tuần sau'}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <CustomSelect
              value={classFilter}
              onChange={(val) => setClassFilter(val)}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classesList.map((c) => ({ value: String(c.id), label: c.class_name })),
              ]}
              className="w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChangeViewMode(viewMode === 'week' ? 'list' : 'week')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shadow-xs border-0"
              title={viewMode === 'week' ? 'Chuyển sang chế độ danh sách' : 'Chuyển sang chế độ lịch tuần'}
            >
              {viewMode === 'week' ? <List size={16} /> : <Calendar size={16} />}
            </button>
          </div>
        </div>

        {/* WEEK / MONTH TIMELINE VIEW */}
        {viewMode === 'week' && (
          <ScheduleCalendarView
            scope={scheduleScope}
            viewMode="week"
            selectedMonth={selectedMonth}
            totalCells={totalCells}
            startOff={startOff}
            daysInMonth={daysInMonth}
            yr={yr}
            mo={mo}
            today={today}
            sessions={sessions}
            weekDays={weekDays}
            changeWeek={changeWeek}
            setWeekStartToday={setWeekStartToday}
            openAdd={openAdd}
            openEdit={openEdit}
          />
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="p-4 flex-1 min-h-0 overflow-auto flex flex-col">
            <DataTable
              tableId="schedule-table"
              exportFilename="lich_hoc"
              data={sessions}
              columns={sessionColumns}
              loading={loading}
              loadingMessage="Đang tải lịch học..."
              emptyMessage="Không có buổi học nào."
              pageSize={20}
            />
          </div>
        )}
      </div>

      {/* MODAL */}
      <SessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        mode={mode}
        setMode={setMode}
        color={color}
        setColor={setColor}
        dayCfgs={dayCfgs}
        setDayCfgs={setDayCfgs}
        classesList={classesList}
        selectedMonth={selectedMonth}
        onSave={save}
        onDelete={del}
        onApplyClassSchedule={applyClassSchedule}
      />
    </div>
  );
}
