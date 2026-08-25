import React, { useState, useEffect } from 'react';
import { StudentProfileHeader } from '../components/StudentProfileHeader';
import { KPICards } from '../components/KPICards';
import { InteractiveChart } from '../components/InteractiveChart';
import { SummaryStrip } from '../components/SummaryStrip';
import { StudentRankingsTable } from '../components/StudentRankingsTable';
import { StudentGradeHistoryTable } from '../components/StudentGradeHistoryTable';
import { InsightCommentary } from '../components/InsightCommentary';
import { GradeTypeFilterKey, DistributionScoreBin } from '../utils/distributionAnalytics';
import { useOverviewStats } from '../hooks/useOverviewStats';

interface OverviewTabProps {
  loading: boolean;
  classes: any[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  selectedStudentObj: any;
  selectedAcademicYear: string;
  sessionRecords: any[];
  studentRankings: any[];
  filteredRankings: any[];
  engine: any;
  gradeTypesList: any[];
  studentSessionsMap: Record<string, any[]>;
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  onOpenPhaseModal: () => void;
  onOpenEditModal: (rec: any) => void;
  onSelectRankingStudent: (studentId: number) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  loading,
  classes,
  selectedClassId,
  setSelectedClassId,
  selectedStudentId,
  setSelectedStudentId,
  selectedStudentObj,
  selectedAcademicYear,
  sessionRecords,
  studentRankings,
  filteredRankings,
  engine,
  gradeTypesList,
  studentSessionsMap,
  timePhases,
  selectedPhaseId,
  setSelectedPhaseId,
  onOpenPhaseModal,
  onOpenEditModal,
  onSelectRankingStudent,
}) => {
  const [timeView, setTimeView] = useState<'1m' | '2m' | '3m' | 'all'>('all');
  const [chartViewMode, setChartViewMode] = useState<'timeline' | 'distribution'>('timeline');
  const [selectedGradeTypeFilter, setSelectedGradeTypeFilter] = useState<GradeTypeFilterKey>('overall');
  const [selectedScoreBin, setSelectedScoreBin] = useState<DistributionScoreBin | null>(null);

  // Clear score bin filter whenever class or grade type filter changes
  useEffect(() => {
    setSelectedScoreBin(null);
  }, [selectedClassId, selectedGradeTypeFilter, selectedPhaseId]);

  const handleSelectScoreBin = (bin: DistributionScoreBin) => {
    if (selectedScoreBin && selectedScoreBin.minScore === bin.minScore && selectedScoreBin.maxScore === bin.maxScore) {
      setSelectedScoreBin(null);
    } else {
      setSelectedScoreBin(bin);
    }
  };

  const {
    combinedTimePhases,
    activeSessionRecords,
    stats,
    sessionChartData,
    fittedLookup,
    distributionStats,
    displayedRankings,
  } = useOverviewStats({
    classes,
    selectedClassId,
    selectedStudentId,
    selectedAcademicYear,
    sessionRecords,
    studentRankings,
    filteredRankings,
    gradeTypesList,
    timePhases,
    selectedPhaseId,
    timeView,
    selectedGradeTypeFilter,
    selectedScoreBin,
  });

  return (
    <div className="space-y-6">
      {/* 1. INDIVIDUAL STUDENT PROFILE */}
      {selectedStudentObj && (
        <div className="animate-cascade-1">
          <StudentProfileHeader
            student={selectedStudentObj}
            stats={stats}
            onClearStudent={() => setSelectedStudentId('')}
          />
        </div>
      )}

      {/* 2. FOUR/FIVE GLOWING KPI CARDS */}
      <div className={selectedStudentObj ? 'animate-cascade-2' : 'animate-cascade-1'}>
        <KPICards
          stats={stats}
          engine={engine}
          hasSelectedStudent={!!selectedStudentObj}
        />
      </div>

      {/* 3. INSIGHT COMMENTARY PANEL */}
      <div className={selectedStudentObj ? 'animate-cascade-3' : 'animate-cascade-2'}>
        <InsightCommentary
          stats={stats}
          engine={engine}
          hasSelectedStudent={!!selectedStudentObj}
          selectedClassId={selectedClassId}
          filteredRankings={filteredRankings}
        />
      </div>

      {/* 4. INTERACTIVE CHART (WITH TIMELINE & SCORE DISTRIBUTION TOGGLE) */}
      <div className={selectedStudentObj ? 'animate-cascade-4' : 'animate-cascade-3'}>
        <InteractiveChart
          sessionChartData={sessionChartData}
          engine={engine}
          fittedLookup={fittedLookup}
          selectedStudentId={selectedStudentId}
          selectedClassId={selectedClassId}
          timeView={timeView}
          setTimeView={setTimeView}
          timePhases={combinedTimePhases}
          selectedPhaseId={selectedPhaseId}
          setSelectedPhaseId={setSelectedPhaseId}
          onOpenPhaseModal={onOpenPhaseModal}
          chartViewMode={chartViewMode}
          setChartViewMode={setChartViewMode}
          distributionStats={distributionStats}
          selectedGradeTypeFilter={selectedGradeTypeFilter}
          setSelectedGradeTypeFilter={setSelectedGradeTypeFilter}
          selectedScoreBin={selectedScoreBin}
          onSelectScoreBin={handleSelectScoreBin}
        />
      </div>

      {/* 5. SUMMARY STRIP */}
      <div className={selectedStudentObj ? 'animate-cascade-5' : 'animate-cascade-4'}>
        <SummaryStrip
          engine={engine}
          gradeTypesList={gradeTypesList}
          hasSelectedStudent={!!selectedStudentObj}
          chartViewMode={chartViewMode}
          distributionStats={distributionStats}
        />
      </div>

      {/* 6. STUDENT RANKINGS TABLE */}
      <div className={selectedStudentObj ? 'animate-cascade-6' : 'animate-cascade-5'}>
        <StudentRankingsTable
          loading={loading}
          classes={classes}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          studentRankings={studentRankings}
          filteredRankings={displayedRankings}
          studentSessionsMap={studentSessionsMap}
          onSelectRankingStudent={onSelectRankingStudent}
          hasSelectedStudent={!!selectedStudentObj}
          selectedScoreBin={selectedScoreBin}
          onClearScoreBin={() => setSelectedScoreBin(null)}
        />
      </div>

      {/* 7. STUDENT GRADE HISTORY TABLE */}
      <div className={selectedStudentObj ? 'animate-cascade-7' : 'animate-cascade-6'}>
        <StudentGradeHistoryTable
          loading={loading}
          sessionRecords={activeSessionRecords.length > 0 ? activeSessionRecords : sessionRecords}
          selectedStudentObj={selectedStudentObj}
          stats={stats}
          onOpenEditModal={onOpenEditModal}
          hasSelectedStudent={!!selectedStudentObj}
        />
      </div>
    </div>
  );
};
