import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, RotateCcw, FlaskConical, Plus, Trash2, CheckCircle2, User } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { showToast } from '../../../components/Toast';
import { trunc1Dec, format1Dec } from '../../../utils';

interface TestDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  students: any[];
  sessionRecords: any[];
  onSaveRecords: (records: any[]) => void;
  onResetToDefault: () => void;
}

export const TestDatasetModal: React.FC<TestDatasetModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  sessionRecords,
  onSaveRecords,
  onResetToDefault,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [localRecords, setLocalRecords] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && sessionRecords) {
      setLocalRecords([...sessionRecords]);
      // Set initial selected student
      if (sessionRecords.length > 0 && !selectedStudentId) {
        setSelectedStudentId(String(sessionRecords[0].student_id));
      }
    }
  }, [isOpen, sessionRecords]);

  // Unique students in test records
  const studentOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; className: string }>();
    localRecords.forEach((r) => {
      const sid = String(r.student_id);
      if (!map.has(sid)) {
        map.set(sid, {
          id: sid,
          name: `${r.full_name}${r.nickname ? ` (${r.nickname})` : ''}`,
          className: r.class_name || 'Lớp học',
        });
      }
    });
    return Array.from(map.values()).map((s) => ({
      value: s.id,
      label: `${s.name} - ${s.className}`,
    }));
  }, [localRecords]);

  const currentStudentSessions = useMemo(() => {
    if (!selectedStudentId) return [];
    return localRecords.filter((r) => String(r.student_id) === selectedStudentId);
  }, [localRecords, selectedStudentId]);

  if (!isOpen) return null;

  const handleCellChange = (sessionIndex: number, field: string, value: any) => {
    setLocalRecords((prev) => {
      const next = [...prev];
      const targetIdx = next.findIndex(
        (r) => String(r.student_id) === selectedStudentId && r.session_id === currentStudentSessions[sessionIndex]?.session_id
      );
      if (targetIdx !== -1) {
        next[targetIdx] = {
          ...next[targetIdx],
          [field]: value,
        };
      }
      return next;
    });
  };

  const handleSave = () => {
    onSaveRecords(localRecords);
    showToast('Đã lưu dữ liệu mô phỏng test thành công!', 'success');
    onClose();
  };

  const handleReset = () => {
    onResetToDefault();
    showToast('Đã khôi phục dữ liệu test 20 buổi về mặc định!', 'success');
    onClose();
  };

  const skillOptions = [
    { value: 'vocab', label: 'Từ Vựng' },
    { value: 'grammar', label: 'Ngữ Pháp' },
    { value: 'mixed', label: 'Tổng Hợp' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none animate-mac-backdrop">
      <div className="bg-[#0c0f1d] border border-amber-500/30 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-mac-modal relative max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121626]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FlaskConical size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span>Xem & Chỉnh Sửa Dữ Liệu Test 20 Buổi Học</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                  Chế Độ Test
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                Chỉnh sửa điểm số Check 1, Check 2, BTVN và loại bài kiểm tra để thử nghiệm hệ thống phân tích.
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Student Selector Toolbar */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#090d16] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <User size={14} className="text-indigo-400" />
              <span>Chọn học sinh xem 20 buổi:</span>
            </div>
            <CustomSelect
              value={selectedStudentId}
              onChange={(val) => setSelectedStudentId(String(val))}
              options={studentOptions}
              className="w-72"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tổng số buổi:</span>
            <strong className="text-amber-300 font-mono font-bold">{currentStudentSessions.length} buổi</strong>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-200px)]">
          <div className="border border-white/10 rounded-xl overflow-hidden bg-[#090d16]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121626] border-b border-white/10 text-slate-300 font-bold">
                  <th className="py-2.5 px-3 text-center w-12">Buổi</th>
                  <th className="py-2.5 px-3 w-28">Ngày Học</th>
                  <th className="py-2.5 px-3 text-center w-28">Điểm Danh</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Check 1 (Kỹ Năng | Chủ Đề | Điểm)</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Check 2 (Kỹ Năng | Chủ Đề | Điểm)</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Homework (BTVN)</th>
                  <th className="py-2.5 px-3 w-32">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentStudentSessions.map((rec, idx) => {
                  const isAbsent = rec.attendance === 'absent';
                  return (
                    <tr key={rec.session_id || idx} className="hover:bg-white/[0.02] transition-colors">
                      {/* Session Name */}
                      <td className="py-2 px-3 text-center font-bold font-mono text-indigo-300">
                        {rec.session_name || `Buổi ${idx + 1}`}
                      </td>

                      {/* Date */}
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-300">
                        <input
                          type="text"
                          value={rec.date || ''}
                          onChange={(e) => handleCellChange(idx, 'date', e.target.value)}
                          className="w-full bg-[#121626] border border-white/10 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                        />
                      </td>

                      {/* Attendance */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleCellChange(idx, 'attendance', isAbsent ? 'present' : 'absent')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isAbsent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isAbsent ? 'Vắng' : 'Có mặt'}
                        </button>
                      </td>

                      {/* Check 1 */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            disabled={isAbsent}
                            value={rec.check_1 !== null && rec.check_1 !== undefined ? rec.check_1 : ''}
                            onChange={(e) => handleCellChange(idx, 'check_1', e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="-"
                            className="w-14 bg-[#121626] border border-blue-500/40 rounded px-2 py-1 text-blue-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-blue-400 disabled:opacity-30"
                          />
                          <input
                            type="text"
                            disabled={isAbsent}
                            value={rec.check_1_topic || rec.topic || ''}
                            onChange={(e) => handleCellChange(idx, 'check_1_topic', e.target.value)}
                            placeholder="Chủ đề..."
                            className="flex-1 bg-[#121626] border border-white/10 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none disabled:opacity-30"
                          />
                        </div>
                      </td>

                      {/* Check 2 */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            disabled={isAbsent}
                            value={rec.check_2 !== null && rec.check_2 !== undefined ? rec.check_2 : ''}
                            onChange={(e) => handleCellChange(idx, 'check_2', e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="-"
                            className="w-14 bg-[#121626] border border-purple-500/40 rounded px-2 py-1 text-purple-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-purple-400 disabled:opacity-30"
                          />
                          <input
                            type="text"
                            disabled={isAbsent}
                            value={rec.check_2_topic || rec.grammar_topic || ''}
                            onChange={(e) => handleCellChange(idx, 'check_2_topic', e.target.value)}
                            placeholder="Chủ đề ngữ pháp..."
                            className="flex-1 bg-[#121626] border border-white/10 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none disabled:opacity-30"
                          />
                        </div>
                      </td>

                      {/* Homework */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            disabled={isAbsent}
                            value={rec.homework !== null && rec.homework !== undefined ? rec.homework : ''}
                            onChange={(e) => handleCellChange(idx, 'homework', e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="-"
                            className="w-14 bg-[#121626] border border-amber-500/40 rounded px-2 py-1 text-amber-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-amber-400 disabled:opacity-30"
                          />
                          <input
                            type="text"
                            disabled={isAbsent}
                            value={rec.homework_topic || ''}
                            onChange={(e) => handleCellChange(idx, 'homework_topic', e.target.value)}
                            placeholder="BTVN..."
                            className="flex-1 bg-[#121626] border border-white/10 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none disabled:opacity-30"
                          />
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={rec.notes || ''}
                          onChange={(e) => handleCellChange(idx, 'notes', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full bg-[#121626] border border-white/10 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121626]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Đặt Lại Dữ Liệu Gốc</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>Lưu Dữ Liệu Test</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
