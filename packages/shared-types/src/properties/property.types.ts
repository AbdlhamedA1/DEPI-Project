export enum PropertyType {
  BUILDING = 'BUILDING',
  APARTMENT = 'APARTMENT',
  ROOM = 'ROOM',
  BED = 'BED',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
}

export enum GenderPolicy {
  MALE_ONLY = 'MALE_ONLY',
  FEMALE_ONLY = 'FEMALE_ONLY',
  MIXED_FAMILY = 'MIXED_FAMILY',
}

export enum PricingUnit {
  PER_PERSON = 'PER_PERSON',
  PER_BED = 'PER_BED',
  PER_ROOM = 'PER_ROOM',
  PER_UNIT = 'PER_UNIT',
}

export enum DurationUnit {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SEMESTER = 'SEMESTER',
  YEARLY = 'YEARLY',
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ILocation {
  id: string;
  governorate: string;
  city: string;
  district: string;
  streetName?: string;
  buildingNumber?: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
}

export interface IUniversity {
  id: string;
  nameAr: string;
  nameEn: string;
  campusName?: string;
  latitude: number;
  longitude: number;
  city: string;
  governorate: string;
}

export interface IPropertyAmenity {
  id: string;
  propertyId: string;
  amenityKey: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
}

export interface IPropertyImage {
  id: string;
  propertyId: string;
  url: string;
  caption?: string;
  isCover: boolean;
  orderIndex: number;
}

export interface IProperty {
  id: string;
  ownerId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  status: ListingStatus;
  locationId: string;
  location?: ILocation;
  primaryUniversityId?: string;
  primaryUniversity?: IUniversity;
  distanceToUniversityMeters?: number;
  featured: boolean;
  viewCount: number;
  ratingAverage: number;
  ratingCount: number;
  images: IPropertyImage[];
  amenities: IPropertyAmenity[];
  units: IPropertyUnit[];
  additionalExpenses?: IAdditionalExpense[];
  verifications?: IPropertyVerification[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPropertyUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor: number;
  bathroomsCount: number;
  balconiesCount: number;
  hasKitchen: boolean;
  rooms: IRoom[];
  pricing?: IPricing;
  availability?: IAvailability;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IRoom {
  id: string;
  unitId: string;
  roomNumber: string;
  capacity: number;
  isPrivate: boolean;
  hasPrivateBathroom: boolean;
  beds: IBed[];
  pricing?: IPricing;
  availability?: IAvailability;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IBed {
  id: string;
  roomId: string;
  bedNumber: string;
  pricing?: IPricing;
  availability?: IAvailability;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPricing {
  id: string;
  propertyId?: string;
  unitId?: string;
  roomId?: string;
  bedId?: string;
  pricingUnit: PricingUnit;
  durationUnit: DurationUnit;
  amount: number;
  depositAmount: number;
  utilitiesIncluded: boolean;
  currency: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAvailability {
  id: string;
  propertyId?: string;
  unitId?: string;
  roomId?: string;
  bedId?: string;
  status: AvailabilityStatus;
  availableFrom: Date | string;
  availableTo?: Date | string;
  bookedUntil?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==========================================
// Geography & Location Entities
// ==========================================

export interface ICity {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateAr: string;
  governorateEn: string;
  isActive: boolean;
  areas?: IArea[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IArea {
  id: string;
  cityId: string;
  nameAr: string;
  nameEn: string;
  centerLatitude?: number;
  centerLongitude?: number;
  isActive: boolean;
  city?: ICity;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==========================================
// Property Verification Entity
// ==========================================

export enum PropertyVerificationDocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  OWNERSHIP_DEED = 'OWNERSHIP_DEED',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  COMMERCIAL_REGISTRY = 'COMMERCIAL_REGISTRY',
  TAX_CARD = 'TAX_CARD',
}

export enum PropertyVerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IPropertyVerification {
  id: string;
  providerId: string;
  propertyId?: string;
  documentType: PropertyVerificationDocumentType;
  fileUrl: string;
  documentRefNo?: string;
  verificationStatus: PropertyVerificationStatus;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  adminNote?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==========================================
// Additional Expenses Entity
// ==========================================

export enum ExpenseEntityType {
  PROPERTY = 'PROPERTY',
  UNIT = 'UNIT',
  ROOM = 'ROOM',
  BED = 'BED',
}

export enum BillingFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  SEMESTER = 'SEMESTER',
  YEARLY = 'YEARLY',
}

export interface IAdditionalExpense {
  id: string;
  propertyId: string;
  entityType: ExpenseEntityType;
  entityId: string;
  nameAr: string;
  nameEn: string;
  amount: number;
  isMandatory: boolean;
  isRecurring: boolean;
  billingFrequency?: BillingFrequency;
  createdAt: Date | string;
  updatedAt: Date | string;
}
