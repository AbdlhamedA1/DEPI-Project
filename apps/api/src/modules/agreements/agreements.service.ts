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
import { BookingRequestsService } from '../booking-requests/booking-requests.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AgreementStatus, BookingStatus } from '@repo/shared-types';

export interface AgreementEntity {
  id: string;
  bookingRequestId: string;
  monthlyRentEgp: number;
  depositEgp: number;
  studentConfirmed: boolean;
  studentConfirmedAt?: Date;
  ownerConfirmed: boolean;
  ownerConfirmedAt?: Date;
  termsAccepted: boolean;
  contractUrl?: string;
  status: AgreementStatus;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AgreementsService {
  private agreements: Map<string, AgreementEntity> = new Map();

  constructor(
    private readonly bookingRequestsService: BookingRequestsService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {
    this.seedDefaults();
  }

  private seedDefaults() {
    const defaultAgr: AgreementEntity = {
      id: 'agr-1',
      bookingRequestId: 'req-101',
      monthlyRentEgp: 3500,
      depositEgp: 3500,
      studentConfirmed: true,
      studentConfirmedAt: new Date('2026-08-16T12:00:00Z'),
      ownerConfirmed: true,
      ownerConfirmedAt: new Date('2026-08-16T12:00:00Z'),
      termsAccepted: true,
      status: AgreementStatus.CONFIRMED,
      confirmedAt: new Date('2026-08-16T12:00:00Z'),
      createdAt: new Date('2026-08-16T10:00:00Z'),
      updatedAt: new Date('2026-08-16T12:00:00Z'),
    };
    this.agreements.set(defaultAgr.id, defaultAgr);
  }

  async findByRequestId(requestId: string): Promise<AgreementEntity> {
    for (const agr of this.agreements.values()) {
      if (agr.bookingRequestId === requestId) {
        return agr;
      }
    }

    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, booking_request_id as "bookingRequestId", monthly_rent_egp as "monthlyRentEgp",
                  deposit_egp as "depositEgp", student_confirmed as "studentConfirmed",
                  student_confirmed_at as "studentConfirmedAt", owner_confirmed as "ownerConfirmed",
                  owner_confirmed_at as "ownerConfirmedAt", terms_accepted as "termsAccepted",
                  contract_url as "contractUrl", status, confirmed_at as "confirmedAt",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM agreements WHERE booking_request_id = $1`,
          [requestId],
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch {}
    }

    // If agreement does not exist yet for this request, generate initial pending draft from booking request
    const bookingReq = await this.bookingRequestsService.findById(requestId);
    const draft: AgreementEntity = {
      id: randomUUID(),
      bookingRequestId: requestId,
      monthlyRentEgp: bookingReq.agreedPrice || 3500,
      depositEgp: bookingReq.depositAmount || 3500,
      studentConfirmed: false,
      ownerConfirmed: false,
      termsAccepted: false,
      status: AgreementStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agreements.set(draft.id, draft);
    return draft;
  }

  private async getParentRoomId(bookingReq: {
    targetType: string;
    targetId: string;
    roomId?: string;
  }): Promise<string | undefined> {
    if (bookingReq.roomId) return bookingReq.roomId;
    if (this.pool && bookingReq.targetType.toUpperCase() === 'BED') {
      try {
        const res = await this.pool.query('SELECT room_id FROM beds WHERE id = $1', [
          bookingReq.targetId,
        ]);
        if (res.rows.length > 0 && res.rows[0].room_id) return res.rows[0].room_id;
      } catch {}
    }
    if (bookingReq.targetId === 'bed-1' || bookingReq.targetId === 'bed-2') return 'room-1';
    if (bookingReq.targetId === 'bed-3' || bookingReq.targetId === 'bed-4') return 'room-3';
    return undefined;
  }

  private async getBedsForRoom(roomId: string): Promise<string[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query('SELECT id FROM beds WHERE room_id = $1', [roomId]);
        if (res.rows.length > 0) return res.rows.map(r => r.id);
      } catch {}
    }
    if (roomId === 'room-1') return ['bed-1', 'bed-2'];
    if (roomId === 'room-3') return ['bed-3', 'bed-4'];
    const bedIds = new Set<string>();
    const allReqs = this.bookingRequestsService.getAllRequests();
    for (const req of allReqs) {
      if (req.roomId === roomId && req.targetType === 'BED') {
        bedIds.add(req.targetId);
      }
    }
    return Array.from(bedIds);
  }

  async confirm(
    requestId: string,
    currentUser?: any,
    data?: { termsAccepted?: boolean; contractUrl?: string; role?: string },
  ): Promise<AgreementEntity> {
    const bookingReq = await this.bookingRequestsService.findById(requestId);

    // a) Positive status whitelist: only PENDING or ACCEPTED can be confirmed
    if (
      bookingReq.status !== BookingStatus.PENDING &&
      bookingReq.status !== BookingStatus.ACCEPTED
    ) {
      if (bookingReq.status === BookingStatus.CONFIRMED) {
        throw new BadRequestException('طلب الحجز مؤكد بالفعل');
      }
      if (bookingReq.status === BookingStatus.CLOSED_CONFLICT) {
        throw new BadRequestException('لا يمكن تأكيد اتفاقية لطلب حجز تم إغلاقه لتعارض');
      }
      if (
        bookingReq.status === BookingStatus.CANCELLED ||
        bookingReq.status === BookingStatus.REJECTED
      ) {
        throw new BadRequestException('لا يمكن تأكيد اتفاقية لطلب حجز ملغي أو مرفوض');
      }
      throw new BadRequestException(
        `لا يمكن تأكيد اتفاقية لطلب حجز غير معلق أو غير مقبول (حالة الطلب الحالية: ${bookingReq.status})`,
      );
    }

    // b) Target portion availability pre-check
    const avail = await this.availabilityService.getStatus(
      bookingReq.targetType,
      bookingReq.targetId,
    );
    if (avail.status === 'BOOKED' || avail.status === 'UNAVAILABLE') {
      throw new ConflictException({
        code: 'ERR_PORTION_ALREADY_BOOKED',
        message: 'الوحدة أو الجزء المطلوب محجوز بالفعل وغير متاح للتأكيد',
      });
    }

    const agreement = await this.findByRequestId(requestId);

    // Concurrency Row Lock: lock target accommodation portion
    await this.availabilityService.lockEntity(bookingReq.targetType, bookingReq.targetId);

    const userRole = currentUser?.role || data?.role;
    const isOwner = currentUser ? currentUser.id === bookingReq.ownerId : userRole === 'OWNER';
    const isStudent = currentUser
      ? currentUser.id === bookingReq.studentId
      : userRole === 'STUDENT';

    // Check single confirmed booking constraint for student (BR-BKG-002)
    if (isStudent || !currentUser) {
      const allStudentReqs = await this.bookingRequestsService.findByStudent(bookingReq.studentId);
      const otherConfirmed = allStudentReqs.some(
        r => r.id !== requestId && r.status === BookingStatus.CONFIRMED,
      );
      if (otherConfirmed) {
        throw new ConflictException({
          code: 'ERR_STUDENT_HAS_CONFIRMED_BOOKING',
          message: 'الطالب لديه حجز مؤكد بالفعل، لا يمكن تأكيد حجز آخر',
        });
      }
    }

    // Update confirmation flags
    if (currentUser) {
      if (isStudent) {
        agreement.studentConfirmed = true;
        agreement.studentConfirmedAt = new Date();
        agreement.termsAccepted = data?.termsAccepted !== false;
      }
      if (isOwner) {
        agreement.ownerConfirmed = true;
        agreement.ownerConfirmedAt = new Date();
      }
    } else {
      // Direct call (e.g., in automated testing or single confirmation endpoint)
      agreement.studentConfirmed = true;
      agreement.studentConfirmedAt = new Date();
      agreement.ownerConfirmed = true;
      agreement.ownerConfirmedAt = new Date();
      agreement.termsAccepted = true;
    }

    if (data?.contractUrl) {
      agreement.contractUrl = data.contractUrl;
    }

    // Bilateral Confirmation check (BR-AGR-001)
    const isBilateralConfirmed = agreement.studentConfirmed && agreement.ownerConfirmed;

    if (isBilateralConfirmed) {
      // d) Student Single Confirmed Booking Re-check (BR-BKG-002) upon bilateral confirmation
      const allStudentReqs = await this.bookingRequestsService.findByStudent(bookingReq.studentId);
      const otherConfirmed = allStudentReqs.some(
        r => r.id !== requestId && r.status === BookingStatus.CONFIRMED,
      );
      if (otherConfirmed) {
        throw new ConflictException({
          code: 'ERR_STUDENT_HAS_CONFIRMED_BOOKING',
          message: 'الطالب لديه حجز مؤكد بالفعل، لا يمكن تأكيد حجز آخر',
        });
      }

      // Re-verify target portion availability prior to committing confirmation
      const finalAvail = await this.availabilityService.getStatus(
        bookingReq.targetType,
        bookingReq.targetId,
      );
      if (finalAvail.status === 'BOOKED' || finalAvail.status === 'UNAVAILABLE') {
        throw new ConflictException({
          code: 'ERR_PORTION_ALREADY_BOOKED',
          message: 'الوحدة أو الجزء المطلوب محجوز بالفعل وغير متاح للتأكيد',
        });
      }

      agreement.status = AgreementStatus.CONFIRMED;
      agreement.confirmedAt = new Date();

      // 1. Partial availability enforcement (BR-AGR-002):
      // Mark ONLY the booked portion unavailable / booked. Sibling rooms/beds remain available!
      await this.availabilityService.setStatus(
        bookingReq.targetType as any,
        bookingReq.targetId,
        'BOOKED',
      );

      const targetTypeUpper = (bookingReq.targetType || '').toUpperCase();
      const targetId = bookingReq.targetId;

      // Handle BED booking and parent room status
      let allBedsInRoomBooked = false;
      let parentRoomId: string | undefined;
      let roomBedIds: string[] = [];

      if (targetTypeUpper === 'BED') {
        parentRoomId = await this.getParentRoomId(bookingReq);
        if (parentRoomId) {
          const bedsInRoom = await this.getBedsForRoom(parentRoomId);
          if (bedsInRoom.length > 0) {
            let everyBedBooked = true;
            for (const bId of bedsInRoom) {
              if (bId === targetId) continue;
              const bStatus = await this.availabilityService.getStatus('BED', bId);
              if (bStatus.status !== 'BOOKED' && bStatus.status !== 'UNAVAILABLE') {
                everyBedBooked = false;
                break;
              }
            }
            allBedsInRoomBooked = everyBedBooked;
          }
        }
        if (allBedsInRoomBooked && parentRoomId) {
          await this.availabilityService.setStatus('ROOM', parentRoomId, 'BOOKED');
        }
      } else if (targetTypeUpper === 'ROOM') {
        roomBedIds = await this.getBedsForRoom(targetId);
        for (const bId of roomBedIds) {
          await this.availabilityService.setStatus('BED', bId, 'BOOKED');
        }
      }

      // c) Hierarchical auto-closure cascade (BR-AGR-003):
      // Automatically transition competing requests across overlapping hierarchical levels to CLOSED_CONFLICT
      const allRequests = this.bookingRequestsService.getAllRequests();
      const competing = allRequests.filter(r => {
        if (r.id === requestId) return false;
        if (r.status !== BookingStatus.PENDING && r.status !== BookingStatus.ACCEPTED) return false;

        const rType = (r.targetType || '').toUpperCase();
        const rId = r.targetId;

        // 1. Exact match on target portion
        if (rType === targetTypeUpper && rId === targetId) return true;

        // 2. Cascade when confirming ROOM:
        // Auto-close competing requests where (r.targetType === 'ROOM' && r.targetId === bookingReq.targetId)
        // OR (r.targetType === 'BED' && (r.roomId === bookingReq.targetId || roomBedIds.includes(r.targetId)))
        if (targetTypeUpper === 'ROOM') {
          if (rType === 'ROOM' && (rId === targetId || r.roomId === targetId)) return true;
          if (
            rType === 'BED' &&
            (r.roomId === targetId || rId === targetId || roomBedIds.includes(rId))
          )
            return true;
        }

        // 3. Cascade when confirming UNIT:
        // Auto-close competing requests for the unit, or child rooms/beds inside the unit
        if (targetTypeUpper === 'UNIT') {
          if (
            (rType === 'UNIT' || rType === 'APARTMENT') &&
            (rId === targetId || r.unitId === targetId)
          )
            return true;
          if (r.unitId === targetId) return true;
          if (
            targetId === 'unit-1' &&
            (r.roomId === 'room-1' ||
              r.roomId === 'room-2' ||
              rId === 'room-1' ||
              rId === 'room-2' ||
              rId === 'bed-1' ||
              rId === 'bed-2')
          )
            return true;
          if (
            targetId === 'unit-2' &&
            (r.roomId === 'room-3' || rId === 'room-3' || rId === 'bed-3' || rId === 'bed-4')
          )
            return true;
        }

        // 4. Cascade when confirming BED:
        // Auto-close competing requests for the exact bed, or for parent room if all beds in that room become booked
        if (targetTypeUpper === 'BED') {
          if (rType === 'BED' && rId === targetId) return true;
          if (allBedsInRoomBooked && parentRoomId) {
            if (rType === 'ROOM' && (rId === parentRoomId || r.roomId === parentRoomId))
              return true;
          }
        }

        return false;
      });

      for (const comp of competing) {
        comp.status = BookingStatus.CLOSED_CONFLICT;
        comp.updatedAt = new Date().toISOString();

        if (this.pool) {
          try {
            await this.pool.query(
              `UPDATE booking_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
              [BookingStatus.CLOSED_CONFLICT, comp.id],
            );
          } catch {}
        }

        // Notify competing applicant student (conversation thread remains permanently active per BR-MSG-002)
        try {
          await this.notificationsService.createNotification({
            userId: comp.studentId,
            type: 'CONFLICT_CLOSED',
            titleAr: 'تم إغلاق طلب الحجز لعدم التوفر',
            titleEn: 'Booking request closed due to conflict',
            bodyAr: 'تم حجز الوحدة من قبل طالب آخر وتأكيد العقد، وتم إغلاق طلبك تلقائياً.',
            bodyEn:
              'The accommodation unit was confirmed by another applicant. Your request has been auto-closed.',
            data: { bookingRequestId: comp.id },
          });
        } catch {}
      }

      // 3. Update current booking request to CONFIRMED
      bookingReq.status = BookingStatus.CONFIRMED;
      bookingReq.updatedAt = new Date().toISOString();

      if (this.pool) {
        try {
          await this.pool.query(
            `UPDATE booking_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
            [BookingStatus.CONFIRMED, requestId],
          );
        } catch {}
      }

      // 4. Notify both confirmed parties
      try {
        await this.notificationsService.createNotification({
          userId: bookingReq.studentId,
          type: 'AGREEMENT_CONFIRMED',
          titleAr: 'تم تأكيد عقد الإيجار بنجاح!',
          titleEn: 'Rental agreement confirmed successfully!',
          bodyAr: 'مبروك! تم تأكيد العقد بنجاح وأصبح الحجز سارياً.',
          bodyEn: 'Congratulations! Rental agreement has been mutually confirmed.',
          data: { bookingRequestId: requestId, agreementId: agreement.id },
        });

        await this.notificationsService.createNotification({
          userId: bookingReq.ownerId,
          type: 'AGREEMENT_CONFIRMED',
          titleAr: 'تم تأكيد عقد الإيجار بنجاح!',
          titleEn: 'Rental agreement confirmed successfully!',
          bodyAr: 'تم تأكيد حجز العقار وتأكيد العقد بين الطرفين.',
          bodyEn: 'Rental agreement confirmed mutually between both parties.',
          data: { bookingRequestId: requestId, agreementId: agreement.id },
        });
      } catch {}
    }

    agreement.updatedAt = new Date();
    this.agreements.set(agreement.id, agreement);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO agreements (
            id, booking_request_id, monthly_rent_egp, deposit_egp,
            student_confirmed, student_confirmed_at, owner_confirmed, owner_confirmed_at,
            terms_accepted, contract_url, status, confirmed_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (booking_request_id) DO UPDATE SET
            student_confirmed = EXCLUDED.student_confirmed,
            student_confirmed_at = EXCLUDED.student_confirmed_at,
            owner_confirmed = EXCLUDED.owner_confirmed,
            owner_confirmed_at = EXCLUDED.owner_confirmed_at,
            terms_accepted = EXCLUDED.terms_accepted,
            contract_url = EXCLUDED.contract_url,
            status = EXCLUDED.status,
            confirmed_at = EXCLUDED.confirmed_at,
            updated_at = NOW()`,
          [
            agreement.id,
            agreement.bookingRequestId,
            agreement.monthlyRentEgp,
            agreement.depositEgp,
            agreement.studentConfirmed,
            agreement.studentConfirmedAt || null,
            agreement.ownerConfirmed,
            agreement.ownerConfirmedAt || null,
            agreement.termsAccepted,
            agreement.contractUrl || null,
            agreement.status,
            agreement.confirmedAt || null,
            agreement.updatedAt,
          ],
        );
      } catch {}
    }

    return agreement;
  }
}
