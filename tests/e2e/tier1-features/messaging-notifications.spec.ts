/**
 * Tier 1 Feature Coverage: Messaging & In-App Notifications (F24 - F25)
 * Covers:
 * - F24: Request-Linked 1:1 Direct Chat & Permanent Retention
 * - F25: In-App Notifications & Event Alert Dispatch
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 1: Messaging & Notifications (F24 - F25)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F24: Request-Linked 1:1 Direct Chat & Permanent Retention
  // ==========================================
  describe('F24: Request-Linked 1:1 Direct Chat & Permanent Retention', () => {
    it('F24-01: Conversation is automatically generated and linked upon booking request creation', async () => {
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
      const reqId = res.body.data.bookingRequest.id;

      const convRes = await client.get(`/api/v1/booking-requests/${reqId}/conversation`, {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(convRes.status).toBe(200);
      expect(convRes.body.data.bookingRequestId).toBe(reqId);
      expect(convRes.body.data.studentId).toBe(student.id);
      expect(convRes.body.data.providerId).toBe('provider-mohamed-owner');
      expect(convRes.body.data.isOpenPermanently).toBe(true);
    });

    it('F24-02: Student and property owner can exchange text messages in conversation', async () => {
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
      const convId = reqRes.body.data.conversation.id;

      // Student sends message
      const sMsg = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: 'السلام عليكم، هل يمكن معاينة الغرفة يوم السبت القادم؟' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(sMsg.status).toBe(201);
      expect(sMsg.body.data.senderRole).toBe('STUDENT');

      // Owner replies
      const oMsg = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: 'أهلاً بك يا أحمد، بالتأكيد يمكنك المعاينة الساعة الرابعة عصراً.' },
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );
      expect(oMsg.status).toBe(201);
      expect(oMsg.body.data.senderRole).toBe('OWNER');
    });

    it('F24-03: Unread message count increments for receiving party', async () => {
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
      const convId = reqRes.body.data.conversation.id;

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

      const convRes = await client.get(
        `/api/v1/booking-requests/${reqRes.body.data.bookingRequest.id}/conversation`,
        {
          Authorization: `Bearer ${student.id}:STUDENT`,
        },
      );
      expect(convRes.body.data.providerUnreadCount).toBe(2);
    });

    it('F24-04: Conversation remains permanently accessible even when booking request is CANCELLED or REJECTED (app.txt §5.10)', async () => {
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
      const convId = reqRes.body.data.conversation.id;

      // Owner rejects booking request
      await client.post(
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      // Student can still access chat and send message!
      const postMsg = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: 'شكراً لك، هل هناك غرف أخرى ستكون متاحة قريباً؟' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(postMsg.status).toBe(201);
      expect(postMsg.body.success).toBe(true);
    });

    it('F24-05: Non-participating third party is forbidden from accessing or messaging in conversation (403)', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[1];
      const reqRes = await client.post(
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
      const convId = reqRes.body.data.conversation.id;

      const res = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: 'رسالة متطفل' },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Sender is not a participant in this conversation');
    });
  });

  // ==========================================
  // FEATURE F25: In-App Notifications & Event Alert Dispatch
  // ==========================================
  describe('F25: In-App Notifications & Event Alert Dispatch', () => {
    it('F25-01: Owner receives notification upon new booking request submission', async () => {
      const student = TEST_STUDENTS[0];
      const owner = TEST_PROVIDERS[0];
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

      const notifsRes = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${owner.id}:OWNER`,
      });
      const reqNotif = notifsRes.body.data.find((n: any) => n.type === 'BOOKING_REQUEST_RECEIVED');
      expect(reqNotif).toBeDefined();
      expect(reqNotif.titleAr).toContain('طلب حجز جديد');
    });

    it('F25-02: Student receives notification upon owner acceptance of booking request', async () => {
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

      const notifsRes = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      const acceptNotif = notifsRes.body.data.find(
        (n: any) => n.type === 'BOOKING_REQUEST_ACCEPTED',
      );
      expect(acceptNotif).toBeDefined();
      expect(acceptNotif.titleAr).toContain('قبول');
    });

    it('F25-03: Student receives notification upon owner rejection of booking request', async () => {
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
        `/api/v1/booking-requests/${reqId}/reject`,
        {},
        { Authorization: `Bearer ${owner.id}:OWNER` },
      );

      const notifsRes = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      const rejectNotif = notifsRes.body.data.find(
        (n: any) => n.type === 'BOOKING_REQUEST_REJECTED',
      );
      expect(rejectNotif).toBeDefined();
      expect(rejectNotif.titleAr).toContain('رفض');
    });

    it('F25-04: Both student and provider receive notification upon mutual agreement confirmation', async () => {
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

      const sNotifs = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      const oNotifs = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${owner.id}:OWNER`,
      });

      expect(sNotifs.body.data.some((n: any) => n.type === 'AGREEMENT_CONFIRMED')).toBe(true);
      expect(oNotifs.body.data.some((n: any) => n.type === 'AGREEMENT_CONFIRMED')).toBe(true);
    });

    it('F25-05: Competing student receives in-app notification when portion is booked by someone else', async () => {
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
      await client.post(
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

      const s2Notifs = await client.get('/api/v1/notifications', {
        Authorization: `Bearer ${student2.id}:STUDENT`,
      });
      const conflictNotif = s2Notifs.body.data.find(
        (n: any) => n.type === 'REQUEST_CLOSED_CONFLICT',
      );
      expect(conflictNotif).toBeDefined();
    });
  });
});
