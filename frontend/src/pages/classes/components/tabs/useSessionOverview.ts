import { useMemo, useState } from 'react';
import { AttendanceRecord } from '../../types';
import { trunc1Dec, format1Dec } from '../../../../utils';

export interface DiscrepancyStudent {
  student_id: number;
  student_name: string;
  homework: number;
  checkAvg: number;
  diff: number;
  rawDiff?: number;
  c1: number | null;
  c2: number | null;
}

export function useSessionOverview(attendanceRecords: AttendanceRecord[]) {
  const [thresholdMode, setThresholdMode] = useState<'standard' | 'classAvg' | 'custom'>('standard');
  const [divergenceMin, setDivergenceMin] = useState<number>(1.5);

  const [customC1, setCustomC1] = useState<string>('');
  const [customC2, setCustomC2] = useState<string>('');
  const [customHw, setCustomHw] = useState<string>('');

  // 1. Calculate class statistics
  const stats = useMemo(() => {
    let sumC1 = 0;
    let countC1 = 0;
    let sumC2 = 0;
    let countC2 = 0;
    let sumHw = 0;
    let countHw = 0;

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Vắng mặt') return;

      if (rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== '') {
        const val = Number(rec.check_1);
        if (!isNaN(val)) {
          sumC1 += val;
          countC1++;
        }
      }
      if (rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== '') {
        const val = Number(rec.check_2);
        if (!isNaN(val)) {
          sumC2 += val;
          countC2++;
        }
      }
      if (rec.homework !== null && rec.homework !== undefined && rec.homework !== '') {
        const val = Number(rec.homework);
        if (!isNaN(val)) {
          sumHw += val;
          countHw++;
        }
      }
    });

    const avgC1 = countC1 > 0 ? sumC1 / countC1 : 0;
    const avgC2 = countC2 > 0 ? sumC2 / countC2 : 0;
    const avgHw = countHw > 0 ? sumHw / countHw : 0;

    return { avgC1, avgC2, avgHw, countC1, countC2, countHw };
  }, [attendanceRecords]);

  const avgC1Trunc = trunc1Dec(stats.avgC1);
  const avgC2Trunc = trunc1Dec(stats.avgC2);
  const avgHwTrunc = trunc1Dec(stats.avgHw);

  // Computed effective thresholds
  const threshC1 = useMemo(() => {
    if (thresholdMode === 'standard') return 5.0;
    if (thresholdMode === 'classAvg') return avgC1Trunc;
    const n = parseFloat(customC1);
    return isNaN(n) ? 0 : n;
  }, [thresholdMode, avgC1Trunc, customC1]);

  const threshC2 = useMemo(() => {
    if (thresholdMode === 'standard') return 5.0;
    if (thresholdMode === 'classAvg') return avgC2Trunc;
    const n = parseFloat(customC2);
    return isNaN(n) ? 0 : n;
  }, [thresholdMode, avgC2Trunc, customC2]);

  const threshHw = useMemo(() => {
    if (thresholdMode === 'standard') return 5.0;
    if (thresholdMode === 'classAvg') return avgHwTrunc;
    const n = parseFloat(customHw);
    return isNaN(n) ? 0 : n;
  }, [thresholdMode, avgHwTrunc, customHw]);

  // Display strings for the inputs
  const threshC1Input =
    thresholdMode === 'custom'
      ? customC1
      : thresholdMode === 'classAvg'
      ? format1Dec(avgC1Trunc)
      : '5.0';

  const threshC2Input =
    thresholdMode === 'custom'
      ? customC2
      : thresholdMode === 'classAvg'
      ? format1Dec(avgC2Trunc)
      : '5.0';

  const threshHwInput =
    thresholdMode === 'custom'
      ? customHw
      : thresholdMode === 'classAvg'
      ? format1Dec(avgHwTrunc)
      : '5.0';

  const handleC1Change = (val: string) => {
    setCustomC1(val);
    if (thresholdMode !== 'custom') {
      setCustomC2(threshC2Input);
      setCustomHw(threshHwInput);
      setThresholdMode('custom');
    }
  };

  const handleC2Change = (val: string) => {
    setCustomC2(val);
    if (thresholdMode !== 'custom') {
      setCustomC1(threshC1Input);
      setCustomHw(threshHwInput);
      setThresholdMode('custom');
    }
  };

  const handleHwChange = (val: string) => {
    setCustomHw(val);
    if (thresholdMode !== 'custom') {
      setCustomC1(threshC1Input);
      setCustomC2(threshC2Input);
      setThresholdMode('custom');
    }
  };

  const handleApplyAllCustom = (val: string) => {
    setCustomC1(val);
    setCustomC2(val);
    setCustomHw(val);
    setThresholdMode('custom');
  };

  const handleSetStandard = () => {
    setThresholdMode('standard');
    setCustomC1('5.0');
    setCustomC2('5.0');
    setCustomHw('5.0');
  };

  const handleSetClassAvg = () => {
    setThresholdMode('classAvg');
    setCustomC1(format1Dec(avgC1Trunc));
    setCustomC2(format1Dec(avgC2Trunc));
    setCustomHw(format1Dec(avgHwTrunc));
  };

  const handleSetCustom = () => {
    if (thresholdMode !== 'custom') {
      setCustomC1(threshC1Input);
      setCustomC2(threshC2Input);
      setCustomHw(threshHwInput);
      setThresholdMode('custom');
    }
  };

  // 2. Identify students below threshold
  const belowAvgData = useMemo(() => {
    const belowC1: { student_id: number; student_name: string; score: number }[] = [];
    const belowC2: { student_id: number; student_name: string; score: number }[] = [];
    const belowHw: { student_id: number; student_name: string; score: number }[] = [];

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Vắng mặt') return;

      if (rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== '') {
        const val = Number(rec.check_1);
        if (!isNaN(val) && val < threshC1) {
          belowC1.push({ student_id: rec.student_id, student_name: rec.student_name, score: val });
        }
      }
      if (rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== '') {
        const val = Number(rec.check_2);
        if (!isNaN(val) && val < threshC2) {
          belowC2.push({ student_id: rec.student_id, student_name: rec.student_name, score: val });
        }
      }
      if (rec.homework !== null && rec.homework !== undefined && rec.homework !== '') {
        const val = Number(rec.homework);
        if (!isNaN(val) && val < threshHw) {
          belowHw.push({ student_id: rec.student_id, student_name: rec.student_name, score: val });
        }
      }
    });

    belowC1.sort((a, b) => a.score - b.score);
    belowC2.sort((a, b) => a.score - b.score);
    belowHw.sort((a, b) => a.score - b.score);

    return { belowC1, belowC2, belowHw, threshC1, threshC2, threshHw };
  }, [attendanceRecords, threshC1, threshC2, threshHw]);

  // 3. Identify students with large divergence:
  // (điểm về nhà - trung bình c1vs2 lấy giá trị dương và ko áp dụng với học sinh điểm về nhà 0:ko btvn)
  const divergenceStudents = useMemo<DiscrepancyStudent[]>(() => {
    const list: DiscrepancyStudent[] = [];

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Vắng mặt') return;

      if (rec.homework === null || rec.homework === undefined || rec.homework === '') return;
      const hwVal = Number(rec.homework);
      if (isNaN(hwVal) || hwVal <= 0) return; // Do not apply to homework = 0 or missing

      const c1Val =
        rec.check_1 !== null && rec.check_1 !== undefined && rec.check_1 !== ''
          ? Number(rec.check_1)
          : null;
      const c2Val =
        rec.check_2 !== null && rec.check_2 !== undefined && rec.check_2 !== ''
          ? Number(rec.check_2)
          : null;

      const validC1 = c1Val !== null && !isNaN(c1Val);
      const validC2 = c2Val !== null && !isNaN(c2Val);

      if (!validC1 && !validC2) return;

      let checkAvg = 0;
      if (validC1 && validC2) {
        checkAvg = (c1Val! + c2Val!) / 2;
      } else if (validC1) {
        checkAvg = c1Val!;
      } else {
        checkAvg = c2Val!;
      }

      const rawDiff = hwVal - checkAvg;
      const diff = Math.abs(rawDiff);
      if (diff >= divergenceMin) {
        list.push({
          student_id: rec.student_id,
          student_name: rec.student_name,
          homework: hwVal,
          checkAvg,
          diff,
          rawDiff,
          c1: validC1 ? c1Val : null,
          c2: validC2 ? c2Val : null,
        });
      }
    });

    list.sort((a, b) => b.diff - a.diff);
    return list;
  }, [attendanceRecords, divergenceMin]);

  const hasAlerts =
    belowAvgData.belowC1.length > 0 ||
    belowAvgData.belowC2.length > 0 ||
    belowAvgData.belowHw.length > 0 ||
    divergenceStudents.length > 0;

  return {
    stats,
    belowAvgData,
    divergenceStudents,
    hasAlerts,
    thresholdMode,
    setThresholdMode,
    divergenceMin,
    setDivergenceMin,
    threshC1Input,
    threshC2Input,
    threshHwInput,
    handleC1Change,
    handleC2Change,
    handleHwChange,
    handleApplyAllCustom,
    handleSetStandard,
    handleSetClassAvg,
    handleSetCustom,
  };
}
