import React, { useState, useEffect, useMemo } from 'react';
import { X, KeyRound, Save, RefreshCw, AlertCircle, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Assignment } from '../types';
import {
  extractAnswerKeysFromUln,
  updateAnswerKeysInUln,
  gradeStudentSubmission,
} from '../utils/answerKeyEvaluator';
import { parseUlnContent, UlnQuestionNode } from '../utils/ulnParser';
import { extractUlnSections } from '../utils/ulnSectionExtractor';
import { cleanOptionPrefix } from '../../../utils';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

interface AnswerKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSuccess: () => void;
}

interface QuestionKeyItem {
  id: string; // unique key e.g. "q_nodeIdx_qNum" or "qNum"
  qNum: string;
  nodeIndex: number;
  sectionId: number;
  sectionTitle: string;
  text: string;
  options?: string[];
  key: string;
}

interface SectionGroupItem {
  sectionId: number;
  sectionTitle: string;
  questions: QuestionKeyItem[];
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const [sectionGroups, setSectionGroups] = useState<SectionGroupItem[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assignment) {
      setSectionGroups([]);
      return;
    }

    const ulnText = assignment.content_json || '';
    const nodes = parseUlnContent(ulnText);
    const sections = extractUlnSections(nodes);
    const existingKeys = extractAnswerKeysFromUln(ulnText);

    // Build question list grouped by section
    const groups: SectionGroupItem[] = [];

    sections.forEach((sec) => {
      const qItems: QuestionKeyItem[] = [];

      for (let idx = sec.startNodeIndex; idx <= sec.endNodeIndex; idx++) {
        const node = nodes[idx];
        if (node && node.type === 'question') {
          const qNode = node as UlnQuestionNode;
          const qNum = qNode.qNum || String(qItems.length + 1);
          const uniqueId = `q_${idx}_${qNum}`;

          // Resolve existing key: priority to uniqueId -> qNum -> node index
          const foundKey =
            existingKeys[uniqueId] ||
            existingKeys[qNum] ||
            existingKeys[String(idx)] ||
            '';

          qItems.push({
            id: uniqueId,
            qNum,
            nodeIndex: idx,
            sectionId: sec.id,
            sectionTitle: sec.title,
            text: (qNode.text || '').replace(/^\*\*|\*\*$/g, '').trim(),
            options: qNode.options,
            key: foundKey,
          });
        }
      }

      if (qItems.length > 0) {
        groups.push({
          sectionId: sec.id,
          sectionTitle: sec.title,
          questions: qItems,
        });
      }
    });

    // Fallback if no questions parsed
    if (groups.length === 0) {
      const defaultQuestions: QuestionKeyItem[] = [];
      for (let i = 1; i <= 10; i++) {
        defaultQuestions.push({
          id: `q_${i}_${i}`,
          qNum: String(i),
          nodeIndex: i,
          sectionId: 1,
          sectionTitle: 'Toàn bộ bài tập',
          text: `Câu hỏi số ${i}`,
          key: existingKeys[String(i)] || '',
        });
      }
      groups.push({
        sectionId: 1,
        sectionTitle: 'Toàn bộ bài tập',
        questions: defaultQuestions,
      });
    }

    setSectionGroups(groups);
  }, [assignment, isOpen]);

  if (!isOpen || !assignment) return null;

  const handleKeyChange = (sectionId: number, qId: string, val: string) => {
    setSectionGroups((prev) =>
      prev.map((group) => {
        if (group.sectionId !== sectionId) return group;
        return {
          ...group,
          questions: group.questions.map((q) => (q.id === qId ? { ...q, key: val } : q)),
        };
      })
    );
  };

  const handleQuickOptionSelect = (sectionId: number, qId: string, optLetter: string) => {
    setSectionGroups((prev) =>
      prev.map((group) => {
        if (group.sectionId !== sectionId) return group;
        return {
          ...group,
          questions: group.questions.map((q) => (q.id === qId ? { ...q, key: optLetter } : q)),
        };
      })
    );
  };

  const toggleSectionCollapse = (secId: number) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const totalQuestions = sectionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const totalKeysFilled = sectionGroups.reduce(
    (sum, g) => sum + g.questions.filter((q) => q.key.trim()).length,
    0
  );

  const handleSaveAndRegrade = async () => {
    try {
      setSaving(true);
      const keysMap: Record<string, string> = {};

      sectionGroups.forEach((group) => {
        group.questions.forEach((q) => {
          if (q.key.trim()) {
            const val = q.key.trim();
            keysMap[q.qNum] = val;
            keysMap[q.id] = val;
            keysMap[String(q.nodeIndex)] = val;
          }
        });
      });

      // 1. Update ULN content with new [ANS] block
      const newUln = updateAnswerKeysInUln(assignment.content_json || '', keysMap);
      await api.updateAssignment(assignment.id, { content_json: newUln });

      // 2. Fetch submissions & automatically recalculate scores
      try {
        const subs = await api.getAssignmentSubmissions(assignment.id);
        if (subs && subs.length > 0) {
          const maxScore = assignment.max_score || 10;
          const updatedSubs = subs.map((sub: any) => {
            if (sub.submitted === 1 && sub.answers_json) {
              try {
                const userAns = JSON.parse(sub.answers_json);
                const gradeResult = gradeStudentSubmission(userAns, keysMap, maxScore);
                return { ...sub, score: gradeResult.score };
              } catch {
                return sub;
              }
            }
            return sub;
          });
          await api.updateAssignmentSubmissions(assignment.id, updatedSubs);
        }
      } catch (subErr) {
        console.warn('Could not auto-regrade submissions:', subErr);
      }

      showToast('Đã lưu đáp án thành công và tự động tính lại điểm cho toàn bộ học sinh!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Lỗi khi lưu đáp án: ' + (err?.message || err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = sectionGroups.map((group) => {
    const qLower = searchQuery.toLowerCase().trim();
    if (!qLower) return group;
    const isSecMatch = group.sectionTitle.toLowerCase().includes(qLower);
    if (isSecMatch) return group;
    return {
      ...group,
      questions: group.questions.filter(
        (q) =>
          q.qNum.includes(qLower) ||
          q.text.toLowerCase().includes(qLower) ||
          q.key.toLowerCase().includes(qLower)
      ),
    };
  }).filter((g) => g.questions.length > 0);

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-3 sm:p-4 select-none font-sans">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0d1122]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white">Chỉnh Sửa Đáp Án & Chấm Lại</h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {totalKeysFilled}/{totalQuestions} câu có đáp án
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                {assignment.title} — Phân loại rõ từng bài tập, câu hỏi và tự động chấm lại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tip & Search Bar */}
        <div className="px-5 py-3 bg-[#121626] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <AlertCircle size={14} className="text-indigo-400 shrink-0" />
            <span>
              Dùng dấu <strong className="text-amber-400 font-mono">|</strong> để thêm nhiều phương án đúng (VD: <span className="font-mono text-emerald-400">A | B</span>).
            </span>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo số câu hoặc nội dung..."
            className="bg-[#080b14] border border-white/10 focus:border-indigo-500 rounded-lg px-3 py-1 text-xs text-white placeholder:text-slate-500 outline-none w-56 font-medium"
          />
        </div>

        {/* Section-Grouped Question Keys List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {filteredGroups.map((group) => {
            const isCollapsed = !!collapsedSections[group.sectionId];
            return (
              <div
                key={group.sectionId}
                className="rounded-2xl bg-[#0d1018] border border-[#212c4b] overflow-hidden shadow-sm"
              >
                {/* Section Header Card */}
                <div
                  onClick={() => toggleSectionCollapse(group.sectionId)}
                  className="p-3.5 bg-[#121626] border-b border-white/5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-[#161c30] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-indigo-400">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </span>
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                      Bài {group.sectionId}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {group.sectionTitle}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                    {group.questions.filter((q) => q.key.trim()).length}/{group.questions.length} câu
                  </span>
                </div>

                {/* Question Items in Section */}
                {!isCollapsed && (
                  <div className="p-3 space-y-2.5">
                    {group.questions.map((q) => {
                      const hasOptions = q.options && q.options.length > 0;
                      return (
                        <div
                          key={q.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-2.5 bg-[#121626]/70 border border-white/5 hover:border-white/15 rounded-xl transition"
                        >
                          {/* Question Number & Snippet */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center font-mono font-black text-rose-300 text-xs shrink-0">
                              #{q.qNum}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-200 line-clamp-1 font-medium">
                                {q.text || `Câu hỏi số ${q.qNum}`}
                              </p>
                            </div>
                          </div>

                          {/* Quick Multiple Choice Option Buttons (A, B, C, D) */}
                          {hasOptions && (
                            <div className="flex items-center gap-1 shrink-0">
                              {q.options!.map((opt, optIdx) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                const isCurrent =
                                  q.key.trim().toUpperCase() === letter ||
                                  cleanOptionPrefix(opt).toLowerCase() === q.key.trim().toLowerCase();
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => handleQuickOptionSelect(group.sectionId, q.id, letter)}
                                    className={`w-7 h-7 rounded-lg text-xs font-black font-mono transition cursor-pointer border flex items-center justify-center ${
                                      isCurrent
                                        ? 'bg-[#2563eb] text-white border-blue-400 shadow-sm'
                                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                                    }`}
                                    title={cleanOptionPrefix(opt)}
                                  >
                                    {letter}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Key Text Input Field */}
                          <input
                            type="text"
                            value={q.key}
                            onChange={(e) => handleKeyChange(group.sectionId, q.id, e.target.value)}
                            placeholder="Đáp án (VD: A hoặc text1 | text2)..."
                            className="w-full sm:w-56 bg-[#080b14] border border-white/10 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none font-medium font-mono"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-[#0c0f1e]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Check size={14} className="text-emerald-400" />
            <span>
              Sẵn sàng chấm điểm cho <strong>{totalKeysFilled}</strong> câu hỏi
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAndRegrade}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Đang chấm lại...' : 'Lưu Đáp Án & Chấm Lại'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
