import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { SmsService } from '../../common/services/sms.service';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'mock-user-1',
      type: 'BOOKING_REQUEST',
      titleAr: 'تم قبول طلب الحجز',
      titleEn: 'Booking Request Accepted',
      bodyAr: 'وافق المالك على طلبك، يمكنك استكمال تأكيد العقد الآن.',
      bodyEn: 'The owner accepted your request. You can now complete agreement confirmation.',
      data: { bookingRequestId: 'req-101' },
      isRead: false,
      createdAt: new Date(),
    },
  ];

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
    @Optional()
    private readonly smsService?: SmsService,
  ) {}

  async createNotification(dto: {
    userId: string;
    type: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    data?: Record<string, unknown>;
    phone?: string;
  }): Promise<NotificationItem> {
    const item: NotificationItem = {
      id: randomUUID(),
      userId: dto.userId,
      type: dto.type,
      titleAr: dto.titleAr,
      titleEn: dto.titleEn,
      bodyAr: dto.bodyAr,
      bodyEn: dto.bodyEn,
      data: dto.data || {},
      isRead: false,
      createdAt: new Date(),
    };

    this.notifications.unshift(item);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO notifications (id, user_id, type, title_ar, title_en, body_ar, body_en, data, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            item.id,
            item.userId,
            item.type,
            item.titleAr,
            item.titleEn,
            item.bodyAr,
            item.bodyEn,
            JSON.stringify(item.data),
            item.isRead,
            item.createdAt,
          ],
        );
      } catch {}
    }

    // Optional SMS alert dispatching
    if (dto.phone && this.smsService) {
      try {
        await this.smsService.sendSms(dto.phone, `${dto.titleAr} - ${dto.bodyAr}`);
      } catch {}
    }

    return item;
  }

  async getByUser(
    userId: string,
    filter?: { isRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationItem[]> {
    if (this.pool) {
      try {
        let query = `SELECT id, user_id as "userId", type, title_ar as "titleAr", title_en as "titleEn",
                            body_ar as "bodyAr", body_en as "bodyEn", data, is_read as "isRead",
                            read_at as "readAt", created_at as "createdAt"
                     FROM notifications WHERE user_id = $1`;
        const params: any[] = [userId];

        if (filter?.isRead !== undefined) {
          params.push(filter.isRead);
          query += ` AND is_read = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(filter?.limit || 50, filter?.offset || 0);

        const res = await this.pool.query(query, params);
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }

    return this.notifications.filter(n => {
      if (n.userId !== userId) return false;
      if (filter?.isRead !== undefined && n.isRead !== filter.isRead) return false;
      return true;
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = false`,
          [userId],
        );
        return res.rows[0]?.count ?? 0;
      } catch {}
    }

    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  async markAsRead(id: string, userId?: string): Promise<NotificationItem> {
    const item = this.notifications.find(n => n.id === id && (!userId || n.userId === userId));
    if (item) {
      item.isRead = true;
      item.readAt = new Date();
    }

    if (this.pool) {
      try {
        let query = `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1`;
        const params: any[] = [id];
        if (userId) {
          query += ` AND user_id = $2`;
          params.push(userId);
        }
        await this.pool.query(query, params);
      } catch {}
    }

    if (!item) {
      // Return synthetic item if not in memory
      return {
        id,
        userId: userId || 'unknown',
        type: 'STATUS_UPDATE',
        titleAr: 'تم تحديث الإشعار',
        titleEn: 'Notification updated',
        bodyAr: '',
        bodyEn: '',
        data: {},
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
      };
    }
    return item;
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    let count = 0;
    this.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        count++;
      }
    });

    if (this.pool) {
      try {
        const res = await this.pool.query(
          `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
          [userId],
        );
        count = res.rowCount || count;
      } catch {}
    }

    return { success: true, count };
  }
}
