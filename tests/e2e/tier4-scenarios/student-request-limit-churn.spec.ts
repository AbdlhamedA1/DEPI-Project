/**
 * Tier 4 Scenario 6 (S6): 3-Request Limit Management & Quota Churn
 * Features Exercised: F16 (Booking Request Submission), F17 (Max 3 Open Requests Enforcement),
 * F18 (Single Confirmed Booking Constraint), F20 (Direct Cancellation), F24 (Request-Linked Chat)
 * Domain Complexity: Medium
 *
 * Acceptance Criteria:
 * Student submits 3 requests (reaching limit). 4th attempt is strictly blocked (400).
 * Student cancels Request #1 (chat remains active); student successfully submits new Request #4
 * now that open quota is 2.
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 4 Scenario 6: Student Request Limit Churn & Quota Management (S6)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('S6-E2E: Student manages 3-request limit quota, cancels request with persistent chat, and submits new request', async () => {
    const student = TEST_STUDENTS[0]; // student-ahmed
    const provider = TEST_PROVIDERS[0];
    const propertyId = 'prop-dokki-building';

    // -----------------------------------------------------------------------
    // STEP 1: Student Submits 3 Consecutive Booking Requests (F16, F17)
    // -----------------------------------------------------------------------
    // Request 1: Bed B1
    const r1 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: 'bed-dokki-101-b1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'الطلب الأول: سرير B1',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(r1.status).toBe(201);
    const r1Id = r1.body.data.bookingRequest.id;
    const r1ConvId = r1.body.data.conversation.id;

    // Request 2: Bed B2
    const r2 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: 'bed-dokki-101-b2',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'الطلب الثاني: سرير B2',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(r2.status).toBe(201);

    // Request 3: Bed C1
    const r3 = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: 'bed-dokki-101-c1',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'الطلب الثالث: سرير C1',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(r3.status).toBe(201);

    // -----------------------------------------------------------------------
    // STEP 2: 4th Booking Request Attempt is Blocked with 400 (F17)
    // -----------------------------------------------------------------------
    const r4Blocked = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: 'bed-dokki-101-c2',
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'الطلب الرابع المفترض رفضه',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(r4Blocked.status).toBe(400);
    expect(r4Blocked.body.message).toContain('more than 3 simultaneous open booking requests');

    // -----------------------------------------------------------------------
    // STEP 3: Student Chats with Owner on Request #1 before deciding to cancel (F24)
    // -----------------------------------------------------------------------
    await client.post(
      `/api/v1/conversations/${r1ConvId}/messages`,
      { text: 'هل يمكن تأجيل موعد الدخول لأسبوع؟' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/conversations/${r1ConvId}/messages`,
      { text: 'للأسف الغرفة محجوزة لموعد محدد.' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );

    // -----------------------------------------------------------------------
    // STEP 4: Student Cancels Request #1 to Free a Quota Slot (F20)
    // -----------------------------------------------------------------------
    const cancelRes = await client.post(
      `/api/v1/booking-requests/${r1Id}/cancel`,
      { reason: 'Found alternative date option' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // -----------------------------------------------------------------------
    // STEP 5: Verify Chat #1 Remains Permanently Active Post-Cancellation (F24)
    // -----------------------------------------------------------------------
    const postCancelChat = await client.post(
      `/api/v1/conversations/${r1ConvId}/messages`,
      { text: 'شكراً لردك يا فندم، ألغيت الطلب للبحث عن موعد يناسبني.' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(postCancelChat.status).toBe(201);

    // -----------------------------------------------------------------------
    // STEP 6: Student Submits New Request #4 Now That Open Quota is 2 (F16, F17)
    // -----------------------------------------------------------------------
    const r4Success = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId,
        portionType: 'BED',
        portionId: 'bed-dokki-101-c2',
        proposedMoveInDate: '2026-10-08',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'طلب جديد بعد إلغاء الطلب الأول',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(r4Success.status).toBe(201);
    expect(r4Success.body.data.bookingRequest.status).toBe('PENDING');
    expect(r4Success.body.data.bookingRequest.portionId).toBe('bed-dokki-101-c2');

    // -----------------------------------------------------------------------
    // STEP 7: Verify Student Open Requests Count is Exactly 3 Again
    // -----------------------------------------------------------------------
    const studentReqs = await client.get(`/api/v1/students/${student.id}/booking-requests`, {
      Authorization: `Bearer ${student.id}:STUDENT`,
    });
    expect(studentReqs.status).toBe(200);

    const openReqs = studentReqs.body.data.filter(
      (r: any) => r.status === 'PENDING' || r.status === 'ACCEPTED',
    );
    const cancelledReqs = studentReqs.body.data.filter((r: any) => r.status === 'CANCELLED');

    expect(openReqs).toHaveLength(3); // r2, r3, r4
    expect(cancelledReqs).toHaveLength(1); // r1
  });
});
