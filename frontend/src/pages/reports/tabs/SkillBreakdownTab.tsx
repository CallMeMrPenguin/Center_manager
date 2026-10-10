import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GraduationCap, ArrowRight, RefreshCw, X } from 'lucide-react';
import { api } from '../../../api';
import { MasteryHeatmap } from '../components/MasteryHeatmap';
import { UnitBreakdownTable } from '../components/UnitBreakdownTable';
import { StudentWeaknessDiagnosisCard } from '../components/StudentWeaknessDiagnosisCard';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CustomSelect } from '../../../components/CustomSelect';
import { RequireClassSelectionPrompt } from '../components/RequireClassSelectionPrompt';

interface SkillBreakdownTabProps {
  selectedClassId: string;
  selectedStudentId: string;
  onSelectRankingStudent: (studentId: number) => void;
  sessionRecords?: any[];
  studentRankings?: any[];
  classes?: any[];
  onSelectClass?: (classId: string) => void;
}

export const SkillBreakdownTab: React.FC<SkillBreakdownTabProps> = ({
  selectedClassId,
  selectedStudentId,
  onSelectRankingStudent,
  sessionRecords = [],
  studentRankings = [],
  classes = [],
  onSelectClass,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'diagnosis' | 'heatmap' | 'units'>('diagnosis');
  const [loading, setLoading] = useState(false);
  const [apiReportData, setApiReportData] = useState<any>(null);
  const cacheRef = useRef<Map<string, any>>(new Map());

  const cacheKey = `${selectedClassId}_${selectedStudentId || 'all'}`;

  const fetchSkillData = useCallback(async (force = false) => {
    if (!selectedClassId) return;

    // Check cache first for 0ms instantaneous display
    if (!force && cacheRef.current.has(cacheKey)) {
      setApiReportData(cacheRef.current.get(cacheKey));
      return;
    }

    setLoading(true);
    try {
      const cid = parseInt(selectedClassId);
      const sid = selectedStudentId ? parseInt(selectedStudentId) : undefined;
      const res = await api.getSkillBreakdown(cid, sid);
      cacheRef.current.set(cacheKey, res);
      setApiReportData(res);
    } catch {
      setApiReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedStudentId, cacheKey]);

  useEffect(() => {
    fetchSkillData();
  }, [fetchSkillData]);

  const reportData = useMemo(() => {
    if (!selectedClassId) return null;
    return apiReportData || (cacheRef.current.has(cacheKey) ? cacheRef.current.get(cacheKey) : null);
  }, [selectedClassId, apiReportData, cacheKey]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentRankings.find(s => String(s.student_id) === String(selectedStudentId)) || null;
  }, [selectedStudentId, studentRankings]);

  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    return classes.find(c => String(c.id) === String(selectedClassId)) || null;
  }, [selectedClassId, classes]);

  // If viewing all classes ("Tất cả lớp học"), prompt the user to pick a specific class
  if (!selectedClassId || selectedClassId === 'all') {
    return (
      <RequireClassSelectionPrompt
        classes={classes}
        onSelectClass={onSelectClass}
        tabName="kỹ năng & Bloom taxonomy"
        description="Vui lòng chọn một lớp học cụ thể để xem ma trận thành thạo kỹ năng, chẩn đoán điểm yếu và phân tích chi tiết từng bài học."
      />
    );
  }

  if (loading && !reportData) {
    return (
      <div className="py-24 text-center text-slate-500 dark:text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3">
        <RefreshCw size={24} className="text-indigo-500 dark:text-indigo-400 animate-spin" />
        <span className="text-indigo-600 dark:text-indigo-300 font-black">Đang phân tích dữ liệu kỹ năng & Bloom taxonomy...</span>
      </div>
    );
  }

  const unitBreakdown = reportData?.unit_breakdown || [];
  const heatmapUnits = reportData?.mastery_heatmap?.units || [];
  const heatmapStudents = reportData?.mastery_heatmap?.students || [];

  return (
    <div className="flex flex-col gap-6 mb-8 select-none">
      {/* 0. ACTIVE STUDENT FILTER BANNER */}
      {selectedStudent && (
        <div className="bg-white dark:bg-[#101528] p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm dark:shadow-lg animate-cascade-1">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center">
              {selectedStudent.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedStudent.full_name} {selectedStudent.nickname && <span className="text-indigo-600 dark:text-indigo-300 font-bold">({selectedStudent.nickname})</span>}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-[#1e2748] text-indigo-700 dark:text-indigo-300 font-bold">{selectedStudent.class_name}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRankingStudent(0)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-[#1c2442] dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 transition cursor-pointer"
            title="Bỏ lọc học sinh"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. INTERNAL SUB-TAB SELECTOR (SLIDING PILL INDICATOR) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <SegmentedControl<'diagnosis' | 'heatmap' | 'units'>
          value={activeSubTab}
          onChange={setActiveSubTab}
          options={[
            { value: 'diagnosis', label: 'Phụ Đạo' },
            { value: 'heatmap', label: 'Ma Trận' },
            { value: 'units', label: 'Unit' },
          ]}
          size="md"
        />

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
            <RefreshCw size={12} className="animate-spin" />
            <span>Đang cập nhật...</span>
          </div>
        )}
      </div>

      {/* 2. SUB-TAB CONTENT VIEWS */}
      {activeSubTab === 'diagnosis' && (
        <div className="animate-cascade-1">
          <StudentWeaknessDiagnosisCard
            sessionRecords={sessionRecords}
            studentRankings={studentRankings}
            selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId}
            heatmapStudents={heatmapStudents}
            onSelectStudent={(sid) => {
              onSelectRankingStudent(sid);
              setActiveSubTab('heatmap');
            }}
          />
        </div>
      )}

      {activeSubTab === 'heatmap' && (
        <div className="animate-cascade-1">
          <MasteryHeatmap
            units={heatmapUnits}
            students={heatmapStudents}
            onSelectStudent={onSelectRankingStudent}
            grade={selectedClass?.grade}
          />
        </div>
      )}

      {activeSubTab === 'units' && (
        <div className="animate-cascade-1">
          <UnitBreakdownTable data={unitBreakdown} />
        </div>
      )}
    </div>
  );
};

