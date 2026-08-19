import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { GradeTypeItem } from '../../../types';
import { getSavedWarningSettings, DEFAULT_WARNING_SETTINGS, formatSessionDate } from '../utils';
import { generateMockReportsData, computeDatasetFromRecords } from '../utils/mockReportsData';
import { trunc1Dec } from '../../../utils';

export function useReportsData() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Test Mode Toggle State & Custom Mock Records State
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    return localStorage.getItem('cm_reports_test_mode') === 'true';
  });

  const [customMockRecords, setCustomMockRecords] = useState<any[] | null>(() => {
    try {
      const saved = localStorage.getItem('cm_custom_mock_records');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const toggleTestMode = useCallback(() => {
    setIsTestMode(prev => {
      const next = !prev;
      localStorage.setItem('cm_reports_test_mode', String(next));
      if (next) {
        showToast("Đã BẬT Chế độ Test (20 buổi học mô phỏng / học sinh)", "success");
      } else {
        showToast("Đã TẮT Chế độ Test (Hiển thị dữ liệu thực từ cơ sở dữ liệu)", "warning");
      }
      return next;
    });
  }, []);

  const saveTestRecords = useCallback((records: any[]) => {
    try {
      localStorage.setItem('cm_custom_mock_records', JSON.stringify(records));
      setCustomMockRecords(records);
    } catch (e: any) {
      showToast("Lỗi lưu dữ liệu test: " + e.message, "error");
    }
  }, []);

  const resetTestRecords = useCallback(() => {
    try {
      localStorage.removeItem('cm_custom_mock_records');
      setCustomMockRecords(null);
    } catch { }
  }, []);

  // 2-Class Head-to-Head Comparison State
  const [compareClassAId, setCompareClassAId] = useState<string>('');
  const [compareClassBId, setCompareClassBId] = useState<string>('');

  // Analytics Data & System Engine Results from API
  const [rawSessionRecords, setRawSessionRecords] = useState<any[]>([]);
  const [rawStudentRankings, setRawStudentRankings] = useState<any[]>([]);
  const [rawAnalyticsSummary, setRawAnalyticsSummary] = useState<any>(null);
  const [rawClassAnalyticsMap, setRawClassAnalyticsMap] = useState<Record<string, any>>({});

  // Custom Time Phases State
  const [timePhases, setTimePhases] = useState<any[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');

  // Early Warning & Risk Retention State (Configurable Thresholds)
  const initialSettings = useMemo(() => getSavedWarningSettings(), []);
  const [warningAbsentPct, setWarningAbsentPct] = useState<number>(initialSettings.absentPct);
  const [warningConsecutiveAbsent, setWarningConsecutiveAbsent] = useState<number>(initialSettings.consecutiveAbsent);
  const [warningTrendThreshold, setWarningTrendThreshold] = useState<number>(initialSettings.trendThreshold);
  const [showWarningSettings, setShowWarningSettings] = useState<boolean>(false);

  // Grade types configuration
  const [gradeTypesList, setGradeTypesList] = useState<GradeTypeItem[]>([
    { id: 'check_1', label: 'Check 1', weight: 35, color: '#3b82f6' },
    { id: 'check_2', label: 'Check 2', weight: 55, color: '#a855f7' },
    { id: 'homework', label: 'BTVN', weight: 10, color: '#f59e0b' }
  ]);

  useEffect(() => {
    api.getSettings().then(data => {
      if (data?.grade_types && Array.isArray(data.grade_types) && data.grade_types.length > 0) {
        setGradeTypesList(data.grade_types);
      } else if (data?.grade_weights) {
        setGradeTypesList([
          { id: 'check_1', label: 'Check 1', weight: data.grade_weights.check_1 ?? 35, color: '#3b82f6' },
          { id: 'check_2', label: 'Check 2', weight: data.grade_weights.check_2 ?? 55, color: '#a855f7' },
          { id: 'homework', label: 'BTVN', weight: data.grade_weights.homework ?? 10, color: '#f59e0b' }
        ]);
      }
    }).catch(() => { });
  }, []);

  const handleUpdateWarningSettings = (updates: Partial<typeof DEFAULT_WARNING_SETTINGS>) => {
    const newSettings = {
      absentPct: warningAbsentPct,
      consecutiveAbsent: warningConsecutiveAbsent,
      trendThreshold: warningTrendThreshold,
      ...updates
    };
    if (updates.absentPct !== undefined) setWarningAbsentPct(updates.absentPct);
    if (updates.consecutiveAbsent !== undefined) setWarningConsecutiveAbsent(updates.consecutiveAbsent);
    if (updates.trendThreshold !== undefined) setWarningTrendThreshold(updates.trendThreshold);
    localStorage.setItem('cm_reports_warning_settings', JSON.stringify(newSettings));
  };

  const loadClassesAndStudents = async () => {
    try {
      const classList = await api.getClasses();
      setClasses(classList);
      if (classList && classList.length >= 2) {
        setCompareClassAId(prev => prev || String(classList[0].id));
        setCompareClassBId(prev => prev || String(classList[1].id));
      } else if (classList && classList.length === 1) {
        setCompareClassAId(prev => prev || String(classList[0].id));
      }
      const studentList = await api.getStudents();
      setStudents(studentList);
    } catch (err: any) {
      showToast("Không thể tải danh sách lớp/học sinh: " + err.message, "error");
    }
  };

  const loadAnalyticsData = async (silent?: boolean | any) => {
    const isSilent = silent === true;
    if (!isSilent) setLoading(true);
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const sid = selectedStudentId ? parseInt(selectedStudentId) : undefined;
      const res = await api.getGradeAnalytics(cid, sid);
      setRawSessionRecords(res.session_records || []);
      setRawStudentRankings(res.student_rankings || []);
      setRawAnalyticsSummary(res.analytics_summary || null);
      setRawClassAnalyticsMap(res.class_analytics_map || {});
    } catch (e: any) {
      if (!isSilent) showToast("Lỗi tải báo cáo thống kê: " + (e.message || e), "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const loadTimePhases = useCallback(async () => {
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const res = await api.getTimePhases(cid);
      setTimePhases(res || []);
    } catch {
      setTimePhases([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClassesAndStudents();
    loadAnalyticsData();
    const handleDataChanged = () => {
      loadClassesAndStudents();
      loadAnalyticsData();
    };
    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedClassId, selectedStudentId]);

  useEffect(() => {
    loadTimePhases();
  }, [loadTimePhases]);

  // Mock Dataset when Test Mode is Active
  const mockDataset = useMemo(() => {
    if (customMockRecords && customMockRecords.length > 0) {
      return computeDatasetFromRecords(customMockRecords, classes, students);
    }
    return generateMockReportsData(classes, students);
  }, [classes, students, customMockRecords]);

  // Active data sources based on Test Mode toggle
  const sessionRecords = useMemo(() => {
    if (!isTestMode) return rawSessionRecords;
    let list = mockDataset.session_records;
    if (selectedClassId) {
      list = list.filter(r => String(r.class_id) === selectedClassId);
    }
    if (selectedStudentId) {
      list = list.filter(r => String(r.student_id) === selectedStudentId);
    }
    return list;
  }, [isTestMode, rawSessionRecords, mockDataset, selectedClassId, selectedStudentId]);

  const studentRankings = useMemo(() => {
    if (!isTestMode) return rawStudentRankings;
    let list = mockDataset.student_rankings;
    if (selectedClassId) {
      list = list.filter(r => String(r.class_id) === selectedClassId);
    }
    return list;
  }, [isTestMode, rawStudentRankings, mockDataset, selectedClassId]);

  const analyticsSummary = useMemo(() => {
    if (!isTestMode) return rawAnalyticsSummary;
    return mockDataset.analytics_summary;
  }, [isTestMode, rawAnalyticsSummary, mockDataset]);

  const classAnalyticsMap = useMemo(() => {
    if (!isTestMode) return rawClassAnalyticsMap;
    return mockDataset.class_analytics_map;
  }, [isTestMode, rawClassAnalyticsMap, mockDataset]);

  // Selected Student Object (merging personal details and ranking performance)
  const selectedStudentObj = useMemo(() => {
    if (!selectedStudentId) return null;
    const rawStudent = (students || []).find((s: any) => String(s.id || s.student_id) === selectedStudentId);
    const rankingObj = (isTestMode ? mockDataset.student_rankings : (rawStudentRankings || [])).find(
      (s: any) => String(s.student_id || s.id) === selectedStudentId
    );

    if (!rawStudent && !rankingObj) return null;

    return {
      ...(rawStudent || {}),
      ...(rankingObj || {}),
      id: rawStudent?.id || rankingObj?.student_id || rankingObj?.id || selectedStudentId,
      student_id: rawStudent?.id || rankingObj?.student_id || rankingObj?.id || selectedStudentId,
      full_name: rawStudent?.full_name || rankingObj?.full_name || 'Học sinh',
      nickname: rawStudent?.nickname || rankingObj?.nickname || '',
      school: rawStudent?.school || rankingObj?.school || 'Trung tâm',
      date_of_birth: rawStudent?.date_of_birth || rawStudent?.birthday || rankingObj?.date_of_birth || '',
      gender: rawStudent?.gender || rankingObj?.gender || '',
      father_name: rawStudent?.father_name || rankingObj?.father_name || '',
      father_phone: rawStudent?.father_phone || rankingObj?.father_phone || '',
      mother_name: rawStudent?.mother_name || rankingObj?.mother_name || '',
      mother_phone: rawStudent?.mother_phone || rankingObj?.mother_phone || '',
      phone: rawStudent?.phone || rankingObj?.phone || rawStudent?.father_phone || rawStudent?.mother_phone || '',
      grade: rawStudent?.grade || rankingObj?.student_grade || rankingObj?.class_grade || rankingObj?.grade || '',
      student_grade: rawStudent?.grade || rankingObj?.student_grade || rankingObj?.grade || '',
      class_grade: rankingObj?.class_grade || rawStudent?.class_grade || '',
      class_name: rankingObj?.class_name || rawStudent?.class_name || rawStudent?.enrolled_classes || '',
      enrolled_classes: rawStudent?.enrolled_classes || rankingObj?.class_name || '',
      performance_index: rankingObj?.performance_index ?? rawStudent?.performance_index,
      rating_label: rankingObj?.rating_label || rawStudent?.rating_label,
    };
  }, [selectedStudentId, isTestMode, mockDataset, students, rawStudentRankings]);

  // Analytics Engine math
  const engine = useMemo(() => {
    const raw = analyticsSummary || {
      academic_score: 82.0,
      trend_slope: 0.38,
      trend_label: "Đang cải thiện",
      consistency_score: 92.0,
      std_dev: 0.45,
      std_dev_c1: 0.35,
      std_dev_c2: 0.50,
      std_dev_hw: 0.20,
      consistency_label: "Rất ổn định",
      ema_level: 8.6,
      ema_c1: 8.5,
      ema_c2: 7.2,
      ema_hw: 9.2,
      predicted_next: 8.9,
      pred_c1: 8.8,
      pred_c2: 7.5,
      pred_hw: 9.5,
      attendance_pct: 96.0,
      performance_index: 86.7,
      rating_label: "Xuất Sắc",
      recommendations: [
        "Duy trì tiến độ học tập hiện tại",
        "Dự đoán buổi tới: Check 1 (8.8), Check 2 (7.5), Homework (9.5)."
      ]
    };

    const c1 = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.pred_c1 ?? 0.0)));
    const c2 = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.pred_c2 ?? 0.0)));
    const hw = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.pred_hw ?? 0.0)));
    const predNext = Math.min(10.0, Math.max(0.0, trunc1Dec(raw.predicted_next ?? 0.0)));

    return {
      ...raw,
      pred_c1: c1,
      pred_c2: c2,
      pred_hw: hw,
      predicted_next: predNext
    };
  }, [analyticsSummary]);

  // Map student_id to sorted list of session records
  const studentSessionsMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    sessionRecords.forEach(r => {
      const sid = r.student_id;
      if (sid) {
        if (!map[sid]) map[sid] = [];
        map[sid].push(r);
      }
    });
    Object.keys(map).forEach(k => {
      map[Number(k)].sort((a, b) => (a.date > b.date ? 1 : -1));
    });
    return map;
  }, [sessionRecords]);

  return {
    loading,
    classes,
    selectedClassId,
    setSelectedClassId,
    students,
    selectedStudentId,
    setSelectedStudentId,
    isTestMode,
    setIsTestMode,
    toggleTestMode,
    saveTestRecords,
    resetTestRecords,
    mockDataset,
    compareClassAId,
    setCompareClassAId,
    compareClassBId,
    setCompareClassBId,
    sessionRecords,
    studentRankings,
    analyticsSummary,
    classAnalyticsMap,
    timePhases,
    selectedPhaseId,
    setSelectedPhaseId,
    warningAbsentPct,
    warningConsecutiveAbsent,
    warningTrendThreshold,
    showWarningSettings,
    setShowWarningSettings,
    handleUpdateWarningSettings,
    gradeTypesList,
    selectedStudentObj,
    engine,
    studentSessionsMap,
    loadAnalyticsData,
    loadTimePhases,
  };
}
