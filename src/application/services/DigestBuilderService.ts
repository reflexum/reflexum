import type { ReportData } from '../../domain/entities/Report';
import { t, mm, normalizeLang, type Lang } from './ReportFormatterService';

export interface DeadlineItem {
  course?: string;
  title?: string;
  due?: string;
  progress: number;
}

function asciiBar(v: number, max: number, w = 16): string {
  if (max <= 0) return "".padEnd(w, "·");
  const f = Math.round((v / max) * w);
  return "█".repeat(Math.min(f, w)).padEnd(w, "·");
}

/** Экранирование для Telegram MarkdownV2 */
function tgMdV2Escape(s: string): string {
  // MarkdownV2 требует экранирования: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}

function formatPerCourse(perCourse: Record<string, number>, lang: Lang): string {
  const arr = Object.entries(perCourse)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!arr.length) return tgMdV2Escape("—");

  const max = arr[0][1];
  const sum = arr.reduce((a, [, v]) => a + v, 0) || 1;

  return arr.slice(0, 6).map(([c, v]) => {
    const pct = Math.round((v / sum) * 100);
    const course = tgMdV2Escape(c);
    const time = tgMdV2Escape(mm(v, lang));
    const bar = asciiBar(v, max); // ASCII-символы не нужно экранировать
    return `${bar} ${course} ${tgMdV2Escape("—")} ${time} ${tgMdV2Escape("(")}${pct}%${tgMdV2Escape(")")}`;
  }).join("\n");
}

function formatDailyActivity(perDay: Record<string, number>, lang: Lang): string {
  const keys = Object.keys(perDay)
    .filter((k) => k && k !== "—")
    .sort();

  if (!keys.length) return tgMdV2Escape("—");

  const vals = keys.map((k) => Math.max(0, Math.round(perDay[k] ?? 0)));

  // Показываем последние 7 дней для компактности
  const MAX = 7;
  const k2 = keys.length > MAX ? keys.slice(keys.length - MAX) : keys;
  const v2 = keys.length > MAX ? vals.slice(vals.length - MAX) : vals;

  const maxV = v2.reduce((a, b) => Math.max(a, b), 0);

  return k2.map((day, i) => {
    const val = v2[i];
    const bar = asciiBar(val, maxV, 12);
    const dayEscaped = tgMdV2Escape(day);
    const timeEscaped = tgMdV2Escape(mm(val, lang));
    return `${bar} ${dayEscaped} ${tgMdV2Escape("—")} ${timeEscaped}`;
  }).join("\n");
}

function formatDeadlines(deadlines: DeadlineItem[], lang: Lang): string {
  const items = deadlines
    .filter(d => d && (d.due || d.title || d.course))
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
    .slice(0, 6);

  if (!items.length) return tgMdV2Escape("—");

  return items.map(d => {
    const course = tgMdV2Escape(d.course ?? "—");
    const title = tgMdV2Escape(d.title ?? "—");
    const due = tgMdV2Escape(d.due ?? "—");
    const prog = Number.isFinite(d.progress) ? Math.round(d.progress) : 0;

    return lang === "en"
      ? `${tgMdV2Escape("•")} ${course} ${tgMdV2Escape("—")} ${title} ${tgMdV2Escape("—")} ${due} ${tgMdV2Escape("(progress:")} ${prog}%${tgMdV2Escape(")")}`
      : `${tgMdV2Escape("•")} ${course} ${tgMdV2Escape("—")} ${title} ${tgMdV2Escape("—")} ${due} ${tgMdV2Escape("(прогресс:")} ${prog}%${tgMdV2Escape(")")}`;
  }).join("\n");
}

export class DigestBuilderService {
  buildTelegramDigest(
    data: ReportData,
    periodLabel: string,
    insights?: string,
    deadlines?: DeadlineItem[],
    singleNoteDeadline?: string,
    langIn?: string,
    quiz?: string
  ): string {
    const lang = normalizeLang(langIn);
    const L = lang === "en" ? t.en : t.ru;

    const lines: string[] = [];

    // Title - используем bold вместо header
    lines.push(`*${tgMdV2Escape("🧠 " + L.d_title + " — " + periodLabel)}*`);
    lines.push("");
    lines.push(`${tgMdV2Escape("⏱ " + L.d_total + ":")} ${tgMdV2Escape(mm(data.totalMinutes ?? 0, lang))}`);
    lines.push("");

    // Projects/areas
    lines.push(`*${tgMdV2Escape("📊 " + L.d_byProjects + ":")}*`);
    lines.push(formatPerCourse(data.perCourse ?? {}, lang));
    lines.push("");

    // Daily activity
    if (Object.keys(data.perDay ?? {}).length > 0) {
      lines.push(`*${tgMdV2Escape(lang === "en" ? "📈 Daily activity:" : "📈 Динамика по дням:")}*`);
      lines.push(formatDailyActivity(data.perDay ?? {}, lang));
      lines.push("");
    }

    // Topics
    if (data.topTopics?.length) {
      const top = data.topTopics.slice(0, 5)
        .map(x => `${tgMdV2Escape("• " + x.topic)} ${tgMdV2Escape("(")}${x.count}${tgMdV2Escape(")")}`)
        .join("\n");
      lines.push(`*${tgMdV2Escape("🔥 " + L.d_topTopics + ":")}*`);
      lines.push(top);
      lines.push("");
    }

    // Keywords
    if (data.topKeywords?.length) {
      const kw = data.topKeywords.slice(0, 8).map(k => tgMdV2Escape(k.word)).join(tgMdV2Escape(", "));
      lines.push(`*${tgMdV2Escape("🔎 " + L.d_keywords + ":")}* ${kw}`);
      lines.push("");
    }

    // Tasks
    if (data.tasks) {
      const tasksText = lang === "en"
        ? `✅ ${L.tasks}: ${data.tasks.done}/${data.tasks.total} (open: ${data.tasks.open})`
        : `✅ ${L.tasks}: ${data.tasks.done}/${data.tasks.total} (открыто: ${data.tasks.open})`;
      lines.push(tgMdV2Escape(tasksText));
      lines.push("");
    }

    // Deadlines summary
    if (data.assignments && data.assignments.total > 0) {
      const deadlinesSummary = lang === "en"
        ? `⏰ Deadlines: ${data.assignments.total} total, ${data.assignments.open} open, ${data.assignments.overdue} overdue`
        : `⏰ Дедлайны: ${data.assignments.total} всего, ${data.assignments.open} открыто, ${data.assignments.overdue} просрочено`;
      lines.push(tgMdV2Escape(deadlinesSummary));
      lines.push("");
    }

    // Upcoming deadlines (detailed)
    if (singleNoteDeadline) {
      lines.push(`${tgMdV2Escape("⏰ " + L.d_noteDeadline + ":")} ${tgMdV2Escape(singleNoteDeadline)}`);
      lines.push("");
    } else if (deadlines?.length) {
      lines.push(`*${tgMdV2Escape(lang === "en" ? "⏰ Upcoming deadlines:" : "⏰ Ближайшие дедлайны:")}*`);
      lines.push(formatDeadlines(deadlines, lang));
      lines.push("");
    }

    // Insights (LLM)
    if (insights?.trim()) {
      const safeInsights = tgMdV2Escape(insights.trim()).slice(0, 800);
      lines.push(`*${tgMdV2Escape("💡 " + L.d_insights + ":")}*`);
      lines.push(safeInsights);
      lines.push("");
    }

    // Self-check questions
    if (quiz?.trim()) {
      const safeQuiz = tgMdV2Escape(quiz.trim()).slice(0, 600);
      lines.push(`*${tgMdV2Escape(lang === "en" ? "✅ Self-check questions:" : "✅ Вопросы для самоконтроля:")}*`);
      lines.push(safeQuiz);
      lines.push("");
    }

    // Gaps
    if (data.gaps?.length) {
      const gapsText = lang === "en"
        ? `⚠️ Attention gaps: ${data.gaps.join(", ")}`
        : `⚠️ Пробелы внимания: ${data.gaps.join(", ")}`;
      lines.push(tgMdV2Escape(gapsText));
      lines.push("");
    }

    // Telegram limit safety
    const text = lines.join("\n").trim();
    return text.length > 3900 ? text.slice(0, 3900) + tgMdV2Escape("…") : text;
  }
}
