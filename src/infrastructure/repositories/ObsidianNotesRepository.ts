import { App, TFile, parseYaml } from "obsidian";
import type { INotesRepository } from "../../domain/repositories/INotesRepository";
import type { StudySession } from "../../domain/entities/StudySession";
import type { Assignment } from "../../domain/entities/Assignment";

function shouldSkipPath(path: string): boolean {
  if (path.startsWith("Reflexum/Reports")) return true;
  if (path.includes("/.obsidian/")) return true;
  if (path.toLowerCase().includes("/templates/")) return true;
  return false;
}

function stripFrontmatter(s: string) {
  return s.replace(/^---[\s\S]*?---/, "").trim();
}

function countWords(body: string) {
  return (body.match(/[\p{L}\p{N}_'-]+/gu) ?? []).length;
}

function countChecklist(body: string) {
  const total = (body.match(/^\s*[-*]\s\[( |x|X)\]/gm) ?? []).length;
  const done = (body.match(/^\s*[-*]\s\[(x|X)\]/gm) ?? []).length;
  return { done, total };
}

function extractTags(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(/(^|\s)#([A-Za-z0-9/_-]+)/g)) out.add(m[2]);
  return Array.from(out);
}

function inferCourse(fm: any, tags: string[], filePath: string): string | undefined {
  if (fm?.project) return String(fm.project);
  const pTag = tags.find(t => t.startsWith("project/"));
  if (pTag) return pTag.replace(/^project\//, "");

  if (fm?.course) return String(fm.course);
  const cTag = tags.find(t => t.startsWith("course/"));
  if (cTag) return cTag.replace(/^course\//, "");

  const parts = filePath.split("/");
  if (parts.length >= 2) return parts[parts.length - 2];
  return undefined;
}

export class ObsidianNotesRepository implements INotesRepository {
  constructor(private app: App) {}

  async getMarkdownFiles(): Promise<{ path: string; mtime: number }[]> {
    return this.app.vault.getMarkdownFiles()
      .filter(f => !shouldSkipPath(f.path))
      .map(f => ({ path: f.path, mtime: f.stat.mtime }));
  }

  async readNote(path: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) throw new Error(`Not a file: ${path}`);
    return await this.app.vault.read(file);
  }

  async parseNoteToSession(path: string, content: string, includeCourses: string[]): Promise<StudySession | null> {
    const fmMatch = /^---\n([\s\S]*?)\n---/m.exec(content);
    let fm: any = null;
    if (fmMatch) {
      try { fm = parseYaml(fmMatch[1]); } catch { fm = null; }
    }

    const body = stripFrontmatter(content);
    const words = countWords(body);
    const checklist = countChecklist(body);
    const tags = extractTags(body);
    const course = inferCourse(fm, tags, path);
    const type = (fm?.type ?? "").toString().trim();

    if (includeCourses.length > 0 && course && !includeCourses.includes(course)) return null;
    if (type === "assignment") return null;

    const topicsFm = Array.isArray(fm?.topics) ? fm.topics.map((x: any) => String(x)) : [];
    const topics = Array.from(new Set([...topicsFm, ...tags.filter(t => !t.startsWith("course/"))]));
    const durationMin = typeof fm?.duration === "number" ? fm.duration : undefined;

    return {
      file: path,
      date: fm?.date ? String(fm.date) : undefined,
      course,
      topics,
      durationMin,
      words,
      checklist,
      body,
    };
  }

  async parseNoteToAssignment(path: string, content: string): Promise<Assignment | null> {
    const fmMatch = /^---\n([\s\S]*?)\n---/m.exec(content);
    let fm: any = null;
    if (fmMatch) {
      try { fm = parseYaml(fmMatch[1]); } catch { fm = null; }
    }

    const body = stripFrontmatter(content);
    const checklist = countChecklist(body);
    const tags = extractTags(body);
    const course = inferCourse(fm, tags, path);
    const type = (fm?.type ?? "").toString().trim();

    if (type === "assignment") {
      const prog = checklist.total > 0
        ? Math.round(100 * checklist.done / checklist.total)
        : (fm?.status === "done" ? 100 : 0);
      return {
        file: path,
        course,
        title: fm?.title ? String(fm.title) : undefined,
        due: fm?.due ? String(fm.due) : undefined,
        status: fm?.status ? String(fm.status) : undefined,
        progress: prog,
      };
    }

    if (fm?.due) {
      const prog = checklist.total > 0 ? Math.round(100 * checklist.done / checklist.total) : 0;
      return {
        file: path,
        course,
        title: fm?.title ? String(fm.title) : undefined,
        due: String(fm.due),
        status: fm?.status ? String(fm.status) : undefined,
        progress: prog,
      };
    }

    return null;
  }
}
