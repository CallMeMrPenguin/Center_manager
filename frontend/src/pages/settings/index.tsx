import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { AppSettings, SystemCheck, GradeTypeItem } from '../../types';
import { showToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { AppearanceSettingsCard } from './components/AppearanceSettingsCard';
import { SystemDiagnosticsCard } from './components/SystemDiagnosticsCard';
import { GradeTypesCard } from './components/GradeTypesCard';
import { SystemUpdateCard } from './components/SystemUpdateCard';
import { ProfilesListCard } from './components/ProfilesListCard';
import { DebugSettingsCard } from './components/DebugSettingsCard';
import { SystemSyncSettingsCard } from './components/SystemSyncSettingsCard';
import { PredictionAccuracyCard } from './components/PredictionAccuracyCard';

export default function Settings() {
  const confirm = useConfirm();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [systemCheck, setSystemCheck] = useState<SystemCheck | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  // Dynamic Grade Types state
  const DEFAULT_GRADE_TYPES: GradeTypeItem[] = [
    { id: 'check_1', label: 'Từ Vựng', weight: 55, color: '#3b82f6' },
    { id: 'check_2', label: 'Ngữ Pháp', weight: 35, color: '#a855f7' },
    { id: 'homework', label: 'BTVN', weight: 10, color: '#10b981' },
  ];
  const [gradeTypes, setGradeTypes] = useState<GradeTypeItem[]>(DEFAULT_GRADE_TYPES);

  // Update state
  const [updateState, setUpdateState] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const updatePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadSettings();
    loadProfiles();
    runDiagnostics();
    api.getUpdateStatus().then(setUpdateState).catch(() => {});
    return () => {
      if (updatePollRef.current) clearInterval(updatePollRef.current);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data && data.grade_types && Array.isArray(data.grade_types) && data.grade_types.length > 0) {
        setGradeTypes(data.grade_types);
      } else if (data && data.grade_weights) {
        setGradeTypes([
          { id: 'check_1', label: 'Từ Vựng', weight: data.grade_weights.check_1 ?? 55, color: '#3b82f6' },
          { id: 'check_2', label: 'Ngữ Pháp', weight: data.grade_weights.check_2 ?? 35, color: '#a855f7' },
          { id: 'homework', label: 'BTVN', weight: data.grade_weights.homework ?? 10, color: '#10b981' },
        ]);
      }
    } catch (e) {
      showToast('Không thể tải cấu hình hệ thống: ' + e, 'error');
    }
  };

  const handleSaveGradeTypes = async () => {
    const sum = gradeTypes.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    if (Math.abs(sum - 100) > 0.1) {
      showToast(`Tổng các trọng số phải bằng 100% (Hiện tại: ${sum.toFixed(1)}%)`, 'warning');
      return;
    }
    try {
      const legacyWeights: Record<string, number> = {};
      gradeTypes.forEach((gt) => {
        legacyWeights[gt.id] = gt.weight;
      });

      await api.saveSettings({
        grade_types: gradeTypes,
        grade_weights: legacyWeights as any,
      });
      showToast('Đã lưu danh sách loại điểm & trọng số thành công', 'success');
      loadSettings();
    } catch (e) {
      showToast('Không thể lưu trọng số: ' + e, 'error');
    }
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
      showToast('Lỗi chẩn đoán môi trường: ' + e, 'error');
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const handleDeleteProfile = async (name: string) => {
    if (name === 'Default Settings') return;
    const isConfirmed = await confirm({
      title: 'Xóa cấu hình',
      message: `Bạn có chắc muốn xóa hồ sơ cấu hình '${name}'?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.deleteProfile(name);
      showToast(`Đã xóa hồ sơ '${name}'`, 'success');
      loadProfiles();
    } catch (e) {
      showToast('Lỗi xóa cấu hình: ' + e, 'error');
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await api.checkUpdate();
      setUpdateState(result);
      if (result.has_update) {
        showToast(`Có bản cập nhật mới: v${result.latest_version}`, 'success');
      } else if (!result.error) {
        showToast('Ứng dụng đang dùng phiên bản mới nhất', 'success');
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
      message: `Ứng dụng sẽ tải xuống bản v${updateState?.latest_version} và tự động khởi động lại.\n\nBạn có muốn tiếp tục?`,
      confirmText: 'Cập nhật ngay',
      cancelText: 'Hủy',
      type: 'warning',
    });
    if (!confirmed) return;

    setApplyingUpdate(true);
    try {
      await api.applyUpdate();
      showToast('Đang tải xuống và cài đặt bản cập nhật...', 'warning');
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
    <div className="h-full w-full bg-[#f1f5f9] dark:bg-[#09090b] overflow-y-auto px-8 py-6 select-none text-slate-800 dark:text-slate-200 flex flex-col gap-6">
      {/* Page Title */}
      <div className="pb-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Cấu hình hệ thống
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics, Appearance, and Grade Types Config */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AppearanceSettingsCard />
          <DebugSettingsCard />
          <SystemDiagnosticsCard
            systemCheck={systemCheck}
            loadingDiagnostics={loadingDiagnostics}
            onRefresh={runDiagnostics}
          />
          <GradeTypesCard
            gradeTypes={gradeTypes}
            setGradeTypes={setGradeTypes}
            onSave={handleSaveGradeTypes}
          />
          <PredictionAccuracyCard />
        </div>


        {/* Right Column: Profiles CRUD List */}
        <ProfilesListCard profiles={profiles} onDeleteProfile={handleDeleteProfile} />
      </div>

      {/* System DB & VPS Sync Section */}
      <SystemSyncSettingsCard />

      {/* Update Section — full width below grid */}
      <SystemUpdateCard
        updateState={updateState}
        checkingUpdate={checkingUpdate}
        applyingUpdate={applyingUpdate}
        onCheckUpdate={handleCheckUpdate}
        onApplyUpdate={handleApplyUpdate}
      />
    </div>
  );
}
