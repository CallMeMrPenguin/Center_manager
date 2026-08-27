import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CheckScoreInputProps {
  rec: any;
  rowIndex?: number;
  field: 'check_1' | 'check_2' | 'homework' | 'mock_test';
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
}

const getAllScoreInputs = (): HTMLInputElement[] => {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[data-score-input="true"]')
  ).filter((el) => !el.disabled && el.offsetParent !== null);
};

const focusTarget = (target: HTMLInputElement | null | undefined) => {
  if (!target) return;
  target.focus();
  if (target.value && target.value.trim().length > 0) {
    target.select();
  } else {
    target.setSelectionRange(0, 0);
  }
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
    if (formatted !== currentProp && formatted !== lastCommittedRef.current) {
      lastCommittedRef.current = formatted;
      onUpdateRecord(rec.student_id, field, formatted);
    }
  }, [field, onUpdateRecord, parseAndFormatScore, rec]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputs = getAllScoreInputs();
    const currentIndex = inputRef.current ? inputs.indexOf(inputRef.current) : -1;

    // 1. Enter or ArrowDown -> Move down to same column in next row
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex !== -1) {
        const nextDown = inputs.slice(currentIndex + 1).find(
          (el) => el.dataset.scoreField === field
        );
        if (nextDown) {
          focusTarget(nextDown);
        }
      }
      return;
    }

    // 2. ArrowUp -> Move up to same column in previous row
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex !== -1) {
        const prevUp = inputs
          .slice(0, currentIndex)
          .reverse()
          .find((el) => el.dataset.scoreField === field);
        if (prevUp) {
          focusTarget(prevUp);
        }
      }
      return;
    }

    // 3. Tab Navigation (1-press instant cell navigation)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (currentIndex !== -1) {
        const nextIdx = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
        if (nextIdx >= 0 && nextIdx < inputs.length) {
          focusTarget(inputs[nextIdx]);
        }
      }
      return;
    }

    // 4. ArrowRight at end of selection/caret or empty -> Move to next input
    if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      const isAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (isAtEnd || isAllSelected || input.value === '') {
        if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
          e.preventDefault();
          focusTarget(inputs[currentIndex + 1]);
        }
      }
      return;
    }

    // 5. ArrowLeft at start of selection/caret or empty -> Move to previous input
    if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (isAtStart || isAllSelected || input.value === '') {
        if (currentIndex > 0) {
          e.preventDefault();
          focusTarget(inputs[currentIndex - 1]);
        }
      }
      return;
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
        className="w-20 bg-[#161a29] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-extrabold text-xs focus:outline-none focus:border-[#5c36f5] focus:ring-2 focus:ring-[#5c36f5]/40 text-center transition selection:bg-[#5c36f5] selection:text-white caret-white"
      />
    </div>
  );
});

CheckScoreInput.displayName = 'CheckScoreInput';



