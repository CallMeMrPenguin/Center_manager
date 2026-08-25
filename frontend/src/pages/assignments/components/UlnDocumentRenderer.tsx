import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { UlnNode, UlnHeadingNode, UlnQuestionNode } from '../utils/ulnParser';
import { UlnInlineText, InlineInput } from './UlnInlineText';
import { SessionCheckpointSeparator } from './SessionCheckpointSeparator';
import { QuestionNodeView } from './QuestionNodeView';
import { AssignmentDailyLog } from '../types';

export interface SectionProgressGroup {
  id: string;
  title: string;
  items: { id: string; label: string; isAnswered: boolean }[];
}

interface UlnDocumentRendererProps {
  nodes: UlnNode[];
  initialAnswers?: Record<string, string>;
  answerKeys?: Record<string, string>;
  dailyLogs?: AssignmentDailyLog[];
  isSubmitted?: boolean;
  onProgressUpdate?: (answered: number, total: number, sections: SectionProgressGroup[]) => void;
}

export const UlnDocumentRenderer: React.FC<UlnDocumentRendererProps> = memo(({
  nodes,
  initialAnswers,
  answerKeys = {},
  dailyLogs = [],
  isSubmitted = false,
  onProgressUpdate,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [tableChecks, setTableChecks] = useState<Record<string, number>>({});
  const progressTimerRef = useRef<any>(null);

  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) setAnswers(initialAnswers);
  }, [initialAnswers]);

  const handleInputChange = useCallback((key: string, val: string) => {
    if (!isSubmitted) setAnswers((prev) => ({ ...prev, [key]: val }));
  }, [isSubmitted]);

  const handleSelectOption = useCallback((qKey: string, opt: string) => {
    if (!isSubmitted) setAnswers((prev) => ({ ...prev, [qKey]: opt }));
  }, [isSubmitted]);

  const handleTableCheck = useCallback((rowIdx: number, colIdx: number) => {
    if (!isSubmitted) setTableChecks((prev) => ({ ...prev, [`${rowIdx}`]: prev[`${rowIdx}`] === colIdx ? -1 : colIdx }));
  }, [isSubmitted]);

  const usedWordsSet = useMemo(() => {
    const set = new Set<string>();
    Object.values(answers).forEach((val) => {
      if (val && typeof val === 'string') val.trim().toLowerCase().split(/\s+/).forEach((w) => set.add(w));
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
          const ansCount = prevIns && prevIns.answerCount ? prevIns.answerCount : 0;
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

  // Track H2 headings to insert dailyLogs session checkpoint separators between parts
  let h2Count = 0;

  return (
    <div className="space-y-3 font-sans text-slate-950 select-text font-normal">
      {nodes.map((node, nIdx) => {
        const alignClass = 'align' in node && node.align === 'center' ? 'text-center' : 'align' in node && node.align === 'right' ? 'text-right' : 'text-left';

        // Check if a daily log separator should be inserted before this section
        let sessionSeparator: React.ReactNode = null;
        if (dailyLogs && dailyLogs.length > 0) {
          if (node.type === 'h2') {
            if (h2Count < dailyLogs.length) {
              sessionSeparator = (
                <SessionCheckpointSeparator
                  key={`session_sep_${h2Count}`}
                  log={dailyLogs[h2Count]}
                  sessionIndex={h2Count}
                />
              );
            }
            h2Count++;
          } else if (nIdx === 0 && h2Count === 0 && dailyLogs[0]) {
            sessionSeparator = (
              <SessionCheckpointSeparator
                key="session_sep_0"
                log={dailyLogs[0]}
                sessionIndex={0}
              />
            );
            h2Count = 1;
          }
        }

        if (node.type === 'h1') {
          return (
            <React.Fragment key={nIdx}>
              {sessionSeparator}
              <div className={`pt-2 pb-1 border-b-2 border-slate-900 ${node.align === 'left' ? 'text-left' : node.align === 'right' ? 'text-right' : 'text-center'}`}>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">{node.text}</h1>
              </div>
            </React.Fragment>
          );
        }
        if (node.type === 'h2') {
          return (
            <React.Fragment key={nIdx}>
              {sessionSeparator}
              <div className={`pt-3 pb-1 border-b border-slate-400 ${alignClass}`}>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-950">{node.text}</h2>
              </div>
            </React.Fragment>
          );
        }
        if (node.type === 'h3') {
          return (
            <div key={nIdx} className={`pt-2 pb-0.5 ${alignClass}`}>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">{node.text}</h3>
            </div>
          );
        }
        if (node.type === 'h4' || node.type === 'h5' || node.type === 'h6') {
          return (
            <div key={nIdx} className={`pt-1 text-xs sm:text-sm font-semibold text-slate-800 ${alignClass}`}>
              <span>{node.text}</span>
            </div>
          );
        }
        if (node.type === 'ins') {
          return (
            <div
              key={nIdx}
              id={`target_ins_${nIdx}`}
              className={`pt-2.5 pb-1 font-black sm:font-bold text-xs sm:text-sm text-slate-950 leading-snug scroll-mt-20 [&_*]:font-bold [&_*]:text-slate-950 ${alignClass}`}
            >
              <UlnInlineText text={node.text} qKey={`ins_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
            </div>
          );
        }
        if (node.type === 'box') {
          if (node.words && node.words.length > 0) {
            return (
              <div key={nIdx} className="p-2.5 my-2 border-2 border-slate-800 rounded-xl bg-slate-50 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-xs">
                {node.words.map((w, wIdx) => {
                  const isUsed = usedWordsSet.has(w.trim().toLowerCase());
                  return (
                    <span
                      key={wIdx}
                      className={`px-3 py-1 rounded-md border font-mono transition-all duration-200 ${
                        isUsed ? 'bg-slate-200 border-slate-300 text-slate-400 line-through opacity-60' : 'bg-white border-slate-400 text-slate-950 shadow-xs'
                      }`}
                    >
                      {w}
                    </span>
                  );
                })}
              </div>
            );
          }
          return (
            <div key={nIdx} className="p-3 my-2 border-2 border-slate-800 rounded-xl bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 text-center shadow-xs leading-relaxed">
              <UlnInlineText text={node.content || ''} qKey={`box_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
            </div>
          );
        }
        if (node.type === 'pic_grid') {
          return (
            <div key={nIdx} className="my-2 space-y-2 font-normal">
              {node.rows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {row.map((cell, cIdx) => (
                    <div key={cIdx} className="p-2 border border-slate-300 rounded-lg text-center bg-slate-50/50 space-y-1">
                      <div className="h-16 bg-slate-200/80 rounded border border-dashed border-slate-400 flex items-center justify-center text-xs text-slate-500 font-mono">
                        [Picture]
                      </div>
                      <div className="text-xs font-semibold text-slate-900">
                        <UlnInlineText text={cell} qKey={`pic_${nIdx}_${rIdx}_${cIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
                      </div>
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
          const ansCount = prevIns && prevIns.answerCount ? prevIns.answerCount : 0;

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
          return (
            <QuestionNodeView
              key={nIdx}
              node={node as UlnQuestionNode}
              nIdx={nIdx}
              answers={answers}
              answerKeys={answerKeys}
              isSubmitted={isSubmitted}
              onInputChange={handleInputChange}
              onSelectOption={handleSelectOption}
            />
          );
        }
        const textVal = 'text' in node ? (node as any).text : '';
        return (
          <div key={nIdx} className={`text-xs sm:text-sm font-normal text-slate-900 leading-relaxed ${alignClass}`}>
            <UlnInlineText text={textVal} qKey={`p_${nIdx}`} answers={answers} onInputChange={handleInputChange} isSubmitted={isSubmitted} />
          </div>
        );
      })}
    </div>
  );
});

UlnDocumentRenderer.displayName = 'UlnDocumentRenderer';
