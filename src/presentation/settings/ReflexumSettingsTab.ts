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
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'Reflexum — Study Journal' });

    // Date preset
    new Setting(containerEl)
      .setName('Date preset')
      .addDropdown(dd => dd
        .addOptions({
          last7: 'Last 7 days',
          thisWeek: 'This week',
          thisMonth: 'This month',
          custom: 'Custom'
        })
        .setValue(this.settings.datePreset)
        .onChange(async (v: any) => {
          this.settings.datePreset = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    if (this.settings.datePreset === 'custom') {
      new Setting(containerEl)
        .setName('From')
        .addText(t => t
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.settings.dateFrom ?? '')
          .onChange(async v => {
            this.settings.dateFrom = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));

      new Setting(containerEl)
        .setName('To')
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
      .setName('Language')
      .addDropdown(dd => dd
        .addOptions({ ru: 'Русский', en: 'English' })
        .setValue(this.settings.language ?? 'ru')
        .onChange(async (v: any) => {
          this.settings.language = v;
          await this.callbacks.onSettingsChange(this.settings);
        }));

    // LLM settings
    containerEl.createEl('h3', { text: 'LLM Integration' });

    new Setting(containerEl)
      .setName('Use LLM')
      .setDesc('Enable AI-powered insights and quiz generation')
      .addToggle(t => t
        .setValue(this.settings.useLLM)
        .onChange(async v => {
          this.settings.useLLM = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    if (this.settings.useLLM) {
      new Setting(containerEl)
        .setName('LLM Provider')
        .setDesc('Choose your AI provider')
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
        .setName('API Key')
        .setDesc('Your API key for the selected provider')
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
        .setName('Load available models')
        .setDesc('Fetch list of models from the provider')
        .addButton(btn => btn
          .setButtonText(this.isLoadingModels ? 'Loading...' : 'Load Models')
          .setDisabled(this.isLoadingModels || !this.settings.llmApiKey)
          .onClick(async () => {
            await this.loadModels();
          }));

      // Model selection dropdown
      if (this.loadedModels.length > 0) {
        new Setting(containerEl)
          .setName('Model')
          .setDesc('Select a specific model')
          .addDropdown(dd => {
            const options: Record<string, string> = { '': 'Default (first available)' };
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
          .setName('Model ID (optional)')
          .setDesc('Specific model to use (e.g., gpt-4o-mini). Leave empty for default or load models above.')
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
          .setName('Base URL')
          .setDesc('Custom endpoint URL (for Ollama/Azure)')
          .addText(t => t
            .setPlaceholder('http://localhost:11434')
            .setValue(this.settings.llmBaseUrl ?? '')
            .onChange(async v => {
              this.settings.llmBaseUrl = v;
              await this.callbacks.onSettingsChange(this.settings);
            }));
      }

      new Setting(containerEl)
        .setName('Include mini-quiz')
        .setDesc('Generate quiz questions in reports')
        .addToggle(t => t
          .setValue(this.settings.includeQuiz)
          .onChange(async v => {
            this.settings.includeQuiz = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));
    }

    // Telegram settings
    containerEl.createEl('h3', { text: 'Telegram' });

    new Setting(containerEl)
      .setName('Enable Telegram')
      .setDesc('Send reports and notifications to Telegram')
      .addToggle(t => t
        .setValue(this.settings.telegramEnabled)
        .onChange(async v => {
          this.settings.telegramEnabled = v;
          await this.callbacks.onSettingsChange(this.settings);
          this.display();
        }));

    if (this.settings.telegramEnabled) {
      new Setting(containerEl)
        .setName('Bot token')
        .addText(t => t
          .setPlaceholder('123456:ABC-DEF...')
          .setValue(this.settings.botToken ?? '')
          .onChange(async v => {
            this.settings.botToken = v;
            await this.callbacks.onSettingsChange(this.settings);
          })
          .inputEl.type = 'password');

      new Setting(containerEl)
        .setName('Chat ID')
        .addText(t => t
          .setPlaceholder('123456789')
          .setValue(this.settings.chatId ?? '')
          .onChange(async v => {
            this.settings.chatId = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));

      new Setting(containerEl)
        .setName('Due reminders (days ahead)')
        .setDesc('Send reminders for assignments due within N days')
        .addSlider(s => s
          .setLimits(1, 7, 1)
          .setValue(this.settings.dueReminderDays)
          .setDynamicTooltip()
          .onChange(async v => {
            this.settings.dueReminderDays = v;
            await this.callbacks.onSettingsChange(this.settings);
          }));

      new Setting(containerEl)
        .setName('Auto-report to Telegram')
        .setDesc('Automatically generate and send reports to Telegram')
        .addToggle(t => t
          .setValue(this.settings.autoReportEnabled)
          .onChange(async v => {
            this.settings.autoReportEnabled = v;
            await this.callbacks.onSettingsChange(this.settings);
            this.display();
          }));

      if (this.settings.autoReportEnabled) {
        new Setting(containerEl)
          .setName('Report frequency')
          .setDesc('How often to send automatic reports')
          .addDropdown(dd => dd
            .addOptions({
              daily: 'Daily',
              weekly: 'Weekly (Sunday)',
              monthly: 'Monthly (last day)'
            })
            .setValue(this.settings.autoReportFrequency)
            .onChange(async (v: any) => {
              this.settings.autoReportFrequency = v;
              await this.callbacks.onSettingsChange(this.settings);
            }));

        new Setting(containerEl)
          .setName('Report time')
          .setDesc('Time to send reports (HH:mm format, 24h)')
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
