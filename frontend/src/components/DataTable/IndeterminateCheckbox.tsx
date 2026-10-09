import React, { useRef, useEffect } from 'react';

export function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);
  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={`accent-[#2563eb] cursor-pointer w-4 h-4 rounded border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#1c1c21] transition hover:scale-110 ${className}`}
      {...rest}
    />
  );
}
