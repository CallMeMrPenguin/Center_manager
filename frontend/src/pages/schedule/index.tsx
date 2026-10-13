import React, { useState, useEffect } from 'react';
import { Plus, List, Calendar, ZoomIn, ZoomOut } from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { CustomSelect } from '../../components/CustomSelect';
import { Button } from '../../components/button';
import { ScheduleDatePicker } from './components/ScheduleDatePicker';
import { DataTable } from '../../components/DataTable';
import { getLocalDateStr } from '../../utils';
import { registerGoogleHolidays } from '../../utils/vietnamHolidays';
import {
  ClassSession, PALETTE_20, DAY_HDRS,
  getSessionColor, getDynamicSessionInfo
} from './types';
import { getDeterministicClassColor } from '../../theme';
import { SessionModal } from './components/SessionModal';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleKpiCards } from './components/ScheduleKpiCards';
import { useScheduleColumns } from './hooks/useScheduleColumns';
import { useScheduleActions } from './hooks/useScheduleActions';
import { useScheduleCalendar } from './hooks/useScheduleCalendar';
import { dataCache } from '../../utils/dataCache';
import { computeMonthsToFetch, filterInScopeSessions, CustomDateRange } from './scheduleScopeHelper';

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
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);
  const [selectedWeekStarts, setSelectedWeekStarts] = useState<string[]>(() => [
    getLocalDateStr(weekStart),
  ]);

  useEffect(() => {
    const wsStr = getLocalDateStr(weekStart);
    setSelectedWeekStarts((prev) => {
      if (prev.length <= 1) return [wsStr];
      return prev;
    });
    setCustomRange(null);
  }, [weekStart]);

  const cachedClasses = dataCache.get<any[]>('/api/classes?search=')?.data;
  const [classesList, setClassesList] = useState<any[]>(() => cachedClasses || []);
  const [classFilter, setClassFilter] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [mode, setMode] = useState<'recurring' | 'temporary'>('recurring');
  const [color, setColor] = useState('#2563eb');
  const [form, setForm] = useState<Partial<ClassSession>>({
    class_id: undefined,
    date: getLocalDateStr(),
    start_time: '18:00',
    duration: 90,
    status: 'Sắp diễn ra',
    notes: '',
  });

  const [hourHeight, setHourHeight] = useState(70);
  const handleZoomIn = () => setHourHeight((prev) => Math.min(140, prev + 10));
  const handleZoomOut = () => setHourHeight((prev) => Math.max(45, prev - 10));
  const handleResetZoom = () => setHourHeight(70);

  const loadData = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const targetClassId = classFilter ? Number(classFilter) : 0;
      const monthsToFetch = computeMonthsToFetch(scheduleScope, selectedMonth, selectedWeekStarts, customRange);

      const [cls, ...sessionArrays] = await Promise.all([
        api.getClasses().catch(() => []),
        ...monthsToFetch.map((m) => api.getClassSessions(targetClassId, m).catch(() => [])),
      ]);
      setClassesList(cls);

      const sessionMap = new Map<number, any>();
      sessionArrays.flat().forEach((s: any) => {
        if (s?.id) sessionMap.set(s.id, s);
      });
      const rawSessions = Array.from(sessionMap.values());
      const inScope = filterInScopeSessions(rawSessions, scheduleScope, selectedMonth, selectedWeekStarts, customRange);

      const all: ClassSession[] = inScope.map((s: any) => {
        const matchedClass = cls.find((c: any) => c.id === s.class_id);
        const resolvedColor = matchedClass
          ? getDeterministicClassColor(matchedClass.id, matchedClass.color, matchedClass.notes)
          : getDeterministicClassColor(s.class_id);
        return {
          ...s,
          color: resolvedColor,
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
  }, [selectedMonth, classFilter, scheduleScope, selectedWeekStarts.join(','), customRange?.startStr, customRange?.endStr]);

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
    setModalOpen,
    setForm,
  });

  const openAdd = (dateStr?: string) => {
    setEditing(null);
    setMode(dateStr ? 'temporary' : 'recurring');
    const selectedCid = (classFilter && Number(classFilter) > 0) ? Number(classFilter) : (classesList[0]?.id || 1);
    const targetCls = classesList.find((c) => c.id === selectedCid) || classesList[0];
    const initialColor = getDeterministicClassColor(selectedCid, targetCls?.color, targetCls?.notes);
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
  };

  const openEdit = (sess: ClassSession) => {
    setEditing(sess);
    setMode('temporary');
    setColor(getSessionColor(sess));
    setForm({ ...sess });
    setModalOpen(true);
  };

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
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => openAdd()}
            leftIcon={<Plus size={14} />}
            title="Thêm Lịch Học"
          >
            Thêm Lịch Học
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ScheduleKpiCards total={total} done={done} upcoming={upcoming} off={off} />

      {/* UNIFIED CONTAINER: Integrated Toolbar + Calendar / List */}
      <div className="bg-white dark:bg-[#111728] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs flex-1 min-h-0 select-none flex flex-col">
        {/* Integrated Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111728] border-b border-slate-200 dark:border-white/10 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Datepicker */}
            <ScheduleDatePicker
              selectedMonth={selectedMonth}
              onSelectMonth={(mStr) => {
                setSelectedMonth(mStr);
                setCustomRange(null);
              }}
              scope={scheduleScope}
              onSelectScope={setScheduleScope}
              weekStart={weekStart}
              onSelectWeekStart={setWeekStart}
              today={today}
              selectedWeekStarts={selectedWeekStarts}
              onSelectWeekStarts={setSelectedWeekStarts}
              customRange={customRange}
              onSelectCustomRange={setCustomRange}
            />

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

          {/* Right: Zoom controls & View Mode toggle on same line as datepicker */}
          <div className="flex items-center gap-2">
            {viewMode === 'week' && (
              <div className="flex items-center bg-white dark:bg-[#181a20] rounded-xl p-0.5 border-0 shadow-[0_2px_10px_rgba(15,23,42,0.13),0_0_6px_rgba(15,23,42,0.07)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.18),0_0_8px_rgba(15,23,42,0.09)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55),0_0_6px_rgba(0,0,0,0.35)]">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={hourHeight <= 45}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer border-0"
                  title="Thu nhỏ tỉ lệ giờ (Phím -)"
                >
                  <ZoomOut size={13} />
                </button>

                <span
                  onClick={handleResetZoom}
                  className="px-2 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 transition"
                  title="Đặt lại mức chuẩn 70px"
                >
                  {Math.round((hourHeight / 70) * 100)}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={hourHeight >= 140}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer border-0"
                  title="Phóng to tỉ lệ giờ (Phím +)"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            )}

            <Button
              variant="white"
              size="xs"
              type="button"
              onClick={() => handleChangeViewMode(viewMode === 'week' ? 'list' : 'week')}
              title={viewMode === 'week' ? 'Chuyển sang chế độ danh sách' : 'Chuyển sang chế độ lịch tuần'}
              leftIcon={viewMode === 'week' ? <List size={13} /> : <Calendar size={13} />}
            >
              {viewMode === 'week' ? 'Danh sách' : 'Lịch tuần'}
            </Button>
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
            selectedWeekStarts={selectedWeekStarts}
            customRange={customRange}
            changeWeek={(dir) => {
              setCustomRange(null);
              changeWeek(dir);
            }}
            setWeekStartToday={() => {
              setCustomRange(null);
              setWeekStartToday();
            }}
            openAdd={openAdd}
            openEdit={openEdit}
            hourHeight={hourHeight}
            setHourHeight={setHourHeight}
            hideToolbar={true}
          />
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="flex flex-col flex-1 min-h-0">
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
        classesList={classesList}
        selectedMonth={selectedMonth}
        onSave={save}
        onDelete={del}
        sessions={sessions}
        setEditing={setEditing}
      />
    </div>
  );
}
