import React, { useState, useEffect, useRef, memo } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface UlnInlineTextProps {
  text: string;
  qKey?: string;
  answers?: Record<string, string>;
  onInputChange?: (key: string, val: string) => void;
  isSubmitted?: boolean;
}

// Fast self-contained inline input to guarantee 60fps zero-lag typing
export const InlineInput = memo(({
  inputKey,
  initialVal,
  disabled,
  onCommit,
}: {
  inputKey: string;
  initialVal: string;
  disabled: boolean;
  onCommit?: (key: string, val: string) => void;
}) => {
  const [val, setVal] = useState(initialVal);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setVal(initialVal);
  }, [initialVal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setVal(nextVal);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onCommit) onCommit(inputKey, nextVal);
    }, 60);
  };

  const dynamicWidth = Math.max(65, Math.min(340, (val.length + 3) * 9.5)) + 'px';

  return (
    <input
      type="text"
      disabled={disabled}
      value={val}
      onChange={handleChange}
      style={{
        width: dynamicWidth,
        colorScheme: 'light',
        backgroundColor: '#ffffff',
        background: '#ffffff',
        color: '#0f172a',
        WebkitTextFillColor: '#0f172a',
        borderBottom: '2px solid #0f172a',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '0px',
        outline: 'none',
        boxShadow: 'none',
        transition: 'width 0.1s ease',
      }}
      className="white-paper-input inline-block mx-1 px-1.5 py-0.5 text-center text-sm font-bold text-slate-950 bg-white"
    />
  );
});

InlineInput.displayName = 'InlineInput';

export const UlnInlineText: React.FC<UlnInlineTextProps> = memo(({
  text,
  qKey = 'inline',
  answers = {},
  onInputChange,
  isSubmitted = false,
}) => {
  if (!text) return null;

  // Clean leading # before question/item numbers everywhere: e.g. "#1." -> "1."
  const cleanText = text.replace(/(^|\s)#([0-9]+)/g, '$1$2');

  // Handle inline fill-in-the-blank <blank> with dynamic auto-expanding input width
  if (cleanText.includes('<blank>')) {
    const parts = cleanText.split('<blank>');
    return (
      <span className="text-slate-900">
        {parts.map((p, idx) => {
          const blankKey = `${qKey}_blank_${idx}`;
          const currentVal = answers[blankKey] || '';

          return (
            <React.Fragment key={idx}>
              <UlnInlineText
                text={p}
                qKey={`${qKey}_p${idx}`}
                answers={answers}
                onInputChange={onInputChange}
                isSubmitted={isSubmitted}
              />
              {idx < parts.length - 1 && (
                <InlineInput
                  inputKey={blankKey}
                  initialVal={currentVal}
                  disabled={isSubmitted}
                  onCommit={onInputChange}
                />
              )}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  // Check if string starts with a number like "1. Australia" -> render number in bold red and text in normal weight
  const numStartMatch = cleanText.match(/^([0-9]+)\.\s*(.*)/);
  if (numStartMatch) {
    return (
      <span className="inline-flex items-baseline gap-1 text-slate-900">
        <span className="text-rose-600 font-bold shrink-0">{numStartMatch[1]}.</span>
        <span className="text-slate-900">
          <UlnInlineText
            text={numStartMatch[2]}
            qKey={`${qKey}_tail`}
            answers={answers}
            onInputChange={onInputChange}
            isSubmitted={isSubmitted}
          />
        </span>
      </span>
    );
  }

  // Check if string starts with a letter like "a. Ottawa" -> render letter in bold blue
  const letterStartMatch = cleanText.match(/^([a-zA-Z])\.\s*(.*)/);
  if (letterStartMatch) {
    return (
      <span className="inline-flex items-baseline gap-1 text-slate-900">
        <span className="text-blue-600 font-bold shrink-0">{letterStartMatch[1]}.</span>
        <span className="text-slate-900">
          <UlnInlineText
            text={letterStartMatch[2]}
            qKey={`${qKey}_tail`}
            answers={answers}
            onInputChange={onInputChange}
            isSubmitted={isSubmitted}
          />
        </span>
      </span>
    );
  }

  const regex = /(\[[^\]]+\]\{[^}]+\}|\[PIC:[^\]]+\]|\[PIC\]|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g;
  const parts = cleanText.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[PIC:') || part === '[PIC]') {
          const desc = part.startsWith('[PIC:') ? part.slice(5, -1).trim() : 'Hình ảnh';
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-400 rounded text-xs font-bold text-slate-900 mx-1">
              <ImageIcon size={13} className="text-slate-800 shrink-0" />
              <span>{desc}</span>
            </span>
          );
        }

        if (part.includes('{u,b}')) {
          const m = part.match(/\[([^\]]+)\]/);
          return (
            <span key={index} className="underline decoration-slate-900 decoration-2 font-black text-slate-950 px-0.5">
              {m ? m[1] : part}
            </span>
          );
        }

        if (part.includes('{u}')) {
          const m = part.match(/\[([^\]]+)\]/);
          return (
            <span key={index} className="underline decoration-slate-900 decoration-2 font-bold text-slate-900 px-0.5">
              {m ? m[1] : part}
            </span>
          );
        }

        if (part.includes('{upper}')) {
          const m = part.match(/\[([^\]]+)\]/);
          return (
            <span key={index} className="uppercase font-bold tracking-wide text-slate-900">
              {m ? m[1] : part}
            </span>
          );
        }

        if (part.startsWith('***') && part.endsWith('***')) {
          return (
            <strong key={index} className="font-black italic text-slate-900">
              {part.slice(3, -3)}
            </strong>
          );
        }

        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-slate-950">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.includes('{center}') || part.includes('{align:center}')) {
          const m = part.match(/\[([^\]]+)\]/);
          return (
            <span key={index} className="block text-center w-full">
              {m ? m[1] : part}
            </span>
          );
        }

        if (part.includes('{right}') || part.includes('{align:right}')) {
          const m = part.match(/\[([^\]]+)\]/);
          return (
            <span key={index} className="block text-right w-full">
              {m ? m[1] : part}
            </span>
          );
        }

        if (part.includes('{left}') || part.includes('{align:left}')) {
          const m = part.match(/\[([^\]]+)\]/);
          return (
            <span key={index} className="block text-left w-full">
              {m ? m[1] : part}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
});

UlnInlineText.displayName = 'UlnInlineText';
