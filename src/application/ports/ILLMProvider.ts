import type { ReportData } from '../../domain/entities/Report';
import type { StudyAggregates } from '../../domain/entities/Report';

export interface LLMContext {
  mode: "single" | "period";
  body?: string;
  lang?: string;
}

export interface ILLMProvider {
  summarizeInsights(analyzed: ReportData, ctx?: LLMContext): Promise<string>;
  generateQuiz(agg: StudyAggregates, analyzed: ReportData, ctx?: LLMContext): Promise<string>;
  loadAvailableModels(): Promise<{ id: string; name: string; capabilities?: any }[]>;
}
