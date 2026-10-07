import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { Assignment } from '../types';
import { PromptTemplateModal } from './PromptTemplateModal';
import { AssignmentTypeConfigSelector } from './AssignmentTypeConfigSelector';
import { SectionScopeSelector } from './SectionScopeSelector';
import { AssignmentContentField } from './AssignmentContentField';
import { useUpcomingClassSessions } from '../hooks/useUpcomingClassSessions';
import { useAssignmentForm } from '../hooks/useAssignmentForm';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  classes: any[];
  defaultClassId?: string;
  onSuccess: () => void;
  onPreview?: (assignment: Assignment) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  classes,
  defaultClassId,
  onSuccess,
  onPreview,
}) => {
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);

  const {
    classId,
    setClassId,
    title,
    setTitle,
    description,
    setDescription,
    assignedDate,
    setAssignedDate,
    dueDate,
    setDueDate,
    maxScore,
    setMaxScore,
    contentJson,
    questionCount,
    assignmentType,
    setAssignmentType,
    timeLimit,
    setTimeLimit,
    maxAttempts,
    setMaxAttempts,
    proctoringEnabled,
    setProctoringEnabled,
    selectedSectionIds,
    setSelectedSectionIds,
    sections,
    saving,
    deleting,
    uploading,
    handleFileUpload,
    handleLoadSample,
    handleTextareaChange,
    handleSave,
    handleDelete,
  } = useAssignmentForm({
    isOpen,
    assignment,
    classes,
    defaultClassId,
    onSuccess,
    onClose,
  });

  const upcomingSessions = useUpcomingClassSessions(classId, assignedDate);

  if (!isOpen) return null;

  const classOptions: SelectOption[] = classes.map((c) => ({ value: c.id, label: c.class_name }));

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 select-none font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-900">
              {assignment ? 'Chỉnh sửa bài tập' : 'Giao bài tập mới'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {/* Class & Max Score */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Lớp học <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={classId}
                  onChange={(val) => setClassId(Number(val))}
                  options={classOptions}
                  placeholder="Chọn lớp học..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Thang điểm</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value) || 10)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Tiêu đề bài tập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Phiếu bài tập Unit 12"
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            {/* 3 Assignment Types Selector */}
            <AssignmentTypeConfigSelector
              assignmentType={assignmentType}
              onChangeAssignmentType={setAssignmentType}
              timeLimit={timeLimit}
              onChangeTimeLimit={setTimeLimit}
              maxAttempts={maxAttempts}
              onChangeMaxAttempts={setMaxAttempts}
              proctoringEnabled={proctoringEnabled}
              onChangeProctoring={setProctoringEnabled}
            />

            {/* Content ULN / Textarea */}
            <AssignmentContentField
              contentJson={contentJson}
              onTextareaChange={handleTextareaChange}
              onOpenPromptModal={() => setShowPromptModal(true)}
              onLoadSample={handleLoadSample}
              onFileUpload={handleFileUpload}
              uploading={uploading}
              questionCount={questionCount}
              sectionCount={sections.length}
            />

            {/* Section Scope Limiter: Checkboxes for choosing exercises */}
            {sections.length > 1 && (
              <SectionScopeSelector
                sections={sections}
                selectedSectionIds={selectedSectionIds}
                onToggleSection={(secId) =>
                  setSelectedSectionIds((prev) =>
                    prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]
                  )
                }
                onSelectAll={() => setSelectedSectionIds(sections.map((s) => s.id))}
                onDeselectAll={() => setSelectedSectionIds([])}
              />
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ngày giao <span className="text-rose-500">*</span>
                </label>
                <CustomDatePicker value={assignedDate} onChange={setAssignedDate} placeholder="Chọn ngày giao..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Hạn nộp <span className="text-rose-500">*</span>
                </label>
                <CustomDatePicker value={dueDate} onChange={setDueDate} placeholder="Chọn hạn nộp..." />

                {/* Quick Session Due Date Presets */}
                {upcomingSessions.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Chọn nhanh:</span>
                    {upcomingSessions.map((preset, pIdx) => {
                      const isSelected = dueDate === preset.date;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setDueDate(preset.date)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Ghi chú / Hướng dẫn</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hướng dẫn cho học sinh khi làm bài..."
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl p-3 text-xs font-medium text-slate-900 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {assignment ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'Đang xóa...' : 'Xóa'}
                  </button>
                ) : null}
                {assignment && onPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onPreview(assignment);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
                  >
                    Xem trước
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu bài tập'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <PromptTemplateModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />
    </>
  );
};
