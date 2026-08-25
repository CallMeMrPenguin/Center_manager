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

  // Set of all typed words in answers for Word Bank auto-strikethrough
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
    <div className="space-y-4 font-sans text-slate-900">
      {nodes.map((node, nIdx) => {
        // 1. Headings [H1] to [H6]
        if (node.type === 'h1') {
          return (
            <div key={nIdx} className="pt-4 pb-2 border-b-2 border-slate-900 text-center">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                {node.text}
              </h1>
            </div>
          );
        }
        if (node.type === 'h2') {
          return (
            <div key={nIdx} className="pt-4 pb-1 border-b border-slate-300">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide">
                {node.text}
              </h2>
            </div>
          );
        }
        if (node.type === 'h3') {
          return (
            <h3 key={nIdx} className="pt-2 text-sm font-bold text-slate-900 capitalize">
              {node.text}
            </h3>
          );
        }
        if (node.type === 'h4' || node.type === 'h5' || node.type === 'h6') {
          return (
            <div key={nIdx} className={`pt-1 text-xs sm:text-sm text-slate-800 ${node.type === 'h6' ? 'italic' : 'font-semibold'}`}>
              {node.text}
            </div>
          );
        }

        // 2. Instruction [ins]
        if (node.type === 'ins') {
          return (
            <div key={nIdx} className="pt-2 pb-1 text-xs sm:text-sm font-bold italic text-slate-900">
              <UlnInlineText text={node.text} qKey={`ins_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
            </div>
          );
        }

        // 3. Word Box [BOX] (Word Bank or Formula)
        if (node.type === 'box') {
          if (node.isFormula) {
            return (
              <div key={nIdx} className="bg-slate-50 border-2 border-slate-700 rounded-xl p-3 text-center my-2 font-semibold text-xs sm:text-sm text-slate-900">
                <UlnInlineText text={node.content || ''} qKey={`box_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
              </div>
            );
          }
          return (
            <div key={nIdx} className="bg-slate-50 border-2 border-slate-700 rounded-xl p-3 text-center my-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(node.words || []).map((word, wIdx) => {
                  const isUsed = usedWordsSet.has(word.trim().toLowerCase());
                  return (
                    <span
                      key={wIdx}
                      className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border transition duration-150 ${
                        isUsed
                          ? 'line-through opacity-30 bg-slate-200 text-slate-400 border-slate-300 decoration-slate-900 decoration-2'
                          : 'bg-white border-slate-400 text-slate-900 shadow-xs'
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
            <div key={nIdx} className="my-2 space-y-2">
              {node.rows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-xs font-bold text-slate-900 shadow-xs">
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
            <div key={nIdx} className="my-2 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse border-2 border-slate-800 shadow-xs">
                {node.headers.length > 0 && (
                  <thead className="bg-slate-100 border-b-2 border-slate-800 text-slate-900 font-bold">
                    <tr>
                      {node.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className={`p-2.5 border border-slate-800 ${hIdx === 0 ? 'w-2/3' : 'text-center w-28'}`}
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
                          className={`p-2 border border-slate-800 ${cIdx === 0 ? 'font-medium text-slate-900' : 'text-center'}`}
                        >
                          {cIdx === 0 ? (
                            <UlnInlineText text={cell} qKey={`cell_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTableCheck(rIdx, cIdx)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition cursor-pointer font-bold text-sm ${
                                tableChecks[`${rIdx}`] === cIdx
                                  ? 'bg-slate-900 border-slate-900 text-white'
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
            <div key={nIdx} className="bg-slate-50 border-l-4 border-slate-800 rounded-r-lg p-4 my-2 text-xs sm:text-sm font-serif text-slate-900 leading-relaxed space-y-2">
              {node.title && (
                <div className="font-sans font-bold text-xs sm:text-sm text-slate-900 not-italic">
                  {node.title}
                </div>
              )}
              {node.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-justify indent-4">
                  <UlnInlineText text={p} qKey={`quote_${nIdx}_${pIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                </p>
              ))}
              {node.notes && node.notes.length > 0 && (
                <div className="pt-2 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] sm:text-xs font-sans text-slate-700">
                  {node.notes.map((note, nIdx2) => (
                    <div key={nIdx2}>{note}</div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 7. Multi-Column Layouts [TAB2], [TAB3], [TAB4]
        if (node.type === 'tab_cols') {
          const gridClass = node.cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : node.cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2';
          return (
            <div key={nIdx} className="my-1.5 space-y-1">
              {node.items.map((row, rIdx) => (
                <div key={rIdx} className={`grid ${gridClass} gap-2`}>
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-900 shadow-xs">
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
            <div key={nIdx} className="space-y-1.5 my-2">
              {node.items.map((item, dIdx) => (
                <div key={dIdx} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm">
                  <input
                    type="text"
                    defaultValue={item.initialNum || ''}
                    style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-10 text-center p-1 font-bold text-xs sm:text-sm bg-white border-2 border-slate-700 rounded outline-none focus:border-indigo-600"
                  />
                  <span className="text-slate-900 font-medium flex-1">
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

          return (
            <div key={nIdx} className="py-1 px-1.5 hover:bg-slate-50/60 rounded-lg transition space-y-1.5">
              <div className="flex items-start gap-2">
                {node.qNum && (
                  <span className="font-bold text-xs sm:text-sm text-slate-900 pt-0.5 shrink-0">
                    {node.qNum}.
                  </span>
                )}
                <div className="flex-1 space-y-1.5">
                  {node.text && (
                    <div className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                      <UlnInlineText text={node.text} qKey={qKey} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}
                  {node.subText && (
                    <div className="text-xs sm:text-sm font-medium text-slate-800 pl-2 border-l-2 border-slate-400">
                      <UlnInlineText text={node.subText} qKey={`${qKey}_sub`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}

                  {/* Handwriting writing line [P1] <blank> */}
                  {node.hasWritingLine && (
                    <div className="pt-0.5">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={answers[`${qKey}_write`] || ''}
                        onChange={(e) => handleInputChange(`${qKey}_write`, e.target.value)}
                        style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
                        className="w-full px-2 py-1 text-xs sm:text-sm font-bold text-slate-900 border-b-2 border-slate-800 bg-white focus:bg-indigo-50 focus:border-indigo-600 outline-none rounded-none"
                      />
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {node.options && node.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
                      {node.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isSelected = currentAns === opt;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qKey, opt)}
                            className={`p-2 rounded-lg text-left border flex items-center gap-2 transition cursor-pointer text-xs sm:text-sm ${
                              isSelected
                                ? 'bg-indigo-50 border-2 border-indigo-700 text-indigo-950 font-bold shadow-xs'
                                : 'bg-white border-slate-300 hover:border-slate-500 text-slate-900 font-medium'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
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
          <div key={nIdx} className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
            <UlnInlineText text={node.text} qKey={`p_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
          </div>
        );
      })}
    </div>
  );
};
