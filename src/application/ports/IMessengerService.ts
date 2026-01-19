export interface IMessengerService {
  sendMessage(text: string): Promise<void>;
  sendDocument(filename: string, data: ArrayBuffer, caption?: string): Promise<void>;
}
