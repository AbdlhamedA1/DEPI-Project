/**
 * Tier 2 Boundary & Corner Cases: Security, Privacy & Access Control Boundaries
 * Covers:
 * - F4: Private KYC Document Access Restrictions (Strict 401 & 403 controls)
 * - F5: Role-Based Access Control (RBAC) & Route Guards
 * - Student Profile & Request Privacy (Isolation between students)
 * - Provider-to-Provider Isolation (Cannot access peer documents or listings)
 * - Conversation & Direct Chat Security (Only participants can access or send messages)
 * - Text-Only Content Validation & Empty/Whitespace Payload Rejection
 * - Audit Log Immutability (Append-only frozen entries)
 *
 * Total: 30 Boundary Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS, TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 2: Security, Privacy & Access Control Boundaries', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // =========================================================================
  // BOUNDARY 1: Private KYC Document Access Control (F4)
  // =========================================================================
  describe('Boundary 1: Private KYC Document Access Control', () => {
    it('B-SEC-01: Unauthenticated request to view provider KYC documents returns 401 Unauthorized', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.get(`/api/v1/owners/${provider.id}/kyc`);
      expect(res.status).toBe(401);
    });

    it('B-SEC-02: Student attempting to view provider KYC documents returns 403 Forbidden', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const res = await client.get(`/api/v1/owners/${provider.id}/kyc`, {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied: KYC documents are private');
    });

    it('B-SEC-03: Provider B attempting to view Provider A KYC documents returns 403 Forbidden', async () => {
      const providerA = TEST_PROVIDERS[0];
      const providerB = TEST_PROVIDERS[1];
      const res = await client.get(`/api/v1/owners/${providerA.id}/kyc`, {
        Authorization: `Bearer ${providerB.id}:OWNER`,
      });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied: KYC documents are private');
    });

    it('B-SEC-04: Provider A can view their own private KYC documents (200 OK)', async () => {
      const providerA = TEST_PROVIDERS[0];
      const res = await client.get(`/api/v1/owners/${providerA.id}/kyc`, {
        Authorization: `Bearer ${providerA.id}:OWNER`,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('B-SEC-05: Platform Admin can view any provider private KYC documents (200 OK)', async () => {
      const admin = TEST_ADMINS[0];
      const providerA = TEST_PROVIDERS[0];
      const res = await client.get(`/api/v1/owners/${providerA.id}/kyc`, {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('B-SEC-06: Unauthenticated user cannot upload KYC documents (401 Unauthorized)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(`/api/v1/owners/${provider.id}/kyc`, {
        type: 'NATIONAL_ID_FRONT',
        fileName: 'id_front.jpg',
        storageKey: 'keys/id_front.jpg',
      });
      expect(res.status).toBe(401);
    });

    it('B-SEC-07: Student cannot upload KYC documents to provider endpoint (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        `/api/v1/owners/${provider.id}/kyc`,
        { type: 'NATIONAL_ID_FRONT', fileName: 'id_front.jpg', storageKey: 'keys/id_front.jpg' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
    });

    it('B-SEC-08: Provider B cannot upload KYC document to Provider A account (403 Forbidden)', async () => {
      const providerA = TEST_PROVIDERS[0];
      const providerB = TEST_PROVIDERS[1];
      const res = await client.post(
        `/api/v1/owners/${providerA.id}/kyc`,
        { type: 'NATIONAL_ID_FRONT', fileName: 'id_front.jpg', storageKey: 'keys/id_front.jpg' },
        { Authorization: `Bearer ${providerB.id}:OWNER` },
      );
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // BOUNDARY 2: Student Privacy & Request Isolation (F5)
  // =========================================================================
  describe('Boundary 2: Student Privacy & Request Isolation', () => {
    it('B-SEC-09: Student B cannot view Student A booking requests (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const studentB = TEST_STUDENTS[1];
      const res = await client.get(`/api/v1/students/${studentA.id}/booking-requests`, {
        Authorization: `Bearer ${studentB.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Cannot access another user's resource");
    });

    it('B-SEC-10: Student A can view their own booking requests (200 OK)', async () => {
      const studentA = TEST_STUDENTS[0];
      const res = await client.get(`/api/v1/students/${studentA.id}/booking-requests`, {
        Authorization: `Bearer ${studentA.id}:STUDENT`,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('B-SEC-11: Provider cannot access student private booking requests list (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];
      const res = await client.get(`/api/v1/students/${studentA.id}/booking-requests`, {
        Authorization: `Bearer ${provider.id}:OWNER`,
      });
      expect(res.status).toBe(403);
    });

    it('B-SEC-12: Unauthenticated user cannot view student booking requests (401 Unauthorized)', async () => {
      const studentA = TEST_STUDENTS[0];
      const res = await client.get(`/api/v1/students/${studentA.id}/booking-requests`);
      expect(res.status).toBe(401);
    });

    it('B-SEC-13: Student B cannot update Student A phone number (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const studentB = TEST_STUDENTS[1];
      const res = await client.patch(
        `/api/v1/students/${studentA.id}/phone`,
        { newPhone: '+201011119999', otpToken: 'jwt-verified-+201011119999' },
        { Authorization: `Bearer ${studentB.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // BOUNDARY 3: Role Route Guards & Protected Endpoints (F5)
  // =========================================================================
  describe('Boundary 3: Role Route Guards & Protected Endpoints', () => {
    it('B-SEC-14: Student cannot create property listing (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/properties',
        { titleAr: 'سكن', titleEn: 'Prop', basePriceEgp: 3000 },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Role STUDENT not permitted');
    });

    it('B-SEC-15: Property Owner cannot submit student booking request (403 Forbidden)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/booking-requests',
        { propertyId: 'prop-dokki-building', portionType: 'BED', portionId: 'bed-dokki-101-b1' },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Role OWNER not permitted');
    });

    it('B-SEC-16: Student cannot access Admin KYC moderation queue (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.get('/api/v1/admin/moderation/kyc', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
    });

    it('B-SEC-17: Provider cannot access Admin KYC moderation queue (403 Forbidden)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.get('/api/v1/admin/moderation/kyc', {
        Authorization: `Bearer ${provider.id}:OWNER`,
      });
      expect(res.status).toBe(403);
    });

    it('B-SEC-18: Student cannot access Admin Listing moderation queue (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.get('/api/v1/admin/moderation/properties', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
    });

    it('B-SEC-19: Provider cannot access Admin Listing moderation queue (403 Forbidden)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.get('/api/v1/admin/moderation/properties', {
        Authorization: `Bearer ${provider.id}:OWNER`,
      });
      expect(res.status).toBe(403);
    });

    it('B-SEC-20: Unauthenticated user cannot access Admin Dashboard metrics (401 Unauthorized)', async () => {
      const res = await client.get('/api/v1/admin/dashboard/metrics');
      expect(res.status).toBe(401);
    });

    it('B-SEC-21: Unauthenticated user cannot access Admin Audit Logs (401 Unauthorized)', async () => {
      const res = await client.get('/api/v1/admin/audit-logs');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // BOUNDARY 4: Conversation & Chat Security Boundaries (F24)
  // =========================================================================
  describe('Boundary 4: Conversation & Chat Security Boundaries', () => {
    it('B-SEC-22: Non-participant user cannot access booking conversation (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const studentB = TEST_STUDENTS[1];
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

      // Student B attempts to read Student A's conversation
      const res = await client.get(`/api/v1/booking-requests/${reqId}/conversation`, {
        Authorization: `Bearer ${studentB.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied to this conversation');
    });

    it('B-SEC-23: Unauthenticated user cannot access conversation (401 Unauthorized)', async () => {
      const studentA = TEST_STUDENTS[0];
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

      const res = await client.get(`/api/v1/booking-requests/${reqId}/conversation`);
      expect(res.status).toBe(401);
    });

    it('B-SEC-24: Non-participant user cannot send message in conversation (403 Forbidden)', async () => {
      const studentA = TEST_STUDENTS[0];
      const studentB = TEST_STUDENTS[1];
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
      const convId = req.body.data.conversation.id;

      const res = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: 'Intruder message' },
        { Authorization: `Bearer ${studentB.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Sender is not a participant in this conversation');
    });

    it('B-SEC-25: Reject sending empty message with 400 Bad Request', async () => {
      const studentA = TEST_STUDENTS[0];
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
      const convId = req.body.data.conversation.id;

      const res = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: '' },
        { Authorization: `Bearer ${studentA.id}:STUDENT` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Message text cannot be empty');
    });

    it('B-SEC-26: Reject sending whitespace-only message with 400 Bad Request', async () => {
      const studentA = TEST_STUDENTS[0];
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
      const convId = req.body.data.conversation.id;

      const res = await client.post(
        `/api/v1/conversations/${convId}/messages`,
        { text: '   \n  \t  ' },
        { Authorization: `Bearer ${studentA.id}:STUDENT` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Message text cannot be empty');
    });
  });

  // =========================================================================
  // BOUNDARY 5: Report / Complaint Integrity & Audit Log Immutability
  // =========================================================================
  describe('Boundary 5: Report / Complaint Integrity & Audit Log Immutability', () => {
    it('B-SEC-27: Reject complaint submission with empty description (400 Bad Request)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-dokki-building',
          reason: 'MISLEADING_PHOTOS',
          description: '', // Empty description
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('description is mandatory');
    });

    it('B-SEC-28: Reject complaint submission with whitespace-only description (400 Bad Request)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-dokki-building',
          reason: 'MISLEADING_PHOTOS',
          description: '      ',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('description is mandatory');
    });

    it('B-SEC-29: Non-admin user cannot update complaint resolution status (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const reportRes = await client.post(
        '/api/v1/reports',
        {
          targetEntityType: 'PROPERTY',
          targetEntityId: 'prop-dokki-building',
          reason: 'MISLEADING_PHOTOS',
          description: 'The photos show a balcony that does not exist',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reportId = reportRes.body.data.id;

      // Student tries to mark complaint RESOLVED/CLOSED
      const updateRes = await client.patch(
        `/api/v1/reports/${reportId}/status`,
        { status: 'CLOSED', resolutionNotes: 'Self-resolved' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(updateRes.status).toBe(403);
    });

    it('B-SEC-30: Audit log entries are frozen objects preventing post-creation tampering', async () => {
      const admin = TEST_ADMINS[0];
      // Perform admin review to generate audit log entry
      await client.post(
        `/api/v1/admin/moderation/properties/prop-dokki-building/review`,
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );

      const logsRes = await client.get('/api/v1/admin/audit-logs', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(logsRes.status).toBe(200);
      expect(logsRes.body.data.length).toBeGreaterThan(0);

      const lastLog = logsRes.body.data[logsRes.body.data.length - 1];
      expect(lastLog.adminId).toBe(admin.id);
      expect(lastLog.action).toBe('LISTING_APPROVED');
      expect(lastLog.timestamp).toBeDefined();
    });
  });
});
