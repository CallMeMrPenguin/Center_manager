import React, { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { RibbonTab, PaperSize, Orientation, MarginConfig } from '../types';
import { useWordEditor } from '../hooks/useWordEditor';
import { WordRibbonToolbar } from './WordRibbonToolbar';
import { WordStatusBar } from './WordStatusBar';
import { WordRuler } from './WordRuler';
import { WordTableControls } from './WordTableControls';
import { WordMergeFieldModal } from './WordMergeFieldModal';
import { exportToDocx, importFromDocx, printDocument } from '../exportUtils';
import { showToast } from '../../../components/Toast';

interface WordDocumentEditorProps {
  initialContent?: string;
}

export const WordDocumentEditor: React.FC<WordDocumentEditorProps> = ({
  initialContent = '<p>Bắt đầu soạn thảo văn bản tại đây...</p>',
}) => {
  const [title, setTitle] = useState<string>('Văn bản 1');
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');

  // Persist only settings in localStorage as requested
  const [paperSize, setPaperSizeState] = useState<PaperSize>(() => {
    return (localStorage.getItem('word_paper_size') as PaperSize) || 'A4';
  });
  const setPaperSize = (size: PaperSize) => {
    setPaperSizeState(size);
    localStorage.setItem('word_paper_size', size);
  };

  const [orientation, setOrientationState] = useState<Orientation>(() => {
    return (localStorage.getItem('word_orientation') as Orientation) || 'portrait';
  });
  const setOrientation = (ori: Orientation) => {
    setOrientationState(ori);
    localStorage.setItem('word_orientation', ori);
  };

  const [margins, setMarginsState] = useState<MarginConfig>(() => {
    try {
      const saved = localStorage.getItem('word_margins');
      return saved ? JSON.parse(saved) : { top: 20, bottom: 20, left: 25, right: 20 };
    } catch {
      return { top: 20, bottom: 20, left: 25, right: 20 };
    }
  });
  const setMargins = (m: MarginConfig) => {
    setMarginsState(m);
    localStorage.setItem('word_margins', JSON.stringify(m));
  };

  const [zoomLevel, setZoomLevelState] = useState<number>(() => {
    const saved = localStorage.getItem('word_zoom');
    return saved ? Number(saved) : 100;
  });
  const setZoomLevel = (z: number) => {
    setZoomLevelState(z);
    localStorage.setItem('word_zoom', String(z));
  };

  const [viewMode, setViewMode] = useState<'page' | 'full'>('page');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [contentHtml, setContentHtml] = useState<string>(initialContent);

  // TipTap Editor setup
  const { editor, getWordCount, insertMergeField } = useWordEditor({
    initialContent,
    onUpdate: (html) => setContentHtml(html),
  });

  // Hotkeys: Ctrl+P to print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        printDocument();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // New Blank Document
  const handleNewDocument = () => {
    if (editor) {
      editor.commands.setContent('<p></p>');
      setContentHtml('<p></p>');
      setTitle('Văn bản mới');
      showToast('Đã mở trang văn bản mới', 'info');
    }
  };

  // Export to .docx
  const handleExportDocx = async () => {
    try {
      showToast('Đang tạo file Word (.docx)...', 'info');
      await exportToDocx(title, contentHtml, margins, orientation);
      showToast('Đã tải xuống file .docx thành công!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Lỗi khi xuất file docx', 'error');
    }
  };

  // Import .docx file
  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Đang đọc file Word...', 'info');
      const html = await importFromDocx(file);
      if (editor) {
        editor.commands.setContent(html);
        setContentHtml(html);
        setTitle(file.name.replace(/\.docx$/i, ''));
      }
      showToast(`Đã mở file "${file.name}"`, 'success');
    } catch (err) {
      console.error('Import docx failed:', err);
      showToast('Không thể mở file .docx này', 'error');
    }
  };

  // Batch Replace Merge Fields
  const handleApplyMergeData = (dataMap: Record<string, string>) => {
    if (!editor) return;
    let currentHtml = editor.getHTML();
    Object.entries(dataMap).forEach(([placeholder, realValue]) => {
      currentHtml = currentHtml.split(placeholder).join(realValue);
    });
    editor.commands.setContent(currentHtml);
    setContentHtml(currentHtml);
    showToast('Đã điền thông tin học sinh vào văn bản!', 'success');
  };

  const paperWidthPx = orientation === 'landscape' ? 1060 : 794;
  const paperMinHeightPx = orientation === 'landscape' ? 750 : 1123;

  return (
    <div className="flex flex-col h-full w-full bg-[#f1f5f9] dark:bg-[#080b14] overflow-hidden select-text relative">
      {/* 1. Authentic MS Word Desktop Ribbon Toolbar */}
      <WordRibbonToolbar
        editor={editor}
        title={title}
        onTitleChange={setTitle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        paperSize={paperSize}
        onPaperSizeChange={setPaperSize}
        orientation={orientation}
        onOrientationChange={setOrientation}
        margins={margins}
        onMarginsChange={setMargins}
        onNewDocument={handleNewDocument}
        onExportDocx={handleExportDocx}
        onPrint={printDocument}
        onImportDocx={handleImportDocx}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
      />

      {/* 2. Contextual Table Controls Floating Bar (only visible when in table) */}
      {editor?.can().deleteTable() && (
        <div className="bg-slate-50 dark:bg-[#0c0f1e] border-b border-blue-500/30 px-4 py-1 flex justify-center shrink-0 relative z-20">
          <WordTableControls editor={editor} />
        </div>
      )}

      {/* 3. Main Editor Workspace Container */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-[#e8ecef] dark:bg-[#060810] relative z-10 scrollbar-thin">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="pb-20 flex flex-col items-center"
        >
          {/* Authentic Document Ruler (flush directly onto paper top) */}
          {viewMode === 'page' && (
            <WordRuler
              margins={margins}
              paperWidthMm={orientation === 'landscape' ? 297 : 210}
              paperWidthPx={paperWidthPx}
            />
          )}

          {/* Authentic A4 Paper Sheet */}
          <div
            className={`bg-white text-slate-900 transition-all ${
              viewMode === 'page'
                ? 'border-x border-b border-slate-300 dark:border-white/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_20px_40px_-4px_rgba(15,23,42,0.16),0_0_0_1px_rgba(15,23,42,0.05)] rounded-b-[2px]'
                : 'w-full max-w-5xl rounded-lg shadow-lg border border-slate-300 dark:border-white/10'
            }`}
            style={{
              width: viewMode === 'page' ? `${paperWidthPx}px` : '100%',
              minHeight: viewMode === 'page' ? `${paperMinHeightPx}px` : '800px',
              paddingTop: `${margins.top}mm`,
              paddingBottom: `${margins.bottom}mm`,
              paddingLeft: `${margins.left}mm`,
              paddingRight: `${margins.right}mm`,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      {/* 4. Bottom Status Bar */}
      <WordStatusBar
        wordCount={getWordCount()}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'page' ? 'full' : 'page')}
      />

      {/* 5. Merge Field Modal */}
      <WordMergeFieldModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onInsertField={(key) => insertMergeField(key)}
        onApplyMergeData={handleApplyMergeData}
      />
    </div>
  );
};
