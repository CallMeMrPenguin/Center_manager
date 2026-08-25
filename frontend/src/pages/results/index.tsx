import React, { useMemo } from 'react';
import { useStudentResults } from './hooks/useStudentResults';
import { StudentProfileHeader } from './components/StudentProfileHeader';
import { KPICards } from '../reports/components/KPICards';
import { InsightCommentary } from '../reports/components/InsightCommentary';
import { InteractiveChart } from '../reports/components/InteractiveChart';
import { SummaryStrip } from '../reports/components/SummaryStrip';
import { ResultHistoryTable } from './components/ResultHistoryTable';
import { AuthUser } from '../auth/LoginPage';

export const ResultsPage: React.FC = () => {
  const currentUser: AuthUser | null = useMemo(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  }, []);

  const isStudent = currentUser?.role === 'student';

  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    currentStudent,
    classes,
    selectedClassId,
    setSelectedClassId,
    loading,
    records,
    summary,
    refresh,
    // Reports Engine & Analytics
    stats,
    engine,
    sessionChartData,
    fittedLookup,
    distributionStats,
    displayedRankings,
    gradeTypesList,
    timeView,
    setTimeView,
    chartViewMode,
    setChartViewMode,
    selectedGradeTypeFilter,
    setSelectedGradeTypeFilter,
    selectedScoreBin,
    setSelectedScoreBin,
    combinedTimePhases,
    selectedPhaseId,
    setSelectedPhaseId,
  } = useStudentResults();

  const handleSelectScoreBin = (bin: any) => {
    if (selectedScoreBin && selectedScoreBin.minScore === bin.minScore && selectedScoreBin.maxScore === bin.maxScore) {
      setSelectedScoreBin(null);
    } else {
      setSelectedScoreBin(bin);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Header Filter Bar & Student ID Card */}
      <StudentProfileHeader
        students={students}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
        classes={classes}
        selectedClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        summary={summary}
        loading={loading}
        onRefresh={refresh}
        isStudent={isStudent}
      />

      {/* 2. Key Performance Indicators (KPICards from Reports) */}
      <div className="animate-cascade-1">
        <KPICards
          stats={stats}
          engine={engine}
          hasSelectedStudent={!!currentStudent}
        />
      </div>

      {/* 3. Academic Insight Commentary (Phần Nhận Xét Học Lực from Reports) */}
      <div className="animate-cascade-2">
        <InsightCommentary
          stats={stats}
          engine={engine}
          hasSelectedStudent={!!currentStudent}
          selectedStudentObj={currentStudent}
          selectedClassId={selectedClassId === 'all' ? '' : selectedClassId}
          classes={classes}
          filteredRankings={displayedRankings}
          distributionStats={distributionStats}
        />
      </div>

      {/* 4. Interactive Score Chart (Personal Progress timeline only for students) */}
      <div className="animate-cascade-3">
        <InteractiveChart
          sessionChartData={sessionChartData}
          engine={engine}
          fittedLookup={fittedLookup}
          selectedStudentId={selectedStudentId ? String(selectedStudentId) : ''}
          selectedClassId={selectedClassId === 'all' ? '' : selectedClassId}
          timeView={timeView}
          setTimeView={setTimeView}
          timePhases={combinedTimePhases}
          selectedPhaseId={selectedPhaseId}
          setSelectedPhaseId={setSelectedPhaseId}
          onOpenPhaseModal={() => {}}
          chartViewMode={isStudent ? 'timeline' : chartViewMode}
          setChartViewMode={setChartViewMode}
          distributionStats={distributionStats}
          selectedGradeTypeFilter={selectedGradeTypeFilter}
          setSelectedGradeTypeFilter={setSelectedGradeTypeFilter}
          selectedScoreBin={selectedScoreBin}
          onSelectScoreBin={handleSelectScoreBin}
          hideDistributionToggle={isStudent}
        />
      </div>

      {/* 5. Summary Strip (Metrics Bar directly under Graph) */}
      <div className="animate-cascade-4">
        <SummaryStrip
          engine={engine}
          gradeTypesList={gradeTypesList}
          hasSelectedStudent={!!currentStudent}
          chartViewMode={isStudent ? 'timeline' : chartViewMode}
          distributionStats={distributionStats}
        />
      </div>

      {/* 6. Complete Session History TanStack DataTable */}
      <div className="animate-cascade-5">
        <ResultHistoryTable records={records} loading={loading} />
      </div>
    </div>
  );
};

export default ResultsPage;
