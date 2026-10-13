import React from 'react';
import { FolderOpen } from 'lucide-react';
import { api } from '../../api';
import { showToast } from '../../components/Toast';
import { useDocumentManager } from './hooks/useDocumentManager';
import { DocumentHeader } from './components/DocumentHeader';
import { FolderTree } from './components/FolderTree';
import { DocumentCard } from './components/DocumentCard';
import { SubfolderGrid } from './components/SubfolderGrid';
import { DocumentModals } from './components/DocumentModals';

export default function DocumentManager() {
  const dm = useDocumentManager();

  return (
    <div className="flex flex-col gap-5 p-4 max-w-7xl mx-auto w-full">
      <DocumentHeader
        breadcrumbs={dm.breadcrumbs}
        activeFolderName={dm.activeFolder?.name || ''}
        isTrash={dm.isTrash}
        searchQuery={dm.searchQuery}
        onSearchChange={dm.setSearchQuery}
        selectedTag={dm.selectedTag}
        onSelectTag={dm.setSelectedTag}
        allUniqueTags={dm.allUniqueTags}
        selectedCount={dm.selectedDocIds.length}
        onClearSelection={() => dm.setSelectedDocIds([])}
        onOpenUpload={() => {
          dm.setUploadFolderId(dm.selectedFolderId === 'null' || dm.isTrash ? '' : dm.selectedFolderId);
          dm.setUploadFiles([]);
          dm.setUploadTags([]);
          dm.setShowUploadModal(true);
        }}
        onOpenCreateFolder={() => {
          dm.setNewFolderParentId(dm.selectedFolderId !== 'null' && !dm.isTrash ? dm.selectedFolderId : '');
          dm.setNewFolderName('');
          dm.setShowFolderModal(true);
        }}
        onOpenBatchMove={() => dm.setShowBatchMoveModal(true)}
        onOpenBatchTags={() => {
          dm.setBatchTags([]);
          dm.setShowBatchTagsModal(true);
        }}
        onDeleteBatch={dm.handleBatchDelete}
      />

      <div className="flex flex-col md:flex-row gap-5 items-start">
        <div className="w-full md:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <FolderTree
            folderTree={dm.folderTree}
            selectedFolderId={dm.selectedFolderId}
            onSelectFolder={(id) => {
              dm.setSelectedFolderId(id);
              dm.setSelectedTag('');
            }}
            expandedFolderIds={dm.expandedFolderIds}
            onToggleExpand={(id, e) => {
              e.stopPropagation();
              dm.setExpandedFolderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
            }}
            onOpenCreateFolder={(parentId) => {
              dm.setNewFolderParentId(parentId !== undefined ? parentId : '');
              dm.setNewFolderName('');
              dm.setShowFolderModal(true);
            }}
            onDeleteFolder={dm.handleDeleteFolder}
            dragOverFolderId={dm.dragOverFolderId}
            onDragStartFolder={(e, id) => e.dataTransfer.setData('folderId', id.toString())}
            onDragOver={(e, id) => {
              e.preventDefault();
              dm.setDragOverFolderId(id);
            }}
            onDragLeave={() => dm.setDragOverFolderId(null)}
            onDrop={dm.handleDrop}
          />
        </div>

        <div className="flex-1 flex flex-col gap-5 w-full min-w-0">
          {dm.loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400 text-xs font-semibold">
              Đang tải danh sách tài liệu...
            </div>
          ) : dm.visibleSubfolders.length === 0 && dm.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 gap-2">
              <FolderOpen size={32} className="text-slate-300" />
              <span className="text-xs font-bold">Thư mục hiện tại không có tệp hoặc thư mục con</span>
            </div>
          ) : (
            <>
              <SubfolderGrid
                subfolders={dm.visibleSubfolders}
                isTrash={dm.isTrash}
                dragOverFolderId={dm.dragOverFolderId}
                onSelectFolder={(id) => {
                  dm.setSelectedFolderId(id);
                  dm.setSelectedTag('');
                }}
                onRestoreFolder={dm.handleRestoreFolder}
                onPermanentDeleteFolder={dm.handlePermanentDeleteFolder}
                onDeleteFolder={dm.handleDeleteFolder}
                onDragStart={(e, id) => e.dataTransfer.setData('folderId', id.toString())}
                onDragOver={(e, id) => dm.setDragOverFolderId(id)}
                onDragLeave={() => dm.setDragOverFolderId(null)}
                onDrop={dm.handleDrop}
              />

              {dm.documents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tài liệu ({dm.documents.length})
                    </h3>
                    {!dm.isTrash && (
                      <button
                        onClick={() =>
                          dm.setSelectedDocIds(
                            dm.selectedDocIds.length === dm.documents.length ? [] : dm.documents.map((d) => d.id)
                          )
                        }
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold transition cursor-pointer"
                      >
                        {dm.selectedDocIds.length === dm.documents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dm.documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        isSelected={dm.selectedDocIds.includes(doc.id)}
                        isTrash={dm.isTrash}
                        onToggleSelect={(id) =>
                          dm.setSelectedDocIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                        }
                        onOpenFileNative={(fp) => api.openLocalFile(fp)}
                        onOpenAttachments={dm.setActiveDocForAttachments}
                        onEditTags={(d) => {
                          dm.setEditingTagsDoc(d);
                          dm.setTempTags(d.tags ? d.tags.split(',').map((t) => t.trim()) : []);
                        }}
                        onDelete={dm.handleDeleteDocument}
                        onRestore={dm.handleRestoreDocument}
                        onPermanentDelete={dm.handlePermanentDeleteDocument}
                        onDragStart={(e, id) => e.dataTransfer.setData('docId', id.toString())}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DocumentModals
        showFolderModal={dm.showFolderModal}
        onCloseFolderModal={() => dm.setShowFolderModal(false)}
        newFolderName={dm.newFolderName}
        onChangeFolderName={dm.setNewFolderName}
        newFolderParentId={dm.newFolderParentId}
        onChangeParentId={dm.setNewFolderParentId}
        onCreateFolder={dm.handleCreateFolder}
        folderSelectOptions={dm.folderSelectOptions}
        showUploadModal={dm.showUploadModal}
        onCloseUploadModal={() => dm.setShowUploadModal(false)}
        uploadFiles={dm.uploadFiles}
        onSetUploadFiles={dm.setUploadFiles}
        uploadFolderId={dm.uploadFolderId}
        onChangeUploadFolderId={dm.setUploadFolderId}
        uploadTags={dm.uploadTags}
        onChangeUploadTags={dm.setUploadTags}
        allUniqueTags={dm.allUniqueTags}
        onUploadDocuments={dm.handleUploadDocuments}
        loading={dm.loading}
        movingDoc={dm.movingDoc}
        onCloseMoveModal={() => dm.setMovingDoc(null)}
        folderTree={dm.folderTree}
        onMoveDocument={dm.handleMoveDocument}
        showBatchMoveModal={dm.showBatchMoveModal}
        onCloseBatchMoveModal={() => dm.setShowBatchMoveModal(false)}
        selectedDocCount={dm.selectedDocIds.length}
        onBatchMove={dm.handleBatchMove}
        editingTagsDoc={dm.editingTagsDoc}
        onCloseTagsModal={() => dm.setEditingTagsDoc(null)}
        tempTags={dm.tempTags}
        onChangeTempTags={dm.setTempTags}
        onUpdateTags={async () => {
          if (!dm.editingTagsDoc) return;
          try {
            const res = await api.updateDocumentTags(dm.editingTagsDoc.id, dm.tempTags.join(','));
            if (res.success) {
              showToast('Cập nhật nhãn thành công!', 'success');
              dm.setEditingTagsDoc(null);
              dm.fetchDocuments();
            }
          } catch (err: any) {
            showToast('Không thể cập nhật nhãn: ' + (err.message || err), 'error');
          }
        }}
        showBatchTagsModal={dm.showBatchTagsModal}
        onCloseBatchTagsModal={() => dm.setShowBatchTagsModal(false)}
        batchTags={dm.batchTags}
        onChangeBatchTags={dm.setBatchTags}
        onBatchUpdateTags={dm.handleBatchUpdateTags}
        activeDocForAttachments={dm.activeDocForAttachments}
        onCloseAttachments={() => dm.setActiveDocForAttachments(null)}
        attachmentFile={dm.attachmentFile}
        onSetAttachmentFile={dm.setAttachmentFile}
        onUploadAttachment={dm.handleUploadAttachment}
        onDeleteAttachment={dm.handleDeleteAttachment}
        onOpenFileNative={(fp) => api.openLocalFile(fp)}
        onPlayMedia={(url, type, name) => dm.setActiveMediaPlayer({ url, type, name })}
        activeMediaPlayer={dm.activeMediaPlayer}
        onCloseMediaPlayer={() => dm.setActiveMediaPlayer(null)}
      />
    </div>
  );
}
