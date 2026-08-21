import React, { useState } from 'react';
import { Upload, Code, RefreshCw, FileText } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { cleanOptionPrefix } from '../../../utils';
import { Question, TestData } from '../types';

interface QuizImportViewProps {
  loading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDataLoaded: (data: TestData) => void;
}

export const QuizImportView: React.FC<QuizImportViewProps> = ({
  loading,
  onFileUpload,
  onDataLoaded,
}) => {
  const [importTab, setImportTab] = useState<'file' | 'json'>('file');
  const [pastedJson, setPastedJson] = useState('');

  const handleParsePastedJson = () => {
    const trimmed = pastedJson.trim();
    if (!trimmed) {
      showToast("Vui lòng dán nội dung JSON đề thi!", "warning");
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      let title = "Đề Thi Từ JSON";
      let rawQuestions: any[] = [];

      if (Array.isArray(parsed)) {
        rawQuestions = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.title) title = parsed.title;
        if (Array.isArray(parsed.questions)) {
          rawQuestions = parsed.questions;
        } else if (Array.isArray(parsed.exercises)) {
          rawQuestions = parsed.exercises;
        } else if (Array.isArray(parsed.data)) {
          rawQuestions = parsed.data;
        }
      }

      if (!rawQuestions || !rawQuestions.length) {
        showToast("Không tìm thấy danh sách câu hỏi trong dữ liệu JSON!", "error");
        return;
      }

      const topInstruction = parsed.instruction || parsed.guide || parsed.yêu_cầu || undefined;

      const questions: Question[] = rawQuestions.map((q: any, index: number) => {
        let rawQText = '';
        if (Array.isArray(q.x)) {
          rawQText = q.x.filter(Boolean).join('\n');
        } else if (typeof q.x === 'string') {
          rawQText = q.x;
        } else if (Array.isArray(q.question)) {
          rawQText = q.question.filter(Boolean).join('\n');
        } else if (typeof q.question === 'string') {
          rawQText = q.question;
        } else if (q.sentence && q.prompt) {
          const promptStr = String(q.prompt).trim().startsWith('(') ? q.prompt.trim() : `(${q.prompt.trim()})`;
          rawQText = `${q.sentence.trim()}\n${promptStr}`;
        } else if (q.sentence) {
          rawQText = q.sentence;
        } else if (q.passage) {
          rawQText = q.passage;
        } else if (q.content || q.stem) {
          rawQText = q.content || q.stem;
        } else {
          rawQText = `Câu ${index + 1}`;
        }

        const opts = q.options || q.o || [];
        const cleanedOpts = Array.isArray(opts) ? opts.map((o: any) => cleanOptionPrefix(String(o))) : [];
        let ans = String(q.answer || q.a || q.correct || '').trim();

        if (/^[A-E]$/i.test(ans) && cleanedOpts.length > 0) {
          const idx = ans.toUpperCase().charCodeAt(0) - 65;
          if (idx >= 0 && idx < cleanedOpts.length) {
            ans = cleanedOpts[idx];
          }
        }

        const qType = q.type || (q.t ? (q.t === 'fill' ? 'fill' : 'mcq') : (cleanedOpts.length > 0 ? 'mcq' : 'fill'));
        const instruction = q.instruction || (q.passage ? `Đoạn văn: ${q.passage}` : topInstruction);

        return {
          id: q.id || q.number || index + 1,
          type: qType === 'mcq' ? 'mcq' : 'fill',
          question: rawQText,
          instruction,
          options: cleanedOpts,
          answer: ans,
          explanation: q.explanation || ''
        };
      });

      onDataLoaded({ title, questions });
      showToast(`Đã nạp bài kiểm tra thành công với ${questions.length} câu hỏi!`, "success");
    } catch (err: any) {
      showToast("Cú pháp JSON không hợp lệ: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
      {/* TAB MODE TOGGLE */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-[#0c0f1d] border border-white/10 rounded-2xl w-fit mx-auto shadow-lg">
        <button
          onClick={() => setImportTab('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            importTab === 'file' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload size={15} />
          <span>Tải File (.DOCX / .JSON / .CSV)</span>
        </button>

        <button
          onClick={() => setImportTab('json')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            importTab === 'json' ? 'bg-[#5c36f5] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code size={15} />
          <span>Dán Cấu Trúc JSON</span>
        </button>
      </div>

      {importTab === 'file' ? (
        <div className="p-10 bg-[#0d1018] border border-dashed border-white/20 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(92,54,245,0.3)] mx-auto">
            <Upload size={36} />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-white">Tải Đề Thi Lên (DOCX / JSON / CSV)</h3>
            <p className="text-xs text-slate-400">
              Hỗ trợ file Word có đáp án bôi vàng trong câu hỏi hoặc bảng đáp án riêng ở cuối bài.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-6 py-3 rounded-xl font-extrabold text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
            <span>Chọn Đề Thi Từ Máy Tính</span>
            <input type="file" accept=".docx,.json,.csv" onChange={onFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="p-6 bg-[#0d1018] border border-white/10 rounded-2xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Dán Nội Dung JSON Đề Thi</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Hỗ trợ các dạng JSON mảng hoặc object đề thi</span>
          </div>

          <textarea
            rows={10}
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            placeholder={`Dán nội dung JSON đề thi vào đây, ví dụ:\n[\n  {\n    "question": "We have English lessons _____ Tuesday.",\n    "options": ["on", "up", "at", "in"],\n    "answer": "on"\n  }\n]`}
            className="w-full bg-[#060810] border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/60 leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-400">
              Gợi ý: Bạn có thể copy JSON từ ChatGPT, Claude hoặc Prompt Generator.
            </p>
            <button
              onClick={handleParsePastedJson}
              className="flex items-center gap-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-[0_4px_16px_rgba(92,54,245,0.4)] transition cursor-pointer border border-white/20 active:scale-95"
            >
              <FileText size={15} />
              <span>Nạp Đề Thi Từ JSON</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
