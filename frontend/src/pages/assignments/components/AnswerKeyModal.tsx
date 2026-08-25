import React, { useState, useEffect } from 'react';
import { X, KeyRound, Plus, Trash2, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { Assignment } from '../types';
import {
  extractAnswerKeysFromUln,
  updateAnswerKeysInUln,
  gradeStudentSubmission,
} from '../utils/answerKeyEvaluator';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

interface AnswerKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSuccess: () => void;
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const [keysList, setKeysList] = useState<{ qNum: string; key: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assignment) {
      setKeysList([]);
      return;
    }
    const extracted = extractAnswerKeysFromUln(assignment.content_json || '');
    const list: { qNum: string; key: string }[] = [];
    const sortedNums = Object.keys(extracted).sort((a, b) => Number(a) - Number(b));

    if (sortedNums.length > 0) {
      sortedNums.forEach((num) => {
        list.push({ qNum: num, key: extracted[num] });
      });
    } else {
      // Default 10 placeholder items if no keys present
      for (let i = 1; i <= 10; i++) {
        list.push({ qNum: String(i), key: '' });
      }
    }
    setKeysList(list);
  }, [assignment, isOpen]);

  if (!isOpen || !assignment) return null;

  const handleKeyChange = (index: number, val: string) => {
    setKeysList((prev) => {
      const next = [...prev];
      next[index].key = val;
      return next;
    });
  };

  const handleAddQuestion = () => {
    setKeysList((prev) => {
      const nextNum = String(prev.length + 1);
      return [...prev, { qNum: nextNum, key: '' }];
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setKeysList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, i) => ({ ...item, qNum: String(i + 1) }));
    });
  };

  const handleSaveAndRegrade = async () => {
    try {
      setSaving(true);
      const keysMap: Record<string, string> = {};
      keysList.forEach((item) => {
        if (item.qNum && item.key.trim()) {
          keysMap[item.qNum] = item.key.trim();
        }
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

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Chỉnh Sửa Đáp Án & Chấm Lại</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                {assignment.title} — Cập nhật đáp án chuẩn và tự động tính lại điểm học sinh
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

        {/* Tip Box */}
        <div className="px-5 py-3 bg-[#12172b] border-b border-white/5 flex items-start gap-2.5 text-xs text-slate-300 shrink-0">
          <AlertCircle size={15} className="text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Dùng dấu <strong className="text-amber-400 font-mono">|</strong> để thêm nhiều phương án trả lời đúng (ví dụ:{' '}
            <span className="font-mono text-emerald-400">If you don't hurry | If you do not hurry</span>).
          </p>
        </div>

        {/* Question Keys List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 scrollbar-thin">
          {keysList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 bg-[#121626] border border-white/5 hover:border-white/15 rounded-xl transition"
            >
              <div className="w-10 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-mono font-black text-indigo-300 text-xs shrink-0">
                #{item.qNum}
              </div>

              <input
                type="text"
                value={item.key}
                onChange={(e) => handleKeyChange(idx, e.target.value)}
                placeholder="Nhập đáp án (VD: A hoặc word1 | word2)..."
                className="flex-1 bg-[#080b14] border border-white/10 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none font-medium"
              />

              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition cursor-pointer shrink-0"
                title="Xóa câu này"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-2 border border-dashed border-white/20 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-300 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-indigo-500/10"
          >
            <Plus size={14} />
            <span>Thêm câu hỏi tiếp theo</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-[#0c0f1e]">
          <span className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-white">{keysList.filter((k) => k.key.trim()).length}</strong> câu có đáp án
          </span>

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
