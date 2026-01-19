import { App, TFile } from "obsidian";
import type { IReportRepository } from "../../domain/repositories/IReportRepository";

export class ObsidianReportRepository implements IReportRepository {
  private readonly reportsDir = "Reflexum/Reports";

  constructor(private app: App) {}

  async ensureReportsDir(): Promise<void> {
    const exists = await this.app.vault.adapter.exists(this.reportsDir);
    if (!exists) await this.app.vault.adapter.mkdir(this.reportsDir);
  }

  async saveReport(path: string, content: string): Promise<void> {
    await this.app.vault.adapter.write(path, content);
  }

  async getReport(path: string): Promise<string | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return null;
    return await this.app.vault.read(file);
  }

  async reportExists(path: string): Promise<boolean> {
    return await this.app.vault.adapter.exists(path);
  }

  async openReport(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
    }
  }
}
