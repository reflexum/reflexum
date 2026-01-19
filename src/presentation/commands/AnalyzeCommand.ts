import type { GenerateReportUseCase } from '../../application/usecases/GenerateReportUseCase';
import type { ReflexumSettings } from '../../domain/entities/Settings';

export class AnalyzeCommand {
  constructor(
    private generateReportUseCase: GenerateReportUseCase,
    private getDateRange: () => { from: number; to: number }
  ) {}

  async execute(): Promise<void> {
    const dateRange = this.getDateRange();
    await this.generateReportUseCase.execute(dateRange);
  }
}
