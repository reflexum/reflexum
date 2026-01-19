import type { SendReportToTelegramUseCase } from '../../application/usecases/SendReportToTelegramUseCase';
import type { GenerateReportUseCase } from '../../application/usecases/GenerateReportUseCase';

export class AnalyzeAndSendToTelegramCommand {
  constructor(
    private generateReportUseCase: GenerateReportUseCase,
    private sendReportToTelegramUseCase: SendReportToTelegramUseCase,
    private getDateRange: () => { from: number; to: number }
  ) {}

  async execute(): Promise<void> {
    const dateRange = this.getDateRange();
    
    // Сначала генерируем отчет и сохраняем в Obsidian
    await this.generateReportUseCase.execute(dateRange);
    
    // Затем отправляем digest в Telegram
    await this.sendReportToTelegramUseCase.execute(dateRange);
  }
}
