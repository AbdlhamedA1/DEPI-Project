import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';

export interface ConversationEntity {
  id: string;
  bookingRequestId: string;
  studentId: string;
  ownerId: string;
  propertyId: string;
  isActive: boolean;
  lastMessageAt?: Date;
  unreadCountStudent: number;
  unreadCountOwner: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole?: string;
  recipientId?: string;
  body: string;
  isRead: boolean;
  readAt?: Date;
  attachmentUrl?: string;
  createdAt: Date;
}

@Injectable()
export class MessagingService {
  private conversations: Map<string, ConversationEntity> = new Map();
  private messages: MessageEntity[] = [];

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {
    this.seedDefaults();
  }

  private seedDefaults() {
    const defaultConv: ConversationEntity = {
      id: 'conv-1',
      bookingRequestId: 'req-101',
      studentId: 'mock-user-1',
      ownerId: 'mock-owner-1',
      propertyId: 'prop-1',
      isActive: true,
      lastMessageAt: new Date('2026-08-15T10:00:00Z'),
      unreadCountStudent: 0,
      unreadCountOwner: 0,
      createdAt: new Date('2026-08-15T09:00:00Z'),
      updatedAt: new Date('2026-08-15T10:00:00Z'),
    };
    this.conversations.set(defaultConv.id, defaultConv);

    this.messages.push({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'mock-owner-1',
      senderRole: 'OWNER',
      recipientId: 'mock-user-1',
      body: 'أهلاً بك يا أحمد، الغرفة متاحة للمعاينة غداً إن شاء الله.',
      isRead: true,
      readAt: new Date('2026-08-15T10:05:00Z'),
      createdAt: new Date('2026-08-15T10:00:00Z'),
    });
  }

  async createConversationForBooking(
    bookingRequestId: string,
    studentId: string,
    ownerId: string,
    propertyId: string,
  ): Promise<ConversationEntity> {
    // Check if one already exists for this booking request
    for (const conv of this.conversations.values()) {
      if (conv.bookingRequestId === bookingRequestId) {
        return conv;
      }
    }

    const newConv: ConversationEntity = {
      id: randomUUID(),
      bookingRequestId,
      studentId,
      ownerId,
      propertyId,
      isActive: true,
      unreadCountStudent: 0,
      unreadCountOwner: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(newConv.id, newConv);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO conversations (id, booking_request_id, student_id, owner_id, property_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (booking_request_id) DO UPDATE SET updated_at = NOW()`,
          [
            newConv.id,
            newConv.bookingRequestId,
            newConv.studentId,
            newConv.ownerId,
            newConv.propertyId,
            newConv.isActive,
            newConv.createdAt,
            newConv.updatedAt,
          ],
        );
      } catch {}
    }

    return newConv;
  }

  async getConversationsForUser(userId: string): Promise<any[]> {
    const userConvs: any[] = [];

    for (const conv of this.conversations.values()) {
      if (conv.studentId === userId || conv.ownerId === userId) {
        const isStudent = conv.studentId === userId;
        const counterpartyId = isStudent ? conv.ownerId : conv.studentId;
        const counterpartyUser = await this.authService.findUserById(counterpartyId);

        const convMessages = this.messages
          .filter(m => m.conversationId === conv.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const lastMsg = convMessages[0];

        userConvs.push({
          ...conv,
          counterparty: {
            id: counterpartyId,
            fullName: counterpartyUser?.fullName || (isStudent ? 'مالك العقار' : 'الطالب'),
            phone: counterpartyUser?.phone || '+201000000000',
            role: isStudent ? 'OWNER' : 'STUDENT',
          },
          lastMessage: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.createdAt } : null,
          unreadCount: isStudent ? conv.unreadCountStudent : conv.unreadCountOwner,
        });
      }
    }

    return userConvs.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() || b.createdAt.getTime()) -
        (a.lastMessageAt?.getTime() || a.createdAt.getTime()),
    );
  }

  async getConversationById(id: string, currentUserId?: string): Promise<any> {
    let conv = this.conversations.get(id);

    if (!conv && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, booking_request_id as "bookingRequestId", student_id as "studentId",
                  owner_id as "ownerId", property_id as "propertyId", is_active as "isActive",
                  last_message_at as "lastMessageAt", unread_count_student as "unreadCountStudent",
                  unread_count_owner as "unreadCountOwner", created_at as "createdAt", updated_at as "updatedAt"
           FROM conversations WHERE id = $1`,
          [id],
        );
        if (res.rows.length > 0) conv = res.rows[0];
      } catch {}
    }

    if (!conv) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    if (currentUserId && conv.studentId !== currentUserId && conv.ownerId !== currentUserId) {
      throw new ForbiddenException('غير مصرح لك بالوصول إلى هذه المحادثة');
    }

    // Prepare mutual contact disclosure (BR-CNT-001 / F23)
    const isStudent = currentUserId ? conv.studentId === currentUserId : true;
    const counterpartyId = isStudent ? conv.ownerId : conv.studentId;
    const counterpartyUser = await this.authService.findUserById(counterpartyId);

    let universityName: string | undefined = undefined;
    if (!isStudent) {
      const studentProfile = this.authService.getStudentProfile(conv.studentId);
      universityName = studentProfile?.universityName || 'جامعة القاهرة';
    }

    const counterpartyContact = {
      id: counterpartyId,
      fullName: counterpartyUser?.fullName || (isStudent ? 'مالك العقار' : 'الطالب'),
      phone: counterpartyUser?.phone || '+201012345678',
      email: counterpartyUser?.email || (isStudent ? 'owner@sakany.eg' : 'student@sakany.eg'),
      ...(universityName ? { university: universityName } : {}),
      // Strictly NO sensitive KYC documents are returned here!
    };

    return {
      ...conv,
      counterpartyContact,
    };
  }

  async getMessages(
    conversationId: string,
    currentUserId?: string,
    limit = 50,
    offset = 0,
  ): Promise<MessageEntity[]> {
    if (currentUserId) {
      const conv = this.conversations.get(conversationId);
      if (conv && conv.studentId !== currentUserId && conv.ownerId !== currentUserId) {
        throw new ForbiddenException('غير مصرح لك بالوصول إلى هذه الرسائل');
      }
    }

    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, conversation_id as "conversationId", sender_id as "senderId",
                  body, is_read as "isRead", read_at as "readAt",
                  attachment_url as "attachmentUrl", created_at as "createdAt"
           FROM messages WHERE conversation_id = $1
           ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
          [conversationId, limit, offset],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }

    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: string,
    body: string,
  ): Promise<MessageEntity> {
    if (!body || !body.trim()) {
      throw new BadRequestException('نص الرسالة لا يمكن أن يكون فارغاً');
    }

    let conv = this.conversations.get(conversationId);
    if (!conv) {
      conv = await this.getConversationById(conversationId);
    }
    if (!conv) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    if (senderId && conv.studentId !== senderId && conv.ownerId !== senderId) {
      throw new ForbiddenException('لا يمكنك إرسال رسائل في هذه المحادثة');
    }

    const isStudent = conv.studentId === senderId;
    const recipientId = isStudent ? conv.ownerId : conv.studentId;

    const newMsg: MessageEntity = {
      id: randomUUID(),
      conversationId,
      senderId,
      senderRole: senderRole || (isStudent ? 'STUDENT' : 'OWNER'),
      recipientId,
      body: body.trim(),
      isRead: false,
      createdAt: new Date(),
    };

    this.messages.push(newMsg);

    // Update conversation metadata
    conv.lastMessageAt = newMsg.createdAt;
    conv.updatedAt = new Date();
    if (isStudent) {
      conv.unreadCountOwner = (conv.unreadCountOwner || 0) + 1;
    } else {
      conv.unreadCountStudent = (conv.unreadCountStudent || 0) + 1;
    }

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, body, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newMsg.id, conversationId, senderId, recipientId, newMsg.body, false, newMsg.createdAt],
        );

        await this.pool.query(
          `UPDATE conversations SET last_message_at = $1, updated_at = NOW() WHERE id = $2`,
          [newMsg.createdAt, conversationId],
        );
      } catch {}
    }

    // Trigger in-app notification for recipient
    try {
      await this.notificationsService.createNotification({
        userId: recipientId,
        type: 'NEW_MESSAGE',
        titleAr: 'رسالة جديدة',
        titleEn: 'New message received',
        bodyAr: `لديك رسالة جديدة: "${newMsg.body.substring(0, 50)}..."`,
        bodyEn: `You have received a new message: "${newMsg.body.substring(0, 50)}..."`,
        data: { conversationId, messageId: newMsg.id },
      });
    } catch {}

    return newMsg;
  }

  async markAsRead(conversationId: string, currentUserId: string): Promise<{ success: boolean }> {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      if (conv.studentId === currentUserId) {
        conv.unreadCountStudent = 0;
      } else if (conv.ownerId === currentUserId) {
        conv.unreadCountOwner = 0;
      }
    }

    this.messages.forEach(m => {
      if (m.conversationId === conversationId && m.senderId !== currentUserId && !m.isRead) {
        m.isRead = true;
        m.readAt = new Date();
      }
    });

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE messages SET is_read = true, read_at = NOW()
           WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
          [conversationId, currentUserId],
        );
      } catch {}
    }

    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    let count = 0;
    for (const conv of this.conversations.values()) {
      if (conv.studentId === userId) count += conv.unreadCountStudent || 0;
      if (conv.ownerId === userId) count += conv.unreadCountOwner || 0;
    }
    return { count };
  }
}
