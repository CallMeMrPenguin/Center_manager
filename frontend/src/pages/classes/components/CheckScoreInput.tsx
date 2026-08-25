import React, { useState, useEffect, useRef } from 'react';

interface CheckScoreInputProps {
  rec: any;
  field: 'check_1' | 'check_2' | 'homework' | 'mock_test';
  onUpdateRecord: (studentId: number, field: string, value: any) => void;
  parseAndFormatScore: (val: any) => string;
}

export const CheckScoreInput: React.FC<CheckScoreInputProps> = React.memo(({
  rec,
  field,
  onUpdateRecord,
  parseAndFormatScore,
}) => {
  const [val, setVal] = useState(rec[field] ?? '');
  const isFocused = useRef(false);

  useEffect(() => {
    // Không reset val khi user đang gõ (focused), tránh mất điểm vừa nhập
    if (!isFocused.current) {
      setVal(rec[field] ?? '');
    }
  }, [rec[field]]);

  return (
    <div className="flex items-center justify-center">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => {
          isFocused.current = true;
        }}
        onBlur={(e) => {
          isFocused.current = false;
          const formatted = parseAndFormatScore(e.target.value);
          setVal(formatted);
          const currentVal = rec[field] !== null && rec[field] !== undefined ? String(rec[field]) : '';
          if (formatted !== currentVal) {
            onUpdateRecord(rec.student_id, field, formatted);
          }
        }}
        placeholder="0-10"
        className="w-20 bg-[#161a29] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-extrabold text-xs focus:outline-none focus:border-indigo-500 text-center"
      />
    </div>
  );
});

CheckScoreInput.displayName = 'CheckScoreInput';
