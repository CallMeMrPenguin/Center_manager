import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GraduationCap, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../../../api';
import { MasteryHeatmap } from '../components/MasteryHeatmap';
import { UnitBreakdownTable } from '../components/UnitBreakdownTable';
import { StudentWeaknessDiagnosisCard } from '../components/StudentWeaknessDiagnosisCard';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CustomSelect } from '../../../components/CustomSelect';

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

  // If viewing all classes ("Tất cả lớp học"), prompt the user to pick a specific class with inline selector
  if (!selectedClassId) {
    return (
      <div className="py-16 px-6 rounded-2xl bg-[#090d16] border border-[#1b253b] text-center flex flex-col items-center justify-center gap-4 select-none animate-cascade-1 shadow-lg max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <GraduationCap size={28} />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-base font-black text-white uppercase tracking-wider">
            Chọn lớp học để phân tích kỹ năng & Unit
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Chương trình học và danh mục Unit khác nhau giữa các khối lớp. Chọn nhanh lớp học bên dưới để mở ngay Ma trận Nắm vững, Thống kê Unit và Danh sách Học sinh cần phụ đạo:
          </p>
        </div>

        {classes && classes.length > 0 ? (
          <div className="w-full max-w-xs space-y-3 pt-2">
            <CustomSelect
              icon={<GraduationCap size={15} className="text-indigo-400" />}
              value=""
              placeholder="-- Chọn lớp học --"
              onChange={(val) => onSelectClass?.(String(val))}
              options={classes.map((c) => ({
                value: String(c.id),
                label: `${c.class_name} (${c.grade || 'Lớp 6'})`,
              }))}
            />

            <div className="flex flex-wrap gap-2 justify-center">
              {classes.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectClass?.(String(c.id))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141a2e] hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-[#233052] text-xs font-bold transition cursor-pointer"
                >
                  <span>{c.class_name}</span>
                  <ArrowRight size={11} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-amber-400 font-bold">Chưa có lớp học nào trong hệ thống.</p>
        )}
      </div>
    );
  }

  if (loading && !reportData) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3">
        <RefreshCw size={24} className="text-indigo-400 animate-spin" />
        <span className="text-indigo-300 font-black">Đang phân tích dữ liệu kỹ năng & Bloom taxonomy...</span>
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

