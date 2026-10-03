import { AttendanceRecord } from '../types';

export function parseAndFormatScore(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  let valStr = String(val).trim().replace(',', '.');
  if (!valStr) return '';
  if (isNaN(Number(valStr))) return '';

  let numVal = parseFloat(valStr);
  if (numVal < 0) return '';
  if (numVal > 10) {
    if (valStr.startsWith('10')) {
      numVal = 10;
    } else {
      const digits = valStr.replace('.', '').replace('-', '');
      if (digits.length >= 2) {
        numVal = parseFloat(`${digits[0]}.${digits[1]}`);
      } else if (digits.length === 1) {
        numVal = parseFloat(digits[0]);
      } else {
        return '';
      }
    }
  }
  if (numVal > 10) numVal = 10;
  // 1-decimal truncation per Rule 17
  const truncated = Math.floor(numVal * 10 + 0.0000001) / 10;
  return truncated % 1 === 0 ? String(truncated.toFixed(0)) : truncated.toFixed(1);
}

export function applyAutoAttendanceStatus(records: AttendanceRecord[]): { records: AttendanceRecord[] } {
  const newRecords = records.map((rec) => {
    const isAbsent = rec.status === 'Vắng mặt' || rec.status === 'Nghỉ học';

    const formatScoreField = (val: any) => {
      if (isAbsent) {
        return val !== null && val !== undefined && val !== '' ? String(val) : null;
      }
      // Missing / empty score should remain null, never default to '0' per Rule 8
      if (val === null || val === undefined || val === '') return null;
      return String(val);
    };

    const status = rec.status || 'Có mặt';
    return {
      ...rec,
      status,
      check_1: formatScoreField(rec.check_1),
      check_2: formatScoreField(rec.check_2),
      homework: formatScoreField(rec.homework),
      homework_2: formatScoreField(rec.homework_2),
      mock_test: formatScoreField(rec.mock_test),
    };
  });
  return { records: newRecords };
}
