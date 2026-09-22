import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import { ClassSession, DayCfg, DAYS, DAY_NUM, calcEndTime, timeToMin } from '../types';

interface UseScheduleActionsProps {
  classesList: any[];
  sessions: ClassSession[];
  selectedMonth: string;
  daysInMonth: number;
  yr: number;
  mo: number;
  loadData: (silent?: boolean) => Promise<void>;
  form: Partial<ClassSession>;
  color: string;
  editing: ClassSession | null;
  mode: 'single' | 'weekdays';
  dayCfgs: Record<string, DayCfg>;
  setModalOpen: (open: boolean) => void;
}

export function useScheduleActions({
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
}: UseScheduleActionsProps) {
  const confirm = useConfirm();

  const checkSingleConflict = (target: { id?: number; class_id: number; date: string; start_time: string; duration: number }) => {
    const targetStart = timeToMin(target.start_time);
    const targetEnd = targetStart + target.duration;
    const targetCls = classesList.find((c) => c.id === target.class_id);
    const targetTeacherId = form.teacher_id || targetCls?.teacher_id;
    const targetRoom = form.room || targetCls?.room;

    for (const s of sessions) {
      if (target.id && s.id === target.id) continue;
      if (s.date !== target.date) continue;
      if (s.status === 'Hủy') continue;

      const sStart = timeToMin(s.start_time);
      const sEnd = sStart + s.duration;
      const overlaps = targetStart < sEnd && targetEnd > sStart;

      if (overlaps) {
        const sTeacherId = s.teacher_id || classesList.find((c) => c.id === s.class_id)?.teacher_id;
        if (targetTeacherId && sTeacherId && targetTeacherId === sTeacherId) {
          const tName = s.teacher_name || 'Giáo viên';
          return {
            error: `Trùng lịch giáo viên: ${tName} đã có ca dạy lớp "${s.class_name}" (${s.start_time} - ${calcEndTime(s.start_time, s.duration)})`,
          };
        }

        const sRoom = s.room || classesList.find((c) => c.id === s.class_id)?.room;
        if (targetRoom && sRoom && targetRoom.trim().toLowerCase() === sRoom.trim().toLowerCase()) {
          return {
            error: `Trùng phòng học: Phòng "${targetRoom}" đã được dùng bởi lớp "${s.class_name}" (${s.start_time} - ${calcEndTime(s.start_time, s.duration)})`,
          };
        }
      }
    }
    return null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id) {
      showToast('Vui lòng chọn lớp học!', 'error');
      return;
    }
    const notes = `#COLOR:${color} ${(form.notes || '').replace(/#COLOR:#[0-9a-fA-F]{6}/g, '').trim()}`.trim();

    try {
      if (editing) {
        const conflict = checkSingleConflict({
          id: editing.id,
          class_id: form.class_id,
          date: form.date!,
          start_time: form.start_time!,
          duration: form.duration!,
        });
        if (conflict?.error) {
          showToast(conflict.error, 'error');
          return;
        }
        await api.updateClassSession(form.class_id, editing.id, { ...form, notes, color });
        showToast('Cập nhật buổi học thành công!', 'success');
      } else if (mode === 'single') {
        const conflict = checkSingleConflict({
          class_id: form.class_id,
          date: form.date!,
          start_time: form.start_time!,
          duration: form.duration!,
        });
        if (conflict?.error) {
          showToast(conflict.error, 'error');
          return;
        }
        await api.addClassSession(form.class_id, { ...form, notes, color });
        showToast('Tạo buổi học thành công!', 'success');
      } else {
        const enabled = DAYS.filter((d) => dayCfgs[d]?.checked);
        if (!enabled.length) {
          showToast('Vui lòng chọn ít nhất 1 thứ trong tuần!', 'error');
          return;
        }

        const pendingItems: Array<{ date: string; start_time: string; duration: number }> = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(yr, mo - 1, d);
          const dayName = DAYS.find((k) => DAY_NUM[k] === dt.getDay());
          if (dayName && dayCfgs[dayName]?.checked) {
            const cfg = dayCfgs[dayName];
            const ds = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            pendingItems.push({ date: ds, start_time: cfg.time, duration: cfg.duration });
          }
        }

        for (const item of pendingItems) {
          await api.addClassSession(form.class_id, {
            ...form,
            date: item.date,
            start_time: item.start_time,
            duration: item.duration,
            notes,
            color,
          });
        }
        showToast(`Đã tạo thành công ${pendingItems.length} buổi học tháng ${selectedMonth}!`, 'success');
      }

      window.dispatchEvent(new CustomEvent('data-changed'));
      setModalOpen(false);
      loadData(true);
    } catch (e: any) {
      showToast('Lỗi khi lưu: ' + e.message, 'error');
    }
  };

  const del = async (sess: ClassSession) => {
    const ok = await confirm({
      title: 'Xóa Buổi Học',
      message: `Bạn có chắc muốn xóa buổi học ngày ${sess.date} lớp ${sess.class_name}?`,
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (ok) {
      try {
        await api.deleteClassSession(sess.id);
        window.dispatchEvent(new CustomEvent('data-changed'));
        loadData(true);
        showToast('Đã xóa buổi học!', 'success');
      } catch (e: any) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    }
  };

  return { save, del };
}
