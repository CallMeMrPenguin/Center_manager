import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, GraduationCap, Check, Copy } from 'lucide-react';
import { MERGE_FIELDS, MergeFieldItem } from '../types';
import { wordDocumentsApi, MergeDataResponse } from '../../../api/wordDocumentsApi';

interface WordMergeFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertField: (fieldKey: string) => void;
  onApplyMergeData: (dataMap: Record<string, string>) => void;
}

export const WordMergeFieldModal: React.FC<WordMergeFieldModalProps> = ({
  isOpen,
  onClose,
  onInsertField,
  onApplyMergeData,
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'merge'>('fields');
  const [search, setSearch] = useState('');
  const [mergeData, setMergeData] = useState<MergeDataResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Merge form selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'merge' && !mergeData) {
      setLoading(true);
      wordDocumentsApi
        .getMergeData()
        .then((res) => setMergeData(res))
        .catch((err) => console.error('Failed to load merge data:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, activeTab, mergeData]);

  if (!isOpen) return null;

  const filteredFields = MERGE_FIELDS.filter(
    (f) =>
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (field: MergeFieldItem) => {
    navigator.clipboard.writeText(field.key);
    setCopiedKey(field.key);
    setTimeout(() => setCopiedKey(null), 1500);
    onInsertField(field.key);
  };

  const handlePerformMerge = () => {
    if (!mergeData) return;
    const student = mergeData.students.find((s) => String(s.id) === selectedStudentId);
    const cls = mergeData.classes.find((c) => String(c.id) === selectedClassId);
    const teacher = mergeData.teachers.find((t) => String(t.id) === selectedTeacherId);

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const monthStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const dataMap: Record<string, string> = {
      '{{ten_hoc_sinh}}': student ? student.name : '',
      '{{ma_hoc_sinh}}': student ? `HS-${student.id.toString().padStart(4, '0')}` : '',
      '{{lop_hoc}}': cls ? cls.name : '',
      '{{ten_giao_vien}}': teacher ? teacher.name : '',
      '{{ngay_hien_tai}}': dateStr,
      '{{thang_hoc}}': monthStr,
      '{{nam_hoc}}': `${now.getFullYear()} - ${now.getFullYear() + 1}`,
      '{{ten_trung_tam}}': 'Trung Tâm Ngoại Ngữ & Bồi Dưỡng Văn Hóa',
      '{{dia_chi_tt}}': '123 Đường Giáo Dục, Quận 1',
      '{{sdt_tt}}': '0901 234 567',
    };

    onApplyMergeData(dataMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0c0f1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#080b14]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Trộn Thư &amp; Trường Dữ Liệu Động</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 px-5 pt-3 bg-[#080b14] gap-4">
          <button
            onClick={() => setActiveTab('fields')}
            className={`pb-2 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'fields'
                ? 'border-[#5c36f5] text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Danh sách trường có sẵn ({MERGE_FIELDS.length})
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`pb-2 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'merge'
                ? 'border-[#5c36f5] text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Điền dữ liệu thực tế từ hệ thống
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'fields' ? (
            <>
              <input
                type="text"
                placeholder="Tìm trường dữ liệu (ví dụ: học sinh, lớp, học phí)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-[#121626] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredFields.map((field) => (
                  <div
                    key={field.key}
                    onClick={() => handleCopy(field)}
                    className="p-3 bg-[#121626] hover:bg-[#1a2035] border border-white/5 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        {field.label}
                      </span>
                      {copiedKey === field.key ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã chèn
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                      )}
                    </div>
                    <code className="text-[11px] text-blue-300 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded w-fit mb-1">
                      {field.key}
                    </code>
                    <span className="text-[10px] text-slate-400">Ví dụ: {field.example}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Chọn học sinh và lớp để hệ thống tự động tìm và thay thế tất cả các thẻ placeholder{' '}
                <code className="text-blue-400">{'{{...}}'}</code> trong văn bản hiện tại.
              </p>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải dữ liệu trung tâm...</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Học sinh
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121626] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn học sinh --</option>
                      {mergeData?.students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.grade || 'Chưa xếp lớp'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      Lớp học
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121626] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn lớp học --</option>
                      {mergeData?.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.grade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Giáo viên phụ trách</label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121626] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {mergeData?.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#080b14] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {activeTab === 'merge' && (
            <button
              onClick={handlePerformMerge}
              disabled={!selectedStudentId && !selectedClassId}
              className="px-4 py-2 bg-[#5c36f5] hover:bg-[#4d2ee0] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Điền vào văn bản
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
