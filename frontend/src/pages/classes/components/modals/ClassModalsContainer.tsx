import React from 'react';
import { ClassItem, EnrolledStudent, SeatingCol, AttendanceRecord, GradingPair, TeacherCM } from '../../types';
import { ClassFormModal } from './ClassFormModal';
import { BatchEnrollModal } from './BatchEnrollModal';
import { StudentActionModal } from './StudentActionModal';
import { GradingPairsModal } from './GradingPairsModal';
import { CheatingPredictionModal } from './CheatingPredictionModal';
import BlossomResultModal from '../../../../components/seating/BlossomResultModal';
import { TestConfigModal } from '../../../../components/TestConfigModal';

interface ClassModalsContainerProps {
  // 1. Class Form
  classModalOpen: boolean;
  editingClass: ClassItem | null;
  teachers: TeacherCM[];
  onCloseClassModal: () => void;
  onClassSaved: () => void;
  onDeleteClass?: (cls: ClassItem) => void;

  // 2. Batch Enroll
  enrollModalOpen: boolean;
  selectedClass: ClassItem | null;
  allStudents: any[];
  enrolledStudents: EnrolledStudent[];
  attendanceDate: string;
  onCloseEnrollModal: () => void;
  onUnenrollStudent: (stId: number) => Promise<void>;
  onBatchEnrolled: () => Promise<void>;

  // 3. Student Action
  actionModalOpen: boolean;
  selectedStudentForAction: EnrolledStudent | null;
  onCloseActionModal: () => void;

  // 4. Grading Pairs
  gradingPairsModal: boolean;
  gradingPairs: GradingPair[];
  onCloseGradingPairsModal: () => void;

  // 5. Blossom Matching
  blossomModalOpen: boolean;
  blossomPairs: any[];
  blossomUnmatched: any[];
  onCloseBlossomModal: () => void;

  // 6. Test Config
  testConfigModalOpen: boolean;
  onCloseTestConfigModal: () => void;
  onTestConfigSaved: () => Promise<void>;

  // 7. Cheating Prediction
  cheatingModalOpen: boolean;
  seatingGrid: SeatingCol[];
  attendanceRecords: AttendanceRecord[];
  onCloseCheatingModal: () => void;
  onSwapSeats: (studentAId: number, studentBId: number) => void;
}

export const ClassModalsContainer: React.FC<ClassModalsContainerProps> = ({
  classModalOpen,
  editingClass,
  teachers,
  onCloseClassModal,
  onClassSaved,
  onDeleteClass,

  enrollModalOpen,
  selectedClass,
  allStudents,
  enrolledStudents,
  onCloseEnrollModal,
  onUnenrollStudent,
  onBatchEnrolled,

  actionModalOpen,
  selectedStudentForAction,
  onCloseActionModal,

  gradingPairsModal,
  gradingPairs,
  onCloseGradingPairsModal,

  blossomModalOpen,
  blossomPairs,
  blossomUnmatched,
  onCloseBlossomModal,

  testConfigModalOpen,
  attendanceDate,
  onCloseTestConfigModal,
  onTestConfigSaved,

  cheatingModalOpen,
  seatingGrid,
  attendanceRecords,
  onCloseCheatingModal,
  onSwapSeats,
}) => {
  return (
    <>
      {/* 1. CREATE / EDIT CLASS MODAL */}
      <ClassFormModal
        isOpen={classModalOpen}
        editingClass={editingClass}
        teachers={teachers}
        onClose={onCloseClassModal}
        onSaved={onClassSaved}
        onDeleteClass={onDeleteClass}
      />

      {/* 2. BATCH ENROLL STUDENTS MODAL */}
      <BatchEnrollModal
        isOpen={enrollModalOpen}
        selectedClass={selectedClass}
        allStudents={allStudents}
        enrolledStudents={enrolledStudents}
        onClose={onCloseEnrollModal}
        onUnenroll={onUnenrollStudent}
        onEnrolled={onBatchEnrolled}
      />

      {/* 3. STUDENT ACTION MODAL */}
      <StudentActionModal
        isOpen={actionModalOpen}
        student={selectedStudentForAction}
        selectedClass={selectedClass}
        onClose={onCloseActionModal}
        onUnenroll={async (stId) => {
          await onUnenrollStudent(stId);
          onCloseActionModal();
        }}
      />

      {/* 4. GRADING PAIRS MODAL */}
      <GradingPairsModal
        isOpen={gradingPairsModal}
        gradingPairs={gradingPairs}
        onClose={onCloseGradingPairsModal}
      />

      {/* 5. BLOSSOM MATCHING MODAL */}
      <BlossomResultModal
        isOpen={blossomModalOpen}
        onClose={onCloseBlossomModal}
        pairs={blossomPairs}
        unmatched={blossomUnmatched}
      />

      {/* 6. TEST CONFIG MODAL */}
      {selectedClass && (
        <TestConfigModal
          isOpen={testConfigModalOpen}
          onClose={onCloseTestConfigModal}
          classId={selectedClass.id}
          date={attendanceDate}
          grade={selectedClass.grade}
          onSaved={onTestConfigSaved}
        />
      )}

      {/* 7. CHEATING / PEEKING PREDICTION MODAL */}
      <CheatingPredictionModal
        isOpen={cheatingModalOpen}
        onClose={onCloseCheatingModal}
        seatingGrid={seatingGrid}
        attendanceRecords={attendanceRecords}
        attendanceDate={attendanceDate}
        onSwapSeats={onSwapSeats}
      />
    </>
  );
};
