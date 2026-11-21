/**
 * Tier 1 Feature Coverage: Bookings & Rental Agreements (F16 - F23)
 * Covers:
 * - F16: Booking Request Submission & Portion Selection
 * - F17: Max 3 Open Booking Requests Enforcement
 * - F18: Single Confirmed Booking Constraint
 * - F19: Provider Request Acceptance & Rejection Flow
 * - F20: Student Request Direct Cancellation
 * - F21: Mutual Agreement Confirmation & Document Upload
 * - F22: Concurrency Lock & Competing Requests Auto-Closure
 * - F23: Mutual Contact Disclosure Transparency
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 1: Bookings & Rental Agreements (F16 - F23)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F16: Booking Request Submission & Portion Selection
  // ==========================================
  describe('F16: Booking Request Submission & Portion Selection', () => {
    it('F16-01: Student successfully submits booking request for an individual bed in Dokki', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
          studentNotes: 'طالب في كلية الهندسة جامعة القاهرة',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingRequest.status).toBe('PENDING');
      expect(res.body.data.bookingRequest.portionId).toBe('bed-dokki-101-b1');
    });

    it('F16-02: Student successfully submits booking request for a complete apartment in Nasr City', async () => {
      const student = TEST_STUDENTS[1]; // female student
      const res = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-nasr-city-flat',
          portionType: 'UNIT',
          portionId: 'unit-nasr-flat-01',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.bookingRequest.portionType).toBe('UNIT');
    });

    it('F16-03: Booking request starts in status PENDING and records studentAgreed: false', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
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
      expect(res.body.data.bookingRequest.status).toBe('PENDING');
      expect(res.body.data.bookingRequest.studentAgreed).toBe(false);
      expect(res.body.data.bookingRequest.providerAgreed).toBe(false);
    });

    it('F16-04: Booking request faithfully persists proposed move-in date and duration unit', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-11-01',
          proposedDurationUnit: 'SEMESTER',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.body.data.bookingRequest.proposedMoveInDate).toBe('2026-11-01');
      expect(res.body.data.bookingRequest.proposedDurationUnit).toBe('SEMESTER');
    });

    it('F16-05: Reject booking request (400 Bad Request) if target accommodation portion is unavailable', async () => {
      const sim = client.getSimulator();
      // Mark Bed B2 unavailable in the simulator
      sim.setPortionAvailability('prop-dokki-building', 'BED', 'bed-dokki-101-b2', false);

      const student = TEST_STUDENTS[0];
      const res = await client.post(
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
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('portion is currently unavailable');
    });
  });

  // ==========================================
  // FEATURE F17: Max 3 Open Booking Requests Enforcement
  // ==========================================
  describe('F17: Max 3 Open Booking Requests Enforcement', () => {
    it('F17-01: Student can submit 1st, 2nd, and 3rd open booking requests successfully', async () => {
      const student = TEST_STUDENTS[0];
      const res1 = await client.post(
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
      const res2 = await client.post(
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
      const res3 = await client.post(
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
      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res3.status).toBe(201);
    });

    it('F17-02: 4th simultaneous open booking request is strictly blocked (400 MAX_OPEN_REQUESTS_EXCEEDED)', async () => {
      const student = TEST_STUDENTS[0];
      // Create 3 open requests
      await client.post(
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
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Attempt 4th request
      const res4 = await client.post(
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
      expect(res4.status).toBe(400);
      expect(res4.body.error).toBe('MAX_OPEN_REQUESTS_EXCEEDED');
      expect(res4.body.message).toContain('more than 3 simultaneous open booking requests');
    });

    it('F17-03: Open request quota counts both PENDING and ACCEPTED status requests', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      // 1st request
      const r1 = await client.post(
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
      // Owner accepts 1st request (status becomes ACCEPTED)
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/accept`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // 2nd and 3rd requests (PENDING)
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
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // 4th request must still be blocked because quota is 1 ACCEPTED + 2 PENDING = 3 open
      const res4 = await client.post(
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
      expect(res4.status).toBe(400);
      expect(res4.body.error).toBe('MAX_OPEN_REQUESTS_EXCEEDED');
    });

    it('F17-04: Student canceling an open request frees quota slot immediately', async () => {
      const student = TEST_STUDENTS[0];
      const r1 = await client.post(
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
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Student cancels Request 1
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Now student has 2 open requests; 4th request succeeds!
      const resNew = await client.post(
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
      expect(resNew.status).toBe(201);
      expect(resNew.body.success).toBe(true);
    });

    it('F17-05: Provider rejecting an open request frees student quota slot immediately', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const r1 = await client.post(
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
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      // Owner rejects Request 1
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/reject`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Now student can create new request
      const resNew = await client.post(
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
      expect(resNew.status).toBe(201);
    });
  });

  // ==========================================
  // FEATURE F18: Single Confirmed Booking Constraint
  // ==========================================
  describe('F18: Single Confirmed Booking Constraint', () => {
    it('F18-01: Student can successfully hold exactly 1 confirmed booking', async () => {
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

      // Both confirm agreement
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const confRes = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      expect(confRes.status).toBe(200);
      expect(confRes.body.data.confirmedBooking.status).toBe('CONFIRMED');
    });

    it('F18-02: Once a booking is confirmed, new booking request attempt fails (409 STUDENT_ALREADY_HAS_CONFIRMED_BOOKING)', async () => {
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

      // Student attempts new booking request
      const newReqRes = await client.post(
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
      expect(newReqRes.status).toBe(409);
      expect(newReqRes.body.error).toBe('STUDENT_ALREADY_HAS_CONFIRMED_BOOKING');
    });

    it('F18-03: Attempt to confirm second booking for the same student is blocked with 409 Conflict', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      // Create request 1 and 2 before confirming either
      const r1 = await client.post(
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
      const r2 = await client.post(
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

      // Confirm r1
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Try confirming r2
      await client.post(
        `/api/v1/booking-requests/${r2.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const conf2Res = await client.post(
        `/api/v1/booking-requests/${r2.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      expect(conf2Res.status).toBe(409);
      expect(conf2Res.body.error).toBe('STUDENT_ALREADY_HAS_CONFIRMED_BOOKING');
    });

    it('F18-04: Other students can still submit requests for different portions while one student is confirmed', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const owner = TEST_PROVIDERS[0];

      // Student 1 books Bed A1
      const r1 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Student 2 can book Bed B1
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      expect(r2.status).toBe(201);
      expect(r2.body.success).toBe(true);
    });

    it('F18-05: Query student booking requests reflects confirmed status accurately', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
      const r1 = await client.post(
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
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const listRes = await client.get(`/api/v1/students/${student.id}/booking-requests`, {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(listRes.status).toBe(200);
      const confReq = listRes.body.data.find((r: any) => r.id === r1.body.data.bookingRequest.id);
      expect(confReq.status).toBe('CONFIRMED');
    });
  });

  // ==========================================
  // FEATURE F19: Provider Request Acceptance & Rejection Flow
  // ==========================================
  describe('F19: Provider Request Acceptance & Rejection Flow', () => {
    it('F19-01: Property owner accepts student booking request (status becomes ACCEPTED)', async () => {
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

      const acceptRes = await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.status).toBe('ACCEPTED');
      expect(acceptRes.body.data.providerAgreed).toBe(true);
    });

    it('F19-02: Property owner can reject booking request without providing an explanation (app.txt §5.8)', async () => {
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

      // Rejection with empty body (no mandatory reason)
      const rejectRes = await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('REJECTED');
      expect(rejectRes.body.data.rejectedAt).toBeDefined();
    });

    it("F19-03: Unauthorized provider cannot accept or reject another owner's booking request (403 Forbidden)", async () => {
      const student = TEST_STUDENTS[0];
      const wrongOwner = TEST_PROVIDERS[1]; // Provider Tarek (owns Nasr flat, not Dokki building)
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

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${wrongOwner.id}:OWNER` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the property provider can accept this request');
    });

    it('F19-04: Rejection records rejection timestamp without closing conversation thread', async () => {
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
        `/api/v1/booking-requests/${reqId}/reject`,
        { reason: 'Rooms currently undergoing painting' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Check conversation is still accessible
      const convRes = await client.get(`/api/v1/booking-requests/${reqId}/conversation`, {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(convRes.status).toBe(200);
      expect(convRes.body.data.isOpenPermanently).toBe(true);
    });

    it('F19-05: Rejecting an already rejected request returns 400 Bad Request', async () => {
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
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Second rejection
      const secondReject = await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(secondReject.status).toBe(400);
      expect(secondReject.body.message).toContain(
        'Cannot reject booking request with status REJECTED',
      );
    });
  });

  // ==========================================
  // FEATURE F20: Student Request Direct Cancellation
  // ==========================================
  describe('F20: Student Request Direct Cancellation', () => {
    it('F20-01: Student directly cancels an unconfirmed PENDING booking request', async () => {
      const student = TEST_STUDENTS[0];
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

      const cancelRes = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        { reason: 'Found housing closer to campus' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.cancelledAt).toBeDefined();
    });

    it('F20-02: Student directly cancels an ACCEPTED booking request prior to confirmation', async () => {
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
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const cancelRes = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });

    it("F20-03: Cannot cancel another student's booking request (403 Forbidden)", async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[1];
      const reqRes = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-a1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const reqId = reqRes.body.data.bookingRequest.id;

      const cancelRes = await client.post(
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.message).toContain(
        'Only the requesting student can cancel this request',
      );
    });

    it('F20-04: Cancellation records internal cancellation details according to app.txt §5.8', async () => {
      const student = TEST_STUDENTS[0];
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
        `/api/v1/booking-requests/${reqId}/cancel`,
        { reason: 'Personal preference' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      const getReq = await client.get(`/api/v1/booking-requests/${reqId}`);
      expect(getReq.body.data.cancellationReason).toBe('Personal preference');
      expect(getReq.body.data.cancelledAt).toBeDefined();
    });

    it('F20-05: Provider is notified when student cancels request (§5.8)', async () => {
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
        `/api/v1/booking-requests/${reqId}/cancel`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );

      const notifsRes = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${owner.id}:OWNER`,
      });
      const cancelNotif = notifsRes.body.data.find(
        (n: any) => n.type === 'BOOKING_REQUEST_CANCELLED',
      );
      expect(cancelNotif).toBeDefined();
      expect(cancelNotif.messageAr).toContain('إلغاء');
    });
  });

  // ==========================================
  // FEATURE F21: Mutual Agreement Confirmation & Document Upload
  // ==========================================
  describe('F21: Mutual Agreement Confirmation & Document Upload', () => {
    it('F21-01: Mutual agreement requires confirmation from both student and owner', async () => {
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

      // Student confirms
      const sConf = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(sConf.body.data.confirmedBooking.studentAgreed).toBe(true);
      expect(sConf.body.data.confirmedBooking.providerAgreed).toBe(false);
      expect(sConf.body.data.confirmedBooking.status).not.toBe('CONFIRMED'); // Not yet confirmed

      // Owner confirms -> now finalized
      const oConf = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(oConf.body.data.confirmedBooking.status).toBe('CONFIRMED');
      expect(oConf.body.data.confirmedBooking.providerAgreed).toBe(true);
    });

    it('F21-02: Support optional agreement document upload attachment (app.txt §5.9)', async () => {
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
      const contractDocUrl = 'https://secure-docs.housing.eg/agreements/contract-req-01.pdf';

      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        { agreementDocUrl: contractDocUrl },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const oConf = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      expect(oConf.body.data.confirmedBooking.agreementDocumentUrl).toBe(contractDocUrl);
    });

    it('F21-03: Both student and provider receive confirmation notification alerts', async () => {
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

      const sNotifs = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      const oNotifs = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${owner.id}:OWNER`,
      });

      expect(sNotifs.body.data.some((n: any) => n.type === 'AGREEMENT_CONFIRMED')).toBe(true);
      expect(oNotifs.body.data.some((n: any) => n.type === 'AGREEMENT_CONFIRMED')).toBe(true);
    });

    it('F21-04: Non-participating third party cannot confirm agreement (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const thirdParty = TEST_STUDENTS[1];
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

      const res = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${thirdParty.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only booking participants can confirm mutual agreement');
    });

    it('F21-05: Confirmation records exact timestamp into confirmedAt', async () => {
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
      const oConf = await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      expect(oConf.body.data.confirmedBooking.confirmedAt).toBeDefined();
    });
  });

  // ==========================================
  // FEATURE F22: Concurrency Lock & Competing Requests Auto-Closure
  // ==========================================
  describe('F22: Concurrency Lock & Competing Requests Auto-Closure', () => {
    it('F22-01: Confirming booking atomically marks target portion unavailable', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
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
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const availRes = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
      );
      expect(availRes.body.data.isAvailable).toBe(false);
      expect(availRes.body.data.portion.bookedByStudentId).toBe(student.id);
    });

    it('F22-02: Confirming booking automatically closes all competing pending requests for the SAME portion (CLOSED_CONFLICT)', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const owner = TEST_PROVIDERS[0];

      // Student 1 requests Bed B1
      const r1 = await client.post(
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
      // Student 2 also requests Bed B1 (competing request)
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );

      // Student 1 and Owner confirm r1
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const confRes = await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      expect(confRes.body.data.autoClosedRequestsCount).toBe(1);

      // Verify Student 2's request is now CLOSED_CONFLICT (§5.9)
      const r2Updated = await client.get(
        `/api/v1/booking-requests/${r2.body.data.bookingRequest.id}`,
      );
      expect(r2Updated.body.data.status).toBe('CLOSED_CONFLICT');
    });

    it('F22-03: Competing requests on SIBLING portions (e.g. Bed B2) remain active and untouched', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const owner = TEST_PROVIDERS[0];

      // Student 1 requests Bed B1
      const r1 = await client.post(
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
      // Student 2 requests sibling Bed B2
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );

      // Confirm r1 (Bed B1)
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Student 2's request for Bed B2 must still be PENDING!
      const r2Updated = await client.get(
        `/api/v1/booking-requests/${r2.body.data.bookingRequest.id}`,
      );
      expect(r2Updated.body.data.status).toBe('PENDING');
    });

    it('F22-04: Competing student receives in-app notification when their request is closed due to conflict', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const owner = TEST_PROVIDERS[0];

      const r1 = await client.post(
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
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );

      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const notifsRes = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${student2.id}:STUDENT`,
      });
      const conflictNotif = notifsRes.body.data.find(
        (n: any) => n.type === 'REQUEST_CLOSED_CONFLICT',
      );
      expect(conflictNotif).toBeDefined();
      expect(conflictNotif.titleAr).toContain('إغلاق');
    });

    it('F22-05: Attempting confirmation on an already booked portion throws 409 Conflict (PORTION_ALREADY_BOOKED)', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const owner = TEST_PROVIDERS[0];

      const r1 = await client.post(
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
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );

      // Confirm r1
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${r1.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Attempt to confirm r2
      await client.post(
        `/api/v1/booking-requests/${r2.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      const res = await client.post(
        `/api/v1/booking-requests/${r2.body.data.bookingRequest.id}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('PORTION_ALREADY_BOOKED');
    });
  });

  // ==========================================
  // FEATURE F23: Mutual Contact Disclosure Transparency
  // ==========================================
  describe('F23: Mutual Contact Disclosure Transparency', () => {
    it('F23-01: Immediately upon booking creation, student sees provider name, phone number, and email', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
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
      expect(res.status).toBe(201);
      const contacts = res.body.data.mutualContacts;
      expect(contacts.provider).toBeDefined();
      expect(contacts.provider.nameAr).toBe(owner.nameAr);
      expect(contacts.provider.phone).toBe(owner.phone);
      expect(contacts.provider.email).toBe(owner.email);
    });

    it('F23-02: Immediately upon booking creation, provider sees student name, phone number, email, and university', async () => {
      const student = TEST_STUDENTS[0];
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
      const contacts = res.body.data.mutualContacts;
      expect(contacts.student).toBeDefined();
      expect(contacts.student.nameAr).toBe(student.nameAr);
      expect(contacts.student.phone).toBe(student.phone);
      expect(contacts.student.email).toBe(student.email);
      expect(contacts.student.universityId).toBe('univ-cairo');
    });

    it('F23-03: Sensitive KYC documents are strictly excluded from contact disclosure (app.txt §5.11)', async () => {
      const student = TEST_STUDENTS[0];
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
      const contacts = res.body.data.mutualContacts;
      // Verification documents must NOT be disclosed
      expect((contacts.provider as any).kycDocuments).toBeUndefined();
      expect((contacts.provider as any).nationalIdNumber).toBeUndefined();
    });

    it('F23-04: Student contact phone matches Egyptian mobile number format (+20...)', async () => {
      const student = TEST_STUDENTS[0];
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
      expect(res.body.data.mutualContacts.student.phone).toMatch(/^\+201[0125][0-9]{8}$/);
    });

    it('F23-05: Contact disclosure remains intact when request moves to ACCEPTED stage', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
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
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Student and owner details can still be queried
      const sUser = await client.get(`/api/v1/users/${student.id}`);
      const oUser = await client.get(`/api/v1/users/${owner.id}`);
      expect(sUser.body.data.phone).toBe(student.phone);
      expect(oUser.body.data.phone).toBe(owner.phone);
    });
  });
});
