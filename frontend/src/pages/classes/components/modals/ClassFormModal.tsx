import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ClassItem, TeacherCM, ClassDayConfig, GRADE_LIST, WEEKDAYS } from '../../types';
import { SCHEDULE_PALETTE_24 } from '../../../schedule/types';
import { CustomSelect } from '../../../../components/CustomSelect';
import { api } from '../../../../api';
import { showToast } from '../../../../components/Toast';
import { Button } from '../../../../components/button';

interface ClassFormModalProps {
  isOpen: boolean;
  editingClass: ClassItem | null;
  teachers: TeacherCM[];
  onClose: () => void;
  onSaved: () => void;
  onDeleteClass?: (cls: ClassItem) => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  editingClass,
  teachers,
  onClose,
  onSaved,
  onDeleteClass,
}) => {
  const defaultClassDayConfigs = () =>
    WEEKDAYS.reduce((acc, day) => {
      acc[day] = { checked: day === 'Thứ 2' || day === 'Thứ 4', time: '18:00', duration: 90 };
      return acc;
    }, {} as Record<string, ClassDayConfig>);

  const [classForm, setClassForm] = useState<Partial<ClassItem>>({
    class_name: '',
    teacher_id: undefined,
    grade: 'Lớp 6',
    subject: 'Tiếng Anh',
    room: '',
    status: 'Đang hoạt động',
    notes: '',
  });

  const [classDayConfigs, setClassDayConfigs] = useState<Record<string, ClassDayConfig>>(defaultClassDayConfigs());

  useEffect(() => {
    if (editingClass) {
      setClassForm({ ...editingClass });
      api.getClassWeeklySchedule(editingClass.id).then((slots) => {
        const newCfgs = defaultClassDayConfigs();
        WEEKDAYS.forEach((d) => {
          newCfgs[d].checked = false;
        });
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
        }
        setClassDayConfigs(newCfgs);
      }).catch(() => {
        setClassDayConfigs(defaultClassDayConfigs());
      });
    } else {
      setClassForm({
        class_name: '',
        teacher_id: undefined,
        grade: 'Lớp 6',
        subject: 'Tiếng Anh',
        room: '',
        status: 'Đang hoạt động',
        notes: '',
      });
      setClassDayConfigs(defaultClassDayConfigs());
    }
  }, [editingClass, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.class_name?.trim()) {
      showToast('Tên lớp học không được để trống!', 'error');
      return;
    }
    try {
      let cid = editingClass?.id;
      if (editingClass) {
        await api.updateClass(editingClass.id, classForm);
      } else {
        const res = await api.createClass(classForm);
        cid = res.id;
      }

      if (cid) {
        const slotsPayload = WEEKDAYS.filter((d) => classDayConfigs[d]?.checked).map((day) => ({
          day_of_week: day,
          start_time: classDayConfigs[day].time,
          duration: classDayConfigs[day].duration,
          notes: classForm.room || '',
        }));
        await api.replaceClassWeeklySlots(cid, slotsPayload);
      }

      showToast(editingClass ? 'Đã cập nhật lớp học và lịch học!' : 'Đã tạo lớp học mới và đồng bộ lịch học!', 'success');
      onSaved();
    } catch (err: any) {
      showToast('Lỗi khi lưu: ' + err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
      <div className="bg-white dark:bg-[#0f1528] border-0 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#14192b]">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {editingClass ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Học Mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Tên Lớp Học *</label>
            <input
              type="text"
              required
              value={classForm.class_name || ''}
              onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
              placeholder="Ví dụ: Tiếng Anh Lớp 8A1"
              className="w-full bg-slate-50 dark:bg-[#181d2e] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Khối Lớp</label>
              <CustomSelect
                value={classForm.grade || 'Lớp 6'}
                onChange={(val) => setClassForm({ ...classForm, grade: val })}
                options={GRADE_LIST.map((g) => ({ value: g, label: g }))}
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Giáo Viên Phụ Trách</label>
              <CustomSelect
                value={classForm.teacher_id || ''}
                onChange={(val) => setClassForm({ ...classForm, teacher_id: val ? Number(val) : undefined })}
                options={[
                  { value: '', label: '-- Chưa phân công --' },
                  ...teachers.map((t) => ({ value: t.id, label: t.full_name })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Môn Học</label>
              <input
                type="text"
                value={classForm.subject || ''}
                onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                placeholder="Tiếng Anh"
                className="w-full bg-slate-50 dark:bg-[#181d2e] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Phòng Học</label>
              <input
                type="text"
                value={classForm.room || ''}
                onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                placeholder="Phòng 201"
                className="w-full bg-slate-50 dark:bg-[#181d2e] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Màu Sắc Lịch Trình</label>
            <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 dark:bg-[#141928] p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
              {SCHEDULE_PALETTE_24.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setClassForm({ ...classForm, color: hex })}
                  className={`w-6 h-6 rounded-full transition cursor-pointer border ${
                    (classForm.color || '#7c3aed') === hex ? 'border-white scale-110 ring-2 ring-indigo-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* MULTI-DAY SCHEDULE SELECTOR */}
          <div className="space-y-2 border-t border-slate-200 dark:border-white/10 pt-3">
            <label className="block text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
              Lịch Học
            </label>
            <div className="space-y-2 bg-slate-50 dark:bg-[#141928] p-3 rounded-xl border border-slate-200 dark:border-white/10">
              {WEEKDAYS.map((day) => {
                const cfg = classDayConfigs[day] || { checked: false, time: '18:00', duration: 90 };
                return (
                  <div key={day} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setClassDayConfigs((p) => ({ ...p, [day]: { ...p[day], checked: !p[day]?.checked } }))}
                      className={`shrink-0 h-5 w-5 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition cursor-pointer ${
                        cfg.checked ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-slate-300 dark:border-white/20 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <span className={`text-xs font-bold w-16 shrink-0 ${cfg.checked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{day}</span>
                    <input
                      type="time"
                      value={cfg.time}
                      disabled={!cfg.checked}
                      onChange={(e) => setClassDayConfigs((p) => ({ ...p, [day]: { ...p[day], time: e.target.value } }))}
                      className={`flex-1 bg-white dark:bg-[#0d1018] border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 ${
                        !cfg.checked ? 'opacity-30' : ''
                      }`}
                    />
                    <input
                      type="number"
                      value={cfg.duration}
                      min={30}
                      max={240}
                      step={15}
                      disabled={!cfg.checked}
                      onChange={(e) => setClassDayConfigs((p) => ({ ...p, [day]: { ...p[day], duration: parseInt(e.target.value) || 90 } }))}
                      className={`w-14 bg-white dark:bg-[#0d1018] border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 ${
                        !cfg.checked ? 'opacity-30' : ''
                      }`}
                    />
                    <span className={`text-[10px] text-slate-500 dark:text-slate-400 shrink-0 ${!cfg.checked ? 'opacity-30' : ''}`}>phút</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
            {editingClass && onDeleteClass ? (
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => onDeleteClass(editingClass)}
                leftIcon={<Trash2 size={14} />}
              >
                Xóa Lớp Học
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
              >
                Lưu Lớp Học
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
