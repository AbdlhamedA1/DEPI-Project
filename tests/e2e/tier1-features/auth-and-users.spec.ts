/**
 * Tier 1 Feature Coverage: Authentication, Identity & Access Control (F1 - F5)
 * Covers:
 * - F1: Student Registration & Phone OTP Verification
 * - F2: Mandatory University Association & Phone Update
 * - F3: Provider Registration & Legal Classification
 * - F4: Provider KYC Document Submission & Private Storage
 * - F5: Role-Based Access Control (RBAC) & Route Guards
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS, TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 1: Auth & User Accounts (F1 - F5)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F1: Student Registration & Phone OTP Verification
  // ==========================================
  describe('F1: Student Registration & Phone OTP Verification', () => {
    it('F1-01: Successfully request OTP for a valid Egyptian phone number (+2010...)', async () => {
      const res = await client.post('/api/v1/auth/otp/request', {
        phone: '+201099887766',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('OTP sent successfully');
      expect(res.body.data.code).toBe('123456');
    });

    it('F1-02: Reject OTP request for invalid Egyptian phone format with 400 Bad Request', async () => {
      const res = await client.post('/api/v1/auth/otp/request', {
        phone: '01012345678', // Missing country code +20
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid Egyptian mobile number format');
    });

    it('F1-03: Successfully verify valid 6-digit OTP code and receive verification token', async () => {
      await client.post('/api/v1/auth/otp/request', { phone: '+201099887766' });
      const verifyRes = await client.post('/api/v1/auth/otp/verify', {
        phone: '+201099887766',
        code: '123456',
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.verified).toBe(true);
      expect(verifyRes.body.data.token).toContain('jwt-verified-+201099887766');
    });

    it('F1-04: Reject verification of incorrect OTP code with 401 Unauthorized', async () => {
      await client.post('/api/v1/auth/otp/request', { phone: '+201099887766' });
      const verifyRes = await client.post('/api/v1/auth/otp/verify', {
        phone: '+201099887766',
        code: '999999', // Invalid code
      });
      expect(verifyRes.status).toBe(401);
      expect(verifyRes.body.success).toBe(false);
      expect(verifyRes.body.message).toContain('Invalid OTP code');
    });

    it('F1-05: Enforce OTP rate limiting (max 3 requests in 10 minutes) returning 429 Too Many Requests', async () => {
      const testPhone = '+201599881122';
      // First 3 requests succeed
      await client.post('/api/v1/auth/otp/request', { phone: testPhone });
      await client.post('/api/v1/auth/otp/request', { phone: testPhone });
      await client.post('/api/v1/auth/otp/request', { phone: testPhone });

      // 4th request must trigger rate limit
      const rateLimitedRes = await client.post('/api/v1/auth/otp/request', { phone: testPhone });
      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.body.success).toBe(false);
      expect(rateLimitedRes.body.message).toContain('Too many OTP requests');
    });
  });

  // ==========================================
  // FEATURE F2: Mandatory University Association & Phone Update
  // ==========================================
  describe('F2: Mandatory University Association & Phone Update', () => {
    it('F2-01: Successfully register a student when valid Egyptian university is associated', async () => {
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'زياد طارق ممدوح',
        nameEn: 'Ziad Tarek Mamdouh',
        email: 'ziad.tarek@cu.edu.eg',
        phone: '+201033445566',
        gender: 'MALE',
        universityId: 'univ-cairo',
        faculty: 'Engineering',
        academicYear: 1,
        originGovernorateId: 'gov-cairo',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.universityId).toBe('univ-cairo');
      expect(res.body.data.role).toBe('STUDENT');
    });

    it('F2-02: Strictly reject student registration (422) if mandatory university is missing or invalid', async () => {
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'طالب بدون جامعة',
        nameEn: 'Student Without University',
        email: 'nouniv@example.com',
        phone: '+201133445577',
        gender: 'FEMALE',
        universityId: 'non-existent-university-id',
        faculty: 'Arts',
        academicYear: 1,
        originGovernorateId: 'gov-giza',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Mandatory university selection is required');
    });

    it('F2-03: Successfully save optional enrollment proof document during registration', async () => {
      const proofUrl = 'https://secure-docs.housing.eg/proofs/ziad-cairo-univ.pdf';
      const res = await client.post('/api/v1/students/register', {
        nameAr: 'كريم نادر يوسف',
        nameEn: 'Kareem Nader Youssef',
        email: 'kareem.nader@aun.edu.eg',
        phone: '+201288990011',
        gender: 'MALE',
        universityId: 'univ-assiut',
        faculty: 'Medicine',
        academicYear: 2,
        originGovernorateId: 'gov-assiut',
        enrollmentProofDocUrl: proofUrl,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.isEnrolledVerified).toBe(true);
      expect(res.body.data.enrollmentProofDocUrl).toBe(proofUrl);
    });

    it('F2-04: Allow student to update their phone number with a verified OTP token', async () => {
      const student = TEST_STUDENTS[0];
      const newPhone = '+201099112233';
      const validToken = `jwt-verified-${newPhone}`;

      const res = await client.patch(
        `/api/v1/students/${student.id}/phone`,
        { newPhone, otpToken: validToken },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe(newPhone);
    });

    it('F2-05: Reject student phone number update with 401 if OTP verification token is missing or invalid', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.patch(
        `/api/v1/students/${student.id}/phone`,
        { newPhone: '+201099112244', otpToken: 'invalid-unverified-token' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('New phone number must be verified via OTP first');
    });
  });

  // ==========================================
  // FEATURE F3: Provider Registration & Legal Classification
  // ==========================================
  describe('F3: Provider Registration & Legal Classification', () => {
    it('F3-01: Successfully register an Individual Owner (INDIVIDUAL_OWNER) with valid 14-digit National ID', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'علي حسن المنشاوي',
        nameEn: 'Ali Hassan El-Minshawy',
        email: 'ali.minshawy@gmail.com',
        phone: '+201055667788',
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '28509151201234',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerType).toBe('INDIVIDUAL_OWNER');
      expect(res.body.data.verificationStatus).toBe('UNVERIFIED');
    });

    it('F3-02: Successfully register an Authorized Agent (AUTHORIZED_AGENT)', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'محمود سمير الوكيل',
        nameEn: 'Mahmoud Samir The Agent',
        email: 'mahmoud.agent@gmail.com',
        phone: '+201177889900',
        providerType: 'AUTHORIZED_AGENT',
        nationalIdNumber: '28803120104321',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.providerType).toBe('AUTHORIZED_AGENT');
    });

    it('F3-03: Successfully register a Property Management Company (MANAGEMENT_COMPANY) with trade details', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'شركة الإسكان الجامعي الحديث',
        nameEn: 'Modern Campus Living LLC',
        email: 'contact@moderncampus.eg',
        phone: '+201244556677',
        providerType: 'MANAGEMENT_COMPANY',
        nationalIdNumber: '27901010109988',
        companyNameAr: 'شركة الإسكان الجامعي ش.ذ.م.م',
        companyNameEn: 'Campus Living LLC',
        taxRegistrationNumber: '789-456-123',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.providerType).toBe('MANAGEMENT_COMPANY');
      expect(res.body.data.companyNameAr).toBe('شركة الإسكان الجامعي ش.ذ.م.م');
    });

    it('F3-04: Reject provider registration with invalid Egyptian National ID (<14 digits or wrong prefix)', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'صاحب رقم قومي خاطئ',
        nameEn: 'Invalid NID Owner',
        email: 'invalid.nid@gmail.com',
        phone: '+201011223344',
        providerType: 'INDIVIDUAL_OWNER',
        nationalIdNumber: '12345', // Invalid length
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('National ID must be a valid 14-digit');
    });

    it('F3-05: Reject Management Company registration (422) if legal company name is missing', async () => {
      const res = await client.post('/api/v1/owners/register', {
        nameAr: 'شركة بلا اسم قانوني',
        nameEn: 'Company Without Legal Name',
        email: 'nolegal@example.com',
        phone: '+201500112233',
        providerType: 'MANAGEMENT_COMPANY',
        nationalIdNumber: '28001010102233',
        // Missing companyNameAr
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Management company requires legal company name');
    });
  });

  // ==========================================
  // FEATURE F4: Provider KYC Document Submission & Private Storage
  // ==========================================
  describe('F4: Provider KYC Document Submission & Private Storage', () => {
    it('F4-01: Successfully upload National ID documents and transition status to PENDING', async () => {
      const provider = TEST_PROVIDERS[4]; // provider-unverified
      const res = await client.post(
        `/api/v1/owners/${provider.id}/kyc`,
        {
          type: 'NATIONAL_ID_FRONT',
          fileName: 'nid_front_sameh.jpg',
          storageKey: 'secure-vault/kyc/sameh/nid_f.enc',
        },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('NATIONAL_ID_FRONT');

      // Verify provider state transitioned from UNVERIFIED to PENDING
      const userRes = await client.get(`/api/v1/users/${provider.id}`);
      expect(userRes.body.data.verificationStatus).toBe('PENDING');
    });

    it('F4-02: Successfully upload Ownership Deed for Individual Owner', async () => {
      const provider = TEST_PROVIDERS[4];
      const res = await client.post(
        `/api/v1/owners/${provider.id}/kyc`,
        {
          type: 'OWNERSHIP_DEED',
          fileName: 'dokki_ownership_deed.pdf',
          storageKey: 'secure-vault/kyc/sameh/deed.enc',
        },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('OWNERSHIP_DEED');
    });

    it('F4-03: Successfully upload Power of Attorney for Authorized Agent', async () => {
      const agent = TEST_PROVIDERS[1]; // provider-tarek-agent
      const res = await client.post(
        `/api/v1/owners/${agent.id}/kyc`,
        {
          type: 'POWER_OF_ATTORNEY',
          fileName: 'notarized_poa_2026.pdf',
          storageKey: 'secure-vault/kyc/tarek/poa.enc',
        },
        { Authorization: `Bearer ${agent.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('POWER_OF_ATTORNEY');
    });

    it('F4-04: Provider can securely retrieve their own uploaded private KYC documents', async () => {
      const provider = TEST_PROVIDERS[0]; // provider-mohamed-owner
      const res = await client.get(`/api/v1/owners/${provider.id}/kyc`, {
        Authorization: `Bearer ${provider.id}:OWNER`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].storageKey).toContain('kyc/provider-mohamed/');
    });

    it('F4-05: Forbidden (403): Student or unauthorized external user cannot access provider private KYC documents', async () => {
      const provider = TEST_PROVIDERS[0];
      const student = TEST_STUDENTS[0];
      const res = await client.get(`/api/v1/owners/${provider.id}/kyc`, {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied: KYC documents are private');
    });
  });

  // ==========================================
  // FEATURE F5: Role-Based Access Control (RBAC) & Route Guards
  // ==========================================
  describe('F5: Role-Based Access Control (RBAC) & Route Guards', () => {
    it('F5-01: Protected endpoint rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await client.get('/api/v1/admin/dashboard/metrics'); // No auth header
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('F5-02: Student role cannot access administrative moderation queues (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.get('/api/v1/admin/moderation/kyc', {
        Authorization: `Bearer ${student.id}:STUDENT`,
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('F5-03: Student role cannot create property listings (403 Forbidden)', async () => {
      const student = TEST_STUDENTS[0];
      const res = await client.post(
        '/api/v1/properties',
        { titleAr: 'سكن غير مصرح' },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('F5-04: Property Owner role cannot submit student booking requests (403 Forbidden)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/booking-requests',
        { propertyId: 'prop-dokki-building' },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('F5-05: Platform Super Admin role can access protected administrative dashboard', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.get('/api/v1/admin/dashboard/metrics', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBeGreaterThan(0);
      expect(res.body.data.activeProperties).toBeDefined();
    });
  });
});
