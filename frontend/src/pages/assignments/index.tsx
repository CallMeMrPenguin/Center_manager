import React, { useMemo, useState } from 'react';
import { CustomSelect, SelectOption } from '../../components/CustomSelect';
import { useAssignmentsData } from './hooks/useAssignmentsData';
import { AssignmentsKpiCards } from './components/AssignmentsKpiCards';
import { AssignmentModal } from './components/AssignmentModal';
import { AnswerKeyModal } from './components/AnswerKeyModal';
import { AssignmentListTab } from './tabs/AssignmentListTab';
import { SubmissionTab } from './tabs/SubmissionTab';
import { OnlineAssignmentRunner } from './components/OnlineAssignmentRunner';
import { Assignment } from './types';
import { isStudentUser } from '../../utils/authUtils';

export const AssignmentsPage: React.FC = () => {
  const isStudent = isStudentUser();
  const [answerKeyAssignment, setAnswerKeyAssignment] = useState<Assignment | null>(null);
  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false);

  const {
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedMonth,
    setSelectedMonth,
    assignments,
    loading,
    activeView,
    setActiveView,
    currentAssignment,
    submissions,
    submissionsLoading,
    isModalOpen,
    setIsModalOpen,
    editingAssignment,
    setEditingAssignment,
    kpis,
    loadAssignments,
    handleViewSubmissions,
    handlePlayPreview,
    handleSaveSubmissions,
  } = useAssignmentsData();

  const classOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ value: 'all', label: 'Tất cả lớp học' }];
    classes.forEach((c) => {
      opts.push({ value: String(c.id), label: c.class_name });
    });
    return opts;
  }, [classes]);

  const monthOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ value: '', label: 'Tất cả thời gian' }];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      opts.push({ value: val, label });
    }
    return opts;
  }, []);

  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (assign: Assignment) => {
    setEditingAssignment(assign);
    setIsModalOpen(true);
  };

  const handleOpenAnswerKeyModal = (assign: Assignment) => {
    setAnswerKeyAssignment(assign);
    setIsAnswerKeyModalOpen(true);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Header Filter Bar (Clean single visual boundary, no border-in-border, no icons) */}
      {!isStudent && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="w-56 max-w-full">
              <CustomSelect
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(String(val))}
                options={classOptions}
                placeholder="Chọn lớp học..."
              />
            </div>

            <div className="w-48 max-w-full">
              <CustomSelect
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(String(val))}
                options={monthOptions}
                placeholder="Chọn tháng..."
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95 shrink-0"
          >
            Giao BTVN Mới
          </button>
        </div>
      )}

      {/* 2. KPI Summary Cards (Admin only) */}
      {!isStudent && <AssignmentsKpiCards kpis={kpis} />}

      {/* 3. Active View Content */}
      <div className="space-y-4">
        {activeView === 'list' ? (
          <AssignmentListTab
            assignments={assignments}
            loading={loading}
            isStudent={isStudent}
            onEditAssignment={handleOpenEditModal}
            onViewSubmissions={handleViewSubmissions}
            onPlayPreview={handlePlayPreview}
            onOpenCreateModal={handleOpenCreateModal}
          />
        ) : activeView === 'submissions' && !isStudent ? (
          <SubmissionTab
            assignment={currentAssignment}
            submissions={submissions}
            loading={submissionsLoading}
            onBack={() => setActiveView('list')}
            onSaveSubmissions={handleSaveSubmissions}
            onEditAnswerKey={handleOpenAnswerKeyModal}
          />
        ) : (
          <OnlineAssignmentRunner
            assignment={
              currentAssignment || {
                id: 0,
                class_id: 0,
                title: 'Bài Tập Về Nhà Mẫu',
                due_date: new Date().toISOString().slice(0, 10),
                assigned_date: new Date().toISOString().slice(0, 10),
                max_score: 10,
              }
            }
            isPreview={!isStudent}
            studentName={isStudent ? 'Học Sinh' : 'Học Sinh Xem Trước'}
            onBack={() => setActiveView('list')}
            onEditAnswerKey={!isStudent ? handleOpenAnswerKeyModal : undefined}
            onSubmitSuccess={() => {
              loadAssignments();
            }}
          />
        )}
      </div>

      {/* 4. Create / Edit Assignment Modal */}
      {!isStudent && (
        <AssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          assignment={editingAssignment}
          classes={classes}
          defaultClassId={selectedClassId}
          onSuccess={loadAssignments}
        />
      )}

      {/* 5. Answer Key Modal & Auto Re-Grader */}
      {!isStudent && (
        <AnswerKeyModal
          isOpen={isAnswerKeyModalOpen}
          onClose={() => setIsAnswerKeyModalOpen(false)}
          assignment={answerKeyAssignment}
          onSuccess={loadAssignments}
        />
      )}
    </div>
  );
};

export default AssignmentsPage;
