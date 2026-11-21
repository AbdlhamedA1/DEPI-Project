import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private notifications = [
    {
      id: 'notif-1',
      userId: 'mock-user-1',
      title: 'تم قبول طلب الحجز',
      body: 'وافق المالك على طلبك، يمكنك استكمال تأكيد العقد الآن.',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];

  async getByUser(userId: string) {
    return this.notifications.filter(n => n.userId === userId);
  }

  async markAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
    return notif;
  }
}
