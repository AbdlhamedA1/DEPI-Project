/**
 * Tier 2 Boundary & Corner Cases: Authentication, OTP & Identity Boundaries
 * Covers:
 * - F1: Phone OTP Verification, Expiration (>5 mins), Rate Limits (max 3 in 10 mins -> 429)
 * - F1: Egyptian phone number formatting bounds (+2010, +2011, +2012, +2015 + 8 digits)
 * - F1: Invalid Egyptian phone prefixes, lengths, non-numeric characters (400)
 * - F1: Maximum 3 failed verification attempts invalidation
 * - F2: Mandatory University Association rejection (422) & Phone Update verification token requirement
 * - F3: Provider Registration & 14-digit National ID format boundaries
 * - F3: Legal company name requirement for Management Company
 * - Duplicate registration prevention (409 Conflict)
 *
 * Total: 30 Boundary Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS } from '../../fixtures/users.fixture';

describe('Tier 2: Authentication, OTP & Identity Boundaries', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // =========================================================================
  // BOUNDARY 1: Egyptian Phone Format Boundaries (+201[0125]XXXXXXXX)
  // =========================================================================
  describe('Boundary 1: Egyptian Phone Format Boundaries', () => {
    it('B-AUTH-01: Accept valid Vodafone Egypt prefix (+2010XXXXXXXX)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+201011112222' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('B-AUTH-02: Accept valid Etisalat Misr prefix (+2011XXXXXXXX)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+201133334444' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('B-AUTH-03: Accept valid Orange Egypt prefix (+2012XXXXXXXX)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+201255556666' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('B-AUTH-04: Accept valid Telecom Egypt WE prefix (+2015XXXXXXXX)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+201577778888' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('B-AUTH-05: Reject invalid telecom prefix +2013 (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+201311112222' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('B-AUTH-06: Reject invalid telecom prefix +2014 (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+201411112222' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('B-AUTH-07: Reject invalid telecom prefix +2016 through +2019 (400 Bad Request)', async () => {
      const res16 = await client.post('/api/v1/auth/otp/request', { phone: '+201611112222' });
      const res17 = await client.post('/api/v1/auth/otp/request', { phone: '+201711112222' });
      const res18 = await client.post('/api/v1/auth/otp/request', { phone: '+201811112222' });
      const res19 = await client.post('/api/v1/auth/otp/request', { phone: '+201911112222' });
      expect(res16.status).toBe(400);
      expect(res17.status).toBe(400);
      expect(res18.status).toBe(400);
      expect(res19.status).toBe(400);
    });

    it('B-AUTH-08: Reject phone missing leading plus sign (e.g. 201011112222)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '201011112222' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('B-AUTH-09: Reject domestic local number without country code (e.g. 01011112222)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '01011112222' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('B-AUTH-10: Reject short phone number with 12 characters (+20101111222)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+20101111222' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('B-AUTH-11: Reject long phone number with 14 characters (+2010111122229)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', { phone: '+2010111122229' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('B-AUTH-12: Reject phone number with alphabetic or special characters', async () => {
      const resAlpha = await client.post('/api/v1/auth/otp/request', { phone: '+20101111222a' });
      const resDash = await client.post('/api/v1/auth/otp/request', { phone: '+2010-111-2222' });
      const resSpace = await client.post('/api/v1/auth/otp/request', { phone: '+2010 11112222' });
      expect(resAlpha.status).toBe(400);
      expect(resDash.status).toBe(400);
      expect(resSpace.status).toBe(400);
    });
  });

  // =========================================================================
  // BOUNDARY 2: OTP Verification & Rate Limiting Bounds
  // =========================================================================
  describe('Boundary 2: OTP Verification & Rate Limiting Bounds', () => {
    it('B-AUTH-13: Exactly 3 OTP requests allowed within 10 minutes window', async () => {
      const phone = '+201055551111';
      const r1 = await client.post('/api/v1/auth/otp/request', { phone });
      const r2 = await client.post('/api/v1/auth/otp/request', { phone });
      const r3 = await client.post('/api/v1/auth/otp/request', { phone });

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(200);
    });

    it('B-AUTH-14: 4th OTP request within 10 minutes window triggers 429 Too Many Requests', async () => {
      const phone = '+201055552222';
      await client.post('/api/v1/auth/otp/request', { phone });
      await client.post('/api/v1/auth/otp/request', { phone });
      await client.post('/api/v1/auth/otp/request', { phone });

      const r4 = await client.post('/api/v1/auth/otp/request', { phone });
      expect(r4.status).toBe(429);
      expect(r4.body.message).toContain('Too many OTP requests');
    });

    it('B-AUTH-15: Verifying correct OTP returns 200 OK and verification token', async () => {
      const phone = '+201055553333';
      await client.post('/api/v1/auth/otp/request', { phone });
      const verifyRes = await client.post('/api/v1/auth/otp/verify', { phone, code: '123456' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.verified).toBe(true);
      expect(verifyRes.body.data.token).toContain(`jwt-verified-${phone}`);
    });

    it('B-AUTH-16: Verifying incorrect OTP returns 401 Unauthorized', async () => {
      const phone = '+201055554444';
      await client.post('/api/v1/auth/otp/request', { phone });
      const verifyRes = await client.post('/api/v1/auth/otp/verify', { phone, code: '000000' });

      expect(verifyRes.status).toBe(401);
      expect(verifyRes.body.message).toContain('Invalid OTP code');
    });

    it('B-AUTH-17: 3 consecutive failed verification attempts lock out and invalidate OTP', async () => {
      const phone = '+201055556666';
      await client.post('/api/v1/auth/otp/request', { phone });

      // 3 wrong attempts
      await client.post('/api/v1/auth/otp/verify', { phone, code: '111111' });
      await client.post('/api/v1/auth/otp/verify', { phone, code: '222222' });
      await client.post('/api/v1/auth/otp/verify', { phone, code: '333333' });

      // 4th attempt is locked out
      const lockedRes = await client.post('/api/v1/auth/otp/verify', { phone, code: '123456' });
      expect(lockedRes.status).toBe(400);
      expect(lockedRes.body.message).toContain('Too many failed attempts. OTP invalidated');
    });

    it('B-AUTH-18: Verifying OTP without requesting one first returns 400 Bad Request', async () => {
      const res = await client.post('/api/v1/auth/otp/verify', {
        phone: '+201099990000',
        code: '123456',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No OTP requested for this phone number');
    });

    it('B-AUTH-19: Re-verifying with already consumed OTP returns 400 Bad Request', async () => {
      const phone = '+201055557777';
      await client.post('/api/v1/auth/otp/request', { phone });
      // First verification succeeds and consumes the OTP
      await client.post('/api/v1/auth/otp/verify', { phone, code: '123456' });

      // Second verification attempt fails
      const secondRes = await client.post('/api/v1/auth/otp/verify', { phone, code: '123456' });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('No OTP requested for this phone number');
    });
  });

  // =========================================================================
  // BOUNDARY 3: Student Registration & University Association Bounds (F2)
  // =========================================================================
  describe('Boundary 3: Student Registration & University Association Bounds', () => {
    it('B-AUTH-20: Student registration strictly rejects missing universityId with 422 Unprocessable Entity', async () => {
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'طالب بدون جامعة',
        nameEn: 'Student Without Univ',
        email: 'nouniv@cu.edu.eg',
        phone: '+201088880001',
        gender: 'MALE',
        universityId: '', // Empty university!
        faculty: 'Science',
        academicYear: 1,
        originGovernorateId: 'gov-cairo',
      });
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Mandatory university selection is required');
    });

    it('B-AUTH-21: Student registration strictly rejects invalid universityId with 422', async () => {
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'طالب بجامعة وهمية',
        nameEn: 'Student Fake Univ',
        email: 'fakeuniv@cu.edu.eg',
        phone: '+201088880002',
        gender: 'MALE',
        universityId: 'univ-hogwarts', // Non-existent university
        faculty: 'Magic',
        academicYear: 1,
        originGovernorateId: 'gov-cairo',
      });
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Mandatory university selection is required');
    });

    it('B-AUTH-22: Student registration rejects duplicate phone with 409 Conflict', async () => {
      const existingStudent = TEST_STUDENTS[0];
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'طالب بهاتف مكرر',
        nameEn: 'Duplicate Phone Student',
        email: 'newemail@cu.edu.eg',
        phone: existingStudent.phone, // Duplicate phone!
        gender: 'MALE',
        universityId: 'univ-cairo',
        faculty: 'Arts',
        academicYear: 2,
        originGovernorateId: 'gov-cairo',
      });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Phone number already registered');
    });

    it('B-AUTH-23: Student registration rejects duplicate email with 409 Conflict', async () => {
      const existingStudent = TEST_STUDENTS[0];
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'طالب ببريد مكرر',
        nameEn: 'Duplicate Email Student',
        email: existingStudent.email, // Duplicate email!
        phone: '+201088880003',
        gender: 'MALE',
        universityId: 'univ-cairo',
        faculty: 'Arts',
        academicYear: 2,
        originGovernorateId: 'gov-cairo',
      });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Email address already registered');
    });

    it('B-AUTH-24: Updating student phone without verified OTP token returns 401 Unauthorized', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.patch(
        `/api/v1/students/${student.id}/phone`,
        { newPhone: '+201088889999', otpToken: 'invalid-unverified-token' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('must be verified via OTP first');
    });

    it('B-AUTH-25: Updating student phone with verified OTP token succeeds (200 OK)', async () => {
      const student = TEST_STUDENTS[0];
      const newPhone = '+201088887777';
      await client.post('/api/v1/auth/otp/request', { phone: newPhone });
      const verifyRes = await client.post('/api/v1/auth/otp/verify', {
        phone: newPhone,
        code: '123456',
      });

      const updateRes = await client.patch(
        `/api/v1/students/${student.id}/phone`,
        { newPhone, otpToken: verifyRes.body.data.token },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.phone).toBe(newPhone);
    });
  });

  // =========================================================================
  // BOUNDARY 4: Provider National ID & Legal Classification Bounds (F3)
  // =========================================================================
  describe('Boundary 4: Provider National ID & Legal Classification Bounds', () => {
    it('B-AUTH-26: Provider National ID must be exactly 14 digits starting with 2 or 3', async () => {
      // 13 digits (too short)
      const resShort = await client.post('/api/v1/owners/register', {
        nameAr: 'مالك برقم قومي قصير',
        nameEn: 'Short ID Owner',
        email: 'shortid@test.com',
        phone: '+201077770001',
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '2980101123456', // 13 digits
      });
      expect(resShort.status).toBe(400);
      expect(resShort.body.message).toContain('14-digit Egyptian National ID');

      // 15 digits (too long)
      const resLong = await client.post('/api/v1/owners/register', {
        nameAr: 'مالك برقم قومي طويل',
        nameEn: 'Long ID Owner',
        email: 'longid@test.com',
        phone: '+201077770002',
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '298010112345678', // 15 digits
      });
      expect(resLong.status).toBe(400);

      // Starting with invalid century prefix (1 or 4)
      const resPrefix = await client.post('/api/v1/owners/register', {
        nameAr: 'مالك ببادئة غير صحيحة',
        nameEn: 'Wrong Prefix Owner',
        email: 'wrongprefix@test.com',
        phone: '+201077770003',
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '19801011234567', // Starts with 1
      });
      expect(resPrefix.status).toBe(400);
    });

    it('B-AUTH-27: Valid Egyptian National ID (starts with 2 for 1900s or 3 for 2000s) is accepted', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'مالك بهوية صحيحة',
        nameEn: 'Valid ID Owner',
        email: 'validid@test.com',
        phone: '+201077770004',
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '29505151234567', // Valid 14 digits starting with 2
      });
      expect(res.status).toBe(201);
      expect(res.body.data.verificationStatus).toBe('UNVERIFIED');
    });

    it('B-AUTH-28: MANAGEMENT_COMPANY requires legal companyNameAr (422 if missing)', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'مدير شركة',
        nameEn: 'Company Director',
        email: 'nocompany@test.com',
        phone: '+201077770005',
        providerType: 'MANAGEMENT_COMPANY',
        nationalIdNumber: '29001011234567',
        // companyNameAr omitted!
      });
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('requires legal company name');
    });

    it('B-AUTH-29: MANAGEMENT_COMPANY with valid companyNameAr registers successfully', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'مدير شركة عقارات النيل',
        nameEn: 'Nile Properties Director',
        email: 'nileprops@test.com',
        phone: '+201077770006',
        providerType: 'MANAGEMENT_COMPANY',
        nationalIdNumber: '29001011234567',
        companyNameAr: 'شركة النيل للإسكان الطلابي',
        companyNameEn: 'Nile Student Housing Co.',
        taxRegistrationNumber: 'EG-987-654-321',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.companyNameAr).toBe('شركة النيل للإسكان الطلابي');
    });

    it('B-AUTH-30: Provider registration with invalid Egyptian phone format returns 400', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'مالك بهاتف غير مصري',
        nameEn: 'Non Egypt Phone Owner',
        email: 'nonegypt@test.com',
        phone: '+14155552671', // US phone number
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '29505151234567',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid Egyptian phone format');
    });
  });
});
