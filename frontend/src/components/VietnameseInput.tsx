import React, { useRef, useState, useEffect } from 'react';

export interface VietnameseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  onValueChange?: (val: string) => void;
}

export const VietnameseInput: React.FC<VietnameseInputProps> = ({
  value = '',
  onChange,
  onValueChange,
  className,
  ...props
}) => {
  const isComposingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localVal, setLocalVal] = useState<string>(String(value ?? ''));

  useEffect(() => {
    setLocalVal(String(value ?? ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    if (onValueChange) {
      onValueChange(newVal);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = true;
    if (props.onCompositionStart) {
      props.onCompositionStart(e);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const newVal = e.currentTarget.value;
    setLocalVal(newVal);
    if (onValueChange) {
      onValueChange(newVal);
    }
    if (onChange) {
      onChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    }
    if (props.onCompositionEnd) {
      props.onCompositionEnd(e);
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      value={localVal}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
    />
  );
};
