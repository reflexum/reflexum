import { App, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, type ReflexumSettings } from './domain/entities/Settings';

// Repositories
import { ObsidianNotesRepository } from './infrastructure/repositories/ObsidianNotesRepository';
import { ObsidianReportRepository } from './infrastructure/repositories/ObsidianReportRepository';
import { ObsidianSettingsRepository } from './infrastructure/repositories/ObsidianSettingsRepository';

// Services
import { AnalysisService } from './domain/services/AnalysisService';
import { ReportFormatterService } from './application/services/ReportFormatterService';
import { DigestBuilderService } from './application/services/DigestBuilderService';

// Infrastructure
import { MultiLLMProvider } from './infrastructure/llm/MultiLLMProvider';
import { TelegramService } from './infrastructure/messenger/TelegramService';
import { ObsidianNotificationService } from './presentation/notifications/ObsidianNotificationService';

// Use Cases
import { GenerateReportUseCase } from './application/usecases/GenerateReportUseCase';
import { GenerateCurrentNoteReportUseCase } from './application/usecases/GenerateCurrentNoteReportUseCase';
import { SendReportToTelegramUseCase } from './application/usecases/SendReportToTelegramUseCase';
import { CheckDeadlinesUseCase } from './application/usecases/CheckDeadlinesUseCase';
import { AutoReportUseCase } from './application/usecases/AutoReportUseCase';

// Commands
import { AnalyzeCommand } from './presentation/commands/AnalyzeCommand';
import { AnalyzeCurrentNoteCommand } from './presentation/commands/AnalyzeCurrentNoteCommand';
import { AnalyzeAndSendToTelegramCommand } from './presentation/commands/AnalyzeAndSendToTelegramCommand';
import { CreateNoteCommand } from './presentation/commands/CreateNoteCommand';

// Settings
import { ReflexumSettingsTab } from './presentation/settings/ReflexumSettingsTab';

export default class ReflexumPlugin extends Plugin {
  settings: ReflexumSettings;
  private reminderInterval: number | null = null;
  private autoReportInterval: number | null = null;
  private llmProvider: MultiLLMProvider | null = null;

  async onload() {
    // Load settings
    const settingsRepo = new ObsidianSettingsRepository(this);
    this.settings = await settingsRepo.load();

    // Initialize repositories
    const notesRepo = new ObsidianNotesRepository(this.app);
    const reportRepo = new ObsidianReportRepository(this.app);

    // Initialize services
    const analysisService = new AnalysisService();
    const reportFormatter = new ReportFormatterService();
    const digestBuilder = new DigestBuilderService();
    const notificationService = new ObsidianNotificationService();

    // Initialize infrastructure adapters
    const getLLMProvider = () => {
      if (!this.settings.useLLM) {
        this.llmProvider = null;
        return null;
      }
      if (!this.llmProvider) {
        this.llmProvider = new MultiLLMProvider(this.settings);
      }
      return this.llmProvider;
    };

    const getMessengerService = () => {
      if (!this.settings.telegramEnabled || !this.settings.botToken || !this.settings.chatId) {
        return null;
      }
      return new TelegramService(this.settings.botToken, this.settings.chatId);
    };

    // Helper: get date range based on settings
    const getDateRange = (): { from: number; to: number } => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
      let start = end - 7 * 24 * 60 * 60 * 1000;

      if (this.settings.datePreset === 'thisWeek') {
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - (day - 1));
        monday.setHours(0, 0, 0, 0);
        start = monday.getTime();
      } else if (this.settings.datePreset === 'thisMonth') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        start = first.getTime();
      } else if (this.settings.datePreset === 'custom' && this.settings.dateFrom && this.settings.dateTo) {
        start = new Date(this.settings.dateFrom).getTime();
        return { from: start, to: new Date(this.settings.dateTo).getTime() };
      }

      return { from: start, to: end };
    };

    // Helper: get current note path
    const getCurrentNotePath = (): string | null => {
      const active = this.app.workspace.getActiveFile();
      if (!(active && active instanceof TFile)) return null;
      return active.path;
    };

    // Initialize use cases
    const generateReportUseCase = new GenerateReportUseCase(
      notesRepo,
      reportRepo,
      settingsRepo,
      analysisService,
      getLLMProvider,
      notificationService,
      reportFormatter
    );

    const generateCurrentNoteReportUseCase = new GenerateCurrentNoteReportUseCase(
      notesRepo,
      reportRepo,
      settingsRepo,
      analysisService,
      getLLMProvider,
      notificationService,
      reportFormatter,
      getCurrentNotePath
    );

    const sendReportToTelegramUseCase = new SendReportToTelegramUseCase(
      notesRepo,
      reportRepo,
      settingsRepo,
      analysisService,
      getLLMProvider,
      getMessengerService,
      notificationService,
      digestBuilder
    );

    const checkDeadlinesUseCase = new CheckDeadlinesUseCase(
      notesRepo,
      getMessengerService,
      notificationService
    );

    const autoReportUseCase = new AutoReportUseCase(
      generateReportUseCase,
      sendReportToTelegramUseCase,
      settingsRepo
    );

    // Initialize commands
    const analyzeCommand = new AnalyzeCommand(generateReportUseCase, getDateRange);
    const analyzeCurrentNoteCommand = new AnalyzeCurrentNoteCommand(generateCurrentNoteReportUseCase);
    const analyzeAndSendToTelegramCommand = new AnalyzeAndSendToTelegramCommand(
      generateReportUseCase,
      sendReportToTelegramUseCase,
      getDateRange
    );

    // Register commands
    this.addCommand({
      id: 'reflexum-analyze',
      name: 'Analyze (current preset) and open report',
      callback: () => analyzeCommand.execute()
    });

    this.addCommand({
      id: 'reflexum-analyze-current-note',
      name: 'Analyze current note and open report',
      callback: () => analyzeCurrentNoteCommand.execute()
    });

    this.addCommand({
      id: 'reflexum-analyze-and-send-telegram',
      name: 'Analyze (current preset) and send to Telegram',
      callback: () => analyzeAndSendToTelegramCommand.execute()
    });

    this.addCommand({
      id: 'reflexum-create-study-session',
      name: 'Create study session note',
      callback: async () => {
        const cmd = new CreateNoteCommand(this.app, 'study-session');
        await cmd.execute();
      }
    });

    this.addCommand({
      id: 'reflexum-create-assignment',
      name: 'Create assignment note',
      callback: async () => {
        const cmd = new CreateNoteCommand(this.app, 'assignment');
        await cmd.execute();
      }
    });

    // Settings tab
    this.addSettingTab(new ReflexumSettingsTab(
      this.app,
      this,
      this.settings,
      {
        onSettingsChange: async (settings: ReflexumSettings) => {
          this.settings = settings;
          await settingsRepo.save(settings);
          if (this.llmProvider) {
            this.llmProvider.resetModel();
          }
          this.restartDueReminders(checkDeadlinesUseCase);
          this.restartAutoReports(autoReportUseCase);
        },
        getLLMProvider: () => getLLMProvider()
      }
    ));

    // Start deadline reminders
    this.startDueReminders(checkDeadlinesUseCase);
    
    // Start auto reports
    this.startAutoReports(autoReportUseCase);
  }

  onunload() {
    if (this.reminderInterval) {
      window.clearInterval(this.reminderInterval);
    }
    if (this.autoReportInterval) {
      window.clearInterval(this.autoReportInterval);
    }
  }

  private startDueReminders(checkDeadlinesUseCase: CheckDeadlinesUseCase) {
    if (!this.settings.telegramEnabled || !this.settings.botToken || !this.settings.chatId) {
      return;
    }

    if (this.reminderInterval) {
      window.clearInterval(this.reminderInterval);
    }

    // Check every 6 hours
    this.reminderInterval = window.setInterval(async () => {
      await checkDeadlinesUseCase.execute(this.settings.dueReminderDays);
    }, 6 * 60 * 60 * 1000);
  }

  private restartDueReminders(checkDeadlinesUseCase: CheckDeadlinesUseCase) {
    this.startDueReminders(checkDeadlinesUseCase);
  }

  private startAutoReports(autoReportUseCase: AutoReportUseCase) {
    if (!this.settings.autoReportEnabled || !this.settings.telegramEnabled) {
      return;
    }

    if (this.autoReportInterval) {
      window.clearInterval(this.autoReportInterval);
    }

    // Check immediately on startup for missed reports
    this.checkAndSendAutoReport(autoReportUseCase);

    // Check every hour if it's time to send report
    this.autoReportInterval = window.setInterval(async () => {
      await this.checkAndSendAutoReport(autoReportUseCase);
    }, 60 * 60 * 1000); // Every hour
  }

  private async checkAndSendAutoReport(autoReportUseCase: AutoReportUseCase) {
    try {
      const shouldSend = autoReportUseCase.shouldSendReport(this.settings);
      
      if (shouldSend) {
        await autoReportUseCase.execute();
      }
    } catch (error) {
      console.error('Auto report error:', error);
    }
  }

  private restartAutoReports(autoReportUseCase: AutoReportUseCase) {
    this.startAutoReports(autoReportUseCase);
  }
}
