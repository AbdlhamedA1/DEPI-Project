import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { AvailabilityService } from '../availability/availability.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { PropertiesService } from '../properties/properties.service';
import { BookingStatus, PricingUnit, DurationUnit } from '@repo/shared-types';

export interface BookingRequestEntity {
  id: string;
  studentId: string;
  ownerId: string;
  propertyId: string;
  unitId?: string;
  roomId?: string;
  bedId?: string;
  targetType: string;
  targetId: string;
  pricingUnit: PricingUnit;
  durationUnit: DurationUnit;
  agreedPrice: number;
  depositAmount: number;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  notes?: string;
  cancellationReason?: string;
  rejectedReason?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class BookingRequestsService {
  private requests: BookingRequestEntity[] = [
    {
      id: 'req-101',
      studentId: 'mock-user-1',
      ownerId: 'mock-owner-1',
      propertyId: 'prop-1',
      unitId: 'unit-1',
      roomId: 'room-1',
      targetType: 'ROOM',
      targetId: 'room-1',
      pricingUnit: PricingUnit.PER_ROOM,
      durationUnit: DurationUnit.MONTHLY,
      agreedPrice: 3500,
      depositAmount: 3500,
      status: BookingStatus.PENDING,
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      createdAt: '2026-08-15T09:00:00Z',
      updatedAt: '2026-08-15T09:00:00Z',
    },
  ];

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly messagingService: MessagingService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
    @Optional()
    private readonly propertiesService?: PropertiesService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findByStudent(studentId: string): Promise<BookingRequestEntity[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, student_id as "studentId", owner_id as "ownerId", property_id as "propertyId",
                  unit_id as "unitId", room_id as "roomId", bed_id as "bedId", target_type as "targetType",
                  target_id as "targetId", pricing_unit as "pricingUnit", duration_unit as "durationUnit",
                  agreed_price as "agreedPrice", deposit_amount as "depositAmount", status,
                  start_date as "startDate", end_date as "endDate", notes, cancellation_reason as "cancellationReason",
                  rejected_reason as "rejectedReason", expires_at as "expiresAt",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM booking_requests WHERE student_id = $1 ORDER BY created_at DESC`,
          [studentId],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }

    return this.requests.filter(r => r.studentId === studentId);
  }

  async findByOwner(ownerId: string): Promise<BookingRequestEntity[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, student_id as "studentId", owner_id as "ownerId", property_id as "propertyId",
                  unit_id as "unitId", room_id as "roomId", bed_id as "bedId", target_type as "targetType",
                  target_id as "targetId", pricing_unit as "pricingUnit", duration_unit as "durationUnit",
                  agreed_price as "agreedPrice", deposit_amount as "depositAmount", status,
                  start_date as "startDate", end_date as "endDate", notes, cancellation_reason as "cancellationReason",
                  rejected_reason as "rejectedReason", expires_at as "expiresAt",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM booking_requests WHERE owner_id = $1 ORDER BY created_at DESC`,
          [ownerId],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }

    return this.requests.filter(r => r.ownerId === ownerId);
  }

  async findById(id: string): Promise<BookingRequestEntity> {
    const req = this.requests.find(r => r.id === id);
    if (req) return req;

    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, student_id as "studentId", owner_id as "ownerId", property_id as "propertyId",
                  unit_id as "unitId", room_id as "roomId", bed_id as "bedId", target_type as "targetType",
                  target_id as "targetId", pricing_unit as "pricingUnit", duration_unit as "durationUnit",
                  agreed_price as "agreedPrice", deposit_amount as "depositAmount", status,
                  start_date as "startDate", end_date as "endDate", notes, cancellation_reason as "cancellationReason",
                  rejected_reason as "rejectedReason", expires_at as "expiresAt",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM booking_requests WHERE id = $1`,
          [id],
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch {}
    }

    throw new NotFoundException('طلب الحجز غير موجود');
  }

  async create(data: any, currentUser?: any): Promise<any> {
    const studentId = currentUser?.id || data.studentId || 'mock-user-1';

    // 1. Business Rule BR-BKG-002: Check for existing CONFIRMED booking
    const studentRequests = await this.findByStudent(studentId);
    const hasConfirmedBooking = studentRequests.some(r => r.status === BookingStatus.CONFIRMED);
    if (hasConfirmedBooking) {
      throw new ConflictException({
        code: 'ERR_STUDENT_HAS_CONFIRMED_BOOKING',
        message: 'لديك حجز مؤكد بالفعل، لا يمكن تقديم طلب حجز جديد',
      });
    }

    // 2. Business Rule BR-BKG-001: Max 3 open booking requests (PENDING or ACCEPTED)
    const openRequests = studentRequests.filter(
      r => r.status === BookingStatus.PENDING || r.status === BookingStatus.ACCEPTED,
    );
    if (openRequests.length >= 3) {
      throw new BadRequestException({
        code: 'ERR_MAX_OPEN_REQUESTS_REACHED',
        message: 'لا يمكنك تقديم أكثر من 3 طلبات حجز مفتوحة في نفس الوقت',
      });
    }

    // 3. Resolve target entity and portion
    let targetType = 'PROPERTY';
    let targetId = data.propertyId;

    if (data.bedId) {
      targetType = 'BED';
      targetId = data.bedId;
    } else if (data.roomId) {
      targetType = 'ROOM';
      targetId = data.roomId;
    } else if (data.unitId) {
      targetType = 'UNIT';
      targetId = data.unitId;
    } else if (data.targetType && data.targetId) {
      targetType = data.targetType;
      targetId = data.targetId;
    }

    // 4. Check availability for target portion
    const avail = await this.availabilityService.getStatus(targetType, targetId);
    if (avail.status !== 'AVAILABLE') {
      throw new BadRequestException({
        code: 'ERR_PORTION_NOT_AVAILABLE',
        message: 'الوحدة أو الجزء المطلوب غير متاح حالياً للحجز',
      });
    }

    // Resolve ownerId
    let ownerId = data.ownerId || 'mock-owner-1';
    if (!data.ownerId && this.propertiesService && data.propertyId) {
      try {
        const prop = await this.propertiesService.findById(data.propertyId);
        if (prop?.ownerId) ownerId = prop.ownerId;
      } catch {}
    }

    const newReq: BookingRequestEntity = {
      id: randomUUID(),
      studentId,
      ownerId,
      propertyId: data.propertyId || 'prop-1',
      unitId: data.unitId,
      roomId: data.roomId,
      bedId: data.bedId,
      targetType,
      targetId,
      pricingUnit: data.pricingUnit || PricingUnit.PER_ROOM,
      durationUnit: data.durationUnit || DurationUnit.MONTHLY,
      agreedPrice: Number(data.agreedPrice || 3500),
      depositAmount: Number(data.depositAmount || data.agreedPrice || 3500),
      status: BookingStatus.PENDING,
      startDate:
        typeof data.startDate === 'object'
          ? data.startDate.toISOString().split('T')[0]
          : data.startDate,
      endDate:
        typeof data.endDate === 'object' ? data.endDate.toISOString().split('T')[0] : data.endDate,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.requests.unshift(newReq);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO booking_requests (
            id, student_id, owner_id, property_id, unit_id, room_id, bed_id,
            target_type, target_id, pricing_unit, duration_unit, agreed_price,
            deposit_amount, status, start_date, end_date, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            newReq.id,
            newReq.studentId,
            newReq.ownerId,
            newReq.propertyId,
            newReq.unitId || null,
            newReq.roomId || null,
            newReq.bedId || null,
            newReq.targetType,
            newReq.targetId,
            newReq.pricingUnit,
            newReq.durationUnit,
            newReq.agreedPrice,
            newReq.depositAmount,
            newReq.status,
            newReq.startDate,
            newReq.endDate,
            newReq.notes || null,
            newReq.createdAt,
            newReq.updatedAt,
          ],
        );
      } catch {}
    }

    // 5. Automatically create 1:1 conversation thread (BR-MSG-001)
    try {
      await this.messagingService.createConversationForBooking(
        newReq.id,
        newReq.studentId,
        newReq.ownerId,
        newReq.propertyId,
      );
    } catch {}

    // 6. Dispatch notification to Owner
    try {
      await this.notificationsService.createNotification({
        userId: newReq.ownerId,
        type: 'BOOKING_REQUEST',
        titleAr: 'طلب حجز جديد',
        titleEn: 'New booking request',
        bodyAr: `تم استلام طلب حجز جديد لعقارك من أحد الطلاب`,
        bodyEn: `A new booking request has been submitted for your property`,
        data: { bookingRequestId: newReq.id, propertyId: newReq.propertyId },
      });
    } catch {}

    // 7. Return with instant contact disclosure transparency (BR-BKG-003)
    const ownerUser = await this.authService.findUserById(ownerId);
    return {
      ...newReq,
      contactDisclosure: {
        owner: {
          fullName: ownerUser?.fullName || 'مالك العقار',
          phone: ownerUser?.phone || '+201012345678',
          email: ownerUser?.email || 'owner@sakany.eg',
        },
      },
    };
  }

  async accept(id: string, currentUserId?: string): Promise<BookingRequestEntity> {
    const req = await this.findById(id);

    if (currentUserId && req.ownerId !== currentUserId) {
      throw new ForbiddenException('فقط مالك العقار يمكنه قبول طلب الحجز');
    }

    if (req.status !== BookingStatus.PENDING) {
      throw new BadRequestException('لا يمكن قبول طلب غير معلق');
    }

    req.status = BookingStatus.ACCEPTED;
    req.updatedAt = new Date().toISOString();

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE booking_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
          [BookingStatus.ACCEPTED, id],
        );
      } catch {}
    }

    // Notify student
    try {
      await this.notificationsService.createNotification({
        userId: req.studentId,
        type: 'BOOKING_ACCEPTED',
        titleAr: 'تم قبول طلب الحجز',
        titleEn: 'Booking request accepted',
        bodyAr: 'وافق المالك على طلب الحجز، يمكنك الآن استكمال تأكيد العقد.',
        bodyEn:
          'The owner accepted your booking request. You can now complete agreement confirmation.',
        data: { bookingRequestId: req.id },
      });
    } catch {}

    return req;
  }

  async reject(id: string, currentUserId?: string, reason?: string): Promise<BookingRequestEntity> {
    const req = await this.findById(id);

    if (currentUserId && req.ownerId !== currentUserId) {
      throw new ForbiddenException('فقط مالك العقار يمكنه رفض طلب الحجز');
    }

    if (req.status !== BookingStatus.PENDING) {
      throw new BadRequestException('لا يمكن رفض طلب غير معلق');
    }

    req.status = BookingStatus.REJECTED;
    req.rejectedReason = reason;
    req.updatedAt = new Date().toISOString();

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE booking_requests SET status = $1, rejected_reason = $2, updated_at = NOW() WHERE id = $3`,
          [BookingStatus.REJECTED, reason || null, id],
        );
      } catch {}
    }

    // Notify student
    try {
      await this.notificationsService.createNotification({
        userId: req.studentId,
        type: 'BOOKING_REJECTED',
        titleAr: 'تم رفض طلب الحجز',
        titleEn: 'Booking request rejected',
        bodyAr: 'نأسف، تم رفض طلب الحجز الخاص بك من قبل المالك.',
        bodyEn: 'Sorry, your booking request was rejected by the owner.',
        data: { bookingRequestId: req.id },
      });
    } catch {}

    return req;
  }

  async cancel(id: string, currentUserId?: string, reason?: string): Promise<BookingRequestEntity> {
    const req = await this.findById(id);

    if (currentUserId && req.studentId !== currentUserId) {
      throw new ForbiddenException('فقط الطالب صاحب الطلب يمكنه إلغاء طلبه');
    }

    if (req.status !== BookingStatus.PENDING && req.status !== BookingStatus.ACCEPTED) {
      throw new BadRequestException('لا يمكن إلغاء طلب تم تأكيده أو إغلاقه بالفعل');
    }

    req.status = BookingStatus.CANCELLED;
    req.cancellationReason = reason;
    req.updatedAt = new Date().toISOString();

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE booking_requests SET status = $1, cancellation_reason = $2, updated_at = NOW() WHERE id = $3`,
          [BookingStatus.CANCELLED, reason || null, id],
        );
      } catch {}
    }

    // Notify owner
    try {
      await this.notificationsService.createNotification({
        userId: req.ownerId,
        type: 'STATUS_UPDATE',
        titleAr: 'إلغاء طلب الحجز',
        titleEn: 'Booking request cancelled',
        bodyAr: 'قام الطالب بإلغاء طلب الحجز.',
        bodyEn: 'The student has cancelled their booking request.',
        data: { bookingRequestId: req.id },
      });
    } catch {}

    return req;
  }

  async updateStatus(id: string, status: string, reason?: string): Promise<BookingRequestEntity> {
    const req = await this.findById(id);
    req.status = status as BookingStatus;
    if (reason) {
      if (status === BookingStatus.CANCELLED) req.cancellationReason = reason;
      if (status === BookingStatus.REJECTED) req.rejectedReason = reason;
    }
    req.updatedAt = new Date().toISOString();

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE booking_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
          [status, id],
        );
      } catch {}
    }

    return req;
  }

  getAllRequests(): BookingRequestEntity[] {
    return this.requests;
  }
}
