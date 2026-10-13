import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { LayoutSettings } from '../../types';
import PromptManager from '../../components/PromptManager';
import { useConfirm } from '../../components/ConfirmDialog';
import { 
  FileText, Download, Settings, 
  ChevronRight, Upload, AlertCircle, FileCode, CheckCircle
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { cleanOptionPrefix } from '../../utils';
import { 
  DEFAULT_TEST_FORMATTER_PROMPTS, 
  DEFAULT_LAYOUT 
} from './constants';
import { ConfigDrawer } from './components/ConfigDrawer';
import { ExportModal } from './components/ExportModal';
import { FastJsonEditor } from './components/FastJsonEditor';
import { CompiledFilesBanner } from './components/CompiledFilesBanner';
import { PdfPreviewPanel } from './components/PdfPreviewPanel';

export default function TestFormatter() {
  const confirm = useConfirm();
  const [jsonText, setJsonText] = useState<string>('{\n  "data": []\n}');
  const [exercisesData, setExercisesData] = useState<any[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [layout, setLayout] = useState<LayoutSettings>(DEFAULT_LAYOUT);
  const [profiles, setProfiles] = useState<Record<string, LayoutSettings>>({});
  const [activeProfile, setActiveProfile] = useState<string>('Mặc định');
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const [numVersions] = useState<number>(1);
  const [mixOptions, setMixOptions] = useState<boolean>(true);
  const [grade] = useState<string>('');
  const [unit] = useState<string>('');
  const [saveToDocs] = useState<boolean>(false);
  const [saveFolderId] = useState<string>('');

  const [compiling, setCompiling] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [lastCompiledFiles, setLastCompiledFiles] = useState<any[]>([]);

  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState<number>(100);

  const [exportConfig, setExportConfig] = useState<{
    platform: 'kahoot' | 'quizizz' | 'excel_full';
    defaultTime: number;
    defaultPoints: number;
    testTitle: string;
  }>({
    platform: 'kahoot',
    defaultTime: 30,
    defaultPoints: 1,
    testTitle: 'English Test',
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await api.getProfiles();
      if (res) setProfiles(res);
    } catch {
      // ignore
    }
  };

  const handleProfileChange = (name: string) => {
    setActiveProfile(name);
    if (name === 'Mặc định') {
      setLayout(DEFAULT_LAYOUT);
    } else if (profiles[name]) {
      setLayout(profiles[name]);
    }
  };

  const handleDeleteProfile = async () => {
    if (activeProfile === 'Mặc định') return;
    const isConfirmed = await confirm({
      title: 'Xóa cấu hình?',
      message: `Bạn có muốn xóa cấu hình '${activeProfile}'?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.deleteProfile(activeProfile);
      showToast(`Đã xóa cấu hình '${activeProfile}'`, 'success');
      setActiveProfile('Mặc định');
      setLayout(DEFAULT_LAYOUT);
      loadProfiles();
    } catch (e: any) {
      showToast('Lỗi xóa cấu hình: ' + e, 'error');
    }
  };

  const handleParsedDataChange = (data: any[], error: string | null) => {
    setExercisesData(data);
    setJsonError(error);
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      showToast(`Đã nạp tệp: ${file.name}`, 'success');
    };
    reader.readAsText(file);
  };

  const handleDocxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast(`Đang tải lên và chuyển đổi tệp: ${file.name}...`, 'warning');
      const uploadRes = await api.uploadFile(file);
      if (uploadRes.success && uploadRes.filename) {
        const convertRes = await api.convertDocx(uploadRes.filename);
        if (convertRes.success && convertRes.exercises) {
          const cleaned = Array.isArray(convertRes.exercises)
            ? convertRes.exercises.map((ex: any) => ({
                ...ex,
                o: Array.isArray(ex.o) ? ex.o.map((o: any) => cleanOptionPrefix(String(o))) : ex.o,
                k: Array.isArray(ex.k)
                  ? ex.k.map((sub: any) => ({
                      ...sub,
                      o: Array.isArray(sub.o) ? sub.o.map((o: any) => cleanOptionPrefix(String(o))) : sub.o,
                    }))
                  : ex.k,
              }))
            : convertRes.exercises;
          setJsonText(JSON.stringify(cleaned, null, 2));
          showToast(`Đã chuyển đổi thành công tệp ${file.name} sang JSON!`, 'success');
        } else {
          showToast('Chuyển đổi thất bại.', 'error');
        }
      }
    } catch (err: any) {
      showToast('Lỗi chuyển đổi DOCX: ' + (err.message || err), 'error');
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCompileAndDownload = async () => {
    if (jsonError || exercisesData.length === 0) {
      showToast('Vui lòng sửa lỗi JSON trước khi biên dịch', 'error');
      return;
    }
    try {
      setCompiling(true);
      showToast('Đang tạo file Word...', 'warning');
      const res = await api.compileTest(
        exercisesData,
        layout,
        numVersions,
        mixOptions,
        grade,
        unit,
        saveToDocs,
        saveFolderId || null
      );
      if (res.success) {
        const filesList = res.files && res.files.length > 0 ? res.files : [{ filename: res.filename, filepath: res.filepath }];
        setLastCompiledFiles(filesList);
        filesList.forEach((fileItem: any, i: number) => {
          const fname = typeof fileItem === 'string' ? fileItem : fileItem.filename || res.filename;
          if (fname) {
            setTimeout(() => {
              triggerDownload(api.downloadFileUrl(fname), fname);
            }, i * 300);
          }
        });
        showToast(`Đã tạo và tải xuống thành công ${filesList.length} đề thi!`, 'success');
      }
    } catch (e: any) {
      showToast('Lỗi biên dịch đề thi: ' + e, 'error');
    } finally {
      setCompiling(false);
    }
  };

  const handleExportPlatform = async () => {
    if (jsonError || exercisesData.length === 0) {
      showToast('Vui lòng nhập danh sách câu hỏi hợp lệ trước', 'error');
      return;
    }
    try {
      setIsExporting(true);
      showToast('Đang xuất bảng tính...', 'warning');
      const res = await api.exportTestExcelCsv(
        exercisesData,
        exportConfig.platform === 'excel_full' ? 'xlsx' : exportConfig.platform,
        exportConfig.defaultTime,
        numVersions,
        mixOptions,
        grade,
        unit,
        saveToDocs,
        saveFolderId || null
      );
      if (res.success) {
        const filesList = res.files && res.files.length > 0 ? res.files : [{ filename: res.filename, filepath: res.filepath }];
        setLastCompiledFiles(filesList);
        filesList.forEach((fileItem: any, i: number) => {
          const fname = typeof fileItem === 'string' ? fileItem : fileItem.filename || res.filename;
          if (fname) {
            setTimeout(() => {
              triggerDownload(api.downloadFileUrl(fname), fname);
            }, i * 300);
          }
        });
        showToast(`Đã xuất và tải xuống thành công ${filesList.length} bảng tính!`, 'success');
        setShowExportModal(false);
      }
    } catch (e: any) {
      showToast('Xuất bảng tính thất bại: ' + (e.message || e), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePdfPreview = async () => {
    if (jsonError || exercisesData.length === 0) {
      showToast('Vui lòng nhập danh sách câu hỏi hợp lệ trước', 'error');
      return;
    }
    try {
      setPdfLoading(true);
      setPdfUrl(null);
      showToast('Đang tạo bản xem trước PDF...', 'warning');
      const res = await api.previewPdf(exercisesData, layout, numVersions, mixOptions, grade, unit);
      setPdfUrl(`${res.url}?t=${Date.now()}`);
      showToast('Tạo PDF xem trước thành công!', 'success');
    } catch (e: any) {
      showToast(`Không thể tạo PDF: ${e.message || e}`, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#f1f5f9] dark:bg-[#09090b] flex relative overflow-hidden select-none">
      <ConfigDrawer
        showConfig={showConfig}
        setShowConfig={setShowConfig}
        activeProfile={activeProfile}
        handleProfileChange={handleProfileChange}
        handleDeleteProfile={handleDeleteProfile}
        profiles={profiles}
        layout={layout}
        setLayout={setLayout}
        mixOptions={mixOptions}
        setMixOptions={setMixOptions}
      />

      <ExportModal
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        exportConfig={exportConfig}
        setExportConfig={setExportConfig}
        isExporting={isExporting}
        handleExportPlatform={handleExportPlatform}
      />

      <div className="flex-1 flex flex-row overflow-hidden relative">
        <section className="flex-1 flex flex-col border-r border-slate-200 dark:border-[#202842] overflow-hidden bg-slate-50 dark:bg-[#0f1322]">
          <div className="h-14 border-b border-slate-200 dark:border-[#202842] bg-white dark:bg-[#121629] flex items-center justify-between px-6 shrink-0 gap-3 relative z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-2.5 rounded-xl border-0 transition-all duration-300 flex items-center text-xs font-bold cursor-pointer ${
                  showConfig
                    ? 'bg-blue-600 text-white px-3 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#181f36] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#222a46] hover:text-slate-900 dark:hover:text-white shadow-2xs'
                }`}
                title="Căn Lề & Chữ"
              >
                <Settings size={14} className="shrink-0" />
                <span className="ml-1.5">Căn Lề & Chữ</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <PromptManager
                storageKey="prompts_test_formatter"
                tabTitle="Trình Tạo Đề Thi"
                defaultPrompts={DEFAULT_TEST_FORMATTER_PROMPTS}
              />

              <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#181f36] border-0 hover:bg-slate-200 dark:hover:bg-[#222a46] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center cursor-pointer shadow-2xs">
                <Upload size={14} className="shrink-0 mr-1.5" />
                <span>Nạp JSON</span>
                <input type="file" accept=".json" onChange={handleDirectFileUpload} className="hidden" />
              </label>

              <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#181f36] border-0 hover:bg-slate-200 dark:hover:bg-[#222a46] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center cursor-pointer shadow-2xs">
                <Upload size={14} className="text-amber-500 shrink-0 mr-1.5" />
                <span>Nhập DOCX</span>
                <input type="file" accept=".docx" onChange={handleDocxFileUpload} className="hidden" />
              </label>

              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={compiling}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center cursor-pointer shadow-sm border-0"
                >
                  <Download size={14} className={`shrink-0 mr-1.5 ${compiling ? 'animate-spin' : ''}`} />
                  <span>Xuất Đề Thi</span>
                  <ChevronRight size={12} className={`ml-1 transform transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161b2e] border border-slate-300 dark:border-white/10 rounded-xl z-30 py-2 px-2 flex flex-col gap-1 shadow-2xl animate-mac-dropdown text-[0.66rem]">
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        handleCompileAndDownload();
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition w-full text-left cursor-pointer"
                    >
                      <FileText size={13} className="text-indigo-600" />
                      <span>Tập tin Word (.docx)</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setShowExportModal(true);
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition w-full text-left cursor-pointer"
                    >
                      <FileCode size={13} className="text-emerald-600" />
                      <span>Bảng tính Excel / CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 relative flex flex-col min-h-0 bg-white dark:bg-[#0f1322] overflow-hidden">
            <FastJsonEditor initialValue={jsonText} onParsedDataChange={handleParsedDataChange} />

            <div className="absolute bottom-6 right-6 flex items-center gap-2 select-none z-10">
              {jsonError ? (
                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl shadow-lg font-bold text-xs">
                  <AlertCircle size={12} /><span className="truncate max-w-xs">{jsonError}</span>
                </div>
              ) : exercisesData.length > 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-lg font-bold text-xs">
                  <CheckCircle size={12} /><span>Hợp lệ ({exercisesData.length} câu)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <AlertCircle size={12} /><span>Trống</span>
                </div>
              )}
            </div>
          </div>

          <CompiledFilesBanner
            lastCompiledFiles={lastCompiledFiles}
            setLastCompiledFiles={setLastCompiledFiles}
            triggerDownload={triggerDownload}
          />
        </section>

        <PdfPreviewPanel
          pdfUrl={pdfUrl}
          pdfLoading={pdfLoading}
          pdfZoom={pdfZoom}
          setPdfZoom={setPdfZoom}
          handleGeneratePdfPreview={handleGeneratePdfPreview}
          hasExercises={exercisesData.length > 0}
        />
      </div>
    </div>
  );
}
