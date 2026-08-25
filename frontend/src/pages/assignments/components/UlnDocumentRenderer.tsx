import React, { useState, useCallback, useMemo } from 'react';
import { UlnNode } from '../utils/ulnParser';
import { UlnInlineText } from './UlnInlineText';
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

  const handleInputChange = useCallback((key: string, val: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }, [isSubmitted]);

  const handleSelectOption = useCallback((qKey: string, opt: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qKey]: opt }));
  }, [isSubmitted]);

  const handleTableCheck = useCallback((rowIdx: number, colIdx: number) => {
    if (isSubmitted) return;
    setTableChecks((prev) => {
      const key = `${rowIdx}`;
      return { ...prev, [key]: prev[key] === colIdx ? -1 : colIdx };
    });
  }, [isSubmitted]);

  // Set of all typed words in answers for Word Bank strikethrough
  const usedWordsSet = useMemo(() => {
    const set = new Set<string>();
    Object.values(answers).forEach((val) => {
      if (val && typeof val === 'string') {
        val.trim().toLowerCase().split(/\s+/).forEach((w) => set.add(w));
      }
    });
    return set;
  }, [answers]);

  return (
    <div className="space-y-3 font-sans text-slate-950 select-text">
      {nodes.map((node, nIdx) => {
        // 1. Headings [H1] to [H6]
        if (node.type === 'h1') {
          return (
            <div key={nIdx} className="pt-2 pb-1 border-b-2 border-slate-900 text-center">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                {node.text}
              </h1>
            </div>
          );
        }
        if (node.type === 'h2') {
          return (
            <div key={nIdx} className="pt-2.5 pb-0.5 border-b border-slate-300">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                {node.text}
              </h2>
            </div>
          );
        }
        if (node.type === 'h3') {
          return (
            <h3 key={nIdx} className="pt-1.5 text-sm font-bold text-slate-950 capitalize">
              {node.text}
            </h3>
          );
        }
        if (node.type === 'h4' || node.type === 'h5' || node.type === 'h6') {
          return (
            <div key={nIdx} className={`pt-0.5 text-xs sm:text-sm text-slate-900 ${node.type === 'h6' ? 'italic' : 'font-semibold'}`}>
              {node.text}
            </div>
          );
        }

        // 2. Instruction [ins]
        if (node.type === 'ins') {
          return (
            <div key={nIdx} className="pt-1 pb-0.5 text-xs sm:text-sm font-bold text-slate-950">
              <UlnInlineText text={node.text} qKey={`ins_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
            </div>
          );
        }

        // 3. Word Box [BOX] (Word Bank with clean word list without pill boxes)
        if (node.type === 'box') {
          if (node.isFormula) {
            return (
              <div key={nIdx} className="bg-slate-50 border border-slate-700 rounded-lg p-2.5 text-center my-1.5 font-semibold text-xs sm:text-sm text-slate-950">
                <UlnInlineText text={node.content || ''} qKey={`box_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
              </div>
            );
          }
          return (
            <div key={nIdx} className="border border-slate-800 rounded-lg p-2.5 text-center my-1.5 bg-slate-50/60">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs sm:text-sm">
                {(node.words || []).map((word, wIdx) => {
                  const isUsed = usedWordsSet.has(word.trim().toLowerCase());
                  return (
                    <span
                      key={wIdx}
                      className={`transition ${
                        isUsed
                          ? 'line-through text-slate-400 decoration-slate-900 decoration-2 font-medium'
                          : 'text-slate-950 font-bold'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        }

        // 4. Picture Grid [PIC_GRID]
        if (node.type === 'pic_grid') {
          return (
            <div key={nIdx} className="my-1.5 space-y-1.5">
              {node.rows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="p-2 bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold text-slate-950">
                      <UlnInlineText text={item} qKey={`pic_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }

        // 5. Grid Table [TABLE] (Sharp dark borders & Clean checkboxes)
        if (node.type === 'table') {
          return (
            <div key={nIdx} className="my-1.5 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse border-2 border-slate-800">
                {node.headers.length > 0 && (
                  <thead className="bg-slate-100 border-b-2 border-slate-800 text-slate-950 font-bold">
                    <tr>
                      {node.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className={`p-2 border border-slate-800 ${hIdx === 0 ? 'w-2/3' : 'text-center w-28'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="bg-white">
                  {node.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-1.5 border border-slate-800 ${cIdx === 0 ? 'font-medium text-slate-950' : 'text-center'}`}
                        >
                          {cIdx === 0 ? (
                            <UlnInlineText text={cell} qKey={`cell_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTableCheck(rIdx, cIdx)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition cursor-pointer font-bold text-xs ${
                                tableChecks[`${rIdx}`] === cIdx
                                  ? 'bg-slate-950 border-slate-950 text-white'
                                  : 'border-slate-700 hover:border-slate-900 bg-white text-transparent'
                              }`}
                            >
                              ✓
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
            <div key={nIdx} className="bg-slate-50 border-l-4 border-slate-800 p-3 my-1.5 text-xs sm:text-sm font-serif text-slate-950 leading-relaxed space-y-1.5">
              {node.title && (
                <div className="font-sans font-bold text-xs sm:text-sm text-slate-950 not-italic">
                  {node.title}
                </div>
              )}
              {node.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-justify indent-4">
                  <UlnInlineText text={p} qKey={`quote_${nIdx}_${pIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                </p>
              ))}
              {node.notes && node.notes.length > 0 && (
                <div className="pt-1 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] sm:text-xs font-sans text-slate-700">
                  {node.notes.map((note, nIdx2) => (
                    <div key={nIdx2}>{note}</div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 7. Multi-Column Layouts [TAB2], [TAB3], [TAB4] (Clean text columns without pill boxes)
        if (node.type === 'tab_cols') {
          const gridClass = node.cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : node.cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2';
          return (
            <div key={nIdx} className="my-1.5 space-y-1">
              {node.items.map((row, rIdx) => (
                <div key={rIdx} className={`grid ${gridClass} gap-x-8 gap-y-1 text-xs sm:text-sm font-medium text-slate-950`}>
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="py-0.5">
                      <UlnInlineText text={item} qKey={`tab_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }

        // 8. Dialogue Reordering [dialogue_order]
        if (node.type === 'dialogue_order') {
          return (
            <div key={nIdx} className="space-y-1 my-1.5">
              {node.items.map((item, dIdx) => (
                <div key={dIdx} className="flex items-center gap-2 py-0.5 text-xs sm:text-sm">
                  <input
                    type="text"
                    defaultValue={item.initialNum || ''}
                    style={{ colorScheme: 'light', backgroundColor: 'transparent', color: '#0f172a', borderBottom: '2px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0px' }}
                    className="white-paper-input w-9 text-center p-0.5 font-bold text-xs sm:text-sm text-slate-950"
                  />
                  <span className="text-slate-950 font-medium flex-1">
                    <UlnInlineText text={item.text} qKey={`d_${nIdx}_${dIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                  </span>
                </div>
              ))}
            </div>
          );
        }

        // 9. Question Item [question]
        if (node.type === 'question') {
          const qKey = `q_${nIdx}_${node.qNum || nIdx}`;
          const currentAns = answers[qKey];

          // Dynamic intelligent option grid columns based on option length
          const maxOptLen = Math.max(...(node.options || []).map((o) => cleanOptionPrefix(o).length), 0);
          const optGridClass = maxOptLen > 30
            ? 'grid-cols-1'
            : maxOptLen > 14
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-4';

          return (
            <div key={nIdx} className="py-0.5 px-0.5 space-y-1">
              <div className="flex items-start gap-2">
                {node.qNum && (
                  <span className="font-bold text-xs sm:text-sm text-slate-950 pt-0.5 shrink-0">
                    {node.qNum}.
                  </span>
                )}
                <div className="flex-1 space-y-1">
                  {node.text && (
                    <div className="text-xs sm:text-sm font-medium text-slate-950 leading-relaxed">
                      <UlnInlineText text={node.text} qKey={qKey} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}
                  {node.subText && (
                    <div className="text-xs sm:text-sm font-medium text-slate-900 pl-2 border-l-2 border-slate-400">
                      <UlnInlineText text={node.subText} qKey={`${qKey}_sub`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}

                  {/* Handwriting line [P1] <blank> */}
                  {node.hasWritingLine && (
                    <div className="pt-0.5">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={answers[`${qKey}_write`] || ''}
                        onChange={(e) => handleInputChange(`${qKey}_write`, e.target.value)}
                        style={{ colorScheme: 'light', backgroundColor: 'transparent', color: '#0f172a', borderBottom: '2px solid #0f172a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0px' }}
                        className="white-paper-input w-full px-1 py-0.5 text-xs sm:text-sm font-bold text-slate-950"
                      />
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {node.options && node.options.length > 0 && (
                    <div className={`grid ${optGridClass} gap-1.5 pt-0.5`}>
                      {node.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isSelected = currentAns === opt;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qKey, opt)}
                            className={`p-1.5 sm:p-2 rounded-lg text-left border flex items-start gap-2 transition cursor-pointer text-xs sm:text-sm ${
                              isSelected
                                ? 'bg-indigo-50 border-2 border-indigo-700 text-indigo-950 font-bold shadow-xs'
                                : 'bg-white border-slate-300 hover:border-slate-500 text-slate-950 font-medium'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span className="flex-1">
                              <UlnInlineText text={cleanOptionPrefix(opt)} qKey={`${qKey}_opt_${optIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
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
          <div key={nIdx} className="text-xs sm:text-sm font-medium text-slate-950 leading-relaxed">
            <UlnInlineText text={node.text} qKey={`p_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
          </div>
        );
      })}
    </div>
  );
};
