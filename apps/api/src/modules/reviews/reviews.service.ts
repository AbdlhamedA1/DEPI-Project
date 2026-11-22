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
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus, UserRole } from '@repo/shared-types';

export interface ReviewResponseRecord {
  id: string;
  reviewId: string;
  responderId: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewRecord {
  id: string;
  bookingRequestId?: string;
  propertyId: string;
  studentId: string;
  rating: number;
  cleanlinessRating?: number;
  locationRating?: number;
  valueRating?: number;
  ownerRating?: number;
  comment: string;
  isApproved: boolean;
  response?: ReviewResponseRecord;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReviewsService {
  private reviews: ReviewRecord[] = [
    {
      id: 'rev-1',
      bookingRequestId: 'req-101',
      propertyId: 'prop-1',
      studentId: 'mock-user-1',
      rating: 5,
      cleanlinessRating: 5,
      locationRating: 5,
      valueRating: 5,
      ownerRating: 5,
      comment: 'سكن ممتاز جداً وقريب من الجامعة والمالك محترم ومتعاون.',
      isApproved: true,
      createdAt: new Date('2026-08-20T10:00:00Z'),
      updatedAt: new Date('2026-08-20T10:00:00Z'),
    },
  ];

  constructor(
    private readonly bookingRequestsService: BookingRequestsService,
    private readonly notificationsService: NotificationsService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findByProperty(propertyId: string): Promise<ReviewRecord[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT r.id, r.booking_request_id as "bookingRequestId", r.property_id as "propertyId",
                  r.student_id as "studentId", r.rating, r.cleanliness_rating as "cleanlinessRating",
                  r.location_rating as "locationRating", r.value_rating as "valueRating",
                  r.owner_rating as "ownerRating", r.comment, r.is_approved as "isApproved",
                  r.created_at as "createdAt", r.updated_at as "updatedAt",
                  rr.id as "resp_id", rr.responder_id as "resp_responder_id",
                  rr.response_text as "resp_comment", rr.created_at as "resp_created_at"
           FROM reviews r
           LEFT JOIN review_responses rr ON rr.review_id = r.id
           WHERE r.property_id = $1 ORDER BY r.created_at DESC`,
          [propertyId],
        );

        if (res.rows.length > 0) {
          return res.rows.map(row => ({
            id: row.id,
            bookingRequestId: row.bookingRequestId,
            propertyId: row.propertyId,
            studentId: row.studentId,
            rating: row.rating,
            cleanlinessRating: row.cleanlinessRating,
            locationRating: row.locationRating,
            valueRating: row.valueRating,
            ownerRating: row.ownerRating,
            comment: row.comment,
            isApproved: row.isApproved,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            response: row.resp_id
              ? {
                  id: row.resp_id,
                  reviewId: row.id,
                  responderId: row.resp_responder_id,
                  comment: row.resp_comment,
                  createdAt: row.resp_created_at,
                  updatedAt: row.resp_created_at,
                }
              : undefined,
          }));
        }
      } catch {}
    }

    return this.reviews.filter(r => r.propertyId === propertyId);
  }

  async findById(id: string): Promise<ReviewRecord> {
    const rev = this.reviews.find(r => r.id === id);
    if (!rev) throw new NotFoundException('التقييم غير موجود');
    return rev;
  }

  async create(data: any, currentUser?: any): Promise<ReviewRecord> {
    const studentId = currentUser?.id || data.studentId || 'mock-user-1';

    // 1. Rating bounds check (1 to 5 stars)
    const rating = Number(data.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('التقييم يجب أن يكون بين 1 و 5 نجوم');
    }

    // 2. Post-confirmed booking qualification (BR-REV-001)
    if (data.bookingRequestId) {
      const bookingReq = await this.bookingRequestsService.findById(data.bookingRequestId);
      if (bookingReq.status !== BookingStatus.CONFIRMED) {
        throw new ForbiddenException({
          code: 'ERR_REVIEW_INELIGIBLE_NO_CONFIRMED_BOOKING',
          message: 'لا يمكن تقديم تقييم إلا بعد تأكيد الحجز الفعلي',
        });
      }

      if (currentUser && bookingReq.studentId !== studentId) {
        throw new ForbiddenException('لا يمكنك تقييم حجز لا يخصك');
      }

      // 3. Duplicate review prevention (BR-REV-002)
      const existing = this.reviews.find(
        r => r.bookingRequestId === data.bookingRequestId && r.studentId === studentId,
      );
      if (existing) {
        throw new ConflictException({
          code: 'ERR_DUPLICATE_REVIEW',
          message: 'لقد قمت بتقديم تقييم لهذا الحجز بالفعل، لا يمكن تكرار التقييم',
        });
      }
    }

    const newReview: ReviewRecord = {
      id: randomUUID(),
      bookingRequestId: data.bookingRequestId,
      propertyId: data.propertyId || 'prop-1',
      studentId,
      rating,
      cleanlinessRating: data.cleanlinessRating,
      locationRating: data.locationRating,
      valueRating: data.valueRating,
      ownerRating: data.ownerRating,
      comment: data.comment,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.unshift(newReview);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO reviews (
            id, booking_request_id, property_id, student_id, rating,
            cleanliness_rating, location_rating, value_rating, owner_rating,
            comment, is_approved, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            newReview.id,
            newReview.bookingRequestId || null,
            newReview.propertyId,
            newReview.studentId,
            newReview.rating,
            newReview.cleanlinessRating || null,
            newReview.locationRating || null,
            newReview.valueRating || null,
            newReview.ownerRating || null,
            newReview.comment,
            newReview.isApproved,
            newReview.createdAt,
            newReview.updatedAt,
          ],
        );
      } catch {}
    }

    // Trigger notification to property owner if bookingRequestId exists
    if (data.bookingRequestId) {
      try {
        const bookingReq = await this.bookingRequestsService.findById(data.bookingRequestId);
        await this.notificationsService.createNotification({
          userId: bookingReq.ownerId,
          type: 'REVIEW_RECEIVED',
          titleAr: 'تقييم جديد لعقارك',
          titleEn: 'New review received',
          bodyAr: `حصل عقارك على تقييم جديد (${newReview.rating}/5 نجوم)`,
          bodyEn: `Your property received a new review (${newReview.rating}/5 stars)`,
          data: { reviewId: newReview.id, propertyId: newReview.propertyId },
        });
      } catch {}
    }

    return newReview;
  }

  async createResponse(
    reviewId: string,
    data: { comment?: string; responseText?: string },
    currentUser?: any,
  ): Promise<ReviewResponseRecord> {
    const review = await this.findById(reviewId);

    // Single provider rebuttal response enforcement (BR-REV-003)
    if (review.response) {
      throw new ConflictException({
        code: 'ERR_REVIEW_RESPONSE_ALREADY_EXISTS',
        message: 'تم إرسال رد على هذا التقييم مسبقاً، يسمح برد واحد فقط',
      });
    }

    const commentText = (data.comment || data.responseText || '').trim();
    if (!commentText) {
      throw new BadRequestException('نص الرد لا يمكن أن يكون فارغاً');
    }

    // Resolve property owner
    let propertyOwnerId: string | undefined;
    if (review.bookingRequestId) {
      try {
        const bookingReq = await this.bookingRequestsService.findById(review.bookingRequestId);
        if (bookingReq?.ownerId) {
          propertyOwnerId = bookingReq.ownerId;
        }
      } catch {}
    }

    if (!propertyOwnerId && this.pool && review.propertyId) {
      try {
        const res = await this.pool.query(
          'SELECT owner_id as "ownerId" FROM properties WHERE id = $1',
          [review.propertyId],
        );
        if (res.rows.length > 0 && res.rows[0].ownerId) {
          propertyOwnerId = res.rows[0].ownerId;
        }
      } catch {}
    }

    if (!propertyOwnerId) {
      const allReqs = this.bookingRequestsService.getAllRequests();
      const match = allReqs.find(r => r.propertyId === review.propertyId);
      if (match?.ownerId) {
        propertyOwnerId = match.ownerId;
      } else if (review.propertyId === 'prop-1') {
        propertyOwnerId = 'mock-owner-1';
      }
    }

    // Enforce property owner authorization: verify currentUser.id matches the property's ownerId (or has ADMIN role)
    if (currentUser) {
      const roleUpper = (currentUser.role || '').toUpperCase();
      const isAdmin = roleUpper === 'ADMIN' || currentUser.role === UserRole.ADMIN;
      const isOwner = propertyOwnerId ? currentUser.id === propertyOwnerId : false;
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('فقط مالك العقار يمكنه الرد على التقييم');
      }
    }

    const responderId = currentUser?.id || propertyOwnerId || 'mock-owner-1';

    const responseRecord: ReviewResponseRecord = {
      id: randomUUID(),
      reviewId,
      responderId,
      comment: commentText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    review.response = responseRecord;

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO review_responses (id, review_id, responder_id, response_text, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            responseRecord.id,
            reviewId,
            responderId,
            responseRecord.comment,
            responseRecord.createdAt,
            responseRecord.updatedAt,
          ],
        );
      } catch {}
    }

    // Notify the student about the owner's response
    try {
      await this.notificationsService.createNotification({
        userId: review.studentId,
        type: 'STATUS_UPDATE',
        titleAr: 'رد المالك على تقييمك',
        titleEn: 'Owner responded to your review',
        bodyAr: `قام مالك العقار بالرد على تقييمك: "${responseRecord.comment.substring(0, 50)}..."`,
        bodyEn: `The owner has responded to your review.`,
        data: { reviewId, responseId: responseRecord.id },
      });
    } catch {}

    return responseRecord;
  }
}
