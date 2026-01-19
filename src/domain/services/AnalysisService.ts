import type { StudyAggregates, ReportData } from '../entities/Report';

function estimateMinutes(words: number): number {
  return Math.max(1, Math.round(words / 180));
}

function dateOnly(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export class AnalysisService {
  analyze(agg: StudyAggregates): ReportData {
    const perCourse: Record<string, number> = {};
    const perDay: Record<string, number> = {};
    const topicCount: Record<string, number> = {};
    const keywordCount: Record<string, number> = {};
    let tasksTotal = 0, tasksDone = 0;

    for (const s of agg.sessions) {
      const minutes = s.durationMin ?? estimateMinutes(s.words);
      const course = s.course ?? "—";
      perCourse[course] = (perCourse[course] ?? 0) + minutes;

      const day = dateOnly(s.date) ?? "—";
      perDay[day] = (perDay[day] ?? 0) + minutes;

      for (const t of s.topics) {
        topicCount[t] = (topicCount[t] ?? 0) + 1;
      }

      const stripped = (s.body ?? "").replace(/[#\-*_\[\]()]/g, " ");
      const words = stripped.match(/[\p{L}\p{N}_'-]{3,}/gu) ?? [];
      const stopWords = new Set(["the", "and", "for", "that", "this", "with", "как", "для", "что", "это", "так"]);
      for (const w of words) {
        const low = w.toLowerCase();
        if (!stopWords.has(low)) {
          keywordCount[low] = (keywordCount[low] ?? 0) + 1;
        }
      }

      tasksTotal += s.checklist.total;
      tasksDone += s.checklist.done;
    }

    const topTopics = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    const byCourse: Record<string, { open: number; done: number; overdue: number; progressAvg: number }> = {};
    let totalAssignments = 0, doneAssignments = 0, overdueAssignments = 0;

    for (const a of agg.assignments) {
      totalAssignments++;
      const c = a.course ?? "—";
      if (!byCourse[c]) byCourse[c] = { open: 0, done: 0, overdue: 0, progressAvg: 0 };

      if (a.progress >= 100) {
        doneAssignments++;
        byCourse[c].done++;
      } else {
        if (a.due) {
          const dueTime = new Date(a.due).getTime();
          if (dueTime < Date.now()) {
            overdueAssignments++;
            byCourse[c].overdue++;
          } else {
            byCourse[c].open++;
          }
        } else {
          byCourse[c].open++;
        }
      }
    }

    for (const c in byCourse) {
      const assignments = agg.assignments.filter(a => (a.course ?? "—") === c);
      const sum = assignments.reduce((s, a) => s + a.progress, 0);
      byCourse[c].progressAvg = assignments.length ? Math.round(sum / assignments.length) : 0;
    }

    const gaps: string[] = [];
    for (const [course, stats] of Object.entries(byCourse)) {
      if ((stats.open > 0 || stats.overdue > 0) && (perCourse[course] ?? 0) === 0) {
        gaps.push(course);
      }
    }

    return {
      totalMinutes: Object.values(perCourse).reduce((s, v) => s + v, 0),
      perCourse,
      perDay,
      topTopics,
      topKeywords,
      assignments: {
        total: totalAssignments,
        done: doneAssignments,
        overdue: overdueAssignments,
        open: totalAssignments - doneAssignments - overdueAssignments,
        byCourse,
      },
      tasks: { total: tasksTotal, done: tasksDone, open: tasksTotal - tasksDone },
      gaps,
      periodLabel: "",
    };
  }
}
