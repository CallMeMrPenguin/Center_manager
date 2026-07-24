import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, CheckCircle2, Plus, RefreshCw,
  ChevronLeft, ChevronRight, X, Edit3, Trash2, Palette
} from 'lucide-react';
import { api } from '../api';
import { showToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

interface ClassSession {
  id: number;
  class_id: number;
  class_name?: string;
  date: string;
  start_time: string;
  duration: number;
  status: string;
  teacher_id?: number;
  teacher_name?: string;
  notes?: string;
  color?: string;
  room?: string;
}

const PALETTE_20 = [
  '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#a78bfa', '#fb7185',
  '#6366f1', '#8b5cf6', '#14b8a6', '#eab308', '#22c55e',
  '#60a5fa', '#c084fc', '#f472b6', '#38bdf8', '#e879f9'
];

function hexToHSL(hex: string) {
  if (!hex || typeof hex !== 'string') hex = '#7b61ff';
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getPremiumStyle(status: string, hexColor = '#7b61ff') {
  if (status === 'Hủy') {
    return { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', innerBorder: 'rgba(148,163,184,0.15)', color: '#94a3b8', shadow: 'none' };
  }
  const { h, s: iS, l: iL } = hexToHSL(hexColor);
  const isDone = status === 'Đã học';
  const sat = isDone ? Math.max(25, Math.round(iS * 0.55)) : Math.min(90, Math.max(70, iS));
  const lightness = isDone ? 52 : Math.min(80, Math.max(55, iL));
  const alphaBg = isDone ? '0.14' : '0.22';
  const bg = `hsla(${h},${sat}%,${lightness}%,${alphaBg})`;
  const border = `hsla(${h},${sat}%,${lightness}%,0.85)`;
  const color = `hsla(${h},95%,92%,0.98)`;
  const shadow = isDone
    ? `0 0 16px hsla(${h},${sat}%,${lightness}%,0.40),0 0 4px hsla(${h},${sat}%,${lightness}%,0.80)`
    : `0 0 20px hsla(${h},${sat}%,${lightness}%,0.65),0 0 8px hsla(${h},${sat}%,${lightness}%,0.90),0 4px 14px rgba(0,0,0,0.4)`;
  return { bg, border, innerBorder: `hsla(${h},${sat}%,${lightness}%,0.45)`, color, shadow };
}

function getSessionColor(sess: ClassSession): string {
  if (sess.color && sess.color.startsWith('#')) return sess.color;
  const seed = ((sess.class_id || 1) * 7 + (sess.id || 1) * 13) % PALETTE_20.length;
  return PALETTE_20[seed];
}

function calcEndTime(start: string, mins: number): string {
  const [h, m] = start.split(':').map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const DAY_HDRS = ['THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7', 'CHỦ NHẬT'];
const DAY_NUM: Record<string, number> = { 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6, 'Chủ nhật': 0 };

interface DayCfg { checked: boolean; time: string; duration: number; }

export default function SchedulePage() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const n = new Date(d);
    n.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return n;
  });
  const [classesList, setClassesList] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; dateStr: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [mode, setMode] = useState<'single' | 'weekdays'>('weekdays');
  const [color, setColor] = useState('#7c3aed');
  const [form, setForm] = useState<Partial<ClassSession>>({
    class_id: undefined, date: new Date().toISOString().split('T')[0],
    start_time: '18:00', duration: 90, status: 'Sắp diễn ra', notes: ''
  });
  const defaultDayCfgs = () => DAYS.reduce((a, d) => { a[d] = { checked: d === 'Thứ 2' || d === 'Thứ 4', time: '18:00', duration: 90 }; return a; }, {} as Record<string, DayCfg>);
  const [dayCfgs, setDayCfgs] = useState<Record<string, DayCfg>>(defaultDayCfgs());

  const loadData = async () => {
    setLoading(true);
    try {
      const cls = await api.getClasses();
      setClassesList(cls);
      let all: ClassSession[] = [];
      for (const c of cls) {
        if (!classFilter || String(c.id) === classFilter) {
          const ss = await api.getClassSessions(c.id, selectedMonth);
          all = all.concat(ss.map((s: any) => ({ ...s, class_name: c.class_name, teacher_name: c.teacher_name, room: c.room })));
        }
      }
      all.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
      setSessions(all);
    } catch (e: any) { showToast('Không thể tải lịch học: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const h = () => loadData();
    window.addEventListener('data-changed', h);
    return () => window.removeEventListener('data-changed', h);
  }, [selectedMonth, classFilter]);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const [yr, mo] = selectedMonth.split('-').map(Number);
  const firstDay = new Date(yr, mo - 1, 1);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const startOff = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalCells = Math.ceil((startOff + daysInMonth) / 7) * 7;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { header: DAY_HDRS[i], dateStr: d.toISOString().split('T')[0], dayNum: d.getDate() };
  });

  const changeWeek = (dir: number) => {
    const n = new Date(weekStart);
    n.setDate(weekStart.getDate() + dir * 7);
    setWeekStart(n);
  };

  const openAdd = (dateStr?: string) => {
    setEditing(null);
    setMode(dateStr ? 'single' : 'weekdays');
    setColor('#7c3aed');
    setForm({ class_id: classesList[0]?.id, date: dateStr || today, start_time: '18:00', duration: 90, status: 'Sắp diễn ra', notes: '' });
    setDayCfgs(defaultDayCfgs());
    setModalOpen(true);
  };

  const openEdit = (sess: ClassSession) => {
    setEditing(sess);
    setMode('single');
    setColor(getSessionColor(sess));
    setForm({ ...sess });
    setModalOpen(true);
  };

  // Conflict validation engine
  const checkSingleConflict = (target: { id?: number; class_id: number; date: string; start_time: string; duration: number }) => {
    const targetStart = timeToMin(target.start_time);
    const targetEnd = targetStart + target.duration;
    const targetClass = classesList.find(c => c.id === target.class_id);
    const targetName = targetClass?.class_name || '';
    const targetRoom = targetClass?.room || '';

    for (const s of sessions) {
      if (target.id && s.id === target.id) continue;
      if (s.date !== target.date || s.status === 'Hủy') continue;

      const sStart = timeToMin(s.start_time);
      const sEnd = sStart + s.duration;
      const isOverlapping = targetStart < sEnd && targetEnd > sStart;

      // 1. Same class name overlap
      if ((s.class_id === target.class_id || s.class_name === targetName) && isOverlapping) {
        return {
          error: `Xung đột lịch học: Lớp "${targetName}" đã có buổi học trùng khung giờ (${s.start_time} - ${calcEndTime(s.start_time, s.duration)}) ngày ${s.date}!`
        };
      }

      // 2. Same room conflict & 15-minute buffer
      const sRoom = s.room || classesList.find(c => c.id === s.class_id)?.room || '';
      if (targetRoom && sRoom && targetRoom.trim().toLowerCase() === sRoom.trim().toLowerCase()) {
        if (isOverlapping) {
          return {
            error: `Xung đột phòng học: Phòng "${targetRoom}" đã xếp lớp "${s.class_name}" trùng khung giờ (${s.start_time} - ${calcEndTime(s.start_time, s.duration)}) ngày ${s.date}!`
          };
        }

        const gap1 = sStart - targetEnd;
        const gap2 = targetStart - sEnd;
        if ((gap1 >= 0 && gap1 < 15) || (gap2 >= 0 && gap2 < 15)) {
          const gap = gap1 >= 0 ? gap1 : gap2;
          return {
            warning: `Cảnh báo phòng học: Buổi học phòng "${targetRoom}" chỉ cách lớp "${s.class_name}" (${s.start_time}) ${gap} phút (ít hơn 15 phút giãn cách). Bạn có muốn tiếp tục?`
          };
        }
      }
    }

    return null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id) { showToast('Vui lòng chọn lớp học!', 'error'); return; }
    const notes = `#COLOR:${color} ${(form.notes || '').replace(/#COLOR:#[0-9a-fA-F]{6}/g, '').trim()}`.trim();

    try {
      if (editing) {
        const conflict = checkSingleConflict({ id: editing.id, class_id: form.class_id, date: form.date!, start_time: form.start_time!, duration: form.duration! });
        if (conflict?.error) { showToast(conflict.error, 'error'); return; }
        if (conflict?.warning) {
          const ok = await confirm({ title: 'Cảnh báo xếp phòng', message: conflict.warning, confirmText: 'Vẫn lưu', cancelText: 'Hủy' });
          if (!ok) return;
        }
        await api.updateClassSession(form.class_id, editing.id, { ...form, notes, color });
        showToast('Cập nhật buổi học thành công!', 'success');
      } else if (mode === 'single') {
        const conflict = checkSingleConflict({ class_id: form.class_id, date: form.date!, start_time: form.start_time!, duration: form.duration! });
        if (conflict?.error) { showToast(conflict.error, 'error'); return; }
        if (conflict?.warning) {
          const ok = await confirm({ title: 'Cảnh báo xếp phòng', message: conflict.warning, confirmText: 'Vẫn lưu', cancelText: 'Hủy' });
          if (!ok) return;
        }
        await api.addClassSession(form.class_id, { ...form, notes, color });
        showToast('Tạo buổi học thành công!', 'success');
      } else {
        const enabled = DAYS.filter(d => dayCfgs[d]?.checked);
        if (!enabled.length) { showToast('Vui lòng chọn ít nhất 1 thứ trong tuần!', 'error'); return; }

        const pendingItems: Array<{ date: string; start_time: string; duration: number }> = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(yr, mo - 1, d);
          const dayName = DAYS.find(k => DAY_NUM[k] === dt.getDay());
          if (dayName && dayCfgs[dayName]?.checked) {
            const cfg = dayCfgs[dayName];
            const ds = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            pendingItems.push({ date: ds, start_time: cfg.time, duration: cfg.duration });
          }
        }

        // Validate conflicts for all batch sessions
        for (const item of pendingItems) {
          const conflict = checkSingleConflict({ class_id: form.class_id, ...item });
          if (conflict?.error) {
            showToast(conflict.error, 'error');
            return;
          }
        }

        let count = 0;
        for (const item of pendingItems) {
          await api.addClassSession(form.class_id, { ...form, date: item.date, start_time: item.start_time, duration: item.duration, notes, color });
          count++;
        }
        showToast(`Đã tạo thành công ${count} buổi học tháng ${selectedMonth}!`, 'success');
      }

      window.dispatchEvent(new CustomEvent('data-changed'));
      setModalOpen(false);
      loadData();
    } catch (e: any) { showToast('Lỗi khi lưu: ' + e.message, 'error'); }
  };

  const del = async (sess: ClassSession) => {
    const ok = await confirm({ title: 'Xóa Buổi Học', message: `Bạn có chắc muốn xóa buổi học ngày ${sess.date} lớp ${sess.class_name}?`, confirmText: 'Xóa', type: 'danger' });
    if (ok) {
      try { await api.deleteClassSession(sess.id); window.dispatchEvent(new CustomEvent('data-changed')); loadData(); showToast('Đã xóa buổi học!', 'success'); }
      catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
    }
  };

  const total = sessions.length;
  const done = sessions.filter(s => s.status === 'Đã học').length;
  const upcoming = sessions.filter(s => s.status === 'Sắp diễn ra').length;

  return (
    <div className="h-full flex flex-col p-5 gap-5 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5"><CalendarIcon className="h-6 w-6 text-indigo-400" />BẢNG LỊCH HỌC</h1>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Quản lý và theo dõi lịch học toàn trung tâm.</p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.45)] transition cursor-pointer border border-white/20 active:scale-95">
          <Plus size={14} />Thêm Lịch Học
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="kpi-card-purple p-4 flex items-center justify-between rounded-[22px]">
          <div><p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Trong Tháng</p><p className="text-2xl font-black text-white">{total}</p></div>
          <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400"><CalendarIcon size={18} /></div>
        </div>
        <div className="kpi-card-green p-4 flex items-center justify-between rounded-[22px]">
          <div><p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Đã Hoàn Thành</p><p className="text-2xl font-black text-emerald-400">{done}</p></div>
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400"><CheckCircle2 size={18} /></div>
        </div>
        <div className="kpi-card-blue p-4 flex items-center justify-between rounded-[22px]">
          <div><p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Sắp Diễn Ra</p><p className="text-2xl font-black text-cyan-400">{upcoming}</p></div>
          <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400"><Clock size={18} /></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f1320] border border-white/10 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-2">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer" />
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="bg-[#161a29] border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer">
            <option value="">Tất cả lớp học</option>
            {classesList.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0d1018] border border-white/10 p-1 rounded-xl">
            {(['month', 'week', 'list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition cursor-pointer ${viewMode === m ? 'bg-[#5c36f5] text-white shadow-[0_0_12px_rgba(92,54,245,0.5)]' : 'text-slate-400 hover:text-white'}`}>
                {m === 'month' ? 'LỊCH THÁNG' : m === 'week' ? 'LỊCH TUẦN' : 'DANH SÁCH'}
              </button>
            ))}
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-[#161a29] hover:bg-[#20263a] text-slate-300 hover:text-white border border-white/10 transition cursor-pointer">
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="calendar-container-depth flex-1 min-h-0 select-none">
          <div className="glowing-timeline-bar w-full" />
          <div className="overflow-hidden bg-[#1a2032] border-b border-[#2a3550]">
            <div className="grid grid-cols-7">
              {DAY_HDRS.map((d, i) => (
                <div key={d} className={`py-3.5 text-center text-[10px] font-extrabold uppercase tracking-widest ${i >= 5 ? 'text-rose-400 bg-rose-500/[0.02]' : 'text-slate-400'}`}>{d}</div>
              ))}
            </div>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-380px)] bg-[#101420]">
            <div className="grid grid-cols-7 gap-[1px] bg-[#28334e]">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - startOff + 1;
                const inMonth = dayNum > 0 && dayNum <= daysInMonth;
                if (!inMonth) return <div key={`e-${i}`} className="bg-[#101420] min-h-[155px]" />;
                const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const daySess = sessions.filter(s => s.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
                const isToday = dateStr === today;
                const isWknd = i % 7 >= 5;
                return (
                  <div
                    key={dayNum}
                    onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, dateStr }); }}
                    onClick={() => openAdd(dateStr)}
                    className={`min-h-[155px] p-2.5 flex flex-col gap-1.5 transition-all cursor-pointer ${isToday ? 'bg-[#1f2042] z-10' : `${isWknd ? 'bg-[#141b2a]' : 'bg-[#151b2a]'} hover:bg-[#1c2438]`}`}
                    style={isToday ? { boxShadow: 'inset 0 0 20px rgba(92,54,245,0.25)', outline: '2px solid #5c36f5', outlineOffset: '-2px' } : {}}
                  >
                    <div className="flex justify-between items-center shrink-0">
                      <span className={`text-[12px] font-black flex items-center justify-center h-6 w-6 rounded-full ${isToday ? 'bg-[#5c36f5] text-white shadow-[0_0_16px_rgba(92,54,245,0.9)] ring-2 ring-white/30' : isWknd ? 'text-rose-300' : 'text-slate-300'}`}>{dayNum}</span>
                      {daySess.length > 0 && <span className="text-[9px] font-extrabold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">{daySess.length}</span>}
                    </div>
                    <div className="flex-grow flex flex-col gap-1.5">
                      {daySess.map(s => {
                        const hex = getSessionColor(s);
                        const vs = getPremiumStyle(s.status, hex);
                        return (
                          <div key={s.id} onClick={e => { e.stopPropagation(); openEdit(s); }}
                            className="flex rounded-xl cursor-pointer transition-all active:scale-[0.98] min-h-[50px] border border-solid event-float overflow-hidden"
                            style={{ backgroundColor: vs.bg, borderColor: vs.border, boxShadow: vs.shadow }}>
                            <div className="flex flex-col justify-center items-center px-2 py-1 text-[9px] font-black w-[44px] shrink-0 text-center border-r border-solid" style={{ borderColor: vs.innerBorder, color: vs.color }}>
                              <span className="leading-none">{s.start_time}</span>
                              <span className="text-[7px] my-0.5 opacity-50">↓</span>
                              <span className="leading-none">{calcEndTime(s.start_time, s.duration)}</span>
                            </div>
                            <div className="flex-grow p-2 flex flex-col justify-center overflow-hidden">
                              <h4 className="text-[11px] font-black truncate text-white">{s.class_name}</h4>
                              <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: vs.color }}>{s.status}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="calendar-container-depth flex-1 min-h-0 select-none flex flex-col">
          <div className="glowing-timeline-bar w-full shrink-0" />
          <div className="bg-[#1a2032] border-b border-[#2a3550] px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => changeWeek(-1)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"><ChevronLeft size={14} /></button>
              <span className="text-xs font-black text-white">{weekDays[0].dateStr} - {weekDays[6].dateStr}</span>
              <button onClick={() => changeWeek(1)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"><ChevronRight size={14} /></button>
            </div>
            <button onClick={() => { const d = new Date(); const day = d.getDay(); const n = new Date(d); n.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); setWeekStart(n); }} className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-xs font-extrabold hover:bg-indigo-500/30 transition cursor-pointer">Hôm Nay</button>
          </div>
          <div className="overflow-hidden bg-[#1a2032] border-b border-[#28334e] shrink-0">
            <div className="grid grid-cols-7">
              {weekDays.map((wd, idx) => {
                const isToday = wd.dateStr === today;
                const isWknd = idx >= 5;
                return (
                  <div key={wd.dateStr} className={`py-3 text-center flex flex-col items-center gap-0.5 border-r border-[#28334e] last:border-r-0 transition-all ${isToday ? 'border-x-2 border-t-2 border-x-[#5c36f5] border-t-[#5c36f5] shadow-[inset_0_0_30px_rgba(92,54,245,0.15)]' : ''}`}>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isToday ? 'text-white font-black' : isWknd ? 'text-rose-400' : 'text-slate-400'}`}>{wd.header}</span>
                    <span className={`text-sm font-black px-2 py-0.5 rounded-xl ${isToday ? 'bg-[#5c36f5] text-white shadow-lg' : 'text-white'}`}>{wd.dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="overflow-auto flex-1 bg-[#101420]">
            <div className="grid grid-cols-7 gap-[1px] bg-[#28334e] min-h-[300px]">
              {weekDays.map((wd, idx) => {
                const daySess = sessions.filter(s => s.date === wd.dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
                const isToday = wd.dateStr === today;
                const isWknd = idx >= 5;
                return (
                  <div key={wd.dateStr} onClick={() => openAdd(wd.dateStr)}
                    className={`p-2.5 flex flex-col gap-2 cursor-pointer transition-all ${isToday ? 'bg-[#1f2042]/60' : isWknd ? 'bg-[#141b2a] hover:bg-[#1c2438]' : 'bg-[#151b2a] hover:bg-[#1c2438]'}`}
                    style={isToday ? { boxShadow: 'inset 0 0 35px rgba(92,54,245,0.12)', borderLeft: '2px solid #5c36f5', borderRight: '2px solid #5c36f5' } : {}}>
                    {daySess.map(s => {
                      const hex = getSessionColor(s);
                      const vs = getPremiumStyle(s.status, hex);
                      return (
                        <div key={s.id} onClick={e => { e.stopPropagation(); openEdit(s); }}
                          className="flex rounded-xl cursor-pointer transition-all active:scale-[0.98] min-h-[56px] border border-solid event-float overflow-hidden"
                          style={{ backgroundColor: vs.bg, borderColor: vs.border, boxShadow: vs.shadow }}>
                          <div className="flex flex-col justify-center items-center px-2 py-1 text-[9px] font-black w-[44px] shrink-0 text-center border-r" style={{ borderColor: vs.innerBorder, color: vs.color }}>
                            <span className="leading-none">{s.start_time}</span>
                            <span className="text-[7px] my-0.5 opacity-60">↓</span>
                            <span className="leading-none">{calcEndTime(s.start_time, s.duration)}</span>
                          </div>
                          <div className="flex-grow p-2 flex flex-col justify-center overflow-hidden">
                            <h4 className="text-[11px] font-black truncate text-white">{s.class_name}</h4>
                            <div className="text-[9px] font-bold mt-0.5" style={{ color: vs.color }}>{s.teacher_name || 'GV'}</div>
                          </div>
                        </div>
                      );
                    })}
                    {!daySess.length && <div className="text-center py-8 text-[10px] text-slate-600 font-bold select-none">Không có ca học</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="calendar-container-depth flex-1 min-h-0 overflow-auto">
          <div className="glowing-timeline-bar w-full" />
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1a2032] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-[#2a3550]">
                {['Ngày Học', 'Lớp Học', 'Giờ / Thời Lượng', 'Giáo Viên', 'Trạng Thái', ''].map(h => <th key={h} className="py-3 px-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#28334e]">
              {sessions.map(s => {
                const hex = getSessionColor(s);
                return (
                  <tr key={s.id} className="hover:bg-[#1c2438] bg-[#151b2a] transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{s.date}</td>
                    <td className="py-3 px-3 font-extrabold" style={{ color: hex }}>{s.class_name}</td>
                    <td className="py-3 px-3 text-slate-300">{s.start_time} – {calcEndTime(s.start_time, s.duration)} ({s.duration}p)</td>
                    <td className="py-3 px-3 text-slate-400">{s.teacher_name || 'Mặc định'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-xl text-[10px] font-black border ${s.status === 'Đã học' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : s.status === 'Hủy' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>{s.status}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition cursor-pointer"><Edit3 size={12} /></button>
                        <button onClick={() => del(s)} className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTEXT MENU */}
      {ctxMenu && (
        <div style={{ top: ctxMenu.y, left: ctxMenu.x }} className="fixed z-[999] bg-[#0d1018]/95 border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] py-1.5 min-w-[150px] backdrop-blur-xl animate-mac-dropdown">
          <button onClick={() => { openAdd(ctxMenu.dateStr); setCtxMenu(null); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-indigo-500/20 transition flex items-center gap-2 cursor-pointer">
            <Plus className="h-3.5 w-3.5 text-indigo-400" />Thêm buổi học
          </button>
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-mac-backdrop">
          <div className="bg-[#0f1320] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-mac-modal">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#14192b]">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-indigo-400" />{editing ? 'Cập Nhật Buổi Học' : 'Thêm Buổi Học Mới'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Lớp Học *</label>
                <select required value={form.class_id || ''} onChange={e => setForm({ ...form, class_id: Number(e.target.value) })} className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer">
                  <option value="">-- Chọn Lớp --</option>
                  {classesList.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Palette size={10} className="text-indigo-400" />Màu Sắc Lịch Trình</label>
                <div className="flex items-center gap-1.5 flex-wrap bg-[#141928] p-2.5 rounded-xl border border-white/10">
                  {PALETTE_20.slice(0, 10).map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`h-7 w-7 rounded-xl transition-all cursor-pointer border ${color === c ? 'border-white scale-110 ring-2 ring-indigo-400' : 'border-transparent opacity-75 hover:opacity-100'}`} />
                  ))}
                  <label className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center cursor-pointer border border-white/30 hover:scale-105 transition relative overflow-hidden">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                    <Palette size={10} className="text-white" />
                  </label>
                </div>
              </div>

              {!editing && (
                <div className="grid grid-cols-2 gap-2 bg-[#141928] p-1.5 rounded-xl border border-white/10">
                  <button type="button" onClick={() => setMode('weekdays')} className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${mode === 'weekdays' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>Chọn Ngày Trong Tuần</button>
                  <button type="button" onClick={() => setMode('single')} className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${mode === 'single' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>1 Ngày Cụ Thể</button>
                </div>
              )}

              {!editing && mode === 'weekdays' && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Cấu Hình Theo Thứ — Tháng {selectedMonth}</label>
                  <div className="space-y-2 bg-[#141928] p-3 rounded-xl border border-white/10">
                    {DAYS.map(day => {
                      const cfg = dayCfgs[day];
                      return (
                        <div key={day} className="flex items-center gap-2">
                          <button type="button" onClick={() => setDayCfgs(p => ({ ...p, [day]: { ...p[day], checked: !p[day].checked } }))}
                            className={`shrink-0 h-5 w-5 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition cursor-pointer ${cfg.checked ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-transparent border-white/20 text-transparent'}`}>✓</button>
                          <span className={`text-xs font-bold w-16 shrink-0 ${cfg.checked ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                          <input type="time" value={cfg.time} disabled={!cfg.checked} onChange={e => setDayCfgs(p => ({ ...p, [day]: { ...p[day], time: e.target.value } }))} className={`flex-1 bg-[#0d1018] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 ${!cfg.checked ? 'opacity-30' : ''}`} />
                          <input type="number" value={cfg.duration} min={30} max={240} step={15} disabled={!cfg.checked} onChange={e => setDayCfgs(p => ({ ...p, [day]: { ...p[day], duration: parseInt(e.target.value) || 90 } }))} className={`w-14 bg-[#0d1018] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 ${!cfg.checked ? 'opacity-30' : ''}`} />
                          <span className={`text-[10px] text-slate-500 shrink-0 ${!cfg.checked ? 'opacity-30' : ''}`}>p</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(editing || mode === 'single') && (
                <>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Ngày Học *</label>
                    <input type="date" required value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Giờ Bắt Đầu *</label>
                      <input type="time" required value={form.start_time || '18:00'} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Thời Lượng (phút)</label>
                      <input type="number" value={form.duration || 90} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 90 })} className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Trạng Thái</label>
                <select value={form.status || 'Sắp diễn ra'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="Sắp diễn ra">Sắp diễn ra</option>
                  <option value="Đã học">Đã học</option>
                  <option value="Hủy">Hủy</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold hover:bg-white/10 transition cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#5c36f5] text-white text-xs font-extrabold border border-white/20 hover:bg-[#7351f7] transition shadow-lg cursor-pointer">Lưu Buổi Học</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
