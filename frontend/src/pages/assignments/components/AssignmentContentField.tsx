import React from 'react';

interface AssignmentContentFieldProps {
  contentJson: string;
  onTextareaChange: (val: string) => void;
  onOpenPromptModal: () => void;
  onLoadSample: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  questionCount: number;
  sectionCount: number;
}

export const AssignmentContentField: React.FC<AssignmentContentFieldProps> = ({
  contentJson,
  onTextareaChange,
  onOpenPromptModal,
  onLoadSample,
  onFileUpload,
  uploading,
  questionCount,
  sectionCount,
}) => {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-bold text-slate-700">Nội dung đề bài (định dạng ULN)</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPromptModal}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Mẫu prompt
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
          >
            Nạp đề mẫu
          </button>
        </div>
      </div>

      <textarea
        rows={5}
        value={contentJson}
        onChange={(e) => onTextareaChange(e.target.value)}
        placeholder="Dán nội dung đề định dạng ULN hoặc Text vào đây..."
        className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl p-3 font-mono text-xs text-slate-900 resize-y leading-relaxed"
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition cursor-pointer">
          <span>{uploading ? 'Đang đọc...' : 'Tải file đề (.txt, .json, .uln)'}</span>
          <input type="file" accept=".txt,.json,.uln" onChange={onFileUpload} className="hidden" />
        </label>

        {questionCount > 0 && (
          <div className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
            Đã nhận diện {questionCount} câu hỏi ({sectionCount} bài)
          </div>
        )}
      </div>
    </div>
  );
};
