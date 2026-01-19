import type { IMessengerService } from '../../application/ports/IMessengerService';

export class TelegramService implements IMessengerService {
  constructor(
    private botToken: string,
    private chatId: string
  ) {}

  async sendMessage(text: string): Promise<void> {
    const body: any = {
      chat_id: this.chatId,
      text: text,
      parse_mode: 'MarkdownV2',
    };

    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Telegram message send error:", t);
      throw new Error(`Telegram error (${res.status}): ${t}`);
    }
  }

  async sendDocument(filename: string, data: ArrayBuffer, caption?: string): Promise<void> {
    throw new Error('Document sending not supported.');
  }
}
