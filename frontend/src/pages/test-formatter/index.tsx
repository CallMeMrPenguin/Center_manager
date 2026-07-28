import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { api } from '../../api';
import { LayoutSettings, AppFile } from '../../types';
import PromptManager, { PromptItem } from '../../components/PromptManager';
import { useConfirm } from '../../components/ConfirmDialog';
import { 
  FileText, Download, Eye, Play, Save, Trash2, Settings, 
  ChevronRight, RefreshCw, Upload, AlertCircle, FileCode, CheckCircle,
  FolderOpen, ZoomIn, ZoomOut, Sparkles, X, Layout, ExternalLink
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { cleanOptionPrefix } from '../../utils';


const DEFAULT_TEST_FORMATTER_PROMPTS: PromptItem[] = [
  {
    id: "tf_1",
    title: "Document & Test Serialization Agent Prompt (English)",
    content: `You are an expert Document, Test, and Exercise Serialization Agent for Microsoft Word DOCX compilation.
Your job is to parse tests/exercises from source text into strict JSON matching the compiler schema.

==================================================
OUTPUT FORMAT
==================================================
• Provide your response inside a single \`\`\`json code block containing valid JSON.
• Do NOT include any text, intro, or explanation outside the JSON code block.

==================================================
JSON SCHEMA & KEY DEFINITIONS
==================================================

Top-level object MUST contain a "data" array of question/exercise objects:

{
  "data": [ ... ]
}

Each object in "data" MUST use the following short key names:

1. "t": (String) Exercise type code (MUST be one of: "pr", "st", "sy", "an", "er", "fb", "rw", "wb", "cz", "rd", "ro", "sg", "nt"):
   - "pr" : Pronunciation / Underlined sound
   - "st" : Stress
   - "sy" : Synonym
   - "an" : Antonym
   - "er" : Error Identification
   - "fb" : Fill in the Blank (Standalone single sentence)
   - "rw" : Rewrite Sentences
   - "wb" : Word Box (Fill in the blank with given words inside a rounded box)
   - "cz" : Cloze Passage (Multiple choice A/B/C/D options per blank)
   - "rd" : Reading Passage
   - "ro" : Sentence Reordering
   - "sg" : Sign Meaning
   - "nt" : Notice Meaning

2. "q": (String) Question number (e.g., "1", "15", "20").

3. "x": (String) Question text / sentence prompt.

4. "o": (Array of Strings) Answer choices array (e.g., ["option A", "option B", "option C", "option D"]).
   NOTE: 
   - For Multiple Choice Questions (MCQ): Include answer choices in "o".
   - For Non-MCQ / Open-ended Questions (Fill-in-the-blank, Sentence Rewrite): Leave "o" empty: "o": []. The system automatically detects MCQ vs Non-MCQ based on "o".

5. "a": (String, Optional) Correct answer ("A", "B", "C", "D" or answer text).

6. "b": (String or Array of Strings, For "wb" / "cz" / "rd" / "nt") Passage text body or notice text.

7. "k": (Array of Objects, For "wb" / "cz" / "rd") Sub-questions / answers for passage exercises. Each object inside "k" has {"q", "a"} (or {"q", "x", "o", "a"}).

8. "w": (Array of Strings, For "wb") List of words to render inside a rounded Word Box shape above the passage (e.g., ["traditional", "attracts", "artisans", "pottery", "explore", "handicrafts", "preserve", "historical", "visitors", "culture"]).

==================================================
AUTOMATIC WORD BOX ("wb") RULE
==================================================
• If an exercise is a Fill-in-the-Blank passage that provides a set/list of given words in a box (and NOT a multiple-choice question format with options A/B/C/D per blank), you MUST automatically classify and output it as type "wb":
  - Put all the given words in the "w" array: "w": ["word1", "word2", "word3", ...]
  - Put the passage text with numbered blanks (1) _______, (2) _______ in "b".
  - Put the answer key mapping inside "k": [{"q": 1, "a": "word1"}, {"q": 2, "a": "word2"}, ...].
• Do NOT format passages with a given word bank as "cz" or "fb". Automatically output them as "t": "wb".

==================================================
INLINE FORMATTING RULES
==================================================
Preserve text formatting using these exact inline tags:
- Underlined letters/words: Enclose in brackets -> e.g. "pass[ed]" or "[living in](A)"
- Bold text: Enclose in double asterisks -> e.g. "**Investigative**:"
- Italic text: Enclose in single asterisks -> e.g. "*Note:*"
- Error identification choices in "x": Use format "[text](LETTER)" -> e.g. "She [go](A) to [school](B) yesterday."

==================================================
EXAMPLE OUTPUT
==================================================
{
  "data": [
    {
      "t": "pr",
      "q": "1",
      "o": ["pass[ed]", "check[ed]", "stopp[ed]", "want[ed]"],
      "a": "D"
    },
    {
      "t": "wb",
      "w": ["traditional", "attracts", "artisans", "pottery", "explore", "handicrafts", "preserve", "historical", "visitors", "culture"],
      "b": "Bat Trang is a famous (1) _______ village located near Ha Noi. Many skilled (2) _______ work here to produce beautiful (3) _______. The village (4) _______ thousands of domestic and foreign (5) _______ every year who come to buy unique handicrafts.",
      "k": [
        {"q": 1, "a": "traditional"},
        {"q": 2, "a": "artisans"},
        {"q": 3, "a": "pottery"},
        {"q": 4, "a": "attracts"},
        {"q": 5, "a": "visitors"}
      ]
    },
    {
      "t": "fb",
      "q": "2",
      "x": "She is very _______ (INTEREST) in learning English.",
      "o": [],
      "a": "interested"
    },
    {
      "t": "rw",
      "q": "3",
      "x": "Living in a big city is more expensive than living in a rural village.\\n(Living in)",
      "o": [],
      "a": "Living in a rural village is cheaper than living in a big city."
    },
    {
      "t": "er",
      "q": "4",
      "x": "My brother [is](A) very good [at](B) playing [the](C) guitar, isn't [him](D)?",
      "o": ["is", "at", "the", "him"],
      "a": "D"
    }
  ]
}`
  }
];

const DEFAULT_LAYOUT: LayoutSettings = {
  margin_top: 2.0,
  margin_bottom: 2.0,
  margin_left: 3.0,
  margin_right: 1.5,
  font_name: "Times New Roman",
  font_size: 12.0,
  line_spacing: 1.15,
  space_after: 6.0,
  header_space_before: 14.0,
  header_space_after: 8.0,
  question_space_before: 6.0,
  question_space_after: 4.0,
  options_left_indent: 0.5,
  options_space_before: 0.0,
  options_space_after: 3.0,
  passage_space_before: 4.0,
  passage_space_after: 6.0,
  passage_indent_first: 0.75,
  reorder_space_before: 0.0,
  reorder_space_after: 2.0,
  reorder_left_indent: 1.0,
  notice_space_before: 4.0,
  notice_space_after: 6.0,
  notice_left_indent: 1.0
};

const MOCK_PAYLOAD = [
  {
    "t": "pr",
    "q": 1,
    "o": ["pass[ed]", "plann[ed]", "hopp[ed]", "play[ed]"],
    "a": "D"
  },
  {
    "t": "st",
    "q": 2,
    "o": ["teacher", "student", "decide", "member"],
    "a": "C"
  },
  {
    "t": "mq",
    "q": 3,
    "x": "We have English lessons _______ Tuesday and Friday.",
    "o": ["on", "up", "at", "in"],
    "a": "A"
  },
  {
    "t": "er",
    "q": 4,
    "x": "Because of [his](A) illness, he [could not](B) go to school, [so](C) he was [sadly](D).",
    "o": ["his", "could not", "so", "sadly"],
    "a": "D"
  }
];

interface TestFormatterProps {
  preloadedQuestions?: any[] | null;
  preloadedVersions?: number | null;
  preloadedGrade?: string | null;
  preloadedUnit?: string | null;
  clearPreloadedQuestions?: () => void;
}

// Fast Isolated Code Editor Component to eliminate parent re-render lag
const FastJsonEditor = React.memo(({ 
  initialValue, 
  onParsedDataChange 
}: { 
  initialValue: string; 
  onParsedDataChange: (data: any[], error: string | null, text: string) => void;
}) => {
  const [localText, setLocalText] = useState(initialValue);

  useEffect(() => {
    setLocalText(initialValue);
  }, [initialValue]);

  // Debounced parsing without triggering parent renders on every keystroke
  useEffect(() => {
    if (!localText.trim()) {
      onParsedDataChange([], null, localText);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(localText);
        const dataBlock = parsed.exercises || parsed.questions || parsed.data || parsed;
        if (Array.isArray(dataBlock)) {
          onParsedDataChange(dataBlock, null, localText);
        } else if (typeof dataBlock === 'object') {
          onParsedDataChange([dataBlock], null, localText);
        } else {
          onParsedDataChange([], "JSON phải là một danh sách các câu hỏi.", localText);
        }
      } catch (e: any) {
        onParsedDataChange([], `Lỗi cú pháp: ${e.message}`, localText);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localText]);

  return (
    <textarea
      value={localText}
      onChange={(e) => setLocalText(e.target.value)}
      spellCheck={false}
      placeholder="Nhập mảng câu hỏi JSON tại đây..."
      className="code-editor-textarea flex-1 w-full p-4 font-mono text-xs text-slate-100 resize-none shadow-inner leading-relaxed select-text"
    />
  );
});

export default function TestFormatter({ 
  preloadedQuestions, 
  preloadedVersions, 
  preloadedGrade, 
  preloadedUnit, 
  clearPreloadedQuestions 
}: TestFormatterProps) {
  const confirm = useConfirm();
  const [jsonText, setJsonText] = useState(() => JSON.stringify(MOCK_PAYLOAD, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [exercisesData, setExercisesData] = useState<any[]>(MOCK_PAYLOAD);
  const [grade, setGrade] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  
  // Settings & Profiles
  const [layout, setLayout] = useState<LayoutSettings>(DEFAULT_LAYOUT);
  const [profiles, setProfiles] = useState<Record<string, LayoutSettings>>({});
  const [activeProfile, setActiveProfile] = useState<string>("Mặc định");
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);
  const [mixOptions, setMixOptions] = useState(true);
  
  // Previews & Workspace
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  
  // Test Versions & Compiled Files State
  const [numVersions, setNumVersions] = useState<number>(1);
  const [lastCompiledFiles, setLastCompiledFiles] = useState<string[]>([]);
  
  // Workspace files for loader selector
  const [jsonFiles, setJsonFiles] = useState<AppFile[]>([]);
  const [selectedFileToLoad, setSelectedFileToLoad] = useState<string>("");

  // Spreadsheet Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    format: 'xlsx',
    defaultTime: 30
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [saveToDocs, setSaveToDocs] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [saveFolderId, setSaveFolderId] = useState<string>('');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleParsedDataChange = useCallback((data: any[], error: string | null, text: string) => {
    setExercisesData(data);
    setJsonError(error);
    setJsonText(text);
  }, []);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as HTMLElement)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadProfiles();
    loadWorkspaceJsonFiles();
  }, []);

  useEffect(() => {
    if (preloadedQuestions && preloadedQuestions.length > 0) {
      const mapped = preloadedQuestions.map((q, idx) => ({
        t: q.t || 'mq',
        q: idx + 1,
        x: q.x || '',
        o: q.o || [],
        a: q.a || '',
        unit: q.unit || '',
        grade: q.grade || ''
      }));
      const str = JSON.stringify(mapped, null, 2);
      setJsonText(str);
      setExercisesData(mapped);
      setJsonError(null);
      if (preloadedVersions) setNumVersions(preloadedVersions);
      if (preloadedGrade) setGrade(preloadedGrade);
      if (preloadedUnit) setUnit(preloadedUnit);
      if (clearPreloadedQuestions) clearPreloadedQuestions();
      showToast(`Đã tự động điền ${mapped.length} câu hỏi đã chọn từ Ngân hàng`, "success");
    }
  }, [preloadedQuestions, preloadedVersions, preloadedGrade, preloadedUnit]);

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (e) {
      console.error(e);
      showToast("Không thể tải danh sách cấu hình", "error");
    }
  };

  const loadWorkspaceJsonFiles = async () => {
    try {
      const files = await api.getFiles();
      setJsonFiles(files.filter(f => f.type === 'json'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileChange = (profileName: string) => {
    setActiveProfile(profileName);
    if (profileName === "Mặc định") {
      setLayout(DEFAULT_LAYOUT);
    } else if (profiles[profileName]) {
      setLayout(profiles[profileName]);
    }
  };

  const handleSaveProfile = async () => {
    const name = newProfileName.trim();
    if (!name) {
      showToast("Vui lòng nhập tên cấu hình cần lưu", "warning");
      return;
    }
    if (name === "Mặc định") {
      showToast("Không thể ghi đè lên cấu hình Mặc định", "error");
      return;
    }
    try {
      await api.saveProfile(name, layout);
      showToast(`Đã lưu cấu hình '${name}'`, "success");
      setNewProfileName("");
      loadProfiles();
      setActiveProfile(name);
    } catch (e) {
      showToast("Lỗi lưu cấu hình: " + e, "error");
    }
  };

  const handleDeleteProfile = async () => {
    if (activeProfile === "Mặc định") return;
    const isConfirmed = await confirm({
      title: "Xóa cấu hình",
      message: `Bạn có muốn xóa cấu hình '${activeProfile}'?`,
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      await api.deleteProfile(activeProfile);
      showToast(`Đã xóa cấu hình '${activeProfile}'`, "success");
      setActiveProfile("Mặc định");
      setLayout(DEFAULT_LAYOUT);
      loadProfiles();
    } catch (e) {
      showToast("Lỗi xóa cấu hình: " + e, "error");
    }
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      showToast(`Đã nạp tệp: ${file.name}`, "success");
    };
    reader.readAsText(file);
  };

  const handleDocxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast(`Đang tải lên và chuyển đổi tệp: ${file.name}...`, "warning");
      const uploadRes = await api.uploadFile(file);
      if (uploadRes.success && uploadRes.filename) {
        const convertRes = await api.convertDocx(uploadRes.filename);
        if (convertRes.success && convertRes.exercises) {
          const cleanedExercises = Array.isArray(convertRes.exercises) ? convertRes.exercises.map((ex: any) => ({
            ...ex,
            o: Array.isArray(ex.o) ? ex.o.map((o: any) => cleanOptionPrefix(String(o))) : ex.o,
            options: Array.isArray(ex.options) ? ex.options.map((o: any) => cleanOptionPrefix(String(o))) : ex.options,
            k: Array.isArray(ex.k) ? ex.k.map((sub: any) => ({
              ...sub,
              o: Array.isArray(sub.o) ? sub.o.map((o: any) => cleanOptionPrefix(String(o))) : sub.o,
              options: Array.isArray(sub.options) ? sub.options.map((o: any) => cleanOptionPrefix(String(o))) : sub.options
            })) : ex.k
          })) : convertRes.exercises;
          setJsonText(JSON.stringify(cleanedExercises, null, 2));
          showToast(`Đã chuyển đổi thành công tệp ${file.name} sang JSON!`, "success");
        } else {
          showToast("Chuyển đổi thất bại hoặc dữ liệu không hợp lệ.", "error");
        }
      } else {
        showToast("Tải tệp lên thất bại.", "error");
      }
    } catch (err: any) {
      showToast("Lỗi chuyển đổi DOCX: " + (err.message || err), "error");
    }
  };

  const handleCompileAndDownload = async () => {
    if (jsonError || exercisesData.length === 0) {
      showToast("Vui lòng sửa lỗi JSON trước khi biên dịch", "error");
      return;
    }
    try {
      setCompiling(true);
      showToast("Đang tạo file Word...", "warning");
      const res = await api.compileTest(exercisesData, layout, numVersions, mixOptions, grade, unit, saveToDocs, saveFolderId || null);
      if (res.success) {
        const filesList = res.files || [res.filename];
        setLastCompiledFiles(filesList);
        showToast(`Đã tạo thành công ${filesList.length} phiên bản đề thi!`, "success");
      }
    } catch (e) {
      showToast("Lỗi biên dịch đề thi: " + e, "error");
    } finally {
      setCompiling(false);
    }
  };

  const handleExportTestSpreadsheet = async () => {
    if (jsonError || exercisesData.length === 0) {
      showToast("Vui lòng nhập danh sách câu hỏi hợp lệ trước", "error");
      return;
    }
    try {
      setCompiling(true);
      showToast("Đang xuất bảng tính...", "warning");
      const res = await api.exportTestExcelCsv(
        exercisesData, exportConfig.format, exportConfig.defaultTime,
        numVersions, mixOptions, grade, unit, saveToDocs, saveFolderId || null
      );
      if (res.success) {
        const filesList = res.files || [res.filename];
        setLastCompiledFiles(filesList);
        showToast(`Đã xuất thành công ${filesList.length} phiên bản bảng tính!`, "success");
        setShowExportModal(false);
      }
    } catch (e: any) {
      showToast("Xuất bảng tính thất bại: " + (e.message || e), "error");
    } finally {
      setCompiling(false);
    }
  };

  const handleGeneratePdfPreview = async () => {
    if (jsonError || exercisesData.length === 0) {
      showToast("Vui lòng nhập danh sách câu hỏi hợp lệ trước", "error");
      return;
    }
    try {
      setPdfLoading(true);
      setPdfUrl(null);
      showToast("Đang tạo bản xem trước PDF...", "warning");
      const res = await api.previewPdf(exercisesData, layout, numVersions, mixOptions, grade, unit);
      setPdfUrl(`${res.url}?t=${Date.now()}`);
      showToast("Tạo PDF xem trước thành công!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(`Không thể tạo PDF: ${e.message || e}`, "error");
    } finally {
      setPdfLoading(false);
    }
  };

  const renderSettingInput = (label: string, key: keyof LayoutSettings, min = 0, max = 24, step = 0.5) => {
    return (
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex justify-between text-[0.66rem] font-bold text-slate-300">
          <span>{label}</span>
          <span className="text-indigo-400 font-mono">{layout[key]}</span>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={layout[key] as number}
          onChange={(e) => setLayout(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
          className="w-full h-1.5 bg-[#1a2138] rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-[#0d101d] flex relative overflow-hidden select-none">
      
      {/* 1. SLIDING CONFIGS PANEL (SLIDEBAR) */}
      <aside className={`w-80 bg-[#121629] border-r border-[#202842] p-5 flex flex-col justify-between overflow-y-auto shrink-0 transition-all duration-300 absolute lg:relative z-20 h-full ${
        showConfig ? 'left-0 opacity-100' : '-left-80 lg:-ml-80 opacity-0 pointer-events-none'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#202842]">
            <h2 className="text-[0.73rem] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings size={12} /> CẤU HÌNH LỀ & CHỮ
            </h2>
            <button 
              onClick={() => setShowConfig(false)}
              className="p-1 rounded-xl bg-[#1a2038] text-slate-400 hover:text-white hover:bg-[#252e4e] cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
          
          {/* Active Profile Select */}
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Hồ sơ thiết lập</label>
            <select
              value={activeProfile}
              onChange={(e) => handleProfileChange(e.target.value)}
              className="bg-[#181f36] border border-[#283354] px-3 py-2 rounded-xl text-xs text-white font-bold cursor-pointer"
            >
              <option value="Mặc định">Mặc định</option>
              {Object.keys(profiles).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {activeProfile !== "Mặc định" && (
              <button 
                onClick={handleDeleteProfile}
                className="mt-1 flex items-center gap-1 text-[0.66rem] text-rose-400 hover:text-rose-300 font-bold justify-end cursor-pointer"
              >
                <Trash2 size={10} /> Xóa hồ sơ này
              </button>
            )}
          </div>

          {/* Margins */}
          <h3 className="text-[0.66rem] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Căn lề trang (cm)</h3>
          <div className="grid grid-cols-2 gap-2 bg-[#181f36] p-2.5 rounded-xl border border-[#252e4e]">
            {renderSettingInput("Lề trên", "margin_top", 0.5, 5, 0.1)}
            {renderSettingInput("Lề dưới", "margin_bottom", 0.5, 5, 0.1)}
            {renderSettingInput("Lề trái", "margin_left", 0.5, 5, 0.1)}
            {renderSettingInput("Lề phải", "margin_right", 0.5, 5, 0.1)}
          </div>

          {/* Typography */}
          <h3 className="text-[0.66rem] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">Typography & Font</h3>
          <div className="flex flex-col gap-2 bg-[#181f36] p-2.5 rounded-xl border border-[#252e4e]">
            <div className="flex flex-col gap-1">
              <label className="text-[0.6rem] text-slate-400 font-bold">Phông chữ</label>
              <select
                value={layout.font_name}
                onChange={(e) => setLayout(prev => ({ ...prev, font_name: e.target.value }))}
                className="bg-[#121629] border border-[#283354] px-2.5 py-1.5 rounded-lg text-xs text-white"
              >
                {["Times New Roman", "Arial", "Calibri", "Segoe UI", "Georgia"].map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            {renderSettingInput("Cỡ chữ (pt)", "font_size", 8, 20, 0.5)}
            {renderSettingInput("Giãn dòng", "line_spacing", 1.0, 3.0, 0.05)}
            {renderSettingInput("Khoảng cách đoạn (pt)", "space_after", 0, 24, 1)}
          </div>

          {/* Mix Options Option */}
          <h3 className="text-[0.66rem] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">Cấu hình Đề thi</h3>
          <div className="flex flex-col gap-2.5 bg-[#181f36] p-2.5 rounded-xl border border-[#252e4e] mt-1">
            <div className="flex items-center gap-2.5">
              <input 
                type="checkbox" 
                id="mix-options-checkbox"
                checked={mixOptions}
                onChange={(e) => setMixOptions(e.target.checked)}
                className="rounded border-[#283354] text-indigo-500 bg-[#121629] focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="mix-options-checkbox" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                Trộn thứ tự đáp án (Mix Options)
              </label>
            </div>
            
            <div className="flex flex-col gap-1 mt-1 border-t border-[#252e4e] pt-2">
              <label htmlFor="num-versions-input" className="text-[0.66rem] font-bold text-slate-300">
                Số lượng mã đề (Versions):
              </label>
              <input 
                type="number" 
                id="num-versions-input"
                min={1}
                max={50}
                value={numVersions}
                onChange={(e) => setNumVersions(parseInt(e.target.value) || 1)}
                className="bg-[#121629] border border-[#283354] px-2.5 py-1.5 rounded-lg text-xs text-white font-bold w-full focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Profile Save Box */}
        <div className="mt-4 border-t border-[#202842] pt-3 flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Lưu cấu hình hiện tại</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Đề thi THPT"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="bg-[#181f36] border border-[#283354] px-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 flex-1 focus:outline-none"
            />
            <button
              onClick={handleSaveProfile}
              className="px-3 bg-[#5c36f5] hover:bg-[#7351f7] rounded-xl text-white font-bold text-xs flex items-center justify-center transition cursor-pointer"
              title="Lưu hồ sơ"
            >
              <Save size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HORIZONTAL GRID (SIDE-BY-SIDE EDITOR & PDF VIEW) */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* LEFT COMPONENT: EDITOR */}
        <section className="flex-1 flex flex-col border-r border-[#202842] overflow-hidden bg-[#0f1322]">
          
          {/* Editor Topbar */}
          <div className="h-14 border-b border-[#202842] bg-[#121629] flex items-center justify-between px-6 shrink-0 gap-3 relative z-30">
            <div className="flex items-center gap-3 group/left-toolbar">
              <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center text-xs font-bold cursor-pointer ${
                  showConfig 
                    ? 'bg-[#5c36f5] text-white border-transparent px-3 shadow-md shadow-indigo-500/20' 
                    : 'bg-[#181f36] text-slate-300 border-[#283354] hover:bg-[#222a46] hover:text-white shadow-sm'
                }`}
                title={showConfig ? "Ẩn cấu hình lề và cỡ chữ" : "Hiện cấu hình lề và cỡ chữ"}
              >
                <Settings size={14} className="shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                  showConfig ? 'max-w-xs opacity-100 ml-1.5' : 'max-w-0 opacity-0 group-hover/left-toolbar:max-w-xs group-hover/left-toolbar:opacity-100 group-hover/left-toolbar:ml-1.5'
                }`}>Căn Lề & Chữ</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap justify-end group/function-bar">
              <PromptManager 
                storageKey="prompts_test_formatter" 
                tabTitle="Trình Tạo Đề Thi" 
                defaultPrompts={DEFAULT_TEST_FORMATTER_PROMPTS} 
              />

              <label className="px-3 py-2 rounded-xl bg-[#181f36] border border-[#283354] hover:bg-[#222a46] text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center cursor-pointer shadow-sm" title="Nạp dữ liệu từ file JSON">
                <Upload size={14} className="shrink-0" />
                <span className="max-w-0 opacity-0 group-hover/function-bar:max-w-xs group-hover/function-bar:opacity-100 group-hover/function-bar:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">Nạp JSON</span>
                <input type="file" accept=".json" onChange={handleDirectFileUpload} className="hidden" />
              </label>

              <label className="px-3 py-2 rounded-xl bg-[#181f36] border border-[#283354] hover:bg-[#222a46] text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center cursor-pointer shadow-sm" title="Chuyển đổi file Word (.docx) sang JSON">
                <Upload size={14} className="text-amber-400 shrink-0" />
                <span className="max-w-0 opacity-0 group-hover/function-bar:max-w-xs group-hover/function-bar:opacity-100 group-hover/function-bar:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">Nhập từ DOCX</span>
                <input type="file" accept=".docx" onChange={handleDocxFileUpload} className="hidden" />
              </label>

              <label className="flex items-center px-3 py-2 rounded-xl bg-[#181f36] border border-[#283354] text-slate-300 text-xs font-bold cursor-pointer select-none hover:text-white transition shadow-sm" title="Lưu vào quản lý Tài liệu">
                <input 
                  type="checkbox" 
                  checked={saveToDocs} 
                  onChange={(e) => setSaveToDocs(e.target.checked)} 
                  className="rounded border-[#283354] bg-[#121629] text-indigo-500 cursor-pointer shrink-0"
                />
                <span className="max-w-0 opacity-0 group-hover/function-bar:max-w-xs group-hover/function-bar:opacity-100 group-hover/function-bar:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">Lưu vào Tài liệu</span>
              </label>

              {/* Compile/Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={compiling}
                  className="px-3 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] disabled:opacity-50 text-white text-xs font-black transition-all flex items-center cursor-pointer shadow-md shadow-indigo-500/20 border border-white/20"
                  title="Xuất đề thi ra Word / Excel"
                >
                  <Download size={14} className={`shrink-0 ${compiling ? "animate-spin" : ""}`} />
                  <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    showExportMenu ? 'max-w-xs opacity-100 ml-1.5 mr-1' : 'max-w-0 opacity-0 group-hover/function-bar:max-w-xs group-hover/function-bar:opacity-100 group-hover/function-bar:ml-1.5 group-hover/function-bar:mr-1'
                  }`}>Xuất Đề Thi</span>
                  <ChevronRight size={12} className={`shrink-0 transform transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#161b2e] border border-white/10 rounded-xl z-30 py-2 px-2 flex flex-col gap-1 shadow-2xl animate-mac-dropdown text-[0.66rem]">
                    <button
                      onClick={() => { setShowExportMenu(false); handleCompileAndDownload(); }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition w-full text-left cursor-pointer"
                    >
                      <FileText size={13} className="text-indigo-400" />
                      <span>Tập tin Word (.docx)</span>
                    </button>
                    <button
                      onClick={() => { setShowExportMenu(false); setShowExportModal(true); }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition w-full text-left cursor-pointer"
                    >
                      <FileCode size={13} className="text-emerald-400" />
                      <span>Bảng tính Excel / CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text Area Content - Uncontrolled Isolated Editor to eliminate 60FPS typing lag */}
          <div className="flex-1 relative p-4 bg-[#0f1322] flex flex-col gap-4">
            <FastJsonEditor
              initialValue={jsonText}
              onParsedDataChange={handleParsedDataChange}
            />

            {/* Validation Info Overlay */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 select-none">
              {jsonError ? (
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[0.66rem] bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 rounded-xl shadow-lg">
                  <AlertCircle size={12} />
                  <span className="truncate max-w-xs">{jsonError}</span>
                </div>
              ) : exercisesData.length > 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[0.66rem] bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-lg">
                  <CheckCircle size={12} />
                  <span>Hợp lệ ({exercisesData.length} câu)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[0.66rem] bg-[#181f36] border border-[#283354] px-3 py-1.5 rounded-xl">
                  <AlertCircle size={12} />
                  <span>Trống</span>
                </div>
              )}
            </div>
          </div>
          
          {/* BANNER TO OPEN COMPILED FILES */}
          {lastCompiledFiles && lastCompiledFiles.length > 0 && (
            <div className="bg-[#12182b] border-t border-indigo-500/30 px-6 py-3 flex items-center justify-between shrink-0 shadow-lg">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-indigo-400" />
                <h4 className="text-xs font-bold text-white">Đã xuất bản đề thi thành công ({lastCompiledFiles.length} mã đề)!</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try { await api.openWorkspaceFolder(); showToast("Đang mở thư mục chứa đề thi...", "success"); }
                    catch (e) { showToast("Lỗi mở thư mục: " + e, "error"); }
                  }}
                  className="px-3 py-1.5 bg-[#5c36f5] hover:bg-[#7351f7] text-white font-extrabold text-[0.66rem] rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <FolderOpen size={11} />
                  <span>MỞ THƯ MỤC CHỨA ĐỀ</span>
                </button>
                <button onClick={() => setLastCompiledFiles([])} className="p-1 text-slate-400 hover:text-white">
                  <X size={13} />
                </button>
              </div>
            </div>
          )}
        </section>
        
        {/* RIGHT COMPONENT: PREVIEW PANEL */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0d101d]">
          
          {/* Preview Panel Topbar */}
          <div className="h-14 border-b border-[#202842] bg-[#121629] flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-indigo-400" />
              <span className="text-xs font-black text-white">XEM TRƯỚC BẢN IN PDF</span>
            </div>

            {/* Zoom controls and generate controls */}
            <div className="flex items-center gap-2.5 group/preview-toolbar">
              <button 
                onClick={handleGeneratePdfPreview}
                disabled={pdfLoading}
                className="px-3 py-1.5 rounded-xl bg-[#5c36f5] hover:bg-[#7351f7] text-white font-extrabold text-[0.66rem] flex items-center transition shadow-md cursor-pointer disabled:opacity-50 border border-white/20"
                title="Tạo lại bản xem trước PDF từ nội dung JSON"
              >
                <RefreshCw size={12} className={`shrink-0 ${pdfLoading ? "animate-spin" : ""}`} />
                <span className="max-w-0 opacity-0 group-hover/preview-toolbar:max-w-xs group-hover/preview-toolbar:opacity-100 group-hover/preview-toolbar:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">{pdfLoading ? "Đang tạo PDF..." : "Cập Nhật Xem Trước PDF"}</span>
              </button>
              {pdfUrl && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#181f36] rounded-xl border border-[#283354] p-1 shadow-inner gap-0.5">
                    <button 
                      onClick={() => setPdfZoom(prev => Math.max(prev - 10, 50))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Thu nhỏ"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="px-2 text-[0.66rem] font-extrabold text-slate-300 font-mono w-12 text-center select-none">
                      {pdfZoom}%
                    </span>
                    <button 
                      onClick={() => setPdfZoom(prev => Math.min(prev + 10, 200))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Phóng to"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>
                  <button 
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="p-2 rounded-xl bg-[#181f36] border border-[#283354] hover:bg-[#222a46] text-slate-300 hover:text-white transition cursor-pointer flex items-center text-[0.66rem] font-extrabold shadow-sm"
                    title="Xem trong trình duyệt"
                  >
                    <ExternalLink size={13} className="shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover/preview-toolbar:max-w-xs group-hover/preview-toolbar:opacity-100 group-hover/preview-toolbar:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">Xem Trình Duyệt</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PDF Frame Container */}
          <div className="flex-1 bg-[#101424] p-6 relative overflow-hidden flex justify-center items-center">
            {pdfLoading ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-300 z-10 bg-[#101424]/90">
                <RefreshCw className="animate-spin h-8 w-8 text-indigo-400 mb-3" />
                <p className="font-bold text-xs">Đang xuất file Word và chuyển sang PDF...</p>
              </div>
            ) : pdfUrl ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-[#283354] shadow-2xl relative bg-[#181f36]">
                <iframe 
                  src={`${pdfUrl}#zoom=${pdfZoom}`} 
                  className="w-full h-full border-none" 
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="max-w-sm flex flex-col justify-center items-center text-center text-slate-400 px-6">
                <div className="p-4 bg-[#181f36] border border-[#283354] rounded-2xl mb-4 text-indigo-400 shadow-md">
                  <FileText size={32} />
                </div>
                <h4 className="text-xs font-black text-white">Xem Trước Đề Thi</h4>
                <p className="text-[0.66rem] text-slate-400 mt-2 leading-relaxed font-semibold">
                  Nhấn nút <strong className="text-indigo-300">"Cập Nhật Xem Trước PDF"</strong> ở góc trên bên phải để xuất bản in PDF trực tiếp từ Microsoft Word.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
      
      {/* Spreadsheet Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-mac-dropdown p-4">
          <div className="w-full max-w-md bg-[#121629] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileCode size={16} className="text-indigo-400" />
                Cấu hình xuất bảng tính
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chọn Định dạng file:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExportConfig(prev => ({ ...prev, format: 'xlsx' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition border cursor-pointer ${
                      exportConfig.format === 'xlsx'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-[#181f36] text-slate-400 border-white/10 hover:bg-[#222a46]'
                    }`}
                  >
                    Microsoft Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportConfig(prev => ({ ...prev, format: 'csv' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition border cursor-pointer ${
                      exportConfig.format === 'csv'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-[#181f36] text-slate-400 border-white/10 hover:bg-[#222a46]'
                    }`}
                  >
                    CSV File (.csv)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Thời gian trả lời mặc định (Kahoot/Quizizz):</label>
                <select
                  value={exportConfig.defaultTime}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, defaultTime: parseInt(e.target.value) || 30 }))}
                  className="bg-[#181f36] border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white cursor-pointer w-full focus:outline-none"
                >
                  {[5, 10, 20, 30, 45, 60, 120, 180, 300, 600, 900, 1800].map(sec => (
                    <option key={sec} value={sec}>
                      {sec >= 60 ? `${sec / 60} phút` : `${sec} giây`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-300 font-semibold flex gap-2">
                <Sparkles size={14} className="shrink-0 mt-0.5 text-indigo-400" />
                <span>Dữ liệu câu hỏi sẽ được biên dịch và ghi trực tiếp vào tệp Excel/CSV tương thích Kahoot, Quizizz.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10 mt-2">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer">Hủy</button>
              <button onClick={handleExportTestSpreadsheet} className="px-5 py-2 bg-[#5c36f5] hover:bg-[#7351f7] text-white text-xs font-extrabold rounded-xl shadow-lg border border-white/20 cursor-pointer">Xuất file</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
