import React, { memo } from 'react';
import { UlnQuestionNode } from '../utils/ulnParser';
import { UlnInlineText, InlineInput } from './UlnInlineText';
import { cleanOptionPrefix } from '../../../utils';
import { checkAnswerCorrect, normalizeAnswerText } from '../utils/answerKeyEvaluator';

interface QuestionNodeViewProps {
  node: UlnQuestionNode;
  nIdx: number;
  answers: Record<string, string>;
  answerKeys?: Record<string, string>;
  isSubmitted?: boolean;
  showAnswerKeys?: boolean;
  isAssigned?: boolean;
  onInputChange: (key: string, val: string) => void;
  onSelectOption: (qKey: string, opt: string) => void;
}

export const QuestionNodeView: React.FC<QuestionNodeViewProps> = memo(({
  node,
  nIdx,
  answers,
  answerKeys = {},
  isSubmitted = false,
  showAnswerKeys = true,
  isAssigned = true,
  onInputChange,
  onSelectOption,
}) => {
  const qKey = `q_${nIdx}_${node.qNum || nIdx}`;
  const currentAns = answers[qKey] || answers[node.qNum || ''] || '';
  const qNumKey = node.qNum || String(nIdx);
  const keyForThisQ = answerKeys[qNumKey] || answerKeys[String(nIdx)];

  const isQuestionCorrect = keyForThisQ && currentAns ? checkAnswerCorrect(currentAns, keyForThisQ) : false;

  const maxOptLen = Math.max(...(node.options || []).map((o) => cleanOptionPrefix(o).length), 0);
  const optGridClass = maxOptLen > 48 ? 'grid-cols-1' : maxOptLen > 24 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
  const hasNoBlankOrOpts = (!node.options || node.options.length === 0) && !node.hasWritingLine && !node.text.includes('<blank>') && !node.subText && (!node.subParagraphs || node.subParagraphs.length === 0);
  const hasText = !!node.text && node.text.trim().length > 0;
  const isDisabled = isSubmitted || !isAssigned;

  return (
    <div
      id={`q_target_${nIdx}`}
      className={`py-1 px-0.5 scroll-mt-20 font-normal transition-all ${
        !isAssigned ? 'opacity-40 grayscale pointer-events-none select-none' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {node.qNum && (
          <span className={`font-bold text-xs sm:text-sm text-rose-600 shrink-0 min-w-[22px] text-right ${hasText ? 'pt-0.5' : 'pt-1'}`}>
            {node.qNum}.
          </span>
        )}
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Question Text */}
          {hasText && (
            <div className="text-xs sm:text-sm font-normal text-slate-900 leading-relaxed pt-0.5">
              <UlnInlineText text={node.text} qKey={qKey} answers={answers} onInputChange={onInputChange} isSubmitted={isDisabled} />
            </div>
          )}

          {/* Sub-Paragraphs (Letter, Arrangement, Dialogue Lines) */}
          {node.subParagraphs && node.subParagraphs.length > 0 && (
            <div className="space-y-1 py-1.5 px-3 text-xs sm:text-sm text-slate-800 font-normal bg-slate-50/70 rounded-xl border border-slate-200">
              {node.subParagraphs.map((para, pIdx) => {
                const isSalutation = /^(Dear|Yours sincerely|Sincerely|Best regards|Thanks)/i.test(para.trim());
                return (
                  <div
                    key={pIdx}
                    className={`${
                      isSalutation
                        ? 'font-bold text-slate-900 italic py-0.5'
                        : 'leading-relaxed text-slate-800 py-0.5'
                    }`}
                  >
                    <UlnInlineText
                      text={para}
                      qKey={`${qKey}_para_${pIdx}`}
                      answers={answers}
                      onInputChange={onInputChange}
                      isSubmitted={isDisabled}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {node.subText && (
            <div className="text-xs sm:text-sm font-normal text-slate-800 pl-2 border-l-2 border-slate-400">
              <UlnInlineText text={node.subText} qKey={`${qKey}_sub`} answers={answers} onInputChange={onInputChange} isSubmitted={isDisabled} />
            </div>
          )}

          {hasNoBlankOrOpts && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Trả lời:</span>
              <InlineInput inputKey={`${qKey}_direct`} initialVal={answers[`${qKey}_direct`] || ''} disabled={isDisabled} onCommit={onInputChange} />
            </div>
          )}

          {node.hasWritingLine && (
            <div className="pt-0.5">
              <InlineInput inputKey={`${qKey}_write`} initialVal={answers[`${qKey}_write`] || ''} disabled={isDisabled} onCommit={onInputChange} />
            </div>
          )}

          {/* Multiple Choice Options */}
          {node.options && node.options.length > 0 && (
            <div className={`grid ${optGridClass} gap-2 ${hasText || (node.subParagraphs && node.subParagraphs.length > 0) ? 'pt-1.5' : 'pt-0'} font-normal`}>
              {node.options.map((opt, optIdx) => {
                const optLetter = String.fromCharCode(65 + optIdx);
                const cleanText = cleanOptionPrefix(opt);
                const cleanUser = normalizeAnswerText(currentAns);
                const cleanOpt = normalizeAnswerText(cleanText);

                const isSelected =
                  cleanUser === optLetter.toLowerCase() ||
                  cleanUser === cleanOpt ||
                  currentAns === opt ||
                  currentAns === optLetter;

                // Strict key check: if key is letter A/B/C/D, only match exact letter
                const isKey = keyForThisQ
                  ? /^[a-d](\s*\|\s*[a-d])*$/i.test(keyForThisQ.trim())
                    ? keyForThisQ
                        .split('|')
                        .map((k) => k.trim().toUpperCase())
                        .includes(optLetter)
                    : checkAnswerCorrect(cleanText, keyForThisQ) || checkAnswerCorrect(optLetter, keyForThisQ)
                  : false;

                let optClass = 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50';
                let circleClass = 'text-blue-700 bg-blue-100 group-hover:bg-blue-200';
                let badgeLabel: React.ReactNode = null;

                if (isSubmitted && showAnswerKeys && isAssigned) {
                  if (isSelected && isKey) {
                    optClass = 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-sm ring-2 ring-emerald-400';
                    circleClass = 'bg-white text-emerald-700 font-black';
                    badgeLabel = <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded bg-emerald-800 text-white shrink-0">✓ Đúng</span>;
                  } else if (isSelected && !isKey) {
                    optClass = 'bg-rose-600 border-rose-700 text-white font-bold shadow-sm ring-2 ring-rose-400';
                    circleClass = 'bg-white text-rose-700 font-black';
                    badgeLabel = <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded bg-rose-800 text-white shrink-0">✗ Sai</span>;
                  } else if (!isSelected && isKey) {
                    optClass = 'bg-emerald-50 border-2 border-dashed border-emerald-500 text-emerald-950 font-bold shadow-xs';
                    circleClass = 'bg-emerald-200 text-emerald-900 font-black';
                    badgeLabel = <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded bg-emerald-700 text-white shrink-0">★ Key</span>;
                  }
                } else if (isSelected) {
                  // User selected state: Vivid blue background with crisp pure white text
                  optClass = 'bg-[#2563eb] border-[#1d4ed8] text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-400';
                  circleClass = 'bg-white text-[#1d4ed8] font-black';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelectOption(qKey, optLetter)}
                    className={`text-left flex items-center gap-2 transition cursor-pointer py-2 px-3 rounded-xl border text-xs sm:text-sm group ${optClass}`}
                  >
                    <span
                      className={`w-6 h-6 min-w-[24px] rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${circleClass}`}
                    >
                      {optLetter}
                    </span>
                    <span className="flex-1 break-words leading-tight">
                      <UlnInlineText
                        text={cleanText}
                        qKey={`${qKey}_opt_${optIdx}`}
                        answers={answers}
                        onInputChange={onInputChange}
                        isSubmitted={isDisabled}
                      />
                    </span>
                    {badgeLabel}
                  </button>
                );
              })}
            </div>
          )}

          {/* Submission Answer vs Key Feedback Strip */}
          {isSubmitted && showAnswerKeys && keyForThisQ && isAssigned && (
            <div className={`mt-2 p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              isQuestionCorrect
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium'
                : 'bg-rose-50/90 border-rose-300 text-rose-950 font-medium'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold">{isQuestionCorrect ? '✅ Trả lời đúng' : '❌ Trả lời sai'}</span>
                <span className="text-slate-400">|</span>
                <span>Đã chọn: <strong className={isQuestionCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{currentAns || 'Chưa làm'}</strong></span>
              </div>
              {!isQuestionCorrect && (
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <span>Đáp án đúng:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-mono border border-emerald-400">
                    {keyForThisQ}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

QuestionNodeView.displayName = 'QuestionNodeView';
