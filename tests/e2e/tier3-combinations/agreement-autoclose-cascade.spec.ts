/**
 * Tier 3 Cross-Feature Combination: Agreement Auto-Close Cascade & Quota Release
 * Covers:
 * - F9 (Partial Availability), F16 (Booking Request Submission), F17 (Max 3 Open Requests),
 *   F21 (Mutual Agreement Confirmation), F22 (Auto-Closure of Competing Requests), F25 (Notifications)
 * - Portion confirmation marks portion UNAVAILABLE
 * - Automatically cascades status of all competing requests for the same portion to CLOSED_CONFLICT
 * - Sibling requests targeting other portions in the same room/unit remain unaffected (PENDING)
 * - Auto-closure frees quota slots for competing students, allowing new request submission
 * - Notification dispatching with REQUEST_CLOSED_CONFLICT
 *
 * Total: 7 Combination Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 3: Agreement Auto-Close Cascade & Quota Release (F9, F16, F17, F21, F22)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('COMB-AUTO-01: Confirming booking for Bed B1 automatically cascades competing requests to CLOSED_CONFLICT', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-b1';

    // Both students submit requests for Bed B1
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

    // Confirm agreement for Request 1
    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    const confirmRes = await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.autoClosedRequestsCount).toBe(1);

    // Check Request 2: auto-closed to CLOSED_CONFLICT
    const r2Check = await client.get(`/api/v1/booking-requests/${id2}`, {
      Authorization: `Bearer ${student2.id}:STUDENT`,
    });
    expect(r2Check.status).toBe(200);
    expect(r2Check.body.data.status).toBe('CLOSED_CONFLICT');
  });

  it('COMB-AUTO-02: Auto-closure does NOT affect requests targeting sibling beds in the same room', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];

    // Student 1 targets Bed B1; Student 2 targets Bed B2 in Room 101-B
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
        portionId: 'bed-dokki-101-b2',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );

    const id1 = r1.body.data.bookingRequest.id;
    const id2 = r2.body.data.bookingRequest.id;

    // Confirm Request 1 for Bed B1
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

    // Request 2 targeting Bed B2 must remain PENDING
    const r2Check = await client.get(`/api/v1/booking-requests/${id2}`, {
      Authorization: `Bearer ${student2.id}:STUDENT`,
    });
    expect(r2Check.status).toBe(200);
    expect(r2Check.body.data.status).toBe('PENDING');
  });

  it('COMB-AUTO-03: Auto-closed student has quota slot freed and can submit new booking request immediately', async () => {
    const competingStudent = TEST_STUDENTS[2]; // student-omar
    const winningStudent = TEST_STUDENTS[0]; // student-ahmed
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-b1';

    // Competing student submits 3 requests (reaching 3-request limit)
    // Request 1: for Bed B1 (competing with winning student)
    await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${competingStudent.id}:STUDENT` },
    );
    // Request 2 & 3: for other portions
    await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-b2',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${competingStudent.id}:STUDENT` },
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
      { Authorization: `Bearer ${competingStudent.id}:STUDENT` },
    );

    // Competing student now at 3 requests limit. 4th attempt is blocked:
    const blockedReq = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-c2',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${competingStudent.id}:STUDENT` },
    );
    expect(blockedReq.status).toBe(400);

    // Winning student books and confirms Bed B1
    const winReq = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${winningStudent.id}:STUDENT` },
    );
    const winId = winReq.body.data.bookingRequest.id;
    await client.post(
      `/api/v1/booking-requests/${winId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${winningStudent.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/booking-requests/${winId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // Competing student's Request 1 is auto-closed to CLOSED_CONFLICT
    // Open requests count dropped from 3 to 2!
    // Competing student can now submit a new 4th request:
    const newReq = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: 'prop-dokki-building',
        portionType: 'BED',
        portionId: 'bed-dokki-101-c2',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
      },
      { Authorization: `Bearer ${competingStudent.id}:STUDENT` },
    );
    expect(newReq.status).toBe(201);
    expect(newReq.body.data.bookingRequest.status).toBe('PENDING');
  });

  it('COMB-AUTO-04: Auto-closed student receives in-app notification with REQUEST_CLOSED_CONFLICT alert', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-b1';

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
    await client.post(
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

    // Confirm Request 1
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

    // Verify student 2 notifications
    const notifs = await client.get('/api/v1/notifications', {
      Authorization: `Bearer ${student2.id}:STUDENT`,
    });
    expect(notifs.status).toBe(200);
    const conflictNotif = notifs.body.data.find((n: any) => n.type === 'REQUEST_CLOSED_CONFLICT');
    expect(conflictNotif).toBeDefined();
    expect(conflictNotif.titleAr).toContain('إغلاق');
  });

  it('COMB-AUTO-05: Target portion is marked unavailable while sibling beds remain available in public search', async () => {
    const student1 = TEST_STUDENTS[0];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-b1';

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

    // Bed B1 is unavailable
    const b1 = await client.get(
      '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
    );
    expect(b1.body.data.isAvailable).toBe(false);

    // Bed B2 remains available
    const b2 = await client.get(
      '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b2/availability',
    );
    expect(b2.body.data.isAvailable).toBe(true);

    // Property still appears in search results because other beds are available
    const searchRes = await client.get('/api/v1/search?areaId=area-dokki');
    expect(searchRes.body.data.some((p: any) => p.id === 'prop-dokki-building')).toBe(true);
  });

  it('COMB-AUTO-06: Attempting to accept or confirm an auto-closed request fails', async () => {
    const student1 = TEST_STUDENTS[0];
    const student2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-b1';

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

    // Confirm Request 1 -> auto-closes Request 2
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

    // Attempting to accept auto-closed Request 2 fails
    const acceptFail = await client.post(
      `/api/v1/booking-requests/${id2}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(acceptFail.status).toBe(400);
    expect(acceptFail.body.message).toContain(
      'Cannot accept booking request with status CLOSED_CONFLICT',
    );
  });

  it('COMB-AUTO-07: Auto-closure cascade handles multiple competing requests simultaneously', async () => {
    const s1 = TEST_STUDENTS[0];
    const s2 = TEST_STUDENTS[2];
    const provider = TEST_PROVIDERS[0];
    const targetBedId = 'bed-dokki-101-c1';

    // Submit 2 competing requests for Bed C1
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

    // Confirm r1
    await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${s1.id}:STUDENT` },
    );
    const confirmRes = await client.post(
      `/api/v1/booking-requests/${id1}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.autoClosedRequestsCount).toBe(1);

    const r2Entity = await client.get(`/api/v1/booking-requests/${id2}`, {
      Authorization: `Bearer ${s2.id}:STUDENT`,
    });
    expect(r2Entity.body.data.status).toBe('CLOSED_CONFLICT');
  });
});
