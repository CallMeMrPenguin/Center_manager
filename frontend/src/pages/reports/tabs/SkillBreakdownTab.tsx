import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { api } from '../../../api';
import { MasteryHeatmap } from '../components/MasteryHeatmap';
import { UnitBreakdownTable } from '../components/UnitBreakdownTable';
import { StudentWeaknessDiagnosisCard } from '../components/StudentWeaknessDiagnosisCard';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { computeMockSkillBreakdown, generateMockReportsData } from '../utils/mockReportsData';

interface SkillBreakdownTabProps {
  selectedClassId: string;
  selectedStudentId: string;
  onSelectRankingStudent: (studentId: number) => void;
  isTestMode?: boolean;
  sessionRecords?: any[];
  studentRankings?: any[];
}

export const SkillBreakdownTab: React.FC<SkillBreakdownTabProps> = ({
  selectedClassId,
  selectedStudentId,
  onSelectRankingStudent,
  isTestMode,
  sessionRecords = [],
  studentRankings = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'diagnosis' | 'heatmap' | 'units'>('diagnosis');
  const [loading, setLoading] = useState(false);
  const [apiReportData, setApiReportData] = useState<any>(null);

  const fetchSkillData = useCallback(async () => {
    if (isTestMode || !selectedClassId) return;
    setLoading(true);
    try {
      const cid = parseInt(selectedClassId);
      const sid = selectedStudentId ? parseInt(selectedStudentId) : undefined;
      const res = await api.getSkillBreakdown(cid, sid);
      setApiReportData(res);
    } catch {
      setApiReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedStudentId, isTestMode]);

  useEffect(() => {
    fetchSkillData();
  }, [fetchSkillData]);

  const reportData = useMemo(() => {
    if (!selectedClassId) return null;
    if (isTestMode) {
      const recs = (sessionRecords && sessionRecords.length > 0)
        ? sessionRecords
        : generateMockReportsData([], []).session_records;
      return computeMockSkillBreakdown(recs, selectedClassId, selectedStudentId);
    }
    return apiReportData;
  }, [isTestMode, sessionRecords, selectedClassId, selectedStudentId, apiReportData]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentRankings.find(s => String(s.student_id) === String(selectedStudentId)) || null;
  }, [selectedStudentId, studentRankings]);

  // If viewing all classes ("Tất cả lớp học"), prompt the user to pick a specific class
  if (!selectedClassId) {
    return (
      <div className="py-20 px-6 rounded-2xl bg-[#090d16] border border-[#1b253b] text-center flex flex-col items-center justify-center gap-3 select-none animate-cascade-1 shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <GraduationCap size={24} />
        </div>
        <h4 className="text-sm font-black text-white uppercase tracking-wider">
          Vui lòng chọn một lớp học cụ thể
        </h4>
        <p className="text-xs text-slate-400 max-w-md">
          Chương trình học và danh mục Unit khác nhau giữa các khối lớp. Vui lòng chọn lớp học ở thanh công cụ phía trên để xem Ma trận Nắm vững, Thống kê Unit và Học sinh Cần phụ đạo.
        </p>
      </div>
    );
  }

  if (loading && !reportData) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
        <span className="text-indigo-400 font-black">Đang tính toán phân tích kỹ năng & độ nắm vững Bloom...</span>
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
        <div className="bg-[#101528] border border-indigo-500/40 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-lg animate-cascade-1">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center border border-white/20">
              {selectedStudent.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
                ĐANG PHÂN TÍCH KỸ NĂNG HỌC SINH
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-base font-black text-white">
                  {selectedStudent.full_name} {selectedStudent.nickname && <span className="text-indigo-300 font-bold">({selectedStudent.nickname})</span>}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#1e2748] text-indigo-300 font-bold border border-indigo-500/20">{selectedStudent.class_name}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectRankingStudent(0)}
            className="px-3 py-1.5 rounded-xl bg-[#1c2442] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-xs font-bold transition cursor-pointer"
          >
            Bỏ Lọc Học Sinh ✕
          </button>
        </div>
      )}

      {/* 1. INTERNAL SUB-TAB SELECTOR (SLIDING PILL INDICATOR) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-2">
        <SegmentedControl<'diagnosis' | 'heatmap' | 'units'>
          value={activeSubTab}
          onChange={setActiveSubTab}
          options={[
            { value: 'diagnosis', label: 'Học Sinh Cần Phụ Đạo' },
            { value: 'heatmap', label: 'Ma Trận Nắm Vững' },
            { value: 'units', label: 'Thống Kê Theo Unit' },
          ]}
          activeColor="bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)]"
          className="w-full sm:w-auto min-w-[540px]"
          size="md"
        />
      </div>

      {/* 2. SUB-TAB CONTENT VIEWS */}
      {activeSubTab === 'diagnosis' && (
        <div className="animate-cascade-1">
          {/* Bảng danh sách học sinh cần phụ đạo theo bài học */}
          <StudentWeaknessDiagnosisCard
            sessionRecords={sessionRecords}
            studentRankings={studentRankings}
            selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId}
            heatmapStudents={heatmapStudents}
            isTestMode={isTestMode}
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
          />
        </div>
      )}

      {activeSubTab === 'units' && (
        <div className="animate-cascade-1">
          {/* Unit & Topic Breakdown Table */}
          <UnitBreakdownTable data={unitBreakdown} />
        </div>
      )}
    </div>
  );
};
