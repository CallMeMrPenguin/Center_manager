import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useClassesData } from './hooks/useClassesData';
import { useClassDetail } from './hooks/useClassDetail';
import { useSeatingLayout } from './hooks/useSeatingLayout';
import { ClassListView } from './components/ClassListView';
import { AttendanceGradesTab } from './components/tabs/AttendanceGradesTab';
import { SeatingChartTab } from './components/tabs/SeatingChartTab';
import { ClassFormModal } from './components/modals/ClassFormModal';
import { BatchEnrollModal } from './components/modals/BatchEnrollModal';
import { StudentActionModal } from './components/modals/StudentActionModal';
import { GradingPairsModal } from './components/modals/GradingPairsModal';
import RelationshipsTab from '../../components/seating/RelationshipsTab';
import BlossomResultModal from '../../components/seating/BlossomResultModal';
import { TestConfigModal } from '../../components/TestConfigModal';
import { SegmentedControl } from '../../components/SegmentedControl';
import { ClassItem, EnrolledStudent } from './types';
import { notifyDataChanged } from '../../utils';

export default function ClassesPage() {
  const {
    classes,
    filteredClasses,
    teachers,
    allStudents,
    loading,
    search,
    setSearch,
    selectedClass,
    setSelectedClass,
    loadClasses,
    handleDeleteClass,
  } = useClassesData();

  const {
    enrolledStudents,
    attendanceDate,
    setAttendanceDate,
    attendanceRecords,
    savingAttendance,
    selectedClassWeeklyDays,
    loadAttendanceData,
    loadEnrolledStudents,
    handleUpdateRecord,
    parseAndFormatScore,
    handleSaveAttendance,
    flushSaveAttendance,
    handleExportExcel,
    handleExportDocx,
    handleUnenrollStudent,
  } = useClassDetail(selectedClass);

  const {
    numCols,
    desksPerCol,
    seatingGrid,
    draggedSeat,
    setDraggedSeat,
    draggedUnassigned,
    setDraggedUnassigned,
    absentStudentIds,
    unassignedStudents,
    showUnassignedPanel,
    setShowUnassignedPanel,
    blossomModalOpen,
    setBlossomModalOpen,
    blossomPairs,
    blossomUnmatched,
    mixingGA,
    gradingPairsModal,
    setGradingPairsModal,
    gradingPairs,
    handleAddColumn,
    handleRemoveColumn,
    handleAddDeskToCol,
    handleRemoveDeskFromCol,
    handleSaveSeating,
    handleClearSeat,
    handleDropOnSeat,
    handleAutoMixSeating,
    handleGeneticMixSeating,
    handleBlossomSwap,
  } = useSeatingLayout(selectedClass, enrolledStudents, attendanceRecords, attendanceDate);

  // Sub-tabs & modal local states
  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'seating' | 'relationships'>('grades');
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<EnrolledStudent | null>(null);
  const [testConfigModalOpen, setTestConfigModalOpen] = useState(false);

  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassModalOpen(true);
  };

  const handleOpenEnrollModal = () => {
    setEnrollModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* 1. CLASS LIST VIEW (NO CLASS SELECTED) */}
      {!selectedClass ? (
        <ClassListView
          classes={classes}
          filteredClasses={filteredClasses}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => loadClasses(false)}
          onCreateClass={handleOpenCreateClass}
          onSelectClass={setSelectedClass}
          onEditClass={handleOpenEditClass}
        />
      ) : (
        /* 2. CLASS DETAIL VIEW */
        <div className="space-y-6">
          {/* HEADER BACK NAVIGATION & SUB-TAB SELECTOR */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f1320] border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  flushSaveAttendance();
                  setSelectedClass(null);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/5"
                title="Quay lại danh sách lớp"
              >
                <ChevronLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{selectedClass.class_name}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                    {selectedClass.grade || 'Lớp 6'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  GV: {selectedClass.teacher_name || 'Chưa phân công'} | Phòng: {selectedClass.room || 'N/A'}
                </p>
              </div>
            </div>

            {/* Sliding Pill Indicator Segmented Control (Rule 7) */}
            <SegmentedControl<'grades' | 'seating' | 'relationships'>
              value={activeSubTab}
              onChange={(tab) => {
                if (activeSubTab === 'grades' && tab !== 'grades') {
                  flushSaveAttendance();
                }
                setActiveSubTab(tab);
              }}
              options={[
                { value: 'grades', label: 'Điểm Danh & Điểm', badge: enrolledStudents.length },
                { value: 'seating', label: 'Sơ Đồ Lớp' },
                { value: 'relationships', label: 'Nhóm Bạn & Xung Đột' },
              ]}
              activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
              size="md"
            />
          </div>

          {/* TAB 1: ATTENDANCE & GRADES */}
          {activeSubTab === 'grades' && (
            <AttendanceGradesTab
              selectedClass={selectedClass}
              enrolledStudents={enrolledStudents}
              attendanceDate={attendanceDate}
              attendanceRecords={attendanceRecords}
              savingAttendance={savingAttendance}
              selectedClassWeeklyDays={selectedClassWeeklyDays}
              onDateChange={setAttendanceDate}
              onUpdateRecord={handleUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
              onSaveAttendance={handleSaveAttendance}
              onOpenTestConfigModal={() => setTestConfigModalOpen(true)}
              onOpenEnrollModal={handleOpenEnrollModal}
              onOpenStudentActionModal={(st) => {
                setSelectedStudentForAction(st);
                setActionModalOpen(true);
              }}
              onOpenEditClass={handleOpenEditClass}
              onExportExcel={handleExportExcel}
              onExportDocx={handleExportDocx}
            />
          )}

          {/* TAB 2: SEATING CHART */}
          {activeSubTab === 'seating' && (
            <SeatingChartTab
              seatingGrid={seatingGrid}
              numCols={numCols}
              desksPerCol={desksPerCol}
              attendanceDate={attendanceDate}
              selectedClassWeeklyDays={selectedClassWeeklyDays}
              absentStudentIds={absentStudentIds}
              unassignedStudents={unassignedStudents}
              showUnassignedPanel={showUnassignedPanel}
              mixingGA={mixingGA}
              onDateChange={setAttendanceDate}
              onToggleUnassignedPanel={setShowUnassignedPanel}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
              onAddDeskToCol={handleAddDeskToCol}
              onRemoveDeskFromCol={handleRemoveDeskFromCol}
              onAutoMixSeating={handleAutoMixSeating}
              onGeneticMixSeating={handleGeneticMixSeating}
              onBlossomSwap={handleBlossomSwap}
              onSaveSeating={handleSaveSeating}
              onClearSeat={handleClearSeat}
              onDropOnSeat={handleDropOnSeat}
              onDragStartSeat={setDraggedSeat}
              onDragStartUnassigned={setDraggedUnassigned}
            />
          )}

          {/* TAB 3: RELATIONSHIPS & FRIEND GROUPS */}
          {activeSubTab === 'relationships' && (
            <RelationshipsTab
              classId={selectedClass.id}
              enrolledStudents={enrolledStudents}
              onRefreshClass={() => {
                loadEnrolledStudents(selectedClass.id);
                loadAttendanceData(selectedClass.id, attendanceDate);
              }}
            />
          )}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT CLASS */}
      <ClassFormModal
        isOpen={classModalOpen}
        editingClass={editingClass}
        teachers={teachers}
        onClose={() => setClassModalOpen(false)}
        onSaved={() => {
          setClassModalOpen(false);
          loadClasses(true);
          notifyDataChanged();
        }}
        onDeleteClass={handleDeleteClass}
      />

      {/* MODAL 2: BATCH ENROLL STUDENTS */}
      <BatchEnrollModal
        isOpen={enrollModalOpen}
        selectedClass={selectedClass}
        allStudents={allStudents}
        enrolledStudents={enrolledStudents}
        onClose={() => setEnrollModalOpen(false)}
        onEnrolled={() => {
          if (selectedClass) {
            loadEnrolledStudents(selectedClass.id);
            loadAttendanceData(selectedClass.id, attendanceDate);
            notifyDataChanged();
          }
        }}
      />

      {/* MODAL 3: STUDENT ACTION / UNENROLL */}
      <StudentActionModal
        isOpen={actionModalOpen}
        student={selectedStudentForAction}
        selectedClass={selectedClass}
        onClose={() => setActionModalOpen(false)}
        onUnenroll={(stId) => {
          handleUnenrollStudent(stId);
          setActionModalOpen(false);
        }}
      />

      {/* MODAL 4: GRADING PAIRS (PAPER SWAP) */}
      <GradingPairsModal
        isOpen={gradingPairsModal}
        gradingPairs={gradingPairs}
        onClose={() => setGradingPairsModal(false)}
      />

      {/* MODAL 5: BLOSSOM MATCHING RESULT */}
      <BlossomResultModal
        isOpen={blossomModalOpen}
        onClose={() => setBlossomModalOpen(false)}
        pairs={blossomPairs}
        unmatched={blossomUnmatched}
      />

      {/* MODAL 6: SESSION TEST CONFIG */}
      {selectedClass && (
        <TestConfigModal
          isOpen={testConfigModalOpen}
          onClose={() => setTestConfigModalOpen(false)}
          classId={selectedClass.id}
          date={attendanceDate}
          grade={selectedClass.grade}
          onSaved={() => {
            loadAttendanceData(selectedClass.id, attendanceDate);
            notifyDataChanged();
          }}
        />
      )}
    </div>
  );
}
