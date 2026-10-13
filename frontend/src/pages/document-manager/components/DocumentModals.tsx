import React from 'react';
import { SelectOption } from '../../../components/CustomSelect';
import { DocumentItem, FolderTreeNode, DocumentAttachment } from '../types';
import { DocumentFolderModal } from './DocumentFolderModal';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentMoveModal } from './DocumentMoveModal';
import { DocumentTagsModal } from './DocumentTagsModal';
import { AttachmentDrawer } from './AttachmentDrawer';
import { MediaPlayerPopup } from './MediaPlayerPopup';
import { formatBytes, getFileIcon } from './docHelpers';

interface DocumentModalsProps {
  showFolderModal: boolean;
  onCloseFolderModal: () => void;
  newFolderName: string;
  onChangeFolderName: (name: string) => void;
  newFolderParentId: string;
  onChangeParentId: (id: string) => void;
  onCreateFolder: () => void;
  folderSelectOptions: SelectOption[];

  showUploadModal: boolean;
  onCloseUploadModal: () => void;
  uploadFiles: File[];
  onSetUploadFiles: (files: File[]) => void;
  uploadFolderId: string;
  onChangeUploadFolderId: (id: string) => void;
  uploadTags: string[];
  onChangeUploadTags: (tags: string[]) => void;
  allUniqueTags: string[];
  onUploadDocuments: () => void;
  loading: boolean;

  movingDoc: DocumentItem | null;
  onCloseMoveModal: () => void;
  folderTree: FolderTreeNode[];
  onMoveDocument: (folderId: number | null) => void;

  showBatchMoveModal: boolean;
  onCloseBatchMoveModal: () => void;
  selectedDocCount: number;
  onBatchMove: (folderId: number | null) => void;

  editingTagsDoc: DocumentItem | null;
  onCloseTagsModal: () => void;
  tempTags: string[];
  onChangeTempTags: (tags: string[]) => void;
  onUpdateTags: () => void;

  showBatchTagsModal: boolean;
  onCloseBatchTagsModal: () => void;
  batchTags: string[];
  onChangeBatchTags: (tags: string[]) => void;
  onBatchUpdateTags: () => void;

  activeDocForAttachments: DocumentItem | null;
  onCloseAttachments: () => void;
  attachmentFile: File | null;
  onSetAttachmentFile: (file: File | null) => void;
  onUploadAttachment: () => void;
  onDeleteAttachment: (att: DocumentAttachment) => void;
  onOpenFileNative: (filepath: string) => void;
  onPlayMedia: (url: string, type: 'audio' | 'video', name: string) => void;

  activeMediaPlayer: { url: string; type: 'audio' | 'video'; name: string } | null;
  onCloseMediaPlayer: () => void;
}

export const DocumentModals: React.FC<DocumentModalsProps> = (props) => {
  return (
    <>
      <DocumentFolderModal
        isOpen={props.showFolderModal}
        onClose={props.onCloseFolderModal}
        folderName={props.newFolderName}
        onChangeFolderName={props.onChangeFolderName}
        parentId={props.newFolderParentId}
        onChangeParentId={props.onChangeParentId}
        onSubmit={props.onCreateFolder}
        parentOptions={props.folderSelectOptions}
      />

      <DocumentUploadModal
        isOpen={props.showUploadModal}
        onClose={props.onCloseUploadModal}
        uploadFiles={props.uploadFiles}
        onSetUploadFiles={props.onSetUploadFiles}
        uploadFolderId={props.uploadFolderId}
        onChangeFolderId={props.onChangeUploadFolderId}
        uploadTags={props.uploadTags}
        onChangeTags={props.onChangeUploadTags}
        folderOptions={props.folderSelectOptions}
        availableTags={props.allUniqueTags}
        onSubmit={props.onUploadDocuments}
        loading={props.loading}
      />

      <DocumentMoveModal
        isOpen={!!props.movingDoc}
        onClose={props.onCloseMoveModal}
        movingDoc={props.movingDoc}
        selectedCount={1}
        folderTree={props.folderTree}
        onMove={props.onMoveDocument}
      />

      <DocumentMoveModal
        isOpen={props.showBatchMoveModal}
        onClose={props.onCloseBatchMoveModal}
        movingDoc={null}
        selectedCount={props.selectedDocCount}
        folderTree={props.folderTree}
        onMove={props.onBatchMove}
      />

      <DocumentTagsModal
        isOpen={!!props.editingTagsDoc}
        onClose={props.onCloseTagsModal}
        title="Sửa Nhãn Dán"
        description={`Chỉnh sửa danh sách nhãn dán cho tài liệu "${props.editingTagsDoc?.name}".`}
        tags={props.tempTags}
        onChangeTags={props.onChangeTempTags}
        availableTags={props.allUniqueTags}
        onSubmit={props.onUpdateTags}
        submitLabel="Lưu Thay Đổi"
      />

      <DocumentTagsModal
        isOpen={props.showBatchTagsModal}
        onClose={props.onCloseBatchTagsModal}
        title="Gắn Nhãn Đồng Loạt"
        description={`Thiết lập các nhãn dán chung áp dụng cho ${props.selectedDocCount} tài liệu đang chọn.`}
        tags={props.batchTags}
        onChangeTags={props.onChangeBatchTags}
        availableTags={props.allUniqueTags}
        onSubmit={props.onBatchUpdateTags}
        submitLabel="Gắn Nhãn"
      />

      <AttachmentDrawer
        document={props.activeDocForAttachments}
        onClose={props.onCloseAttachments}
        attachmentFile={props.attachmentFile}
        onSetAttachmentFile={props.onSetAttachmentFile}
        onUploadAttachment={props.onUploadAttachment}
        onDeleteAttachment={props.onDeleteAttachment}
        onOpenNative={props.onOpenFileNative}
        onPlayMedia={props.onPlayMedia}
        formatBytes={formatBytes}
        getFileIcon={getFileIcon}
      />

      <MediaPlayerPopup
        player={props.activeMediaPlayer}
        onClose={props.onCloseMediaPlayer}
      />
    </>
  );
};
