import { PricingUnit, DurationUnit } from '../properties/property.types';

export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CLOSED_CONFLICT = 'CLOSED_CONFLICT',
}

export enum AgreementStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface IBookingRequest {
  id: string;
  studentId: string;
  ownerId: string;
  propertyId: string;
  unitId?: string;
  roomId?: string;
  bedId?: string;
  startDate: Date | string;
  endDate: Date | string;
  pricingUnit: PricingUnit;
  durationUnit: DurationUnit;
  agreedPrice: number;
  depositAmount: number;
  status: BookingStatus;
  notes?: string;
  cancellationReason?: string;
  rejectedReason?: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAgreementConfirmation {
  id: string;
  bookingRequestId: string;
  studentConfirmed: boolean;
  studentConfirmedAt?: Date | string;
  ownerConfirmed: boolean;
  ownerConfirmedAt?: Date | string;
  termsAccepted: boolean;
  status: AgreementStatus;
  contractUrl?: string;
  documents?: IAgreementDocument[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAgreementDocument {
  id: string;
  agreementConfirmationId: string;
  uploaderId: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: Date | string;
}

export interface IBookingConflictDetails {
  targetType: 'PROPERTY' | 'UNIT' | 'ROOM' | 'BED';
  targetId: string;
  conflictingRequestIds: string[];
  resolvedRequestId?: string;
}
