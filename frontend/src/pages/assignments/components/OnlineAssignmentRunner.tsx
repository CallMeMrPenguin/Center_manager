import React from 'react';
import { Assignment } from '../types';
import { WhitePaperAssignmentViewer } from './WhitePaperAssignmentViewer';

interface OnlineAssignmentRunnerProps {
  assignment: Assignment;
  studentId?: number;
  studentName?: string;
  isPreview?: boolean;
  onBack: () => void;
  onEditAnswerKey?: (assignment: Assignment) => void;
  onSubmitSuccess?: (score: number) => void;
}

export const OnlineAssignmentRunner: React.FC<OnlineAssignmentRunnerProps> = ({
  assignment,
  studentId,
  studentName = 'Học Sinh',
  isPreview = true,
  onBack,
  onEditAnswerKey,
  onSubmitSuccess,
}) => {
  return (
    <WhitePaperAssignmentViewer
      assignment={assignment}
      studentId={studentId}
      studentName={studentName}
      isPreview={isPreview}
      onBack={onBack}
      onEditAnswerKey={onEditAnswerKey}
      onSubmitSuccess={onSubmitSuccess}
    />
  );
};
