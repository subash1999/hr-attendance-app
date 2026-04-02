export interface EmailAdapter {
  sendEmail(to: string, subject: string, htmlBody: string): Promise<void>;
}
