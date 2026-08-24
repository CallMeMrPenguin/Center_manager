import { useMemo } from 'react';
import { formatSessionDate, getStandardMoetPhases, computeStudentOverallScore } from '../utils';
import { computeDistributionStats, GradeTypeFilterKey, DistributionScoreBin } from '../utils/distributionAnalytics';
import { getStudentTier } from '../types';
import { format1Dec, trunc1Dec } from '../../../utils';

interface UseOverviewStatsParams {
  classes: any[];
  selectedClassId: string;
  selectedStudentId: string;
  selectedAcademicYear: string;
  sessionRecords: any[];
  studentRankings: any[];
  filteredRankings: any[];
  gradeTypesList: any[];
  timePhases: any[];
  selectedPhaseId: string;
  timeView: '1m' | '2m' | '3m' | 'all';
  selectedGradeTypeFilter: GradeTypeFilterKey;
  selectedScoreBin: DistributionScoreBin | null;
}

export const useOverviewStats = ({
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
}: UseOverviewStatsParams) => {
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
        c1: '-', c2: '-', hw: '-', mockTest: '-', overall: '-',
        attendancePct: 100, sessionCount: 0,
        c1Diff: '+0.0', c2Diff: '+0.0', hwDiff: '+0.0', mockTestDiff: '+0.0', overallDiff: '+0.0',
        rank: '#1', level: 'Chưa Có Điểm'
      };
    }

    let sum1 = 0, count1 = 0; // Vocabulary
    let sum2 = 0, count2 = 0; // Grammar
    let sumHw = 0, countHw = 0;
    let sumMock = 0, countMock = 0;
    let presentCount = 0;

    records.forEach(r => {
      if (r.status === 'Có mặt' || r.attendance === 'present') presentCount++;
      const val1 = Number(r.check_1);
      const val2 = Number(r.check_2);
      const valHw = Number(r.homework);
      const valMock = Number((r as any).mock_test);
      const c1Skill = String(r.check_1_skill || 'vocab').toLowerCase().trim();
      const c2Skill = String(r.check_2_skill || 'grammar').toLowerCase().trim();

      if (val1 > 0) {
        if (c1Skill === 'grammar' || c1Skill === 'ngữ pháp') { sum2 += val1; count2++; }
        else { sum1 += val1; count1++; }
      }
      if (val2 > 0) {
        if (c2Skill === 'vocab' || c2Skill === 'từ vựng') { sum1 += val2; count1++; }
        else { sum2 += val2; count2++; }
      }
      if (valHw > 0) { sumHw += valHw; countHw++; }
      if (valMock > 0) { sumMock += valMock; countMock++; }
    });

    const c1 = count1 > 0 ? (sum1 / count1) : 0;
    const c2 = count2 > 0 ? (sum2 / count2) : 0;
    const hw = countHw > 0 ? (sumHw / countHw) : 0;
    const mockTest = countMock > 0 ? (sumMock / countMock) : 0;

    let overall = 0;
    let totW = 0;
    if (c1 > 0) { overall += c1 * 0.55; totW += 0.55; }
    if (c2 > 0) { overall += c2 * 0.35; totW += 0.35; }
    if (hw > 0) { overall += hw * 0.10; totW += 0.10; }
    if (mockTest > 0) { overall += mockTest * 0.15; totW += 0.15; }
    if (totW > 0) overall = trunc1Dec(overall / totW);

    const attPct = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100;

    let rankStr = '#1';
    if (selectedStudentId && filteredRankings.length > 0) {
      const sorted = [...filteredRankings].sort((a, b) => {
        const scA = computeStudentOverallScore(a);
        const scB = computeStudentOverallScore(b);
        if (scB !== scA) return scB - scA;
        return (b.present_count || 0) - (a.present_count || 0);
      });
      const idx = sorted.findIndex(r => String(r.student_id || r.id) === String(selectedStudentId));
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
    const recordsToChart = activeSessionRecords.length > 0 ? activeSessionRecords : sessionRecords;
    if (!recordsToChart || recordsToChart.length === 0) return [];

    const dateMap: Record<string, { check1: number[]; check2: number[]; hw: number[] }> = {};
    recordsToChart.forEach(r => {
      const d = r.date || 'Session';
      if (!dateMap[d]) dateMap[d] = { check1: [], check2: [], hw: [] };
      const val1 = Number(r.check_1);
      const val2 = Number(r.check_2);
      const valHw = Number(r.homework);
      const c1Skill = String(r.check_1_skill || 'vocab').toLowerCase().trim();
      const c2Skill = String(r.check_2_skill || 'grammar').toLowerCase().trim();

      if (val1 > 0) {
        if (c1Skill === 'grammar' || c1Skill === 'ngữ pháp') dateMap[d].check2.push(val1);
        else dateMap[d].check1.push(val1);
      }
      if (val2 > 0) {
        if (c2Skill === 'vocab' || c2Skill === 'từ vựng') dateMap[d].check1.push(val2);
        else dateMap[d].check2.push(val2);
      }
      if (valHw > 0) dateMap[d].hw.push(valHw);
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

    const w1 = weightsMap['check_1'] ?? 0.55;
    const w2 = weightsMap['check_2'] ?? 0.35;
    const whw = weightsMap['homework'] ?? 0.10;

    const result = selectedDates.map((d) => {
      const item = dateMap[d];
      const avg1 = item.check1.length > 0 ? item.check1.reduce((a, b) => a + b, 0) / item.check1.length : 0;
      const avg2 = item.check2.length > 0 ? item.check2.reduce((a, b) => a + b, 0) / item.check2.length : 0;
      const avghw = item.hw.length > 0 ? item.hw.reduce((a, b) => a + b, 0) / item.hw.length : 0;

      let wSum = 0;
      let wActive = 0;
      if (item.check1.length > 0) { wSum += avg1 * w1; wActive += w1; }
      if (item.check2.length > 0) { wSum += avg2 * w2; wActive += w2; }
      if (item.hw.length > 0) { wSum += avghw * whw; wActive += whw; }
      const avgOverall = wActive > 0 ? wSum / wActive : 0;

      return {
        sessionName: formatSessionDate(d),
        fullDate: d,
        check1: item.check1.length > 0 ? trunc1Dec(avg1) : 0,
        check2: item.check2.length > 0 ? trunc1Dec(avg2) : 0,
        homework: item.hw.length > 0 ? trunc1Dec(avghw) : 0,
        overall: trunc1Dec(avgOverall)
      };
    });

    return result;
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

  const selectedClassObj = useMemo(() => {
    return classes.find(c => String(c.id) === selectedClassId);
  }, [classes, selectedClassId]);

  // Standard distribution stats computed client-side
  const distributionStats = useMemo(() => {
    const recs = activeSessionRecords.length > 0 ? activeSessionRecords : sessionRecords;
    const ranks = filteredRankings.length > 0 ? filteredRankings : studentRankings;
    const clsName = selectedClassObj ? selectedClassObj.class_name : undefined;
    return computeDistributionStats(recs, ranks, selectedStudentId, clsName, selectedGradeTypeFilter);
  }, [activeSessionRecords, sessionRecords, filteredRankings, studentRankings, selectedStudentId, selectedClassObj, selectedGradeTypeFilter]);

  // Rankings filtered by selected score bin
  const displayedRankings = useMemo(() => {
    if (!selectedScoreBin) return filteredRankings;
    if (selectedScoreBin.studentIds && selectedScoreBin.studentIds.length > 0) {
      const idSet = new Set(selectedScoreBin.studentIds.map(id => String(id)));
      return filteredRankings.filter(r => idSet.has(String(r.student_id || r.id)));
    }
    return filteredRankings.filter(r => {
      let sc: number = 0;
      if (selectedGradeTypeFilter === 'check_1') sc = Number(r.avg_vocab ?? r.avg_check_1 ?? 0);
      else if (selectedGradeTypeFilter === 'check_2') sc = Number(r.avg_grammar ?? r.avg_check_2 ?? 0);
      else if (selectedGradeTypeFilter === 'homework') sc = Number(r.avg_homework || 0);
      else if (selectedGradeTypeFilter === 'mock_test') sc = Number(r.avg_mock_test || r.mock_test || r.avg_grammar || r.avg_check_2 || 0);
      else {
        sc = Number(r.overallAvg) || Number(r.ema_level) || (Number(r.avg_vocab ?? r.avg_check_1 ?? 0) * 0.55 + Number(r.avg_grammar ?? r.avg_check_2 ?? 0) * 0.35 + Number(r.avg_homework || 0) * 0.1);
      }
      return sc >= selectedScoreBin.minScore && (selectedScoreBin.maxScore === 10 ? sc <= 10 : sc < selectedScoreBin.maxScore);
    });
  }, [filteredRankings, selectedScoreBin, selectedGradeTypeFilter]);

  return {
    combinedTimePhases,
    activeSessionRecords,
    stats,
    sessionChartData,
    fittedLookup,
    selectedClassObj,
    distributionStats,
    displayedRankings,
  };
};
