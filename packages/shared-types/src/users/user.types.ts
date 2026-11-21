export enum UserRole {
  STUDENT = 'STUDENT',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum ProviderType {
  INDIVIDUAL_OWNER = 'INDIVIDUAL_OWNER',
  AUTHORIZED_AGENT = 'AUTHORIZED_AGENT',
  MANAGEMENT_COMPANY = 'MANAGEMENT_COMPANY',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface IUser {
  id: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  phoneVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  studentProfile?: IStudentProfile;
  ownerProfile?: IOwnerProfile;
  adminProfile?: IAdminProfile;
}

export interface IStudentProfile {
  id: string;
  userId: string;
  fullName: string;
  gender: Gender;
  universityId: string;
  faculty: string;
  academicYear: number;
  studentIdNumber?: string;
  studentCardUrl?: string;
  nationalIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IOwnerProfile {
  id: string;
  userId: string;
  fullName: string;
  providerType: ProviderType;
  commercialRegistrationNumber?: string;
  taxNumber?: string;
  companyName?: string;
  nationalIdNumber?: string;
  verifiedAt?: Date | string;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAdminProfile {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  permissions: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IKycDocument {
  id: string;
  userId: string;
  documentType:
    | 'NATIONAL_ID_FRONT'
    | 'NATIONAL_ID_BACK'
    | 'STUDENT_CARD'
    | 'COMMERCIAL_REGISTRY'
    | 'PROPERTY_DEED'
    | 'POWER_OF_ATTORNEY';
  fileUrl: string;
  status: VerificationStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
