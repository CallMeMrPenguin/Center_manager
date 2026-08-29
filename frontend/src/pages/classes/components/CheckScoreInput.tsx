import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format1Dec } from '../../../utils';

interface CheckScoreInputProps {
  rec: any;
  rowIndex?: number;
  field: 'check_1' | 'check_2' | 'homework' | 'mock_test';
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
}

const SCORE_FIELDS = ['check_1', 'check_2', 'homework', 'mock_test'] as const;

const focusTarget = (target: HTMLInputElement | null | undefined) => {
  if (!target) return;
  target.focus();
  if (target.value && target.value.trim().length > 0) {
    target.select();
  } else {
    target.setSelectionRange(0, 0);
  }
};

const navigateScoreInputs = (currentInput: HTMLInputElement, isShift: boolean) => {
  const allScoreInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[data-score-input="true"]:not([disabled])')
  );
  if (allScoreInputs.length === 0) return;

  const currentIndex = allScoreInputs.indexOf(currentInput);
  if (currentIndex === -1) {
    focusTarget(allScoreInputs[0]);
    return;
  }

  let nextIndex: number;
  if (isShift) {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : allScoreInputs.length - 1;
  } else {
    nextIndex = currentIndex < allScoreInputs.length - 1 ? currentIndex + 1 : 0;
  }

  focusTarget(allScoreInputs[nextIndex]);
};

const navigateVerticalScoreInputs = (currentInput: HTMLInputElement, field: string, delta: number) => {
  const columnInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[data-score-input="true"][data-score-field="${field}"]:not([disabled])`)
  );
  if (columnInputs.length === 0) return;

  const currentIndex = columnInputs.indexOf(currentInput);
  if (currentIndex === -1) {
    focusTarget(columnInputs[0]);
    return;
  }

  let targetIndex: number;
  if (delta > 0) {
    targetIndex = currentIndex < columnInputs.length - 1 ? currentIndex + 1 : 0;
  } else {
    targetIndex = currentIndex > 0 ? currentIndex - 1 : columnInputs.length - 1;
  }

  focusTarget(columnInputs[targetIndex]);
};

export const CheckScoreInput: React.FC<CheckScoreInputProps> = React.memo(({
  rec,
  rowIndex = 0,
  field,
  onUpdateRecord,
  parseAndFormatScore,
}) => {
  const initialPropVal = rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : '';
  const [val, setVal] = useState<string>(initialPropVal);
  const isFocusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastCommittedRef = useRef<string>(initialPropVal);

  useEffect(() => {
    const propVal = rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : '';
    if (!isFocusedRef.current) {
      setVal(propVal);
      lastCommittedRef.current = propVal;
    }
  }, [rec[field]]);

  const commitValue = useCallback((rawVal: string) => {
    const formatted = parseAndFormatScore(rawVal);
    setVal(formatted);
    const currentProp = rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : '';
    if (formatted !== currentProp || formatted !== lastCommittedRef.current) {
      lastCommittedRef.current = formatted;
      onUpdateRecord(rec.student_id, field, formatted);
    }
  }, [field, onUpdateRecord, parseAndFormatScore, rec]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Enter or ArrowDown -> Move down to same score column of next student
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      commitValue(e.currentTarget.value);
      navigateVerticalScoreInputs(e.currentTarget, field, 1);
      return;
    }

    // 2. ArrowUp -> Move up to same score column of previous student
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitValue(e.currentTarget.value);
      navigateVerticalScoreInputs(e.currentTarget, field, -1);
      return;
    }

    // 3. Tab Navigation -> Smoothly cycle ONLY between all score inputs
    if (e.key === 'Tab') {
      e.preventDefault();
      commitValue(e.currentTarget.value);
      navigateScoreInputs(e.currentTarget, e.shiftKey);
      return;
    }

    // 4. ArrowRight at end of selection/caret or empty -> Move to next input
    if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      const isAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (isAtEnd || isAllSelected || input.value === '') {
        e.preventDefault();
        commitValue(input.value);
        navigateScoreInputs(input, false);
      }
      return;
    }

    // 5. ArrowLeft at start of selection/caret or empty -> Move to previous input
    if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (isAtStart || isAllSelected || input.value === '') {
        e.preventDefault();
        commitValue(input.value);
        navigateScoreInputs(input, true);
      }
      return;
    }
  };

  // Resolve corresponding predicted score for this cell
  let rawPred: any = null;
  if (field === 'check_1') {
    rawPred = rec.pred_check_1 ?? rec.pred_c1;
  } else if (field === 'check_2') {
    rawPred = rec.pred_check_2 ?? rec.pred_c2;
  } else if (field === 'homework') {
    rawPred = rec.pred_homework ?? rec.pred_hw;
  } else if (field === 'mock_test') {
    rawPred = rec.pred_mock_test ?? rec.pred_mt;
  }

  const hasPred =
    rawPred !== null &&
    rawPred !== undefined &&
    rawPred !== '' &&
    !isNaN(Number(rawPred)) &&
    Number(rawPred) > 0;
  const formattedPred = hasPred ? format1Dec(rawPred) : null;

  return (
    <div className="flex flex-col items-center justify-center py-1">
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
          if (e.currentTarget.value && e.currentTarget.value.trim().length > 0) {
            e.currentTarget.select();
          } else {
            e.currentTarget.setSelectionRange(0, 0);
          }
        }}
        onBlur={(e) => {
          isFocusedRef.current = false;
          commitValue(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="0-10"
        className="w-20 bg-[#161a29] border border-white/10 rounded-lg px-2 py-1 text-white font-extrabold text-xs focus:outline-none focus:border-[#5c36f5] focus:ring-2 focus:ring-[#5c36f5]/40 text-center transition selection:bg-[#5c36f5] selection:text-white caret-white"
      />

      {/* Prediction indicator below input */}
      <div className="mt-1 h-4 flex items-center justify-center">
        {formattedPred && hasPred ? (() => {
          const num = Number(rawPred);
          const theme =
            num >= 8.0
              ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25'
              : num >= 6.5
              ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30 hover:bg-cyan-500/25'
              : num >= 5.0
              ? 'text-amber-300 bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25'
              : 'text-rose-300 bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25';

          return (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setVal(formattedPred);
                commitValue(formattedPred);
              }}
              title={`Điểm dự đoán: ${formattedPred} (Nhấn để áp dụng)`}
              className={`px-1.5 py-0.2 rounded border font-mono font-black text-[11px] transition cursor-pointer active:scale-95 select-none ${theme}`}
            >
              {formattedPred}
            </button>
          );
        })() : (
          <span className="text-[10px] text-slate-600 font-mono select-none" title="Chưa có dữ liệu dự đoán">
            -
          </span>
        )}
      </div>
    </div>
  );
});

CheckScoreInput.displayName = 'CheckScoreInput';
