import { ClassSession, parseTimeToMinutes } from '../types';

export interface DayColumnData {
  header: string; // e.g. "Thứ 2"
  dateStr: string; // "YYYY-MM-DD"
  subText: string; // "12/10"
  isToday: boolean;
  isWeekend: boolean;
}

export interface VerticalSessionLayout {
  session: ClassSession;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

/**
 * Computes multi-lane layout for overlapping sessions within a single vertical day column.
 * Handles concurrent classes by dividing column width proportionally.
 */
export function computeVerticalDayLayouts(
  daySessions: ClassSession[],
  startHour: number,
  hourHeight: number
): VerticalSessionLayout[] {
  if (!daySessions || daySessions.length === 0) return [];

  const baseMin = startHour * 60;
  const items = daySessions.map((s) => {
    const sMin = parseTimeToMinutes(s.start_time);
    const dur = s.duration || 90;
    const eMin = sMin + dur;
    return {
      session: s,
      startMin: sMin,
      endMin: eMin,
      duration: dur,
    };
  }).sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  // Group into overlapping clusters
  const clusters: Array<typeof items> = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else if (item.startMin < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: VerticalSessionLayout[] = [];

  for (const cluster of clusters) {
    // Assign lanes within this cluster
    const lanes: number[] = [];
    const clusterLayouts: Array<{ item: (typeof items)[0]; lane: number }> = [];

    for (const item of cluster) {
      let placedLane = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= item.startMin) {
          placedLane = i;
          lanes[i] = item.endMin;
          break;
        }
      }
      if (placedLane === -1) {
        placedLane = lanes.length;
        lanes.push(item.endMin);
      }
      clusterLayouts.push({ item, lane: placedLane });
    }

    const totalLanes = Math.max(1, lanes.length);
    const widthPct = 100 / totalLanes;

    for (const { item, lane } of clusterLayouts) {
      const top = Math.max(0, ((item.startMin - baseMin) / 60) * hourHeight);
      const height = Math.max(38, (item.duration / 60) * hourHeight - 3);
      results.push({
        session: item.session,
        top,
        height,
        leftPct: lane * widthPct,
        widthPct,
      });
    }
  }

  return results;
}
