import React, { useState, useMemo } from 'react';
import { StudentProfileHeader } from '../components/StudentProfileHeader';
import { KPICards } from '../components/KPICards';
import { InteractiveChart } from '../components/InteractiveChart';
import { SummaryStrip } from '../components/SummaryStrip';
import { StudentRankingsTable } from '../components/StudentRankingsTable';
import { StudentGradeHistoryTable } from '../components/StudentGradeHistoryTable';
import { formatSessionDate, getStandardMoetPhases } from '../utils';
import { getStudentTier } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';

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
  isTestMode?: boolean;
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
  isTestMode,
}) => {
  const [timeView, setTimeView] = useState<'1m' | '2m' | '3m' | 'all'>('all');

  // Combined Standard MOET phases + Database Custom User Phases
  const combinedTimePhases = useMemo(() => {
    const defaultMoet = getStandardMoetPhases(selectedAcademicYear);
    const dbPhases = timePhases || [];

    const merged = defaultMoet.map(m => {
      const dbMatch = dbPhases.find(p => p.phase_name === m.phase_name);
      if (dbMatch) {
        return {
          ...m,
          db_id: dbMatch.id,
          from_date: dbMatch.from_date || m.from_date,
          to_date: dbMatch.to_date || m.to_date,
        };
      }
      return m;
    });

    dbPhases.forEach(dbp => {
      if (!defaultMoet.some(m => m.phase_name === dbp.phase_name)) {
        merged.push({
          id: String(dbp.id),
          db_id: dbp.id,
          phase_name: dbp.phase_name,
          from_date: dbp.from_date,
          to_date: dbp.to_date,
          is_standard: false,
        });
      }
    });

    return merged;
  }, [selectedAcademicYear, timePhases]);

  // Filter session records according to academic year and active phase
  const activeSessionRecords = useMemo(() => {
    if (!sessionRecords || sessionRecords.length === 0) return [];

    let filtered = sessionRecords;
    if (selectedPhaseId) {
      const activePhase = combinedTimePhases.find(p => String(p.id) === selectedPhaseId);
      if (activePhase && activePhase.from_date && activePhase.to_date) {
        filtered = filtered.filter(r => r.date && r.date >= activePhase.from_date && r.date <= activePhase.to_date);
      }
    } else if (selectedAcademicYear) {
      const startYear = parseInt(selectedAcademicYear.split('-')[0], 10) || 2026;
      const academicStart = `${startYear}-06-01`;
      const academicEnd = `${startYear + 1}-05-31`;
      filtered = filtered.filter(r => r.date && r.date >= academicStart && r.date <= academicEnd);
    }
    return filtered;
  }, [sessionRecords, selectedPhaseId, selectedAcademicYear, combinedTimePhases]);

  // Overall stats calculations on active session records
  const stats = useMemo(() => {
    const records = activeSessionRecords.length > 0 ? activeSessionRecords : sessionRecords;
    if (!records || records.length === 0) {
      return {
        c1: '-', c2: '-', hw: '-', overall: '-',
        attendancePct: 100, sessionCount: 0,
        c1Diff: '+0.0', c2Diff: '+0.0', hwDiff: '+0.0', overallDiff: '+0.0',
        rank: '#1', level: 'Chưa Có Điểm'
      };
    }

    let sum1 = 0, count1 = 0;
    let sum2 = 0, count2 = 0;
    let sumHw = 0, countHw = 0;
    let sumMock = 0, countMock = 0;
    let presentCount = 0;

    records.forEach(r => {
      if (r.status === 'Có mặt') presentCount++;
      const val1 = Number(r.check_1);
      const val2 = Number(r.check_2);
      const valHw = Number(r.homework);
      const valMock = Number((r as any).mock_test);
      if (val1 > 0) { sum1 += val1; count1++; }
      if (val2 > 0) { sum2 += val2; count2++; }
      if (valHw > 0) { sumHw += valHw; countHw++; }
      if (valMock > 0) { sumMock += valMock; countMock++; }
    });

    const c1 = count1 > 0 ? (sum1 / count1) : 0;
    const c2 = count2 > 0 ? (sum2 / count2) : 0;
    const hw = countHw > 0 ? (sumHw / countHw) : 0;
    const mockTest = countMock > 0 ? (sumMock / countMock) : 0;
    const validCols = [c1, c2, hw, mockTest].filter(v => v > 0);
    const overall = validCols.length > 0 ? validCols.reduce((a, b) => a + b, 0) / validCols.length : 0;
    const attPct = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100;

    let rankStr = '#1';
    if (selectedStudentId && filteredRankings.length > 0) {
      const idx = filteredRankings.findIndex(r => String(r.student_id) === selectedStudentId);
      if (idx >= 0) rankStr = `#${idx + 1}`;
    }

    return {
      c1: c1 > 0 ? format1Dec(c1) : '-',
      c2: c2 > 0 ? format1Dec(c2) : '-',
      hw: hw > 0 ? format1Dec(hw) : '-',
      mockTest: mockTest > 0 ? format1Dec(mockTest) : '-',
      overall: overall > 0 ? format1Dec(overall) : '-',
      attendancePct: attPct,
      sessionCount: records.length,
      c1Diff: '+0.0',
      c2Diff: '+0.0',
      hwDiff: '+0.0',
      mockTestDiff: '+0.0',
      overallDiff: '+0.0',
      rank: rankStr,
      level: overall > 0 ? getStudentTier(overall).title : 'Chưa Có Điểm'
    };
  }, [activeSessionRecords, sessionRecords, selectedStudentId, filteredRankings]);

  // Session chart data calculation
  const sessionChartData = useMemo(() => {
    const defaultData = [
      { sessionName: '06/07', fullDate: '2026-07-06', check1: 6.8, check2: 5.8, homework: 8.0, overall: 6.9 },
      { sessionName: '12/07', fullDate: '2026-07-12', check1: 7.8, check2: 6.2, homework: 8.8, overall: 7.6 },
      { sessionName: '18/07', fullDate: '2026-07-18', check1: 8.1, check2: 7.0, homework: 9.1, overall: 8.1 },
      { sessionName: '24/07', fullDate: '2026-07-24', check1: 8.7, check2: 7.2, homework: 9.4, overall: 8.4 },
    ];

    const recordsToChart = activeSessionRecords.length > 0 ? activeSessionRecords : sessionRecords;
    if (!recordsToChart || recordsToChart.length === 0) return defaultData;

    const dateMap: Record<string, { check1: number[]; check2: number[]; hw: number[] }> = {};
    recordsToChart.forEach(r => {
      const d = r.date || 'Session';
      if (!dateMap[d]) dateMap[d] = { check1: [], check2: [], hw: [] };
      if (Number(r.check_1) > 0) dateMap[d].check1.push(Number(r.check_1));
      if (Number(r.check_2) > 0) dateMap[d].check2.push(Number(r.check_2));
      if (Number(r.homework) > 0) dateMap[d].hw.push(Number(r.homework));
    });

    const dates = Object.keys(dateMap)
      .filter(d => {
        const item = dateMap[d];
        return item.check1.length > 0 || item.check2.length > 0 || item.hw.length > 0;
      })
      .sort();

    let selectedDates = dates;
    if (!selectedPhaseId) {
      let limit = dates.length;
      if (timeView === '1m') limit = Math.min(4, dates.length);
      if (timeView === '2m') limit = Math.min(8, dates.length);
      if (timeView === '3m') limit = Math.min(12, dates.length);
      selectedDates = dates.slice(-limit);
    }

    const weightsMap: Record<string, number> = {};
    let wTot = 0;
    gradeTypesList.forEach(gt => {
      const frac = (Number(gt.weight) || 0) / 100;
      weightsMap[gt.id] = frac;
      wTot += frac;
    });
    if (wTot <= 0) wTot = 1;

    const w1 = weightsMap['check_1'] ?? 0.35;
    const w2 = weightsMap['check_2'] ?? 0.55;
    const whw = weightsMap['homework'] ?? 0.10;

    const result = selectedDates.map((d) => {
      const item = dateMap[d];
      const validScores = [...item.check1, ...item.check2, ...item.hw];
      const sessionFallback = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 8.0;

      const avg1 = item.check1.length > 0 ? item.check1.reduce((a, b) => a + b, 0) / item.check1.length : sessionFallback;
      const avg2 = item.check2.length > 0 ? item.check2.reduce((a, b) => a + b, 0) / item.check2.length : sessionFallback;
      const avghw = item.hw.length > 0 ? item.hw.reduce((a, b) => a + b, 0) / item.hw.length : sessionFallback;
      const avgOverall = ((avg1 * w1) + (avg2 * w2) + (avghw * whw)) / wTot;

      return {
        sessionName: formatSessionDate(d),
        fullDate: d,
        check1: trunc1Dec(avg1),
        check2: trunc1Dec(avg2),
        homework: trunc1Dec(avghw),
        overall: trunc1Dec(avgOverall)
      };
    });

    return result.length > 0 ? result : defaultData;
  }, [activeSessionRecords, sessionRecords, timeView, gradeTypesList, selectedPhaseId]);

  // Fitted values computed client-side
  const fittedLookup = useMemo(() => {
    const alpha = 0.5;
    const computeEMA = (values: number[]): number[] => {
      if (values.length === 0) return [];
      const result: number[] = [];
      let ema = values[0];
      for (const v of values) {
        ema = alpha * v + (1 - alpha) * ema;
        result.push(trunc1Dec(Math.min(10, Math.max(0, ema))));
      }
      return result;
    };
    return {
      c1: computeEMA(sessionChartData.map(d => d.check1)),
      c2: computeEMA(sessionChartData.map(d => d.check2)),
      hw: computeEMA(sessionChartData.map(d => d.homework)),
    };
  }, [sessionChartData]);

  return (
    <div className="space-y-6">
      {/* 1. INDIVIDUAL STUDENT PROFILE */}
      {selectedStudentObj && (
        <StudentProfileHeader
          student={selectedStudentObj}
          stats={stats}
          onClearStudent={() => setSelectedStudentId('')}
          isTestMode={isTestMode}
        />
      )}

      {/* 2. FOUR/FIVE GLOWING KPI CARDS */}
      <KPICards
        stats={stats}
        engine={engine}
        hasSelectedStudent={!!selectedStudentObj}
        isTestMode={isTestMode}
      />

      {/* 3. INTERACTIVE CHART */}
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
        isTestMode={isTestMode}
      />

      {/* 4. SUMMARY STRIP (NOW WITH PI INDEX & DETAILED TOOLTIP) */}
      <SummaryStrip
        engine={engine}
        gradeTypesList={gradeTypesList}
        hasSelectedStudent={!!selectedStudentObj}
      />

      {/* 5. STUDENT RANKINGS TABLE */}
      <StudentRankingsTable
        loading={loading}
        classes={classes}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        studentRankings={studentRankings}
        filteredRankings={filteredRankings}
        studentSessionsMap={studentSessionsMap}
        onSelectRankingStudent={onSelectRankingStudent}
        hasSelectedStudent={!!selectedStudentObj}
        isTestMode={isTestMode}
      />

      {/* 6. STUDENT GRADE HISTORY TABLE */}
      <StudentGradeHistoryTable
        loading={loading}
        sessionRecords={activeSessionRecords.length > 0 ? activeSessionRecords : sessionRecords}
        selectedStudentObj={selectedStudentObj}
        stats={stats}
        onOpenEditModal={onOpenEditModal}
        hasSelectedStudent={!!selectedStudentObj}
        isTestMode={isTestMode}
      />
    </div>
  );
};
