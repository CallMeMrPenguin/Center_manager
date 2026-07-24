import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { api } from '../../api';
import { DbVocab } from '../../types';
import PromptManager, { PromptItem } from '../../components/PromptManager';
import { useConfirm } from '../../components/ConfirmDialog';

const DEFAULT_VOCABULARY_BANK_PROMPTS: PromptItem[] = [
  {
    id: "vb_1",
    title: "Trích xuất từ vựng từ đoạn văn bản",
    content: `Đọc đoạn văn sau và trích xuất tất cả các từ vựng quan trọng. Với mỗi từ, cung cấp từ loại (pos), phiên âm IPA (ipa), nghĩa tiếng Việt (meaning), mức độ khó (DỄ, TRUNG BÌNH, KHÓ) và từ gốc (root_word nếu có).`
  },
  {
    id: "vb_2",
    title: "Tạo danh sách Word Family từ chủ đề",
    content: `Tạo 10 từ vựng cốt lõi kèm theo các từ family liên quan (danh từ, động từ, tính từ, trạng từ) cho chủ đề "Environment". Định dạng từ gốc bằng dấu ngoặc vuông [ ] và các từ gia đình liên quan bằng dấu ngoặc nhọn { }.`
  }
];
import { 
  Search, Trash2, Upload, Database, Download,
  Filter, CheckSquare, Square, RefreshCw, Eye,
  AlertTriangle, CheckCircle2, X, Sparkles, FolderOpen, FileText, Check, HelpCircle
} from 'lucide-react';
import { showToast } from '../../components/Toast';

const ColumnHeaderFilter = ({ 
  columnKey, 
  columnLabel, 
  uniqueValues,
  filter,
  isOpen,
  onToggleOpen,
  sortConfig,
  onSort,
  onUpdateFilter
}: { 
  columnKey: string; 
  columnLabel: string; 
  uniqueValues: string[];
  filter: { search: string; selectedValues: string[] };
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (config: { key: string; direction: 'asc' | 'desc' } | null) => void;
  onUpdateFilter: (key: string, search: string, selected: string[]) => void;
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [searchText, setSearchText] = useState(filter.search);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(300);

  // Sync external filter search changes (e.g. from filter reset)
  useEffect(() => {
    setSearchText(filter.search);
  }, [filter.search]);

  // Debounced filter update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== filter.search) {
        onUpdateFilter(columnKey, searchText, filter.selectedValues);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, columnKey, onUpdateFilter, filter.search, filter.selectedValues]);

  useEffect(() => {
    if (isOpen) {
      const updateMaxHeight = () => {
        if (containerRef.current) {
          const containerEl = containerRef.current.closest('.table-scroll-container');
          if (containerEl) {
            const containerRect = containerEl.getBoundingClientRect();
            const cellEl = containerRef.current.closest('th');
            if (cellEl) {
              const cellRect = cellEl.getBoundingClientRect();
              const availableHeight = containerRect.bottom - cellRect.bottom - 16;
              setMaxHeight(Math.max(150, availableHeight));
            } else {
              const buttonRect = containerRef.current.getBoundingClientRect();
              const availableHeight = containerRect.bottom - buttonRect.bottom - 16;
              setMaxHeight(Math.max(150, availableHeight));
            }
          } else {
            setMaxHeight(300);
          }
        }
      };

      updateMaxHeight();
      window.addEventListener('resize', updateMaxHeight);
      return () => window.removeEventListener('resize', updateMaxHeight);
    }
  }, [isOpen]);

  const filteredValues = useMemo(() => {
    if (!localSearch.trim()) return uniqueValues;
    const sLower = localSearch.toLowerCase();
    return uniqueValues.filter(val => val.toLowerCase().includes(sLower));
  }, [uniqueValues, localSearch]);

  const displayedValues = filteredValues.slice(0, 50);

  const isFiltered = filter.selectedValues.length > 0 || filter.search !== '';
  const isSorted = sortConfig?.key === columnKey;

  const isRightAligned = ['content', 'options', 'answer', 'level', 'frequency', 'pos', 'ipa', 'meaning', 'difficulty', 'rootWord'].includes(columnKey);

  return (
    <div ref={containerRef} className="inline-block text-left header-filter-container" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onToggleOpen(isOpen ? null : (columnKey as any))}
        className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
          isFiltered || isSorted
            ? 'text-blue-400 bg-blue-500/10'
            : 'text-slate-500 hover:text-slate-350'
        }`}
        title={`Lọc/Sắp xếp cột ${columnLabel}`}
      >
        <Filter size={11} />
      </button>

      {isOpen && (
        <div 
          className={`absolute top-full mt-1.5 w-64 filter-dropdown-menu z-50 py-3.5 px-3 flex flex-col gap-3 text-slate-200 normal-case font-normal ${
            isRightAligned ? 'right-0 left-auto' : 'left-0 right-auto'
          }`}
          style={{ '--filter-menu-max-height': `${maxHeight}px` } as React.CSSProperties}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <span className="text-[0.66rem] font-bold text-slate-450 uppercase tracking-wider">Lọc: {columnLabel}</span>
            <button 
              onClick={() => onToggleOpen(null as any)}
              className="text-slate-500 hover:text-white transition"
            >
              <X size={12} />
            </button>
          </div>

          {/* Sort Buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                onSort({ key: columnKey, direction: 'asc' });
                onToggleOpen(null as any);
              }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-900 transition flex items-center gap-2 font-medium ${
                sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-300'
              }`}
            >
              <span className="text-[0.66rem] font-bold">↑</span> Sắp xếp tăng dần (A-Z)
            </button>
            <button
              onClick={() => {
                onSort({ key: columnKey, direction: 'desc' });
                onToggleOpen(null as any);
              }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-900 transition flex items-center gap-2 font-medium ${
                sortConfig?.key === columnKey && sortConfig.direction === 'desc' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-300'
              }`}
            >
              <span className="text-[0.66rem] font-bold">↓</span> Sắp xếp giảm dần (Z-A)
            </button>
          </div>

          {/* Search Input for Cell Contents */}
          {columnKey !== 'options' && (
            <div className="flex flex-col gap-1 border-t border-slate-900/60 pt-2.5">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase">Tìm trong cột</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nhập từ khóa tìm..."
                className="w-full px-2.5 py-1.5 bg-[#070B14] border border-slate-800 focus:border-blue-500/50 text-xs rounded-lg outline-none text-slate-200 placeholder-slate-655 transition"
              />
            </div>
          )}

          {/* Unique Values Checklist */}
          {columnKey !== 'options' && (
            <div className="flex flex-col gap-1 border-t border-slate-900/60 pt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.6rem] font-bold text-slate-500 uppercase">Bộ lọc giá trị</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onUpdateFilter(columnKey, searchText, []);
                    }}
                    className="text-[0.6rem] text-blue-400 hover:underline font-bold"
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => {
                      onUpdateFilter(columnKey, searchText, ['__NONE__']);
                    }}
                    className="text-[0.6rem] text-rose-400 hover:underline font-bold"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Tìm giá trị lọc..."
                className="w-full px-2 py-1 bg-[#070B14] border border-slate-850 focus:border-blue-500/50 text-[0.66rem] rounded mb-1.5 outline-none text-slate-300 placeholder-slate-650"
              />

              <div className="max-h-36 overflow-y-auto pr-1 flex flex-col gap-1">
                {displayedValues.length === 0 ? (
                  <span className="text-[0.66rem] text-slate-600 italic px-2">Không có giá trị</span>
                ) : (
                  <>
                    {displayedValues.map((val) => {
                      const isChecked = () => {
                        const selected = filter.selectedValues;
                        if (selected.length === 0) return true;
                        if (selected.includes('__NONE__')) return false;
                        return selected.includes(val);
                      };

                      const handleToggleVal = () => {
                        const current = filter.selectedValues;
                        let next: string[] = [];
                        if (current.length === 0) {
                          next = uniqueValues.filter(v => v !== val);
                        } else if (current.includes('__NONE__')) {
                          next = [val];
                        } else {
                          if (current.includes(val)) {
                            next = current.filter(v => v !== val);
                            if (next.length === 0) {
                              next = ['__NONE__'];
                            }
                          } else {
                            next = [...current, val];
                            if (next.length === uniqueValues.length) {
                              next = [];
                            }
                          }
                        }
                        onUpdateFilter(columnKey, searchText, next);
                      };

                      return (
                        <label key={val} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-900 rounded cursor-pointer text-[0.73rem] text-slate-300 hover:text-white transition">
                          <input
                            type="checkbox"
                            checked={isChecked()}
                            onChange={handleToggleVal}
                            className="rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                          />
                          <span className="truncate">{val}</span>
                        </label>
                      );
                    })}
                    {filteredValues.length > 50 && (
                      <span className="text-[10px] text-slate-500 italic px-2 pt-1 border-t border-slate-900/40">
                        Hiển thị 50 / {filteredValues.length} giá trị (gõ thêm để tìm...)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Clear Filter for Column */}
          {(filter.search || filter.selectedValues.length > 0) && (
            <button
              onClick={() => {
                onUpdateFilter(columnKey, '', []);
                setLocalSearch('');
                setSearchText('');
              }}
              className="w-full py-1 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-[0.66rem] text-slate-450 hover:text-white font-bold rounded-lg transition"
            >
              Xóa bộ lọc cột
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function VocabularyBank({ isActive }: { isActive?: boolean }) {
  const confirm = useConfirm();
  const [vocabList, setVocabList] = useState<DbVocab[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>({});
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastedCsv, setPastedCsv] = useState('');
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);

  // Scoped Deletion Modal State
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    scope: 'all' | 'grade' | 'unit';
    grade: string;
    unit: string;
  }>({
    show: false,
    scope: 'all',
    grade: '',
    unit: ''
  });

  const fetchActiveGrades = async () => {
    try {
      const res = await api.getActiveGrades();
      if (res.success) {
        setAvailableGrades(res.grades);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVocabEdit = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.editDbVocab(id, editRow);
      if (res.success) {
        showToast("Đã cập nhật từ vựng thành công!", "success");
        setEditingId(null);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (e: any) {
      showToast(`Cập nhật thất bại: ${e.message || e}`, "error");
    } finally {
      setLoading(false);
    }
  };
  
  // Column Header Filters
  const [columnFilters, setColumnFilters] = useState<Record<string, { search: string; selectedValues: string[] }>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);

  const handleUpdateFilter = (columnKey: string, searchVal: string, selectedVals: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: { search: searchVal, selectedValues: selectedVals }
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setColumnFilters({});
    setSortConfig(null);
    setCurrentPage(1);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // CSV Validation & Preview Modal
  const [csvPreviewModal, setCsvPreviewModal] = useState<{
    show: boolean;
    items: any[];
    fileName: string;
  }>({
    show: false,
    items: [],
    fileName: ''
  });

  // Last Exported File
  const [lastExportedFile, setLastExportedFile] = useState<string | null>(null);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportGrade, setExportGrade] = useState('');
  const [exportUnit, setExportUnit] = useState('');
  const [saveToDocs, setSaveToDocs] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [saveFolderId, setSaveFolderId] = useState<string>('');

  useEffect(() => {
    if (saveToDocs && folders.length === 0) {
      api.getDocumentFolders().then(res => {
        if (res.success) setFolders(res.folders);
      }).catch(err => console.error("Error loading folders:", err));
    }
  }, [saveToDocs, folders.length]);

  const folderOptions = useMemo(() => {
    const map: Record<number, any> = {};
    const roots: any[] = [];
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

    const flat: Array<{ id: number; name: string; depth: number }> = [];
    const traverse = (nodes: any[], depth = 0) => {
      nodes.forEach(n => {
        flat.push({ id: n.id, name: n.name, depth });
        traverse(n.children, depth + 1);
      });
    };
    traverse(roots);
    return flat;
  }, [folders]);

  // Sync export defaults when modal opens
  useEffect(() => {
    if (showExportModal) {
      setExportGrade(columnFilters.grade?.selectedValues?.[0] || '6');
      setExportUnit(columnFilters.unit?.selectedValues?.[0] || '');
    }
  }, [showExportModal, columnFilters]);

  // Column Visibility State
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    no: true,
    grade: true,
    unit: true,
    vocabulary: true,
    pos: true,
    ipa: true,
    meaning: true,
    difficulty: true,
    rootWord: true
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const gradesList = availableGrades;
  const difficultiesList = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', '1', '2', '3'];
  const posList = ['n', 'v', 'adj', 'adv', 'prep', 'v phr', 'n phr', 'n/adj', 'v/n'];

  useEffect(() => {
    fetchActiveGrades();
  }, []);

  useEffect(() => {
    fetchVocab();
  }, []); // Fetch all on mount

  useEffect(() => {
    if (isActive) {
      fetchVocab();
    }
  }, [isActive]);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target && !document.body.contains(target)) {
        return;
      }
      if (colMenuRef.current && !colMenuRef.current.contains(target)) {
        setShowColMenu(false);
      }
      if (!target.closest('.header-filter-container')) {
        setActiveHeaderMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchVocab = async () => {
    setLoading(true);
    try {
      const res = await api.getDbVocab({});
      if (res.success) {
        setVocabList(res.vocab);
        setCurrentPage(1); // Reset to first page
      }
    } catch (e) {
      console.error(e);
      showToast("Không thể tải danh sách từ vựng", "error");
    } finally {
      setLoading(false);
    }
  };

  // CSV Import duplicate checking
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImportCsvFile(file);
    e.target.value = '';
  };

  const handleImportCsvFile = async (file: File) => {
    setLoading(true);
    try {
      showToast("Đang kiểm tra trùng lặp từ vựng trong CSV...", "warning");
      const res = await api.validateDbVocabCsv(file);
      if (res.success) {
        setCsvPreviewModal({
          show: true,
          items: res.items,
          fileName: file.name
        });
        setShowImportModal(false);
        setPastedCsv('');
        setSelectedCsvFile(null);
      }
    } catch (err: any) {
      showToast(`Kiểm tra CSV thất bại: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitImport = () => {
    if (selectedCsvFile) {
      handleImportCsvFile(selectedCsvFile);
    } else if (pastedCsv.trim()) {
      const file = new File([pastedCsv], "pasted_vocab.csv", { type: "text/csv" });
      handleImportCsvFile(file);
    } else {
      showToast("Vui lòng chọn một tệp CSV hoặc dán nội dung CSV!", "warning");
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await api.confirmDbVocabImport(csvPreviewModal.items);
      if (res.success) {
        showToast(`Đã nhập thành công ${res.count} từ vựng mới vào CSDL!`, "success");
        setCsvPreviewModal({ show: false, items: [], fileName: '' });
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Nhập từ vựng thất bại: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Client-side filtering and sorting logic
  const filteredAndSortedVocab = useMemo(() => {
    let result = [...vocabList];

    Object.entries(columnFilters).forEach(([key, filter]) => {
      const { search: sVal, selectedValues } = filter;

      if (sVal.trim() !== '') {
        const sLower = sVal.toLowerCase();
        result = result.filter(v => {
          let val = '';
          if (key === 'grade') val = v.grade || '';
          else if (key === 'unit') val = v.unit || '';
          else if (key === 'vocabulary') val = v.vocabulary || '';
          else if (key === 'pos') val = v.pos || '';
          else if (key === 'ipa') val = v.ipa || '';
          else if (key === 'meaning') val = v.meaning || '';
          else if (key === 'difficulty') val = v.difficulty || '';
          else if (key === 'rootWord') val = v.root_word || '';
          return val.toLowerCase().includes(sLower);
        });
      }

      if (selectedValues.length > 0 && !selectedValues.includes('__NONE__')) {
        result = result.filter(v => {
          let val = '';
          if (key === 'grade') val = v.grade || '';
          else if (key === 'unit') val = v.unit || '';
          else if (key === 'vocabulary') val = v.vocabulary || '';
          else if (key === 'pos') val = v.pos || '';
          else if (key === 'ipa') val = v.ipa || '';
          else if (key === 'meaning') val = v.meaning || '';
          else if (key === 'difficulty') val = v.difficulty || '';
          else if (key === 'rootWord') val = v.root_word || 'Chưa phân loại';
          return selectedValues.includes(val);
        });
      } else if (selectedValues.includes('__NONE__')) {
        result = result.filter(v => {
          let val = '';
          if (key === 'grade') val = v.grade || '';
          else if (key === 'unit') val = v.unit || '';
          else if (key === 'vocabulary') val = v.vocabulary || '';
          else if (key === 'pos') val = v.pos || '';
          else if (key === 'ipa') val = v.ipa || '';
          else if (key === 'meaning') val = v.meaning || '';
          else if (key === 'difficulty') val = v.difficulty || '';
          else if (key === 'rootWord') val = v.root_word || '';
          return val.trim() === '';
        });
      }
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (key === 'grade' || key === 'unit') {
          valA = parseInt((a as any)[key]) || 0;
          valB = parseInt((b as any)[key]) || 0;
        } else if (key === 'vocabulary') {
          valA = a.vocabulary || '';
          valB = b.vocabulary || '';
        } else if (key === 'pos') {
          valA = a.pos || '';
          valB = b.pos || '';
        } else if (key === 'ipa') {
          valA = a.ipa || '';
          valB = b.ipa || '';
        } else if (key === 'meaning') {
          valA = a.meaning || '';
          valB = b.meaning || '';
        } else if (key === 'difficulty') {
          valA = a.difficulty || '';
          valB = b.difficulty || '';
        } else if (key === 'rootWord') {
          valA = a.root_word || '';
          valB = b.root_word || '';
        } else {
          valA = (a as any)[key] || '';
          valB = (b as any)[key] || '';
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction === 'asc' ? valA - valB : valB - valA;
        }

        const sA = String(valA).toLowerCase();
        const sB = String(valB).toLowerCase();
        if (sA < sB) return direction === 'asc' ? -1 : 1;
        if (sA > sB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [vocabList, columnFilters, sortConfig]);

  // Sliced paginated list helper
  const totalPages = Math.ceil(filteredAndSortedVocab.length / pageSize);
  const paginatedVocab = filteredAndSortedVocab.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedVocab.map((v: DbVocab) => v.id);
    const allSelected = pageIds.every((id: number) => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await confirm({
      title: "Xóa từ vựng",
      message: `Bạn có chắc muốn xóa ${selectedIds.length} mục từ vựng đã chọn khỏi cơ sở dữ liệu?`,
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const res = await api.deleteDbVocab(selectedIds);
      if (res.success) {
        showToast(`Đã xóa thành công ${res.count} từ vựng.`, "success");
        setSelectedIds([]);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Xóa thất bại: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearDb = async () => {
    const isConfirmed = await confirm({
      title: "Xóa toàn bộ từ vựng",
      message: "CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ danh sách từ vựng trong cơ sở dữ liệu? Hành động này không thể hoàn tác.",
      confirmText: "Xóa toàn bộ",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const res = await api.clearDbVocab();
      if (res.success) {
        showToast("Đã làm trống danh sách từ vựng thành công.", "success");
        setSelectedIds([]);
        setVocabList([]);
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Không thể làm trống DB: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleScopedDelete = async () => {
    let confirmMsg = "";
    if (deleteModal.scope === 'all') {
      confirmMsg = "CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ danh sách từ vựng? Hành động này không thể hoàn tác.";
    } else if (deleteModal.scope === 'grade') {
      if (!deleteModal.grade) {
        showToast("Vui lòng chọn Khối lớp cần xóa", "warning");
        return;
      }
      confirmMsg = `Bạn có chắc chắn muốn xóa tất cả từ vựng thuộc Lớp ${deleteModal.grade}? Hành động này không thể hoàn tác.`;
    } else if (deleteModal.scope === 'unit') {
      if (!deleteModal.grade) {
        showToast("Vui lòng chọn Khối lớp", "warning");
        return;
      }
      if (!deleteModal.unit.trim()) {
        showToast("Vui lòng nhập Unit cần xóa", "warning");
        return;
      }
      confirmMsg = `Bạn có chắc chắn muốn xóa tất cả từ vựng thuộc Unit ${deleteModal.unit} của Lớp ${deleteModal.grade}? Hành động này không thể hoàn tác.`;
    }

    const isConfirmed = await confirm({
      title: "Xác nhận xóa từ vựng",
      message: confirmMsg,
      confirmText: "Xóa dữ liệu",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await api.clearDbVocab(
        deleteModal.scope !== 'all' ? deleteModal.grade : undefined,
        deleteModal.scope === 'unit' ? deleteModal.unit.trim() : undefined
      );
      if (res.success) {
        showToast("Đã thực hiện xóa dữ liệu thành công.", "success");
        setDeleteModal({ show: false, scope: 'all', grade: '', unit: '' });
        setSelectedIds([]);
        fetchVocab();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Không thể xóa dữ liệu: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Export vocabulary to Word (direct disk save)
  const handleExportDocx = async () => {
    if (!exportGrade) {
      showToast("Vui lòng chọn Khối lớp cần xuất!", "warning");
      return;
    }
    setLoading(true);
    setShowExportModal(false);
    try {
      const res = await api.exportDbVocabDocx({
        grade: parseInt(exportGrade),
        unit: exportUnit || undefined,
        difficulty: columnFilters.difficulty?.selectedValues?.[0] || undefined,
        pos: columnFilters.pos?.selectedValues?.[0] || undefined,
        search: columnFilters.vocabulary?.search || undefined,
        save_to_documents: saveToDocs,
        save_folder_id: saveFolderId || null
      });
      
      if (res.success) {
        setLastExportedFile(res.filename);
        showToast(`Xuất file thành công! Đã lưu: ${res.filename}`, "success");
      }
    } catch (err: any) {
      showToast(`Xuất tệp Word thất bại: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!exportGrade) {
      showToast("Vui lòng chọn Khối lớp cần xuất!", "warning");
      return;
    }
    setLoading(true);
    setShowExportModal(false);
    try {
      const res = await api.exportDbVocabCsv({
        grade: parseInt(exportGrade),
        unit: exportUnit || undefined,
        difficulty: columnFilters.difficulty?.selectedValues?.[0] || undefined,
        pos: columnFilters.pos?.selectedValues?.[0] || undefined,
        search: columnFilters.vocabulary?.search || undefined,
        save_to_documents: saveToDocs,
        save_folder_id: saveFolderId || null
      });
      
      if (res.success) {
        setLastExportedFile(res.filename);
        showToast(`Xuất file CSV thành công! Đã lưu: ${res.filename}`, "success");
      }
    } catch (err: any) {
      showToast(`Xuất tệp CSV thất bại: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };


  const handleOpenFile = async () => {
    if (!lastExportedFile) return;
    try {
      await api.openLocalFile(lastExportedFile);
      showToast(`Đang mở tệp: ${lastExportedFile}`, "success");
    } catch (e) {
      showToast(`Lỗi mở tệp: ${e}`, "error");
    }
  };

  const handleOpenFolder = async () => {
    try {
      await api.openWorkspaceFolder();
      showToast("Đang mở thư mục chứa tệp tin...", "success");
    } catch (e) {
      showToast(`Lỗi mở thư mục: ${e}`, "error");
    }
  };

  const uniqueValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const keys = ['grade', 'unit', 'vocabulary', 'pos', 'ipa', 'meaning', 'difficulty', 'rootWord'];
    keys.forEach(key => {
      const vals = vocabList.map(v => {
        if (key === 'grade') return v.grade || '';
        if (key === 'unit') return v.unit || '';
        if (key === 'vocabulary') return v.vocabulary || '';
        if (key === 'pos') return v.pos || '';
        if (key === 'ipa') return v.ipa || '';
        if (key === 'meaning') return v.meaning || '';
        if (key === 'difficulty') return v.difficulty || '';
        if (key === 'rootWord') return v.root_word || 'Chưa phân loại';
        return String((v as any)[key] || '');
      }).filter(Boolean);

      map[key] = Array.from(new Set(vals)).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
    });
    return map;
  }, [vocabList]);

  const getUniqueValues = useCallback((key: string) => {
    return uniqueValuesMap[key] || [];
  }, [uniqueValuesMap]);

  const toggleCol = (colKey: string) => {
    setVisibleCols(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  const renderFormattedVocab = (vocab: string) => {
    if (!vocab) return '-';
    
    const prefixMatch = vocab.match(/^\(([^)]+)\)\s*(.*)$/);
    let prefix = '';
    let rest = vocab;
    if (prefixMatch) {
      prefix = `(${prefixMatch[1]}) `;
      rest = prefixMatch[2].trim();
    }
    
    const isCore = rest.startsWith('[') && rest.endsWith(']');
    const isRelated = rest.startsWith('{') && rest.endsWith('}');
    
    let cleanWord = rest;
    if (isCore) cleanWord = rest.slice(1, -1);
    if (isRelated) cleanWord = rest.slice(1, -1);
    
    return (
      <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs">
        {prefix && (
          <span className="text-rose-450 font-extrabold italic text-[0.73rem]" title="Tiền tố phủ định">
            {prefix}
          </span>
        )}
        {isCore ? (
          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black tracking-wide" title="Từ gốc cốt lõi">
            {cleanWord}
          </span>
        ) : isRelated ? (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold" title="Word Family liên quan mật thiết">
            {cleanWord}
          </span>
        ) : (
          <span className="text-slate-400 font-normal italic" title="Word Family bổ sung ít liên quan">
            {cleanWord}
          </span>
        )}
      </div>
    );
  };



  return (
    <div className="flex flex-col h-full bg-transparent text-slate-100 p-8 overflow-y-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5 drop-shadow-md">
            <Database className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={22} />
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">DANH SÁCH TỪ VỰNG CHỦ ĐỀ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý kho từ vựng tiếng Anh chủ đề local. Phân cấp từ gốc cốt lõi [ ] và các nhóm từ word family {'{ }'}.
            <span className="ml-3 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-[10px]">
              TỔNG SỐ TỪ VỰNG THEO BỘ LỌC: {filteredAndSortedVocab.length}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-1 shrink-0">
          {/* Prompt Manager Button */}
          <PromptManager 
            storageKey="prompts_vocabulary_bank" 
            tabTitle="Từ Vựng Chủ Đề" 
            defaultPrompts={DEFAULT_VOCABULARY_BANK_PROMPTS} 
          />

          {/* Export Word Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer transition-all duration-300 shadow-md shadow-blue-500/10"
            title="Xuất Word (.docx)"
          >
            <Download size={14} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 whitespace-nowrap block">Xuất Word (.docx)</span>
          </button>

          {/* Reset Filters button */}
          {(Object.values(columnFilters).some(f => f.search !== '' || f.selectedValues.length > 0) || sortConfig !== null) && (
            <button
              onClick={resetFilters}
              className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-400 hover:text-rose-455 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300"
              title="Xóa bộ lọc"
            >
              <RefreshCw size={14} />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Xóa bộ lọc</span>
            </button>
          )}

          {/* Column Visibility Selector */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 text-slate-350 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 shadow-sm"
              title="Cột hiển thị"
            >
              <Eye size={14} />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Cột hiển thị</span>
            </button>
            
            {showColMenu && (
              <div className="absolute right-0 mt-2 w-52 filter-dropdown-menu z-20 py-2.5 px-3 flex flex-col gap-1.5">
                <p className="text-[0.66rem] text-slate-500 font-extrabold uppercase tracking-wider px-2 pb-1 border-b border-slate-900">Ẩn / Hiện Cột</p>
                {Object.entries({
                  no: 'Số thứ tự (No.)',
                  grade: 'Khối lớp',
                  unit: 'Unit',
                  vocabulary: 'Từ vựng',
                  pos: 'Từ loại (POS)',
                  ipa: 'Phát âm (IPA)',
                  meaning: 'Dịch nghĩa',
                  difficulty: 'Độ khó',
                  rootWord: 'Từ gốc'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 px-2 py-1 hover:bg-slate-900 rounded-lg cursor-pointer text-xs font-medium text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={visibleCols[key]}
                      onChange={() => toggleCol(key)}
                      className="rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer h-3.5 w-3.5"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CSV Import */}
          <button
            onClick={() => setShowImportModal(true)}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 shadow-sm"
            title="Nhập CSV Từ Vựng"
          >
            <Upload size={14} className="text-blue-400" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[140px] transition-all duration-300 whitespace-nowrap block">Nhập CSV Từ Vựng</span>
          </button>
          
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-450 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300"
              title={`Xóa (${selectedIds.length})`}
            >
              <Trash2 size={14} />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Xóa ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setDeleteModal(prev => ({ ...prev, show: true }))}
            disabled={loading}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-400 hover:text-rose-450 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300"
            title="Xóa danh sách từ vựng trong cơ sở dữ liệu"
          >
            <Trash2 size={14} className="text-rose-500" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Xóa Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* BANNER TO OPEN EXPORTED FILE */}
      {lastExportedFile && (
        <div className="bg-[#101B2E] border border-blue-900/40 px-6 py-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 shadow-xl animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-450 rounded-xl">
              <FileText size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Đã xuất bản từ vựng thành công!</h4>
              <p className="text-[0.66rem] text-slate-400 font-semibold mt-0.5 font-mono">{lastExportedFile}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFile}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-[0.66rem] rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/15 transition cursor-pointer"
            >
              <Sparkles size={11} />
              <span>MỞ FILE WORD</span>
            </button>
            <button
              onClick={handleOpenFolder}
              className="px-4 py-2 bg-[#0B0F19] hover:bg-slate-900 border border-slate-800 text-slate-350 hover:text-white font-extrabold text-[0.66rem] rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderOpen size={11} />
              <span>MỞ THƯ MỤC</span>
            </button>
            <button 
              onClick={() => setLastExportedFile(null)}
              className="p-2 text-slate-500 hover:text-slate-350 transition"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* TABLE WORKSPACE WITH SOLID DARK BACKGROUND (NO TRANSPARENCY) */}
      <div className="flex-auto bg-[#0c0f1d] border border-[#1e2744] rounded-2xl shadow-2xl overflow-hidden opacity-100 backdrop-blur-none flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-blue-500" size={28} />
            <span className="text-xs text-slate-500 font-semibold">Đang truy vấn dữ liệu...</span>
          </div>
        ) : vocabList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="h-14 w-14 rounded-full bg-slate-900 flex items-center justify-center border border-slate-850 mb-4 text-slate-500">
              <Database size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Không tìm thấy từ vựng</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Kho từ vựng hiện tại trống hoặc bộ lọc không trả về kết quả. Vui lòng tải tệp CSV từ vựng lên.
            </p>
          </div>
        ) : (
          <div className="flex-auto flex flex-col overflow-hidden relative min-h-0">
            <div className="overflow-auto table-scroll-container">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#121626] border-b border-[#232d4e] text-[0.66rem] text-slate-400 font-extrabold uppercase tracking-wider sticky top-0 z-10 opacity-100">
                    <th className="py-4 px-5 w-12 text-center">
                      <button
                        onClick={handleSelectAllOnPage}
                        className="text-slate-500 hover:text-slate-300 transition"
                      >
                        {paginatedVocab.every((v: DbVocab) => selectedSet.has(v.id)) ? (
                          <CheckSquare size={16} className="text-blue-500" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    {visibleCols.no && (
                      <th className="py-4 px-3 w-16 whitespace-nowrap relative">
                        <div className="flex items-center gap-1 justify-between">
                          <span>No.</span>
                        </div>
                      </th>
                    )}
                    {visibleCols.grade && (
                      <th className={`py-4 px-3 w-24 min-w-[5.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'grade' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Grade</span>
                          <ColumnHeaderFilter 
                            columnKey="grade" 
                            columnLabel="Grade" 
                            uniqueValues={getUniqueValues('grade')}
                            filter={columnFilters['grade'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'grade'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.unit && (
                      <th className={`py-4 px-3 w-24 min-w-[5.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'unit' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Unit</span>
                          <ColumnHeaderFilter 
                            columnKey="unit" 
                            columnLabel="Unit" 
                            uniqueValues={getUniqueValues('unit')}
                            filter={columnFilters['unit'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'unit'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.vocabulary && (
                      <th className={`py-4 px-4 min-w-[12rem] relative ${activeHeaderMenu === 'vocabulary' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Từ vựng</span>
                          <ColumnHeaderFilter 
                            columnKey="vocabulary" 
                            columnLabel="Từ vựng" 
                            uniqueValues={getUniqueValues('vocabulary')}
                            filter={columnFilters['vocabulary'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'vocabulary'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.pos && (
                      <th className={`py-4 px-3 w-28 min-w-[6.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'pos' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>POS</span>
                          <ColumnHeaderFilter 
                            columnKey="pos" 
                            columnLabel="POS" 
                            uniqueValues={getUniqueValues('pos')}
                            filter={columnFilters['pos'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'pos'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.ipa && (
                      <th className={`py-4 px-4 w-36 min-w-[8.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'ipa' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>IPA</span>
                          <ColumnHeaderFilter 
                            columnKey="ipa" 
                            columnLabel="IPA" 
                            uniqueValues={getUniqueValues('ipa')}
                            filter={columnFilters['ipa'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'ipa'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.meaning && (
                      <th className={`py-4 px-5 min-w-[16rem] relative ${activeHeaderMenu === 'meaning' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Dịch nghĩa</span>
                          <ColumnHeaderFilter 
                            columnKey="meaning" 
                            columnLabel="Dịch nghĩa" 
                            uniqueValues={getUniqueValues('meaning')}
                            filter={columnFilters['meaning'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'meaning'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.difficulty && (
                      <th className={`py-4 px-3 w-28 min-w-[6.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'difficulty' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Độ khó</span>
                          <ColumnHeaderFilter 
                            columnKey="difficulty" 
                            columnLabel="Độ khó" 
                            uniqueValues={getUniqueValues('difficulty')}
                            filter={columnFilters['difficulty'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'difficulty'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.rootWord && (
                      <th className={`py-4 px-4 w-36 min-w-[9rem] whitespace-nowrap relative ${activeHeaderMenu === 'rootWord' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Từ gốc</span>
                          <ColumnHeaderFilter 
                            columnKey="rootWord" 
                            columnLabel="Từ gốc" 
                            uniqueValues={getUniqueValues('rootWord')}
                            filter={columnFilters['rootWord'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'rootWord'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    <th className="py-4 px-3 w-24 text-center whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs">
                  {paginatedVocab.length === 0 && (
                    <tr>
                      <td 
                        colSpan={Object.values(visibleCols).filter(Boolean).length + 2} 
                        className="text-center py-32 text-slate-500 text-xs italic"
                      >
                        Không có từ vựng nào khớp với bộ lọc.
                      </td>
                    </tr>
                  )}
                  {paginatedVocab.map((v: DbVocab, idx: number) => {
                    const isSelected = selectedSet.has(v.id);
                    const isEditing = editingId === v.id;
                    
                    if (isEditing) {
                      return (
                        <tr key={v.id} className="bg-blue-600/5 border-b border-slate-900 text-xs">
                          {/* Checkbox Placeholder */}
                          <td className="py-3 px-5 text-center"></td>
                          
                          {/* No. */}
                          {visibleCols.no && (
                            <td className="py-3 px-3 text-slate-550 font-bold">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                          )}

                          {/* Grade */}
                          {visibleCols.grade && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.grade || ''} 
                                onChange={(e) => setEditRow({ ...editRow, grade: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Unit */}
                          {visibleCols.unit && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.unit || ''} 
                                onChange={(e) => setEditRow({ ...editRow, unit: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Vocabulary word */}
                          {visibleCols.vocabulary && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.vocabulary || ''} 
                                onChange={(e) => setEditRow({ ...editRow, vocabulary: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* POS */}
                          {visibleCols.pos && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.pos || ''} 
                                onChange={(e) => setEditRow({ ...editRow, pos: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* IPA */}
                          {visibleCols.ipa && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.ipa || ''} 
                                onChange={(e) => setEditRow({ ...editRow, ipa: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Meaning */}
                          {visibleCols.meaning && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.meaning || ''} 
                                onChange={(e) => setEditRow({ ...editRow, meaning: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Difficulty */}
                          {visibleCols.difficulty && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.difficulty || ''} 
                                onChange={(e) => setEditRow({ ...editRow, difficulty: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Root Word */}
                          {visibleCols.rootWord && (
                            <td className="py-2 px-2">
                              <input 
                                type="text" 
                                value={editRow.root_word || ''} 
                                onChange={(e) => setEditRow({ ...editRow, root_word: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Actions */}
                          <td className="py-2 px-3 text-center flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSaveVocabEdit(v.id)}
                              className="p-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-600/20 text-emerald-400 transition cursor-pointer"
                              title="Lưu thay đổi"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                              title="Hủy"
                            >
                              <X size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                    
                    return (
                      <tr 
                        key={v.id}
                        onClick={() => handleSelectRow(v.id)}
                        className={`hover:bg-slate-900/20 transition cursor-pointer ${
                          isSelected ? 'bg-blue-600/5' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSelectRow(v.id)}
                            className="text-slate-500 hover:text-slate-300 transition"
                          >
                            {isSelected ? (
                              <CheckSquare size={15} className="text-blue-500" />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                        </td>

                        {/* No. */}
                        {visibleCols.no && (
                          <td className="py-3.5 px-3 text-slate-550 font-bold">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                        )}

                        {/* Grade */}
                        {visibleCols.grade && (
                          <td className="py-3.5 px-3 font-semibold text-slate-400">
                            {v.grade ? `Lớp ${v.grade}` : '-'}
                          </td>
                        )}

                        {/* Unit */}
                        {visibleCols.unit && (
                          <td className="py-3.5 px-3 font-semibold text-slate-400">
                            {v.unit ? `Unit ${v.unit}` : '-'}
                          </td>
                        )}

                        {/* Vocabulary word */}
                        {visibleCols.vocabulary && (
                          <td className="py-3.5 px-4">
                            {renderFormattedVocab(v.vocabulary)}
                          </td>
                        )}

                        {/* POS */}
                        {visibleCols.pos && (
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[0.66rem] font-bold bg-[#111827] border border-slate-855 text-slate-400 italic">
                              {v.pos || '-'}
                            </span>
                          </td>
                        )}

                        {/* IPA */}
                        {visibleCols.ipa && (
                          <td className="py-3.5 px-4 text-slate-440 font-mono text-[0.73rem]">
                            {v.ipa || '-'}
                          </td>
                        )}

                        {/* Meaning */}
                        {visibleCols.meaning && (
                          <td className="py-3.5 px-5 font-semibold text-slate-300 break-words max-w-xs">
                            {v.meaning || '-'}
                          </td>
                        )}

                        {/* Difficulty */}
                        {visibleCols.difficulty && (
                          <td className="py-3.5 px-3 text-center">
                            {v.difficulty ? (
                              <span className={`px-2 py-0.5 rounded text-[0.6rem] font-black tracking-wider ${
                                v.difficulty.startsWith('A') || v.difficulty === '1' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                                v.difficulty.startsWith('B') || v.difficulty === '2' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                'bg-rose-500/10 text-rose-455 border border-rose-500/25'
                              }`}>
                                {v.difficulty}
                              </span>
                            ) : (
                              <span className="text-slate-655">-</span>
                            )}
                          </td>
                        )}

                        {/* Root Word */}
                        {visibleCols.rootWord && (
                          <td className="py-3.5 px-4 text-slate-450 italic">
                            {v.root_word || '-'}
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              setEditingId(v.id);
                              setEditRow({ ...v });
                            }}
                            className="px-2.5 py-1 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white text-[0.66rem] font-bold rounded-lg cursor-pointer transition animate-fade-in"
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredAndSortedVocab.length > 0 && (
              <div className="h-14 bg-[#14192b] border-t border-[#28334e] px-6 flex items-center justify-end shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-400 hover:text-white transition cursor-pointer text-xs font-black disabled:cursor-not-allowed"
                  >
                    {"<<"}
                  </button>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-400 hover:text-white transition cursor-pointer text-xs font-black disabled:cursor-not-allowed"
                  >
                    {"<"}
                  </button>
                  
                  <span className="px-3 text-xs text-slate-300 font-extrabold font-mono">
                    Trang {currentPage} / {Math.max(1, totalPages)}
                  </span>

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-400 hover:text-white transition cursor-pointer text-xs font-black disabled:cursor-not-allowed"
                  >
                    {">"}
                  </button>
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-400 hover:text-white transition cursor-pointer text-xs font-black disabled:cursor-not-allowed"
                  >
                    {">>"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Count Stats Footer */}
        <div className="h-12 bg-slate-950 border-t border-slate-900 flex items-center justify-between px-6 text-[0.66rem] font-bold text-slate-500 uppercase tracking-wider">
          <span>Tổng số từ vựng: {vocabList.length}</span>
          {selectedIds.length > 0 && (
            <span className="text-blue-400 font-extrabold">Đã chọn: {selectedIds.length} từ</span>
          )}
        </div>
      </div>

      {/* CSV IMPORT VALIDATION DUPLICATE REPORT DIALOG */}
      {csvPreviewModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-slate-855 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="h-14 border-b border-slate-900 bg-[#0A0D1A]/50 flex items-center justify-between px-6 shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
                Báo cáo kiểm tra trùng lặp CSV Từ Vựng: {csvPreviewModal.fileName}
              </span>
              <button
                onClick={() => setCsvPreviewModal({ show: false, items: [], fileName: '' })}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Stats */}
            <div className="bg-[#151f32]/40 border-b border-slate-900/60 p-5 shrink-0 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-slate-500 uppercase">Tổng từ vựng</p>
                <p className="text-xl font-black text-white mt-1">{csvPreviewModal.items.length}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-emerald-500 uppercase">Từ vựng mới hợp lệ</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {csvPreviewModal.items.filter(x => !x.is_duplicate).length}
                </p>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-rose-500 uppercase">Từ vựng trùng lặp</p>
                <p className="text-xl font-black text-rose-450 mt-1">
                  {csvPreviewModal.items.filter(x => x.is_duplicate).length}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto bg-slate-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-900 text-[0.66rem] text-slate-500 font-extrabold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-3.5 px-5 w-20">Lớp</th>
                    <th className="py-3.5 px-3 w-20">Unit</th>
                    <th className="py-3.5 px-3 w-36">Từ vựng</th>
                    <th className="py-3.5 px-4 min-w-[13.33rem]">Dịch nghĩa</th>
                    <th className="py-3.5 px-4 w-60">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/30">
                  {csvPreviewModal.items.map((item, index) => (
                    <tr 
                      key={index}
                      className={`hover:bg-slate-900/10 transition ${
                        item.is_duplicate ? 'bg-rose-950/10 text-slate-400' : 'text-slate-200'
                      }`}
                    >
                      <td className="py-3.5 px-5 font-bold">Lớp {item.grade}</td>
                      <td className="py-3.5 px-3 font-bold">Unit {item.unit}</td>
                      <td className="py-3.5 px-3 font-semibold text-blue-400">{item.vocabulary}</td>
                      <td className="py-3.5 px-4 truncate max-w-sm">{item.meaning}</td>
                      <td className="py-3.5 px-4 font-semibold">
                        {item.is_duplicate ? (
                          <span className="flex items-center gap-1.5 text-rose-450 text-[0.66rem] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20" title={item.duplicate_reason}>
                            <AlertTriangle size={12} />
                            <span>Trùng lặp</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-[0.66rem] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 size={12} />
                            <span>Hợp lệ</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="h-16 border-t border-slate-900 bg-[#0A0D1A]/50 flex items-center justify-between px-6 shrink-0">
              <p className="text-[0.66rem] text-slate-500 font-bold max-w-lg leading-normal">
                Nhấn "Bắt đầu nạp" sẽ bỏ qua kiểm tra trùng và ghi toàn bộ dữ liệu ở trên vào Cơ sở dữ liệu local.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setCsvPreviewModal({ show: false, items: [], fileName: '' })}
                  className="px-4.5 py-2 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Bắt đầu nạp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoped Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md filter-dropdown-menu p-6 flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Trash2 size={16} className="text-rose-500" />
                Xóa dữ liệu từ vựng
              </h3>
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, show: false }))}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-400">Chọn phạm vi muốn xóa:</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(prev => ({ ...prev, scope: 'all' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    deleteModal.scope === 'all'
                      ? 'bg-rose-600/10 text-rose-400 border-rose-550'
                      : 'bg-[#151f32]/30 text-slate-400 border-slate-850 hover:bg-[#151f32]/60'
                  }`}
                >
                  Toàn bộ
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModal(prev => ({ ...prev, scope: 'grade' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    deleteModal.scope === 'grade'
                      ? 'bg-rose-600/10 text-rose-400 border-rose-550'
                      : 'bg-[#151f32]/30 text-slate-400 border-slate-850 hover:bg-[#151f32]/60'
                  }`}
                >
                  Theo Lớp
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModal(prev => ({ ...prev, scope: 'unit' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    deleteModal.scope === 'unit'
                      ? 'bg-rose-600/10 text-rose-400 border-rose-550'
                      : 'bg-[#151f32]/30 text-slate-400 border-slate-850 hover:bg-[#151f32]/60'
                  }`}
                >
                  Lớp & Unit
                </button>
              </div>

              {deleteModal.scope !== 'all' && (
                <div className="flex flex-col gap-3.5 bg-[#151f32]/10 border border-slate-900/60 p-3.5 rounded-xl mt-1.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Chọn Khối lớp:</label>
                    <select
                      value={deleteModal.grade}
                      onChange={(e) => setDeleteModal(prev => ({ ...prev, grade: e.target.value }))}
                      className="bg-[#080b12] border border-slate-850 px-3 py-2 rounded-xl text-xs text-white cursor-pointer w-full"
                    >
                      <option value="">-- Chọn lớp --</option>
                      {availableGrades.map(g => (
                        <option key={g} value={g}>Lớp {g}</option>
                      ))}
                    </select>
                  </div>

                  {deleteModal.scope === 'unit' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Nhập số Unit (Ví dụ: 1 hoặc 2):</label>
                      <input
                        type="text"
                        value={deleteModal.unit}
                        onChange={(e) => setDeleteModal(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="Số Unit"
                        className="bg-[#080b12] border border-slate-850 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-slate-700 w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-400 leading-relaxed mt-1 flex gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Hành động xóa dữ liệu này là vĩnh viễn và không thể khôi phục lại. Bạn nên xuất file dự phòng trước khi xóa.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900 mt-2">
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleScopedDelete}
                disabled={loading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-md shadow-rose-500/10 transition cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL SELECTOR */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="h-14 border-b border-slate-900 bg-[#0A0D1A]/50 flex items-center justify-between px-6">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <Download className="text-blue-500" size={15} />
                CẤU HÌNH XUẤT TỪ VỰNG
              </span>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.66rem] font-bold text-slate-500 uppercase">Khối lớp (Bắt buộc)</label>
                <select
                  value={exportGrade}
                  onChange={(e) => setExportGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-slate-800 text-xs rounded-xl text-slate-300 outline-none font-bold cursor-pointer"
                >
                  {gradesList.map(g => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.66rem] font-bold text-slate-500 uppercase">Unit (Để trống để xuất tất cả)</label>
                <input
                  type="text"
                  value={exportUnit}
                  onChange={(e) => setExportUnit(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-slate-800 text-xs rounded-xl text-slate-200 outline-none font-bold"
                />
              </div>

              {/* Save to Documents checkbox */}
              <label className="flex items-center gap-2 mt-2 px-1 text-slate-350 text-xs font-bold cursor-pointer select-none hover:text-white transition">
                <input 
                  type="checkbox" 
                  checked={saveToDocs} 
                  onChange={(e) => setSaveToDocs(e.target.checked)} 
                  className="rounded border-slate-700 bg-slate-950 text-blue-655 focus:ring-blue-500 cursor-pointer"
                />
                <span>Lưu vào Tài liệu (Documents)</span>
              </label>

              {saveToDocs && (
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <label className="text-[0.66rem] font-bold text-slate-500 uppercase">Thư mục lưu trữ</label>
                  <select
                    value={saveFolderId}
                    onChange={(e) => setSaveFolderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080c14] border border-slate-800 text-xs text-slate-300 rounded-xl outline-none cursor-pointer transition font-bold"
                  >
                    <option value="">📁 Trang chủ (Cấp cao nhất)</option>
                    {folderOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {"\u00A0\u00A0".repeat(opt.depth) + "📁 " + opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportDocx}
                  className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-md shadow-blue-500/10 text-center"
                >
                  Xuất Word
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-md shadow-emerald-500/10 text-center"
                >
                  Xuất CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="col-span-2 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-xl font-bold text-xs transition cursor-pointer text-center"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Unified Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 text-slate-200 max-h-[90vh] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="text-blue-500" size={16} />
                Nhập từ vựng từ CSV
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPastedCsv('');
                  setSelectedCsvFile(null);
                }}
                className="text-slate-500 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {/* Option 1: File selection */}
              <div className="flex flex-col gap-1.5 bg-[#080b12] border border-slate-855 p-4 rounded-2xl">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Cách 1: Chọn tệp CSV từ máy tính</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-250 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-2">
                    <Upload size={14} />
                    <span>Chọn tệp CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedCsvFile(file);
                          setPastedCsv(''); // Clear pasted if file chosen
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-400 truncate">
                    {selectedCsvFile ? selectedCsvFile.name : "Chưa chọn tệp"}
                  </span>
                  {selectedCsvFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedCsvFile(null)}
                      className="text-rose-500 hover:text-rose-400 text-xs font-semibold"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Raw pasting */}
              <div className="flex flex-col gap-1.5 bg-[#080b12] border border-slate-855 p-4 rounded-2xl">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Cách 2: Dán trực tiếp nội dung CSV</label>
                <textarea
                  value={pastedCsv}
                  onChange={(e) => {
                    setPastedCsv(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedCsvFile(null); // Clear file if pasting
                    }
                  }}
                  placeholder="Dán nội dung CSV tại đây..."
                  rows={6}
                  className="bg-[#070b14] border border-slate-800 focus:border-blue-500/50 p-3 rounded-xl text-xs text-slate-200 outline-none placeholder-slate-600 transition font-mono mt-1"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-450 leading-normal flex gap-2">
                <HelpCircle size={14} className="shrink-0 mt-0.5 text-blue-400" />
                <span className="text-slate-350">
                  File CSV phải bao gồm tiêu đề tương ứng với các cột: <strong className="text-blue-400">No., Grade, Unit, Vocabulary, POS, IPA, Meaning, Difficulty, Root Word</strong>.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900 mt-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPastedCsv('');
                  setSelectedCsvFile(null);
                }}
                className="px-4 py-2 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitImport}
                disabled={loading || (!selectedCsvFile && !pastedCsv.trim())}
                className="px-5 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/10 transition cursor-pointer"
              >
                Bắt đầu kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
