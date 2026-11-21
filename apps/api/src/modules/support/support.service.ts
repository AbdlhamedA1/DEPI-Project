import { Injectable } from '@nestjs/common';

@Injectable()
export class SupportService {
  async submitTicket(data: any) {
    return {
      id: `ticket-${Date.now()}`,
      status: 'OPEN',
      ...data,
      createdAt: new Date().toISOString(),
    };
  }
}
