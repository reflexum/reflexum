export interface ReportData {
  totalMinutes: number;
  perCourse: Record<string, number>;
  perDay: Record<string, number>;
  topTopics: { topic: string; count: number }[];
  topKeywords: { word: string; count: number }[];
  assignments: {
    total: number;
    done: number;
    overdue: number;
    open: number;
    byCourse: Record<string, { open: number; done: number; overdue: number; progressAvg: number }>;
  };
  tasks: { total: number; done: number; open: number };
  gaps: string[];
  periodLabel: string;
}

export interface StudyAggregates {
  sessions: import('./StudySession').StudySession[];
  assignments: import('./Assignment').Assignment[];
}
