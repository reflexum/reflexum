import { Notice } from 'obsidian';
import type { INotificationService } from '../../application/ports/INotificationService';

export class ObsidianNotificationService implements INotificationService {
  showNotice(message: string): void {
    new Notice(message);
  }
}
