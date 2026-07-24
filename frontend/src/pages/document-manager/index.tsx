import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../api';
import { useConfirm } from '../../components/ConfirmDialog';
import { showToast } from '../../components/Toast';
import { 
  Folder, FolderPlus, FileText, Music, Video, Archive, FileCode, FileImage,
  Trash2, Download, Upload, Plus, Search, Tag, ExternalLink,
  ChevronRight, ChevronLeft, FolderOpen, Play, X, Eye, Move, Info, CheckSquare, Square
} from 'lucide-react';

interface DocumentAttachment {
  id: number;
  document_id: number;
  filename: string;
  filepath: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface DocumentItem {
  id: number;
  name: string;
  filename: string;
  filepath: string;
  folder_id: number | null;
  file_type: string;
  file_size: number;
  tags: string;
  created_at: string;
  attachments?: DocumentAttachment[];
}

interface FolderItem {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

interface FolderTreeNode extends FolderItem {
  children: FolderTreeNode[];
}

// ----------------------------------------------------
// Tag Selector Combobox Component (Multi-Select)
// ----------------------------------------------------
interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
  placeholder?: string;
}

function TagSelector({ selectedTags, onChange, availableTags, placeholder = "Chọn hoặc nhập nhãn..." }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
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
    tag => tag.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="w-full min-h-[38px] p-1.5 bg-[#070b14] border border-slate-800 focus-within:border-blue-500/50 rounded-xl flex flex-wrap gap-1 items-center cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.map(tag => (
          <span key={tag} className="bg-blue-600/20 text-blue-450 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            {tag}
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                onChange(selectedTags.filter(t => t !== tag));
              }}
              className="hover:text-red-405 transition cursor-pointer"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-xs text-white placeholder-slate-655"
        />
      </div>

      {isOpen && (filteredTags.length > 0 || inputValue.trim()) && (
        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#0c1222] border border-slate-800 rounded-xl shadow-2xl z-[60] p-1 flex flex-col gap-0.5">
          {inputValue.trim() && !availableTags.includes(inputValue.trim()) && (
            <button
              type="button"
              onClick={() => {
                const newTag = inputValue.trim();
                onChange([...selectedTags, newTag]);
                setInputValue('');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-blue-400 hover:bg-slate-850 font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={12} />
              Thêm nhãn "{inputValue.trim()}"
            </button>
          )}
          {filteredTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelectTag(tag)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-855 transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Main Document Manager Page
// ----------------------------------------------------
export default function DocumentManager() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('null'); // Defaults to 'null' (Trang chủ) instead of '__ALL__'
  const [selectedTag, setSelectedTag] = useState<string>('');

  // Sidebar Layout Control
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<number[]>([]);

  // Drag and drop hover states
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Batch Selection
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // Modals & Drawers
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string>('');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string>('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);

  // Attachment Drawer
  const [activeDocForAttachments, setActiveDocForAttachments] = useState<DocumentItem | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Move & Edit Tags Dialogs
  const [movingDoc, setMovingDoc] = useState<DocumentItem | null>(null);
  const [editingTagsDoc, setEditingTagsDoc] = useState<DocumentItem | null>(null);
  const [tempTags, setTempTags] = useState<string[]>([]);

  // Batch Modals
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false);
  const [showBatchTagsModal, setShowBatchTagsModal] = useState(false);
  const [batchTags, setBatchTags] = useState<string[]>([]);

  // Inline Media Player
  const [activeMediaPlayer, setActiveMediaPlayer] = useState<{ url: string; type: 'audio' | 'video'; name: string } | null>(null);

  // Trash states
  const [trashFolders, setTrashFolders] = useState<FolderItem[]>([]);

  // Load Folder & Document list
  useEffect(() => {
    if (selectedFolderId === '__TRASH__') {
      fetchTrash();
    } else {
      fetchFolders();
      fetchDocuments();
    }
    setSelectedDocIds([]); // Clear selection when filters change
  }, [selectedFolderId, selectedTag]);

  const fetchFolders = async () => {
    try {
      const res = await api.getDocumentFolders();
      if (res.success) {
        setFolders(res.folders);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments({
        folder_id: selectedFolderId === 'null' ? '' : selectedFolderId,
        tag: selectedTag || undefined,
        search: searchQuery || undefined
      });
      if (res.success) {
        setDocuments(res.documents);
      }
    } catch (err: any) {
      showToast("Không thể tải danh sách tài liệu: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await api.getTrashDocuments();
      if (res.success) {
        setDocuments(res.documents);
        setTrashFolders(res.folders);
      }
    } catch (err: any) {
      showToast("Không thể tải thùng rác: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDocument = async (docId: number) => {
    try {
      const res = await api.restoreDocument(docId);
      if (res.success) {
        showToast("Đã khôi phục tài liệu!", "success");
        fetchTrash();
      }
    } catch (err: any) {
      showToast("Khôi phục tài liệu thất bại: " + (err.message || err), "error");
    }
  };

  const handleRestoreFolder = async (folderId: number) => {
    try {
      const res = await api.restoreDocumentFolder(folderId);
      if (res.success) {
        showToast("Đã khôi phục thư mục và nội dung bên trong!", "success");
        fetchTrash();
      }
    } catch (err: any) {
      showToast("Khôi phục thư mục thất bại: " + (err.message || err), "error");
    }
  };

  const handlePermanentDeleteDocument = async (docId: number, name: string) => {
    const isConfirmed = await confirm({
      title: "Xóa vĩnh viễn tài liệu",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu "${name}"? Thao tác này không thể hoàn tác và tệp tin sẽ bị xóa hoàn toàn khỏi ổ đĩa.`,
      confirmText: "Xóa vĩnh viễn",
      cancelText: "Hủy"
    });
    if (!isConfirmed) return;
    try {
      const res = await api.permanentlyDeleteDocument(docId);
      if (res.success) {
        showToast("Đã xóa vĩnh viễn tài liệu!", "success");
        fetchTrash();
      }
    } catch (err: any) {
      showToast("Xóa vĩnh viễn thất bại: " + (err.message || err), "error");
    }
  };

  const handlePermanentDeleteFolder = async (folderId: number, name: string) => {
    const isConfirmed = await confirm({
      title: "Xóa vĩnh viễn thư mục",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn thư mục "${name}" cùng toàn bộ thư mục con và tệp tin bên trong? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa vĩnh viễn",
      cancelText: "Hủy"
    });
    if (!isConfirmed) return;
    try {
      const res = await api.permanentlyDeleteDocumentFolder(folderId);
      if (res.success) {
        showToast("Đã xóa vĩnh viễn thư mục!", "success");
        fetchTrash();
      }
    } catch (err: any) {
      showToast("Xóa vĩnh viễn thư mục thất bại: " + (err.message || err), "error");
    }
  };

  // Convert flat folders array to tree structure
  const folderTree = useMemo(() => {
    const map: Record<number, FolderTreeNode> = {};
    const roots: FolderTreeNode[] = [];
    
    folders.forEach(f => {
      map[f.id] = { ...f, children: [] };
    });
    
    folders.forEach(f => {
      const node = map[f.id];
      if (node.parent_id !== null && map[node.parent_id]) {
        map[node.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  }, [folders]);

  // Compute subfolders visible under the current active folder
  const visibleSubfolders = useMemo(() => {
    if (selectedFolderId === '__TRASH__') {
      return trashFolders;
    }
    const activeId = selectedFolderId === 'null' ? null : parseInt(selectedFolderId);
    return folders.filter(f => f.parent_id === activeId);
  }, [folders, selectedFolderId, trashFolders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showToast("Vui lòng nhập tên thư mục", "warning");
      return;
    }
    try {
      const parentIdNum = newFolderParentId ? parseInt(newFolderParentId) : undefined;
      const res = await api.createDocumentFolder(newFolderName.trim(), parentIdNum);
      if (res.success) {
        showToast(`Đã tạo thư mục "${newFolderName}"`, "success");
        setNewFolderName('');
        setNewFolderParentId('');
        setShowFolderModal(false);
        fetchFolders();
      }
    } catch (err: any) {
      showToast("Tạo thư mục thất bại: " + (err.message || err), "error");
    }
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    const isConfirmed = await confirm({
      title: "Xóa thư mục",
      message: `Bạn có chắc chắn muốn xóa thư mục "${folder.name}"? Các tài liệu và thư mục con bên trong sẽ được đưa ra cấp thư mục cha (không bị xóa hoàn toàn).`,
      confirmText: "Xóa",
      cancelText: "Hủy"
    });

    if (!isConfirmed) return;

    try {
      const res = await api.deleteDocumentFolder(folder.id);
      if (res.success) {
        showToast("Đã xóa thư mục", "success");
        if (selectedFolderId === String(folder.id)) {
          setSelectedFolderId(folder.parent_id ? String(folder.parent_id) : 'null');
        }
        fetchFolders();
        fetchDocuments();
      }
    } catch (err: any) {
      showToast("Không thể xóa thư mục: " + (err.message || err), "error");
    }
  };

  // Upload multiple documents
  const handleUploadDocuments = async () => {
    if (uploadFiles.length === 0) {
      showToast("Vui lòng chọn ít nhất một tệp tin", "warning");
      return;
    }
    setLoading(true);
    try {
      const tagsStr = uploadTags.join(',');
      const promises = uploadFiles.map(file => 
        api.uploadDocument(
          file, 
          uploadFolderId || undefined, 
          tagsStr || undefined
        )
      );
      await Promise.all(promises);
      showToast(`Đã tải lên thành công ${uploadFiles.length} tài liệu!`, "success");
      setUploadFiles([]);
      setUploadTags([]);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err: any) {
      showToast("Tải lên thất bại: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    const isConfirmed = await confirm({
      title: "Xóa tài liệu",
      message: `Bạn có chắc chắn muốn xóa tài liệu "${doc.name}" cùng tất cả các tệp đính kèm liên quan? Tệp tin sẽ bị xóa hoàn toàn khỏi ổ đĩa.`,
      confirmText: "Xóa tệp",
      cancelText: "Hủy"
    });

    if (!isConfirmed) return;

    try {
      const res = await api.deleteDocument(doc.id);
      if (res.success) {
        showToast("Đã xóa tài liệu khỏi hệ thống", "success");
        setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
        fetchDocuments();
        if (activeDocForAttachments?.id === doc.id) {
          setActiveDocForAttachments(null);
        }
      }
    } catch (err: any) {
      showToast("Xóa tài liệu thất bại: " + (err.message || err), "error");
    }
  };

  const handleUpdateTags = async () => {
    if (!editingTagsDoc) return;
    try {
      const res = await api.updateDocumentTags(editingTagsDoc.id, tempTags.join(','));
      if (res.success) {
        showToast("Cập nhật nhãn thành công!", "success");
        setEditingTagsDoc(null);
        fetchDocuments();
      }
    } catch (err: any) {
      showToast("Không thể cập nhật nhãn: " + (err.message || err), "error");
    }
  };

  const handleMoveDocument = async (folderId: string | null) => {
    if (!movingDoc) return;
    try {
      const res = await api.moveDocument(movingDoc.id, folderId);
      if (res.success) {
        showToast("Đã di chuyển tài liệu", "success");
        setMovingDoc(null);
        fetchDocuments();
      }
    } catch (err: any) {
      showToast("Di chuyển tài liệu thất bại: " + (err.message || err), "error");
    }
  };

  // ----------------------------------------------------
  // HTML5 Drag & Drop handlers
  // ----------------------------------------------------
  const handleDragStartDoc = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("docId", id.toString());
  };

  const handleDragStartFolder = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("folderId", id.toString());
  };

  const handleDragOver = (e: React.DragEvent, id: string | null) => {
    e.preventDefault();
    setDragOverFolderId(id);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const docIdStr = e.dataTransfer.getData("docId");
    const folderIdStr = e.dataTransfer.getData("folderId");
    
    if (docIdStr) {
      const docId = parseInt(docIdStr);
      try {
        await api.moveDocument(docId, targetFolderId);
        showToast("Đã di chuyển tài liệu thành công!", "success");
        fetchDocuments();
      } catch (err: any) {
        showToast("Không thể di chuyển tài liệu: " + (err.message || err), "error");
      }
    } else if (folderIdStr) {
      const folderId = parseInt(folderIdStr);
      if (targetFolderId && String(folderId) === targetFolderId) {
        showToast("Không thể di chuyển thư mục vào chính nó!", "warning");
        return;
      }
      try {
        await api.moveDocumentFolder(folderId, targetFolderId);
        showToast("Đã di chuyển thư mục thành công!", "success");
        fetchFolders();
        fetchDocuments();
      } catch (err: any) {
        showToast("Không thể di chuyển thư mục: " + (err.message || err), "error");
      }
    }
  };

  // ----------------------------------------------------
  // Batch Operations
  // ----------------------------------------------------
  const handleToggleSelectDoc = (id: number) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter(item => item !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map(d => d.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedDocIds.length === 0) return;
    const isConfirmed = await confirm({
      title: "Xóa hàng loạt tài liệu",
      message: `Bạn có chắc chắn muốn xóa ${selectedDocIds.length} tài liệu đã chọn cùng tất cả các tệp đính kèm liên quan? Tệp tin sẽ bị xóa hoàn toàn khỏi ổ đĩa.`,
      confirmText: "Xóa tất cả",
      cancelText: "Hủy"
    });

    if (!isConfirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedDocIds.map(id => api.deleteDocument(id)));
      showToast(`Đã xóa thành công ${selectedDocIds.length} tài liệu!`, "success");
      setSelectedDocIds([]);
      fetchDocuments();
    } catch (err: any) {
      showToast("Xóa tài liệu đồng loạt thất bại: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchMove = async (folderId: string | null) => {
    if (selectedDocIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedDocIds.map(id => api.moveDocument(id, folderId)));
      showToast(`Đã di chuyển ${selectedDocIds.length} tài liệu!`, "success");
      setSelectedDocIds([]);
      setShowBatchMoveModal(false);
      fetchDocuments();
    } catch (err: any) {
      showToast("Di chuyển tài liệu đồng loạt thất bại: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpdateTags = async () => {
    if (selectedDocIds.length === 0) return;
    setLoading(true);
    try {
      const tagsStr = batchTags.join(',');
      await Promise.all(selectedDocIds.map(id => api.updateDocumentTags(id, tagsStr)));
      showToast(`Đã cập nhật nhãn cho ${selectedDocIds.length} tài liệu!`, "success");
      setSelectedDocIds([]);
      setBatchTags([]);
      setShowBatchTagsModal(false);
      fetchDocuments();
    } catch (err: any) {
      showToast("Cập nhật nhãn đồng loạt thất bại: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Attachment Handlers
  // ----------------------------------------------------
  const handleUploadAttachment = async () => {
    if (!activeDocForAttachments || !attachmentFile) return;
    try {
      showToast("Đang tải tệp đính kèm...", "warning");
      const res = await api.uploadDocumentAttachment(activeDocForAttachments.id, attachmentFile);
      if (res.success) {
        showToast(`Đã thêm đính kèm "${attachmentFile.name}"`, "success");
        setAttachmentFile(null);
        // Refresh active document attachments
        const docsRes = await api.getDocuments({ folder_id: selectedFolderId === 'null' ? '' : selectedFolderId });
        if (docsRes.success) {
          setDocuments(docsRes.documents);
          const updatedDoc = docsRes.documents.find(d => d.id === activeDocForAttachments.id);
          if (updatedDoc) setActiveDocForAttachments(updatedDoc);
        }
      }
    } catch (err: any) {
      showToast("Tải đính kèm thất bại: " + (err.message || err), "error");
    }
  };

  const handleDeleteAttachment = async (att: DocumentAttachment) => {
    const isConfirmed = await confirm({
      title: "Xóa tệp đính kèm",
      message: `Bạn có chắc chắn muốn xóa tệp đính kèm "${att.filename}"?`,
      confirmText: "Xóa",
      cancelText: "Hủy"
    });

    if (!isConfirmed) return;

    try {
      const res = await api.deleteDocumentAttachment(att.id);
      if (res.success) {
        showToast("Đã xóa tệp đính kèm", "success");
        // Refresh active document attachments
        const docsRes = await api.getDocuments({ folder_id: selectedFolderId === 'null' ? '' : selectedFolderId });
        if (docsRes.success) {
          setDocuments(docsRes.documents);
          const updatedDoc = docsRes.documents.find(d => d.id === activeDocForAttachments!.id);
          if (updatedDoc) setActiveDocForAttachments(updatedDoc);
        }
      }
    } catch (err: any) {
      showToast("Không thể xóa đính kèm: " + (err.message || err), "error");
    }
  };

  const handleOpenFileNative = async (filepath: string) => {
    try {
      await api.openLocalFile(filepath);
      showToast("Đang mở tệp tin bằng ứng dụng hệ thống...", "success");
    } catch (err: any) {
      showToast("Không thể mở tệp tin: " + (err.message || err), "error");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['docx', 'doc'].includes(t)) return <FileText className="text-blue-400" size={24} />;
    if (['xlsx', 'xls', 'csv'].includes(t)) return <FileText className="text-emerald-400" size={24} />;
    if (t === 'pdf') return <FileText className="text-red-400" size={24} />;
    if (t === 'zip') return <Archive className="text-amber-400" size={24} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(t)) return <FileImage className="text-pink-400" size={24} />;
    if (['mp3', 'wav', 'ogg'].includes(t)) return <Music className="text-indigo-400" size={24} />;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(t)) return <Video className="text-purple-400" size={24} />;
    return <FileCode className="text-slate-400" size={24} />;
  };

  // Collect all unique tags in active documents for filter tag cloud
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.tags) {
        doc.tags.split(',').forEach(tag => {
          const t = tag.trim();
          if (t) tagsSet.add(t);
        });
      }
    });
    return Array.from(tagsSet);
  }, [documents]);

  // Find active folder details
  const activeFolder = folders.find(f => String(f.id) === selectedFolderId);

  // Compute breadcrumbs path
  const breadcrumbs = useMemo(() => {
    if (selectedFolderId === 'null') return [];
    const path: FolderItem[] = [];
    let current = folders.find(f => String(f.id) === selectedFolderId);
    while (current) {
      path.unshift(current);
      const parentId = current.parent_id;
      current = parentId !== null ? folders.find(f => f.id === parentId) : undefined;
    }
    return path;
  }, [folders, selectedFolderId]);

  // ----------------------------------------------------
  // Recursive Folder Tree Rendering
  // ----------------------------------------------------
  const toggleFolderExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedFolderIds.includes(id)) {
      setExpandedFolderIds(expandedFolderIds.filter(fid => fid !== id));
    } else {
      setExpandedFolderIds([...expandedFolderIds, id]);
    }
  };

  const renderFolderNode = (node: FolderTreeNode, level = 0) => {
    const isExpanded = expandedFolderIds.includes(node.id);
    const isSelected = selectedFolderId === String(node.id);
    const hasChildren = node.children.length > 0;
    const isDragOver = dragOverFolderId === String(node.id);
    
    return (
      <div key={node.id} className="flex flex-col">
        <div 
          draggable
          onDragStart={(e) => handleDragStartFolder(e, node.id)}
          onDragOver={(e) => handleDragOver(e, String(node.id))}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, String(node.id))}
          className={`group relative flex items-center justify-between transition rounded-xl ${
            isDragOver ? 'bg-blue-600/10 border-blue-500/40 border border-dashed scale-102' : ''
          }`}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          <button
            onClick={() => { setSelectedFolderId(String(node.id)); setSelectedTag(''); }}
            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              isSelected
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                : 'text-slate-355 hover:bg-slate-800/40 hover:text-white border border-transparent'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate pr-6">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleFolderExpand(node.id, e)}
                  className="p-0.5 hover:bg-slate-850 rounded text-slate-500 hover:text-slate-350 transition cursor-pointer"
                >
                  <ChevronRight 
                    size={10} 
                    className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </button>
              ) : (
                <span className="w-3.5"></span>
              )}
              <Folder size={14} className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-amber-500/80'}`} />
              <span className="truncate">{node.name}</span>
            </span>
          </button>
          <button
            onClick={() => handleDeleteFolder(node)}
            className="absolute right-2 text-slate-555 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
            title="Xóa thư mục"
          >
            <Trash2 size={11} />
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="flex flex-col mt-0.5 ml-2 border-l border-slate-850/40 pl-2">
            {node.children.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Options helpers for SELECT dropdowns in modals (hierarchical depth render)
  const renderFolderOptions = (nodes: FolderTreeNode[], depth = 0): React.ReactNode[] => {
    return nodes.flatMap(node => [
      <option key={node.id} value={node.id}>
        {"\u00A0\u00A0".repeat(depth) + "📁 " + node.name}
      </option>,
      ...renderFolderOptions(node.children, depth + 1)
    ]);
  };

  // Buttons helpers for MOVE modals
  const renderFolderOptionsForMove = (nodes: FolderTreeNode[], depth = 0): React.ReactNode[] => {
    return nodes.flatMap(node => [
      <button
        key={node.id}
        onClick={() => handleMoveDocument(String(node.id))}
        className="w-full text-left px-3 py-2 bg-slate-900/30 hover:bg-slate-850 text-xs font-bold rounded-xl text-slate-300 border border-slate-850 hover:border-slate-750 transition cursor-pointer flex items-center gap-1.5"
      >
        <span>{"\u00A0\u00A0".repeat(depth) + "📁"}</span>
        <span>{node.name}</span>
      </button>,
      ...renderFolderOptionsForMove(node.children, depth + 1)
    ]);
  };

  const renderFolderOptionsForBatchMove = (nodes: FolderTreeNode[], depth = 0): React.ReactNode[] => {
    return nodes.flatMap(node => [
      <button
        key={node.id}
        onClick={() => handleBatchMove(String(node.id))}
        className="w-full text-left px-3 py-2 bg-slate-900/30 hover:bg-slate-850 text-xs font-bold rounded-xl text-slate-300 border border-slate-855 hover:border-slate-755 transition cursor-pointer flex items-center gap-1.5"
      >
        <span>{"\u00A0\u00A0".repeat(depth) + "📁"}</span>
        <span>{node.name}</span>
      </button>,
      ...renderFolderOptionsForBatchMove(node.children, depth + 1)
    ]);
  };

  return (
    <div className="flex flex-col gap-6 h-full p-1">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FolderOpen className="text-blue-500" size={22} />
            Quản Lý Tài Liệu
          </h1>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Lưu trữ tài liệu và file nghe. Hỗ trợ cây thư mục kéo thả trực quan và tải lên hàng loạt.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => {
              // Automatically set parentId if currently viewing a folder, otherwise root
              setNewFolderParentId(selectedFolderId !== 'null' ? selectedFolderId : '');
              setShowFolderModal(true);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-855 hover:bg-slate-800 text-xs text-slate-200 font-bold rounded-xl border border-slate-700/50 hover:border-slate-500 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <FolderPlus size={14} />
            Tạo Thư Mục
          </button>
          
          <button
            onClick={() => {
              // Preselect current folder for upload destination
              setUploadFolderId(selectedFolderId === 'null' ? '' : selectedFolderId);
              setUploadFiles([]);
              setUploadTags([]);
              setShowUploadModal(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs text-white font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Upload size={14} />
            Tải Lên Tệp
          </button>
        </div>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedDocIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-900/20 border border-blue-500/40 px-5 py-3.5 rounded-2xl animate-scale-up backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-blue-400" size={16} />
            <span className="text-xs font-extrabold text-blue-200">
              Đã chọn {selectedDocIds.length} tài liệu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBatchTags([]);
                setShowBatchTagsModal(true);
              }}
              className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-[10px] text-slate-200 font-bold rounded-xl border border-slate-700/50 transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Tag size={12} />
              Gắn nhãn đồng loạt
            </button>
            
            <button
              onClick={() => setShowBatchMoveModal(true)}
              className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-[10px] text-slate-200 font-bold rounded-xl border border-slate-700/50 transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Move size={12} />
              Di chuyển đồng loạt
            </button>

            <button
              onClick={handleBatchDelete}
              className="px-3.5 py-2 bg-red-650/20 hover:bg-red-650/40 text-[10px] text-red-400 font-bold rounded-xl border border-red-500/20 transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Trash2 size={12} />
              Xóa đồng loạt
            </button>

            <button
              onClick={() => setSelectedDocIds([])}
              className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Hủy chọn"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-1 min-h-0">
        
        {/* Sidebar: Collapsible Folder Tree */}
        {!sidebarCollapsed ? (
          <div className="lg:col-span-1 flex flex-col gap-5 h-full max-h-[75vh] overflow-y-auto pr-1 transition-all duration-300">
            
            {/* Folders tree explorer */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Cấu trúc thư mục</h3>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded transition cursor-pointer"
                  title="Thu gọn sidebar"
                >
                  <ChevronLeft size={13} />
                </button>
              </div>

              {/* Single "Trang chủ" Root Node and Dropzone */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => { setSelectedFolderId('null'); setSelectedTag(''); }}
                  onDragOver={(e) => handleDragOver(e, 'null')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedFolderId === 'null' 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'text-slate-355 hover:bg-slate-800/40 hover:text-white border border-transparent'
                  } ${dragOverFolderId === 'null' ? 'bg-blue-600/10 border-blue-500/40 border border-dashed' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen size={14} className={selectedFolderId === 'null' ? 'text-blue-500' : 'text-slate-400'} />
                    Trang chủ (Tài liệu)
                  </span>
                </button>

                <button
                  onClick={() => { setSelectedFolderId('__TRASH__'); setSelectedTag(''); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedFolderId === '__TRASH__' 
                      ? 'bg-red-500/10 text-red-450 border border-red-500/20' 
                      : 'text-slate-355 hover:bg-slate-800/40 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={14} className={selectedFolderId === '__TRASH__' ? 'text-red-500' : 'text-slate-400'} />
                    Thùng rác
                  </span>
                </button>

                {/* Recursive Folder Tree */}
                <div className="flex flex-col gap-1 border-t border-slate-850/30 pt-2">
                  {folderTree.map(rootNode => renderFolderNode(rootNode))}
                </div>
              </div>
            </div>

            {/* Tags cloud */}
            {allUniqueTags.length > 0 && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-[10px] font-bold text-slate-455 uppercase tracking-widest px-1">Nhãn dán (Tags)</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedTag('')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      selectedTag === ''
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    Tất cả nhãn
                  </button>
                  {allUniqueTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-blue-500/20 text-blue-450 border border-blue-500/30'
                          : 'bg-slate-800/60 text-slate-400 hover:bg-slate-850 hover:text-white border border-transparent'
                      }`}
                    >
                      <Tag size={8} />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Content: Folders & Files Grid */}
        <div className={`${sidebarCollapsed ? 'lg:col-span-4' : 'lg:col-span-3'} flex flex-col gap-4 h-full max-h-[75vh] min-h-[500px] transition-all duration-300`}>
          {/* Filter / Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="px-3.5 py-2.5 bg-slate-900/40 hover:bg-slate-850 border border-slate-805 text-xs text-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Mở rộng thư mục"
              >
                <FolderOpen size={14} className="text-blue-500" />
                Thư mục
              </button>
            )}
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-555" size={14} />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900/40 focus:bg-slate-900/80 border border-slate-800/80 focus:border-blue-500/50 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-200 font-bold rounded-xl transition cursor-pointer"
            >
              Tìm kiếm
            </button>
            {(searchQuery || selectedTag || selectedFolderId !== 'null') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('');
                  setSelectedFolderId('null');
                }}
                className="px-3 py-2.5 bg-slate-800/30 hover:bg-slate-800 text-xs text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </form>

          {/* Directory path indicator (Clickable Breadcrumbs) */}
          <div className="flex items-center justify-between text-[10px] text-slate-405 font-semibold bg-slate-900/10 px-4 py-2 rounded-xl border border-slate-850/40">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                onClick={() => { setSelectedFolderId('null'); setSelectedTag(''); }}
                className="hover:text-blue-450 hover:underline cursor-pointer transition flex items-center gap-1 text-slate-400 font-bold"
              >
                Trang chủ
              </span>
              {breadcrumbs.map((b, idx) => (
                <div key={b.id} className="flex items-center gap-1.5">
                  <ChevronRight size={10} className="text-slate-600" />
                  <span 
                    onClick={() => { setSelectedFolderId(String(b.id)); setSelectedTag(''); }}
                    className={`hover:text-blue-450 hover:underline cursor-pointer transition ${
                      idx === breadcrumbs.length - 1 ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {b.name}
                  </span>
                </div>
              ))}
              {selectedTag && (
                <>
                  <ChevronRight size={10} className="text-slate-600" />
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Tag size={8} /> Tag: {selectedTag}
                  </span>
                </>
              )}
            </div>

            {documents.length > 0 && (
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition font-extrabold cursor-pointer"
              >
                {selectedDocIds.length === documents.length ? (
                  <CheckSquare size={13} className="text-blue-500" />
                ) : (
                  <Square size={13} />
                )}
                <span>Chọn tất cả ({documents.length})</span>
              </button>
            )}
          </div>

          {/* Staged drag and drop root overlay zone */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Đang tải tài liệu...</span>
              </div>
            ) : visibleSubfolders.length === 0 && documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-900/10 border border-dashed border-slate-805 rounded-2xl">
                <FolderOpen className="text-slate-600" size={40} />
                <div className="text-center">
                  <h4 className="text-xs font-bold text-slate-350">Thư mục trống</h4>
                  <p className="text-[10px] text-slate-505 mt-1">Hãy tạo thư mục con hoặc tải tệp tin lên</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* 1. Subfolders Section (Double-click/Click to navigate) */}
                {visibleSubfolders.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Thư mục con</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {visibleSubfolders.map(sub => {
                        const isDragOverThis = dragOverFolderId === String(sub.id);
                        const isTrash = selectedFolderId === '__TRASH__';
                        return (
                          <div
                            key={sub.id}
                            draggable={!isTrash}
                            onDragStart={(e) => handleDragStartFolder(e, sub.id)}
                            onDragOver={(e) => !isTrash && handleDragOver(e, String(sub.id))}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !isTrash && handleDrop(e, String(sub.id))}
                            onDoubleClick={() => { if (!isTrash) { setSelectedFolderId(String(sub.id)); setSelectedTag(''); } }}
                            onClick={() => { if (!isTrash) { setSelectedFolderId(String(sub.id)); setSelectedTag(''); } }}
                            className={`flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850/60 hover:border-slate-700/60 rounded-2xl transition cursor-pointer select-none group/fcard ${
                              isDragOverThis ? 'bg-blue-600/10 border-blue-500/40 border-2 scale-102 border-dashed shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Folder size={18} className="text-amber-500 fill-amber-500/10 flex-shrink-0" />
                              <span className="text-xs font-bold text-slate-200 truncate">{sub.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/fcard:opacity-100 transition">
                              {isTrash ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreFolder(sub.id);
                                    }}
                                    className="p-1 hover:bg-slate-800 text-green-400 rounded transition cursor-pointer"
                                    title="Khôi phục thư mục"
                                  >
                                    <Plus size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePermanentDeleteFolder(sub.id, sub.name);
                                    }}
                                    className="p-1 hover:bg-slate-800 text-red-500 rounded transition cursor-pointer"
                                    title="Xóa vĩnh viễn"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(sub);
                                  }}
                                  className="p-1 hover:bg-slate-855 text-slate-600 hover:text-red-405 rounded-lg transition cursor-pointer"
                                  title="Xóa thư mục"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Files Section */}
                {documents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Tệp tin</h3>
                    <div className={`grid gap-4 ${sidebarCollapsed ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {documents.map(doc => {
                        const isSelected = selectedDocIds.includes(doc.id);
                        const isTrash = selectedFolderId === '__TRASH__';
                        return (
                          <div 
                            key={doc.id}
                            draggable={!isTrash}
                            onDragStart={(e) => handleDragStartDoc(e, doc.id)}
                            className={`flex flex-col justify-between border rounded-2xl p-4 transition shadow-md hover:shadow-lg relative group ${
                              isTrash ? '' : 'cursor-grab active:cursor-grabbing'
                            } ${
                              isSelected 
                                ? 'bg-blue-900/10 border-blue-500/50' 
                                : 'bg-slate-900/30 hover:bg-slate-900/50 border-slate-800/80 hover:border-slate-700/60'
                            }`}
                          >
                            {/* Checkbox Overlay for Selection */}
                            {!isTrash && (
                              <button
                                onClick={() => handleToggleSelectDoc(doc.id)}
                                className={`absolute top-3.5 right-3.5 p-1 rounded-lg border transition-all cursor-pointer z-10 ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                    : 'bg-slate-950 border-slate-805 text-transparent hover:text-slate-700 hover:border-slate-700'
                                }`}
                              >
                                <Plus size={10} className={isSelected ? "" : "opacity-0"} />
                              </button>
                            )}

                            <div className="flex items-start gap-3 pr-6">
                              {/* Icon */}
                              <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-800">
                                {getFileIcon(doc.file_type)}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <h4 
                                  onClick={() => !isTrash && handleOpenFileNative(doc.filepath)}
                                  className={`text-xs font-bold truncate ${
                                    isTrash 
                                      ? 'text-slate-400' 
                                      : 'text-slate-200 hover:text-blue-455 transition cursor-pointer'
                                  }`}
                                  title={isTrash ? doc.name : "Nhấp để mở tệp tin"}
                                >
                                  {doc.name}
                                </h4>
                                <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">
                                  {doc.filename}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-400 font-semibold">
                                  <span>{formatBytes(doc.file_size)}</span>
                                  <span className="text-slate-700">•</span>
                                  <span>{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Tags List */}
                            {doc.tags && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {doc.tags.split(',').map(tag => (
                                  <span 
                                    key={tag}
                                    className="bg-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                                  >
                                    <Tag size={6} />
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-4">
                              {isTrash ? (
                                <div className="flex gap-2 w-full justify-between animate-scale-up">
                                  <button
                                    onClick={() => handleRestoreDocument(doc.id)}
                                    className="px-3.5 py-2 bg-green-600/10 hover:bg-green-600/20 text-[10px] text-green-400 font-bold rounded-xl border border-green-500/20 transition cursor-pointer"
                                  >
                                    Khôi phục
                                  </button>
                                  <button
                                    onClick={() => handlePermanentDeleteDocument(doc.id, doc.name)}
                                    className="px-3.5 py-2 bg-red-650/10 hover:bg-red-650/20 text-[10px] text-red-405 font-bold rounded-xl border border-red-500/20 transition cursor-pointer"
                                  >
                                    Xóa vĩnh viễn
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-1.5">
                                    <a
                                      href={api.downloadDocumentUrl(doc.id)}
                                      download={doc.filename}
                                      className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-850/60 text-slate-355 hover:text-white rounded-xl transition cursor-pointer"
                                      title="Tải tệp tin về máy"
                                    >
                                      <Download size={12} />
                                    </a>
                                    <button
                                      onClick={() => handleOpenFileNative(doc.filepath)}
                                      className="p-2 bg-slate-855 hover:bg-slate-800 border border-slate-855/60 text-slate-355 hover:text-white rounded-xl transition cursor-pointer"
                                      title="Mở trực tiếp trên máy tính"
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                    
                                    {/* Attachments Trigger Button */}
                                    <button
                                      onClick={() => setActiveDocForAttachments(doc)}
                                      className={`px-2.5 py-1.5 text-[9px] font-bold rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                                        doc.attachments && doc.attachments.length > 0
                                          ? 'bg-blue-600/15 border-blue-500/30 text-blue-405 hover:bg-blue-600/30'
                                          : 'bg-slate-850 border-slate-855/60 text-slate-355 hover:text-white hover:bg-slate-800'
                                      }`}
                                      title="Quản lý tệp đính kèm (Audio/Video/Đáp án)"
                                    >
                                      {doc.attachments && doc.attachments.length > 0 ? (
                                        <>
                                          Đã đính kèm ({doc.attachments.length})
                                        </>
                                      ) : (
                                        <>
                                          Đính kèm
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingTagsDoc(doc);
                                        setTempTags(doc.tags ? doc.tags.split(',').map(t => t.trim()) : []);
                                      }}
                                      className="p-2 hover:bg-slate-855 text-slate-500 hover:text-slate-300 rounded-xl transition cursor-pointer"
                                      title="Sửa nhãn dán"
                                    >
                                      <Tag size={12} />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteDocument(doc)}
                                      className="p-2 hover:bg-slate-855 text-slate-500 hover:text-red-404 rounded-xl transition cursor-pointer"
                                      title="Xóa tệp"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Media Player */}
      {activeMediaPlayer && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#0c1222] border border-slate-705 rounded-2xl shadow-2xl p-4 w-96 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 truncate">
              {activeMediaPlayer.type === 'audio' ? <Music size={14} className="text-blue-500" /> : <Video size={14} className="text-purple-500" />}
              <span className="text-[10px] font-bold text-slate-200 truncate">{activeMediaPlayer.name}</span>
            </div>
            <button onClick={() => setActiveMediaPlayer(null)} className="text-slate-455 hover:text-white transition">
              <X size={14} />
            </button>
          </div>
          
          {activeMediaPlayer.type === 'audio' ? (
            <audio src={activeMediaPlayer.url} controls className="w-full" autoPlay />
          ) : (
            <video src={activeMediaPlayer.url} controls className="w-full rounded-lg" autoPlay />
          )}
        </div>
      )}

      {/* Drawer: Document Attachments Manager */}
      {activeDocForAttachments && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setActiveDocForAttachments(null)}
          ></div>
          
          <div className="relative w-full max-w-md h-full bg-[#070b14] border-l border-slate-800 shadow-2xl flex flex-col justify-between z-10">
            <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1">
              
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-900 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white pr-6 line-clamp-2">{activeDocForAttachments.name}</h3>
                  <p className="text-[9px] text-slate-505 font-mono mt-1 flex items-center gap-1">
                    Tệp gốc: {activeDocForAttachments.filename}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveDocForAttachments(null)}
                  className="p-1 rounded-lg text-slate-555 hover:text-white hover:bg-slate-855 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Upload New Attachment Zone */}
              <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-slate-355 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload size={12} className="text-blue-500" />
                  Đính Kèm Tệp Mới
                </h4>
                
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    id="attachment-file-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachmentFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachment-file-input"
                    className="w-full py-4 border border-dashed border-slate-805 hover:border-blue-500/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/10 hover:bg-slate-900/40 transition"
                  >
                    <Plus size={16} className="text-slate-500" />
                    <span className="text-[10px] text-slate-400 font-bold">
                      {attachmentFile ? attachmentFile.name : "Chọn tệp MP3, MP4, PDF, Đáp án..."}
                    </span>
                  </label>
                  
                  {attachmentFile && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAttachmentFile(null)}
                        className="flex-1 py-2 bg-slate-855 hover:bg-slate-800 text-[10px] text-slate-300 font-bold rounded-lg border border-slate-700/60 transition cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUploadAttachment}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-[10px] text-white font-extrabold rounded-lg transition cursor-pointer"
                      >
                        Tải lên
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments List */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Danh sách đính kèm</h4>
                
                {!activeDocForAttachments.attachments || activeDocForAttachments.attachments.length === 0 ? (
                  <div className="text-center py-10 text-slate-555 border border-dashed border-slate-850 rounded-2xl">
                    <Info size={24} className="mx-auto text-slate-755 mb-2" />
                    <p className="text-[10px]">Chưa có tệp đính kèm nào</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {activeDocForAttachments.attachments.map(att => (
                      <div 
                        key={att.id} 
                        className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 group/item"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-slate-850 rounded-lg">
                            {getFileIcon(att.file_type)}
                          </div>
                          
                          <div className="min-w-0">
                            <span 
                              onClick={() => handleOpenFileNative(att.filepath)}
                              className="text-[10px] font-semibold text-slate-200 hover:text-blue-400 cursor-pointer truncate block"
                              title={att.filename}
                            >
                              {att.filename}
                            </span>
                            <span className="text-[8px] text-slate-505 font-mono">
                              {formatBytes(att.file_size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Media Player trigger */}
                          {['mp3', 'wav', 'ogg', 'mp4', 'mov'].includes(att.file_type.toLowerCase()) && (
                            <button
                              onClick={() => {
                                const downloadUrl = api.downloadAttachmentUrl(att.id);
                                const isAudio = ['mp3', 'wav', 'ogg'].includes(att.file_type.toLowerCase());
                                setActiveMediaPlayer({
                                  url: downloadUrl,
                                  type: isAudio ? 'audio' : 'video',
                                  name: att.filename
                                });
                              }}
                              className="p-1.5 hover:bg-blue-500/10 text-blue-500 hover:text-blue-455 rounded-lg transition cursor-pointer"
                              title="Phát nhạc/video trực tiếp"
                            >
                              <Play size={10} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleOpenFileNative(att.filepath)}
                            className="p-1.5 hover:bg-slate-800 text-slate-405 hover:text-white rounded-lg transition cursor-pointer"
                            title="Xem nhanh tệp tin"
                          >
                            <Eye size={10} />
                          </button>
                          
                          <a
                            href={api.downloadAttachmentUrl(att.id)}
                            download={att.filename}
                            className="p-1.5 hover:bg-slate-800 text-slate-405 hover:text-white rounded-lg transition cursor-pointer"
                            title="Tải đính kèm"
                          >
                            <Download size={10} />
                          </a>

                          <button
                            onClick={() => handleDeleteAttachment(att)}
                            className="p-1.5 hover:bg-slate-800 text-slate-455 hover:text-red-400 rounded-lg transition cursor-pointer"
                            title="Xóa đính kèm"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFolderModal(false)}></div>
          <div className="relative bg-[#0c1222] border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FolderPlus size={14} className="text-blue-500" />
                Tạo Thư Mục Mới
              </h3>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-455 hover:text-white transition">
                <X size={14} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-455 uppercase">Tên thư mục:</label>
                <input
                  type="text"
                  placeholder="Nhập tên thư mục..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b14] border border-slate-800 focus:border-blue-500/50 rounded-xl text-xs text-white placeholder-slate-655 outline-none transition"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-455 uppercase">Thư mục cha:</label>
                <select
                  value={newFolderParentId}
                  onChange={(e) => setNewFolderParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b14] border border-slate-805 text-xs text-slate-300 rounded-xl outline-none cursor-pointer"
                >
                  <option value="">Trang chủ (Không có cha)</option>
                  {renderFolderOptions(folderTree)}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="flex-1 py-2 bg-slate-855 hover:bg-slate-800 text-xs text-slate-300 font-bold rounded-xl border border-slate-700/60 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-white font-extrabold rounded-xl transition cursor-pointer"
              >
                Tạo Thư Mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual File Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
          <div className="relative bg-[#0c1222] border border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-855">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} className="text-blue-500" />
                Tải Lên Tài Liệu Mới
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-455 hover:text-white transition">
                <X size={14} />
              </button>
            </div>

            {/* Selector */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-455 uppercase">Chọn tệp tin (Giữ Ctrl để chọn nhiều):</label>
                <input
                  type="file"
                  id="doc-upload-input"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="doc-upload-input"
                  className="w-full py-6 border border-dashed border-slate-805 hover:border-blue-500/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/10 hover:bg-slate-900/40 transition"
                >
                  <Plus size={18} className="text-slate-505" />
                  <span className="text-xs text-slate-400 font-bold text-center px-4">
                    {uploadFiles.length > 0 
                      ? `Đã chọn ${uploadFiles.length} tệp tin` 
                      : "Kéo thả hoặc nhấp chọn tệp tin"
                    }
                  </span>
                </label>
              </div>

              {/* Show Staged Files list if multiple */}
              {uploadFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-slate-800 p-2 rounded-xl bg-[#070b14]/50 font-mono">
                  <label className="text-[8px] font-bold text-slate-500 uppercase px-1">Danh sách tệp tin ({uploadFiles.length}):</label>
                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] text-slate-305 bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-850/50">
                      <span className="truncate pr-4">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-405 transition cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-455 uppercase">Thư mục lưu trữ:</label>
                <select
                  value={uploadFolderId}
                  onChange={(e) => setUploadFolderId(e.target.value)}
                  className="bg-[#070b14] border border-slate-800 px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer"
                >
                  <option value="">Trang chủ (Không có cha)</option>
                  {renderFolderOptions(folderTree)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-455 uppercase">Nhãn dán (Chọn từ Dropbox hoặc nhập mới):</label>
                <TagSelector 
                  selectedTags={uploadTags} 
                  onChange={setUploadTags} 
                  availableTags={allUniqueTags}
                  placeholder="Nhấp để chọn hoặc nhập nhãn mới..."
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setUploadFiles([]);
                  setUploadTags([]);
                  setShowUploadModal(false);
                }}
                className="flex-1 py-2 bg-slate-855 hover:bg-slate-800 text-xs text-slate-300 font-bold rounded-xl border border-slate-700/60 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUploadDocuments}
                disabled={loading || uploadFiles.length === 0}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-slate-400 text-xs text-white font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? "Đang tải lên..." : `Tải Lên (${uploadFiles.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Move Single Document */}
      {movingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMovingDoc(null)}></div>
          <div className="relative bg-[#0c1222] border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Move size={14} className="text-blue-500" />
                Di Chuyển Thư Mục
              </h3>
              <button onClick={() => setMovingDoc(null)} className="text-slate-455 hover:text-white transition">
                <X size={14} />
              </button>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed">
              Chọn thư mục đích cho tài liệu <strong>{movingDoc.name}</strong>.
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => handleMoveDocument(null)}
                className="w-full text-left px-3 py-2.5 bg-slate-900/30 hover:bg-slate-850 text-xs font-bold rounded-xl text-slate-300 border border-slate-850 hover:border-slate-700 transition cursor-pointer"
              >
                📁 Trang chủ
              </button>
              {renderFolderOptionsForMove(folderTree)}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Single Document Tags */}
      {editingTagsDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTagsDoc(null)}></div>
          <div className="relative bg-[#0c1222] border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={14} className="text-blue-500" />
                Sửa Nhãn Dán (Tags)
              </h3>
              <button onClick={() => setEditingTagsDoc(null)} className="text-slate-455 hover:text-white transition">
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-455 uppercase">Các nhãn (Chọn từ Dropbox hoặc nhập mới):</label>
              <TagSelector 
                selectedTags={tempTags} 
                onChange={setTempTags} 
                availableTags={allUniqueTags}
                placeholder="Chọn hoặc gõ nhãn mới..."
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setEditingTagsDoc(null)}
                className="flex-1 py-2 bg-slate-855 hover:bg-slate-800 text-xs text-slate-300 font-bold rounded-xl border border-slate-700/60 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateTags}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-white font-extrabold rounded-xl transition cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Move Selected Documents */}
      {showBatchMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBatchMoveModal(false)}></div>
          <div className="relative bg-[#0c1222] border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Move size={14} className="text-blue-500" />
                Di Chuyển Hàng Loạt
              </h3>
              <button onClick={() => setShowBatchMoveModal(false)} className="text-slate-455 hover:text-white transition">
                <X size={14} />
              </button>
            </div>

            <p className="text-[10px] text-slate-455 leading-relaxed">
              Chọn thư mục điểm đến cho <strong>{selectedDocIds.length}</strong> tài liệu đã chọn.
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => handleBatchMove(null)}
                className="w-full text-left px-3 py-2.5 bg-slate-900/30 hover:bg-slate-850 text-xs font-bold rounded-xl text-slate-300 border border-slate-850 hover:border-slate-700 transition cursor-pointer"
              >
                📁 Trang chủ
              </button>
              {renderFolderOptionsForBatchMove(folderTree)}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Update Tags */}
      {showBatchTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBatchTagsModal(false)}></div>
          <div className="relative bg-[#0c1222] border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={14} className="text-blue-500" />
                Gắn Nhãn Đồng Loạt
              </h3>
              <button onClick={() => setShowBatchTagsModal(false)} className="text-slate-455 hover:text-white transition">
                <X size={14} />
              </button>
            </div>

            <p className="text-[10px] text-slate-455 leading-relaxed">
              Thiết lập các nhãn dán chung sẽ áp dụng cho <strong>{selectedDocIds.length}</strong> tài liệu đang chọn.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-455 uppercase">Nhãn dán (Chọn từ Dropbox hoặc nhập mới):</label>
              <TagSelector 
                selectedTags={batchTags} 
                onChange={setBatchTags} 
                availableTags={allUniqueTags}
                placeholder="Chọn nhãn..."
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setBatchTags([]);
                  setShowBatchTagsModal(false);
                }}
                className="flex-1 py-2 bg-slate-855 hover:bg-slate-800 text-xs text-slate-300 font-bold rounded-xl border border-slate-700/60 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleBatchUpdateTags}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-white font-extrabold rounded-xl transition cursor-pointer"
              >
                Gắn Nhãn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
