import React, { useState, useEffect, useCallback } from 'react';
import { wordDocumentsApi, WordDocument } from '../../api/wordDocumentsApi';
import { WordDocumentList } from './components/WordDocumentList';
import { WordDocumentEditor } from './components/WordDocumentEditor';
import { importFromDocx } from './exportUtils';
import { showToast } from '../../components/Toast';

export default function WordEditorPage() {
  const [documents, setDocuments] = useState<WordDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<WordDocument | null>(null);

  // Load documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wordDocumentsApi.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Không thể tải danh sách văn bản', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Create new blank document
  const handleCreateNew = async () => {
    try {
      const res = await wordDocumentsApi.createDocument({
        title: 'Văn bản mới',
        content_html: '<p>Bắt đầu soạn thảo nội dung tại đây...</p>',
        category: 'Chung',
      });
      const newDocRes = await wordDocumentsApi.getDocument(res.id);
      setSelectedDoc(newDocRes.document);
      loadDocuments();
    } catch (err) {
      console.error('Failed to create document:', err);
      showToast('Lỗi khi tạo văn bản mới', 'error');
    }
  };

  // Create from built-in template
  const handleCreateFromTemplate = async (templateHtml: string, title: string, category: string) => {
    try {
      const res = await wordDocumentsApi.createDocument({
        title: `${title} (${new Date().toLocaleDateString('vi-VN')})`,
        content_html: templateHtml,
        category: category,
      });
      const newDocRes = await wordDocumentsApi.getDocument(res.id);
      setSelectedDoc(newDocRes.document);
      loadDocuments();
    } catch (err) {
      console.error('Failed to create from template:', err);
      showToast('Lỗi khi khởi tạo từ mẫu', 'error');
    }
  };

  // Duplicate
  const handleDuplicate = async (docId: number) => {
    try {
      await wordDocumentsApi.duplicateDocument(docId);
      showToast('Đã tạo bản sao thành công!', 'success');
      loadDocuments();
    } catch (err) {
      console.error('Failed to duplicate:', err);
      showToast('Không thể tạo bản sao', 'error');
    }
  };

  // Delete
  const handleDelete = async (docId: number) => {
    try {
      await wordDocumentsApi.deleteDocument(docId);
      showToast('Đã chuyển vào thùng rác', 'success');
      loadDocuments();
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast('Lỗi khi xóa văn bản', 'error');
    }
  };

  // Import .docx from computer
  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Đang mở file Word...', 'info');
      const html = await importFromDocx(file);
      const title = file.name.replace(/\.docx$/i, '');
      const res = await wordDocumentsApi.createDocument({
        title,
        content_html: html,
        category: 'Chung',
      });
      const newDocRes = await wordDocumentsApi.getDocument(res.id);
      setSelectedDoc(newDocRes.document);
      loadDocuments();
      showToast(`Đã mở file "${file.name}"!`, 'success');
    } catch (err) {
      console.error('Failed to import .docx:', err);
      showToast('Lỗi khi đọc file .docx', 'error');
    }
  };

  // If a document is selected, render full-featured MS Word editor
  if (selectedDoc) {
    return (
      <div className="h-full w-full overflow-hidden flex flex-col">
        <WordDocumentEditor
          document={selectedDoc}
          onBackToList={() => {
            setSelectedDoc(null);
            loadDocuments();
          }}
          onSaved={() => loadDocuments()}
        />
      </div>
    );
  }

  // Otherwise render document list
  return (
    <div className="h-full w-full flex flex-col p-6 space-y-4 bg-[#f1f5f9] dark:bg-[#09090b] text-slate-800 dark:text-slate-100 select-none font-sans overflow-hidden">
      <WordDocumentList
        documents={documents}
        loading={loading}
        onOpenDocument={async (doc) => {
          try {
            const res = await wordDocumentsApi.getDocument(doc.id);
            setSelectedDoc(res.document);
          } catch {
            setSelectedDoc(doc);
          }
        }}
        onCreateNew={handleCreateNew}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onImportDocx={handleImportDocx}
      />
    </div>
  );
}
