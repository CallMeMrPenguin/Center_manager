import React, { useState } from 'react';
import { Plus, X, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { TAB_DEFINITIONS } from '../../../config/tabs';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRoles: string[];
  onSuccess: (roleName: string) => void;
}

export const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  existingRoles,
  onSuccess,
}) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    const defaultTabs = ['dashboard', 'students', 'classes', 'schedule', 'reports'];
    TAB_DEFINITIONS.forEach((t) => {
      init[t.id] = defaultTabs.includes(t.id);
    });
    return init;
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    TAB_DEFINITIONS.forEach((t) => {
      updated[t.id] = select;
    });
    setSelectedTabs(updated);
  };

  const handleApplyTemplate = (template: 'teacher' | 'assistant' | 'accountant') => {
    const updated: Record<string, boolean> = {};
    TAB_DEFINITIONS.forEach((t) => {
      if (template === 'teacher') {
        const restricted = ['payments', 'invoices', 'users-roles', 'settings', 'ui-showcase'];
        updated[t.id] = !restricted.includes(t.id);
      } else if (template === 'assistant') {
        const allowed = ['dashboard', 'students', 'classes', 'schedule', 'assignments', 'results', 'file-manager', 'reports'];
        updated[t.id] = allowed.includes(t.id);
      } else if (template === 'accountant') {
        const allowed = ['dashboard', 'payments', 'invoices', 'reports'];
        updated[t.id] = allowed.includes(t.id);
      }
    });
    setSelectedTabs(updated);
  };

  const toggleTab = (tabId: string) => {
    setSelectedTabs((prev) => ({
      ...prev,
      [tabId]: !prev[tabId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = roleName.trim();
    if (!cleanName) {
      setErrorMessage('Vui lòng nhập tên vai trò');
      return;
    }

    const isDuplicate = existingRoles.some(
      (r) => r.toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(`Vai trò "${cleanName}" đã tồn tại trong hệ thống`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      await api.createRole(cleanName, description.trim());

      const permissionsList = TAB_DEFINITIONS.map((t) => ({
        role: cleanName,
        tab_id: t.id,
        can_access: selectedTabs[t.id] ? 1 : 0,
      }));

      await api.saveRolePermissions(permissionsList);

      const count = Object.values(selectedTabs).filter(Boolean).length;
      showToast(`Đã tạo vai trò "${cleanName}" và cấp quyền ${count} tính năng!`, 'success');

      setRoleName('');
      setDescription('');
      onSuccess(cleanName);
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err);
      try {
        const parsed = JSON.parse(msg);
        setErrorMessage(parsed.detail || msg);
      } catch {
        setErrorMessage(msg.replace('Error: ', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.values(selectedTabs).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-[#111728] border border-slate-200 dark:border-[#212c4b] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-[#161d30]">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Thêm Vai Trò Mới
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Tạo vai trò và phân quyền các tính năng được phép truy cập
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên Vai Trò <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Ví dụ: Tư vấn viên, Quản lý học vụ, Trưởng bộ môn..."
              className="w-full bg-slate-50 dark:bg-[#0c0f1e] border border-slate-300 dark:border-[#212c4b] focus:border-blue-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-xs"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mô Tả Vai Trò (Tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Tiếp nhận học sinh mới và theo dõi học phí"
              className="w-full bg-slate-50 dark:bg-[#0c0f1e] border border-slate-300 dark:border-[#212c4b] focus:border-blue-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-xs"
            />
          </div>

          {/* Permission Assignment Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Cấp Quyền Truy Cập Tab ({selectedCount}/{TAB_DEFINITIONS.length})
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Chọn các tab mà vai trò này được phép nhìn thấy trên menu
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 font-bold transition cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Template Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Mẫu nhanh:</span>
              <button
                type="button"
                onClick={() => handleApplyTemplate('teacher')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/30 font-bold transition cursor-pointer"
              >
                Giống Giáo viên
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('assistant')}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 font-bold transition cursor-pointer"
              >
                Giống Trợ giảng
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('accountant')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 font-bold transition cursor-pointer"
              >
                Giống Kế toán
              </button>
            </div>

            {/* Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto scrollbar-thin p-1">
              {TAB_DEFINITIONS.map((tab) => {
                const Icon = tab.icon;
                const isChecked = !!selectedTabs[tab.id];

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => toggleTab(tab.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-400 dark:border-blue-500/40 text-blue-900 dark:text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-[#0c0f1e] border-slate-200 dark:border-[#212c4b] text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="shrink-0">
                      {isChecked ? (
                        <CheckSquare size={15} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square size={15} className="text-slate-400 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="w-5 h-5 rounded-md bg-slate-200/60 dark:bg-white/5 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
                      <Icon size={12} />
                    </div>
                    <span className="text-xs font-bold truncate flex-1">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'Đang tạo & cấp quyền...' : 'Tạo Vai Trò & Cấp Quyền'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
