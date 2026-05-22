import { App, PluginSettingTab, Setting } from 'obsidian';
import type { ReflexumSettings } from '../../domain/entities/Settings';
import type { ILLMProvider } from '../../application/ports/ILLMProvider';

interface SettingsTabCallbacks {
  onSettingsChange: (settings: ReflexumSettings) => Promise<void>;
  getLLMProvider: () => ILLMProvider | null;
}

const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic (Claude)' },
  { id: 'google', name: 'Google (Gemini)' },
  { id: 'ollama', name: 'Ollama (Local)' },
  { id: 'groq', name: 'Groq' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'mistralai', name: 'Mistral AI' },
  { id: 'xai', name: 'xAI (Grok)' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'azure', name: 'Azure AI' },
  { id: 'cerebras', name: 'Cerebras' },
  { id: 'meta', name: 'Meta/Llama' },
];

type SettingsLang = 'ru' | 'en';

const SETTINGS_LABELS = {
  ru: {
    title: 'Reflexum — учебный журнал',
    datePreset: 'Период анализа',
    datePresets: {
      last7: 'Последние 7 дней',
      thisWeek: 'Эта неделя',
      thisMonth: 'Этот месяц',
      custom: 'Произвольный'
    },
    from: 'С',
    to: 'По',
    language: 'Язык',
    llmIntegration: 'LLM-интеграция',
    useLLM: 'Использовать LLM',
    useLLMDesc: 'Включить AI-инсайты и вопросы для самопроверки',
    llmProvider: 'LLM-провайдер',
    llmProviderDesc: 'Выберите AI-провайдера',
    apiKey: 'API-ключ',
    apiKeyDesc: 'API-ключ выбранного провайдера',
    loadAvailableModels: 'Загрузить доступные модели',
    loadAvailableModelsDesc: 'Получить список моделей у провайдера',
    loading: 'Загрузка...',
    loadModels: 'Загрузить модели',
    model: 'Модель',
    modelDesc: 'Выберите конкретную модель',
    defaultModel: 'По умолчанию (первая доступная)',
    modelId: 'ID модели (необязательно)',
    modelIdDesc: 'Конкретная модель, например gpt-4o-mini. Оставьте пустым для значения по умолчанию или загрузите список моделей выше.',
    baseUrl: 'Base URL',
    baseUrlDesc: 'Пользовательский endpoint URL для Ollama/Azure',
    includeQuiz: 'Добавлять мини-квиз',
    includeQuizDesc: 'Генерировать вопросы для самопроверки в отчётах',
    telegram: 'Telegram',
    enableTelegram: 'Включить Telegram',
    enableTelegramDesc: 'Отправлять отчёты и уведомления в Telegram',
    botToken: 'Токен бота',
    chatId: 'Chat ID',
    dueReminders: 'Напоминания о дедлайнах',
    dueRemindersDesc: 'Отправлять напоминания о заданиях с дедлайном в ближайшие N дней',
    autoReport: 'Автоотчёт в Telegram',
    autoReportDesc: 'Автоматически генерировать и отправлять отчёты в Telegram',
    reportFrequency: 'Частота отчёта',
    reportFrequencyDesc: 'Как часто отправлять автоматические отчёты',
    frequencies: {
      daily: 'Ежедневно',
      weekly: 'Еженедельно (воскресенье)',
      monthly: 'Ежемесячно (последний день)'
    },
    reportTime: 'Время отчёта',
    reportTimeDesc: 'Время отправки отчётов в формате HH:mm, 24 часа'
  },
  en: {
    title: 'Reflexum — Study Journal',
    datePreset: 'Date preset',
    datePresets: {
      last7: 'Last 7 days',
      thisWeek: 'This week',
      thisMonth: 'This month',
      custom: 'Custom'
    },
    from: 'From',
    to: 'To',
    language: 'Language',
    llmIntegration: 'LLM Integration',
    useLLM: 'Use LLM',
    useLLMDesc: 'Enable AI-powered insights and quiz generation',
    llmProvider: 'LLM Provider',
    llmProviderDesc: 'Choose your AI provider',
    apiKey: 'API Key',
    apiKeyDesc: 'Your API key for the selected provider',
    loadAvailableModels: 'Load available models',
    loadAvailableModelsDesc: 'Fetch list of models from the provider',
    loading: 'Loading...',
    loadModels: 'Load Models',
    model: 'Model',
    modelDesc: 'Select a specific model',
    defaultModel: 'Default (first available)',
    modelId: 'Model ID (optional)',
    modelIdDesc: 'Specific model to use (e.g., gpt-4o-mini). Leave empty for default or load models above.',
    baseUrl: 'Base URL',
    baseUrlDesc: 'Custom endpoint URL (for Ollama/Azure)',
    includeQuiz: 'Include mini-quiz',
    includeQuizDesc: 'Generate quiz questions in reports',
    telegram: 'Telegram',
    enableTelegram: 'Enable Telegram',
    enableTelegramDesc: 'Send reports and notifications to Telegram',
    botToken: 'Bot token',
    chatId: 'Chat ID',
    dueReminders: 'Due reminders (days ahead)',
    dueRemindersDesc: 'Send reminders for assignments due within N days',
    autoReport: 'Auto-report to Telegram',
    autoReportDesc: 'Automatically generate and send reports to Telegram',
    reportFrequency: 'Report frequency',
    reportFrequencyDesc: 'How often to send automatic reports',
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly (Sunday)',
      monthly: 'Monthly (last day)'
    },
    reportTime: 'Report time',
    reportTimeDesc: 'Time to send reports (HH:mm format, 24h)'
  }
} as const;

function getSettingsLang(lang?: string): SettingsLang {
  return lang === 'en' ? 'en' : 'ru';
}

export class ReflexumSettingsTab extends PluginSettingTab {
  private loadedModels: { id: string; name: string }[] = [];
  private isLoadingModels = false;

  constructor(
    app: App,
    plugin: any,
    private settings: ReflexumSettings,
    private callbacks: SettingsTabCallbacks
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const labels = SETTINGS_LABELS[getSettingsLang(this.settings.language)];
    containerEl.empty();
    
    containerEl.createEl('h2', { text: labels.title });

    // Date preset
    new Setting(containerEl)
      .setName(labels.datePreset)
      .addDropdown(dd => dd
        .addOptions(labels.datePresets)
        .setValue(this.settings.datePreset)
        .onChange(async (v: any) => {
          this.settings.datePreset = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    if (this.settings.datePreset === 'custom') {
      new Setting(containerEl)
        .setName(labels.from)
        .addText(t => t
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.settings.dateFrom ?? '')
          .onChange(async v => {
            this.settings.dateFrom = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));

      new Setting(containerEl)
        .setName(labels.to)
        .addText(t => t
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.settings.dateTo ?? '')
          .onChange(async v => {
            this.settings.dateTo = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));
    }

    // Language
    new Setting(containerEl)
      .setName(labels.language)
      .addDropdown(dd => dd
        .addOptions({ ru: 'Русский', en: 'English' })
        .setValue(this.settings.language ?? 'ru')
        .onChange(async (v: any) => {
          this.settings.language = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    // LLM settings
    containerEl.createEl('h3', { text: labels.llmIntegration });

    new Setting(containerEl)
      .setName(labels.useLLM)
      .setDesc(labels.useLLMDesc)
      .addToggle(t => t
        .setValue(this.settings.useLLM)
        .onChange(async v => {
          this.settings.useLLM = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    if (this.settings.useLLM) {
      new Setting(containerEl)
        .setName(labels.llmProvider)
        .setDesc(labels.llmProviderDesc)
        .addDropdown(dd => {
          const options: Record<string, string> = {};
          for (const p of LLM_PROVIDERS) {
            options[p.id] = p.name;
          }
          dd.addOptions(options)
            .setValue(this.settings.llmProvider)
            .onChange(async (v: string) => {
              this.settings.llmProvider = v;
              await this.callbacks.onSettingsChange(this.settings);
              this.display();
            });
        });

      new Setting(containerEl)
        .setName(labels.apiKey)
        .setDesc(labels.apiKeyDesc)
        .addText(t => {
          t.setPlaceholder('sk-...')
            .setValue(this.settings.llmApiKey ?? '')
            .onChange(async v => {
              this.settings.llmApiKey = v;
              await this.callbacks.onSettingsChange(this.settings);
              // Reload models when API key changes
              this.loadModels();
            });
          t.inputEl.type = 'password';
          return t;
        });

      // Button to load models
      new Setting(containerEl)
        .setName(labels.loadAvailableModels)
        .setDesc(labels.loadAvailableModelsDesc)
        .addButton(btn => btn
          .setButtonText(this.isLoadingModels ? labels.loading : labels.loadModels)
          .setDisabled(this.isLoadingModels || !this.settings.llmApiKey)
          .onClick(async () => {
            await this.loadModels();
          }));

      // Model selection dropdown
      if (this.loadedModels.length > 0) {
        new Setting(containerEl)
          .setName(labels.model)
          .setDesc(labels.modelDesc)
          .addDropdown(dd => {
            const options: Record<string, string> = { '': labels.defaultModel };
            for (const model of this.loadedModels) {
              options[model.id] = model.name;
            }
            dd.addOptions(options)
              .setValue(this.settings.llmModel ?? '')
              .onChange(async v => {
                this.settings.llmModel = v;
                await this.callbacks.onSettingsChange(this.settings);
              });
          });
      } else {
        new Setting(containerEl)
          .setName(labels.modelId)
          .setDesc(labels.modelIdDesc)
          .addText(t => t
            .setPlaceholder('gpt-4o-mini')
            .setValue(this.settings.llmModel ?? '')
            .onChange(async v => {
              this.settings.llmModel = v;
              await this.callbacks.onSettingsChange(this.settings);
            }));
      }

      if (this.settings.llmProvider === 'ollama' || this.settings.llmProvider === 'azure') {
        new Setting(containerEl)
          .setName(labels.baseUrl)
          .setDesc(labels.baseUrlDesc)
          .addText(t => t
            .setPlaceholder('http://localhost:11434')
            .setValue(this.settings.llmBaseUrl ?? '')
            .onChange(async v => {
              this.settings.llmBaseUrl = v;
              await this.callbacks.onSettingsChange(this.settings);
            }));
      }

      new Setting(containerEl)
        .setName(labels.includeQuiz)
        .setDesc(labels.includeQuizDesc)
        .addToggle(t => t
          .setValue(this.settings.includeQuiz)
          .onChange(async v => {
            this.settings.includeQuiz = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));
    }

    // Telegram settings
    containerEl.createEl('h3', { text: labels.telegram });

    new Setting(containerEl)
      .setName(labels.enableTelegram)
      .setDesc(labels.enableTelegramDesc)
      .addToggle(t => t
        .setValue(this.settings.telegramEnabled)
        .onChange(async v => {
          this.settings.telegramEnabled = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    if (this.settings.telegramEnabled) {
      new Setting(containerEl)
        .setName(labels.botToken)
        .addText(t => t
          .setPlaceholder('123456:ABC-DEF...')
          .setValue(this.settings.botToken ?? '')
          .onChange(async v => {
            this.settings.botToken = v;
            await this.callbacks.onSettingsChange(this.settings);
          })
          .inputEl.type = 'password');

      new Setting(containerEl)
        .setName(labels.chatId)
        .addText(t => t
          .setPlaceholder('123456789')
          .setValue(this.settings.chatId ?? '')
          .onChange(async v => {
            this.settings.chatId = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));

      new Setting(containerEl)
        .setName(labels.dueReminders)
        .setDesc(labels.dueRemindersDesc)
        .addSlider(s => s
          .setLimits(1, 7, 1)
          .setValue(this.settings.dueReminderDays)
          .setDynamicTooltip()
          .onChange(async v => {
            this.settings.dueReminderDays = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));

      new Setting(containerEl)
        .setName(labels.autoReport)
        .setDesc(labels.autoReportDesc)
        .addToggle(t => t
          .setValue(this.settings.autoReportEnabled)
          .onChange(async v => {
            this.settings.autoReportEnabled = v;
            await this.callbacks.onSettingsChange(this.settings);
            this.display();
          }));

      if (this.settings.autoReportEnabled) {
        new Setting(containerEl)
          .setName(labels.reportFrequency)
          .setDesc(labels.reportFrequencyDesc)
          .addDropdown(dd => dd
            .addOptions(labels.frequencies)
            .setValue(this.settings.autoReportFrequency)
            .onChange(async (v: any) => {
              this.settings.autoReportFrequency = v;
              await this.callbacks.onSettingsChange(this.settings);
            }));

        new Setting(containerEl)
          .setName(labels.reportTime)
          .setDesc(labels.reportTimeDesc)
          .addText(t => t
            .setPlaceholder('20:00')
            .setValue(this.settings.autoReportTime)
            .onChange(async v => {
              this.settings.autoReportTime = v;
              await this.callbacks.onSettingsChange(this.settings);
            }));
      }
    }
  }

  private async loadModels(): Promise<void> {
    if (!this.settings.llmApiKey) {
      return;
    }

    this.isLoadingModels = true;
    this.display(); // Refresh to show loading state

    try {
      const provider = this.callbacks.getLLMProvider();
      if (provider) {
        this.loadedModels = await provider.loadAvailableModels();
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      this.loadedModels = [];
    } finally {
      this.isLoadingModels = false;
      this.display(); // Refresh to show loaded models
    }
  }
}
