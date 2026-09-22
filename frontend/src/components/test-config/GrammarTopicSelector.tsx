import React from 'react';
import { Check } from 'lucide-react';

interface GrammarTopicSelectorProps {
  currentTopic: string;
  availableTopics: string[];
  onChange: (topic: string) => void;
}

export const GrammarTopicSelector: React.FC<GrammarTopicSelectorProps> = ({
  currentTopic,
  availableTopics,
  onChange,
}) => {
  return (
    <div className="mt-2.5 pt-2 border-t border-white/5">
      <label className="text-[11px] font-bold text-blue-400 dark:text-blue-300 block mb-1.5 flex items-center justify-between">
        <span>Chủ Đề Ngữ Pháp Kiểm Tra:</span>
        {availableTopics.length > 1 && (
          <span className="text-[10px] text-slate-400 font-normal">Chọn 1 chủ đề hoặc tất cả</span>
        )}
      </label>
      {availableTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {availableTopics.map((topic) => {
            const isSelected = currentTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => onChange(topic)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-400'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-blue-300'
                }`}
              >
                {isSelected && <Check size={11} className="stroke-[3]" />}
                <span>{topic}</span>
              </button>
            );
          })}
          {availableTopics.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(availableTopics.join(' , '))}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                currentTopic === availableTopics.join(' , ')
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Tất cả ({availableTopics.length}) chủ đề
            </button>
          )}
        </div>
      )}
      <input
        type="text"
        value={currentTopic}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tên chủ đề ngữ pháp..."
        className="w-full px-3 py-1.5 bg-white border border-blue-200 focus:border-blue-500 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-xs"
      />
    </div>
  );
};
