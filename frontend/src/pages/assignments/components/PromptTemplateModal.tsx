import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, FileText } from 'lucide-react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { ULN_OCR_SYSTEM_PROMPT, ULN_AI_CREATION_PROMPT } from '../constants/ulnPromptTemplate';
import { showToast } from '../../../components/Toast';

interface PromptTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptTemplateModal: React.FC<PromptTemplateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ocr' | 'ai'>('ocr');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentPrompt = activeTab === 'ocr' ? ULN_OCR_SYSTEM_PROMPT : ULN_AI_CREATION_PROMPT;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    showToast('Đã sao chép prompt thành công! Bạn có thể dán vào ChatGPT / Gemini / Claude.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-2xl w-full max-w-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Mẫu Prompt Chuẩn Trích Xuất & Sinh Đề (ULN DSL)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Selection with Segmented Control */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          <SegmentedControl<'ocr' | 'ai'>
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'ocr', label: '1. Prompt OCR & Trích Xuất Đề (Ảnh/PDF sang ULN)', icon: <FileText size={14} /> },
              { value: 'ai', label: '2. Prompt Sinh Đề Mới (AI Generator)', icon: <Sparkles size={14} /> },
            ]}
            fit="fluid"
            size="sm"
          />
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {activeTab === 'ocr'
                ? 'Dùng prompt này cho Gemini/ChatGPT kèm ảnh hoặc văn bản đề thi để xuất ra mã ULN chuẩn 100%:'
                : 'Dùng prompt này để yêu cầu AI tự động soạn mới một đề thi hoàn chỉnh:'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer active:scale-95 shadow-md shrink-0"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép Prompt'}</span>
            </button>
          </div>

          <pre className="w-full bg-[#080b14] border border-[#1e2742] rounded-xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {currentPrompt}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
