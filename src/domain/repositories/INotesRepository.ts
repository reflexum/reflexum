import type { StudySession } from '../entities/StudySession';
import type { Assignment } from '../entities/Assignment';

export interface INotesRepository {
  getMarkdownFiles(): Promise<{ path: string; mtime: number }[]>;
  readNote(path: string): Promise<string>;
  parseNoteToSession(path: string, content: string, includeCourses: string[]): Promise<StudySession | null>;
  parseNoteToAssignment(path: string, content: string): Promise<Assignment | null>;
}
