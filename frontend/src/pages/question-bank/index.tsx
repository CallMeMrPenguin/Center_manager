import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { api } from '../../api';
import { DbQuestion } from '../../types';
import PromptManager, { PromptItem } from '../../components/PromptManager';
import { useConfirm } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { notifyDataChanged } from '../../utils';

const DEFAULT_QUESTION_BANK_PROMPTS: PromptItem[] = [
  {
    id: "qb_1",
    title: "Tạo câu hỏi ngữ pháp (Lớp 9 - Unit 1)",
    content: `Hãy tạo 10 câu hỏi trắc nghiệm ngữ pháp tiếng Anh lớp 9, Unit 1. Xuất ra dưới định dạng danh sách có các trường: Câu hỏi, 4 Tùy chọn, Đáp án đúng, Độ khó (NHẬN BIẾT, THÔNG HIỂU, VẬN DỤNG) và Khối lớp: 9, Unit: 1.`
  },
  {
    id: "qb_2",
    title: "Tạo bài tập tìm lỗi sai (Error Identification)",
    content: `Tạo 5 câu hỏi tìm lỗi sai (Error Identification) cho khối lớp 11. Các câu hỏi cần có dạng các phần gạch chân đánh dấu bằng (A), (B), (C), (D). Ví dụ: "Because of [his](A) illness, he [could not](B) go to school, [so](C) he was [sadly](D)."`
  }
];
import { 
  Search, Trash2, Upload, Database, Sparkles, CheckCircle2, 
  XCircle, Filter, PlusCircle, CheckSquare, Square, RefreshCw, Eye,
  AlertTriangle, ChevronLeft, ChevronRight, X, HelpCircle, Check, Download,
  ChevronDown, BookOpen
} from 'lucide-react';
import { showToast } from '../../components/Toast';

interface QuestionBankProps {
  onCreateTest: (questions: DbQuestion[], numVersions?: number, grade?: string, unit?: string) => void;
  isActive?: boolean;
}

const TYPE_MAP: Record<string, string> = {
  'pr': 'Pronunciation',
  'st': 'Stress',
  'er': 'Error Identification',
  'sy': 'Synonym',
  'an': 'Antonym',
  'cz': 'Cloze Passage',
  'ro': 'Reordering',
  'rd': 'Reading',
  'fb': 'Fill in the Blank',
  'rw': 'Rewrite Sentences',
  'wf': 'Word Form',
  'mq': 'Multiple Choice'
};

function parseUnits(unitStr: string): string[] {
  if (!unitStr) return [];
  const clean = unitStr.replace(/;/g, ',');
  
  // Check for range like "1-3"
  const rangeMatch = clean.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end)) {
      const units: string[] = [];
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      for (let i = from; i <= to; i++) {
        units.push(String(i));
      }
    }
  }
  return clean.split(',').map(p => p.trim()).filter(Boolean);
}

function FastPastedCsvInput({
  value,
  onFileClear,
  onTextChange,
}: {
  value?: string;
  onFileClear: () => void;
  onTextChange: (val: string) => void;
}) {
  return (
    <textarea
      onChange={(e) => {
        const text = e.target.value;
        onTextChange(text);
        if (text.trim()) {
          onFileClear();
        }
      }}
      placeholder="Dán nội dung CSV tại đây..."
      rows={6}
      className="bg-[#070b14] border border-slate-800 focus:border-blue-500/50 p-3 rounded-xl text-xs text-slate-200 outline-none placeholder-slate-600 transition font-mono mt-1 w-full"
    />
  );
}

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

export default function QuestionBank({ onCreateTest, isActive }: QuestionBankProps) {
  const confirm = useConfirm();
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>({});
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastedCsv, setPastedCsv] = useState('');
  const pastedCsvRef = useRef('');
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

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const [activeCompareQuestion, setActiveCompareQuestion] = useState<{
    importedText: string;
    matchedText: string;
    similarityRatio?: number;
    reason?: string;
    isDuplicate?: boolean;
  } | null>(null);

  const csvPreviewColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'grade',
      header: 'Khối',
      cell: (info) => <span className="font-bold">{info.getValue<string>() || '-'}</span>,
    },
    {
      accessorKey: 'unit',
      header: 'Bài',
      cell: (info) => <span className="font-bold">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'test_type',
      header: 'Dạng đề',
      accessorFn: (row) => row.test_type || '',
      cell: (info) => <span className="font-bold">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 't',
      header: 'Loại câu',
      accessorFn: (row) => TYPE_MAP[row.t] || row.t || 'Khác',
      cell: (info) => <span className="font-semibold text-blue-400">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'x',
      header: 'Nội dung câu hỏi',
      cell: (info) => <span className="font-medium text-slate-200 block break-words max-w-sm">{info.getValue<string>()}</span>,
    },
    {
      id: 'option_1',
      header: 'Phương án 1',
      accessorFn: (row) => (row.o && row.o[0]) ? row.o[0] : (row.option_1 || ''),
      cell: (info) => <span className="text-slate-300">{info.getValue<string>()}</span>,
    },
    {
      id: 'option_2',
      header: 'Phương án 2',
      accessorFn: (row) => (row.o && row.o[1]) ? row.o[1] : (row.option_2 || ''),
      cell: (info) => <span className="text-slate-300">{info.getValue<string>()}</span>,
    },
    {
      id: 'option_3',
      header: 'Phương án 3',
      accessorFn: (row) => (row.o && row.o[2]) ? row.o[2] : (row.option_3 || ''),
      cell: (info) => <span className="text-slate-300">{info.getValue<string>()}</span>,
    },
    {
      id: 'option_4',
      header: 'Phương án 4',
      accessorFn: (row) => (row.o && row.o[3]) ? row.o[3] : (row.option_4 || ''),
      cell: (info) => <span className="text-slate-300">{info.getValue<string>()}</span>,
    },
    {
      id: 'a',
      header: 'Đáp án',
      accessorFn: (row) => row.a || row.answer || '',
      cell: (info) => <span className="font-extrabold text-emerald-400">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'level',
      header: 'Mức độ',
      cell: (info) => <span className="text-slate-300">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái kiểm tra',
      accessorFn: (row) => row.is_duplicate ? 'Trùng lặp' : row.is_similar ? `Tương đồng (${Math.round((row.similarity_ratio || 0) * 100)}%)` : 'Mới hợp lệ',
      cell: ({ row }) => {
        const item = row.original;
        if (item.is_duplicate) {
          return (
            <button
              type="button"
              onClick={() => setActiveCompareQuestion({
                importedText: item.x,
                matchedText: item.similar_question || item.duplicate_reason || 'Câu hỏi đã có trong CSDL',
                reason: item.duplicate_reason,
                isDuplicate: true
              })}
              className="flex items-center gap-1.5 text-rose-450 text-[0.66rem] bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/25 font-bold transition cursor-pointer"
              title="Bấm để xem câu hỏi trùng lặp trong CSDL"
            >
              <AlertTriangle size={12} />
              <span>Trùng lặp (Xem)</span>
            </button>
          );
        }
        if (item.is_similar) {
          const pct = Math.round((item.similarity_ratio || 0) * 100);
          return (
            <button
              type="button"
              onClick={() => setActiveCompareQuestion({
                importedText: item.x,
                matchedText: item.similar_question || item.duplicate_reason || '',
                similarityRatio: item.similarity_ratio,
                reason: item.duplicate_reason,
                isDuplicate: false
              })}
              className="flex items-center gap-1.5 text-amber-400 text-[0.66rem] bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/25 font-bold transition cursor-pointer"
              title="Bấm để xem câu hỏi tương đồng trong CSDL"
            >
              <AlertTriangle size={12} />
              <span>Tương đồng ({pct}%) (Xem)</span>
            </button>
          );
        }
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 text-[0.66rem] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 size={12} />
            <span>Mới hợp lệ</span>
          </span>
        );
      },
    },
  ], []);

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

  const handleSaveQuestionEdit = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.editDbQuestion(id, editRow);
      if (res.success) {
        showToast("Đã cập nhật câu hỏi thành công!", "success");
        setEditingId(null);
        fetchQuestions();
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

  // Unified Test Creation Modal State
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [createTestConfig, setCreateTestConfig] = useState({
    source: 'selected', // 'selected' | 'bank'
    grade: '',
    unit: '',
    respectDifficulty: false,
    targetDifficulty: 'NHẬN BIẾT',
    useTypeDistribution: false,
    useDifficultyDistribution: false,
    difficultyPctNhanBiet: 30,
    difficultyPctThongHieu: 40,
    difficultyPctVanDung: 30,
    totalCount: 20,
    typeCounts: {} as Record<string, number>,
    numVersions: 1,
    typeOrder: [] as string[],
    includedTypes: [] as string[]
  });

  const poolForFilters = useMemo(() => {
    const targetUnits = parseUnits(createTestConfig.unit);
    return questions.filter(q => {
      if (createTestConfig.grade && String(q.grade).trim() !== String(createTestConfig.grade).trim()) {
        return false;
      }
      if (targetUnits.length > 0 && !targetUnits.includes(String(q.unit).trim())) {
        return false;
      }
      if (!createTestConfig.useDifficultyDistribution && createTestConfig.respectDifficulty && q.level !== createTestConfig.targetDifficulty) {
        return false;
      }
      return true;
    });
  }, [questions, createTestConfig.grade, createTestConfig.unit, createTestConfig.respectDifficulty, createTestConfig.targetDifficulty, createTestConfig.useDifficultyDistribution]);

  const handleMoveType = (index: number, direction: number) => {
    const newOrder = [...createTestConfig.typeOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    setCreateTestConfig(prev => ({
      ...prev,
      typeOrder: newOrder
    }));
  };

  const TIME_OPTIONS = [
    { label: '5 giây', value: 5 },
    { label: '10 giây', value: 10 },
    { label: '20 giây', value: 20 },
    { label: '30 giây', value: 30 },
    { label: '45 giây', value: 45 },
    { label: '1 phút', value: 60 },
    { label: '2 phút', value: 120 },
    { label: '3 phút', value: 180 },
    { label: '5 phút', value: 300 },
    { label: '10 phút', value: 600 },
    { label: '15 phút', value: 900 },
    { label: '30 phút', value: 1800 },
  ];



  // Column Visibility State
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    grade: true,
    unit: true,
    type: true,
    content: true,
    options: true,
    answer: true,
    level: true,
    frequency: true
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const gradesList = availableGrades;
  const levelsList = ['NHẬN BIẾT', 'THÔNG HIỂU', 'VẬN DỤNG', 'VẬN DỤNG CAO'];
  
  // Extract all unique question types in database to help in Auto-Gen splits
  const uniqueTypes = Array.from(new Set(questions.map(q => q.t).filter(Boolean)));

  const fetchQuestions = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const res = await api.getDbQuestions({});
      if (res.success) {
        setQuestions(res.questions);
      }
    } catch (e) {
      if (!isSilent) showToast("Không thể tải ngân hàng câu hỏi", "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGrades();
    fetchQuestions();
    const handleDataChanged = () => fetchQuestions(true);
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, []);

  // CSV upload: Validate first before saving!
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImportCsvFile(file);
    e.target.value = '';
  };

  const handleImportCsvFile = async (file: File) => {
    setLoading(true);
    try {
      showToast("Đang kiểm tra trùng lặp trong CSV...", "warning");
      const res = await api.validateDbQuestionsCsv(file);
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
      const file = new File([pastedCsv], "pasted_questions.csv", { type: "text/csv" });
      handleImportCsvFile(file);
    } else {
      showToast("Vui lòng chọn một tệp CSV hoặc dán nội dung CSV!", "warning");
    }
  };

  // Confirm import validated items
  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await api.confirmDbQuestionsImport(csvPreviewModal.items);
      if (res.success) {
        showToast(`Đã nhập thành công ${res.count} câu hỏi vào CSDL!`, "success");
        setCsvPreviewModal({ show: false, items: [], fileName: '' });
        fetchQuestions();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Nhập dữ liệu thất bại: ${err.message || err}`, "error");
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
  const filteredAndSortedQuestions = useMemo(() => {
    let result = [...questions];

    Object.entries(columnFilters).forEach(([key, filter]) => {
      const { search: sVal, selectedValues } = filter;

      if (sVal.trim() !== '') {
        const sLower = sVal.toLowerCase();
        result = result.filter(q => {
          let val = '';
          if (key === 'grade') val = q.grade || '';
          else if (key === 'unit') val = q.unit || '';
          else if (key === 'type') val = TYPE_MAP[q.t] || q.t || '';
          else if (key === 'content') val = q.x || '';
          else if (key === 'options') val = (q.o || []).join(' ');
          else if (key === 'answer') val = q.a || '';
          else if (key === 'level') val = q.level || '';
          else if (key === 'frequency') val = String(q.frequency || '0');
          return val.toLowerCase().includes(sLower);
        });
      }

      if (selectedValues.length > 0 && !selectedValues.includes('__NONE__')) {
        result = result.filter(q => {
          let val = '';
          if (key === 'grade') val = q.grade || '';
          else if (key === 'unit') val = q.unit || '';
          else if (key === 'type') val = TYPE_MAP[q.t] || q.t || 'Khác';
          else if (key === 'content') val = q.x || '';
          else if (key === 'options') val = (q.o || []).join(', ');
          else if (key === 'answer') val = q.a || '';
          else if (key === 'level') val = q.level || 'Chưa phân loại';
          else if (key === 'frequency') val = String(q.frequency || '0');
          return selectedValues.includes(val);
        });
      } else if (selectedValues.includes('__NONE__')) {
        result = result.filter(q => {
          let val = '';
          if (key === 'grade') val = q.grade || '';
          else if (key === 'unit') val = q.unit || '';
          else if (key === 'type') val = q.t || '';
          else if (key === 'content') val = q.x || '';
          else if (key === 'answer') val = q.a || '';
          else if (key === 'level') val = q.level || '';
          else if (key === 'frequency') val = q.frequency || '';
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
        } else if (key === 'type') {
          valA = TYPE_MAP[a.t] || a.t || '';
          valB = TYPE_MAP[b.t] || b.t || '';
        } else if (key === 'content') {
          valA = a.x || '';
          valB = b.x || '';
        } else if (key === 'options') {
          valA = (a.o || []).join(' ');
          valB = (b.o || []).join(' ');
        } else if (key === 'answer') {
          valA = a.a || '';
          valB = b.a || '';
        } else if (key === 'level') {
          valA = a.level || '';
          valB = b.level || '';
        } else if (key === 'frequency') {
          valA = parseInt(a.frequency || '0') || 0;
          valB = parseInt(b.frequency || '0') || 0;
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
  }, [questions, columnFilters, sortConfig]);

  // Paginated questions helper
  const totalPages = Math.ceil(filteredAndSortedQuestions.length / pageSize);
  const paginatedQuestions = filteredAndSortedQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedQuestions.map((q: DbQuestion) => q.id);
    const allSelected = pageIds.every((id: number) => selectedIds.includes(id));
    
    if (allSelected) {
      // Unselect page IDs
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      // Select all page IDs
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await confirm({
      title: "Xóa câu hỏi",
      message: `Bạn có chắc muốn xóa ${selectedIds.length} câu hỏi đã chọn khỏi cơ sở dữ liệu?`,
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const res = await api.deleteDbQuestions(selectedIds);
      if (res.success) {
        showToast(`Đã xóa thành công ${res.count} câu hỏi.`, "success");
        setSelectedIds([]);
        fetchQuestions();
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
      title: "Xóa toàn bộ ngân hàng câu hỏi",
      message: "CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ ngân hàng câu hỏi trong cơ sở dữ liệu? Hành động này không thể hoàn tác.",
      confirmText: "Xóa toàn bộ",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const res = await api.clearDbQuestions();
      if (res.success) {
        showToast("Đã làm trống ngân hàng câu hỏi thành công.", "success");
        setSelectedIds([]);
        setQuestions([]);
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
      confirmMsg = "CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ ngân hàng câu hỏi? Hành động này không thể hoàn tác.";
    } else if (deleteModal.scope === 'grade') {
      if (!deleteModal.grade) {
        showToast("Vui lòng chọn Khối lớp cần xóa", "warning");
        return;
      }
      confirmMsg = `Bạn có chắc chắn muốn xóa tất cả câu hỏi thuộc Lớp ${deleteModal.grade}? Hành động này không thể hoàn tác.`;
    } else if (deleteModal.scope === 'unit') {
      if (!deleteModal.grade) {
        showToast("Vui lòng chọn Khối lớp", "warning");
        return;
      }
      if (!deleteModal.unit.trim()) {
        showToast("Vui lòng nhập Unit cần xóa", "warning");
        return;
      }
      confirmMsg = `Bạn có chắc chắn muốn xóa tất cả câu hỏi thuộc Unit ${deleteModal.unit} của Lớp ${deleteModal.grade}? Hành động này không thể hoàn tác.`;
    }

    const isConfirmed = await confirm({
      title: "Xác nhận xóa câu hỏi",
      message: confirmMsg,
      confirmText: "Xóa dữ liệu",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await api.clearDbQuestions(
        deleteModal.scope !== 'all' ? deleteModal.grade : undefined,
        deleteModal.scope === 'unit' ? deleteModal.unit.trim() : undefined
      );
      if (res.success) {
        showToast("Đã thực hiện xóa dữ liệu thành công.", "success");
        setDeleteModal({ show: false, scope: 'all', grade: '', unit: '' });
        setSelectedIds([]);
        fetchQuestions();
        fetchActiveGrades();
      }
    } catch (err: any) {
      showToast(`Không thể xóa dữ liệu: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFrequency = async () => {
    const isAll = selectedIds.length === 0;
    const msg = isAll
      ? "Bạn có chắc chắn muốn reset tần suất của TẤT CẢ câu hỏi trong cơ sở dữ liệu về 0?"
      : `Bạn có chắc chắn muốn reset tần suất của ${selectedIds.length} câu hỏi đang chọn về 0?`;
      
    const isConfirmed = await confirm({
      title: "Reset tần suất câu hỏi",
      message: msg,
      confirmText: "Reset",
      cancelText: "Hủy bỏ",
      type: "warning"
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const res = await api.resetDbQuestionsFrequency(selectedIds);
      if (res.success) {
        showToast(`Đã reset tần suất thành công cho ${res.count} câu hỏi!`, "success");
        setSelectedIds([]);
        fetchQuestions();
      }
    } catch (err: any) {
      showToast(`Reset tần suất thất bại: ${err.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fisher-Yates modern (Knuth) choice shuffler helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const shuffleQuestion = (q: any): any => {
    if (!q.o || q.o.length <= 1 || !q.a) return q;
    
    const correctLetter = q.a.trim().toUpperCase();
    const correctIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
    
    if (correctIndex < 0 || correctIndex >= q.o.length) {
      return q;
    }
    
    const correctText = q.o[correctIndex];
    const shuffledOptions = shuffleArray(q.o);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);
    
    if (newCorrectIndex === -1) return q;
    const newAnswerLetter = String.fromCharCode(65 + newCorrectIndex);
    
    return {
      ...q,
      o: shuffledOptions,
      a: newAnswerLetter
    };
  };

  // Open Unified Test Creation Dialog
  const openCreateTestModal = () => {
    const defaultCounts: Record<string, number> = {};
    const currentUniqueTypes = Array.from(new Set(questions.map(q => q.t).filter(Boolean)));
    currentUniqueTypes.forEach(t => {
      defaultCounts[t] = 0;
    });
    if (defaultCounts['mq'] !== undefined) defaultCounts['mq'] = 10;

    setCreateTestConfig({
      source: selectedIds.length > 0 ? 'selected' : 'bank',
      grade: columnFilters.grade?.selectedValues?.[0] || '',
      unit: columnFilters.unit?.selectedValues?.[0] || '',
      respectDifficulty: false,
      targetDifficulty: 'NHẬN BIẾT',
      useTypeDistribution: false,
      useDifficultyDistribution: false,
      difficultyPctNhanBiet: 30,
      difficultyPctThongHieu: 40,
      difficultyPctVanDung: 30,
      totalCount: 20,
      typeCounts: defaultCounts,
      numVersions: 1,
      typeOrder: currentUniqueTypes,
      includedTypes: [...currentUniqueTypes]
    });
    setShowCreateTestModal(true);
  };

  // Run unified creation algorithm
  const handleRunCreateTest = async () => {
    setLoading(true);
    try {
      if (createTestConfig.source !== 'selected' && createTestConfig.useDifficultyDistribution) {
        const totalPct = createTestConfig.difficultyPctNhanBiet + createTestConfig.difficultyPctThongHieu + createTestConfig.difficultyPctVanDung;
        if (totalPct !== 100) {
          showToast("Tổng tỷ lệ độ khó phải bằng 100%!", "error");
          setLoading(false);
          return;
        }
      }

      let selectedPool: DbQuestion[] = [];

      if (createTestConfig.source === 'selected') {
        if (selectedIds.length === 0) {
          showToast("Vui lòng chọn ít nhất một câu hỏi!", "warning");
          setLoading(false);
          return;
        }
        selectedPool = questions.filter(q => selectedIds.includes(q.id));
      } else {
        const targetUnits = parseUnits(createTestConfig.unit);
        const unitsToProcess = targetUnits.length > 0 ? targetUnits : [""];

        for (const unitVal of unitsToProcess) {
          // Filter pool by criteria
          const pool = questions.filter(q => {
            if (createTestConfig.grade && String(q.grade).trim() !== String(createTestConfig.grade).trim()) {
              return false;
            }
            if (unitVal && String(q.unit).trim() !== String(unitVal).trim()) {
              return false;
            }
            if (!createTestConfig.useDifficultyDistribution && createTestConfig.respectDifficulty && q.level !== createTestConfig.targetDifficulty) {
              return false;
            }
            return true;
          });

          if (pool.length === 0) {
            const unitLabel = unitVal ? `Unit ${unitVal}` : "không có Unit";
            showToast(`Không tìm thấy câu hỏi phù hợp với tiêu chí lọc cho ${unitLabel}!`, "warning");
            continue;
          }

          // Step 1: Calculate target counts per type (typeTargets)
          const typeTargets = {} as Record<string, number>;
          const uniqueTypesInPool = Array.from(new Set(pool.map(q => q.t))).filter(Boolean);
          uniqueTypesInPool.forEach(t => { typeTargets[t] = 0; });

          if (createTestConfig.useTypeDistribution) {
            // Use user's manually defined distribution
            createTestConfig.typeOrder.forEach(t => {
              if (createTestConfig.includedTypes.includes(t)) {
                typeTargets[t] = createTestConfig.typeCounts[t] || 0;
              } else {
                typeTargets[t] = 0;
              }
            });
          } else {
            // Automatically distribute totalCount across uniqueTypesInPool equally / relatively equally
            const typeAvailable = {} as Record<string, number>;
            uniqueTypesInPool.forEach(t => {
              typeAvailable[t] = pool.filter(q => q.t === t).length;
            });

            // Max allowed per version for each type
            const limits = {} as Record<string, number>;
            uniqueTypesInPool.forEach(t => {
              limits[t] = Math.floor(typeAvailable[t] / createTestConfig.numVersions);
            });

            let activeTypes = uniqueTypesInPool.filter(t => limits[t] > 0);
            let remainingToAllocate = createTestConfig.totalCount;

            while (remainingToAllocate > 0 && activeTypes.length > 0) {
              const D = activeTypes.length;
              const base = Math.floor(remainingToAllocate / D);
              const rem = remainingToAllocate % D;

              activeTypes.sort((a, b) => limits[a] - limits[b]);

              let allocatedThisRound = 0;
              const nextActiveTypes: string[] = [];

              for (let i = 0; i < D; i++) {
                const t = activeTypes[i];
                const share = base + (i < rem ? 1 : 0);
                const currentTarget = typeTargets[t] || 0;
                const maxAllowed = limits[t];
                const allocation = Math.min(share, maxAllowed - currentTarget);

                typeTargets[t] = currentTarget + allocation;
                allocatedThisRound += allocation;

                if (typeTargets[t] < limits[t]) {
                  nextActiveTypes.push(t);
                }
              }

              remainingToAllocate -= allocatedThisRound;
              if (allocatedThisRound === 0) break;
              activeTypes = nextActiveTypes;
            }
          }

          // Step 2: Draw questions to form the initial selection
          const groupedCandidates: Record<string, DbQuestion[]> = {};
          const activeTypesList = createTestConfig.useTypeDistribution 
            ? createTestConfig.typeOrder.filter(t => createTestConfig.includedTypes.includes(t))
            : uniqueTypesInPool;

          activeTypesList.forEach(t => {
            const list = pool.filter(q => q.t === t);
            list.sort((a, b) => {
              const freqA = parseInt(a.frequency || '0') || 0;
              const freqB = parseInt(b.frequency || '0') || 0;
              return freqA - freqB;
            });
            groupedCandidates[t] = list;
          });

          const selectedSet: DbQuestion[] = [];
          const unselectedSet: Record<string, DbQuestion[]> = {};

          activeTypesList.forEach(t => {
            const countNeeded = (typeTargets[t] || 0) * createTestConfig.numVersions;
            const candidates = groupedCandidates[t] || [];
            selectedSet.push(...candidates.slice(0, countNeeded));
            unselectedSet[t] = candidates.slice(countNeeded);

            if (candidates.length < countNeeded) {
              const unitLabel = unitVal ? ` (Unit ${unitVal})` : "";
              showToast(`Thiếu câu hỏi dạng ${TYPE_MAP[t] || t}${unitLabel}. Yêu cầu ${countNeeded} câu cho ${createTestConfig.numVersions} mã đề, chỉ lấy được ${candidates.length}.`, "warning");
            }
          });

          // Step 3: If difficulty distribution is enabled, run the swap algorithm
          if (createTestConfig.useDifficultyDistribution) {
            const totalSelectedCount = selectedSet.length;
            const pctNB = createTestConfig.difficultyPctNhanBiet;
            const pctTH = createTestConfig.difficultyPctThongHieu;
            
            const targetNB = Math.round(totalSelectedCount * pctNB / 100);
            const targetTH = Math.round(totalSelectedCount * pctTH / 100);
            const targetVD = totalSelectedCount - targetNB - targetTH;

            const targets = {
              'NHẬN BIẾT': targetNB,
              'THÔNG HIỂU': targetTH,
              'VẬN DỤNG': targetVD
            };

            const getCategory = (level: string) => {
              if (!level) return 'VẬN DỤNG';
              const norm = level.toUpperCase().trim();
              if (norm === 'NHẬN BIẾT') return 'NHẬN BIẾT';
              if (norm === 'THÔNG HIỂU') return 'THÔNG HIỂU';
              return 'VẬN DỤNG';
            };

            let maxIterations = totalSelectedCount * 2;
            while (maxIterations > 0) {
              maxIterations--;

              const currentCounts = {
                'NHẬN BIẾT': 0,
                'THÔNG HIỂU': 0,
                'VẬN DỤNG': 0
              };
              selectedSet.forEach(q => {
                const cat = getCategory(q.level);
                currentCounts[cat]++;
              });

              let overrepresented: ('NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG')[] = [];
              let underrepresented: ('NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG')[] = [];

              (['NHẬN BIẾT', 'THÔNG HIỂU', 'VẬN DỤNG'] as const).forEach(cat => {
                if (currentCounts[cat] > targets[cat]) overrepresented.push(cat);
                if (currentCounts[cat] < targets[cat]) underrepresented.push(cat);
              });

              if (overrepresented.length === 0 || underrepresented.length === 0) {
                break;
              }

              let bestSwap: {
                type: string;
                selIdx: number;
                unselIdx: number;
                cost: number;
                fromCat: 'NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG';
                toCat: 'NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG';
              } | null = null;

              for (const fromCat of overrepresented) {
                for (const toCat of underrepresented) {
                  activeTypesList.forEach(t => {
                    const unselCandidates = unselectedSet[t] || [];
                    selectedSet.forEach((qSel, selIdx) => {
                      if (qSel.t !== t || getCategory(qSel.level) !== fromCat) return;

                      unselCandidates.forEach((qUnsel, unselIdx) => {
                        if (getCategory(qUnsel.level) !== toCat) return;

                        const freqSel = parseInt(qSel.frequency || '0') || 0;
                        const freqUnsel = parseInt(qUnsel.frequency || '0') || 0;
                        const cost = freqUnsel - freqSel;

                        if (bestSwap === null || cost < bestSwap.cost) {
                          bestSwap = {
                            type: t,
                            selIdx,
                            unselIdx,
                            cost,
                            fromCat,
                            toCat
                          };
                        }
                      });
                    });
                  });
                }
              }

              if (!bestSwap) {
                break; 
              }

              const { type, selIdx, unselIdx } = bestSwap;
              const qSel = selectedSet[selIdx];
              const qUnsel = unselectedSet[type][unselIdx];

              selectedSet[selIdx] = qUnsel;
              unselectedSet[type][unselIdx] = qSel;
            }
          }

          selectedPool.push(...selectedSet);
        }

        const totalNeeded = createTestConfig.useTypeDistribution
          ? createTestConfig.typeOrder.reduce((sum, t) => sum + (createTestConfig.typeCounts[t] || 0) * createTestConfig.numVersions, 0) * unitsToProcess.length
          : createTestConfig.totalCount * createTestConfig.numVersions * unitsToProcess.length;
        
        if (selectedPool.length < totalNeeded && !createTestConfig.useTypeDistribution) {
          showToast(`Chỉ lấy được ${selectedPool.length} câu hỏi phù hợp (yêu cầu ${totalNeeded} câu cho ${unitsToProcess.length} unit, mỗi unit ${createTestConfig.numVersions} mã đề).`, "warning");
        }
      }

      if (selectedPool.length === 0) {
        showToast("Không có câu hỏi nào được chọn để tạo đề!", "error");
        setLoading(false);
        return;
      }

      // Increment frequency
      const idsToIncrement = selectedPool.map(q => q.id);
      try {
        await api.incrementDbQuestionsFrequency(idsToIncrement);
      } catch (err) {
        console.error("Failed to increment frequency:", err);
      }

      setShowCreateTestModal(false);
      onCreateTest(selectedPool, createTestConfig.numVersions, createTestConfig.grade, createTestConfig.unit);
      showToast(`Đã tạo thành công cấu trúc đề với ${selectedPool.length} câu hỏi!`, "success");
    } catch (e: any) {
      showToast("Lỗi tạo đề thi: " + (e.message || e), "error");
    } finally {
      setLoading(false);
    }
  };



  const uniqueValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const keys = ['grade', 'unit', 'type', 'content', 'options', 'answer', 'level', 'frequency'];
    keys.forEach(key => {
      const vals = questions.map(q => {
        if (key === 'grade') return q.grade || '';
        if (key === 'unit') return q.unit || '';
        if (key === 'type') return TYPE_MAP[q.t] || q.t || 'Khác';
        if (key === 'content') return q.x || '';
        if (key === 'options') return (q.o || []).join(', ');
        if (key === 'answer') return q.a || '';
        if (key === 'level') return q.level || 'Chưa phân loại';
        if (key === 'frequency') return String(q.frequency || '0');
        return String((q as any)[key] || '');
      }).filter(Boolean);

      map[key] = Array.from(new Set(vals)).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
    });
    return map;
  }, [questions]);

  const getUniqueValues = useCallback((key: string) => {
    return uniqueValuesMap[key] || [];
  }, [uniqueValuesMap]);

  const toggleCol = (colKey: string) => {
    setVisibleCols(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-100 p-8 overflow-y-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5 drop-shadow-md">
            <Database className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={22} />
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">NGÂN HÀNG CÂU HỎI LOCAL</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý ngân hàng câu hỏi trắc nghiệm ngoại tuyến. Tự động trộn đáp án bằng Fisher-Yates & cấu hình tạo đề tự động.
            <span className="ml-3 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-[10px]">
              TỔNG SỐ CÂU HỎI THEO BỘ LỌC: {filteredAndSortedQuestions.length}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-1 shrink-0">
          {/* Prompt Manager Button */}
          <PromptManager 
            storageKey="prompts_question_bank" 
            tabTitle="Ngân Hàng Câu Hỏi" 
            defaultPrompts={DEFAULT_QUESTION_BANK_PROMPTS} 
          />

          {/* Unified Create Test Button */}
          <button
            onClick={openCreateTestModal}
            className="group flex items-center gap-0 hover:gap-1.5 px-3.5 py-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer transition-all duration-300 shadow-md shadow-blue-500/10"
            title="Tạo Đề Thi"
          >
            <Sparkles size={14} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Tạo Đề Thi</span>
          </button>

          {/* Reset Frequency Button */}
          <button
            onClick={handleResetFrequency}
            disabled={loading}
            className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 text-slate-350 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 shadow-sm"
            title={selectedIds.length > 0 ? "Reset tần suất các câu hỏi đã chọn" : "Reset tần suất cho toàn bộ câu hỏi"}
          >
            <RefreshCw size={14} className="text-amber-500" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[180px] transition-all duration-300 whitespace-nowrap block">Reset Tần Suất {selectedIds.length > 0 ? `(${selectedIds.length})` : "Tất Cả"}</span>
          </button>

          {/* Reset Filters button */}
          {(Object.values(columnFilters).some(f => f.search !== '' || f.selectedValues.length > 0) || sortConfig !== null) && (
            <button
              onClick={resetFilters}
              className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-400 hover:text-rose-450 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300"
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
                  grade: 'Khối',
                  unit: 'Unit',
                  type: 'Dạng',
                  content: 'Nội dung',
                  options: 'Tùy chọn',
                  answer: 'Đáp án',
                  level: 'Độ khó',
                  frequency: 'Tần suất'
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
            title="Nhập CSV Câu Hỏi"
          >
            <Upload size={14} className="text-blue-400" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[140px] transition-all duration-300 whitespace-nowrap block">Nhập CSV Câu Hỏi</span>
          </button>
          
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="group flex items-center gap-0 hover:gap-1.5 px-3 py-2.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-450 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 shadow-sm"
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
            title="Xóa dữ liệu câu hỏi trong cơ sở dữ liệu"
          >
            <Trash2 size={14} className="text-rose-500" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Xóa Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* TABLE WORKSPACE WITH SOLID DARK BACKGROUND (NO TRANSPARENCY) */}
      <div className="flex-auto bg-[#0c0f1d] border border-[#1e2744] rounded-2xl shadow-2xl overflow-hidden opacity-100 backdrop-blur-none flex flex-col min-h-0">
        {loading && questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-blue-500" size={28} />
            <span className="text-xs text-slate-500 font-semibold">Đang xử lý dữ liệu...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="h-14 w-14 rounded-full bg-slate-900 flex items-center justify-center border border-slate-850 mb-4 text-slate-500">
              <Database size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Không tìm thấy câu hỏi</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Ngân hàng câu hỏi hiện tại trống hoặc bộ lọc không có kết quả. Vui lòng tải file CSV câu hỏi lên để bắt đầu.
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
                        {paginatedQuestions.every((q: DbQuestion) => selectedSet.has(q.id)) ? (
                          <CheckSquare size={16} className="text-blue-500" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    {visibleCols.grade && (
                      <th className={`py-4 px-3 w-24 min-w-[5.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'grade' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Khối</span>
                          <ColumnHeaderFilter 
                            columnKey="grade" 
                            columnLabel="Khối" 
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
                    {visibleCols['type'] && (
                      <th className={`py-4 px-3 w-36 min-w-[8.5rem] whitespace-nowrap relative ${activeHeaderMenu === 'type' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Dạng</span>
                          <ColumnHeaderFilter 
                            columnKey="type" 
                            columnLabel="Dạng" 
                            uniqueValues={getUniqueValues('type')}
                            filter={columnFilters['type'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'type'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.content && (
                      <th className={`py-4 px-4 min-w-[20rem] relative ${activeHeaderMenu === 'content' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Nội dung câu hỏi</span>
                          <ColumnHeaderFilter 
                            columnKey="content" 
                            columnLabel="Nội dung" 
                            uniqueValues={getUniqueValues('content')}
                            filter={columnFilters['content'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'content'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.options && (
                      <th className={`py-4 px-4 min-w-[16rem] relative ${activeHeaderMenu === 'options' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Tùy chọn trả lời</span>
                          <ColumnHeaderFilter 
                            columnKey="options" 
                            columnLabel="Tùy chọn" 
                            uniqueValues={getUniqueValues('options')}
                            filter={columnFilters['options'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'options'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.answer && (
                      <th className={`py-4 px-3 w-24 min-w-[5.5rem] text-center whitespace-nowrap relative ${activeHeaderMenu === 'answer' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Đáp án</span>
                          <ColumnHeaderFilter 
                            columnKey="answer" 
                            columnLabel="Đáp án" 
                            uniqueValues={getUniqueValues('answer')}
                            filter={columnFilters['answer'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'answer'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.level && (
                      <th className={`py-4 px-3 w-32 min-w-[7.5rem] text-center whitespace-nowrap relative ${activeHeaderMenu === 'level' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Độ khó</span>
                          <ColumnHeaderFilter 
                            columnKey="level" 
                            columnLabel="Độ khó" 
                            uniqueValues={getUniqueValues('level')}
                            filter={columnFilters['level'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'level'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    {visibleCols.frequency && (
                      <th className={`py-4 px-3 w-20 text-center whitespace-nowrap relative ${activeHeaderMenu === 'frequency' ? 'z-50' : ''}`}>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Tần suất</span>
                          <ColumnHeaderFilter 
                            columnKey="frequency" 
                            columnLabel="Tần suất" 
                            uniqueValues={getUniqueValues('frequency')}
                            filter={columnFilters['frequency'] || { search: '', selectedValues: [] }}
                            isOpen={activeHeaderMenu === 'frequency'}
                            onToggleOpen={setActiveHeaderMenu as any}
                            sortConfig={sortConfig}
                            onSort={setSortConfig}
                            onUpdateFilter={handleUpdateFilter}
                          />
                        </div>
                      </th>
                    )}
                    <th className="py-4 px-3 w-24 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs">
                  {paginatedQuestions.length === 0 && (
                    <tr>
                      <td 
                        colSpan={Object.values(visibleCols).filter(Boolean).length + 2} 
                        className="text-center py-32 text-slate-500 text-xs italic"
                      >
                        Không có câu hỏi nào khớp với bộ lọc.
                      </td>
                    </tr>
                  )}
                  {paginatedQuestions.map((q: DbQuestion) => {
                    const isSelected = selectedSet.has(q.id);
                    const isEditing = editingId === q.id;
                    
                    if (isEditing) {
                      return (
                        <tr key={q.id} className="bg-blue-600/5 border-b border-slate-900 text-xs">
                          {/* Checkbox Placeholder */}
                          <td className="py-3 px-5 text-center"></td>
                          
                          {/* Grade */}
                          {visibleCols.grade && (
                            <td className="py-2 px-2 w-16">
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
                            <td className="py-2 px-2 w-16">
                              <input 
                                type="text" 
                                value={editRow.unit || ''} 
                                onChange={(e) => setEditRow({ ...editRow, unit: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Type */}
                          {visibleCols['type'] && (
                            <td className="py-2 px-2 w-28">
                              <select 
                                value={editRow.t || ''} 
                                onChange={(e) => setEditRow({ ...editRow, t: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1.5 outline-none text-slate-200 focus:border-blue-500/50 cursor-pointer"
                              >
                                {Object.entries(TYPE_MAP).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                            </td>
                          )}

                          {/* Content */}
                          {visibleCols.content && (
                            <td className="py-2 px-2 min-w-[18.66rem]">
                              <textarea 
                                value={editRow.x || ''} 
                                onChange={(e) => setEditRow({ ...editRow, x: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-2 py-1 outline-none text-slate-200 focus:border-blue-500/50"
                                rows={2}
                              />
                            </td>
                          )}

                          {/* Options */}
                          {visibleCols.options && (
                            <td className="py-2 px-2 w-72">
                              <div className="flex flex-col gap-1">
                                {[0, 1, 2, 3].map((optIdx) => (
                                  <input 
                                    key={optIdx}
                                    type="text" 
                                    value={editRow.o?.[optIdx] || ''} 
                                    onChange={(e) => {
                                      const newOpts = [...(editRow.o || ['', '', '', ''])];
                                      newOpts[optIdx] = e.target.value;
                                      setEditRow({ ...editRow, o: newOpts });
                                    }}
                                    placeholder={String.fromCharCode(65 + optIdx)}
                                    className="w-full bg-[#070b14] border border-slate-800 text-[0.66rem] rounded px-1.5 py-0.5 outline-none text-slate-300 focus:border-blue-500/50"
                                  />
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Answer */}
                          {visibleCols.answer && (
                            <td className="py-2 px-2 w-16 text-center">
                              <select 
                                value={editRow.a || ''} 
                                onChange={(e) => setEditRow({ ...editRow, a: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-1.5 py-1.5 outline-none text-slate-200 focus:border-blue-500/50 cursor-pointer"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </td>
                          )}

                          {/* Level */}
                          {visibleCols.level && (
                            <td className="py-2 px-2 w-24 text-center">
                              <select 
                                value={editRow.level || ''} 
                                onChange={(e) => setEditRow({ ...editRow, level: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-1.5 py-1.5 outline-none text-slate-200 focus:border-blue-500/50 cursor-pointer"
                              >
                                <option value="NHẬN BIẾT">NHẬN BIẾT</option>
                                <option value="THÔNG HIỂU">THÔNG HIỂU</option>
                                <option value="VẬN DỤNG">VẬN DỤNG</option>
                                <option value="VẬN DỤNG CAO">VẬN DỤNG CAO</option>
                              </select>
                            </td>
                          )}

                          {/* Frequency */}
                          {visibleCols.frequency && (
                            <td className="py-2 px-2 w-20 text-center">
                              <input 
                                type="text" 
                                value={editRow.frequency || ''} 
                                onChange={(e) => setEditRow({ ...editRow, frequency: e.target.value })}
                                className="w-full bg-[#070b14] border border-slate-800 text-xs rounded px-1.5 py-1.5 outline-none text-slate-200 focus:border-blue-500/50"
                              />
                            </td>
                          )}

                          {/* Actions */}
                          <td className="py-2 px-3 text-center flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSaveQuestionEdit(q.id)}
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
                        key={q.id}
                        onClick={() => handleSelectRow(q.id)}
                        className={`hover:bg-slate-900/20 transition cursor-pointer ${
                          isSelected ? 'bg-blue-600/5' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSelectRow(q.id)}
                            className="text-slate-500 hover:text-slate-300 transition"
                          >
                            {isSelected ? (
                              <CheckSquare size={15} className="text-blue-500" />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                        </td>

                        {/* Grade */}
                        {visibleCols.grade && (
                          <td className="py-3 px-3 font-bold text-slate-400 whitespace-nowrap">
                            {q.grade || '-'}
                          </td>
                        )}

                        {/* Unit */}
                        {visibleCols.unit && (
                          <td className="py-3 px-3 font-bold text-slate-400 whitespace-nowrap">
                            {q.unit || '-'}
                          </td>
                        )}

                        {/* Question Type */}
                        {visibleCols['type'] && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[0.66rem] font-bold bg-slate-900 border border-slate-850 text-slate-300">
                              {TYPE_MAP[q.t] || q.t || 'Khác'}
                            </span>
                          </td>
                        )}

                        {/* Question text */}
                        {visibleCols.content && (
                          <td className="py-3 px-4 font-semibold text-slate-200 break-words max-w-sm">
                            {q.x || <span className="text-slate-650 italic">Dạng phát âm/trọng âm</span>}
                          </td>
                        )}

                        {/* Options */}
                        {visibleCols.options && (
                          <td className="py-3 px-4 text-slate-400">
                            {q.o && q.o.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1.5 text-[0.66rem]">
                                {q.o.map((opt: string, i: number) => {
                                  const letter = String.fromCharCode(65 + i);
                                  const isAnswer = q.a === letter;
                                  return (
                                    <div 
                                      key={i} 
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded bg-[#090D18]/80 border ${
                                        isAnswer 
                                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' 
                                          : 'border-slate-900 text-slate-450'
                                      }`}
                                    >
                                      <span className="font-extrabold text-[0.6rem] uppercase">{letter}.</span>
                                      <span className="truncate">{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-655 italic">Không có tùy chọn</span>
                            )}
                          </td>
                        )}

                        {/* Correct Answer */}
                        {visibleCols.answer && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {q.a ? (
                              <span className="px-2 py-0.5 rounded-full text-[0.66rem] font-extrabold bg-emerald-500/10 text-emerald-450 border border-emerald-500/25">
                                {q.a}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        )}

                        {/* Level */}
                        {visibleCols.level && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {q.level ? (
                              <span className={`px-2 py-0.5 rounded text-[0.6rem] font-black tracking-wider ${
                                q.level.includes('NHẬN BIẾT') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                                q.level.includes('THÔNG HIỂU') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                'bg-rose-500/10 text-rose-450 border border-rose-500/25'
                              }`}>
                                {q.level}
                              </span>
                            ) : (
                              <span className="text-slate-650">-</span>
                            )}
                          </td>
                        )}

                        {/* Frequency */}
                        {visibleCols.frequency && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[0.66rem] font-extrabold bg-slate-900 border border-slate-800 text-slate-350 font-mono">
                              {q.frequency || '0'}
                            </span>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              setEditingId(q.id);
                              setEditRow({ ...q });
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

            {/* PAGINATION FOOTER CONTROL PANEL */}
            {filteredAndSortedQuestions.length > 0 && (
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
          <span>Tổng số câu hỏi: {questions.length}</span>
          {selectedIds.length > 0 && (
            <span className="text-blue-400 font-extrabold">Đã chọn: {selectedIds.length} câu hỏi</span>
          )}
        </div>
      </div>

      {/* CSV IMPORT VALIDATION DUPLICATE REPORT DIALOG */}
      {csvPreviewModal.show && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-slate-850 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="h-14 border-b border-slate-900 bg-[#0A0D1A]/50 flex items-center justify-between px-6 shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
                Báo cáo kiểm tra trùng lặp CSV: {csvPreviewModal.fileName}
              </span>
              <button
                onClick={() => setCsvPreviewModal({ show: false, items: [], fileName: '' })}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Validation Statistics Bar */}
            <div className="bg-[#151f32]/40 border-b border-slate-900/60 p-5 shrink-0 grid grid-cols-4 gap-4 text-center">
              <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-slate-500 uppercase">Tổng dòng</p>
                <p className="text-xl font-black text-white mt-1">{csvPreviewModal.items.length}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-emerald-500 uppercase">Dòng mới hợp lệ</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {csvPreviewModal.items.filter(x => !x.is_duplicate && !x.is_similar).length}
                </p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-amber-500 uppercase">Tương đồng (&gt;75%)</p>
                <p className="text-xl font-black text-amber-400 mt-1">
                  {csvPreviewModal.items.filter(x => x.is_similar && !x.is_duplicate).length}
                </p>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
                <p className="text-[0.66rem] font-bold text-rose-500 uppercase">Dòng trùng lặp</p>
                <p className="text-xl font-black text-rose-450 mt-1">
                  {csvPreviewModal.items.filter(x => x.is_duplicate).length}
                </p>
              </div>
            </div>

            {/* Items scrollable list */}
            <div className="flex-1 overflow-auto bg-slate-950/20 flex flex-col">
              <DataTable
                tableId="question-bank-csv-preview-table"
                exportFilename="bao_cao_kiem_tra_trung_lap_cau_hoi"
                data={csvPreviewModal.items}
                columns={csvPreviewColumns}
                pageSize={20}
              />
            </div>

            {/* Footer actions */}
            <div className="h-16 border-t border-slate-900 bg-[#0A0D1A]/50 flex items-center justify-between px-6 shrink-0">
              <p className="text-[0.66rem] text-slate-500 font-bold max-w-lg leading-normal">
                Nhấn "Bắt đầu nạp" sẽ bỏ qua kiểm tra và ghi toàn bộ dữ liệu ở trên vào Cơ sở dữ liệu local.
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

      {/* COMPARISON MODAL FOR SIMILAR / DUPLICATE QUESTIONS */}
      {activeCompareQuestion && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 flex flex-col gap-4 text-slate-200 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className={activeCompareQuestion.isDuplicate ? "text-rose-500" : "text-amber-500"} size={16} />
                Chi tiết đối chiếu {activeCompareQuestion.isDuplicate ? "Trùng lặp 100%" : `Tương đồng ${Math.round((activeCompareQuestion.similarityRatio || 0) * 100)}%`}
              </h3>
              <button
                onClick={() => setActiveCompareQuestion(null)}
                className="text-slate-500 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Question 1: From CSV file */}
              <div className="flex flex-col gap-1.5 bg-[#080b12] border border-blue-500/30 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  1. Nội dung câu hỏi trong file nạp (CSV):
                </span>
                <p className="text-slate-200 font-semibold leading-relaxed">
                  {activeCompareQuestion.importedText}
                </p>
              </div>

              {/* Question 2: Matched question in DB */}
              <div className={`flex flex-col gap-1.5 bg-[#080b12] border p-4 rounded-2xl ${
                activeCompareQuestion.isDuplicate ? 'border-rose-500/30' : 'border-amber-500/30'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeCompareQuestion.isDuplicate ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  2. Câu hỏi tương ứng trong CSDL:
                </span>
                <p className="text-slate-200 font-semibold leading-relaxed">
                  {activeCompareQuestion.matchedText}
                </p>
              </div>

              {/* Reason / Info banner */}
              {activeCompareQuestion.reason && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                  <strong>Ghi chú kiểm tra:</strong> {activeCompareQuestion.reason}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-900 mt-1">
              <button
                onClick={() => setActiveCompareQuestion(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
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
                Xóa dữ liệu câu hỏi
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

      {/* Unified Test Creation Modal */}
      {showCreateTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-xl bg-[#111827] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="text-blue-500" size={16} />
                Cấu hình Tạo Đề Thi
              </h3>
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="text-slate-500 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Question Source Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Nguồn câu hỏi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateTestConfig(prev => ({ ...prev, source: 'selected' }))}
                    disabled={selectedIds.length === 0}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      createTestConfig.source === 'selected'
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-450 font-extrabold'
                        : selectedIds.length === 0
                        ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-[#080b12] border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Đã tích chọn ({selectedIds.length} câu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateTestConfig(prev => ({ ...prev, source: 'bank' }))}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      createTestConfig.source === 'bank'
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-450 font-extrabold'
                        : 'bg-[#080b12] border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Lọc từ Ngân Hàng
                  </button>
                </div>
              </div>

              {/* Number of Versions Input */}
              <div className="flex flex-col gap-1.5 bg-[#080b12] border border-slate-855 p-4 rounded-2xl">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Số lượng đề cần tạo (Versions):</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={createTestConfig.numVersions}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCreateTestConfig(prev => ({ ...prev, numVersions: val }));
                  }}
                  className="bg-[#070b14] border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none font-bold"
                />
              </div>

              {/* Filters (Active if source is 'bank') */}
              {createTestConfig.source !== 'selected' && (
                <div className="bg-[#080b12] border border-slate-855 p-4 rounded-2xl grid grid-cols-3 gap-3 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Khối lớp:</label>
                    <select
                      value={createTestConfig.grade}
                      onChange={(e) => setCreateTestConfig(prev => ({ ...prev, grade: e.target.value }))}
                      className="bg-[#070b14] border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Tất cả</option>
                      {availableGrades.map(g => (
                        <option key={g} value={g}>Lớp {g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Unit:</label>
                    <input
                      type="text"
                      value={createTestConfig.unit}
                      onChange={(e) => setCreateTestConfig(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Ví dụ: 1 hoặc 2"
                      className="bg-[#070b14] border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Độ khó:</label>
                    <select
                      disabled={createTestConfig.useDifficultyDistribution}
                      value={createTestConfig.useDifficultyDistribution ? "" : (createTestConfig.respectDifficulty ? createTestConfig.targetDifficulty : "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreateTestConfig(prev => ({
                          ...prev,
                          respectDifficulty: val !== "",
                          targetDifficulty: val || "NHẬN BIẾT"
                        }));
                      }}
                      className="bg-[#070b14] border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Tất cả</option>
                      {levelsList.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Counts Split per Exercise Type */}
              {createTestConfig.source !== 'selected' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Cấu hình số câu & độ khó:</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 select-none">
                        <button
                          type="button"
                          onClick={() => setCreateTestConfig(prev => ({ ...prev, useTypeDistribution: !prev.useTypeDistribution }))}
                          className="text-slate-400 hover:text-white cursor-pointer flex items-center"
                        >
                          {createTestConfig.useTypeDistribution ? (
                            <CheckSquare size={16} className="text-blue-500 mr-1.5" />
                          ) : (
                            <Square size={16} className="mr-1.5" />
                          )}
                          <span className="text-xs text-slate-300 font-bold">Phân bổ theo dạng</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 select-none">
                        <button
                          type="button"
                          onClick={() => setCreateTestConfig(prev => ({ ...prev, useDifficultyDistribution: !prev.useDifficultyDistribution }))}
                          className="text-slate-400 hover:text-white cursor-pointer flex items-center"
                        >
                          {createTestConfig.useDifficultyDistribution ? (
                            <CheckSquare size={16} className="text-blue-500 mr-1.5" />
                          ) : (
                            <Square size={16} className="mr-1.5" />
                          )}
                          <span className="text-xs text-slate-300 font-bold">Phân bổ theo độ khó</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {createTestConfig.useDifficultyDistribution && (
                    <div className="bg-[#080b12] border border-slate-855 p-4 rounded-2xl flex flex-col gap-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-slate-300">Tỷ lệ độ khó (%)</span>
                        <span className={`text-[10px] font-bold ${
                          (createTestConfig.difficultyPctNhanBiet + createTestConfig.difficultyPctThongHieu + createTestConfig.difficultyPctVanDung === 100)
                            ? 'text-emerald-500'
                            : 'text-rose-500 animate-pulse'
                        }`}>
                          Tổng: {createTestConfig.difficultyPctNhanBiet + createTestConfig.difficultyPctThongHieu + createTestConfig.difficultyPctVanDung}% 
                          {createTestConfig.difficultyPctNhanBiet + createTestConfig.difficultyPctThongHieu + createTestConfig.difficultyPctVanDung !== 100 && " (Phải bằng 100%)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-450 uppercase">Nhận biết:</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={createTestConfig.difficultyPctNhanBiet}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                              setCreateTestConfig(prev => ({ ...prev, difficultyPctNhanBiet: val }));
                            }}
                            className="bg-[#070b14] border border-slate-850 px-2.5 py-1.5 rounded-xl text-xs text-white font-bold text-center focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-450 uppercase">Thông hiểu:</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={createTestConfig.difficultyPctThongHieu}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                              setCreateTestConfig(prev => ({ ...prev, difficultyPctThongHieu: val }));
                            }}
                            className="bg-[#070b14] border border-slate-850 px-2.5 py-1.5 rounded-xl text-xs text-white font-bold text-center focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-450 uppercase">Vận dụng:</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={createTestConfig.difficultyPctVanDung}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                              setCreateTestConfig(prev => ({ ...prev, difficultyPctVanDung: val }));
                            }}
                            className="bg-[#070b14] border border-slate-850 px-2.5 py-1.5 rounded-xl text-xs text-white font-bold text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!createTestConfig.useTypeDistribution ? (
                    <div className="flex flex-col gap-1.5 max-w-xs animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Số câu mỗi đề:</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={createTestConfig.totalCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCreateTestConfig(prev => ({ ...prev, totalCount: val }));
                        }}
                        className="bg-[#080b12] border border-slate-855 px-3.5 py-2.5 rounded-xl text-xs text-white font-bold"
                      />
                      <div className="text-[9px] text-slate-450 font-bold mt-0.5">
                        Tổng số câu lấy từ ngân hàng: <span className="text-blue-450">{createTestConfig.totalCount * createTestConfig.numVersions}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#080b12] border border-slate-855 p-4 rounded-2xl flex flex-col gap-3 animate-fade-in text-xs">
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {createTestConfig.typeOrder.length === 0 ? (
                          <p className="text-[10px] text-slate-500 text-center italic py-4">
                            Không tìm thấy dạng câu hỏi nào trong CSDL để phân bổ
                          </p>
                        ) : (
                          createTestConfig.typeOrder.map((t, idx) => {
                            const isIncluded = createTestConfig.includedTypes.includes(t);
                            const countInType = createTestConfig.typeCounts[t] || 0;
                            const available = poolForFilters.filter(q => q.t === t).length;
                            const numVersions = createTestConfig.numVersions;
                            
                            const suggested = Math.floor(available / numVersions);
                            const remainder = available % numVersions;
                            const totalNeeded = countInType * numVersions;
                            const diff = available - totalNeeded;
                            
                            return (
                              <div key={t} className={`flex flex-col gap-2 bg-[#111827]/40 border p-3 rounded-xl transition ${
                                isIncluded ? 'border-slate-800' : 'border-slate-900 opacity-60'
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const included = createTestConfig.includedTypes.includes(t);
                                        const newIncluded = included 
                                          ? createTestConfig.includedTypes.filter(x => x !== t)
                                          : [...createTestConfig.includedTypes, t];
                                        setCreateTestConfig(prev => ({ ...prev, includedTypes: newIncluded }));
                                      }}
                                      className="text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      {isIncluded ? (
                                        <CheckSquare size={15} className="text-blue-500" />
                                      ) : (
                                        <Square size={15} />
                                      )}
                                    </button>
                                    <span className="text-[11px] font-extrabold text-slate-200 truncate max-w-[120px]" title={TYPE_MAP[t] || t}>
                                      {TYPE_MAP[t] || t}
                                    </span>
                                    <span className="text-[10px] text-slate-450 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                                      Có {available} câu
                                    </span>
                                  </div>
                                  
                                  {/* Reordering Controls */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveType(idx, -1)}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:border-slate-800 disabled:cursor-not-allowed text-[10px] font-bold cursor-pointer"
                                      title="Di chuyển lên"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === createTestConfig.typeOrder.length - 1}
                                      onClick={() => handleMoveType(idx, 1)}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:border-slate-800 disabled:cursor-not-allowed text-[10px] font-bold cursor-pointer"
                                      title="Di chuyển xuống"
                                    >
                                      ↓
                                    </button>
                                  </div>
                                </div>

                                {isIncluded && (
                                  <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-2 rounded-lg border border-slate-900/60 mt-1">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                        <span>Gợi ý: {suggested} câu/đề</span>
                                        {remainder > 0 && (
                                          <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px]">
                                            Lẻ (Dư {remainder})
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className="text-[9px] font-bold">
                                        {diff < 0 ? (
                                          <span className="text-red-500 font-black">Thiếu {Math.abs(diff)} câu!</span>
                                        ) : (
                                          <span className="text-emerald-500 font-extrabold">Dư {diff} câu</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 font-semibold">Số câu mỗi đề:</span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={available}
                                        value={countInType}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          setCreateTestConfig(prev => ({
                                            ...prev,
                                            typeCounts: {
                                              ...prev.typeCounts,
                                              [t]: val
                                            }
                                          }));
                                        }}
                                        className="w-14 bg-[#070b14] border border-slate-800 text-right px-2 py-1 rounded text-xs font-bold text-blue-450 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between text-xs mt-1">
                        <span className="text-slate-450 font-bold">Tổng số câu / đề:</span>
                        <span className="font-black text-blue-450 text-sm">
                          {createTestConfig.typeOrder.reduce((sum, t) => {
                            if (!createTestConfig.includedTypes.includes(t)) return sum;
                            return sum + (createTestConfig.typeCounts[t] || 0);
                          }, 0)} câu
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-400 leading-relaxed flex gap-2">
                <Sparkles size={14} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Thông tin:</strong> Câu hỏi sau khi tạo/lọc sẽ được chuyển thẳng sang dạng JSON ở tab **Trình tạo đề thi**. Bạn có thể cấu hình số lượng mã đề và định dạng xuất (Word/Excel/CSV) tại đó.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900 mt-2">
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="px-4 py-2 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleRunCreateTest}
                className="px-5 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/10 transition cursor-pointer"
              >
                Tạo Đề Thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Unified Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 animate-fade-in p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 text-slate-200 max-h-[90vh] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="text-blue-500" size={16} />
                Nhập câu hỏi từ CSV / DOCX
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
                <label className="text-[10px] font-bold text-slate-450 uppercase">Cách 1: Chọn tệp CSV hoặc DOCX từ máy tính</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-250 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-2">
                    <Upload size={14} />
                    <span>Chọn tệp CSV / DOCX</span>
                    <input
                      type="file"
                      accept=".csv,.docx"
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
                <FastPastedCsvInput
                  value={pastedCsv}
                  onFileClear={() => setSelectedCsvFile(null)}
                  onTextChange={(val) => setPastedCsv(val)}
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-450 leading-normal flex gap-2">
                <HelpCircle size={14} className="shrink-0 mt-0.5 text-blue-400" />
                <span className="text-slate-350">
                  File CSV phải bao gồm tiêu đề tương ứng với các cột: <strong className="text-blue-400">No., GRADE, UNIT, TEST_TYPE, QUESTIONS, QUESTION_TYPE, OPTION 1, OPTION 2, OPTION 3, OPTION 4, ANSWER, LEVEL</strong>.
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
