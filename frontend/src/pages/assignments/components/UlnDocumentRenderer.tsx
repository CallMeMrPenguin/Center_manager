import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { UlnNode, UlnHeadingNode } from '../utils/ulnParser';
import { UlnInlineText, InlineInput } from './UlnInlineText';
import { cleanOptionPrefix } from '../../../utils';

export interface SectionProgressGroup {
  id: string;
  title: string;
  items: {
    id: string;
    label: string;
    isAnswered: boolean;
  }[];
}

interface UlnDocumentRendererProps {
  nodes: UlnNode[];
  isSubmitted?: boolean;
  onProgressUpdate?: (answered: number, total: number, sections: SectionProgressGroup[]) => void;
}

export const UlnDocumentRenderer: React.FC<UlnDocumentRendererProps> = memo(({
  nodes,
  isSubmitted = false,
  onProgressUpdate,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tableChecks, setTableChecks] = useState<Record<string, number>>({});
  const progressTimerRef = useRef<any>(null);

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

  const usedWordsSet = useMemo(() => {
    const set = new Set<string>();
    Object.values(answers).forEach((val) => {
      if (val && typeof val === 'string') {
        val.trim().toLowerCase().split(/\s+/).forEach((w) => set.add(w));
      }
    });
    return set;
  }, [answers]);

  useEffect(() => {
    if (!onProgressUpdate) return;
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      const sectionGroups: SectionProgressGroup[] = [];
      let currentGroup: SectionProgressGroup = { id: 'target_ins_0', title: 'BÀI TẬP 1', items: [] };
      let totalQuestions = 0;
      let totalAnswered = 0;

      nodes.forEach((node, nIdx) => {
        if (node.type === 'ins') {
          if (currentGroup.items.length > 0) sectionGroups.push(currentGroup);
          const cleanTitle = node.text.replace(/<@[0-9]+>/g, '').replace(/\[.*?\]/g, '').replace(/\*\*/g, '').trim();
          currentGroup = { id: `target_ins_${nIdx}`, title: cleanTitle || `BÀI TẬP ${sectionGroups.length + 1}`, items: [] };
          return;
        }
        if (node.type === 'table') {
          node.rows.forEach((_, rIdx) => {
            const isAns = tableChecks[`${rIdx}`] !== undefined && tableChecks[`${rIdx}`] >= 0;
            currentGroup.items.push({ id: `target_table_${nIdx}_${rIdx}`, label: String(rIdx + 1), isAnswered: isAns });
            totalQuestions++;
            if (isAns) totalAnswered++;
          });
          return;
        }
        if (node.type === 'tab_cols') {
          const prevIns = [...nodes.slice(0, nIdx)].reverse().find((n) => n.type === 'ins') as UlnHeadingNode | undefined;
          const ansCount = prevIns && prevIns.answerCount ? prevIns.answerCount : node.items.length;
          for (let slot = 1; slot <= ansCount; slot++) {
            const key = `ins_${nIdx}_slot_${slot}`;
            const isAns = !!(answers[key] && answers[key].trim());
            currentGroup.items.push({ id: `target_tab_${nIdx}`, label: String(slot), isAnswered: isAns });
            totalQuestions++;
            if (isAns) totalAnswered++;
          }
          return;
        }
        if (node.type === 'question') {
          const qKey = `q_${nIdx}_${node.qNum || nIdx}`;
          const isAns = !!answers[qKey] || !!answers[`${qKey}_write`] || !!answers[`${qKey}_direct`] || Object.keys(answers).some((k) => k.startsWith(qKey) && answers[k]?.trim());
          currentGroup.items.push({ id: `q_target_${nIdx}`, label: node.qNum || String(currentGroup.items.length + 1), isAnswered: isAns });
          totalQuestions++;
          if (isAns) totalAnswered++;
        }
      });
      if (currentGroup.items.length > 0) sectionGroups.push(currentGroup);
      onProgressUpdate(totalAnswered, Math.max(totalQuestions, 1), sectionGroups);
    }, 60);
  }, [answers, tableChecks, nodes, onProgressUpdate]);

  return (
    <div className="space-y-3 font-sans text-slate-950 select-text font-normal">
      {nodes.map((node, nIdx) => {
        if (node.type === 'h1') {
          return (
            <div key={nIdx} className="pt-2 pb-1 border-b-2 border-slate-900 text-center">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">{node.text}</h1>
            </div>
          );
        }
        if (node.type === 'h2') {
          return (
            <div key={nIdx} className="pt-2.5 pb-0.5 border-b border-slate-300">
              <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">{node.text}</h2>
            </div>
          );
        }
        if (node.type === 'h3' || node.type === 'h4' || node.type === 'h5' || node.type === 'h6') {
          return (
            <div key={nIdx} className={`pt-1 text-xs sm:text-sm text-slate-950 ${node.type === 'h3' ? 'font-bold capitalize' : node.type === 'h6' ? 'italic' : 'font-semibold'}`}>
              {node.text}
            </div>
          );
        }
        if (node.type === 'ins') {
          return (
            <div key={nIdx} id={`target_ins_${nIdx}`} className="pt-1.5 pb-0.5 text-xs sm:text-sm font-bold text-slate-950 scroll-mt-20">
              <UlnInlineText text={node.text} qKey={`ins_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
            </div>
          );
        }
        if (node.type === 'box') {
          if (node.isFormula) {
            return (
              <div key={nIdx} className="bg-slate-50 border border-slate-700 rounded-lg p-2.5 text-center my-1.5 font-semibold text-xs sm:text-sm text-slate-950">
                <UlnInlineText text={node.content || ''} qKey={`box_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
              </div>
            );
          }
          return (
            <div key={nIdx} className="border border-slate-800 rounded-lg p-2.5 text-center my-1.5 bg-slate-50/60 font-normal">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs sm:text-sm">
                {(node.words || []).map((word, wIdx) => {
                  const isUsed = usedWordsSet.has(word.trim().toLowerCase());
                  return (
                    <span key={wIdx} className={`transition ${isUsed ? 'line-through text-slate-400 decoration-slate-900 decoration-2 font-normal' : 'text-slate-950 font-bold'}`}>
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        }
        if (node.type === 'pic_grid') {
          return (
            <div key={nIdx} className="my-1.5 space-y-1.5 font-normal">
              {node.rows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {row.map((item, cIdx) => (
                    <div key={cIdx} className="p-2 bg-slate-50 border border-slate-300 rounded text-center text-xs font-normal text-slate-950">
                      <UlnInlineText text={item} qKey={`pic_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }
        if (node.type === 'table') {
          return (
            <div key={nIdx} className="my-1.5 overflow-x-auto font-normal">
              <table className="w-full text-xs sm:text-sm text-left border-collapse border-2 border-slate-800">
                {node.headers.length > 0 && (
                  <thead className="bg-slate-100 border-b-2 border-slate-800 text-slate-950 font-bold">
                    <tr>
                      {node.headers.map((h, hIdx) => (
                        <th key={hIdx} className={`p-2 border border-slate-800 ${hIdx === 0 ? 'w-2/3' : 'text-center w-28'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="bg-white">
                  {node.rows.map((row, rIdx) => (
                    <tr key={rIdx} id={`target_table_${nIdx}_${rIdx}`} className="hover:bg-slate-50 scroll-mt-20">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className={`p-1.5 border border-slate-800 ${cIdx === 0 ? 'font-normal text-slate-950' : 'text-center'}`}>
                          {cIdx === 0 ? (
                            <UlnInlineText text={cell} qKey={`cell_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTableCheck(rIdx, cIdx)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition cursor-pointer font-bold text-xs ${
                                tableChecks[`${rIdx}`] === cIdx ? 'bg-slate-950 border-slate-950 text-white' : 'border-slate-700 hover:border-slate-900 bg-white text-transparent'
                              }`}
                            >✓</button>
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
        if (node.type === 'quote') {
          return (
            <div key={nIdx} className="bg-slate-50/70 border-l-4 border-slate-700 rounded-r-lg p-3.5 my-2 text-xs sm:text-sm font-normal text-slate-900 leading-relaxed space-y-2 border border-slate-200">
              {node.title && <div className="font-bold text-xs sm:text-sm text-slate-950">{node.title}</div>}
              {node.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-justify indent-4 leading-relaxed font-normal text-slate-900">
                  <UlnInlineText text={p} qKey={`quote_${nIdx}_${pIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                </p>
              ))}
              {node.notes && node.notes.length > 0 && (
                <div className="pt-1 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] sm:text-xs font-normal text-slate-700">
                  {node.notes.map((note, nIdx2) => <div key={nIdx2}>{note}</div>)}
                </div>
              )}
            </div>
          );
        }
        if (node.type === 'tab_cols') {
          const prevIns = [...nodes.slice(0, nIdx)].reverse().find((n) => n.type === 'ins') as UlnHeadingNode | undefined;
          const ansCount = prevIns && prevIns.answerCount ? prevIns.answerCount : node.items.length;

          return (
            <div key={nIdx} id={`target_tab_${nIdx}`} className="my-2 space-y-2 scroll-mt-20">
              <div className="space-y-1">
                {node.items.map((row, rIdx) => (
                  <div key={rIdx} className={`grid ${node.cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : node.cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'} gap-x-8 gap-y-1 text-xs sm:text-sm font-normal text-slate-950`}>
                    {row.map((item, cIdx) => (
                      <div key={cIdx} className="py-0.5">
                        <UlnInlineText text={item} qKey={`tab_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {ansCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs mt-2">
                  <span className="font-bold text-slate-700 shrink-0">Điền đáp án:</span>
                  {Array.from({ length: ansCount }).map((_, slotIdx) => {
                    const key = `ins_${nIdx}_slot_${slotIdx + 1}`;
                    return (
                      <div key={slotIdx} className="flex items-center gap-1">
                        <span className="font-bold text-rose-600">{slotIdx + 1}.</span>
                        <InlineInput inputKey={key} initialVal={answers[key] || ''} disabled={isSubmitted} onCommit={handleInputChange} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        if (node.type === 'dialogue_order') {
          return (
            <div key={nIdx} className="space-y-1 my-1.5 font-normal">
              {node.items.map((item, dIdx) => (
                <div key={dIdx} className="flex items-center gap-2 py-0.5 text-xs sm:text-sm">
                  <InlineInput inputKey={`d_${nIdx}_${dIdx}_order`} initialVal={item.initialNum || ''} disabled={isSubmitted} onCommit={handleInputChange} />
                  <span className="text-slate-900 font-normal flex-1">
                    <UlnInlineText text={item.text} qKey={`d_${nIdx}_${dIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                  </span>
                </div>
              ))}
            </div>
          );
        }
        if (node.type === 'question') {
          const qKey = `q_${nIdx}_${node.qNum || nIdx}`;
          const currentAns = answers[qKey];
          const maxOptLen = Math.max(...(node.options || []).map((o) => cleanOptionPrefix(o).length), 0);
          const optGridClass = maxOptLen > 30 ? 'grid-cols-1' : maxOptLen > 14 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
          const hasNoBlankOrOpts = (!node.options || node.options.length === 0) && !node.hasWritingLine && !node.text.includes('<blank>');

          return (
            <div key={nIdx} id={`q_target_${nIdx}`} className="py-0.5 px-0.5 space-y-1 scroll-mt-20 font-normal">
              <div className="flex items-start gap-2">
                {node.qNum && <span className="font-bold text-xs sm:text-sm text-rose-600 pt-0.5 shrink-0 min-w-[20px] text-right">{node.qNum}.</span>}
                <div className="flex-1 space-y-1">
                  {node.text && (
                    <div className="text-xs sm:text-sm font-normal text-slate-900 leading-relaxed">
                      <UlnInlineText text={node.text} qKey={qKey} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}
                  {node.subText && (
                    <div className="text-xs sm:text-sm font-normal text-slate-800 pl-2 border-l-2 border-slate-400">
                      <UlnInlineText text={node.subText} qKey={`${qKey}_sub`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                    </div>
                  )}
                  {hasNoBlankOrOpts && (
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Trả lời:</span>
                      <InlineInput inputKey={`${qKey}_direct`} initialVal={answers[`${qKey}_direct`] || ''} disabled={isSubmitted} onCommit={handleInputChange} />
                    </div>
                  )}
                  {node.hasWritingLine && (
                    <div className="pt-0.5">
                      <InlineInput inputKey={`${qKey}_write`} initialVal={answers[`${qKey}_write`] || ''} disabled={isSubmitted} onCommit={handleInputChange} />
                    </div>
                  )}
                  {node.options && node.options.length > 0 && (
                    <div className={`grid ${optGridClass} gap-x-6 gap-y-1 pt-1 font-normal`}>
                      {node.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const optLetterWithDot = optLetter + '.';
                        const cleanText = cleanOptionPrefix(opt);
                        const isSelected = currentAns === opt || currentAns === cleanText || currentAns === optLetter || currentAns === optLetterWithDot;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qKey, optLetter)}
                            className={`text-left flex items-start gap-1.5 transition cursor-pointer py-1 px-2 rounded-lg text-xs sm:text-sm ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400'
                                : 'hover:bg-slate-100 text-slate-900'
                            }`}
                          >
                            <span className={`font-bold shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`}>{optLetterWithDot}</span>
                            <span className={`flex-1 font-normal ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {cleanText}
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
        return (
          <div key={nIdx} className="text-xs sm:text-sm font-normal text-slate-900 leading-relaxed">
            <UlnInlineText text={node.text} qKey={`p_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
          </div>
        );
      })}
    </div>
  );
});

UlnDocumentRenderer.displayName = 'UlnDocumentRenderer';
