import React, { useState } from 'react';
import { UlnNode } from '../utils/ulnParser';
import { cleanOptionPrefix } from '../../../utils';
import { UlnInlineText } from './UlnInlineText';

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

  return (
    <div className="space-y-6 font-sans select-none">
      {nodes.map((node, nIdx) => {
        // 1. Headings [H1] to [H6]
        if (node.type === 'h1') {
          return (
            <div key={nIdx} className="pt-6 pb-2 border-b-2 border-slate-900 text-center">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                {node.text}
              </h1>
            </div>
          );
        }
        if (node.type === 'h2') {
          return (
            <div key={nIdx} className="pt-4 border-t-2 border-slate-200">
              <h2 className="text-sm sm:text-base font-black text-indigo-950 uppercase tracking-wide bg-indigo-50 border-l-4 border-indigo-600 px-3 py-2 rounded-r-lg">
                {node.text}
              </h2>
            </div>
          );
        }
        if (node.type === 'h3') {
          return (
            <h3 key={nIdx} className="pt-2 text-sm font-bold text-indigo-900 capitalize">
              {node.text}
            </h3>
          );
        }
        if (node.type === 'h4' || node.type === 'h5' || node.type === 'h6') {
          return (
            <div key={nIdx} className={`pt-1 text-xs text-slate-700 ${node.type === 'h6' ? 'italic' : 'font-semibold'}`}>
              {node.text}
            </div>
          );
        }

        // 2. Instruction [ins]
        if (node.type === 'ins') {
          return (
            <div key={nIdx} className="pt-1 text-xs sm:text-sm font-bold text-slate-800 italic">
              <UlnInlineText text={node.text} qKey={`ins_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
            </div>
          );
        }

        // 3. Word Box [BOX] (Grammar Formula or Word Bank)
        if (node.type === 'box') {
          if (node.isFormula) {
            return (
              <div key={nIdx} className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-center my-2 font-semibold text-xs text-indigo-950">
                <UlnInlineText text={node.content || ''} qKey={`box_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
              </div>
            );
          }
          return (
            <div key={nIdx} className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 text-center space-y-1.5 my-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Khung Từ Vựng (Word Bank)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(node.words || []).map((word, wIdx) => (
                  <span key={wIdx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        // 4. Picture Grid [PIC_GRID]
        if (node.type === 'pic_grid') {
          return (
            <div key={nIdx} className="my-3 space-y-2">
              {node.rows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-800 shadow-sm">
                      <UlnInlineText text={item} qKey={`pic_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  ))}
                </div>
              ))}
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
                            <UlnInlineText text={cell} qKey={`cell_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
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
              {node.title && (
                <div className="font-sans font-black text-xs text-indigo-950 not-italic">
                  {node.title}
                </div>
              )}
              {node.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-justify indent-4">
                  <UlnInlineText text={p} qKey={`quote_${nIdx}_${pIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
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

        // 7. Multi-Column Layouts [TAB2], [TAB3], [TAB4]
        if (node.type === 'tab_cols') {
          const gridClass = node.cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : node.cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2';
          return (
            <div key={nIdx} className="my-2 space-y-1.5">
              {node.items.map((row, rIdx) => (
                <div key={rIdx} className={`grid ${gridClass} gap-2`}>
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs shadow-sm">
                      <span className="font-semibold text-slate-900">
                        <UlnInlineText text={item} qKey={`tab_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                      </span>
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
                <div key={dIdx} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <input
                    type="text"
                    defaultValue={item.initialNum || ''}
                    placeholder="thứ tự..."
                    className="w-12 text-center p-1 font-bold text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600"
                  />
                  <span className="text-slate-800 flex-1">
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
            <div key={nIdx} className="p-3 bg-white hover:bg-slate-50/50 rounded-xl border border-slate-100 transition space-y-2">
              <div className="flex items-start gap-2.5">
                {node.qNum && (
                  <span className="font-black text-xs text-indigo-700 pt-0.5 shrink-0">
                    {node.qNum}.
                  </span>
                )}
                <div className="flex-1 space-y-2">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                    <UlnInlineText text={node.text} qKey={qKey} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                  </div>
                  {node.subText && (
                    <div className="text-xs font-semibold text-slate-700 pl-2 border-l-2 border-slate-300">
                      <UlnInlineText text={node.subText} qKey={`${qKey}_sub`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}

                  {/* Handwriting writing line [P1] <blank> */}
                  {node.hasWritingLine && (
                    <div className="pt-1">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={answers[`${qKey}_write`] || ''}
                        onChange={(e) => handleInputChange(`${qKey}_write`, e.target.value)}
                        placeholder="viết câu trả lời tại đây..."
                        className="w-full px-2 py-1.5 text-xs font-bold text-indigo-900 border-b-2 border-slate-400 bg-slate-50 focus:bg-indigo-50/50 focus:border-indigo-600 outline-none rounded-t"
                      />
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
          <div key={nIdx} className="text-xs text-slate-700 leading-relaxed">
            <UlnInlineText text={node.text} qKey={`p_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
          </div>
        );
      })}
    </div>
  );
};
