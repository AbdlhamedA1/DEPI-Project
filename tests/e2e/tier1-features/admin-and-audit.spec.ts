/**
 * Tier 1 Feature Coverage: Administration & Immutable Audit Logging (F29 - F30)
 * Covers:
 * - F29: Admin Moderation Queues (KYC & Listings)
 * - F30: Immutable Administrative Action Audit Logging
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_PROVIDERS, TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 1: Admin & Audit (F29 - F30)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F29: Admin Moderation Queues (KYC & Listings)
  // ==========================================
  describe('F29: Admin Moderation Queues (KYC & Listings)', () => {
    it('F29-01: Admin retrieves pending KYC verification queue', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.get('/api/v1/admin/moderation/kyc', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const p of res.body.data) {
        expect(p.verificationStatus).toBe('PENDING');
      }
    });

    it('F29-02: Admin approves provider KYC: status becomes VERIFIED and documents marked verified', async () => {
      const admin = TEST_ADMINS[0];
      const pendingProvider = TEST_PROVIDERS[3]; // provider-pending-kyc
      const res = await client.post(
        `/api/v1/admin/moderation/kyc/${pendingProvider.id}/review`,
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.reviewedByAdminId).toBe(admin.id);
      expect(res.body.data.reviewedAt).toBeDefined();
    });

    it('F29-03: Admin rejects provider KYC with reason: status becomes REJECTED and reason recorded', async () => {
      const admin = TEST_ADMINS[0];
      const pendingProvider = TEST_PROVIDERS[3];
      const reasonText = 'صورة بطاقة الرقم القومي غير واضحة ويجب رفع الوجهين.';
      const res = await client.post(
        `/api/v1/admin/moderation/kyc/${pendingProvider.id}/review`,
        { approved: false, rejectionReason: reasonText },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.verificationStatus).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe(reasonText);
    });

    it('F29-04: Admin retrieves pending listing queue and approves listing to make it active', async () => {
      const admin = TEST_ADMINS[0];
      const pendingListRes = await client.get('/api/v1/admin/moderation/properties', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(pendingListRes.status).toBe(200);
      const propId = pendingListRes.body.data[0].id;

      const approveRes = await client.post(
        `/api/v1/admin/moderation/properties/${propId}/review`,
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.approvalStatus).toBe('APPROVED');
      expect(approveRes.body.data.isActive).toBe(true);
    });

    it('F29-05: Admin suspends an active property listing for policy violations', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.post(
        '/api/v1/admin/moderation/properties/prop-dokki-building/suspend',
        { reason: 'Multiple confirmed complaints regarding fake listing data' },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('SUSPENDED');
      expect(res.body.data.isActive).toBe(false);
    });
  });

  // ==========================================
  // FEATURE F30: Immutable Administrative Action Audit Logging
  // ==========================================
  describe('F30: Immutable Administrative Action Audit Logging', () => {
    it('F30-01: KYC approval action logs an immutable audit entry with diff states', async () => {
      const admin = TEST_ADMINS[0];
      const provider = TEST_PROVIDERS[3];

      await client.post(
        `/api/v1/admin/moderation/kyc/${provider.id}/review`,
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );

      const logsRes = await client.get('/api/v1/admin/audit-logs', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(logsRes.status).toBe(200);
      const kycLog = logsRes.body.data.find(
        (l: any) => l.action === 'KYC_APPROVED' && l.targetId === provider.id,
      );
      expect(kycLog).toBeDefined();
      expect(kycLog.adminId).toBe(admin.id);
      expect(kycLog.targetEntity).toBe('PROVIDER_KYC');
      expect(kycLog.beforeState.verificationStatus).toBe('PENDING');
      expect(kycLog.afterState.verificationStatus).toBe('VERIFIED');
    });

    it('F30-02: KYC rejection action logs an audit entry with rejection reason recorded', async () => {
      const admin = TEST_ADMINS[0];
      const provider = TEST_PROVIDERS[3];
      const reason = 'مستندات غير مكتملة';

      await client.post(
        `/api/v1/admin/moderation/kyc/${provider.id}/review`,
        { approved: false, rejectionReason: reason },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );

      const logsRes = await client.get('/api/v1/admin/audit-logs', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      const rejLog = logsRes.body.data.find(
        (l: any) => l.action === 'KYC_REJECTED' && l.targetId === provider.id,
      );
      expect(rejLog).toBeDefined();
      expect(rejLog.afterState.rejectionReason).toBe(reason);
    });

    it('F30-03: Listing approval and suspension actions log immutable audit entries', async () => {
      const admin = TEST_ADMINS[0];
      await client.post(
        '/api/v1/admin/moderation/properties/prop-pending-approval/review',
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      await client.post(
        '/api/v1/admin/moderation/properties/prop-dokki-building/suspend',
        { reason: 'Takedown request' },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );

      const logsRes = await client.get('/api/v1/admin/audit-logs', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      const appLog = logsRes.body.data.find((l: any) => l.action === 'LISTING_APPROVED');
      const suspLog = logsRes.body.data.find((l: any) => l.action === 'LISTING_SUSPENDED');
      expect(appLog).toBeDefined();
      expect(suspLog).toBeDefined();
    });

    it('F30-04: Audit log entries record IP address and ISO timestamp', async () => {
      const admin = TEST_ADMINS[0];
      await client.post(
        '/api/v1/admin/moderation/kyc/provider-pending-kyc/review',
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );

      const logsRes = await client.get('/api/v1/admin/audit-logs', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      const log = logsRes.body.data[0];
      expect(log.ipAddress).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('F30-05: Platform dashboard metrics reflect accurate aggregated platform state', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.get('/api/v1/admin/dashboard/metrics', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.totalStudents).toBeGreaterThan(0);
      expect(res.body.data.totalProviders).toBeGreaterThan(0);
      expect(res.body.data.activeProperties).toBeGreaterThan(0);
      expect(res.body.data.avgMonthlyPriceEgp).toBeGreaterThan(0);
    });
  });
});
