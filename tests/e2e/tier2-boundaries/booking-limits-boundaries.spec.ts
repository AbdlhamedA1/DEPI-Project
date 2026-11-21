/**
/**
 * Tier 2 Boundary & Corner Cases: Booking Limits & State Machine Boundaries
 * Covers:
 * - F16: Booking Request Submission & Portion Selection boundaries
 * - F17: Exact 3-Request Limit (3 succeed, 4th blocked with 400 MAX_OPEN_REQUESTS_EXCEEDED)
 * - F18: 1-Confirmed-Booking Constraint (blocked if student already has 1 confirmed booking)
 * - F19: Provider Acceptance & Rejection boundary states
 * - F20: Student Cancellation boundary states
 * - F21: Mutual Agreement Confirmation boundary conditions & transitions
 *
 * Total: 30 Boundary Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 2: Booking Limits & State Machine Boundaries', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // =========================================================================
  // BOUNDARY 1: Exact 3-Request Limit Enforcement & Quota Churn (F17)
  // =========================================================================
  describe('Boundary 1: Exact 3-Request Limit Enforcement & Quota Churn', () => {
    it('B-BOOK-01: Exactly 3 open booking requests succeed for a single student', async () => {
      const student = TEST_STUDENTS[0]; // student-ahmed

      const req1 = await client.post(
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
      expect(req1.status).toBe(201);

      const req2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(req2.status).toBe(201);

      const req3 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(req3.status).toBe(201);
    });

    it('B-BOOK-02: 4th concurrent open booking request is strictly blocked with 400 MAX_OPEN_REQUESTS_EXCEEDED', async () => {
      const student = TEST_STUDENTS[0];

      // Submit 3 requests
      await client.post(
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
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // 4th request must be rejected
      const req4 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(req4.status).toBe(400);
      expect(req4.body.success).toBe(false);
      expect(req4.body.message).toContain('more than 3 simultaneous open booking requests');
    });

    it('B-BOOK-03: Cancelling 1 of 3 open requests immediately releases 1 quota slot allowing a new request', async () => {
      const student = TEST_STUDENTS[0];

      const r1 = await client.post(
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
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Cancel Request 1
      const cancelRes = await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/cancel`,
        { reason: 'Changed my mind' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(cancelRes.status).toBe(200);

      // Now 4th attempt succeeds because open count dropped from 3 to 2
      const r4 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(r4.status).toBe(201);
      expect(r4.body.data.bookingRequest.status).toBe('PENDING');
    });

    it('B-BOOK-04: Provider rejection of an open request releases quota slot immediately', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      const r1 = await client.post(
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
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Provider rejects request 1
      const rejectRes = await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/reject`,
        { reason: 'Room under maintenance' },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(rejectRes.status).toBe(200);

      // Open count is now 2, student can submit new request
      const newReq = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(newReq.status).toBe(201);
    });

    it('B-BOOK-05: Both PENDING and ACCEPTED requests count toward the 3-request limit', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      const r1 = await client.post(
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
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const r3 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Provider accepts request 1 (transitions PENDING -> ACCEPTED)
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Student now has 1 ACCEPTED and 2 PENDING requests (Total = 3 open)
      // 4th request must still be rejected
      const r4 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(r4.status).toBe(400);
      expect(r4.body.message).toContain('more than 3 simultaneous open booking requests');
    });

    it('B-BOOK-06: Student limits are completely independent across distinct student accounts', async () => {
      const student1 = TEST_STUDENTS[0]; // student-ahmed
      const student2 = TEST_STUDENTS[2]; // student-omar

      // Student 1 exhausts their 3 requests
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );

      // Student 2 can still freely submit their own requests
      const s2Req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      expect(s2Req.status).toBe(201);
      expect(s2Req.body.data.bookingRequest.studentId).toBe(student2.id);
    });
  });

  // =========================================================================
  // BOUNDARY 2: Single Confirmed Booking Constraint (F18)
  // =========================================================================
  describe('Boundary 2: Single Confirmed Booking Constraint', () => {
    it('B-BOOK-07: Student with 1 CONFIRMED booking is strictly blocked from creating a new booking request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // Submit and confirm booking
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

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

      // Student now has a CONFIRMED booking. Attempt to create another request:
      const newReq = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(newReq.status).toBe(409);
      expect(newReq.body.error).toBe('STUDENT_ALREADY_HAS_CONFIRMED_BOOKING');
      expect(newReq.body.message).toContain('already has an active confirmed booking');
    });

    it('B-BOOK-08: Student cannot confirm a second agreement if they already have one confirmed', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // Submit 2 requests before either is confirmed
      const r1 = await client.post(
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
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      const id1 = r1.body.data.bookingRequest.id;
      const id2 = r2.body.data.bookingRequest.id;

      // Provider accepts both
      await client.post(
        `/api/v1/booking-requests/${id1}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${id2}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Confirm first booking
      await client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Attempt to confirm second booking
      await client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const secondConfirm = await client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(secondConfirm.status).toBe(409);
      expect(secondConfirm.body.error).toBe('STUDENT_ALREADY_HAS_CONFIRMED_BOOKING');
    });

    it('B-BOOK-09: Other students can still confirm their bookings independently', async () => {
      const s1 = TEST_STUDENTS[0];
      const s2 = TEST_STUDENTS[2];
      const provider = TEST_PROVIDERS[0];

      // Student 1 books and confirms Bed B1
      const r1 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${s1.id}:STUDENT` },
      );
      const id1 = r1.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${s1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Student 2 books and confirms Bed B2
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${s2.id}:STUDENT` },
      );
      const id2 = r2.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${s2.id}:STUDENT` },
      );
      const confirm2 = await client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      expect(confirm2.status).toBe(200);
      expect(confirm2.body.data.confirmedBooking.status).toBe('CONFIRMED');
    });
  });

  // =========================================================================
  // BOUNDARY 3: Student Cancellation State Transitions (F20)
  // =========================================================================
  describe('Boundary 3: Student Cancellation State Transitions', () => {
    it('B-BOOK-10: Student can cancel a PENDING booking request', async () => {
      const student = TEST_STUDENTS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        { reason: 'Found alternative accommodation' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.cancellationReason).toBe('Found alternative accommodation');
      expect(res.body.data.cancelledAt).toBeDefined();
    });

    it('B-BOOK-11: Student can cancel an ACCEPTED booking request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('B-BOOK-12: Reject cancellation of an already CANCELLED request with 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Second cancellation must fail
      const repeatCancel = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(repeatCancel.status).toBe(400);
      expect(repeatCancel.body.message).toContain(
        'Cannot cancel booking request with status CANCELLED',
      );
    });

    it('B-BOOK-13: Reject cancellation of an already REJECTED request with 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Student attempt to cancel rejected request
      const cancelRes = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.message).toContain(
        'Cannot cancel booking request with status REJECTED',
      );
    });

    it('B-BOOK-14: Reject cancellation of a CONFIRMED booking request with 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
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

      const cancelRes = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.message).toContain(
        'Cannot cancel booking request with status CONFIRMED',
      );
    });

    it('B-BOOK-15: Student B cannot cancel Student A booking request (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const studentB = TEST_STUDENTS[2];
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${studentA.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;

      const unauthorizedCancel = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${studentB.id}:STUDENT` },
      );
      expect(unauthorizedCancel.status).toBe(403);
      expect(unauthorizedCancel.body.message).toContain('Only the requesting student can cancel');
    });
  });

  // =========================================================================
  // BOUNDARY 4: Provider Acceptance & Rejection State Transitions (F19)
  // =========================================================================
  describe('Boundary 4: Provider Acceptance & Rejection State Transitions', () => {
    it('B-BOOK-16: Provider can accept a PENDING request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(res.body.data.providerAgreed).toBe(true);
    });

    it('B-BOOK-17: Reject acceptance of an already ACCEPTED request with 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      const reAccept = await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(reAccept.status).toBe(400);
      expect(reAccept.body.message).toContain('Cannot accept booking request with status ACCEPTED');
    });

    it('B-BOOK-18: Reject acceptance of a CANCELLED request with 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      const acceptRes = await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(acceptRes.status).toBe(400);
      expect(acceptRes.body.message).toContain(
        'Cannot accept booking request with status CANCELLED',
      );
    });

    it('B-BOOK-19: Provider can reject a PENDING request without mandatory explanation', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      // Rejection without reason body
      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBeUndefined();
      expect(res.body.data.rejectedAt).toBeDefined();
    });

    it('B-BOOK-20: Provider can reject an ACCEPTED request prior to mutual confirmation', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Owner changes mind before final mutual confirmation
      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        { reason: 'Maintenance scheduled' },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Maintenance scheduled');
    });

    it('B-BOOK-21: Reject rejection of an already REJECTED request with 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      const reReject = await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(reReject.status).toBe(400);
      expect(reReject.body.message).toContain('Cannot reject booking request with status REJECTED');
    });

    it('B-BOOK-22: Provider B cannot accept or reject a request for Provider A property (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const providerB = TEST_PROVIDERS[1]; // authorized agent, not owner of Dokki building
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${providerB.id}:OWNER` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the property provider can accept this request');
    });
  });

  // =========================================================================
  // BOUNDARY 5: Mutual Agreement Confirmation Boundary Conditions (F21)
  // =========================================================================
  describe('Boundary 5: Mutual Agreement Confirmation Boundary Conditions', () => {
    it('B-BOOK-23: Confirmation by only 1 party does not transition status to CONFIRMED', async () => {
      const student = TEST_STUDENTS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      // Only student confirms
      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.confirmedBooking.studentAgreed).toBe(true);
      expect(res.body.data.confirmedBooking.providerAgreed).toBe(false);
      expect(res.body.data.confirmedBooking.status).toBe('PENDING'); // Not CONFIRMED yet
    });

    it('B-BOOK-24: Optional agreement document URL is saved upon confirmation', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      const docUrl = 'https://secure-docs.housing.eg/agreements/contract-signed-101.pdf';
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        { agreementDocUrl: docUrl },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.confirmedBooking.status).toBe('CONFIRMED');
      expect(res.body.data.confirmedBooking.agreementDocumentUrl).toBe(docUrl);
    });

    it('B-BOOK-25: Mutual confirmation on an already unavailable portion fails with 409 Conflict', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const req = await client.post(
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
      const reqId = req.body.data.bookingRequest.id;

      // Manually simulate external booking marking bed unavailable before final confirmation
      client
        .getSimulator()
        .setPortionAvailability('prop-dokki-building', 'BED', 'bed-dokki-101-b1', false);

      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const failConfirm = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(failConfirm.status).toBe(409);
      expect(failConfirm.body.error).toBe('PORTION_ALREADY_BOOKED');
    });

    it('B-BOOK-26: Non-participant user cannot confirm agreement (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const outsiderStudent = TEST_STUDENTS[2];
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${studentA.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${outsiderStudent.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only booking participants can confirm mutual agreement');
    });

    it('B-BOOK-27: Unauthenticated request to confirm agreement returns 401 Unauthorized', async () => {
      const res = await client.post('/api/v1/booking-requests/req-123/confirm-agreement', {});
      expect(res.status).toBe(401);
    });

    it('B-BOOK-28: Confirming non-existent booking request returns 404 Not Found', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/booking-requests/req-non-existent-9999/confirm-agreement',
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Booking request not found');
    });

    it('B-BOOK-29: Submitting booking request targeting already booked portion returns 400 Bad Request', async () => {
      const student = TEST_STUDENTS[0];
      // Mark Bed B1 unavailable first
      client
        .getSimulator()
        .setPortionAvailability('prop-dokki-building', 'BED', 'bed-dokki-101-b1', false);

      const res = await client.post(
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
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('accommodation portion is currently unavailable');
    });

    it('B-BOOK-30: Submitting booking request with non-existent portion ID returns 404 Not Found', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-fake-ghost-bed',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found in property');
    });
  });
});
