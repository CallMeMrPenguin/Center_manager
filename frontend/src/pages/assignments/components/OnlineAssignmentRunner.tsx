import React from 'react';
import { Assignment } from '../types';
import { WhitePaperAssignmentViewer } from './WhitePaperAssignmentViewer';

interface OnlineAssignmentRunnerProps {
  assignment: Assignment;
  studentId?: number;
  studentName?: string;
  isPreview?: boolean;
  onBack: () => void;
  onSubmitSuccess?: (score: number) => void;
}

export const OnlineAssignmentRunner: React.FC<OnlineAssignmentRunnerProps> = ({
  assignment,
  studentName = 'Học Sinh',
  isPreview = true,
  onBack,
  onSubmitSuccess,
}) => {
  return (
    <WhitePaperAssignmentViewer
      assignment={assignment}
      studentName={studentName}
      isPreview={isPreview}
      onBack={onBack}
      onSubmitSuccess={onSubmitSuccess}
    />
  );
};
