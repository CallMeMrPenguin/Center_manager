import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CheckScoreInputProps {
  rec: any;
  rowIndex?: number;
  field: 'check_1' | 'check_2' | 'homework' | 'mock_test';
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
}

const SCORE_FIELDS: Array<'check_1' | 'check_2' | 'homework' | 'mock_test'> = [
  'check_1',
  'check_2',
  'homework',
  'mock_test',
];

export const CheckScoreInput: React.FC<CheckScoreInputProps> = React.memo(({
  rec,
  rowIndex = 0,
  field,
  onUpdateRecord,
  parseAndFormatScore,
}) => {
  const [val, setVal] = useState<string>(() => (rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : ''));
  const isFocusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Synchronize prop updates when not actively typing/focused
    if (!isFocusedRef.current) {
      const propVal = rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : '';
      setVal(propVal);
    }
  }, [rec[field]]);

  const commitValue = useCallback((rawVal: string) => {
    const formatted = parseAndFormatScore(rawVal);
    setVal(formatted);
    const currentProp = rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : '';
    if (formatted !== currentProp) {
      onUpdateRecord(rec.student_id, field, formatted);
    }
  }, [field, onUpdateRecord, parseAndFormatScore, rec]);

  const navigateToInput = (targetSelector: string) => {
    const targetInput = document.querySelector<HTMLInputElement>(targetSelector);
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentVal = e.currentTarget.value;
    const currentFieldIndex = SCORE_FIELDS.indexOf(field);

    // 1. Enter or ArrowDown -> Move down to same column in next row
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      commitValue(currentVal);
      const nextRow = rowIndex + 1;
      navigateToInput(`input[data-score-input="true"][data-score-field="${field}"][data-row-index="${nextRow}"]`);
      return;
    }

    // 2. ArrowUp -> Move up to same column in previous row
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitValue(currentVal);
      const prevRow = Math.max(0, rowIndex - 1);
      navigateToInput(`input[data-score-input="true"][data-score-field="${field}"][data-row-index="${prevRow}"]`);
      return;
    }

    // 3. Tab Navigation
    if (e.key === 'Tab') {
      // Commit value before standard or custom tab focus movement
      commitValue(currentVal);

      if (e.shiftKey) {
        // Shift + Tab -> Move to previous column, or last column of previous row
        e.preventDefault();
        if (currentFieldIndex > 0) {
          const prevField = SCORE_FIELDS[currentFieldIndex - 1];
          navigateToInput(`input[data-score-input="true"][data-score-field="${prevField}"][data-row-index="${rowIndex}"]`);
        } else if (rowIndex > 0) {
          const prevField = SCORE_FIELDS[SCORE_FIELDS.length - 1];
          navigateToInput(`input[data-score-input="true"][data-score-field="${prevField}"][data-row-index="${rowIndex - 1}"]`);
        }
      } else {
        // Tab -> Move to next column, or first column of next row
        e.preventDefault();
        if (currentFieldIndex < SCORE_FIELDS.length - 1) {
          const nextField = SCORE_FIELDS[currentFieldIndex + 1];
          navigateToInput(`input[data-score-input="true"][data-score-field="${nextField}"][data-row-index="${rowIndex}"]`);
        } else {
          const nextField = SCORE_FIELDS[0];
          navigateToInput(`input[data-score-input="true"][data-score-field="${nextField}"][data-row-index="${rowIndex + 1}"]`);
        }
      }
      return;
    }

    // 4. ArrowRight at end of selection/caret -> Move to next field in same row
    if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
        if (currentFieldIndex < SCORE_FIELDS.length - 1) {
          e.preventDefault();
          commitValue(currentVal);
          const nextField = SCORE_FIELDS[currentFieldIndex + 1];
          navigateToInput(`input[data-score-input="true"][data-score-field="${nextField}"][data-row-index="${rowIndex}"]`);
        }
      }
    }

    // 5. ArrowLeft at start of selection/caret -> Move to previous field in same row
    if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        if (currentFieldIndex > 0) {
          e.preventDefault();
          commitValue(currentVal);
          const prevField = SCORE_FIELDS[currentFieldIndex - 1];
          navigateToInput(`input[data-score-input="true"][data-score-field="${prevField}"][data-row-index="${rowIndex}"]`);
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center">
      <input
        ref={inputRef}
        type="text"
        data-score-input="true"
        data-student-id={rec.student_id}
        data-score-field={field}
        data-row-index={rowIndex}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={(e) => {
          isFocusedRef.current = true;
          e.currentTarget.select();
        }}
        onBlur={(e) => {
          isFocusedRef.current = false;
          commitValue(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="0-10"
        className="w-20 bg-[#161a29] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-extrabold text-xs focus:outline-none focus:border-[#5c36f5] focus:ring-2 focus:ring-[#5c36f5]/40 text-center transition selection:bg-[#5c36f5] selection:text-white"
      />
    </div>
  );
});

CheckScoreInput.displayName = 'CheckScoreInput';

