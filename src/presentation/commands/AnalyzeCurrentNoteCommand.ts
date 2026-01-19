import type { GenerateCurrentNoteReportUseCase } from '../../application/usecases/GenerateCurrentNoteReportUseCase';

export class AnalyzeCurrentNoteCommand {
  constructor(
    private generateCurrentNoteReportUseCase: GenerateCurrentNoteReportUseCase
  ) {}

  async execute(): Promise<void> {
    await this.generateCurrentNoteReportUseCase.execute();
  }
}
