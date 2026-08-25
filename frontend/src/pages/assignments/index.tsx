import React, { useMemo } from 'react';
import { BookOpen, Calendar, Plus } from 'lucide-react';
import { CustomSelect, SelectOption } from '../../components/CustomSelect';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useAssignmentsData } from './hooks/useAssignmentsData';
import { AssignmentsKpiCards } from './components/AssignmentsKpiCards';
import { AssignmentModal } from './components/AssignmentModal';
import { AssignmentListTab } from './tabs/AssignmentListTab';
import { SubmissionTab } from './tabs/SubmissionTab';
import { OnlineAssignmentRunner } from './components/OnlineAssignmentRunner';
import { Assignment } from './types';

export const AssignmentsPage: React.FC = () => {
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

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Header Filter Bar */}
      <div className="bg-[#0c0f1e] border border-[#1e2742] rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="w-56 max-w-full">
            <CustomSelect
              value={selectedClassId}
              onChange={(val) => setSelectedClassId(String(val))}
              options={classOptions}
              placeholder="Chọn lớp học..."
              icon={<BookOpen size={14} className="text-indigo-400" />}
            />
          </div>

          <div className="w-48 max-w-full">
            <CustomSelect
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(String(val))}
              options={monthOptions}
              placeholder="Chọn tháng..."
              icon={<Calendar size={14} className="text-purple-400" />}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={15} />
          <span>Giao BTVN Mới</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <AssignmentsKpiCards kpis={kpis} />

      {/* 3. Segmented Control Switcher */}
      <div className="flex items-center justify-between border-b border-[#181f36] pb-3">
        <SegmentedControl<'list' | 'submissions' | 'runner'>
          value={activeView}
          onChange={setActiveView}
          options={[
            { value: 'list', label: 'Danh Sách Bài Tập' },
            {
              value: 'submissions',
              label: currentAssignment ? `Nộp Bài: ${currentAssignment.title}` : 'Theo Dõi Nộp Bài',
            },
            {
              value: 'runner',
              label: currentAssignment ? `Phiếu Đề: ${currentAssignment.title}` : 'Phiếu Đề (Nền Trắng)',
            },
          ]}
          activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
          size="md"
        />
      </div>

      {/* 4. Active Tab Content */}
      <div className="space-y-4">
        {activeView === 'list' ? (
          <AssignmentListTab
            assignments={assignments}
            loading={loading}
            onEditAssignment={handleOpenEditModal}
            onViewSubmissions={handleViewSubmissions}
            onPlayPreview={handlePlayPreview}
            onOpenCreateModal={handleOpenCreateModal}
          />
        ) : activeView === 'submissions' ? (
          <SubmissionTab
            assignment={currentAssignment}
            submissions={submissions}
            loading={submissionsLoading}
            onBack={() => setActiveView('list')}
            onSaveSubmissions={handleSaveSubmissions}
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
            isPreview={true}
            onBack={() => setActiveView('list')}
            onSubmitSuccess={() => {
              loadAssignments();
            }}
          />
        )}
      </div>

      {/* 5. Create / Edit Assignment Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={editingAssignment}
        classes={classes}
        defaultClassId={selectedClassId}
        onSuccess={loadAssignments}
      />
    </div>
  );
};

export default AssignmentsPage;

