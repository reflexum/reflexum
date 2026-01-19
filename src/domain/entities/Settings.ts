export interface ReflexumSettings {
  datePreset: "last7" | "thisWeek" | "thisMonth" | "custom";
  dateFrom?: string;
  dateTo?: string;
  includeCourses: string[];
  useLLM: boolean;
  llmProvider: string;
  llmApiKey?: string;
  llmModel?: string;
  llmBaseUrl?: string;
  telegramEnabled: boolean;
  botToken?: string;
  chatId?: string;
  includeQuiz: boolean;
  language: "ru" | "en";
  dueReminderDays: number;
  autoReportEnabled: boolean;
  autoReportFrequency: "daily" | "weekly" | "monthly";
  autoReportTime: string; // HH:mm format, e.g. "20:00"
  lastAutoReportDate?: string; // ISO date string of last sent report
}

export const DEFAULT_SETTINGS: ReflexumSettings = {
  datePreset: "last7",
  includeCourses: [],
  useLLM: false,
  llmProvider: "openai",
  telegramEnabled: false,
  includeQuiz: false,
  language: "ru",
  dueReminderDays: 2,
  autoReportEnabled: false,
  autoReportFrequency: "weekly",
  autoReportTime: "20:00",
};
