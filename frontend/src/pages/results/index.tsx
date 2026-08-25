import React from 'react';
import { useStudentResults } from './hooks/useStudentResults';
import { StudentProfileHeader } from './components/StudentProfileHeader';
import { ResultKpiCards } from './components/ResultKpiCards';
import { ResultScoreChart } from './components/ResultScoreChart';
import { ResultHistoryTable } from './components/ResultHistoryTable';

export const ResultsPage: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    classes,
    selectedClassId,
    setSelectedClassId,
    loading,
    records,
    summary,
    refresh,
  } = useStudentResults();

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-[#080b14] text-slate-100 select-none font-sans scrollbar-thin">
      {/* 1. Header & Student Filter Bar */}
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
      />

      {/* 2. Key Performance Indicators (4 KPI Cards) */}
      <ResultKpiCards summary={summary} />

      {/* 3. Visual Score Trend Chart Across Sessions */}
      <ResultScoreChart records={records} />

      {/* 4. Complete Session History TanStack DataTable */}
      <ResultHistoryTable records={records} loading={loading} />
    </div>
  );
};

export default ResultsPage;
