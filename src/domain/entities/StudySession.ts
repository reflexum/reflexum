export interface StudySession {
  file: string;
  date?: string;
  course?: string;
  topics: string[];
  durationMin?: number;
  words: number;
  checklist: { done: number; total: number };
  body?: string;
}
