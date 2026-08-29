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
      <label className="text-[11px] font-bold text-purple-300 block mb-1.5 flex items-center justify-between">
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
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] border border-purple-400'
                    : 'bg-[#151a2e] text-slate-300 hover:text-white border border-[#212c4b] hover:border-purple-500/50'
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
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'bg-white/5 text-slate-400 hover:text-white'
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
        className="w-full px-3 py-1.5 bg-[#0a0d17] border border-purple-500/30 focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
      />
    </div>
  );
};
