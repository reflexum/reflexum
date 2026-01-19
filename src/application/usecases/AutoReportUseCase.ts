import type { GenerateReportUseCase } from './GenerateReportUseCase';
import type { SendReportToTelegramUseCase } from './SendReportToTelegramUseCase';
import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';

export class AutoReportUseCase {
  constructor(
    private generateReportUseCase: GenerateReportUseCase,
    private sendReportToTelegramUseCase: SendReportToTelegramUseCase,
    private settingsRepo: ISettingsRepository
  ) {}

  async execute(): Promise<void> {
    const settings = await this.settingsRepo.load();

    if (!settings.autoReportEnabled || !settings.telegramEnabled) {
      return;
    }

    const dateRange = this.calculateDateRange(settings.autoReportFrequency);

    // Генерируем отчет (но не открываем в Obsidian - это автоматическое действие)
    await this.generateReportUseCase.execute(dateRange);

    // Отправляем в Telegram
    await this.sendReportToTelegramUseCase.execute(dateRange);
    
    // Сохраняем метку времени последней отправки
    settings.lastAutoReportDate = new Date().toISOString();
    await this.settingsRepo.save(settings);
  }

  shouldSendReport(settings: any): boolean {
    if (!settings.autoReportEnabled || !settings.telegramEnabled) {
      return false;
    }

    const now = new Date();
    
    // Если отчет ещё никогда не отправлялся - отправить
    if (!settings.lastAutoReportDate) {
      return this.isTimeToSend(now, settings);
    }

    const lastSent = new Date(settings.lastAutoReportDate);
    
    // Проверяем, нужно ли отправить отчет на основе frequency
    if (settings.autoReportFrequency === 'daily') {
      // Если последний отчет был вчера или раньше, и сейчас подходящее время
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      return lastSent < yesterday && this.isTimeToSend(now, settings);
    } else if (settings.autoReportFrequency === 'weekly') {
      // Если прошло воскресенье с последней отправки, и сейчас воскресенье после нужного времени
      const lastSunday = this.getLastSunday(now);
      
      return lastSent < lastSunday && now.getDay() === 0 && this.isTimeToSend(now, settings);
    } else if (settings.autoReportFrequency === 'monthly') {
      // Если прошёл последний день месяца с последней отправки
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      lastDayOfLastMonth.setHours(23, 59, 59, 999);
      
      const isLastDayOfMonth = this.isLastDayOfMonth(now);
      
      return lastSent < lastDayOfLastMonth && isLastDayOfMonth && this.isTimeToSend(now, settings);
    }

    return false;
  }

  private isTimeToSend(now: Date, settings: any): boolean {
    const [targetHour, targetMinute] = settings.autoReportTime.split(':').map(Number);
    return now.getHours() >= targetHour;
  }

  private getLastSunday(date: Date): Date {
    const lastSunday = new Date(date);
    lastSunday.setDate(date.getDate() - date.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    return lastSunday;
  }

  private isLastDayOfMonth(date: Date): boolean {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    return tomorrow.getMonth() !== date.getMonth();
  }

  private calculateDateRange(frequency: "daily" | "weekly" | "monthly"): { from: number; to: number } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
    let start: number;

    if (frequency === "daily") {
      // Вчерашний день
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      start = yesterday.getTime();
    } else if (frequency === "weekly") {
      // Прошлая неделя (понедельник - воскресенье)
      const lastSunday = new Date(now);
      lastSunday.setDate(now.getDate() - now.getDay()); // Последнее воскресенье
      lastSunday.setHours(23, 59, 59, 999);
      
      const lastMonday = new Date(lastSunday);
      lastMonday.setDate(lastSunday.getDate() - 6);
      lastMonday.setHours(0, 0, 0, 0);
      
      start = lastMonday.getTime();
      return { from: start, to: lastSunday.getTime() };
    } else {
      // Прошлый месяц
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      lastDayOfLastMonth.setHours(23, 59, 59, 999);
      
      start = lastMonth.getTime();
      return { from: start, to: lastDayOfLastMonth.getTime() };
    }

    return { from: start, to: end };
  }
}
