import React, { useState, useEffect, useCallback } from 'react';
import { useClassesData } from './hooks/useClassesData';
import { useClassDetail } from './hooks/useClassDetail';
import { useSeatingLayout } from './hooks/useSeatingLayout';
import { ClassListView } from './components/ClassListView';
import { ClassDetailHeader } from './components/ClassDetailHeader';
import { AttendanceGradesTab } from './components/tabs/AttendanceGradesTab';
import { SeatingChartTab } from './components/tabs/SeatingChartTab';
import { ClassModalsContainer } from './components/modals/ClassModalsContainer';
import RelationshipsTab from '../../components/seating/RelationshipsTab';
import { useConfirm } from '../../components/ConfirmDialog';
import { ClassItem, EnrolledStudent } from './types';
import { notifyDataChanged } from '../../utils';
import { getUrlParam, setUrlParams, useUrlSync } from '../../utils/navigation';

export default function ClassesPage() {
  const confirm = useConfirm();
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
    handleDeleteAttendanceDate,
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
    handleSwapStudents,
  } = useSeatingLayout(selectedClass, enrolledStudents, attendanceRecords, attendanceDate);

  // Sub-tabs & modal local states with deep link initialization
  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'seating' | 'relationships'>(() => {
    const tab = getUrlParam('tab') || getUrlParam('subtab');
    if (tab === 'seating' || tab === 'relationships' || tab === 'grades') return tab;
    return 'grades';
  });

  const [cheatingModalOpen, setCheatingModalOpen] = useState(false);

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

  // Sync state from URL (Browser Back/Forward or direct links)
  const syncFromUrl = useCallback(() => {
    const urlClassId = getUrlParam('id') || getUrlParam('classId');
    const urlTab = getUrlParam('tab') || getUrlParam('subtab');

    if (urlTab === 'seating' || urlTab === 'relationships' || urlTab === 'grades') {
      setActiveSubTab(urlTab);
    }

    if (urlClassId && classes.length > 0) {
      const found = classes.find((c) => String(c.id) === urlClassId);
      if (found && selectedClass?.id !== found.id) {
        setSelectedClass(found);
      }
    } else if (!urlClassId && selectedClass) {
      setSelectedClass(null);
    }
  }, [classes, selectedClass, setSelectedClass]);

  useUrlSync(syncFromUrl);

  // Auto-restore or navigate to selected class on initial mount or event
  useEffect(() => {
    const urlClassId = getUrlParam('id') || getUrlParam('classId');
    if (urlClassId && classes.length > 0) {
      const found = classes.find((c) => String(c.id) === urlClassId);
      if (found) {
        setSelectedClass(found);
        return;
      }
    }

    const handleNavigate = (e: any) => {
      const cid = e?.detail?.classId;
      if (cid && classes.length > 0) {
        const found = classes.find((c) => c.id === Number(cid));
        if (found) {
          setSelectedClass(found);
          setUrlParams({ id: String(found.id), tab: activeSubTab });
        }
      }
    };
    window.addEventListener('navigate-to-class', handleNavigate);

    const storedClassId = sessionStorage.getItem('center_manager_last_class_id');
    if (storedClassId && !selectedClass && classes.length > 0) {
      const found = classes.find((c) => String(c.id) === storedClassId);
      if (found) {
        setSelectedClass(found);
        setUrlParams({ id: String(found.id), tab: activeSubTab }, { replace: true });
      }
    }
    return () => window.removeEventListener('navigate-to-class', handleNavigate);
  }, [classes, selectedClass, setSelectedClass, activeSubTab]);

  const handleSelectClass = (cls: ClassItem | null) => {
    if (cls) {
      sessionStorage.setItem('center_manager_last_class_id', String(cls.id));
      setUrlParams({ id: String(cls.id), tab: activeSubTab });
    } else {
      sessionStorage.removeItem('center_manager_last_class_id');
      setUrlParams({ id: null, tab: null });
    }
    setSelectedClass(cls);
  };

  const handleChangeSubTab = (tab: 'grades' | 'seating' | 'relationships') => {
    if (activeSubTab === 'grades' && tab !== 'grades') {
      flushSaveAttendance();
    }
    setActiveSubTab(tab);
    if (selectedClass) {
      setUrlParams({ tab });
    }
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
          onSelectClass={handleSelectClass}
          onEditClass={handleOpenEditClass}
        />
      ) : (
        /* 2. CLASS DETAIL VIEW (UNIFIED MASTER HEADER + SELECTED TAB) */
        <div className="space-y-6">
          {/* UNIFIED MASTER HEADER (Single visual boundary per Rule 5) */}
          <ClassDetailHeader
            selectedClass={selectedClass}
            activeSubTab={activeSubTab}
            onChangeSubTab={handleChangeSubTab}
            enrolledCount={enrolledStudents.length}
            attendanceDate={attendanceDate}
            onDateChange={setAttendanceDate}
            selectedClassWeeklyDays={selectedClassWeeklyDays}
            onBack={() => {
              flushSaveAttendance();
              handleSelectClass(null);
            }}
            onOpenEditClass={(cls) => {
              flushSaveAttendance();
              handleOpenEditClass(cls);
            }}
            onDeleteAttendanceDate={
              activeSubTab === 'grades'
                ? async () => {
                    if (!selectedClass) return;
                    const ok = await confirm({
                      title: 'Xóa Buổi Học / Điểm Danh',
                      message: `Bạn có chắc chắn muốn xóa toàn bộ lịch học và điểm danh ngày ${attendanceDate} của lớp "${selectedClass.class_name}"? Thao tác này giúp bạn làm sạch dữ liệu nếu lỡ lưu sai ngày.`,
                      confirmText: 'Xóa Buổi Này',
                      type: 'danger',
                    });
                    if (ok) {
                      await handleDeleteAttendanceDate();
                    }
                  }
                : undefined
            }
            onOpenTestConfigModal={
              activeSubTab === 'grades'
                ? async () => {
                    await flushSaveAttendance();
                    setTestConfigModalOpen(true);
                  }
                : undefined
            }
            onOpenEnrollModal={
              activeSubTab === 'grades'
                ? async () => {
                    await flushSaveAttendance();
                    handleOpenEnrollModal();
                  }
                : undefined
            }
            onSaveAttendance={activeSubTab === 'grades' ? handleSaveAttendance : undefined}
            savingAttendance={savingAttendance}
          />

          {/* TAB 1: ATTENDANCE & GRADES */}
          {activeSubTab === 'grades' && (
            <AttendanceGradesTab
              selectedClass={selectedClass}
              enrolledStudents={enrolledStudents}
              attendanceDate={attendanceDate}
              attendanceRecords={attendanceRecords}
              onUpdateRecord={handleUpdateRecord}
              parseAndFormatScore={parseAndFormatScore}
              onOpenStudentActionModal={async (st) => {
                await flushSaveAttendance();
                setSelectedStudentForAction(st);
                setActionModalOpen(true);
              }}
              onExportExcel={async () => {
                await flushSaveAttendance();
                handleExportExcel();
              }}
              onExportDocx={async () => {
                await flushSaveAttendance();
                handleExportDocx();
              }}
              onOpenCheatingModal={() => setCheatingModalOpen(true)}
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
              onOpenCheatingModal={() => setCheatingModalOpen(true)}
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

      {/* UNIFIED MODALS CONTAINER */}
      <ClassModalsContainer
        classModalOpen={classModalOpen}
        editingClass={editingClass}
        teachers={teachers}
        onCloseClassModal={() => setClassModalOpen(false)}
        onClassSaved={() => {
          setClassModalOpen(false);
          loadClasses(true);
          notifyDataChanged();
        }}
        onDeleteClass={handleDeleteClass}

        enrollModalOpen={enrollModalOpen}
        selectedClass={selectedClass}
        allStudents={allStudents}
        enrolledStudents={enrolledStudents}
        attendanceDate={attendanceDate}
        onCloseEnrollModal={() => setEnrollModalOpen(false)}
        onUnenrollStudent={handleUnenrollStudent}
        onBatchEnrolled={async () => {
          if (selectedClass) {
            await Promise.all([
              loadEnrolledStudents(selectedClass.id),
              loadAttendanceData(selectedClass.id, attendanceDate),
            ]);
            notifyDataChanged(['classes', 'students', 'attendance', 'seating']);
          }
        }}

        actionModalOpen={actionModalOpen}
        selectedStudentForAction={selectedStudentForAction}
        onCloseActionModal={() => setActionModalOpen(false)}

        gradingPairsModal={gradingPairsModal}
        gradingPairs={gradingPairs}
        onCloseGradingPairsModal={() => setGradingPairsModal(false)}

        blossomModalOpen={blossomModalOpen}
        blossomPairs={blossomPairs}
        blossomUnmatched={blossomUnmatched}
        onCloseBlossomModal={() => setBlossomModalOpen(false)}

        testConfigModalOpen={testConfigModalOpen}
        onCloseTestConfigModal={() => setTestConfigModalOpen(false)}
        onTestConfigSaved={async () => {
          await flushSaveAttendance(true);
          if (selectedClass) {
            loadAttendanceData(selectedClass.id, attendanceDate);
          }
          notifyDataChanged(['schedule', 'attendance', 'reports', 'analytics', 'classes']);
        }}

        cheatingModalOpen={cheatingModalOpen}
        seatingGrid={seatingGrid}
        attendanceRecords={attendanceRecords}
        onCloseCheatingModal={() => setCheatingModalOpen(false)}
        onSwapSeats={handleSwapStudents}
      />
    </div>
  );
}
