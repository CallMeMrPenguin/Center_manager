import { useState, useEffect, useCallback, useMemo } from 'react';
import { ClassItem, EnrolledStudent, SeatingCol, AttendanceRecord, GradingPair } from '../types';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';

export function useSeatingLayout(
  selectedClass: ClassItem | null,
  enrolledStudents: EnrolledStudent[],
  attendanceRecords: AttendanceRecord[],
  attendanceDate: string
) {
  const [numCols, setNumCols] = useState(3);
  const [desksPerCol, setDesksPerCol] = useState(3);
  const [seatingGrid, setSeatingGrid] = useState<SeatingCol[]>([]);

  // Drag & drop state
  const [draggedSeat, setDraggedSeat] = useState<{ colIdx: number; deskIdx: number; posIdx: number } | null>(null);
  const [draggedUnassigned, setDraggedUnassigned] = useState<EnrolledStudent | null>(null);

  // Modals state
  const [blossomModalOpen, setBlossomModalOpen] = useState(false);
  const [blossomPairs, setBlossomPairs] = useState<any[]>([]);
  const [blossomUnmatched, setBlossomUnmatched] = useState<any[]>([]);
  const [mixingGA, setMixingGA] = useState(false);
  const [gradingPairsModal, setGradingPairsModal] = useState(false);
  const [gradingPairs, setGradingPairs] = useState<GradingPair[]>([]);
  const [showUnassignedPanel, setShowUnassignedPanel] = useState(true);

  const initEmptySeating = useCallback((cols: number, desks: number, studentsList: EnrolledStudent[]) => {
    const layout: SeatingCol[] = [];
    for (let c = 0; c < cols; c++) {
      const colObj: SeatingCol = { col_index: c, desks_in_col: desks, seats: [] };
      for (let d = 0; d < desks; d++) {
        colObj.seats.push(
          { desk: d, position: 0, student_id: null, student_name: null },
          { desk: d, position: 1, student_id: null, student_name: null }
        );
      }
      layout.push(colObj);
    }

    let stIdx = 0;
    for (let c = 0; c < cols; c++) {
      for (let d = 0; d < desks; d++) {
        for (let p = 0; p < 2; p++) {
          if (stIdx < studentsList.length) {
            const st = studentsList[stIdx];
            layout[c].seats[d * 2 + p] = {
              desk: d,
              position: p,
              student_id: st.id,
              student_name: st.full_name,
            };
            stIdx++;
          }
        }
      }
    }
    setSeatingGrid(layout);
  }, []);

  const loadSeating = useCallback(async (clsId: number, studentsList: EnrolledStudent[]) => {
    try {
      const seating = await api.getClassSeating(clsId);
      if (seating && seating.layout_json && seating.layout_json !== '[]') {
        try {
          const parsed = JSON.parse(seating.layout_json);
          setSeatingGrid(parsed);
          setNumCols(parsed.length || 3);
          if (parsed.length > 0 && parsed[0].desks_in_col) {
            setDesksPerCol(parsed[0].desks_in_col);
          }
        } catch (e) {
          initEmptySeating(3, 3, studentsList);
        }
      } else {
        initEmptySeating(3, 3, studentsList);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải sơ đồ lớp:', err);
      initEmptySeating(3, 3, studentsList);
    }
  }, [initEmptySeating]);

  useEffect(() => {
    if (selectedClass) {
      loadSeating(selectedClass.id, enrolledStudents);
    } else {
      setSeatingGrid([]);
    }
  }, [selectedClass?.id, enrolledStudents, loadSeating]);

  // Absent students lookup
  const absentStudentIds = useMemo(() => {
    const set = new Set<number>();
    attendanceRecords.forEach((r: any) => {
      if (r.status === 'Vắng mặt') {
        set.add(r.student_id);
      }
    });
    return set;
  }, [attendanceRecords]);

  // Assigned students lookup
  const assignedStudentIdsInSeating = useMemo(() => {
    const set = new Set<number>();
    seatingGrid.forEach((col) => {
      if (col.seats) {
        col.seats.forEach((seat: any) => {
          if (seat.student_id) set.add(seat.student_id);
        });
      }
    });
    return set;
  }, [seatingGrid]);

  const unassignedStudents = useMemo(() => {
    return enrolledStudents.filter((st) => !assignedStudentIdsInSeating.has(st.id));
  }, [enrolledStudents, assignedStudentIdsInSeating]);

  const handleAddColumn = () => {
    const newGrid: SeatingCol[] = JSON.parse(JSON.stringify(seatingGrid));
    const newColIdx = newGrid.length;
    const colDesks = desksPerCol || 3;
    const seats = [];
    for (let d = 0; d < colDesks; d++) {
      seats.push(
        { desk: d, position: 0, student_id: null, student_name: null },
        { desk: d, position: 1, student_id: null, student_name: null }
      );
    }
    newGrid.push({
      col_index: newColIdx,
      desks_in_col: colDesks,
      seats,
    });
    setSeatingGrid(newGrid);
    setNumCols(newGrid.length);
  };

  const handleRemoveColumn = () => {
    if (seatingGrid.length <= 1) return;
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    newGrid.pop();
    setSeatingGrid(newGrid);
    setNumCols(newGrid.length);
  };

  const handleAddDeskToCol = (colIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const col = newGrid[colIdx];
    if (!col) return;
    const newDeskIdx = col.desks_in_col || 0;
    col.desks_in_col = newDeskIdx + 1;
    col.seats.push(
      { desk: newDeskIdx, position: 0, student_id: null, student_name: null },
      { desk: newDeskIdx, position: 1, student_id: null, student_name: null }
    );
    setSeatingGrid(newGrid);
  };

  const handleRemoveDeskFromCol = (colIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const col = newGrid[colIdx];
    if (!col || (col.desks_in_col || 1) <= 1) return;
    col.desks_in_col -= 1;
    col.seats.pop();
    col.seats.pop();
    setSeatingGrid(newGrid);
  };

  const handleSaveSeating = async () => {
    if (!selectedClass) return;
    try {
      await api.saveClassSeating(selectedClass.id, desksPerCol, JSON.stringify(seatingGrid));
      showToast('Đã lưu sơ đồ lớp học thành công!', 'success');
    } catch (err: any) {
      showToast('Không thể lưu sơ đồ: ' + err.message, 'error');
    }
  };

  const handleClearSeat = (colIdx: number, deskIdx: number, posIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const seatIndex = deskIdx * 2 + posIdx;
    const seat = newGrid[colIdx]?.seats[seatIndex];
    if (seat) {
      seat.student_id = null;
      seat.student_name = null;
      setSeatingGrid(newGrid);
    }
  };

  const handleDropOnSeat = (targetColIdx: number, targetDeskIdx: number, targetPosIdx: number) => {
    const newGrid = JSON.parse(JSON.stringify(seatingGrid));
    const targetSeatIndex = targetDeskIdx * 2 + targetPosIdx;
    const targetSeat = newGrid[targetColIdx].seats[targetSeatIndex];

    if (draggedUnassigned) {
      targetSeat.student_id = draggedUnassigned.id;
      targetSeat.student_name = draggedUnassigned.full_name;
      setSeatingGrid(newGrid);
      setDraggedUnassigned(null);
      return;
    }

    if (draggedSeat) {
      const sourceSeatIndex = draggedSeat.deskIdx * 2 + draggedSeat.posIdx;
      const sourceSeat = newGrid[draggedSeat.colIdx].seats[sourceSeatIndex];

      const tempId = targetSeat.student_id;
      const tempName = targetSeat.student_name;

      targetSeat.student_id = sourceSeat.student_id;
      targetSeat.student_name = sourceSeat.student_name;

      sourceSeat.student_id = tempId;
      sourceSeat.student_name = tempName;

      setSeatingGrid(newGrid);
      setDraggedSeat(null);
    }
  };

  const handleAutoMixSeating = async () => {
    if (!selectedClass) return;
    try {
      const colsConfig = seatingGrid.map((col) => ({
        col_index: col.col_index,
        desks_in_col: col.desks_in_col || desksPerCol,
      }));
      const res = await api.mixClassSeating(selectedClass.id, numCols, desksPerCol, colsConfig, attendanceDate);
      if (res.layout) {
        setSeatingGrid(res.layout);
        showToast('Đã trộn ngẫu nhiên sơ đồ lớp!', 'success');
      }
    } catch (err: any) {
      showToast('Trộn thất bại: ' + err.message, 'error');
    }
  };

  const handleGeneticMixSeating = async () => {
    if (!selectedClass) return;
    setMixingGA(true);
    try {
      const colsConfig = seatingGrid.map((col) => ({
        col_index: col.col_index,
        desks_in_col: col.desks_in_col || desksPerCol,
      }));
      const res = await api.geneticMixSeating(selectedClass.id, {
        num_cols: numCols,
        desks_per_col: desksPerCol,
        cols_config: colsConfig,
        date: attendanceDate,
      });
      if (res.layout) {
        setSeatingGrid(res.layout);
        showToast('Đã tối ưu sơ đồ lớp bằng Genetic Algorithm!', 'success');
      }
    } catch (err: any) {
      showToast('Trộn thông minh thất bại: ' + err.message, 'error');
    } finally {
      setMixingGA(false);
    }
  };

  const handleBlossomSwap = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.blossomSwapPairs(selectedClass.id, { date: attendanceDate });
      setBlossomPairs(res.pairs || []);
      setBlossomUnmatched(res.unmatched || []);
      setBlossomModalOpen(true);
    } catch (err: any) {
      showToast('Ghép cặp Blossom thất bại: ' + err.message, 'error');
    }
  };

  return {
    numCols,
    desksPerCol,
    seatingGrid,
    draggedSeat,
    setDraggedSeat,
    draggedUnassigned,
    setDraggedUnassigned,
    absentStudentIds,
    unassignedStudents,
    showUnassignedPanel,
    setShowUnassignedPanel,
    blossomModalOpen,
    setBlossomModalOpen,
    blossomPairs,
    blossomUnmatched,
    mixingGA,
    gradingPairsModal,
    setGradingPairsModal,
    gradingPairs,
    handleAddColumn,
    handleRemoveColumn,
    handleAddDeskToCol,
    handleRemoveDeskFromCol,
    handleSaveSeating,
    handleClearSeat,
    handleDropOnSeat,
    handleAutoMixSeating,
    handleGeneticMixSeating,
    handleBlossomSwap,
  };
}
