import React, { useState, useEffect, useRef } from 'react';

interface FastJsonEditorProps {
  initialValue: string;
  onParsedDataChange: (data: any[], error: string | null) => void;
}

export const FastJsonEditor: React.FC<FastJsonEditorProps> = React.memo(({ initialValue, onParsedDataChange }) => {
  const [val, setVal] = useState(initialValue);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setVal(initialValue);
    try {
      const parsed = JSON.parse(initialValue);
      const exercises = Array.isArray(parsed) ? parsed : (parsed.data || parsed.exercises || []);
      onParsedDataChange(exercises, null);
    } catch {
      // initial load error handled gracefully
    }
  }, [initialValue, onParsedDataChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setVal(text);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      try {
        if (!text.trim()) {
          onParsedDataChange([], null);
          return;
        }
        const parsed = JSON.parse(text);
        const exercises = Array.isArray(parsed) ? parsed : (parsed.data || parsed.exercises || []);
        onParsedDataChange(exercises, null);
      } catch (err: any) {
        onParsedDataChange([], err.message);
      }
    }, 300);
  };

  return (
    <textarea
      value={val}
      onChange={handleChange}
      placeholder="Dán mã JSON đề thi hoặc bài tập vào đây..."
      className="w-full h-full p-6 font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#0f1322] border-0 focus:outline-none resize-none leading-relaxed select-text"
      spellCheck={false}
    />
  );
});
