/**
 * Tier 1 Feature Coverage: Reviews, Ratings & User Reports (F26 - F28)
 * Covers:
 * - F26: Post-Booking Review Eligibility & Duplicate Prevention
 * - F27: Single Provider Review Response Enforcement
 * - F28: User Complaint & Report Submission Lifecycle
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS, TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 1: Reviews & Reports (F26 - F28)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F26: Post-Booking Review Eligibility & Duplicate Prevention
  // ==========================================
  describe('F26: Post-Booking Review Eligibility & Duplicate Prevention', () => {
    it('F26-01: Student with CONFIRMED booking can successfully submit a review (1-5 stars)', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      // Create and confirm booking
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Student submits review
      const revRes = await client.post(
        '/api/v1/reviews',
        {
          bookingRequestId: reqId,
          rating: 5,
          comment: 'سكن ممتاز وقريب جداً من جامعة القاهرة والمترو، ونظافة ممتازة.',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(revRes.status).toBe(201);
      expect(revRes.body.success).toBe(true);
      expect(revRes.body.data.rating).toBe(5);
      expect(revRes.body.data.studentId).toBe(student.id);
    });

    it('F26-02: Review eligibility gate: Student without confirmed booking is strictly rejected (403 REVIEW_NOT_ELIGIBLE)', async () => {
      const student = TEST_STUDENTS[0];
      // Create request in PENDING status (not confirmed)
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;

      // Attempting review without confirmed booking
      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 4, comment: 'مجرد معاينة' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(revRes.status).toBe(403);
      expect(revRes.body.error).toBe('REVIEW_NOT_ELIGIBLE');
      expect(revRes.body.message).toContain('Reviews are permitted only after a confirmed booking');
    });

    it('F26-03: Duplicate review prevention: Submitting a second review for the same booking fails (409 REVIEW_ALREADY_EXISTS)', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // First review succeeds
      await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Second review for same booking
      const secondRev = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 4 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(secondRev.status).toBe(409);
      expect(secondRev.body.error).toBe('REVIEW_ALREADY_EXISTS');
    });

    it('F26-04: Reject review submission if rating is out of bounds (< 1 or > 5)', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const invalidRating = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 6 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(invalidRating.status).toBe(400);
      expect(invalidRating.body.message).toContain('Rating must be an integer between 1 and 5');
    });

    it('F26-05: Review successfully stores optional Arabic text comment', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const commentText = 'صاحب السكن محترم ومتعاون جداً';
      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5, comment: commentText },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(revRes.body.data.comment).toBe(commentText);
    });
  });

  // ==========================================
  // FEATURE F27: Single Provider Review Response Enforcement
  // ==========================================
  describe('F27: Single Provider Review Response Enforcement', () => {
    it('F27-01: Property owner can submit a single response to a student review', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const revId = revRes.body.data.id;

      // Owner responds
      const respRes = await client.post(
        `/api/v1/reviews/${revId}/response`,
        { responseText: 'شكراً جزيلاً لك يا أحمد ونتمنى لك التوفيق في دراستك.' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(respRes.status).toBe(201);
      expect(respRes.body.data.response).toBeDefined();
      expect(respRes.body.data.response.providerId).toBe(owner.id);
    });

    it('F27-02: Single response rule: Submitting a second response fails (409 RESPONSE_ALREADY_EXISTS)', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const revId = revRes.body.data.id;

      // First response succeeds
      await client.post(
        `/api/v1/reviews/${revId}/response`,
        { responseText: 'رد أول' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Second response fails (§5.13)
      const secondResp = await client.post(
        `/api/v1/reviews/${revId}/response`,
        { responseText: 'رد ثانٍ' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(secondResp.status).toBe(409);
      expect(secondResp.body.error).toBe('RESPONSE_ALREADY_EXISTS');
    });

    it('F27-03: Non-owner of the property cannot respond to the review (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const wrongOwner = TEST_PROVIDERS[1];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const revId = revRes.body.data.id;

      const res = await client.post(
        `/api/v1/reviews/${revId}/response`,
        { responseText: 'رد غير مصرح' },
        { Authorization: `Bearer ${wrongOwner.id}:OWNER` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the property provider can respond to this review');
    });

    it('F27-04: Reject response with empty text (400 Bad Request)', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const revId = revRes.body.data.id;

      const res = await client.post(
        `/api/v1/reviews/${revId}/response`,
        { responseText: '   ' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Response text cannot be empty');
    });

    it('F27-05: Response records valid response timestamp', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      const revRes = await client.post(
        '/api/v1/reviews',
        { bookingRequestId: reqId, rating: 5 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const revId = revRes.body.data.id;

      const respRes = await client.post(
        `/api/v1/reviews/${revId}/response`,
        { responseText: 'شكراً' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(respRes.body.data.response.createdAt).toBeDefined();
    });
  });

  // ==========================================
  // FEATURE F28: User Complaint & Report Submission Lifecycle
  // ==========================================
  describe('F28: User Complaint & Report Submission Lifecycle', () => {
    it('F28-01: User can submit text-only report for misleading listing (app.txt §5.14)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-shatby-villa',
          reason: 'MISLEADING_PHOTOS',
          description:
            'الصور المعروضة تظهر إطلالة بحرية كاملة بينما في الواقع الإطلالة جانبية مغلقة.',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reporterId).toBe(student.id);
      expect(res.body.data.status).toBe('NEW');
    });

    it('F28-02: Report starts in status NEW and requires non-empty description', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-shatby-villa',
          reason: 'FRAUD',
          description: '',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('description is mandatory');
    });

    it('F28-03: Admin moves report to UNDER_REVIEW during investigation', async () => {
      const student = TEST_STUDENTS[0];
      const admin = TEST_ADMINS[0];
      const repRes = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-shatby-villa',
          reason: 'MISLEADING',
          description: 'بلاغ',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const repId = repRes.body.data.id;

      const updateRes = await client.patch(
        `/api/v1/reports/${repId}/status`,
        { status: 'UNDER_REVIEW' },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('UNDER_REVIEW');
    });

    it('F28-04: Admin transitions report to RESPONDED or CLOSED with resolution notes', async () => {
      const student = TEST_STUDENTS[0];
      const admin = TEST_ADMINS[0];
      const repRes = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-shatby-villa',
          reason: 'MISLEADING',
          description: 'بلاغ',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const repId = repRes.body.data.id;

      const closeRes = await client.patch(
        `/api/v1/reports/${repId}/status`,
        { status: 'CLOSED', resolutionNotes: 'تم التواصل مع المالك وتعديل وصف الصور.' },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.status).toBe('CLOSED');
      expect(closeRes.body.data.adminResolutionNotes).toContain('تم التواصل مع المالك');
    });

    it('F28-05: Report status modification by admin is recorded in AdminActionLog', async () => {
      const student = TEST_STUDENTS[0];
      const admin = TEST_ADMINS[0];
      const repRes = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-shatby-villa',
          reason: 'MISLEADING',
          description: 'بلاغ',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const repId = repRes.body.data.id;

      await client.patch(
        `/api/v1/reports/${repId}/status`,
        { status: 'CLOSED' },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );

      const auditRes = await client.get('/api/v1/admin/audit-logs', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      const reportLog = auditRes.body.data.find(
        (l: any) => l.action === 'COMPLAINT_STATUS_UPDATE' && l.targetId === repId,
      );
      expect(reportLog).toBeDefined();
      expect(reportLog.afterState.status).toBe('CLOSED');
    });
  });
});
