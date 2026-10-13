import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import { ClassSession, DAYS, DAY_NUM, SessionScheduleItem, calcEndTime, timeToMin } from '../types';

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
  mode: 'recurring' | 'temporary';
  setModalOpen: (open: boolean) => void;
  setForm?: React.Dispatch<React.SetStateAction<Partial<ClassSession>>>;
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

  const save = async (e: React.FormEvent, items?: SessionScheduleItem[]) => {
    e.preventDefault();
    if (!form.class_id) {
      showToast('Vui lòng chọn lớp học!', 'error');
      return;
    }

    const notes = `#COLOR:${color} ${(form.notes || '').replace(/#COLOR:#[0-9a-fA-F]{6}/g, '').trim()}`.trim();

    try {
      if (editing) {
        const item = items?.[0];
        const dateToSave = item?.date || form.date!;
        const startTimeToSave = item?.start_time || form.start_time || '18:00';
        const durationToSave = item?.duration || form.duration || 90;

        const conflict = checkSingleConflict({
          id: editing.id,
          class_id: form.class_id,
          date: dateToSave,
          start_time: startTimeToSave,
          duration: durationToSave,
        });
        if (conflict?.error) {
          showToast(conflict.error, 'error');
          return;
        }

        await api.updateClassSession(form.class_id, editing.id, {
          ...form,
          date: dateToSave,
          start_time: startTimeToSave,
          duration: durationToSave,
          notes,
          color,
        });
        showToast('Cập nhật buổi học thành công!', 'success');
      } else if (mode === 'temporary') {
        const dateItems = items && items.length > 0
          ? items
          : [{ id: form.date!, date: form.date!, start_time: form.start_time || '18:00', duration: form.duration || 90, dayName: '', label: '' }];

        let createdCount = 0;
        for (const item of dateItems) {
          if (!item.date) continue;
          const conflict = checkSingleConflict({
            class_id: form.class_id,
            date: item.date,
            start_time: item.start_time || '18:00',
            duration: item.duration || 90,
          });
          if (conflict?.error) {
            showToast(conflict.error, 'error');
            return;
          }

          await api.addClassSession(form.class_id, {
            ...form,
            date: item.date,
            start_time: item.start_time || '18:00',
            duration: item.duration || 90,
            notes,
            color,
          });
          createdCount++;
        }
        showToast(`Đã tạo thành công ${createdCount} buổi học!`, 'success');
      } else {
        // mode === 'recurring' (Lịch Cố Định)
        const recurringItems = items && items.length > 0
          ? items
          : [{ id: 'Thứ 2', dayOfWeek: 1, dayName: 'Thứ 2', start_time: form.start_time || '18:00', duration: form.duration || 90, label: '' }];

        const pendingItems: Array<{ date: string; start_time: string; duration: number }> = [];

        const recurringNotes = `#RECURRING #COLOR:${color} ${(form.notes || '').replace(/#RECURRING/g, '').replace(/#COLOR:#[0-9a-fA-F]{6}/g, '').trim()}`.trim();

        for (const item of recurringItems) {
          try {
            await api.addClassWeeklySlot(form.class_id, {
              day_of_week: item.dayName,
              start_time: item.start_time || '18:00',
              duration: item.duration || 90,
              notes: '',
            });
          } catch {}

          const targetDayNum = item.dayOfWeek ?? (item.date ? new Date(item.date).getDay() : DAY_NUM[item.dayName]);
          if (targetDayNum === undefined) continue;

          for (let day = 1; day <= daysInMonth; day++) {
            const dt = new Date(yr, mo - 1, day);
            if (dt.getDay() === targetDayNum) {
              const ds = `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              pendingItems.push({
                date: ds,
                start_time: item.start_time || '18:00',
                duration: item.duration || 90,
              });
            }
          }
        }

        if (!pendingItems.length) {
          showToast('Không tìm thấy ngày phù hợp trong tháng!', 'error');
          return;
        }

        for (const p of pendingItems) {
          await api.addClassSession(form.class_id, {
            ...form,
            status: form.status === 'Hủy' ? 'Nghỉ' : (form.status || 'Sắp diễn ra'),
            date: p.date,
            start_time: p.start_time,
            duration: p.duration,
            notes: recurringNotes,
            color,
          });
        }
        const dayNamesLabel = recurringItems.map((r) => r.dayName).join(', ');
        showToast(`Đã tạo thành công ${pendingItems.length} buổi học (${dayNamesLabel}) tháng ${selectedMonth}!`, 'success');
      }

      window.dispatchEvent(new CustomEvent('data-changed'));
      setModalOpen(false);
      loadData(true);
    } catch (e: any) {
      showToast('Lỗi khi lưu: ' + e.message, 'error');
    }
  };

  const del = async (sess: ClassSession) => {
    const sDt = new Date(sess.date);
    const dayName = DAYS[sDt.getDay()] || 'Thứ 2';

    // Check if session belongs to a recurring schedule (Lịch Cố Định)
    let matchingWeeklySlot: any = null;
    try {
      const weeklySlots = await api.getClassWeeklySchedule(sess.class_id);
      matchingWeeklySlot = weeklySlots.find((w: any) => w.day_of_week === dayName);
    } catch {}

    const isRecurring =
      sess.id < 0 ||
      Boolean(sess.notes && sess.notes.includes('#RECURRING')) ||
      Boolean(matchingWeeklySlot);

    if (isRecurring) {
      const ok = await confirm({
        title: 'Xóa Lịch Cố Định',
        message: `Buổi học này thuộc Lịch Cố Định (${dayName} hàng tuần). Xóa lịch này sẽ xóa tất cả các buổi học của lịch cố định này cho lớp ${sess.class_name}. Bạn có chắc muốn xóa không?`,
        confirmText: 'Xóa Toàn Bộ',
        type: 'danger',
      });
      if (ok) {
        try {
          if (matchingWeeklySlot) {
            await api.deleteClassWeeklySlot(matchingWeeklySlot.id);
          }
          // Batch delete all sessions of this class on this weekday
          for (const s of sessions) {
            if (s.class_id === sess.class_id && s.id > 0) {
              const dt = new Date(s.date);
              if (DAYS[dt.getDay()] === dayName) {
                try {
                  await api.deleteClassSession(s.id);
                } catch {}
              }
            }
          }
          try {
            await api.syncClassSchedule(sess.class_id);
          } catch {}

          window.dispatchEvent(new CustomEvent('data-changed'));
          setModalOpen(false);
          loadData(true);
          showToast(`Đã xóa toàn bộ lịch cố định (${dayName})!`, 'success');
        } catch (e: any) {
          showToast('Lỗi: ' + e.message, 'error');
        }
      }
    } else {
      const ok = await confirm({
        title: 'Xóa Buổi Học',
        message: `Bạn có chắc muốn xóa buổi học ngày ${sess.date} lớp ${sess.class_name}?`,
        confirmText: 'Xóa',
        type: 'danger',
      });
      if (ok) {
        try {
          if (sess.id > 0) {
            await api.deleteClassSession(sess.id);
          }
          window.dispatchEvent(new CustomEvent('data-changed'));
          setModalOpen(false);
          loadData(true);
          showToast('Đã xóa buổi học!', 'success');
        } catch (e: any) {
          showToast('Lỗi: ' + e.message, 'error');
        }
      }
    }
  };

  return { save, del };
}
