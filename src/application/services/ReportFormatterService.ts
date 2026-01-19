import type { ReportData } from '../../domain/entities/Report';

export type Lang = "ru" | "en";

export const DEFAULT_LANG: Lang = "ru";

export function normalizeLang(v?: string): Lang {
  return v === "en" ? "en" : "ru";
}

export const t = {
  ru: {
    reportTitle: "Reflexum — аналитический отчёт",
    totalTime: "Суммарное время",
    byProjects: "По проектам/областям",
    noData: "_Нет данных_",
    day: "День",
    minutes: "Минуты",
    topTopics: "Топ тем/тегов",
    keywords: "Ключевые слова",
    tasks: "Задачи",
    insights: "Инсайты",
    selfCheckQuestions: "Вопросы для самоконтроля",
    gaps: "Пробелы внимания",
    pieProjectsTitle: "Время по проектам/областям (мин)",
    noteDeadline: "Дедлайн заметки",
    date: "Дата",
    d_title: "Reflexum",
    d_total: "Суммарное время",
    d_byProjects: "По проектам/областям",
    d_topTopics: "Топ тем/тегов",
    d_keywords: "Ключевые слова",
    d_insights: "Инсайты",
    d_deadlines: "Ближайшие дедлайны",
    d_noteDeadline: "Дедлайн заметки"
  },
  en: {
    reportTitle: "Reflexum — analytical report",
    totalTime: "Total time",
    byProjects: "By projects/areas",
    noData: "_No data_",
    day: "Day",
    minutes: "Minutes",
    topTopics: "Top topics/tags",
    keywords: "Keywords",
    tasks: "Tasks",
    insights: "Insights",
    selfCheckQuestions: "Self-check questions",
    gaps: "Attention gaps",
    pieProjectsTitle: "Time by projects/areas (min)",
    noteDeadline: "Note deadline",
    date: "Date",
    d_title: "Reflexum",
    d_total: "Total time",
    d_byProjects: "By projects/areas",
    d_topTopics: "Top topics/tags",
    d_keywords: "Keywords",
    d_insights: "Insights",
    d_deadlines: "Upcoming deadlines",
    d_noteDeadline: "Note deadline"
  }
} as const;

export function mm(mins: number, lang: Lang): string {
  const safe = Number.isFinite(mins) ? Math.max(0, Math.round(mins)) : 0;
  const h = Math.floor(safe / 60);
  const m = safe % 60;

  if (lang === "en") {
    if (h <= 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  } else {
    if (h <= 0) return `${m} мин`;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  }
}

/* ---------------- Mermaid helpers ---------------- */

function safeMermaidLabel(s: string): string {
  return String(s ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/"/g, "'")
    .replace(/:/g, "·")
    .trim()
    .slice(0, 60);
}

function mermaidPie(title: string, items: [string, number][], lang: Lang): string {
  const entries = items
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .map(([k, v]) => [safeMermaidLabel(k), Math.round(v)] as [string, number]);

  if (!entries.length) return lang === "en" ? "_No data_" : "_Нет данных_";

  const lines = entries.map(([c, v]) => `  "${c}" : ${v}`).join("\n");
  return ["```mermaid", "pie showData", `  title "${safeMermaidLabel(title)}"`, lines, "```"].join("\n");
}

function mermaidBarDaily(perDay: Record<string, number>, lang: Lang): string {
  const keys = Object.keys(perDay)
    .filter((k) => k && k !== "—")
    .sort();

  if (!keys.length) return lang === "en" ? "_No data_" : "_Нет данных_";

  const vals = keys.map((k) => Math.max(0, Math.round(perDay[k] ?? 0)));

  const MAX = 14;
  const k2 = keys.length > MAX ? keys.slice(keys.length - MAX) : keys;
  const v2 = keys.length > MAX ? vals.slice(vals.length - MAX) : vals;

  const maxV = v2.reduce((a, b) => Math.max(a, b), 0);
  const top = Math.max(10, Math.ceil(maxV / 10) * 10);

  const title = lang === "en" ? "Daily activity (min)" : "Активность по дням (мин)";
  const yAxis = lang === "en" ? "Minutes" : "Минуты";
  const xLabels = k2.map((k) => `"${safeMermaidLabel(k)}"`).join(", ");

  return [
    "```mermaid",
    "xychart-beta",
    `  title "${safeMermaidLabel(title)}"`,
    `  x-axis [${xLabels}]`,
    `  y-axis "${safeMermaidLabel(yAxis)}" 0 --> ${top}`,
    `  bar [${v2.join(", ")}]`,
    "```",
  ].join("\n");
}

function mermaidPiePerCourse(perCourse: Record<string, number>, lang: Lang): string {
  const title = lang === "en" ? t.en.pieProjectsTitle : t.ru.pieProjectsTitle;
  const items = Object.entries(perCourse).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const TOP = 8;
  const top = items.slice(0, TOP);
  const rest = items.slice(TOP);
  const otherSum = rest.reduce((acc, x) => acc + (Number(x[1]) || 0), 0);
  const finalItems = otherSum > 0 ? [...top, [lang === "en" ? "Other" : "Другое", otherSum]] : top;
  return mermaidPie(title, finalItems as any, lang);
}

function mermaidPieTopTopics(topics: { topic: string; count: number }[], lang: Lang): string {
  const title = lang === "en" ? t.en.topTopics : t.ru.topTopics;
  const items = topics
    .slice()
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 10)
    .map((x) => [x.topic, x.count] as [string, number]);
  return mermaidPie(title, items, lang);
}

function mermaidPieKeywords(keywords: { word: string; count: number }[], lang: Lang): string {
  const title = lang === "en" ? t.en.keywords : t.ru.keywords;
  const items = keywords
    .slice()
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 12)
    .map((x) => [x.word, x.count] as [string, number]);
  return mermaidPie(title, items, lang);
}

/* ---------------- Markdown helpers ---------------- */

function escapeMdCell(s: any): string {
  return String(s ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

function fmtDue(due: string, lang: Lang): string {
  const raw = String(due ?? "").trim();
  if (!raw) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    return lang === "en" ? `${year}-${month}-${day}` : `${day}.${month}.${year}`;
  }

  return raw;
}

function pickNoteLabelForPeriod(data: ReportData, lang: Lang, isSingle: boolean): string {
  const hasAny =
    (data.totalMinutes ?? 0) > 0 ||
    Object.keys(data.perCourse ?? {}).length > 0 ||
    Object.keys(data.perDay ?? {}).length > 0 ||
    (data.topTopics?.length ?? 0) > 0 ||
    (data.topKeywords?.length ?? 0) > 0 ||
    (data.tasks?.total ?? 0) > 0 ||
    (data.assignments?.total ?? 0) > 0;

  if (hasAny) return "";

  return lang === "en"
    ? isSingle
      ? "_No measurable data in this note. Add frontmatter `duration:` (minutes) or checklists/tags/topics._"
      : "_No data for selected notes. Add `duration:` in minutes or ensure notes contain tags/topics/checklists._"
    : isSingle
      ? "_В этой заметке нет измеримых данных. Добавь frontmatter `duration:` (в минутах) или чек-листы/теги/темы._"
      : "_Нет данных по выбранным заметкам. Добавь `duration:` в минутах или проверь теги/темы/чек-листы._";
}

/* ---------------- Markdown report ---------------- */

export class ReportFormatterService {
  renderMarkdown(
    data: ReportData,
    insights: string,
    quiz: string,
    opts?: { singleNote?: boolean; deadline?: string; lang?: string; noteTitle?: string; notePath?: string }
  ): string {
    const lang = normalizeLang(opts?.lang) ?? DEFAULT_LANG;
    const L = lang === "en" ? t.en : t.ru;

    const lines: string[] = [];
    const isSingle = !!opts?.singleNote;

    lines.push(`# ${L.reportTitle}`);

    if (isSingle) {
      if (opts?.noteTitle) lines.push(`_${lang === "en" ? "Note" : "Заметка"}: ${opts.noteTitle}_`);
      else if (opts?.notePath) lines.push(`_${lang === "en" ? "Note" : "Заметка"}: ${opts.notePath}_`);
    } else if (data.periodLabel) {
      lines.push(`_${data.periodLabel}_`);
    }
    lines.push("");

    const emptyHint = pickNoteLabelForPeriod(data, lang, isSingle);
    if (emptyHint) {
      lines.push(emptyHint);
      lines.push("");
    }

    // Summary
    lines.push(`**${L.totalTime}:** ${mm(data.totalMinutes ?? 0, lang)}`);

    if (data.topTopics?.length) {
      const topicsLine = data.topTopics.slice(0, 10).map((tt) => `${tt.topic} (${tt.count})`).join(", ");
      lines.push(`**${L.topTopics}:** ${topicsLine}`);
    }

    if (data.tasks) {
      lines.push(
        lang === "en"
          ? `**${L.tasks}:** ${data.tasks.done}/${data.tasks.total} done (open: ${data.tasks.open})`
          : `**${L.tasks}:** выполнено ${data.tasks.done}/${data.tasks.total} (открыто: ${data.tasks.open})`
      );
    }

    lines.push("");

    // Deadline for single note
    if (isSingle) {
      const due = opts?.deadline ? fmtDue(opts.deadline, lang) : undefined;
      if (due) {
        lines.push(`## ${L.noteDeadline}`);
        lines.push(`${L.date}: **${due}**`);
        lines.push("");
      }
    }

    // By projects/courses
    lines.push(`## 📊 ${L.byProjects}`);
    const pcs = Object.entries(data.perCourse ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    if (!pcs.length) {
      lines.push(L.noData);
    } else {
      for (const [c, v] of pcs) {
        lines.push(`- ${c}: ${Math.round(v)} ${lang === "en" ? "min" : "мин"}`);
      }
      lines.push("");
      lines.push(mermaidPiePerCourse(data.perCourse ?? {}, lang));
    }
    lines.push("");

    // Daily dynamics
    if (!isSingle && Object.keys(data.perDay ?? {}).length) {
      lines.push(lang === "en" ? "## 📈 Daily dynamics" : "## 📈 Динамика по дням");
      lines.push("");
      lines.push(mermaidBarDaily(data.perDay ?? {}, lang));
      lines.push("");

      lines.push(`| ${L.day} | ${L.minutes} |`);
      lines.push("|---|---:|");
      for (const d of Object.keys(data.perDay ?? {}).sort()) {
        lines.push(`| ${escapeMdCell(d)} | ${Math.round((data.perDay as any)[d] ?? 0)} |`);
      }
      lines.push("");
    }

    // Topics
    if (data.topTopics?.length) {
      lines.push(`## 🔥 ${L.topTopics}`);
      lines.push("");
      lines.push(mermaidPieTopTopics(data.topTopics, lang));
      lines.push("");
    }

    // Keywords
    if (data.topKeywords?.length) {
      lines.push(`## 🔎 ${L.keywords}`);
      lines.push("");
      const list = data.topKeywords.slice(0, 20).map((k) => `${k.word} (${k.count})`).join(", ");
      lines.push(list);
      lines.push("");
      lines.push(mermaidPieKeywords(data.topKeywords, lang));
      lines.push("");
    }

    // Assignments summary
    if (data.assignments && (data.assignments.total > 0 || Object.keys(data.assignments.byCourse ?? {}).length > 0)) {
      lines.push(lang === "en" ? "## ⏰ Deadlines" : "## ⏰ Дедлайны");
      lines.push(
        lang === "en"
          ? `Total: **${data.assignments.total}**, open: **${data.assignments.open}**, done: **${data.assignments.done}**, overdue: **${data.assignments.overdue}**`
          : `Всего: **${data.assignments.total}**, открыто: **${data.assignments.open}**, сделано: **${data.assignments.done}**, просрочено: **${data.assignments.overdue}**`
      );
      lines.push("");

      lines.push(
        `| ${lang === "en" ? "Course" : "Курс"} | ${lang === "en" ? "Open" : "Открыто"} | ${lang === "en" ? "Done" : "Сделано"} | ${lang === "en" ? "Overdue" : "Просрочено"} | ${lang === "en" ? "Avg progress" : "Средн. прогресс"} |`
      );
      lines.push("|---|---:|---:|---:|---:|");
      const rows = Object.entries(data.assignments.byCourse ?? {}).sort((a, b) => (b[1].open ?? 0) - (a[1].open ?? 0));
      for (const [course, meta] of rows) {
        lines.push(
          `| ${escapeMdCell(course)} | ${meta.open} | ${meta.done} | ${meta.overdue} | ${escapeMdCell(meta.progressAvg)}% |`
        );
      }
      lines.push("");
    }

    // Insights
    if (insights?.trim()) {
      lines.push(`## 💡 ${L.insights}`);
      lines.push(insights.trim());
      lines.push("");
    }

    // Self-check questions instead of quiz
    if (quiz?.trim()) {
      lines.push(`## ✅ ${L.selfCheckQuestions}`);
      lines.push(quiz.trim());
      lines.push("");
    }

    // Gaps
    if (data.gaps?.length) {
      lines.push(`## ${L.gaps}`);
      lines.push(data.gaps.join(", "));
      lines.push("");
    }

    return lines.join("\n");
  }

  generateReportPath(from: number, to: number, unique: boolean = false): string {
    const formatDate = (ts: number) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };

    const f = formatDate(from);
    const t = formatDate(to);

    if (unique) {
      const now = new Date();
      const stamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
      return `Reflexum/Reports/${f}_${t}__${stamp}.md`;
    }

    return `Reflexum/Reports/${f}_${t}.md`;
  }
}
