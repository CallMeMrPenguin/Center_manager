import { useState, useEffect } from 'react';
import { api } from '../../../api';

export function useUpcomingClassSessions(classId: number, assignedDate: string) {
  const [upcomingSessions, setUpcomingSessions] = useState<{ date: string; label: string }[]>([]);

  useEffect(() => {
    if (!classId) {
      setUpcomingSessions([]);
      return;
    }
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        const sessions = await api.getClassSessions(classId);
        if (!isMounted) return;
        const baseDate = assignedDate || new Date().toISOString().slice(0, 10);
        const futureSessions = (sessions || [])
          .filter((s: any) => s.date && s.date >= baseDate)
          .sort((a: any, b: any) => a.date.localeCompare(b.date));

        const presets: { date: string; label: string }[] = [];
        if (futureSessions.length > 0) {
          const s1 = futureSessions[0];
          const d1 = new Date(s1.date);
          const dayName1 = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d1.getDay()];
          const dateFmt1 = `${String(d1.getDate()).padStart(2, '0')}/${String(d1.getMonth() + 1).padStart(2, '0')}`;
          presets.push({
            date: s1.date,
            label: `Buổi tới (${dayName1}, ${dateFmt1})`,
          });

          if (futureSessions.length > 1) {
            const s2 = futureSessions[1];
            const d2 = new Date(s2.date);
            const dayName2 = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d2.getDay()];
            const dateFmt2 = `${String(d2.getDate()).padStart(2, '0')}/${String(d2.getMonth() + 1).padStart(2, '0')}`;
            presets.push({
              date: s2.date,
              label: `Sau 2 buổi (${dayName2}, ${dateFmt2})`,
            });
          }
        }

        const dNextWeek = new Date(new Date(baseDate).getTime() + 7 * 86400000);
        const nwDateStr = dNextWeek.toISOString().slice(0, 10);
        const nwFmt = `${String(dNextWeek.getDate()).padStart(2, '0')}/${String(dNextWeek.getMonth() + 1).padStart(2, '0')}`;
        presets.push({
          date: nwDateStr,
          label: `+1 tuần (${nwFmt})`,
        });

        setUpcomingSessions(presets);
      } catch {
        const baseDate = assignedDate || new Date().toISOString().slice(0, 10);
        const dNextWeek = new Date(new Date(baseDate).getTime() + 7 * 86400000);
        setUpcomingSessions([{ date: dNextWeek.toISOString().slice(0, 10), label: '+1 tuần' }]);
      }
    };

    fetchSessions();
    return () => {
      isMounted = false;
    };
  }, [classId, assignedDate]);

  return upcomingSessions;
}
