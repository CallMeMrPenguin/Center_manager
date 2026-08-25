import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface UlnInlineTextProps {
  text: string;
  qKey?: string;
  answers?: Record<string, string>;
  onInputChange?: (key: string, val: string) => void;
  isSubmitted?: boolean;
}

export const UlnInlineText: React.FC<UlnInlineTextProps> = ({
  text,
  qKey = 'inline',
  answers = {},
  onInputChange,
  isSubmitted = false,
}) => {
  if (!text) return null;

  if (text.includes('<blank>')) {
    const parts = text.split('<blank>');
    return (
      <span>
        {parts.map((p, idx) => (
          <React.Fragment key={idx}>
            <UlnInlineText
              text={p}
              qKey={`${qKey}_p${idx}`}
              answers={answers}
              onInputChange={onInputChange}
              isSubmitted={isSubmitted}
            />
            {idx < parts.length - 1 && (
              <input
                type="text"
                disabled={isSubmitted}
                value={answers[`${qKey}_blank_${idx}`] || ''}
                onChange={(e) => onInputChange && onInputChange(`${qKey}_blank_${idx}`, e.target.value)}
                style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
                className="inline-block mx-1.5 px-2 py-0.5 min-w-[110px] max-w-[200px] text-center border-b-2 border-slate-800 bg-white focus:bg-indigo-50 focus:border-indigo-600 outline-none text-sm font-bold text-slate-900 rounded-none shadow-xs"
              />
            )}
          </React.Fragment>
        ))}
      </span>
    );
  }

  const regex = /(\[[^\]]+\]\{[^}]+\}|\[PIC:[^\]]+\]|\[PIC\]|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[PIC:') || part === '[PIC]') {
          const desc = part.startsWith('[PIC:') ? part.slice(5, -1).trim() : 'Hình ảnh';
          return (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-400 rounded text-xs font-bold text-slate-900 mx-1">
              <ImageIcon size={13} className="text-indigo-700 shrink-0" />
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
            <strong key={index} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="italic text-slate-800">
              {part.slice(1, -1)}
            </em>
          );
        }

        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <span key={index} className="underline decoration-slate-900 decoration-2 font-bold text-slate-900 px-0.5">
              {part.slice(1, -1)}
            </span>
          );
        }

        return part;
      })}
    </>
  );
};
