import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Terminal, Plus, Trash2, Edit3, Check, X, Copy, Save } from 'lucide-react';
import { showToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { api } from '../api';

export interface PromptItem {
  id: string;
  title: string;
  content: string;
}

interface PromptManagerProps {
  storageKey: string;
  tabTitle: string;
  defaultPrompts: PromptItem[];
}

export default function PromptManager({ storageKey, tabTitle, defaultPrompts }: PromptManagerProps) {
  const confirm = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for adding new prompt
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Load prompts on mount from backend API with localStorage fallback
  useEffect(() => {
    let active = true;
    const loadPrompts = async () => {
      try {
        const saved = await api.getPrompts(storageKey);
        if (!active) return;
        if (saved && Array.isArray(saved) && saved.length > 0) {
          const existingIds = new Set(saved.map((p: any) => p.id));
          const missingDefaults = defaultPrompts.filter((dp) => !existingIds.has(dp.id));
          if (missingDefaults.length > 0) {
            const merged = [...saved, ...missingDefaults];
            setPrompts(merged);
            await api.savePrompts(storageKey, merged);
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } else {
            setPrompts(saved);
          }
        } else {
          // If no prompts saved on backend, check localStorage as fallback
          const localSaved = localStorage.getItem(storageKey);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              const existingIds = new Set(parsed.map((p: any) => p.id));
              const missingDefaults = defaultPrompts.filter((dp) => !existingIds.has(dp.id));
              const merged = missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
              setPrompts(merged);
              await api.savePrompts(storageKey, merged);
            } catch (e) {
              setPrompts(defaultPrompts);
              await api.savePrompts(storageKey, defaultPrompts);
            }
          } else {
            setPrompts(defaultPrompts);
            await api.savePrompts(storageKey, defaultPrompts);
          }
        }
      } catch (err) {
        console.error("Failed to load prompts from API, falling back to localStorage:", err);
        if (!active) return;
        const localSaved = localStorage.getItem(storageKey);
        if (localSaved) {
          try {
            setPrompts(JSON.parse(localSaved));
          } catch (e) {
            setPrompts(defaultPrompts);
          }
        } else {
          setPrompts(defaultPrompts);
        }
      }
    };

    loadPrompts();
    return () => {
      active = false;
    };
  }, [storageKey]);

  // Save prompts when list changes
  const savePromptsList = async (newList: PromptItem[]) => {
    setPrompts(newList);
    localStorage.setItem(storageKey, JSON.stringify(newList));
    try {
      await api.savePrompts(storageKey, newList);
    } catch (err) {
      console.error("Failed to save prompts to API:", err);
      showToast("Lỗi: Không thể lưu prompt lên máy chủ!", "error");
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      let success = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          success = true;
        } catch (e) {
          success = false;
        }
      }
      if (!success) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      if (success) {
        setCopiedId(id);
        showToast("Đã sao chép prompt vào bộ nhớ tạm!", "success");
        setTimeout(() => setCopiedId(null), 1500);
      } else {
        showToast("Không thể sao chép prompt!", "error");
      }
    } catch (err) {
      showToast("Không thể sao chép: " + err, "error");
    }
  };

  const handleAddPrompt = () => {
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title || !content) {
      showToast("Vui lòng điền đầy đủ tiêu đề và nội dung prompt!", "warning");
      return;
    }

    const newItem: PromptItem = {
      id: Date.now().toString(),
      title,
      content
    };

    const newList = [...prompts, newItem];
    savePromptsList(newList);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
    showToast("Đã thêm prompt mới thành công!", "success");
  };

  const handleStartEdit = (item: PromptItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const handleSaveEdit = (id: string) => {
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!title || !content) {
      showToast("Vui lòng điền đầy đủ tiêu đề và nội dung prompt!", "warning");
      return;
    }

    const newList = prompts.map(p => 
      p.id === id ? { ...p, title, content } : p
    );
    savePromptsList(newList);
    setEditingId(null);
    showToast("Đã lưu chỉnh sửa prompt!", "success");
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xóa prompt",
      message: "Bạn có chắc chắn muốn xóa prompt này không?",
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    const newList = prompts.filter(p => p.id !== id);
    savePromptsList(newList);
    showToast("Đã xóa prompt thành công!", "success");
  };

  return (
    <>
      {/* Prompt Action Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 shadow-sm active:scale-95"
        title={`Xem danh sách Prompt cho ${tabTitle}`}
      >
        <Terminal size={14} className="text-blue-600 group-hover:animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Prompt</span>
      </button>

      {/* Prompts Dialog Overlay */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 text-slate-800 max-h-[85vh] shadow-2xl transform-gpu transition-all duration-150 scale-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                <Terminal size={16} className="text-blue-600" />
                <span>Kho Prompt - {tabTitle}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-xl hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              
              {/* Toggle Add Prompt Form */}
              {!isAdding && editingId === null && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  <Plus size={14} className="text-blue-600" />
                  <span>Thêm Prompt Mới</span>
                </button>
              )}

              {/* Add Prompt Form */}
              {isAdding && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-3 animate-mac-dropdown">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-blue-600 uppercase">Thêm prompt mới</span>
                    <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-rose-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiêu đề:</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Prompt dịch câu tự động"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nội dung prompt:</label>
                    <textarea
                      rows={4}
                      placeholder="Nhập nội dung chi tiết của prompt..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="bg-white border border-slate-300 px-3 py-2.5 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                    />
                  </div>
                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      onClick={() => setIsAdding(false)}
                      className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-300 transition-all py-2 px-3.5 cursor-pointer active:scale-95"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddPrompt}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={12} />
                      Lưu prompt
                    </button>
                  </div>
                </div>
              )}

              {/* Prompts list */}
              <div className="flex flex-col gap-3.5">
                {prompts.length === 0 ? (
                  <div className="text-center text-slate-400 italic py-8 text-xs">
                    Chưa có prompt nào được lưu cho tab này.
                  </div>
                ) : (
                  prompts.map(p => {
                    const isEditing = editingId === p.id;
                    return (
                      <div key={p.id} className={`bg-white border border-slate-200 rounded-2xl flex flex-col shadow-xs transition-all ${isEditing ? 'p-4 gap-3' : 'p-3.5 gap-0'}`}>
                        {isEditing ? (
                          // Edit Form Mode
                          <div className="flex flex-col gap-3 animate-fade-in">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Tiêu đề:</label>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Nội dung prompt:</label>
                              <textarea
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-white border border-slate-300 px-3 py-2.5 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                              />
                            </div>
                            <div className="flex justify-end gap-2.5 pt-1">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg transition"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSaveEdit(p.id)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Save size={12} />
                                Lưu thay đổi
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Standard View Mode
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-slate-800 tracking-wide truncate" title={p.title}>
                              {p.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleCopy(p.id, p.content)}
                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                title="Sao chép prompt"
                              >
                                {copiedId === p.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                title="Sửa prompt"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer"
                                title="Xóa prompt"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
