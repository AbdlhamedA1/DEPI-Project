import {
  IUser,
  IStudentProfile,
  IOwnerProfile,
  IProperty,
  IBookingRequest,
  PaginatedResponse,
  ICity,
  IArea,
  IUniversity,
  IPropertyUnit,
  IRoom,
  IBed,
  IPricing,
  IAvailability,
  IAdditionalExpense,
  SearchPropertyCardDto,
  SearchMapPinDto,
  SearchResponseDto,
  SearchQueryParams,
  SearchMapQueryParams,
} from '@repo/shared-types';
import {
  CreatePropertyInput,
  SearchPropertyFilterInput,
  CreateBookingRequestInput,
  UpdateBookingStatusInput,
  LoginInput,
  RegisterStudentInput,
  RegisterOwnerInput,
  CreateUnitInput,
  CreateRoomInput,
  CreateBedInput,
  CreatePricingInput,
  CreateAdditionalExpenseInput,
  ReviewPropertyInput,
  AttachPropertyImageInput,
  CalculatePricingQuoteInput,
} from '@repo/validation';

export interface VerifyOtpDto {
  phone: string;
  code?: string;
  otp?: string;
  otpCode?: string;
  purpose?: string;
}

export interface RequestOtpDto {
  phone: string;
  purpose?: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken?: string;
  token?: string;
  user: IUser;
}

export interface RequestOtpResponse {
  success: boolean;
  phone: string;
  message: string;
  cooldownSeconds?: number;
  otpExpiresInSeconds?: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface UploadSignatureResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  transformation: string;
  signature: string;
}

export interface KycSubmissionResponse {
  id: string;
  documentType: string;
  status: string;
  submittedAt: string;
}

export interface KycStatusResponse {
  verificationStatus: string;
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    status: string;
    rejectionReason?: string;
    createdAt: string;
  }>;
}

export interface PricingCalculationResult {
  currency: 'EGP';
  baseRent: number;
  durationUnit: string;
  durationCount: number;
  totalRentAmount: number;
  securityDeposit: number;
  mandatoryExpenses: {
    recurringPerPeriod: number;
    totalRecurring: number;
    oneTimeTotal: number;
    items: any[];
  };
  optionalExpenses: {
    selectedTotal: number;
    items: any[];
  };
  firstPaymentTotal: number;
  fullTenancyValue: number;
}
