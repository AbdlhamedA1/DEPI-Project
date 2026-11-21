import { Injectable } from '@nestjs/common';

@Injectable()
export class MessagingService {
  private messages = [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'mock-owner-1',
      senderRole: 'OWNER',
      body: 'أهلاً بك يا أحمد، الغرفة متاحة للمعاينة غداً إن شاء الله.',
      createdAt: new Date().toISOString(),
    },
  ];

  async getMessages(conversationId: string) {
    return this.messages.filter(m => m.conversationId === conversationId);
  }

  async sendMessage(conversationId: string, senderId: string, senderRole: string, body: string) {
    const newMsg = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      senderRole,
      body,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }
}
