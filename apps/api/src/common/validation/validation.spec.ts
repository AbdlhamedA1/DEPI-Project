import {
  auditLogQuerySchema,
  updateUserStatusSchema,
  analyticsExportQuerySchema,
  registerStudentSchema,
  registerOwnerSchema,
  createBookingRequestSchema,
} from '@repo/validation';
import { Gender, ProviderType, PricingUnit, DurationUnit } from '@repo/shared-types';

describe('Validation Schemas (Phase 12 QA)', () => {
  describe('Egyptian Phone & Registration Schemas', () => {
    it('should validate valid Egyptian student registration', () => {
      const validStudent = {
        phone: '+201012345678',
        fullName: 'أحمد محمود القاضي',
        universityId: 'a0000000-0000-0000-0000-000000000001',
        faculty: 'كلية الهندسة',
        academicYear: 3,
        gender: Gender.MALE,
      };
      const res = registerStudentSchema.safeParse(validStudent);
      expect(res.success).toBe(true);
    });

    it('should reject invalid Egyptian phone format', () => {
      const invalidPhoneStudent = {
        phone: '+1234567890', // non-Egyptian country code
        fullName: 'أحمد محمود',
        universityId: 'a0000000-0000-0000-0000-000000000001',
        faculty: 'كلية التجارة',
        academicYear: 2,
        gender: Gender.MALE,
      };
      const res = registerStudentSchema.safeParse(invalidPhoneStudent);
      expect(res.success).toBe(false);
    });

    it('should reject missing mandatory university for student', () => {
      const missingUniv = {
        phone: '+201012345678',
        fullName: 'أحمد محمود',
        faculty: 'كلية الآداب',
        academicYear: 1,
        gender: Gender.MALE,
      };
      const res = registerStudentSchema.safeParse(missingUniv);
      expect(res.success).toBe(false);
    });

    it('should validate provider registration with legal 14-digit Egyptian National ID', () => {
      const validOwner = {
        phone: '+201234567890',
        fullName: 'م. إبراهيم رضوان',
        providerType: ProviderType.INDIVIDUAL_OWNER,
        nationalIdNumber: '29801011234567', // 14 digits valid prefix
      };
      const res = registerOwnerSchema.safeParse(validOwner);
      expect(res.success).toBe(true);
    });

    it('should reject invalid provider National ID (< 14 digits)', () => {
      const invalidOwner = {
        phone: '+201234567890',
        fullName: 'م. إبراهيم رضوان',
        providerType: ProviderType.INDIVIDUAL_OWNER,
        nationalIdNumber: '12345',
      };
      const res = registerOwnerSchema.safeParse(invalidOwner);
      expect(res.success).toBe(false);
    });
  });

  describe('Admin Audit & User Status Schemas', () => {
    it('should validate audit log query parameters with pagination', () => {
      const validQuery = {
        actionType: 'KYC_APPROVE',
        limit: '50',
        offset: '0',
      };
      const res = auditLogQuerySchema.safeParse(validQuery);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.limit).toBe(50);
        expect(res.data.offset).toBe(0);
      }
    });

    it('should validate user status change (ACTIVE or SUSPENDED)', () => {
      const validSuspend = {
        status: 'SUSPENDED',
        reason: 'Violated platform booking guidelines',
      };
      expect(updateUserStatusSchema.safeParse(validSuspend).success).toBe(true);

      const invalidStatus = {
        status: 'DELETED', // Not in enum
      };
      expect(updateUserStatusSchema.safeParse(invalidStatus).success).toBe(false);
    });
  });

  describe('Analytics Export Query Schema', () => {
    it('should validate export options for CSV and JSON across supported reports', () => {
      expect(
        analyticsExportQuerySchema.safeParse({ reportType: 'overview', format: 'csv' }).success,
      ).toBe(true);
      expect(
        analyticsExportQuerySchema.safeParse({ reportType: 'users', format: 'json' }).success,
      ).toBe(true);
      expect(
        analyticsExportQuerySchema.safeParse({ reportType: 'audit-logs', format: 'csv' }).success,
      ).toBe(true);

      // Invalid report type
      expect(
        analyticsExportQuerySchema.safeParse({ reportType: 'arbitrary_fake', format: 'csv' })
          .success,
      ).toBe(false);
    });
  });

  describe('Booking Request Schema', () => {
    it('should require valid target portion and duration units', () => {
      const validBooking = {
        propertyId: 'a0000000-0000-0000-0000-000000000001',
        bedId: 'b0000000-0000-0000-0000-000000000001',
        pricingUnit: PricingUnit.PER_BED,
        durationUnit: DurationUnit.MONTHLY,
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2027-06-30T00:00:00.000Z',
      };
      const res = createBookingRequestSchema.safeParse(validBooking);
      expect(res.success).toBe(true);
    });
  });
});
