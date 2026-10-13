import { DbQuestion } from '../../../types';
import { parseUnits } from '../constants';

export interface CreateTestConfig {
  source: 'selected' | 'bank';
  grade: string;
  unit: string;
  respectDifficulty: boolean;
  targetDifficulty: string;
  useTypeDistribution: boolean;
  useDifficultyDistribution: boolean;
  difficultyPctNhanBiet: number;
  difficultyPctThongHieu: number;
  difficultyPctVanDung: number;
  totalCount: number;
  typeCounts: Record<string, number>;
  numVersions: number;
  typeOrder: string[];
  includedTypes: string[];
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleQuestion(q: DbQuestion): DbQuestion {
  if (!q.o || q.o.length <= 1 || !q.a) return q;
  const correctLetter = q.a.trim().toUpperCase();
  const correctIndex = correctLetter.charCodeAt(0) - 65;
  if (correctIndex < 0 || correctIndex >= q.o.length) return q;

  const correctText = q.o[correctIndex];
  const shuffledOptions = shuffleArray(q.o);
  const newCorrectIndex = shuffledOptions.indexOf(correctText);
  if (newCorrectIndex === -1) return q;
  const newAnswerLetter = String.fromCharCode(65 + newCorrectIndex);

  return {
    ...q,
    o: shuffledOptions,
    a: newAnswerLetter,
  };
}

function getCategory(level: string): 'NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG' {
  if (!level) return 'VẬN DỤNG';
  const norm = level.toUpperCase().trim();
  if (norm === 'NHẬN BIẾT') return 'NHẬN BIẾT';
  if (norm === 'THÔNG HIỂU') return 'THÔNG HIỂU';
  return 'VẬN DỤNG';
}

export function buildTestQuestionPool(
  config: CreateTestConfig,
  questions: DbQuestion[],
  selectedIds: number[],
): { selectedPool: DbQuestion[]; warning?: string } {
  if (config.source !== 'selected' && config.useDifficultyDistribution) {
    const totalPct = config.difficultyPctNhanBiet + config.difficultyPctThongHieu + config.difficultyPctVanDung;
    if (totalPct !== 100) {
      throw new Error('Tổng tỷ lệ độ khó phải bằng 100%!');
    }
  }

  if (config.source === 'selected') {
    if (selectedIds.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một câu hỏi!');
    }
    return { selectedPool: questions.filter((q) => selectedIds.includes(q.id)) };
  }

  const targetUnits = parseUnits(config.unit);
  const unitsToProcess = targetUnits.length > 0 ? targetUnits : [''];
  const selectedPool: DbQuestion[] = [];

  for (const unitVal of unitsToProcess) {
    const pool = questions.filter((q) => {
      if (config.grade && String(q.grade).trim() !== String(config.grade).trim()) return false;
      if (unitVal && String(q.unit).trim() !== String(unitVal).trim()) return false;
      if (!config.useDifficultyDistribution && config.respectDifficulty && q.level !== config.targetDifficulty) {
        return false;
      }
      return true;
    });

    if (pool.length === 0) continue;

    const typeTargets: Record<string, number> = {};
    const uniqueTypesInPool = Array.from(new Set(pool.map((q) => q.t))).filter(Boolean);
    uniqueTypesInPool.forEach((t) => { typeTargets[t] = 0; });

    if (config.useTypeDistribution) {
      config.typeOrder.forEach((t) => {
        if (config.includedTypes.includes(t)) {
          typeTargets[t] = config.typeCounts[t] || 0;
        } else {
          typeTargets[t] = 0;
        }
      });
    } else {
      const typeAvailable: Record<string, number> = {};
      uniqueTypesInPool.forEach((t) => {
        typeAvailable[t] = pool.filter((q) => q.t === t).length;
      });

      const limits: Record<string, number> = {};
      uniqueTypesInPool.forEach((t) => {
        limits[t] = Math.floor(typeAvailable[t] / config.numVersions);
      });

      let activeTypes = uniqueTypesInPool.filter((t) => limits[t] > 0);
      let remainingToAllocate = config.totalCount;

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
          if (typeTargets[t] < limits[t]) nextActiveTypes.push(t);
        }
        remainingToAllocate -= allocatedThisRound;
        if (allocatedThisRound === 0) break;
        activeTypes = nextActiveTypes;
      }
    }

    const selectedSet: DbQuestion[] = [];
    const unselectedSet: Record<string, DbQuestion[]> = {};

    uniqueTypesInPool.forEach((t) => {
      const targetCount = (typeTargets[t] || 0) * config.numVersions;
      const ofType = pool.filter((q) => q.t === t);
      ofType.sort((a, b) => {
        const freqA = parseInt(a.frequency || '0') || 0;
        const freqB = parseInt(b.frequency || '0') || 0;
        if (freqA !== freqB) return freqA - freqB;
        return Math.random() - 0.5;
      });

      selectedSet.push(...ofType.slice(0, targetCount));
      unselectedSet[t] = ofType.slice(targetCount);
    });

    if (config.useDifficultyDistribution && selectedSet.length > 0) {
      const totalSelectedCount = selectedSet.length;
      const targetNB = Math.round(totalSelectedCount * config.difficultyPctNhanBiet / 100);
      const targetTH = Math.round(totalSelectedCount * config.difficultyPctThongHieu / 100);
      const targetVD = totalSelectedCount - targetNB - targetTH;
      const targets = { 'NHẬN BIẾT': targetNB, 'THÔNG HIỂU': targetTH, 'VẬN DỤNG': targetVD };

      let maxIterations = totalSelectedCount * 2;
      while (maxIterations > 0) {
        maxIterations--;
        const currentCounts = { 'NHẬN BIẾT': 0, 'THÔNG HIỂU': 0, 'VẬN DỤNG': 0 };
        selectedSet.forEach((q) => { currentCounts[getCategory(q.level)]++; });

        const over: ('NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG')[] = [];
        const under: ('NHẬN BIẾT' | 'THÔNG HIỂU' | 'VẬN DỤNG')[] = [];
        (['NHẬN BIẾT', 'THÔNG HIỂU', 'VẬN DỤNG'] as const).forEach((cat) => {
          if (currentCounts[cat] > targets[cat]) over.push(cat);
          if (currentCounts[cat] < targets[cat]) under.push(cat);
        });

        if (over.length === 0 || under.length === 0) break;

        let bestSwap: any = null;
        for (const fromCat of over) {
          for (const toCat of under) {
            uniqueTypesInPool.forEach((t) => {
              const unselCandidates = unselectedSet[t] || [];
              selectedSet.forEach((qSel, selIdx) => {
                if (qSel.t !== t || getCategory(qSel.level) !== fromCat) return;
                unselCandidates.forEach((qUnsel, unselIdx) => {
                  if (getCategory(qUnsel.level) !== toCat) return;
                  const cost = (parseInt(qUnsel.frequency || '0') || 0) - (parseInt(qSel.frequency || '0') || 0);
                  if (bestSwap === null || cost < bestSwap.cost) {
                    bestSwap = { type: t, selIdx, unselIdx, cost, fromCat, toCat };
                  }
                });
              });
            });
          }
        }

        if (!bestSwap) break;
        const { type, selIdx, unselIdx } = bestSwap;
        const qSel = selectedSet[selIdx];
        const qUnsel = unselectedSet[type][unselIdx];
        selectedSet[selIdx] = qUnsel;
        unselectedSet[type][unselIdx] = qSel;
      }
    }

    selectedPool.push(...selectedSet);
  }

  return { selectedPool };
}
