import type { INotesRepository } from '../../domain/repositories/INotesRepository';
import type { IReportRepository } from '../../domain/repositories/IReportRepository';
import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';
import type { ILLMProvider } from '../ports/ILLMProvider';
import type { INotificationService } from '../ports/INotificationService';
import type { AnalysisService } from '../../domain/services/AnalysisService';
import type { StudyAggregates } from '../../domain/entities/Report';

export interface ReportFormatter {
  renderMarkdown(analyzed: any, insights: string, quiz: string, options?: any): string;
  generateReportPath(from: number, to: number, unique?: boolean): string;
}

export class GenerateReportUseCase {
  constructor(
    private notesRepo: INotesRepository,
    private reportRepo: IReportRepository,
    private settingsRepo: ISettingsRepository,
    private analysisService: AnalysisService,
    private getLLMProvider: () => ILLMProvider | null,
    private notificationService: INotificationService,
    private reportFormatter: ReportFormatter
  ) {}

  async execute(dateRange: { from: number; to: number }): Promise<void> {
    try {
      const settings = await this.settingsRepo.load();
      
      // 1. Collect notes in date range
      const allFiles = await this.notesRepo.getMarkdownFiles();
      const filesInRange = allFiles.filter(f => {
        return f.mtime >= dateRange.from && f.mtime <= dateRange.to;
      });

      if (filesInRange.length === 0) {
        this.notificationService.showNotice('За выбранный период подходящих заметок не найдено.');
        return;
      }

      // 2. Parse notes to sessions and assignments
      const sessions = [];
      const assignments = [];

      for (const fileInfo of filesInRange) {
        const content = await this.notesRepo.readNote(fileInfo.path);
        
        const session = await this.notesRepo.parseNoteToSession(
          fileInfo.path,
          content,
          settings.includeCourses
        );
        if (session) sessions.push(session);

        const assignment = await this.notesRepo.parseNoteToAssignment(fileInfo.path, content);
        if (assignment) assignments.push(assignment);
      }

      const aggregates: StudyAggregates = { sessions, assignments };

      // 3. Analyze data
      const analyzed = this.analysisService.analyze(aggregates);

      // 4. Generate insights and quiz if LLM enabled
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
          this.notificationService.showNotice('LLM summarization failed (see console).');
        }
      }

      // 5. Render and save report
      const markdown = this.reportFormatter.renderMarkdown(analyzed, insights, quiz, {
        lang: settings.language
      });

      await this.reportRepo.ensureReportsDir();
      const reportPath = this.reportFormatter.generateReportPath(dateRange.from, dateRange.to, true);
      
      await this.reportRepo.saveReport(reportPath, markdown);
      await this.reportRepo.openReport(reportPath);

      this.notificationService.showNotice(`Reflexum: report created → ${reportPath}`);
    } catch (error) {
      console.error('Generate report error:', error);
      this.notificationService.showNotice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
