import { igniteModel, loadModels, Message, type LlmModel } from "multi-llm-ts";
import type {
  ILLMProvider,
  LLMContext,
} from "../../application/ports/ILLMProvider";
import type { ReportData, StudyAggregates } from "../../domain/entities/Report";
import type { ReflexumSettings } from "../../domain/entities/Settings";

export class MultiLLMProvider implements ILLMProvider {
  private model?: LlmModel;

  constructor(private settings: ReflexumSettings) {}

  resetModel(): void {
    this.model = undefined;
  }

  private async ensureModel(): Promise<LlmModel> {
    if (this.model) return this.model;

    if (!this.settings.llmApiKey) {
      throw new Error("LLM API key not configured.");
    }

    const config: any = { apiKey: this.settings.llmApiKey };
    if (this.settings.llmBaseUrl) {
      config.baseURL = this.settings.llmBaseUrl;
    }

    try {
      const models = await loadModels(this.settings.llmProvider, config);

      let selectedModel = models.chat[0];
      if (this.settings.llmModel) {
        const found = models.chat.find((m) => m.id === this.settings.llmModel);
        if (found) selectedModel = found;
      }

      this.model = igniteModel(
        this.settings.llmProvider,
        selectedModel,
        config,
      );
      return this.model;
    } catch (error) {
      console.error("Failed to initialize LLM:", error);
      throw new Error(
        `Failed to initialize LLM: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async summarizeInsights(
    analyzed: ReportData,
    ctx?: LLMContext,
  ): Promise<string> {
    const lang = ctx?.lang ?? "ru";
    const system =
      lang === "ru"
        ? "Ты помощник по учебному журналу. Дай 3–6 конкретных инсайтов строго по материалу. Пиши кратко, по делу. Формат: маркированный список (каждая строка начинается с '- ')."
        : "You are a study journal assistant. Provide 3–6 concrete insights strictly from the material. Format: bullet list (each line starts with '- ').";

    const body = ctx?.body ?? "";
    const user =
      ctx?.mode === "single" && body
        ? lang === "ru"
          ? `Материал (заметка). Сначала 1–2 предложения: о чём текст. Затем инсайты списком.\n\n"""${body}"""`
          : `Material (note). First: 1–2 sentence summary. Then insights as bullet list.\n\n"""${body}"""`
        : [
            lang === "ru" ? "Сводка периода:" : "Period summary:",
            `Time: ${analyzed.totalMinutes} min`,
            `Courses: ${Object.keys(analyzed.perCourse).join(", ")}`,
            `Top topics: ${analyzed.topTopics.map((t: any) => t.topic).join(", ")}`,
          ].join("\n");

    return await this.callModel(system, user);
  }

  async generateQuiz(
    agg: StudyAggregates,
    analyzed: ReportData,
    ctx?: LLMContext,
  ): Promise<string> {
    const system =
      ctx?.lang === "en"
        ? "Generate 5 self-check questions based on the content. Format each question on a new line starting with '- '. These are questions for self-assessment, not a quiz with answers."
        : "Сгенерируй 5 вопросов для самоконтроля по содержимому. Формат: каждый вопрос с новой строки, начиная с '- '. Это вопросы для самопроверки, а не квиз с ответами.";

    const user =
      ctx?.mode === "single" && ctx.body
        ? ctx?.lang === "en"
          ? `Generate 5 self-check questions based on the text:\n"""${ctx.body}"""`
          : `Составь 5 вопросов для самоконтроля по тексту:\n"""${ctx.body}"""`
        : ctx?.lang === "en"
          ? `Topics for the period: ${analyzed.topTopics.map((t: any) => t.topic).join(", ")}`
          : `Темы периода: ${analyzed.topTopics.map((t: any) => t.topic).join(", ")}`;

    return await this.callModel(system, user);
  }

  private async callModel(system: string, user: string): Promise<string> {
    try {
      const model = await this.ensureModel();

      const messages = [
        new Message("system", system),
        new Message("user", user),
      ];

      const response = await model.complete(messages);

      return response.content || "⚠️ No response from LLM.";
    } catch (error) {
      console.error("LLM error:", error);
      return `⚠️ LLM error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  async loadAvailableModels(): Promise<
    { id: string; name: string; capabilities?: any }[]
  > {
    if (!this.settings.llmApiKey) {
      return [];
    }

    try {
      const config: any = { apiKey: this.settings.llmApiKey };
      if (this.settings.llmBaseUrl) {
        config.baseURL = this.settings.llmBaseUrl;
      }

      const models = await loadModels(this.settings.llmProvider, config);
      return models.chat.map((m) => ({
        id: m.id,
        name: m.name,
        capabilities: m.capabilities,
      }));
    } catch (error) {
      console.error("Failed to load models:", error);
      return [];
    }
  }
}
