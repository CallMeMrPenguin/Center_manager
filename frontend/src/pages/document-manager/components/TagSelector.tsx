import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';

export interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
  placeholder?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onChange,
  availableTags,
  placeholder = 'Chọn hoặc nhập nhãn...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!selectedTags.includes(newTag)) {
        onChange([...selectedTags, newTag]);
      }
      setInputValue('');
    }
  };

  const filteredTags = availableTags.filter(
    (tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="w-full min-h-[38px] p-1.5 bg-white border border-slate-200 focus-within:border-blue-500 rounded-xl flex flex-wrap gap-1 items-center cursor-text shadow-xs"
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(selectedTags.filter((t) => t !== tag));
              }}
              className="hover:text-red-500 transition cursor-pointer"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400"
        />
      </div>

      {isOpen && (filteredTags.length > 0 || inputValue.trim()) && (
        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-[60] p-1 flex flex-col gap-0.5">
          {inputValue.trim() && !availableTags.includes(inputValue.trim()) && (
            <button
              type="button"
              onClick={() => {
                const newTag = inputValue.trim();
                onChange([...selectedTags, newTag]);
                setInputValue('');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-blue-600 hover:bg-slate-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={12} />
              Thêm nhãn "{inputValue.trim()}"
            </button>
          )}
          {filteredTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelectTag(tag)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
