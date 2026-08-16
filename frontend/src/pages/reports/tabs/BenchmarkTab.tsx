import React from 'react';
import { HeadToHeadDuel } from '../components/HeadToHeadDuel';
import { ClassBenchmarkTable } from '../components/ClassBenchmarkTable';

interface BenchmarkTabProps {
  loading: boolean;
  classes: any[];
  studentRankings: any[];
  sessionRecords: any[];
  compareClassAId: string;
  setCompareClassAId: (id: string) => void;
  compareClassBId: string;
  setCompareClassBId: (id: string) => void;
  selectedClassId: string;
  analyticsSummary: any;
  classAnalyticsMap: Record<string, any>;
}

export const BenchmarkTab: React.FC<BenchmarkTabProps> = ({
  loading,
  classes,
  studentRankings,
  sessionRecords,
  compareClassAId,
  setCompareClassAId,
  compareClassBId,
  setCompareClassBId,
  selectedClassId,
  analyticsSummary,
  classAnalyticsMap,
}) => {
  return (
    <div className="space-y-6 mb-8">
      {/* 1. 2-CLASS HEAD-TO-HEAD COMPARISON DUEL */}
      <HeadToHeadDuel
        classes={classes}
        studentRankings={studentRankings}
        sessionRecords={sessionRecords}
        compareClassAId={compareClassAId}
        setCompareClassAId={setCompareClassAId}
        compareClassBId={compareClassBId}
        setCompareClassBId={setCompareClassBId}
        selectedClassId={selectedClassId}
        analyticsSummary={analyticsSummary}
        classAnalyticsMap={classAnalyticsMap}
      />

      {/* 2. CROSS-CLASS BENCHMARK OVERVIEW TABLE */}
      <ClassBenchmarkTable
        loading={loading}
        classes={classes}
        studentRankings={studentRankings}
        sessionRecords={sessionRecords}
        selectedClassId={selectedClassId}
        analyticsSummary={analyticsSummary}
        classAnalyticsMap={classAnalyticsMap}
      />
    </div>
  );
};
