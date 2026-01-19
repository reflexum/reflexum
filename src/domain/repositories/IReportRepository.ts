export interface IReportRepository {
  ensureReportsDir(): Promise<void>;
  saveReport(path: string, content: string): Promise<void>;
  getReport(path: string): Promise<string | null>;
  reportExists(path: string): Promise<boolean>;
  openReport(path: string): Promise<void>;
}
