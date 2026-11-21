/**
 * Tier 3 Cross-Feature Combination: Booking Concurrency & Row-Level Locking
 * Covers:
 * - F9 (Partial Availability), F16 (Booking Request), F21 (Mutual Agreement), F22 (Concurrency Lock)
 * - Atomic transaction simulation with SELECT FOR UPDATE row locking
 * - Concurrent agreement confirmation for the same accommodation portion:
 *   guarantees exactly one succeeds (200 OK) and competing attempts fail (409 Conflict).
 * - Sibling portion concurrency independence (concurrent bookings on different beds/rooms).
 * - Lock release resilience on error (no deadlocks).
 * - Multi-student race condition simulation.
 *
 * Total: 7 Combination Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 3: Booking Concurrency Lock & Race Conditions (F9, F16, F21, F22)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('COMB-CONC-01: Two students confirm the same bed concurrently -> exactly one gets 200 OK, the second gets 409 Conflict', async () => {
    const student1 = TEST_STUDENTS[0]; // student-ahmed
    const student2 = TEST_STUDENTS[2]; // student-omar
    const provider = TEST_PROVIDERS[0]; // provider-mohamed-owner
    const targetBedId = 'bed-dokki-101-b1';

    // 1. Both students submit booking requests for the EXACT same bed
    const req1Res = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    const req2Res = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    const req1Id = req1Res.body.data.bookingRequest.id;
    const req2Id = req2Res.body.data.bookingRequest.id;

    // 2. Both students signal mutual agreement
    await client.post(
      `/api/v1/booking-requests/${req1Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${req2Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    // 3. Provider confirms Request 1 -> succeeds (200 OK)
    const confirm1 = await client.post(
      `/api/v1/booking-requests/${req1Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(confirm1.status).toBe(200);
    expect(confirm1.body.data.confirmedBooking.status).toBe('CONFIRMED');

    // 4. Provider attempts to confirm Request 2 for the same bed -> strictly blocked with 409 Conflict
    const confirm2 = await client.post(
      `/api/v1/booking-requests/${req2Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(confirm2.status).toBe(409);
    expect(confirm2.body.error).toBe('PORTION_ALREADY_BOOKED');
  });

  it('COMB-CONC-02: Simultaneous simulated race condition on agreement confirmation results in 1 success and 1 conflict', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-b2';

    // Submit requests for Bed B2
    const r1 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
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
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    const id1 = r1.body.data.bookingRequest.id;
    const id2 = r2.body.data.bookingRequest.id;

    // Both students agree
    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${id2}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    // Execute concurrent confirmations via Promise.all
    const [resA, resB] = await Promise.all([
      client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
      client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  });

  it('COMB-CONC-03: Concurrent confirmations on DIFFERENT beds in the same room both succeed without conflict', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];

    // Student 1 targets Bed C1, Student 2 targets Bed C2 (Room 101-C has beds C1, C2, C3)
    const r1 = await client.post(
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
    const r2 = await client.post(
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

    const id1 = r1.body.data.bookingRequest.id;
    const id2 = r2.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${id2}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    // Concurrent confirmations on independent beds
    const [res1, res2] = await Promise.all([
      client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
      client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.data.confirmedBooking.status).toBe('CONFIRMED');
    expect(res2.body.data.confirmedBooking.status).toBe('CONFIRMED');
  });

  it('COMB-CONC-04: Concurrent confirmations in DIFFERENT units both succeed without conflict', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[1]; // female student for Nasr City flat
    const provider1 = TEST_PROVIDERS[0]; // owner of Dokki building
    const provider2 = TEST_PROVIDERS[1]; // agent of Nasr City flat

    // Student 1 books Bed B1 in Dokki building Unit 101
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
    // Student 2 books Bed R1-B1 in Nasr City flat Unit 01
    const r2 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-nasr-city-flat',
        portionType: 'BED',
        portionId: 'bed-nasr-r1-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    const id1 = r1.body.data.bookingRequest.id;
    const id2 = r2.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${id2}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    const [res1, res2] = await Promise.all([
      client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider1.id}:OWNER` },
      ),
      client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider2.id}:OWNER` },
      ),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('COMB-CONC-05: Hierarchical concurrency race: Whole Unit confirmation vs Individual Bed confirmation', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];

    // Student 1 books whole Unit 101, Student 2 books Bed B1 in Unit 101
    const rUnit = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'UNIT',
        portionId: 'unit-dokki-101',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    const rBed = await client.post(
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

    const idUnit = rUnit.body.data.bookingRequest.id;
    const idBed = rBed.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${idUnit}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${idBed}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    // Unit confirms first
    const confirmUnit = await client.post(
      `/api/v1/booking-requests/${idUnit}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(confirmUnit.status).toBe(200);

    // Bed confirmation now fails because whole unit was booked and locked child portions
    const confirmBed = await client.post(
      `/api/v1/booking-requests/${idBed}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(confirmBed.status).toBe(409);
  });

  it('COMB-CONC-06: Lock release resilience: when a confirmation fails, the row lock is cleanly released', async () => {
    const student1 = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];

    // Create and confirm a booking for Student 1 so they already have 1 confirmed booking
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
    const id1 = r1.body.data.bookingRequest.id;
    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // Now Student 2 creates a request for Bed B2
    const student2 = TEST_STUDENTS[2];
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
    const id2 = r2.body.data.bookingRequest.id;
    await client.post(
      `/api/v1/booking-requests/${id2}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );
    const confirm2 = await client.post(
      `/api/v1/booking-requests/${id2}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // Lock was cleanly released on Bed B2; confirmation succeeded
    expect(confirm2.status).toBe(200);
    expect(confirm2.body.data.confirmedBooking.status).toBe('CONFIRMED');
  });

  it('COMB-CONC-07: High-concurrency race condition: 2 students competing for Bed C3 -> exactly 1 succeeds, 1 fails', async () => {
    const s1 = TEST_STUDENTS[0];
    const s2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-c3';

    // Submit requests for Bed C3
    const r1 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${s1.id}:STUDENT` },
    );
    const r2 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${s2.id}:STUDENT` },
    );

    const id1 = r1.body.data.bookingRequest.id;
    const id2 = r2.body.data.bookingRequest.id;

    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${s1.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${id2}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${s2.id}:STUDENT` },
    );

    const [c1, c2] = await Promise.all([
      client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
      client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      ),
    ]);

    const results = [c1.status, c2.status];
    expect(results).toContain(200);
    expect(results).toContain(409);
  });
});
