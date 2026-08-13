import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { AppSettings, SystemCheck, GradeTypeItem } from '../../types';
import { 
  Settings as SettingsIcon, Database, RefreshCw, 
  Trash2, ShieldCheck, Cpu, HardDrive, CheckCircle2, AlertTriangle, Save,
  Download, ArrowUpCircle, GitBranch, Loader2, Plus, Scale, Edit3
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

export default function Settings() {
  const confirm = useConfirm();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [systemCheck, setSystemCheck] = useState<SystemCheck | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [filesDirInput, setFilesDirInput] = useState("");

  // Dynamic Grade Types state
  const DEFAULT_GRADE_TYPES: GradeTypeItem[] = [
    { id: 'check_1', label: 'Check 1', weight: 35, color: '#3b82f6' },
    { id: 'check_2', label: 'Check 2', weight: 55, color: '#a855f7' },
    { id: 'homework', label: 'BTVN / Homework', weight: 10, color: '#f59e0b' }
  ];
  const [gradeTypes, setGradeTypes] = useState<GradeTypeItem[]>(DEFAULT_GRADE_TYPES);
  const [newGradeLabel, setNewGradeLabel] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Update state
  const [updateState, setUpdateState] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const updatePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadSettings();
    loadProfiles();
    runDiagnostics();
    // Check update state silently on mount
    api.getUpdateStatus().then(setUpdateState).catch(() => {});
    return () => {
      if (updatePollRef.current) clearInterval(updatePollRef.current);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data?.files_dir) setFilesDirInput(data.files_dir);
      if (data && data.grade_types && Array.isArray(data.grade_types) && data.grade_types.length > 0) {
        setGradeTypes(data.grade_types);
      } else if (data && data.grade_weights) {
        setGradeTypes([
          { id: 'check_1', label: 'Check 1', weight: data.grade_weights.check_1 ?? 35, color: '#3b82f6' },
          { id: 'check_2', label: 'Check 2', weight: data.grade_weights.check_2 ?? 55, color: '#a855f7' },
          { id: 'homework', label: 'BTVN / Homework', weight: 10, color: '#f59e0b' }
        ]);
      }
    } catch (e) {
      showToast("Không thể tải cấu hình hệ thống: " + e, "error");
    }
  };

  const handleSaveGradeTypes = async () => {
    const sum = gradeTypes.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    if (Math.abs(sum - 100) > 0.1) {
      showToast(`Tổng các trọng số phải bằng 100% (Hiện tại: ${sum.toFixed(1)}%)`, "warning");
      return;
    }
    try {
      const legacyWeights: Record<string, number> = {};
      gradeTypes.forEach(gt => { legacyWeights[gt.id] = gt.weight; });

      await api.saveSettings({
        grade_types: gradeTypes,
        grade_weights: legacyWeights as any
      });
      showToast("Đã lưu danh sách loại điểm & trọng số thành công!", "success");
      loadSettings();
    } catch (e) {
      showToast("Không thể lưu trọng số: " + e, "error");
    }
  };

  const handleAutoRebalance = () => {
    if (gradeTypes.length === 0) return;
    const equalWeight = Number((100 / gradeTypes.length).toFixed(1));
    let currentSum = 0;
    const rebalanced = gradeTypes.map((gt, idx) => {
      if (idx === gradeTypes.length - 1) {
        const lastW = Number((100 - currentSum).toFixed(1));
        return { ...gt, weight: Math.max(0, lastW) };
      }
      currentSum += equalWeight;
      return { ...gt, weight: equalWeight };
    });
    setGradeTypes(rebalanced);
    showToast("Đã tự động cân bằng các trọng số!", "success");
  };

  const handleAddGradeType = () => {
    if (!newGradeLabel.trim()) {
      showToast("Vui lòng nhập tên loại điểm mới", "warning");
      return;
    }
    const cleanLabel = newGradeLabel.trim();
    const cleanId = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') || `grade_${Date.now()}`;
    if (gradeTypes.some(gt => gt.id === cleanId)) {
      showToast("Loại điểm này đã tồn tại", "warning");
      return;
    }
    const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
    const assignedColor = colors[gradeTypes.length % colors.length];
    const updated = [...gradeTypes, { id: cleanId, label: cleanLabel, weight: 0, color: assignedColor }];
    setGradeTypes(updated);
    setNewGradeLabel('');
    setShowAddModal(false);
    showToast(`Đã thêm '${cleanLabel}'! Bấm 'Tự động cân bằng' để chia đều trọng số.`, "success");
  };

  const handleRemoveGradeType = (id: string) => {
    if (gradeTypes.length <= 1) {
      showToast("Phải duy trì ít nhất 1 loại điểm", "warning");
      return;
    }
    setGradeTypes(prev => prev.filter(gt => gt.id !== id));
    showToast("Đã xóa loại điểm. Hãy điều chỉnh hoặc bấm Tự động cân bằng.", "warning");
  };

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const runDiagnostics = async () => {
    try {
      setLoadingDiagnostics(true);
      const data = await api.getSystemCheck();
      setSystemCheck(data);
    } catch (e) {
      showToast("Lỗi chẩn đoán môi trường: " + e, "error");
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!filesDirInput.trim()) {
      showToast("Đường dẫn lưu trữ không được để trống", "warning");
      return;
    }
    try {
      await api.saveSettings({
        files_dir: filesDirInput.trim()
      });
      showToast("Đã lưu thiết lập cấu hình hệ thống!", "success");
      loadSettings();
    } catch (e) {
      showToast("Không thể lưu thiết lập: " + e, "error");
    }
  };

  const handleBrowseDirectory = async () => {
    try {
      const res = await api.selectDirectory();
      if (res.success && res.directory) {
        setFilesDirInput(res.directory);
        // Automatically save settings
        await api.saveSettings({
          files_dir: res.directory.trim()
        });
        showToast("Đã chọn và lưu thư mục mới!", "success");
        loadSettings();
      }
    } catch (e: any) {
      showToast("Lỗi chọn thư mục: " + (e.message || e), "error");
    }
  };

  const handleDeleteProfile = async (name: string) => {
    if (name === "Default Settings") return;
    const isConfirmed = await confirm({
      title: "Xóa cấu hình",
      message: `Bạn có chắc muốn xóa hồ sơ cấu hình '${name}'?`,
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      await api.deleteProfile(name);
      showToast(`Đã xóa hồ sơ '${name}'`, "success");
      loadProfiles();
    } catch (e) {
      showToast("Lỗi xóa cấu hình: " + e, "error");
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await api.checkUpdate();
      setUpdateState(result);
      if (result.has_update) {
        showToast(`Có bản cập nhật mới: v${result.latest_version}!`, 'success');
      } else if (!result.error) {
        showToast('Ứng dụng đang dùng phiên bản mới nhất!', 'success');
      } else {
        showToast('Lỗi kiểm tra cập nhật: ' + result.error, 'error');
      }
    } catch (e: any) {
      showToast('Không thể kết nối kiểm tra cập nhật: ' + e.message, 'error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    const confirmed = await confirm({
      title: 'Cài đặt bản cập nhật',
      message: `Ứng dụng sẽ tải xuống bản v${updateState?.latest_version} và tự động khởi động lại. Quá trình này mất khoảng 1-2 phút.\n\nBạn có muốn tiếp tục?`,
      confirmText: 'Cập Nhật Ngay',
      cancelText: 'Hủy',
      type: 'warning',
    });
    if (!confirmed) return;

    setApplyingUpdate(true);
    try {
      await api.applyUpdate();
      showToast('Đang tải xuống và cài đặt bản cập nhật...', 'warning');
      // Start polling for progress
      if (updatePollRef.current) clearInterval(updatePollRef.current);
      updatePollRef.current = setInterval(async () => {
        try {
          const status = await api.getUpdateStatus();
          setUpdateState(status);
          if (status.applied) {
            clearInterval(updatePollRef.current!);
            showToast('Cập nhật thành công! Đang khởi động lại...', 'success');
          } else if (status.error && !status.applying) {
            clearInterval(updatePollRef.current!);
            setApplyingUpdate(false);
            showToast('Lỗi cập nhật: ' + status.error, 'error');
          }
        } catch {}
      }, 1500);
    } catch (e: any) {
      setApplyingUpdate(false);
      showToast('Không thể áp dụng bản cập nhật: ' + e.message, 'error');
    }
  };

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto px-8 py-6 select-none text-slate-200 flex flex-col gap-6">
      
      {/* Page Title */}
      <div className="pb-2">
        <h1 className="text-xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
          <SettingsIcon size={20} className="text-blue-500" />
          Cấu Hình Hệ Thống
        </h1>
        <p className="text-xs text-slate-400">
          Chẩn đoán kết nối Microsoft Word local, cấu hình thư mục lưu trữ tệp tin và quản lý các hồ sơ định dạng mẫu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Diagnostics and Directory Config */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* System Diagnostics Box */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu size={14} className="text-blue-400" /> Chẩn đoán môi trường chạy máy tính
              </h3>
              <button
                onClick={runDiagnostics}
                disabled={loadingDiagnostics}
                className="group p-1.5 bg-[#0b0f19] border border-slate-850 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 rounded-lg text-slate-400 hover:text-white transition-all duration-300 flex items-center gap-0 hover:gap-1 text-[10px] font-bold cursor-pointer"
              >
                <RefreshCw size={10} className={loadingDiagnostics ? "animate-spin" : ""} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap block">Kiểm tra lại</span>
              </button>
            </div>

            {systemCheck ? (
              <div className="flex flex-col gap-4">
                
                {/* Word status indicator */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0b0f19]/60 border border-slate-900/50">
                  {systemCheck.word_installed ? (
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-500/10 text-rose-450 rounded-xl mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white">Kết nối Microsoft Word (COM API)</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {systemCheck.word_installed 
                        ? "Đã phát hiện thấy Microsoft Word trên hệ điều hành của bạn. Chế độ xuất PDF xem trước và gộp từ vựng hoạt động đầy đủ."
                        : "Không tìm thấy Microsoft Word hoặc COM Dispatch API bị lỗi. Bạn vẫn có thể biên dịch đề thi Word .docx bình thường nhưng tính năng xuất PDF xem trước trực tiếp sẽ tạm thời bị vô hiệu."}
                    </p>
                    {systemCheck.win32_com_error && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-400 font-mono overflow-x-auto max-w-full">
                        Details: {systemCheck.win32_com_error}
                      </div>
                    )}
                  </div>
                </div>

                {/* System technical stats */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-300 pl-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Môi trường Python</span>
                    <span className="truncate">{systemCheck.python_version ? systemCheck.python_version.split(" ")[0] : "Python 3.13"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Thư viện python-docx</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Đã sẵn sàng
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Không có dữ liệu chẩn đoán.</p>
            )}
          </div>

          {/* Directory Configuration Box */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
              <HardDrive size={14} className="text-blue-400" /> Thiết lập hệ thống tệp tin
            </h3>

            <div className="flex flex-col gap-4">
              
              {/* Files dir input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Đường dẫn thư mục quản lý tệp</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filesDirInput}
                    onChange={(e) => setFilesDirInput(e.target.value)}
                    onBlur={() => {
                      if (filesDirInput.trim() && settings && filesDirInput.trim() !== settings.files_dir) {
                        handleSaveSettings();
                      }
                    }}
                    placeholder="Workspace Files Directory Path..."
                    className="bg-[#0b0f19] border border-slate-850 px-3.5 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-slate-700 flex-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseDirectory}
                    className="px-4 py-2 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-350 hover:text-white font-extrabold text-[10px] rounded-xl cursor-pointer transition whitespace-nowrap"
                  >
                    Duyệt...
                  </button>
                </div>
                <p className="text-[9px] text-slate-500">Thư mục dùng để lưu trữ tệp đề JSON, file word docx hoàn thiện.</p>
              </div>

              <div className="border-t border-slate-900/60 pt-4 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono">ID thiết bị máy chủ: {settings?.machine_id || 'LOCAL_HOST'}</span>
                <button
                  onClick={handleSaveSettings}
                  className="group px-3.5 py-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all duration-300 flex items-center gap-0 hover:gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Save size={13} />
                  <span className="max-w-0 overflow-hidden group-hover:max-w-[150px] transition-all duration-300 whitespace-nowrap block">Lưu cấu hình hệ thống</span>
                </button>
              </div>

            </div>
          </div>

          {/* Dynamic Grade Types & Proportions Box */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-900/60 pb-3 gap-2">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <SettingsIcon size={14} className="text-indigo-400" /> Quản Lý Loại Điểm & Trọng Số (%)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  Math.abs(gradeTypes.reduce((acc, c) => acc + (Number(c.weight) || 0), 0) - 100) < 0.1
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  Tổng: {gradeTypes.reduce((acc, c) => acc + (Number(c.weight) || 0), 0).toFixed(1)}%
                </span>
                <button
                  type="button"
                  onClick={handleAutoRebalance}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Tự động chia đều trọng số cho tất cả loại điểm"
                >
                  <Scale size={12} />
                  <span>Tự Động Cân Bằng</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Thêm, xóa hoặc chỉnh sửa trọng số % của các loại điểm. Hệ thống tự động đồng bộ trọng số để tính <b>Điểm Đánh Giá</b> và <b>Dự Đoán Học Tập</b>.
            </p>

            <div className="flex flex-col gap-3">
              {gradeTypes.map((gt, idx) => (
                <div key={gt.id || idx} className="flex items-center gap-3 bg-[#0b0f19] p-3 rounded-xl border border-slate-850">
                  <div 
                    className="w-3 h-8 rounded-lg shrink-0" 
                    style={{ backgroundColor: gt.color || '#5c36f5' }} 
                  />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Tên loại điểm</span>
                      <input
                        type="text"
                        value={gt.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGradeTypes(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                        }}
                        className="bg-[#121626] border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white font-bold focus:outline-none focus:border-indigo-500 w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Trọng số (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={gt.weight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setGradeTypes(prev => prev.map((item, i) => i === idx ? { ...item, weight: val } : item));
                        }}
                        className="bg-[#121626] border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white font-bold focus:outline-none focus:border-indigo-500 w-full"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGradeType(gt.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 rounded-lg transition border border-rose-500/20 shrink-0 cursor-pointer"
                    title="Xóa loại điểm này"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {showAddModal ? (
              <div className="flex items-center gap-2 bg-[#0d1222] p-3 rounded-xl border border-indigo-500/30">
                <input
                  type="text"
                  placeholder="Nhập tên loại điểm mới (VD: Speaking, Listening...)"
                  value={newGradeLabel}
                  onChange={(e) => setNewGradeLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGradeType()}
                  className="bg-[#121626] border border-slate-700 px-3 py-2 rounded-lg text-xs text-white font-bold focus:outline-none focus:border-indigo-500 flex-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddGradeType}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                >
                  Xác Nhận
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="w-full py-2.5 border border-dashed border-slate-800 hover:border-indigo-500/40 bg-[#0b0f19]/50 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Thêm Loại Điểm Mới</span>
              </button>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-900/60">
              <button
                type="button"
                onClick={handleSaveGradeTypes}
                className="group px-4 py-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
              >
                <Save size={14} />
                <span>Lưu Trọng Số Điểm</span>
              </button>
            </div>
          </div>


        </div>

        {/* Right Column: Profiles CRUD List */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 self-start">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" /> Hồ sơ định dạng đã lưu
          </h3>

          <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto">
            {Object.keys(profiles).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Chưa có hồ sơ định dạng nào được lưu.</p>
            ) : (
              Object.keys(profiles).map(name => {
                const isDefault = name === "Default Settings";
                return (
                  <div 
                    key={name} 
                    className="flex justify-between items-center p-3 rounded-xl bg-[#0b0f19]/50 border border-slate-900/50 hover:border-slate-800 transition"
                  >
                    <span className="text-xs font-bold text-slate-300 truncate max-w-[160px]">{name}</span>
                    {!isDefault ? (
                      <button
                        onClick={() => handleDeleteProfile(name)}
                        className="p-1.5 text-slate-500 hover:text-rose-500 transition cursor-pointer"
                        title="Xóa hồ sơ này"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-900">Mặc định</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Update Section — full width below grid */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowUpCircle size={14} className="text-blue-400" /> Cập Nhật Ứng Dụng
          </h3>
          <div className="flex items-center gap-2">
            {/* Version badge */}
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-[#0b0f19] border border-slate-900 px-2.5 py-1 rounded-lg">
              <GitBranch size={10} className="text-indigo-400" />
              v{updateState?.current_version ?? '1.0.0'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Status Row */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0b0f19]/60 border border-slate-900/50">
            {applyingUpdate ? (
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : updateState?.has_update ? (
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                <Download size={18} />
              </div>
            ) : (
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <CheckCircle2 size={18} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">
                {applyingUpdate
                  ? 'Đang cài đặt bản cập nhật...'
                  : updateState?.has_update
                  ? `Có bản cập nhật mới: v${updateState.latest_version}`
                  : updateState?.error
                  ? 'Không thể kiểm tra cập nhật'
                  : 'Ứng dụng đang dùng phiên bản mới nhất'}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {applyingUpdate
                  ? (updateState?.progress ?? 'Đang xử lý...')
                  : updateState?.last_checked
                  ? `Kiểm tra lần cuối: ${new Date(updateState.last_checked * 1000).toLocaleTimeString('vi-VN')}`
                  : 'Nhấn "Kiểm Tra Cập Nhật" để kiểm tra phiên bản mới.'}
              </p>
              {updateState?.error && !applyingUpdate && (
                <p className="text-[10px] text-rose-400 mt-1 font-mono">{updateState.error}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {updateState?.has_update && !applyingUpdate && (
                <button
                  onClick={handleApplyUpdate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[10px] rounded-xl transition-all duration-300 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Download size={12} />
                  Cài Đặt Ngay
                </button>
              )}
              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate || applyingUpdate}
                className="group flex items-center gap-0 hover:gap-1.5 p-2 bg-[#0b0f19] border border-slate-850 hover:bg-gradient-to-tr hover:from-blue-600/10 hover:to-indigo-600/10 hover:border-blue-500/30 rounded-xl text-slate-400 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-40"
                title="Kiểm tra bản cập nhật"
              >
                <RefreshCw size={13} className={checkingUpdate ? "animate-spin" : ""} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 whitespace-nowrap block text-[10px] font-bold">Kiểm Tra Cập Nhật</span>
              </button>
            </div>
          </div>

          {/* Progress bar when applying */}
          {applyingUpdate && (
            <div className="w-full bg-[#0b0f19] rounded-full h-1.5 border border-slate-900 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full animate-pulse w-2/3" />
            </div>
          )}

          <p className="text-[9px] text-slate-600 leading-relaxed">
            Cập nhật được phân phối qua GitHub Releases. Dữ liệu người dùng (cơ sở dữ liệu, cấu hình, thư mục tệp) sẽ được bảo toàn trong quá trình cập nhật.
          </p>
        </div>
      </div>

    </div>
  );
}
