/**
 * Tier 4 Scenario 5 (S5): High-Concurrency Dual Student Booking Race Condition
 * Features Exercised: F9 (Partial Availability), F16 (Booking Request Submission),
 * F19 (Provider Decision), F21 (Mutual Agreement Confirmation),
 * F22 (Row-Locking Concurrency & Auto-Closure), F25 (Notification Dispatch)
 * Domain Complexity: Critical
 *
 * Acceptance Criteria:
 * Two students simultaneously attempt to confirm booking for the last available bed in a Dokki apartment.
 * Concurrency row lock guarantees exactly one confirmation succeeds (200 OK);
 * the second fails with 409 Conflict and is auto-closed with in-app notification.
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 4 Scenario 5: High-Concurrency Dual Student Booking Race (S5)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('S5-E2E: Dual student simultaneous confirmation race condition strictly resolves to 1 winner and 1 auto-closed conflict', async () => {
    const studentA = TEST_STUDENTS[0]; // student-ahmed
    const studentB = TEST_STUDENTS[2]; // student-omar
    const provider = TEST_PROVIDERS[0]; // provider-mohamed-owner
    const propertyId = 'prop-dokki-building';
    const contestedBedId = 'bed-dokki-101-b1';

    // -----------------------------------------------------------------------
    // STEP 1: Verify Initial Availability of Contested Bed
    // -----------------------------------------------------------------------
    const availCheck = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${contestedBedId}/availability`,
    );
    expect(availCheck.status).toBe(200);
    expect(availCheck.body.data.isAvailable).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 2: Both Students Discover & Submit Requests for the Same Bed (F16)
    // -----------------------------------------------------------------------
    const [reqARes, reqBRes] = await Promise.all([
      client.post(
        '/api/v1/booking-requests',
        {
          propertyId,
          portionType: 'BED',
          portionId: contestedBedId,
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
          studentNotes: 'طلب الطالب أحمد',
        },
        { Authorization: `Bearer ${studentA.id}:STUDENT` },
      ),
      client.post(
        '/api/v1/booking-requests',
        {
          propertyId,
          portionType: 'BED',
          portionId: contestedBedId,
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
          studentNotes: 'طلب الطالب عمر',
        },
        { Authorization: `Bearer ${studentB.id}:STUDENT` },
      ),
    ]);

    expect(reqARes.status).toBe(201);
    expect(reqBRes.status).toBe(201);

    const reqAId = reqARes.body.data.bookingRequest.id;
    const reqBId = reqBRes.body.data.bookingRequest.id;

    // -----------------------------------------------------------------------
    // STEP 3: Both Students Signal Agreement (F21)
    // -----------------------------------------------------------------------
    await client.post(
      `/api/v1/booking-requests/${reqAId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${studentA.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${reqBId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${studentB.id}:STUDENT` },
    );

    // -----------------------------------------------------------------------
    // STEP 4: Provider Simultaneously Triggers Final Confirmation (Race Condition Simulation)
    // -----------------------------------------------------------------------
    const [confirmA, confirmB] = await Promise.all([
      client.post(
        `/api/v1/booking-requests/${reqAId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
      client.post(
        `/api/v1/booking-requests/${reqBId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
    ]);

    const results = [confirmA, confirmB];
    const successes = results.filter(r => r.status === 200);
    const conflicts = results.filter(r => r.status === 409);

    // EXACTLY ONE SUCCESS, EXACTLY ONE CONFLICT
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(1);

    const winningResult = successes[0];
    const losingResult = conflicts[0];

    expect(winningResult.body.data.confirmedBooking.status).toBe('CONFIRMED');
    expect(['CONCURRENCY_LOCK_COLLISION', 'PORTION_ALREADY_BOOKED']).toContain(
      losingResult.body.error,
    );

    // -----------------------------------------------------------------------
    // STEP 6: Invariant Verifications: Bed Unavailable & Competing Request Closed
    // -----------------------------------------------------------------------
    const bedAvail = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${contestedBedId}/availability`,
    );
    expect(bedAvail.body.data.isAvailable).toBe(false);

    // Determine winning and losing request IDs
    const winningId = winningResult.body.data.confirmedBooking.id;
    const losingId = winningId === reqAId ? reqBId : reqAId;
    const losingStudent = winningId === reqAId ? studentB : studentA;

    // Competing request must be CLOSED_CONFLICT
    const losingReqEntity = await client.get(`/api/v1/booking-requests/${losingId}`, {
      Authorization: `Bearer ${losingStudent.id}:STUDENT`,
    });
    expect(losingReqEntity.body.data.status).toBe('CLOSED_CONFLICT');

    // -----------------------------------------------------------------------
    // STEP 7: Notification Dispatch to Losing Student (F25)
    // -----------------------------------------------------------------------
    const losingNotifs = await client.get('/api/v1/notifications', {
      Authorization: `Bearer ${losingStudent.id}:STUDENT`,
    });
    const conflictAlert = losingNotifs.body.data.find(
      (n: any) => n.type === 'REQUEST_CLOSED_CONFLICT',
    );
    expect(conflictAlert).toBeDefined();
    expect(conflictAlert.data.requestId).toBe(losingId);
  });
});
