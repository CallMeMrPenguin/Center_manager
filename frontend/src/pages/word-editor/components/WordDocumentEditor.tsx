import React, { useState, useEffect, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { WordDocument } from '../../../api/wordDocumentsApi';
import { RibbonTab, PaperSize, Orientation, MarginConfig } from '../types';
import { useWordEditor } from '../hooks/useWordEditor';
import { useAutoSave } from '../hooks/useAutoSave';
import { WordRibbonToolbar } from './WordRibbonToolbar';
import { WordStatusBar } from './WordStatusBar';
import { WordRuler } from './WordRuler';
import { WordTableControls } from './WordTableControls';
import { WordMergeFieldModal } from './WordMergeFieldModal';
import { exportToDocx, importFromDocx, printDocument } from '../exportUtils';
import { showToast } from '../../../components/Toast';

interface WordDocumentEditorProps {
  document: WordDocument;
  onBackToList: () => void;
  onSaved?: (docId: number) => void;
}

export const WordDocumentEditor: React.FC<WordDocumentEditorProps> = ({
  document: initialDoc,
  onBackToList,
  onSaved,
}) => {
  const [title, setTitle] = useState(initialDoc.title);
  const [category] = useState(initialDoc.category || 'Chung');
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [paperSize, setPaperSize] = useState<PaperSize>((initialDoc.paper_size as PaperSize) || 'A4');
  const [orientation, setOrientation] = useState<Orientation>((initialDoc.orientation as Orientation) || 'portrait');
  const [margins, setMargins] = useState<MarginConfig>(() => {
    try {
      return initialDoc.margins ? JSON.parse(initialDoc.margins) : { top: 20, bottom: 20, left: 25, right: 20 };
    } catch {
      return { top: 20, bottom: 20, left: 25, right: 20 };
    }
  });

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'page' | 'full'>('page');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [contentHtml, setContentHtml] = useState(initialDoc.content_html || '');

  // 1. TipTap Editor setup
  const { editor, getWordCount, insertMergeField } = useWordEditor({
    initialContent: initialDoc.content_html || '',
    onUpdate: (html) => setContentHtml(html),
  });

  // 2. Debounced auto-save hook
  const { saveStatus, lastSavedAt, saveNow } = useAutoSave({
    docId: initialDoc.id,
    title,
    contentHtml,
    category,
    margins,
    orientation,
    paperSize,
    onSaved,
  });

  // 3. Hotkeys: Ctrl+S to save, Ctrl+P to print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow().then((ok) => {
          if (ok) showToast('Đã lưu văn bản thành công', 'success');
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        printDocument();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveNow]);

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
    <div className="flex flex-col h-full w-full bg-[#f1f5f9] dark:bg-[#080b14] overflow-hidden select-text">
      {/* 1. MS Word Ribbon Toolbar */}
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
        onSaveNow={() => saveNow().then((ok) => ok && showToast('Đã lưu văn bản', 'success'))}
        onExportDocx={handleExportDocx}
        onPrint={printDocument}
        onImportDocx={handleImportDocx}
        onBackToList={onBackToList}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
      />

      {/* 2. Horizontal Ruler & Contextual Table Controls */}
      <div className="bg-slate-100 dark:bg-[#0b0e1b] border-b border-slate-200 dark:border-white/5 px-4 flex flex-col items-center gap-1 shrink-0">
        {viewMode === 'page' && <WordRuler margins={margins} paperWidthMm={orientation === 'landscape' ? 297 : 210} />}
        <WordTableControls editor={editor} />
      </div>

      {/* 3. Main Editor Workspace Container */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-200/70 dark:bg-[#060810] relative">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="pb-16"
        >
          {/* A4 Paper Sheet */}
          <div
            className={`bg-white text-slate-900 rounded-sm shadow-xl transition-all ${
              viewMode === 'page' ? 'border border-slate-300 dark:border-slate-700 shadow-slate-400/25 dark:shadow-black/80' : 'w-full max-w-5xl'
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
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'page' ? 'full' : 'page')}
        onSaveNow={() => saveNow().then((ok) => ok && showToast('Đã lưu văn bản', 'success'))}
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
