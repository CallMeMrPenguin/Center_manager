import React from 'react';
import { FileText, Download, FolderOpen, X } from 'lucide-react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

interface CompiledFilesBannerProps {
  lastCompiledFiles: any[];
  setLastCompiledFiles: (files: any[]) => void;
  triggerDownload: (url: string, filename: string) => void;
}

export const CompiledFilesBanner: React.FC<CompiledFilesBannerProps> = ({
  lastCompiledFiles,
  setLastCompiledFiles,
  triggerDownload,
}) => {
  if (!lastCompiledFiles || lastCompiledFiles.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#12182b] border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between shrink-0 shadow-lg gap-3">
      <div className="flex items-center gap-2">
        <FileText size={15} className="text-indigo-600" />
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          Đã xuất bản đề thi thành công ({lastCompiledFiles.length} mã đề)!
        </h4>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {lastCompiledFiles.map((fileItem: any, i: number) => {
          const fname = typeof fileItem === 'string' ? fileItem : fileItem.filename || '';
          if (!fname) return null;
          return (
            <div key={i} className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded-xl text-xs">
              <button
                onClick={() => triggerDownload(api.downloadFileUrl(fname), fname)}
                className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <Download size={11} />
                <span>{fname}</span>
              </button>
            </div>
          );
        })}
        <button
          onClick={async () => {
            try {
              await api.openWorkspaceFolder();
              showToast('Đang mở thư mục chứa đề thi...', 'success');
            } catch (e: any) {
              showToast('Lỗi mở thư mục: ' + e, 'error');
            }
          }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm ml-1"
        >
          <FolderOpen size={11} />
          <span>MỞ THƯ MỤC CHỨA ĐỀ</span>
        </button>
        <button onClick={() => setLastCompiledFiles([])} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer ml-1">
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
