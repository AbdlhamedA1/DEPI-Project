import {
  IUser,
  IStudentProfile,
  IOwnerProfile,
  IProperty,
  IBookingRequest,
  PaginatedResponse,
} from '@repo/shared-types';
import {
  CreatePropertyInput,
  SearchPropertyFilterInput,
  CreateBookingRequestInput,
  UpdateBookingStatusInput,
  LoginInput,
  RegisterStudentInput,
  RegisterOwnerInput,
} from '@repo/validation';

export interface VerifyOtpDto {
  phone: string;
  code: string;
  purpose?: string;
}

export interface RequestOtpDto {
  phone: string;
}

export interface AuthTokensResponse {
  success: boolean;
  token: string;
  user: IUser;
}

export interface RequestOtpResponse {
  success: boolean;
  phone: string;
  message: string;
}
