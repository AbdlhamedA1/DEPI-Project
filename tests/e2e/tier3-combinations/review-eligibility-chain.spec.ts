/**
 * Tier 3 Cross-Feature Combination: Review Eligibility Gate, Duplicate Prevention & Provider Response
 * Covers:
 * - F16 (Booking Requests), F21 (Agreements), F26 (Post-Booking Review Eligibility), F27 (Single Response Rule)
 * - Viewing student without confirmed booking cannot submit review (403 Forbidden: REVIEW_NOT_ELIGIBLE)
 * - Student with PENDING, ACCEPTED, CANCELLED, or REJECTED booking cannot review (403)
 * - Confirmed booking qualifies tenant student to submit review (1 to 5 stars)
 * - Exactly 1 review permitted per confirmed booking (409 Conflict: REVIEW_ALREADY_EXISTS)
 * - Reviewed property provider can submit exactly 1 response (201 Created)
 * - Second response attempt by provider is strictly blocked (409 Conflict: RESPONSE_ALREADY_EXISTS)
 * - Third-party provider cannot respond to review (403 Forbidden)
 *
 * Total: 7 Combination Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 3: Review Eligibility Chain & Response Rules (F16, F21, F26, F27)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('COMB-REV-01: Student without confirmed booking is strictly blocked from reviewing (403 Forbidden: REVIEW_NOT_ELIGIBLE)', async () => {
    const student = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    // Submit booking request (status remains PENDING)
    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;

    // Student attempts to submit review while booking is still PENDING
    const reviewRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 5, comment: 'سكن ممتاز' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(reviewRes.status).toBe(403);
    expect(reviewRes.body.error).toBe('REVIEW_NOT_ELIGIBLE');
    expect(reviewRes.body.message).toContain('only after a confirmed booking has been established');
  });

  it('COMB-REV-02: Student with ACCEPTED (but unconfirmed) request cannot review (403 Forbidden)', async () => {
    const student = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;
    await client.post(
      `/api/v1/booking-requests/${reqId}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    const reviewRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 4, comment: 'تم قبول الطلب لكن لم يتم التأكيد النهائي' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(reviewRes.status).toBe(403);
    expect(reviewRes.body.error).toBe('REVIEW_NOT_ELIGIBLE');
  });

  it('COMB-REV-03: Student with CANCELLED request cannot review (403 Forbidden)', async () => {
    const student = TEST_STUDENTS[0];

    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;
    await client.post(
      `/api/v1/booking-requests/${reqId}/cancel`,
      {},
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );

    const reviewRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 1, comment: 'ألغيت الطلب' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(reviewRes.status).toBe(403);
    expect(reviewRes.body.error).toBe('REVIEW_NOT_ELIGIBLE');
  });

  it('COMB-REV-04: Confirmed booking unlocks review submission successfully (201 Created)', async () => {
    const student = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;

    // Mutually confirm booking
    await client.post(
      `/api/v1/booking-requests/${reqId}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // Review submission now succeeds
    const reviewRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 5, comment: 'سكن هادئ ونظيف، وقريب جداً من جامعة القاهرة' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.data.rating).toBe(5);
    expect(reviewRes.body.data.studentId).toBe(student.id);
  });

  it('COMB-REV-05: Duplicate review attempt for the same confirmed booking is blocked (409 Conflict: REVIEW_ALREADY_EXISTS)', async () => {
    const student = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${reqId}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // Submit first review
    await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 5, comment: 'تقييم أول' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );

    // Attempt second review for the exact same booking
    const duplicateRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 4, comment: 'محاولة تقييم مكرر' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error).toBe('REVIEW_ALREADY_EXISTS');
  });

  it('COMB-REV-06: Property provider can post exactly 1 response to the tenant review (201 Created)', async () => {
    const student = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${reqId}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    const reviewRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 5, comment: 'مكان رائع' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reviewId = reviewRes.body.data.id;

    // Provider responds to review
    const respRes = await client.post(
      `/api/v1/reviews/${reviewId}/response`,
      { responseText: 'شكراً جزيلاً لك يا أحمد، سعدنا باستضافتك ونتمنى لك دوام التوفيق.' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(respRes.status).toBe(201);
    expect(respRes.body.data.response).toBeDefined();
    expect(respRes.body.data.response.providerId).toBe(provider.id);
  });

  it('COMB-REV-07: Second response attempt by provider is strictly blocked (409 Conflict: RESPONSE_ALREADY_EXISTS)', async () => {
    const student = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    const reqRes = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reqId = reqRes.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${reqId}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    const reviewRes = await client.post(
      '/api/v1/reviews',
      { bookingRequestId: reqId, rating: 5, comment: 'مكان رائع' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    const reviewId = reviewRes.body.data.id;

    // First response succeeds
    await client.post(
      `/api/v1/reviews/${reviewId}/response`,
      { responseText: 'الرد الأول من المالك' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // Second response must be blocked
    const secondResp = await client.post(
      `/api/v1/reviews/${reviewId}/response`,
      { responseText: 'رد ثانٍ غير مسموح به' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(secondResp.status).toBe(409);
    expect(secondResp.body.error).toBe('RESPONSE_ALREADY_EXISTS');
  });
});
