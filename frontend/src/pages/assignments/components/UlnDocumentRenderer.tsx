import React, { useState, useCallback } from 'react';
import { UlnNode } from '../utils/ulnParser';
import { cleanOptionPrefix } from '../../../utils';

interface UlnDocumentRendererProps {
  nodes: UlnNode[];
  isSubmitted?: boolean;
}

export const UlnDocumentRenderer: React.FC<UlnDocumentRendererProps> = ({
  nodes,
  isSubmitted = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tableChecks, setTableChecks] = useState<Record<string, number>>({});

  const handleSelectOption = (qKey: string, opt: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qKey]: opt }));
  };

  const handleInputChange = (qKey: string, val: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qKey]: val }));
  };

  const handleTableCheck = (rowIdx: number, colIdx: number) => {
    if (isSubmitted) return;
    setTableChecks((prev) => ({
      ...prev,
      [`${rowIdx}`]: prev[`${rowIdx}`] === colIdx ? -1 : colIdx,
    }));
  };

  // Helper to render inline underline phonetics [text]{u}, bold, italic, <blank>
  const renderFormattedInline = useCallback((text: string, qKey?: string) => {
    if (!text) return null;

    // Replace <blank> with interactive inline input or underline
    if (text.includes('<blank>')) {
      const parts = text.split('<blank>');
      return (
        <span>
          {parts.map((p, idx) => (
            <React.Fragment key={idx}>
              {renderFormattedInline(p)}
              {idx < parts.length - 1 && (
                <input
                  type="text"
                  value={answers[`${qKey}_blank_${idx}`] || ''}
                  onChange={(e) => handleInputChange(`${qKey}_blank_${idx}`, e.target.value)}
                  placeholder="điền từ..."
                  className="inline-block mx-1.5 px-2 py-0.5 min-w-[110px] text-center border-b-2 border-slate-700 bg-slate-50 focus:bg-indigo-50/50 focus:border-indigo-600 outline-none text-xs font-bold text-indigo-900 rounded-t"
                />
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    const parts = text.split(/(\[[^\]]+\]\{[^}]+\}|\[[^\]]+\]|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.includes('{u}') || part.includes('{u,b}')) {
        const wordMatch = part.match(/\[([^\]]+)\]/);
        const word = wordMatch ? wordMatch[1] : part;
        return (
          <span key={index} className="underline decoration-indigo-600 decoration-2 font-black text-indigo-900 px-0.5">
            {word}
          </span>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-black text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  }, [answers, isSubmitted]);

  return (
    <div className="space-y-6 font-sans select-none">
      {nodes.map((node, nIdx) => {
        // 1. Heading 1 [H1]
        if (node.type === 'h1') {
          return (
            <div key={nIdx} className="pt-6 pb-2 border-b-2 border-slate-900 text-center">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                {node.text}
              </h1>
            </div>
          );
        }

        // 2. Heading 2 [H2]
        if (node.type === 'h2') {
          return (
            <div key={nIdx} className="pt-4 border-t-2 border-slate-200">
              <h2 className="text-sm sm:text-base font-black text-indigo-950 uppercase tracking-wide bg-indigo-50 border-l-4 border-indigo-600 px-3 py-2 rounded-r-lg">
                {node.text}
              </h2>
            </div>
          );
        }

        // 3. Instruction [ins]
        if (node.type === 'ins') {
          return (
            <div key={nIdx} className="pt-1 text-xs sm:text-sm font-bold text-slate-800 italic">
              {renderFormattedInline(node.text)}
            </div>
          );
        }

        // 4. Word Box [BOX]
        if (node.type === 'box') {
          return (
            <div key={nIdx} className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 text-center space-y-1.5 my-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Khung Từ Vựng (Word Bank)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {node.words.map((word, wIdx) => (
                  <span key={wIdx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        // 5. Grid Table [TABLE]
        if (node.type === 'table') {
          return (
            <div key={nIdx} className="my-3 overflow-x-auto rounded-xl border border-slate-300 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                {node.headers.length > 0 && (
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-900 font-black">
                    <tr>
                      {node.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className={`p-2.5 ${hIdx === 0 ? 'w-2/3' : 'text-center border-l border-slate-300'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-slate-200 bg-white">
                  {node.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-2.5 ${cIdx === 0 ? 'font-medium text-slate-900' : 'text-center border-l border-slate-300'}`}
                        >
                          {cIdx === 0 ? (
                            renderFormattedInline(cell)
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTableCheck(rIdx, cIdx)}
                              className={`w-5 h-5 rounded border flex items-center justify-center mx-auto transition cursor-pointer ${
                                tableChecks[`${rIdx}`] === cIdx
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-black'
                                  : 'border-slate-300 hover:border-indigo-400 bg-white'
                              }`}
                            >
                              {tableChecks[`${rIdx}`] === cIdx ? '✓' : ''}
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // 6. Reading Passage Quote [QUOTE]
        if (node.type === 'quote') {
          return (
            <div key={nIdx} className="bg-indigo-50/40 border-l-4 border-indigo-500 rounded-r-xl p-4 my-2 text-xs font-serif text-slate-800 leading-relaxed space-y-2.5">
              {node.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-justify indent-4">
                  {renderFormattedInline(p)}
                </p>
              ))}
              {node.notes && node.notes.length > 0 && (
                <div className="pt-2 border-t border-indigo-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-sans text-slate-600">
                  {node.notes.map((note, nIdx2) => (
                    <div key={nIdx2}>{note}</div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 7. 2-Column Matching [TAB2]
        if (node.type === 'tab2') {
          return (
            <div key={nIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
              {node.items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center justify-between gap-3 text-xs p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="font-bold text-slate-900">{renderFormattedInline(item.left)}</span>
                  <span className="text-slate-600 font-medium">{renderFormattedInline(item.right)}</span>
                </div>
              ))}
            </div>
          );
        }

        // 8. Dialogue Reordering [dialogue_order]
        if (node.type === 'dialogue_order') {
          return (
            <div key={nIdx} className="space-y-1.5 my-2">
              {node.items.map((item, dIdx) => (
                <div key={dIdx} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <input
                    type="text"
                    defaultValue={item.initialNum || ''}
                    placeholder="thứ tự..."
                    className="w-12 text-center p-1 font-bold text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600"
                  />
                  <span className="text-slate-800 flex-1">{renderFormattedInline(item.text)}</span>
                </div>
              ))}
            </div>
          );
        }

        // 9. Question Item [question]
        if (node.type === 'question') {
          const qKey = `q_${nIdx}_${node.qNum || nIdx}`;
          const currentAns = answers[qKey];

          return (
            <div key={nIdx} className="p-3 bg-white hover:bg-slate-50/50 rounded-xl border border-slate-100 transition space-y-2">
              <div className="flex items-start gap-2.5">
                {node.qNum && (
                  <span className="font-black text-xs text-indigo-700 pt-0.5 shrink-0">
                    {node.qNum}.
                  </span>
                )}
                <div className="flex-1 space-y-2">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                    {renderFormattedInline(node.text, qKey)}
                  </div>
                  {node.subText && (
                    <div className="text-xs font-semibold text-slate-700 pl-2 border-l-2 border-slate-300">
                      {renderFormattedInline(node.subText, `${qKey}_sub`)}
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {node.options && node.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                      {node.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isSelected = currentAns === opt;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qKey, opt)}
                            className={`p-2 rounded-xl text-left border flex items-center gap-2 transition cursor-pointer text-xs ${
                              isSelected
                                ? 'bg-indigo-100 border-indigo-600 text-indigo-950 font-black shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span className="flex-1">
                              {renderFormattedInline(cleanOptionPrefix(opt))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // 10. Default Paragraph
        return (
          <div key={nIdx} className="text-xs text-slate-700 leading-relaxed">
            {renderFormattedInline(node.text)}
          </div>
        );
      })}
    </div>
  );
};
