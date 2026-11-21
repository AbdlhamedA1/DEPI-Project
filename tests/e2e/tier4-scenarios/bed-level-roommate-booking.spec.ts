/**
 * Tier 4 Scenario 2 (S2): Bed-in-Shared-Room Partial Booking & Roommate Flow
 * Features Exercised: F8, F9, F14, F16, F19, F21, F22, F24
 * Domain Complexity: High
 *
 * Acceptance Criteria:
 * Student books Bed #1 in a shared room. Upon mutual confirmation, Bed #1 is marked unavailable;
 * Sibling Bed #2 and Bed #3 remain publicly searchable and available; apartment remains partially available.
 * Second student subsequently searches, books Bed #2, and confirms without interference.
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 4 Scenario 2: Bed-Level Roommate Booking & Partial Availability (S2)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('S2-E2E: Partial bed booking leaves sibling beds available, allowing subsequent roommate booking', async () => {
    const student1 = TEST_STUDENTS[0]; // student-ahmed
    const student2 = TEST_STUDENTS[2]; // student-omar
    const provider = TEST_PROVIDERS[0];
    const propertyId = 'prop-dokki-building';

    // Room 101-C is a TRIPLE room containing 3 beds: bed-dokki-101-c1, c2, c3
    const bed1Id = 'bed-dokki-101-c1';
    const bed2Id = 'bed-dokki-101-c2';
    const bed3Id = 'bed-dokki-101-c3';

    // -----------------------------------------------------------------------
    // STEP 1: Verify Initial Availability of all 3 beds in Triple Room
    // -----------------------------------------------------------------------
    const b1Init = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed1Id}/availability`,
    );
    const b2Init = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed2Id}/availability`,
    );
    const b3Init = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed3Id}/availability`,
    );
    expect(b1Init.body.data.isAvailable).toBe(true);
    expect(b2Init.body.data.isAvailable).toBe(true);
    expect(b3Init.body.data.isAvailable).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 2: Student 1 Books Bed #1 in Room 101-C
    // -----------------------------------------------------------------------
    const req1 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: bed1Id,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'حجز السرير الأول بالغرفة الثلاثية',
      },
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    expect(req1.status).toBe(201);
    const req1Id = req1.body.data.bookingRequest.id;
    const conv1Id = req1.body.data.conversation.id;

    // Student 1 chats with provider
    await client.post(
      `/api/v1/conversations/${conv1Id}/messages`,
      { text: 'مرحباً، حجزت السرير رقم ١ بالغرفة الثلاثية.' },
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );

    // -----------------------------------------------------------------------
    // STEP 3: Student 1 & Provider Mutually Confirm Bed #1
    // -----------------------------------------------------------------------
    await client.post(
      `/api/v1/booking-requests/${req1Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student1.id}:STUDENT` },
    );
    const confirm1 = await client.post(
      `/api/v1/booking-requests/${req1Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(confirm1.status).toBe(200);
    expect(confirm1.body.data.confirmedBooking.status).toBe('CONFIRMED');

    // -----------------------------------------------------------------------
    // STEP 4: Invariant Verification: Bed #1 Unavailable; Sibling Beds #2 and #3 AVAILABLE
    // -----------------------------------------------------------------------
    const b1After = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed1Id}/availability`,
    );
    const b2After = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed2Id}/availability`,
    );
    const b3After = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed3Id}/availability`,
    );

    expect(b1After.body.data.isAvailable).toBe(false);
    expect(b1After.body.data.portion.bookedByStudentId).toBe(student1.id);
    expect(b2After.body.data.isAvailable).toBe(true);
    expect(b3After.body.data.isAvailable).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 5: Student 2 Discovers Partially Available Room & Books Bed #2
    // -----------------------------------------------------------------------
    const searchRes = await client.get('/api/v1/search?areaId=area-dokki&genderPolicy=MALE_ONLY');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.some((p: any) => p.id === propertyId)).toBe(true);

    const req2 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: bed2Id,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'طالب في كلية العلوم، أرغب في حجز السرير الثاني في نفس الغرفة.',
      },
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );
    expect(req2.status).toBe(201);
    const req2Id = req2.body.data.bookingRequest.id;

    // -----------------------------------------------------------------------
    // STEP 6: Student 2 & Provider Mutually Confirm Bed #2
    // -----------------------------------------------------------------------
    await client.post(
      `/api/v1/booking-requests/${req2Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );
    const confirm2 = await client.post(
      `/api/v1/booking-requests/${req2Id}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(confirm2.status).toBe(200);

    // -----------------------------------------------------------------------
    // STEP 7: Final Invariants: Both Bed #1 and Bed #2 booked, Bed #3 still AVAILABLE
    // -----------------------------------------------------------------------
    const b1Final = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed1Id}/availability`,
    );
    const b2Final = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed2Id}/availability`,
    );
    const b3Final = await client.get(
      `/api/v1/properties/${propertyId}/portions/BED/${bed3Id}/availability`,
    );

    expect(b1Final.body.data.isAvailable).toBe(false);
    expect(b1Final.body.data.portion.bookedByStudentId).toBe(student1.id);
    expect(b2Final.body.data.isAvailable).toBe(false);
    expect(b2Final.body.data.portion.bookedByStudentId).toBe(student2.id);
    expect(b3Final.body.data.isAvailable).toBe(true);
  });
});
