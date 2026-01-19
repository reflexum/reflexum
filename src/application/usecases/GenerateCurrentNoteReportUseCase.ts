import type { INotesRepository } from '../../domain/repositories/INotesRepository';
import type { IReportRepository } from '../../domain/repositories/IReportRepository';
import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';
import type { ILLMProvider } from '../ports/ILLMProvider';
import type { INotificationService } from '../ports/INotificationService';
import type { AnalysisService } from '../../domain/services/AnalysisService';
import type { StudyAggregates } from '../../domain/entities/Report';

export interface ReportFormatter {
  renderMarkdown(analyzed: any, insights: string, quiz: string, options?: any): string;
}

export class GenerateCurrentNoteReportUseCase {
  constructor(
    private notesRepo: INotesRepository,
    private reportRepo: IReportRepository,
    private settingsRepo: ISettingsRepository,
    private analysisService: AnalysisService,
    private getLLMProvider: () => ILLMProvider | null,
    private notificationService: INotificationService,
    private reportFormatter: ReportFormatter,
    private getCurrentNotePath: () => string | null
  ) {}

  async execute(): Promise<void> {
    try {
      const currentNotePath = this.getCurrentNotePath();
      
      if (!currentNotePath) {
        this.notificationService.showNotice('Open a note first.');
        return;
      }

      const settings = await this.settingsRepo.load();
      const content = await this.notesRepo.readNote(currentNotePath);

      // Parse current note
      const session = await this.notesRepo.parseNoteToSession(currentNotePath, content, []);
      const assignment = await this.notesRepo.parseNoteToAssignment(currentNotePath, content);

      const aggregates: StudyAggregates = {
        sessions: session ? [session] : [],
        assignments: assignment ? [assignment] : []
      };

      // Analyze
      const analyzed = this.analysisService.analyze(aggregates);

      // Generate insights
      let insights = '';
      let quiz = '';

      const llmProvider = this.getLLMProvider();
      if (settings.useLLM && llmProvider) {
        try {
          insights = await llmProvider.summarizeInsights(analyzed, {
            mode: 'single',
            body: session?.body ?? '',
            lang: settings.language
          });

          if (settings.includeQuiz) {
            quiz = await llmProvider.generateQuiz(aggregates, analyzed, {
              mode: 'single',
              body: session?.body ?? '',
              lang: settings.language
            });
          }
        } catch (error) {
          console.error('LLM error:', error);
        }
      }

      // Render report
      const singleDeadline = assignment?.due;
      const markdown = this.reportFormatter.renderMarkdown(analyzed, insights, quiz, {
        singleNote: true,
        deadline: singleDeadline,
        lang: settings.language
      });

      // Save report
      await this.reportRepo.ensureReportsDir();
      const safeBasename = currentNotePath.split('/').pop()?.replace(/\.md$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '_') ?? 'note';
      const reportPath = `Reflexum/Reports/one_${safeBasename}.md`;

      await this.reportRepo.saveReport(reportPath, markdown);
      await this.reportRepo.openReport(reportPath);

      this.notificationService.showNotice(`Reflexum: report for "${safeBasename}" created.`);
    } catch (error) {
      console.error('Generate current note report error:', error);
      this.notificationService.showNotice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
