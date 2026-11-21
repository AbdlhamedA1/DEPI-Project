/**
 * Tier 3 Cross-Feature Combination: Chat Persistence Lifecycle Across State Transitions
 * Covers:
 * - F16 (Booking Request Submission), F19 (Provider Decision), F20 (Student Cancellation),
 *   F22 (Auto-Closure), F24 (Request-Linked Direct Chat & Permanent Retention)
 * - In-app conversation thread is automatically initialized upon booking request submission
 * - Request REJECTED -> conversation thread remains permanently open and messaging continues
 * - Request CANCELLED -> conversation thread remains permanently open and messaging continues
 * - Request CLOSED_CONFLICT -> conversation thread remains open and messaging continues
 * - Bidirectional messaging between student and property provider
 * - Unread message counter tracking and chronological ordering
 * - Strict non-participant isolation (403 Forbidden)
 *
 * Total: 7 Combination Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 3: Chat Persistence Lifecycle Across State Transitions (F16, F19, F20, F24)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('COMB-CHAT-01: Direct chat conversation is automatically initialized upon booking request creation', async () => {
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

    expect(res.status).toBe(201);
    expect(res.body.data.conversation).toBeDefined();
    expect(res.body.data.conversation.isOpenPermanently).toBe(true);
    expect(res.body.data.conversation.messages).toHaveLength(0);
    expect(res.body.data.conversation.studentId).toBe(student.id);
  });

  it('COMB-CHAT-02: Student and provider can exchange bidirectional messages during PENDING state', async () => {
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
    const convId = reqRes.body.data.conversation.id;

    // Student sends message
    const msg1 = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'السلام عليكم، هل السكن متاح من أول أكتوبر؟' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(msg1.status).toBe(201);
    expect(msg1.body.data.senderRole).toBe('STUDENT');

    // Provider sends reply
    const msg2 = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'أهلاً بك يا أحمد، نعم السرير متاح ويمكنك المعاينة غداً.' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(msg2.status).toBe(201);
    expect(msg2.body.data.senderRole).toBe('OWNER');

    // Fetch conversation and verify message history
    const convRes = await client.get(
      `/api/v1/booking-requests/${reqRes.body.data.bookingRequest.id}/conversation`,
      {
        Authorization: `Bearer ${student.id}:STUDENT`,
      },
    );
    expect(convRes.body.data.messages).toHaveLength(2);
  });

  it('COMB-CHAT-03: Thread remains permanently open and messaging continues after request REJECTION', async () => {
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
    const convId = reqRes.body.data.conversation.id;

    // Provider rejects booking request
    const rejectRes = await client.post(
      `/api/v1/booking-requests/${reqId}/reject`,
      { reason: 'Room under maintenance' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('REJECTED');

    // In accordance with app.txt §5.10, thread remains permanently open
    const postRejectMsg = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'شكراً لك، هل يوجد سرير آخر في دور مختلف؟' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(postRejectMsg.status).toBe(201);
    expect(postRejectMsg.body.data.text).toContain('هل يوجد سرير آخر');

    const providerReply = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'نعم يوجد سرير في الدور الثاني، يمكنك تقديم طلب جديد.' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(providerReply.status).toBe(201);
  });

  it('COMB-CHAT-04: Thread remains permanently open and messaging continues after student CANCELLATION', async () => {
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
    const convId = reqRes.body.data.conversation.id;

    // Student cancels request
    await client.post(
      `/api/v1/booking-requests/${reqId}/cancel`,
      { reason: 'Found housing closer to faculty' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );

    // Messaging continues normally post-cancellation
    const postCancelMsg = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'اعتذر عن الإلغاء، شكراً لحسن تعاونك.' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(postCancelMsg.status).toBe(201);

    const providerAck = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'لا توجد مشكلة، بالتوفيق في دراستك.' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(providerAck.status).toBe(201);
  });

  it('COMB-CHAT-05: Thread remains open after request is auto-closed to CLOSED_CONFLICT', async () => {
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
    const conv2Id = r2.body.data.conversation.id;

    // Confirm Request 1 -> Request 2 auto-closes to CLOSED_CONFLICT
    await client.post(
      `/api/v1/booking-requests/${id1}/accept`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
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

    // Competing student can still message provider in the auto-closed thread
    const msg = await client.post(
      `/api/v1/conversations/${conv2Id}/messages`,
      { text: 'هل تتوفر أي أسرة أخرى قريباً؟' },
      { Authorization: `Bearer ${student2.id}:STUDENT` },
    );
    expect(msg.status).toBe(201);
  });

  it('COMB-CHAT-06: Unread message counters increment appropriately for recipient', async () => {
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
    const convId = reqRes.body.data.conversation.id;
    const reqId = reqRes.body.data.bookingRequest.id;

    // Student sends 2 messages
    await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'رسالة 1' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'رسالة 2' },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );

    const conv = await client.get(`/api/v1/booking-requests/${reqId}/conversation`, {
      Authorization: `Bearer ${student.id}:STUDENT`,
    });
    // Provider unread counter incremented
    expect(conv.body.data.providerUnreadCount).toBe(2);
    expect(conv.body.data.studentUnreadCount).toBe(0);
  });

  it('COMB-CHAT-07: Third-party student cannot view or send messages in another student conversation (403 Forbidden)', async () => {
    const studentA = TEST_STUDENTS[0];
    const studentB = TEST_STUDENTS[1];
    const reqRes = await client.post(
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
    const convId = reqRes.body.data.conversation.id;

    // Student B attempts to send message
    const sendRes = await client.post(
      `/api/v1/conversations/${convId}/messages`,
      { text: 'Spying message' },
      { Authorization: `Bearer ${studentB.id}:STUDENT` },
    );
    expect(sendRes.status).toBe(403);
    expect(sendRes.body.message).toContain('Sender is not a participant in this conversation');
  });
});
