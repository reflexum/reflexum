import type { INotesRepository } from '../../domain/repositories/INotesRepository';
import type { IReportRepository } from '../../domain/repositories/IReportRepository';
import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';
import type { ILLMProvider } from '../ports/ILLMProvider';
import type { IMessengerService } from '../ports/IMessengerService';
import type { INotificationService } from '../ports/INotificationService';
import type { AnalysisService } from '../../domain/services/AnalysisService';
import type { StudyAggregates } from '../../domain/entities/Report';

export interface DigestBuilder {
  buildTelegramDigest(
    data: any,
    periodLabel: string,
    insights?: string,
    deadlines?: any[],
    singleNoteDeadline?: string,
    lang?: string,
    quiz?: string
  ): string;
}

export class SendReportToTelegramUseCase {
  constructor(
    private notesRepo: INotesRepository,
    private reportRepo: IReportRepository,
    private settingsRepo: ISettingsRepository,
    private analysisService: AnalysisService,
    private getLLMProvider: () => ILLMProvider | null,
    private getMessengerService: () => IMessengerService | null,
    private notificationService: INotificationService,
    private digestBuilder: DigestBuilder
  ) {}

  async execute(dateRange: { from: number; to: number }): Promise<void> {
    try {
      const settings = await this.settingsRepo.load();

      const messengerService = this.getMessengerService();
      if (!settings.telegramEnabled || !messengerService) {
        this.notificationService.showNotice('Telegram is not configured.');
        return;
      }

      const allFiles = await this.notesRepo.getMarkdownFiles();
      const filesInRange = allFiles.filter(f => f.mtime >= dateRange.from && f.mtime <= dateRange.to);

      const sessions = [];
      const assignments = [];

      for (const fileInfo of filesInRange) {
        const content = await this.notesRepo.readNote(fileInfo.path);
        const session = await this.notesRepo.parseNoteToSession(fileInfo.path, content, settings.includeCourses);
        if (session) sessions.push(session);
        const assignment = await this.notesRepo.parseNoteToAssignment(fileInfo.path, content);
        if (assignment) assignments.push(assignment);
      }

      const aggregates: StudyAggregates = { sessions, assignments };
      const analyzed = this.analysisService.analyze(aggregates);

      let insights = '';
      let quiz = '';
      const llmProvider = this.getLLMProvider();
      if (settings.useLLM && llmProvider) {
        try {
          insights = await llmProvider.summarizeInsights(analyzed, { mode: 'period', lang: settings.language });
          
          if (settings.includeQuiz) {
            quiz = await llmProvider.generateQuiz(aggregates, analyzed, { mode: 'period', lang: settings.language });
          }
        } catch (error) {
          console.error('LLM error:', error);
        }
      }

      const soon = await this.collectDeadlinesSoon(settings.dueReminderDays);
      const periodLabel = this.formatPeriodLabel(dateRange.from, dateRange.to);
      const digest = this.digestBuilder.buildTelegramDigest(
        analyzed,
        periodLabel,
        insights,
        soon.map(s => ({ course: s.course, title: s.title, due: s.due, progress: s.progress })),
        undefined,
        settings.language,
        quiz
      );

      await messengerService.sendMessage(digest);

      this.notificationService.showNotice('Digest sent to Telegram.');
    } catch (error) {
      console.error('Send to Telegram error:', error);
      this.notificationService.showNotice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async collectDeadlinesSoon(daysAhead: number): Promise<any[]> {
    const allFiles = await this.notesRepo.getMarkdownFiles();
    const assignments = [];

    for (const fileInfo of allFiles) {
      const content = await this.notesRepo.readNote(fileInfo.path);
      const assignment = await this.notesRepo.parseNoteToAssignment(fileInfo.path, content);
      if (assignment) assignments.push(assignment);
    }

    const today = new Date();
    const limit = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return assignments.filter(a => {
      if (!a.due || a.progress >= 100) return false;
      const d = new Date(a.due);
      return !isNaN(d.getTime()) && d >= today && d <= limit;
    });
  }

  private formatPeriodLabel(from: number, to: number): string {
    const formatDate = (ts: number) => {
      const d = new Date(ts);
      return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    };
    const toYear = new Date(to);
    return `${formatDate(from)}–${formatDate(to)}.${toYear.getFullYear()}`;
  }
}
