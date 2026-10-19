import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Layers } from 'lucide-react';
import { ComponentSourceItem } from '../types';
import { showToast } from '../../../components/Toast';

interface CodeViewerModalProps {
  item: ComponentSourceItem | null;
  onClose: () => void;
}

type TabType = 'usage' | 'source' | 'types' | 'install';

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('source');
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'usage':
        return item.usageCode;
      case 'source':
        return item.sourceCode;
      case 'types':
        return item.typesCode || '// Không có file types.ts riêng cho component này.';
      case 'install':
        return item.dependencies.length > 0
          ? `npm install ${item.dependencies.join(' ')}`
          : '# Component này dùng thuần React / TailwindCSS, không cần cài thêm npm package.';
      default:
        return item.sourceCode;
    }
  };

  const handleCopy = () => {
    const code = getActiveCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast(`Đã sao chép mã (${activeTab.toUpperCase()}) của ${item.title}!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const activeContent = getActiveCode();
  const lineCount = activeContent.split('\n').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#0d1017] text-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <FileCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs text-blue-300 font-bold">
                  {item.filename}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer border-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls & Copy Button */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#131620] border-b border-white/5 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-0 ${
                activeTab === 'source'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Mã nguồn file ({item.filename})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('usage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-0 ${
                activeTab === 'usage'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Ví dụ sử dụng
            </button>

            {item.typesCode && (
              <button
                type="button"
                onClick={() => setActiveTab('types')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-0 flex items-center gap-1 ${
                  activeTab === 'types'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers size={12} />
                <span>Kiểu dữ liệu Types</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('install')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-0 flex items-center gap-1 ${
                activeTab === 'install'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal size={12} />
              <span>Gói cài đặt (npm)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500">
              {lineCount} dòng | {activeContent.length} ký tự
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer border-0 shadow-xs active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Sao chép mã nguồn</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content Box */}
        <div className="flex-1 overflow-auto p-4 bg-[#090b10] font-mono text-xs text-slate-200 select-text">
          <pre className="overflow-x-auto leading-relaxed">
            <code>{activeContent}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-[#11141c] border-t border-white/5 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {activeTab === 'source'
              ? `Bạn có thể tạo file src/components/${item.category}/${item.filename} và dán nội dung này vào dự án mới.`
              : activeTab === 'usage'
              ? 'Dán đoạn mã ví dụ trên vào bất kỳ component React nào để sử dụng.'
              : activeTab === 'types'
              ? `Tạo file src/components/${item.category}/types.ts để định nghĩa kiểu dữ liệu.`
              : 'Chạy lệnh trên tại thư mục gốc của dự án frontend.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold cursor-pointer border-0 text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
