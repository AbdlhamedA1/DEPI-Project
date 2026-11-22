import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { VerificationService } from '../verification/verification.service';
import { AuthService } from '../auth/auth.service';

describe('AdminService & Immutable Audit Trail (Phase 12 QA)', () => {
  let service: AdminService;
  let verificationServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    verificationServiceMock = {
      getAllPending: jest
        .fn()
        .mockReturnValue([
          { id: 'doc-1', userId: 'usr-1', status: 'PENDING', documentType: 'NATIONAL_ID' },
        ]),
      updateDocumentStatus: jest.fn().mockImplementation((docId, status, adminId, reason) => ({
        id: docId,
        userId: 'usr-1',
        status,
        documentType: 'NATIONAL_ID',
        reason,
      })),
    };

    authServiceMock = {
      updateUser: jest.fn(),
      findUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: VerificationService, useValue: verificationServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Immutable Audit Logging', () => {
    it('should record an immutable audit entry with client IP, action, and before/after states', async () => {
      const entry = await service.logAdminAction(
        'admin-super',
        'KYC_APPROVE',
        'KYC_DOCUMENT',
        'doc-test-1',
        { decision: 'APPROVE' },
        '197.38.14.22',
        'Chrome-Admin-Client',
      );

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.adminId).toBe('admin-super');
      expect(entry.ipAddress).toBe('197.38.14.22');
      expect(entry.timestamp).toBeDefined();
      expect(entry.action).toBe('KYC_APPROVED');
      expect(entry.targetEntity).toBe('PROVIDER_KYC');

      const logs = await service.getAuditLogs({ targetId: 'doc-test-1' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].id).toBe(entry.id);
    });

    it('should filter audit logs by actionType and targetType', async () => {
      await service.logAdminAction('admin-1', 'PROPERTY_SUSPEND', 'PROPERTY', 'prop-sus-01', {
        reason: 'Takedown',
      });

      const filtered = await service.getAuditLogs({ actionType: 'PROPERTY_SUSPEND' });
      expect(
        filtered.every(
          l => l.actionType === 'PROPERTY_SUSPEND' || l.action === 'LISTING_SUSPENDED',
        ),
      ).toBe(true);
    });
  });

  describe('KYC Review & Moderation', () => {
    it('should approve KYC verification and synchronously append audit log', async () => {
      const res = await service.reviewVerification(
        'doc-1',
        'admin-super',
        'APPROVE',
        undefined,
        '10.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(res.verificationStatus).toBe('VERIFIED');
      expect(res.reviewedByAdminId).toBe('admin-super');

      const logs = await service.getAuditLogs({ targetId: 'doc-1' });
      expect(logs.some(l => l.action === 'KYC_APPROVED')).toBe(true);
    });

    it('should reject KYC verification with mandatory reason and log audit trail', async () => {
      const reason = 'صورة البطاقة غير واضحة';
      const res = await service.reviewVerification(
        'doc-1',
        'admin-super',
        'REJECT',
        reason,
        '10.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(res.verificationStatus).toBe('REJECTED');
      expect(res.rejectionReason).toBe(reason);

      const logs = await service.getAuditLogs({ targetId: 'doc-1' });
      expect(logs.some(l => l.action === 'KYC_REJECTED')).toBe(true);
    });
  });

  describe('Property Moderation & Suspension', () => {
    it('should suspend active property listing and record audit trail', async () => {
      const res = await service.suspendProperty(
        'prop-dokki-1',
        'admin-super',
        'Complaints regarding fake pricing',
        '10.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(res.approvalStatus).toBe('SUSPENDED');
      expect(res.isActive).toBe(false);

      const logs = await service.getAuditLogs({ targetId: 'prop-dokki-1' });
      expect(logs.some(l => l.action === 'LISTING_SUSPENDED')).toBe(true);
    });
  });

  describe('User Account Suspension and Reactivation', () => {
    it('should suspend user account and record USER_SUSPEND action in audit log', async () => {
      const res = await service.updateUserStatus(
        'usr-violator',
        'SUSPENDED',
        'admin-super',
        'Abusive messages',
        '10.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('SUSPENDED');

      const logs = await service.getAuditLogs({ targetId: 'usr-violator' });
      expect(logs.some(l => l.action === 'USER_SUSPENDED')).toBe(true);
    });
  });
});
