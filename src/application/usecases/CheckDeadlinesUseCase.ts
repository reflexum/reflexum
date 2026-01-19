import type { INotesRepository } from '../../domain/repositories/INotesRepository';
import type { IMessengerService } from '../ports/IMessengerService';
import type { INotificationService } from '../ports/INotificationService';

export class CheckDeadlinesUseCase {
  constructor(
    private notesRepo: INotesRepository,
    private getMessengerService: () => IMessengerService | null,
    private notificationService: INotificationService
  ) {}

  async execute(daysAhead: number): Promise<void> {
    try {
      const messengerService = this.getMessengerService();
      if (!messengerService) return;

      const soon = await this.collectDeadlinesSoon(daysAhead);
      
      if (soon.length === 0) return;

      const lines = soon.map(s => 
        `• ${s.course ?? "—"} — ${s.title ?? "—"} — ${s.due} (прогресс: ${s.progress}%)`
      );
      const text = "⏳ Ближайшие дедлайны:\n" + lines.join("\n");

      await messengerService.sendMessage(text);
    } catch (error) {
      console.error('Check deadlines error:', error);
    }
  }

  private async collectDeadlinesSoon(daysAhead: number): Promise<any[]> {
    const allFiles = await this.notesRepo.getMarkdownFiles();
    const assignments = [];

    for (const fileInfo of allFiles) {
      const content = await this.notesRepo.readNote(fileInfo.path);
      const assignment = await this.notesRepo.parseNoteToAssignment(fileInfo.path, content);
      if (assignment) assignments.push(assignment);
    }

    const today = new Date();
    const limit = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return assignments.filter(a => {
      if (!a.due || a.progress >= 100) return false;
      const d = new Date(a.due);
      return !isNaN(d.getTime()) && d >= today && d <= limit;
    });
  }
}
