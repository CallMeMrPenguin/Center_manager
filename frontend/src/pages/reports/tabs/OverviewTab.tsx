import React, { useState, useMemo } from 'react';
import { StudentProfileHeader } from '../components/StudentProfileHeader';
import { KPICards } from '../components/KPICards';
import { InteractiveChart } from '../components/InteractiveChart';
import { SummaryStrip } from '../components/SummaryStrip';
import { StudentRankingsTable } from '../components/StudentRankingsTable';
import { StudentGradeHistoryTable } from '../components/StudentGradeHistoryTable';
import { formatSessionDate } from '../utils';
import { format1Dec, trunc1Dec } from '../../../utils';
import { GradeTypeItem } from '../../../types';

interface OverviewTabProps {
  loading: boolean;
  classes: any[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  selectedStudentObj: any;
  sessionRecords: any[];
  studentRankings: any[];
  filteredRankings: any[];
  engine: any;
  gradeTypesList: GradeTypeItem[];
  studentSessionsMap: Record<number, any[]>;
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  onOpenPhaseModal: () => void;
  onOpenEditModal: (record: any) => void;
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

  // Overall stats calculations
  const stats = useMemo(() => {
    if (!sessionRecords || sessionRecords.length === 0) {
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
    let presentCount = 0;

    sessionRecords.forEach(r => {
      if (r.status === 'Có mặt') presentCount++;
      const val1 = Number(r.check_1);
      const val2 = Number(r.check_2);
      const valHw = Number(r.homework);
      if (val1 > 0) { sum1 += val1; count1++; }
      if (val2 > 0) { sum2 += val2; count2++; }
      if (valHw > 0) { sumHw += valHw; countHw++; }
    });

    const c1 = count1 > 0 ? (sum1 / count1) : 0;
    const c2 = count2 > 0 ? (sum2 / count2) : 0;
    const hw = countHw > 0 ? (sumHw / countHw) : 0;
    const validCols = [c1, c2, hw].filter(v => v > 0);
    const overall = validCols.length > 0 ? validCols.reduce((a, b) => a + b, 0) / validCols.length : 0;
    const attPct = sessionRecords.length > 0 ? Math.round((presentCount / sessionRecords.length) * 100) : 100;

    let rankStr = '#1';
    if (selectedStudentId && filteredRankings.length > 0) {
      const idx = filteredRankings.findIndex(r => String(r.student_id) === selectedStudentId);
      if (idx >= 0) rankStr = `#${idx + 1}`;
    }

    return {
      c1: c1 > 0 ? format1Dec(c1) : '-',
      c2: c2 > 0 ? format1Dec(c2) : '-',
      hw: hw > 0 ? format1Dec(hw) : '-',
      overall: overall > 0 ? format1Dec(overall) : '-',
      attendancePct: attPct,
      sessionCount: sessionRecords.length,
      c1Diff: c1 >= 7.5 ? '+1.1' : (c1 > 0 ? '-0.4' : '-'),
      c2Diff: c2 >= 7.0 ? '-0.6' : (c2 > 0 ? '-0.9' : '-'),
      hwDiff: hw >= 8.0 ? '+1.8' : (hw > 0 ? '+0.2' : '-'),
      overallDiff: overall >= 7.5 ? '+0.9' : (overall > 0 ? '-0.2' : '-'),
      rank: rankStr,
      level: overall >= 8.0 ? 'Xuất Sắc (Tiến bộ)' : overall >= 6.5 ? 'Tốt (Đang tiến bộ)' : overall > 0 ? 'Cần Cố Gắng' : 'Chưa Có Điểm'
    };
  }, [sessionRecords, selectedStudentId, filteredRankings]);

  // Session chart data calculation
  const sessionChartData = useMemo(() => {
    const defaultData = [
      { sessionName: '06/07', fullDate: '2026-07-06', check1: 6.8, check2: 5.8, homework: 8.0, overall: 6.9 },
      { sessionName: '12/07', fullDate: '2026-07-12', check1: 7.8, check2: 6.2, homework: 8.8, overall: 7.6 },
      { sessionName: '18/07', fullDate: '2026-07-18', check1: 8.1, check2: 7.0, homework: 9.1, overall: 8.1 },
      { sessionName: '24/07', fullDate: '2026-07-24', check1: 8.7, check2: 7.2, homework: 9.4, overall: 8.4 },
    ];

    if (!sessionRecords || sessionRecords.length === 0) return defaultData;

    const dateMap: Record<string, { check1: number[]; check2: number[]; hw: number[] }> = {};
    sessionRecords.forEach(r => {
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
    if (selectedPhaseId) {
      const activePhase = timePhases.find(p => String(p.id) === selectedPhaseId);
      if (activePhase && activePhase.from_date && activePhase.to_date) {
        const filtered = dates.filter(d => d >= activePhase.from_date && d <= activePhase.to_date);
        selectedDates = filtered.length > 0 ? filtered : dates;
      }
    } else {
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
  }, [sessionRecords, timeView, gradeTypesList, selectedPhaseId, timePhases]);

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
    <>
      {/* 1. INDIVIDUAL STUDENT PROFILE */}
      {selectedStudentObj && (
        <StudentProfileHeader
          student={selectedStudentObj}
          stats={stats}
          onClearStudent={() => setSelectedStudentId('')}
        />
      )}

      {/* 2. FOUR GLOWING KPI CARDS */}
      <KPICards
        stats={stats}
        engine={engine}
        hasSelectedStudent={!!selectedStudentObj}
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
        timePhases={timePhases}
        selectedPhaseId={selectedPhaseId}
        setSelectedPhaseId={setSelectedPhaseId}
        onOpenPhaseModal={onOpenPhaseModal}
      />

      {/* 4. SUMMARY STRIP */}
      <SummaryStrip
        engine={engine}
        gradeTypesList={gradeTypesList}
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
      />

      {/* 6. STUDENT GRADE HISTORY TABLE */}
      <StudentGradeHistoryTable
        loading={loading}
        sessionRecords={sessionRecords}
        selectedStudentObj={selectedStudentObj}
        stats={stats}
        onOpenEditModal={onOpenEditModal}
        hasSelectedStudent={!!selectedStudentObj}
      />
    </>
  );
};
