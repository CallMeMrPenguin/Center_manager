import { SmartGroupingSection } from '../components/SmartGroupingSection';
import { ScoreFluctuationsSection } from '../components/ScoreFluctuationsSection';
import { RequireClassSelectionPrompt } from '../components/RequireClassSelectionPrompt';

interface DeepAnalysisTabProps {
  loading: boolean;
  classes: any[];
  selectedClassId: string;
  selectedStudentId: string;
  studentRankings: any[];
  sessionRecords: any[];
  filteredRankings: any[];
  onSelectRankingStudent: (studentId: number) => void;
  onSelectClass?: (classId: string) => void;
}

export const DeepAnalysisTab: React.FC<DeepAnalysisTabProps> = ({
  loading,
  classes,
  selectedClassId,
  selectedStudentId,
  studentRankings,
  sessionRecords,
  filteredRankings,
  onSelectRankingStudent,
  onSelectClass,
}) => {
  if (!selectedClassId || selectedClassId === 'all') {
    return <RequireClassSelectionPrompt />;
  }

  return (
    <div className="flex flex-col gap-6 mb-8 select-none">
      {/* 1. SMART PEDAGOGICAL LEVEL GROUPING */}
      <div className="animate-cascade-1">
        <SmartGroupingSection
          filteredRankings={filteredRankings}
          studentRankings={studentRankings}
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectRankingStudent={onSelectRankingStudent}
        />
      </div>

      {/* 2. SCORE FLUCTUATIONS & VARIATIONS TABLE */}
      <div className="animate-cascade-2">
        <ScoreFluctuationsSection
          loading={loading}
          studentRankings={studentRankings}
          sessionRecords={sessionRecords}
          selectedClassId={selectedClassId}
          selectedStudentId={selectedStudentId}
          onSelectRankingStudent={onSelectRankingStudent}
        />
      </div>
    </div>
  );
};
