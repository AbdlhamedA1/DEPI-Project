/**
 * Egyptian Users Fixture
 * Realistic test personas for Students, Property Providers, and Platform Admins.
 * Strict Egyptian phone numbers (+2010, +2011, +2012, +2015) and 14-digit National IDs.
 */

export type UserRole = 'STUDENT' | 'OWNER' | 'ADMIN';
export type ProviderType = 'INDIVIDUAL_OWNER' | 'AUTHORIZED_AGENT' | 'MANAGEMENT_COMPANY';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type UserGender = 'MALE' | 'FEMALE';

export interface BaseUserFixture {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface StudentUserFixture extends BaseUserFixture {
  role: 'STUDENT';
  gender: UserGender;
  universityId: string;
  faculty: string;
  academicYear: number;
  originGovernorateId: string;
  isEnrolledVerified: boolean;
  enrollmentProofDocUrl?: string;
}

export interface KycDocument {
  id: string;
  type:
    | 'NATIONAL_ID_FRONT'
    | 'NATIONAL_ID_BACK'
    | 'OWNERSHIP_DEED'
    | 'COMMERCIAL_REGISTRY'
    | 'POWER_OF_ATTORNEY'
    | 'TAX_CARD';
  fileName: string;
  storageKey: string;
  uploadedAt: string;
  isVerified: boolean;
}

export interface ProviderUserFixture extends BaseUserFixture {
  role: 'OWNER';
  providerType: ProviderType;
  verificationStatus: VerificationStatus;
  nationalIdNumber: string;
  companyNameAr?: string;
  companyNameEn?: string;
  taxRegistrationNumber?: string;
  kycDocuments: KycDocument[];
  rejectionReason?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
}

export interface AdminUserFixture extends BaseUserFixture {
  role: 'ADMIN';
  isMasterAdmin: boolean;
  adminTitle: string;
}

export const TEST_STUDENTS: StudentUserFixture[] = [
  {
    id: 'student-ahmed',
    nameAr: 'أحمد حسن إبراهيم',
    nameEn: 'Ahmed Hassan Ibrahim',
    email: 'ahmed.hassan@students.cu.edu.eg',
    phone: '+201012345678',
    role: 'STUDENT',
    gender: 'MALE',
    universityId: 'univ-cairo',
    faculty: 'Engineering',
    academicYear: 3,
    originGovernorateId: 'gov-assiut',
    isEnrolledVerified: true,
    enrollmentProofDocUrl: 'https://secure-docs.housing.eg/students/ahmed-proof.pdf',
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'student-mariam',
    nameAr: 'مريم مصطفى محمود',
    nameEn: 'Mariam Mostafa Mahmoud',
    email: 'mariam.mostafa@asu.edu.eg',
    phone: '+201123456789',
    role: 'STUDENT',
    gender: 'FEMALE',
    universityId: 'univ-ain-shams',
    faculty: 'Medicine',
    academicYear: 2,
    originGovernorateId: 'gov-dakahlia',
    isEnrolledVerified: true,
    isActive: true,
    createdAt: '2026-09-05T11:30:00Z',
  },
  {
    id: 'student-omar',
    nameAr: 'عمر خالد عبد العزيز',
    nameEn: 'Omar Khaled Abdel-Aziz',
    email: 'omar.khaled@alexu.edu.eg',
    phone: '+201234567890',
    role: 'STUDENT',
    gender: 'MALE',
    universityId: 'univ-alexandria',
    faculty: 'Science',
    academicYear: 4,
    originGovernorateId: 'gov-gharbia',
    isEnrolledVerified: false,
    isActive: true,
    createdAt: '2026-09-10T09:15:00Z',
  },
  {
    id: 'student-nour',
    nameAr: 'نور إبراهيم خليل',
    nameEn: 'Nour Ibrahim Khalil',
    email: 'nour.khalil@mans.edu.eg',
    phone: '+201545678901',
    role: 'STUDENT',
    gender: 'FEMALE',
    universityId: 'univ-mansoura',
    faculty: 'Pharmacy',
    academicYear: 1,
    originGovernorateId: 'gov-sharqia',
    isEnrolledVerified: true,
    isActive: true,
    createdAt: '2026-09-12T14:20:00Z',
  },
  {
    id: 'student-youssef',
    nameAr: 'يوسف طارق علي',
    nameEn: 'Youssef Tarek Ali',
    email: 'youssef.tarek@aun.edu.eg',
    phone: '+201098765432',
    role: 'STUDENT',
    gender: 'MALE',
    universityId: 'univ-assiut',
    faculty: 'Law',
    academicYear: 2,
    originGovernorateId: 'gov-cairo',
    isEnrolledVerified: false,
    isActive: true,
    createdAt: '2026-09-15T08:45:00Z',
  },
];

export const TEST_PROVIDERS: ProviderUserFixture[] = [
  // 1. Verified Individual Owner in Dokki/Giza
  {
    id: 'provider-mohamed-owner',
    nameAr: 'محمد السيد البدوي',
    nameEn: 'Mohamed El-Sayed El-Badawy',
    email: 'm.sayed@gmail.com',
    phone: '+201001122334',
    role: 'OWNER',
    providerType: 'INDIVIDUAL_OWNER',
    verificationStatus: 'VERIFIED',
    nationalIdNumber: '28005121401234',
    isActive: true,
    createdAt: '2026-08-15T10:00:00Z',
    reviewedByAdminId: 'admin-super',
    reviewedAt: '2026-08-16T12:00:00Z',
    kycDocuments: [
      {
        id: 'doc-nid-f-01',
        type: 'NATIONAL_ID_FRONT',
        fileName: 'mohamed_nid_front.jpg',
        storageKey: 'kyc/provider-mohamed/nid_front.enc',
        uploadedAt: '2026-08-15T10:30:00Z',
        isVerified: true,
      },
      {
        id: 'doc-nid-b-01',
        type: 'NATIONAL_ID_BACK',
        fileName: 'mohamed_nid_back.jpg',
        storageKey: 'kyc/provider-mohamed/nid_back.enc',
        uploadedAt: '2026-08-15T10:30:00Z',
        isVerified: true,
      },
      {
        id: 'doc-deed-01',
        type: 'OWNERSHIP_DEED',
        fileName: 'dokki_building_deed.pdf',
        storageKey: 'kyc/provider-mohamed/deed_dokki.enc',
        uploadedAt: '2026-08-15T10:45:00Z',
        isVerified: true,
      },
    ],
  },

  // 2. Verified Authorized Agent with Power of Attorney in Nasr City
  {
    id: 'provider-tarek-agent',
    nameAr: 'طارق عبد الرحمن الشريف',
    nameEn: 'Tarek Abdel-Rahman El-Sherif',
    email: 'tarek.agent@cairoliving.eg',
    phone: '+201112233445',
    role: 'OWNER',
    providerType: 'AUTHORIZED_AGENT',
    verificationStatus: 'VERIFIED',
    nationalIdNumber: '28511250102345',
    isActive: true,
    createdAt: '2026-08-20T09:00:00Z',
    reviewedByAdminId: 'admin-super',
    reviewedAt: '2026-08-21T14:00:00Z',
    kycDocuments: [
      {
        id: 'doc-nid-f-02',
        type: 'NATIONAL_ID_FRONT',
        fileName: 'tarek_nid_front.jpg',
        storageKey: 'kyc/provider-tarek/nid_front.enc',
        uploadedAt: '2026-08-20T09:15:00Z',
        isVerified: true,
      },
      {
        id: 'doc-poa-01',
        type: 'POWER_OF_ATTORNEY',
        fileName: 'official_poa_notarized.pdf',
        storageKey: 'kyc/provider-tarek/poa.enc',
        uploadedAt: '2026-08-20T09:30:00Z',
        isVerified: true,
      },
    ],
  },

  // 3. Verified Management Company in Alexandria
  {
    id: 'provider-nile-company',
    nameAr: 'شركة النيل لإدارة سكن الطلاب',
    nameEn: 'Nile Student Housing Management LLC',
    email: 'info@nilestudenthousing.eg',
    phone: '+201223344556',
    role: 'OWNER',
    providerType: 'MANAGEMENT_COMPANY',
    verificationStatus: 'VERIFIED',
    nationalIdNumber: '27503180201122',
    companyNameAr: 'شركة النيل لإسكان الشباب ش.ذ.م.م',
    companyNameEn: 'Nile Youth Housing LLC',
    taxRegistrationNumber: '542-891-304',
    isActive: true,
    createdAt: '2026-08-25T11:00:00Z',
    reviewedByAdminId: 'admin-super',
    reviewedAt: '2026-08-26T16:00:00Z',
    kycDocuments: [
      {
        id: 'doc-cr-01',
        type: 'COMMERCIAL_REGISTRY',
        fileName: 'commercial_registry_2026.pdf',
        storageKey: 'kyc/nile-company/cr_extract.enc',
        uploadedAt: '2026-08-25T11:15:00Z',
        isVerified: true,
      },
      {
        id: 'doc-tax-01',
        type: 'TAX_CARD',
        fileName: 'tax_card.jpg',
        storageKey: 'kyc/nile-company/tax_card.enc',
        uploadedAt: '2026-08-25T11:20:00Z',
        isVerified: true,
      },
    ],
  },

  // 4. Pending Verification Provider (KYC uploaded, awaiting admin review)
  {
    id: 'provider-pending-kyc',
    nameAr: 'حسام الدين كامل',
    nameEn: 'Hossam El-Din Kamel',
    email: 'hossam.kamel@outlook.com',
    phone: '+201556677889',
    role: 'OWNER',
    providerType: 'INDIVIDUAL_OWNER',
    verificationStatus: 'PENDING',
    nationalIdNumber: '29007142104567',
    isActive: true,
    createdAt: '2026-09-01T15:00:00Z',
    kycDocuments: [
      {
        id: 'doc-nid-f-03',
        type: 'NATIONAL_ID_FRONT',
        fileName: 'hossam_nid.jpg',
        storageKey: 'kyc/provider-hossam/nid_front.enc',
        uploadedAt: '2026-09-01T15:10:00Z',
        isVerified: false,
      },
    ],
  },

  // 5. Unverified Provider (Registered without KYC documents)
  {
    id: 'provider-unverified',
    nameAr: 'سامح فوزي نجيب',
    nameEn: 'Sameh Fawzy Naguib',
    email: 'sameh.fawzy@yahoo.com',
    phone: '+201088776655',
    role: 'OWNER',
    providerType: 'INDIVIDUAL_OWNER',
    verificationStatus: 'UNVERIFIED',
    nationalIdNumber: '29202021603456',
    isActive: true,
    createdAt: '2026-09-02T10:00:00Z',
    kycDocuments: [],
  },

  // 6. Rejected Provider
  {
    id: 'provider-rejected-kyc',
    nameAr: 'عصام مجدي الديب',
    nameEn: 'Essam Magdy El-Deeb',
    email: 'essam.eldeeb@gmail.com',
    phone: '+201199887766',
    role: 'OWNER',
    providerType: 'INDIVIDUAL_OWNER',
    verificationStatus: 'REJECTED',
    nationalIdNumber: '28308221201987',
    isActive: true,
    createdAt: '2026-09-03T12:00:00Z',
    rejectionReason: 'Invalid National ID copy - blurred image and missing back side',
    reviewedByAdminId: 'admin-super',
    reviewedAt: '2026-09-04T10:00:00Z',
    kycDocuments: [
      {
        id: 'doc-nid-f-04',
        type: 'NATIONAL_ID_FRONT',
        fileName: 'blurred_id.jpg',
        storageKey: 'kyc/provider-essam/blurred.enc',
        uploadedAt: '2026-09-03T12:15:00Z',
        isVerified: false,
      },
    ],
  },
];

export const TEST_ADMINS: AdminUserFixture[] = [
  {
    id: 'admin-super',
    nameAr: 'مدير المنصة الرئيسي',
    nameEn: 'Platform Super Administrator',
    email: 'admin@studenthousing.eg',
    phone: '+201000000001',
    role: 'ADMIN',
    isMasterAdmin: true,
    adminTitle: 'Chief Administrator',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'admin-moderator',
    nameAr: 'مشرف التحقق والمحتوى',
    nameEn: 'Content & KYC Moderator',
    email: 'moderator@studenthousing.eg',
    phone: '+201000000002',
    role: 'ADMIN',
    isMasterAdmin: false,
    adminTitle: 'Operations Moderator',
    isActive: true,
    createdAt: '2026-01-05T00:00:00Z',
  },
];
