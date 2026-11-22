import { Injectable, Logger } from '@nestjs/common';

export interface ISmsGateway {
  sendSms(phone: string, message: string): Promise<boolean>;
}

@Injectable()
export class SmsService implements ISmsGateway {
  private readonly logger = new Logger(SmsService.name);
  private readonly sentMessages: Array<{
    phone: string;
    message: string;
    sentAt: Date;
  }> = [];

  async sendSms(phone: string, message: string): Promise<boolean> {
    this.sentMessages.push({
      phone,
      message,
      sentAt: new Date(),
    });

    this.logger.log(`[SMS Gateway Mock] Dispatched SMS to ${phone}: "${message}"`);
    return true;
  }

  getLastMessageForPhone(phone: string): string | undefined {
    const msgs = this.sentMessages.filter(m => m.phone === phone);
    return msgs.length > 0 ? msgs[msgs.length - 1].message : undefined;
  }

  getAllSentMessages(): Array<{ phone: string; message: string; sentAt: Date }> {
    return [...this.sentMessages];
  }
}
