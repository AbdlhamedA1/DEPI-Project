/**
 * High-Fidelity Domain State Simulator & In-Memory State Machine
 * Faithfully implements all business rules from app.txt and TEST_INFRA.md:
 * - OTP authentication with Egyptian phone format (+20...) and rate limiting
 * - Mandatory university association for students
 * - Provider legal classification & KYC verification gate
 * - Hierarchical accommodation engine (Building -> Unit -> Room -> Bed)
 * - Partial bed-level availability without locking sibling portions
 * - Flexible EGP pricing & itemized mandatory/optional expenses
 * - Cloudinary media with single cover image rule
 * - Listing admin approval queue
 * - Search with Haversine distance to university campus & transparent ranking
 * - Booking request lifecycle with max 3 open requests limit
 * - Single confirmed booking limit per student
 * - Owner accept/reject without explanation & student cancellation
 * - Mutual agreement confirmation with atomic row-locking concurrency simulation
 * - Auto-closure of competing requests (CLOSED_CONFLICT) for booked portion
 * - Mutual contact disclosure transparency upon request creation
 * - Request-linked 1:1 chat permanently open post-cancellation
 * - In-app notification event alerts
 * - Post-confirmed-booking review eligibility gate, duplicate prevention & single response rule
 * - Text-only complaint lifecycle (NEW -> UNDER_REVIEW -> RESPONDED -> CLOSED)
 * - Immutable AdminActionLog tracking administrative mutations
 */

import {
  EGYPTIAN_GOVERNORATES,
  EGYPTIAN_CITIES,
  EGYPTIAN_AREAS,
  GovernorateFixture,
  CityFixture,
  AreaFixture,
} from '../fixtures/egyptian-locations.fixture';
import {
  EGYPTIAN_UNIVERSITIES,
  UniversityFixture,
} from '../fixtures/egyptian-universities.fixture';
import {
  TEST_STUDENTS,
  TEST_PROVIDERS,
  TEST_ADMINS,
  StudentUserFixture,
  ProviderUserFixture,
  AdminUserFixture,
  UserRole,
  ProviderType,
  VerificationStatus,
  KycDocument,
} from '../fixtures/users.fixture';
import {
  TEST_PROPERTIES,
  PropertyListingFixture,
  PropertyType,
  GenderPolicy,
  DurationUnit,
  PricingUnit,
  ListingApprovalStatus,
  UnitFixture,
  RoomFixture,
  BedFixture,
  ExpenseItemFixture,
  MediaAssetFixture,
} from '../fixtures/properties.fixture';

// Booking Statuses
export type BookingStatus =
  'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'CLOSED_CONFLICT';

// Portion Target
export type PortionType = 'BUILDING' | 'UNIT' | 'ROOM' | 'BED';

export interface BookingRequestEntity {
  id: string;
  studentId: string;
  propertyId: string;
  portionType: PortionType;
  portionId: string;
  status: BookingStatus;
  proposedMoveInDate: string;
  proposedDurationUnit: DurationUnit;
  studentNotes?: string;
  studentAgreed: boolean;
  providerAgreed: boolean;
  agreementDocumentUrl?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}

export interface ConversationEntity {
  id: string;
  bookingRequestId: string;
  studentId: string;
  providerId: string;
  propertyId: string;
  isOpenPermanently: boolean;
  messages: ChatMessageEntity[];
  studentUnreadCount: number;
  providerUnreadCount: number;
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  type: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface ReviewEntity {
  id: string;
  bookingRequestId: string;
  propertyId: string;
  studentId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  response?: {
    id: string;
    providerId: string;
    responseText: string;
    createdAt: string;
  };
}

export type ComplaintStatus = 'NEW' | 'UNDER_REVIEW' | 'RESPONDED' | 'CLOSED';

export interface ComplaintEntity {
  id: string;
  reporterId: string;
  targetEntityType: 'PROPERTY' | 'USER' | 'REVIEW';
  targetEntityId: string;
  reason: string;
  description: string;
  status: ComplaintStatus;
  adminResolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActionLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetEntity: string;
  targetId: string;
  beforeState: any;
  afterState: any;
  ipAddress: string;
  timestamp: string;
}

// Haversine Distance Calculation (km)
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Egyptian Phone Validation: +2010..., +2011..., +2012..., +2015... (13 chars total)
export function isValidEgyptianPhone(phone: string): boolean {
  return /^\+201[0125][0-9]{8}$/.test(phone);
}

// Deep Clone Utility
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class DomainStateSimulator {
  private static idCounter = 0;

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${++DomainStateSimulator.idCounter}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Master In-Memory Repositories
  private students: Map<string, StudentUserFixture> = new Map();
  private providers: Map<string, ProviderUserFixture> = new Map();
  private admins: Map<string, AdminUserFixture> = new Map();
  private properties: Map<string, PropertyListingFixture> = new Map();
  private bookingRequests: Map<string, BookingRequestEntity> = new Map();
  private conversations: Map<string, ConversationEntity> = new Map();
  private notifications: Map<string, NotificationEntity> = new Map();
  private reviews: Map<string, ReviewEntity> = new Map();
  private complaints: Map<string, ComplaintEntity> = new Map();
  private adminLogs: AdminActionLogEntry[] = [];

  // OTP Verification Cache: phone -> { code, expiresAt, attempts, requestCount, firstRequestTime }
  private otpStore: Map<
    string,
    {
      code: string;
      expiresAt: number;
      attempts: number;
      requestCount: number;
      windowStart: number;
    }
  > = new Map();

  // Simulated Concurrency Row Locks (Key: portionId -> Lock Holder)
  private rowLocks: Set<string> = new Set();

  constructor() {
    this.resetToSeed();
  }

  /**
   * Resets the simulator state to authoritative seed fixtures
   */
  public resetToSeed(): void {
    this.students.clear();
    this.providers.clear();
    this.admins.clear();
    this.properties.clear();
    this.bookingRequests.clear();
    this.conversations.clear();
    this.notifications.clear();
    this.reviews.clear();
    this.complaints.clear();
    this.adminLogs = [];
    this.otpStore.clear();
    this.rowLocks.clear();

    // Populate Users
    for (const s of TEST_STUDENTS) {
      this.students.set(s.id, deepClone(s));
    }
    for (const p of TEST_PROVIDERS) {
      this.providers.set(p.id, deepClone(p));
    }
    for (const a of TEST_ADMINS) {
      this.admins.set(a.id, deepClone(a));
    }

    // Populate Properties
    for (const prop of TEST_PROPERTIES) {
      this.properties.set(prop.id, deepClone(prop));
    }
  }

  // ==========================================
  // AUTHENTICATION & USERS (F1 - F5)
  // ==========================================

  public requestOtp(phone: string): { success: boolean; message: string; code?: string } {
    if (!isValidEgyptianPhone(phone)) {
      throw {
        statusCode: 400,
        message: 'Invalid Egyptian mobile number format (+2010/11/12/15XXXXXXXX)',
      };
    }

    const now = Date.now();
    const existing = this.otpStore.get(phone);

    // Rate limiting: max 3 requests within 10 minutes (600,000 ms)
    if (existing) {
      if (now - existing.windowStart < 600000) {
        if (existing.requestCount >= 3) {
          throw {
            statusCode: 429,
            message: 'Too many OTP requests. Please wait 10 minutes before requesting again.',
          };
        }
        existing.requestCount++;
        existing.code = '123456'; // Deterministic test OTP code
        existing.expiresAt = now + 300000; // 5 min expiry
        existing.attempts = 0;
        return { success: true, message: 'OTP sent successfully', code: existing.code };
      }
    }

    const entry = {
      code: '123456',
      expiresAt: now + 300000,
      attempts: 0,
      requestCount: 1,
      windowStart: now,
    };
    this.otpStore.set(phone, entry);
    return { success: true, message: 'OTP sent successfully', code: entry.code };
  }

  public verifyOtp(phone: string, code: string): { verified: boolean; token?: string } {
    const entry = this.otpStore.get(phone);
    if (!entry) {
      throw { statusCode: 400, message: 'No OTP requested for this phone number' };
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(phone);
      throw { statusCode: 400, message: 'OTP has expired. Please request a new one.' };
    }

    if (entry.attempts >= 3) {
      this.otpStore.delete(phone);
      throw { statusCode: 400, message: 'Too many failed attempts. OTP invalidated.' };
    }

    if (entry.code !== code) {
      entry.attempts++;
      throw { statusCode: 401, message: 'Invalid OTP code' };
    }

    // Success
    this.otpStore.delete(phone);
    return { verified: true, token: `jwt-verified-${phone}` };
  }

  public registerStudent(data: {
    id?: string;
    nameAr: string;
    nameEn: string;
    email: string;
    phone: string;
    gender: 'MALE' | 'FEMALE';
    universityId: string;
    faculty: string;
    academicYear: number;
    originGovernorateId: string;
    enrollmentProofDocUrl?: string;
  }): StudentUserFixture {
    if (!isValidEgyptianPhone(data.phone)) {
      throw { statusCode: 400, message: 'Invalid Egyptian mobile number format' };
    }

    // Mandatory university association
    if (!data.universityId || !EGYPTIAN_UNIVERSITIES.some(u => u.id === data.universityId)) {
      throw {
        statusCode: 422,
        message: 'Mandatory university selection is required and must be valid',
      };
    }

    // Check duplicate phone or email
    for (const student of this.students.values()) {
      if (student.phone === data.phone) {
        throw { statusCode: 409, message: 'Phone number already registered' };
      }
      if (student.email === data.email) {
        throw { statusCode: 409, message: 'Email address already registered' };
      }
    }

    const newStudent: StudentUserFixture = {
      id: data.id || this.generateId('student'),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      email: data.email,
      phone: data.phone,
      role: 'STUDENT',
      gender: data.gender,
      universityId: data.universityId,
      faculty: data.faculty,
      academicYear: data.academicYear,
      originGovernorateId: data.originGovernorateId,
      isEnrolledVerified: !!data.enrollmentProofDocUrl,
      enrollmentProofDocUrl: data.enrollmentProofDocUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.students.set(newStudent.id, newStudent);
    return deepClone(newStudent);
  }

  public updateStudentPhone(
    studentId: string,
    newPhone: string,
    verifiedOtpToken: string,
  ): StudentUserFixture {
    const student = this.students.get(studentId);
    if (!student) throw { statusCode: 404, message: 'Student not found' };

    if (!isValidEgyptianPhone(newPhone)) {
      throw { statusCode: 400, message: 'Invalid Egyptian phone format' };
    }

    if (!verifiedOtpToken.startsWith('jwt-verified-')) {
      throw { statusCode: 401, message: 'New phone number must be verified via OTP first' };
    }

    // Check conflict
    for (const s of this.students.values()) {
      if (s.id !== studentId && s.phone === newPhone) {
        throw { statusCode: 409, message: 'Phone number already registered to another account' };
      }
    }

    student.phone = newPhone;
    return deepClone(student);
  }

  public registerProvider(data: {
    id?: string;
    nameAr: string;
    nameEn: string;
    email: string;
    phone: string;
    providerType: ProviderType;
    nationalIdNumber: string;
    companyNameAr?: string;
    companyNameEn?: string;
    taxRegistrationNumber?: string;
  }): ProviderUserFixture {
    if (!isValidEgyptianPhone(data.phone)) {
      throw { statusCode: 400, message: 'Invalid Egyptian phone format' };
    }

    // 14-digit National ID validation
    if (!/^[23][0-9]{13}$/.test(data.nationalIdNumber)) {
      throw {
        statusCode: 400,
        message: 'National ID must be a valid 14-digit Egyptian National ID',
      };
    }

    if (data.providerType === 'MANAGEMENT_COMPANY' && !data.companyNameAr) {
      throw { statusCode: 422, message: 'Management company requires legal company name' };
    }

    const provider: ProviderUserFixture = {
      id: data.id || this.generateId('provider'),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      email: data.email,
      phone: data.phone,
      role: 'OWNER',
      providerType: data.providerType,
      verificationStatus: 'UNVERIFIED',
      nationalIdNumber: data.nationalIdNumber,
      companyNameAr: data.companyNameAr,
      companyNameEn: data.companyNameEn,
      taxRegistrationNumber: data.taxRegistrationNumber,
      kycDocuments: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.providers.set(provider.id, provider);
    return deepClone(provider);
  }

  public uploadKycDocument(
    providerId: string,
    doc: Omit<KycDocument, 'id' | 'uploadedAt' | 'isVerified'>,
  ): KycDocument {
    const provider = this.providers.get(providerId);
    if (!provider) throw { statusCode: 404, message: 'Provider not found' };

    const newDoc: KycDocument = {
      id: this.generateId('doc'),
      type: doc.type,
      fileName: doc.fileName,
      storageKey: doc.storageKey,
      uploadedAt: new Date().toISOString(),
      isVerified: false,
    };

    provider.kycDocuments.push(newDoc);
    if (provider.verificationStatus === 'UNVERIFIED') {
      provider.verificationStatus = 'PENDING';
    }

    return deepClone(newDoc);
  }

  public getProviderKycDocuments(
    providerId: string,
    requestingUserId: string,
    requestingRole: UserRole,
  ): KycDocument[] {
    // RBAC: Only Admin or the Provider themselves can view private KYC docs
    if (requestingRole !== 'ADMIN' && requestingUserId !== providerId) {
      throw {
        statusCode: 403,
        message:
          'Access denied: KYC documents are private and restricted to owner and administrators',
      };
    }

    const provider = this.providers.get(providerId);
    if (!provider) throw { statusCode: 404, message: 'Provider not found' };

    return deepClone(provider.kycDocuments);
  }

  public getUserById(
    userId: string,
  ): (StudentUserFixture | ProviderUserFixture | AdminUserFixture) | undefined {
    return this.students.get(userId) || this.providers.get(userId) || this.admins.get(userId);
  }

  // ==========================================
  // LOCATIONS & UNIVERSITIES (F6 - F7)
  // ==========================================

  public getGovernorates(): GovernorateFixture[] {
    return deepClone(EGYPTIAN_GOVERNORATES);
  }

  public getCities(governorateId?: string): CityFixture[] {
    if (governorateId) {
      return deepClone(EGYPTIAN_CITIES.filter(c => c.governorateId === governorateId));
    }
    return deepClone(EGYPTIAN_CITIES);
  }

  public getAreas(cityId?: string): AreaFixture[] {
    if (cityId) {
      return deepClone(EGYPTIAN_AREAS.filter(a => a.cityId === cityId));
    }
    return deepClone(EGYPTIAN_AREAS);
  }

  public getUniversities(cityId?: string): UniversityFixture[] {
    if (cityId) {
      return deepClone(EGYPTIAN_UNIVERSITIES.filter(u => u.cityId === cityId));
    }
    return deepClone(EGYPTIAN_UNIVERSITIES);
  }

  public getUniversityById(univId: string): UniversityFixture | undefined {
    const univ = EGYPTIAN_UNIVERSITIES.find(u => u.id === univId);
    return univ ? deepClone(univ) : undefined;
  }

  // ==========================================
  // PROPERTIES & HIERARCHY (F8 - F13)
  // ==========================================

  public createPropertyListing(
    providerId: string,
    data: Omit<
      PropertyListingFixture,
      'id' | 'providerId' | 'approvalStatus' | 'createdAt' | 'isVerified'
    >,
  ): PropertyListingFixture {
    const provider = this.providers.get(providerId);
    if (!provider) throw { statusCode: 404, message: 'Provider not found' };

    // Provider KYC Gate: unverified provider cannot publish
    if (provider.verificationStatus !== 'VERIFIED') {
      throw {
        statusCode: 403,
        message: 'Unverified provider cannot publish or submit listings for approval',
      };
    }

    // Media asset rule: at least 1 image and exactly 1 cover image
    if (!data.mediaAssets || data.mediaAssets.length === 0) {
      throw { statusCode: 422, message: 'Property must have at least one photo' };
    }
    const coverCount = data.mediaAssets.filter(m => m.isCover).length;
    if (coverCount !== 1) {
      throw { statusCode: 422, message: 'Property must have exactly one designated cover image' };
    }

    // Currency and pricing validation
    if (data.basePriceEgp <= 0) {
      throw { statusCode: 400, message: 'Base price in EGP must be greater than zero' };
    }

    const newProp: PropertyListingFixture = {
      ...deepClone(data),
      id: (data as any).id || this.generateId('prop'),
      providerId,
      approvalStatus: 'PENDING_APPROVAL',
      isActive: false,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.properties.set(newProp.id, newProp);
    return deepClone(newProp);
  }

  public getPropertyById(propertyId: string): PropertyListingFixture | undefined {
    const prop = this.properties.get(propertyId);
    return prop ? deepClone(prop) : undefined;
  }

  public getPortionAvailability(
    propertyId: string,
    portionType: PortionType,
    portionId: string,
  ): { isAvailable: boolean; portion?: any } {
    const prop = this.properties.get(propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    if (portionType === 'BUILDING' || portionType === 'APARTMENT' || portionType === 'UNIT') {
      if (prop.propertyType === 'APARTMENT' && prop.id === portionId) {
        const allUnitsAvailable = prop.units.every(
          unit =>
            unit.isAvailable &&
            unit.rooms.every(room => room.isAvailable && room.beds.every(bed => bed.isAvailable)),
        );
        return {
          isAvailable: prop.isActive && prop.approvalStatus === 'APPROVED' && allUnitsAvailable,
          portion: prop,
        };
      }
      for (const unit of prop.units) {
        if (unit.id === portionId) {
          const allRoomsAvailable = unit.rooms.every(
            room => room.isAvailable && room.beds.every(bed => bed.isAvailable),
          );
          return { isAvailable: unit.isAvailable && allRoomsAvailable, portion: unit };
        }
      }
    } else if (portionType === 'ROOM') {
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          if (room.id === portionId) {
            const allBedsAvailable = room.beds.every(bed => bed.isAvailable);
            return { isAvailable: room.isAvailable && allBedsAvailable, portion: room };
          }
        }
      }
    } else if (portionType === 'BED') {
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          for (const bed of room.beds) {
            if (bed.id === portionId) {
              return { isAvailable: bed.isAvailable, portion: bed };
            }
          }
        }
      }
    }

    throw { statusCode: 404, message: `Portion ${portionType} ${portionId} not found in property` };
  }

  public setPortionAvailability(
    propertyId: string,
    portionType: PortionType,
    portionId: string,
    isAvailable: boolean,
  ): void {
    const prop = this.properties.get(propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    if (portionType === 'BUILDING' || portionType === 'APARTMENT' || portionType === 'UNIT') {
      for (const unit of prop.units) {
        if (unit.id === portionId) {
          unit.isAvailable = isAvailable;
          return;
        }
      }
    } else if (portionType === 'ROOM') {
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          if (room.id === portionId) {
            room.isAvailable = isAvailable;
            return;
          }
        }
      }
    } else if (portionType === 'BED') {
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          for (const bed of room.beds) {
            if (bed.id === portionId) {
              bed.isAvailable = isAvailable;
              return;
            }
          }
        }
      }
    }
  }

  // ==========================================
  // SEARCH & DISCOVERY (F14 - F15)
  // ==========================================

  public searchProperties(filters: {
    cityId?: string;
    areaId?: string;
    universityId?: string;
    maxDistanceKm?: number;
    minPriceEgp?: number;
    maxPriceEgp?: number;
    accommodationType?: PropertyType;
    genderPolicy?: GenderPolicy;
    durationUnit?: DurationUnit;
  }): Array<PropertyListingFixture & { distanceToUniversityKm?: number; score?: number }> {
    const results: Array<
      PropertyListingFixture & { distanceToUniversityKm?: number; score?: number }
    > = [];

    let targetUniv: UniversityFixture | undefined;
    if (filters.universityId) {
      targetUniv = EGYPTIAN_UNIVERSITIES.find(u => u.id === filters.universityId);
    }

    for (const prop of this.properties.values()) {
      // Must be approved and active for public search
      if (prop.approvalStatus !== 'APPROVED' || !prop.isActive) {
        continue;
      }

      if (filters.cityId && prop.cityId !== filters.cityId) continue;
      if (filters.areaId && prop.areaId !== filters.areaId) continue;
      if (filters.genderPolicy && prop.genderPolicy !== filters.genderPolicy) continue;
      if (filters.accommodationType && prop.propertyType !== filters.accommodationType) continue;
      if (filters.durationUnit && prop.durationUnit !== filters.durationUnit) continue;

      if (filters.minPriceEgp !== undefined && prop.basePriceEgp < filters.minPriceEgp) continue;
      if (filters.maxPriceEgp !== undefined && prop.basePriceEgp > filters.maxPriceEgp) continue;

      let distanceKm: number | undefined;
      if (targetUniv) {
        distanceKm = calculateHaversineDistance(
          prop.coordinates.lat,
          prop.coordinates.lng,
          targetUniv.mainCampusCoordinates.lat,
          targetUniv.mainCampusCoordinates.lng,
        );

        if (filters.maxDistanceKm !== undefined && distanceKm > filters.maxDistanceKm) {
          continue;
        }
      }

      const item: PropertyListingFixture & { distanceToUniversityKm?: number; score?: number } =
        deepClone(prop);
      item.distanceToUniversityKm = distanceKm;
      // Transparent ranking: closer distance + lower price
      if (distanceKm !== undefined) {
        item.score = parseFloat((distanceKm * 100 + prop.basePriceEgp * 0.05).toFixed(2));
      }

      results.push(item);
    }

    // Sort by proximity / suitability score
    results.sort((a, b) => {
      if (a.score !== undefined && b.score !== undefined) {
        return a.score - b.score;
      }
      return a.basePriceEgp - b.basePriceEgp;
    });

    return results;
  }

  // ==========================================
  // BOOKING REQUESTS & CONCURRENCY (F16 - F23)
  // ==========================================

  public createBookingRequest(data: {
    studentId: string;
    propertyId: string;
    portionType: PortionType;
    portionId: string;
    proposedMoveInDate: string;
    proposedDurationUnit: DurationUnit;
    studentNotes?: string;
  }): {
    bookingRequest: BookingRequestEntity;
    conversation: ConversationEntity;
    mutualContacts: any;
  } {
    const student = this.students.get(data.studentId);
    if (!student) throw { statusCode: 404, message: 'Student not found' };

    const prop = this.properties.get(data.propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    if (prop.approvalStatus !== 'APPROVED' || !prop.isActive) {
      throw {
        statusCode: 400,
        error: 'PROPERTY_NOT_AVAILABLE',
        message: 'Property is not active or approved for bookings',
      };
    }

    const provider = this.providers.get(prop.providerId);
    if (!provider) throw { statusCode: 404, message: 'Provider not found' };

    // Rule 18: Maximum 1 confirmed booking per student
    for (const req of this.bookingRequests.values()) {
      if (req.studentId === data.studentId && req.status === 'CONFIRMED') {
        throw {
          statusCode: 409,
          error: 'STUDENT_ALREADY_HAS_CONFIRMED_BOOKING',
          message:
            'Student already has an active confirmed booking. Cannot submit new booking requests.',
        };
      }
    }

    // Rule 17: Maximum 3 open booking requests (PENDING or ACCEPTED)
    let openCount = 0;
    for (const req of this.bookingRequests.values()) {
      if (
        req.studentId === data.studentId &&
        (req.status === 'PENDING' || req.status === 'ACCEPTED')
      ) {
        openCount++;
      }
    }
    if (openCount >= 3) {
      throw {
        statusCode: 400,
        error: 'MAX_OPEN_REQUESTS_EXCEEDED',
        message: 'Student cannot have more than 3 simultaneous open booking requests.',
      };
    }

    // Check portion availability
    const avail = this.getPortionAvailability(data.propertyId, data.portionType, data.portionId);
    if (!avail.isAvailable) {
      throw {
        statusCode: 400,
        message: 'The requested accommodation portion is currently unavailable',
      };
    }

    const requestId = this.generateId('req');
    const nowStr = new Date().toISOString();

    const bookingRequest: BookingRequestEntity = {
      id: requestId,
      studentId: data.studentId,
      propertyId: data.propertyId,
      portionType: data.portionType,
      portionId: data.portionId,
      status: 'PENDING',
      proposedMoveInDate: data.proposedMoveInDate,
      proposedDurationUnit: data.proposedDurationUnit,
      studentNotes: data.studentNotes,
      studentAgreed: false,
      providerAgreed: false,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    this.bookingRequests.set(requestId, bookingRequest);

    // Rule 24: Automatically create linked 1:1 conversation thread
    const conversation = this.createConversation({
      bookingRequestId: requestId,
      studentId: data.studentId,
      providerId: prop.providerId,
      propertyId: data.propertyId,
    });

    // Rule 25: Dispatch In-App Notification to Provider
    this.createNotification({
      userId: prop.providerId,
      type: 'BOOKING_REQUEST_RECEIVED',
      titleAr: 'طلب حجز جديد',
      titleEn: 'New Booking Request Received',
      messageAr: `تلقيت طلب حجز جديد من الطالب ${student.nameAr}`,
      messageEn: `You received a new booking request from student ${student.nameEn}`,
      data: { requestId, studentId: data.studentId, propertyId: data.propertyId },
    });

    // Rule 23: Mutual Contact Disclosure Transparency immediately revealed
    const mutualContacts = {
      student: {
        id: student.id,
        nameAr: student.nameAr,
        nameEn: student.nameEn,
        phone: student.phone,
        email: student.email,
        universityId: student.universityId,
      },
      provider: {
        id: provider.id,
        nameAr: provider.nameAr,
        nameEn: provider.nameEn,
        phone: provider.phone,
        email: provider.email,
      },
    };

    return {
      bookingRequest: deepClone(bookingRequest),
      conversation: deepClone(conversation),
      mutualContacts,
    };
  }

  public providerAcceptRequest(requestId: string, providerId: string): BookingRequestEntity {
    const req = this.bookingRequests.get(requestId);
    if (!req) throw { statusCode: 404, message: 'Booking request not found' };

    const prop = this.properties.get(req.propertyId);
    if (!prop || prop.providerId !== providerId) {
      throw { statusCode: 403, message: 'Only the property provider can accept this request' };
    }

    if (req.status !== 'PENDING') {
      throw { statusCode: 400, message: `Cannot accept booking request with status ${req.status}` };
    }

    req.status = 'ACCEPTED';
    req.providerAgreed = true;
    req.updatedAt = new Date().toISOString();

    // Notify student
    this.createNotification({
      userId: req.studentId,
      type: 'BOOKING_REQUEST_ACCEPTED',
      titleAr: 'تم قبول طلب الحجز',
      titleEn: 'Booking Request Accepted',
      messageAr: `تمت الموافقة على طلب الحجز الخاص بك في ${prop.titleAr}`,
      messageEn: `Your booking request for ${prop.titleEn} was accepted`,
      data: { requestId },
    });

    return deepClone(req);
  }

  public providerRejectRequest(
    requestId: string,
    providerId: string,
    reason?: string,
  ): BookingRequestEntity {
    const req = this.bookingRequests.get(requestId);
    if (!req) throw { statusCode: 404, message: 'Booking request not found' };

    const prop = this.properties.get(req.propertyId);
    if (!prop || prop.providerId !== providerId) {
      throw { statusCode: 403, message: 'Only the property provider can reject this request' };
    }

    if (req.status !== 'PENDING' && req.status !== 'ACCEPTED') {
      throw { statusCode: 400, message: `Cannot reject booking request with status ${req.status}` };
    }

    req.status = 'REJECTED';
    req.rejectionReason = reason; // Optional according to app.txt §5.8
    req.rejectedAt = new Date().toISOString();
    req.updatedAt = req.rejectedAt;

    // Conversation thread remains permanently open (§5.10)
    // Notify student
    this.createNotification({
      userId: req.studentId,
      type: 'BOOKING_REQUEST_REJECTED',
      titleAr: 'تم رفض طلب الحجز',
      titleEn: 'Booking Request Rejected',
      messageAr: `تم رفض طلب الحجز الخاص بك في ${prop.titleAr}`,
      messageEn: `Your booking request for ${prop.titleEn} was rejected`,
      data: { requestId },
    });

    return deepClone(req);
  }

  public studentCancelRequest(
    requestId: string,
    studentId: string,
    reason?: string,
  ): BookingRequestEntity {
    const req = this.bookingRequests.get(requestId);
    if (!req) throw { statusCode: 404, message: 'Booking request not found' };

    if (req.studentId !== studentId) {
      throw { statusCode: 403, message: 'Only the requesting student can cancel this request' };
    }

    if (req.status !== 'PENDING' && req.status !== 'ACCEPTED') {
      throw { statusCode: 400, message: `Cannot cancel booking request with status ${req.status}` };
    }

    req.status = 'CANCELLED';
    req.cancellationReason = reason;
    req.cancelledAt = new Date().toISOString();
    req.updatedAt = req.cancelledAt;

    // Notify provider
    const prop = this.properties.get(req.propertyId);
    if (prop) {
      this.createNotification({
        userId: prop.providerId,
        type: 'BOOKING_REQUEST_CANCELLED',
        titleAr: 'إلغاء طلب الحجز',
        titleEn: 'Booking Request Cancelled',
        messageAr: `قام الطالب بإلغاء طلب الحجز`,
        messageEn: `Student cancelled the booking request`,
        data: { requestId },
      });
    }

    return deepClone(req);
  }

  /**
   * Mutual Agreement Confirmation with Atomic Row-Locking Simulation (F21 & F22)
   */
  public confirmMutualAgreement(
    requestId: string,
    actingUserId: string,
    agreementDocUrl?: string,
  ): { confirmedBooking: BookingRequestEntity; autoClosedRequestsCount: number } {
    const req = this.bookingRequests.get(requestId);
    if (!req) throw { statusCode: 404, message: 'Booking request not found' };

    const prop = this.properties.get(req.propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    if (prop.approvalStatus !== 'APPROVED' || !prop.isActive) {
      throw {
        statusCode: 400,
        error: 'PROPERTY_NOT_AVAILABLE',
        message: 'Property is not active or approved for bookings',
      };
    }

    const isStudent = actingUserId === req.studentId;
    const isProvider = actingUserId === prop.providerId;

    if (!isStudent && !isProvider) {
      throw { statusCode: 403, message: 'Only booking participants can confirm mutual agreement' };
    }

    if (req.status === 'CLOSED_CONFLICT') {
      throw {
        statusCode: 409,
        error: 'PORTION_ALREADY_BOOKED',
        message: 'The requested portion is already booked and unavailable',
      };
    }

    if (req.status !== 'PENDING' && req.status !== 'ACCEPTED') {
      throw {
        statusCode: 400,
        error: 'INVALID_BOOKING_STATUS',
        message: 'Cannot confirm booking request with status ' + req.status,
      };
    }

    if (isStudent) req.studentAgreed = true;
    if (isProvider) req.providerAgreed = true;
    if (agreementDocUrl) req.agreementDocumentUrl = agreementDocUrl;

    // Both parties must agree
    if (!req.studentAgreed || !req.providerAgreed) {
      req.updatedAt = new Date().toISOString();
      return { confirmedBooking: deepClone(req), autoClosedRequestsCount: 0 };
    }

    // --- ATOMIC ROW-LOCK TRANSACTION SIMULATION ---
    const lockKey = `${req.propertyId}:${req.portionType}:${req.portionId}`;
    if (this.rowLocks.has(lockKey)) {
      throw {
        statusCode: 409,
        error: 'CONCURRENCY_LOCK_COLLISION',
        message: 'Concurrent agreement confirmation in progress for this accommodation portion',
      };
    }

    try {
      this.rowLocks.add(lockKey);

      // Verify student single confirmed booking constraint again
      for (const r of this.bookingRequests.values()) {
        if (r.id !== req.id && r.studentId === req.studentId && r.status === 'CONFIRMED') {
          throw {
            statusCode: 409,
            error: 'STUDENT_ALREADY_HAS_CONFIRMED_BOOKING',
            message: 'Student already has an active confirmed booking',
          };
        }
      }

      // Re-verify child availability before booking (§5.2, §5.9)
      if (req.portionType === 'ROOM') {
        for (const unit of prop.units) {
          for (const room of unit.rooms) {
            if (room.id === req.portionId) {
              if (!room.isAvailable) {
                throw {
                  statusCode: 409,
                  error: 'PORTION_ALREADY_BOOKED',
                  message: 'The requested portion is already booked and unavailable',
                };
              }
              const anyBedBooked = room.beds.some(b => !b.isAvailable);
              if (anyBedBooked) {
                throw {
                  statusCode: 409,
                  error: 'PORTION_ALREADY_BOOKED',
                  message: 'A sub-portion of this accommodation is already booked',
                };
              }
            }
          }
        }
      } else if (
        req.portionType === 'UNIT' ||
        req.portionType === 'APARTMENT' ||
        req.portionType === 'BUILDING'
      ) {
        for (const unit of prop.units) {
          if (
            unit.id === req.portionId ||
            (prop.propertyType === 'APARTMENT' && prop.id === req.portionId)
          ) {
            if (!unit.isAvailable) {
              throw {
                statusCode: 409,
                error: 'PORTION_ALREADY_BOOKED',
                message: 'The requested portion is already booked and unavailable',
              };
            }
            const anyChildBooked = unit.rooms.some(
              r => !r.isAvailable || r.beds.some(b => !b.isAvailable),
            );
            if (anyChildBooked) {
              throw {
                statusCode: 409,
                error: 'PORTION_ALREADY_BOOKED',
                message: 'A sub-portion of this accommodation is already booked',
              };
            }
          }
        }
      }

      // Check current portion availability
      const avail = this.getPortionAvailability(req.propertyId, req.portionType, req.portionId);
      if (!avail.isAvailable) {
        throw {
          statusCode: 409,
          error: 'PORTION_ALREADY_BOOKED',
          message: 'The requested portion is already booked and unavailable',
        };
      }

      // 1. Mark target portion unavailable (Partial availability engine - §5.2, §5.9)
      this.markPortionBooked(prop, req.portionType, req.portionId, req.studentId);

      // 2. Mark booking request CONFIRMED
      req.status = 'CONFIRMED';
      req.confirmedAt = new Date().toISOString();
      req.updatedAt = req.confirmedAt;

      // 3. Auto-close competing requests targeting the portion or hierarchical overlaps (§5.9)
      let autoClosedCount = 0;
      for (const otherReq of this.bookingRequests.values()) {
        if (
          otherReq.id !== req.id &&
          otherReq.propertyId === req.propertyId &&
          (otherReq.status === 'PENDING' || otherReq.status === 'ACCEPTED') &&
          this.isPortionConflicting(
            prop,
            req.portionType,
            req.portionId,
            otherReq.portionType,
            otherReq.portionId,
          )
        ) {
          otherReq.status = 'CLOSED_CONFLICT';
          otherReq.updatedAt = new Date().toISOString();
          autoClosedCount++;

          // Notify competing student
          this.createNotification({
            userId: otherReq.studentId,
            type: 'REQUEST_CLOSED_CONFLICT',
            titleAr: 'تم إغلاق طلب الحجز لعدم التوفر',
            titleEn: 'Booking Request Closed Due to Unavailability',
            messageAr: `نأسف، تم تأكيد حجز السكن المطلوب بواسطة طالب آخر`,
            messageEn: `The requested portion has been confirmed by another student`,
            data: { requestId: otherReq.id },
          });
        }
      }

      // Dispatches confirmation notifications to both parties
      this.createNotification({
        userId: req.studentId,
        type: 'AGREEMENT_CONFIRMED',
        titleAr: 'مبروك! تم تأكيد السكن بنجاح',
        titleEn: 'Congratulations! Booking Confirmed',
        messageAr: `تم تأكيد حجزك في ${prop.titleAr}`,
        messageEn: `Your booking for ${prop.titleEn} is successfully confirmed`,
        data: { requestId: req.id },
      });

      this.createNotification({
        userId: prop.providerId,
        type: 'AGREEMENT_CONFIRMED',
        titleAr: 'تم تأكيد الحجز',
        titleEn: 'Booking Confirmed',
        messageAr: `تم تأكيد حجز السكن مع الطالب بنجاح`,
        messageEn: `Booking with student confirmed successfully`,
        data: { requestId: req.id },
      });

      return { confirmedBooking: deepClone(req), autoClosedRequestsCount: autoClosedCount };
    } finally {
      this.rowLocks.delete(lockKey);
    }
  }

  private markPortionBooked(
    prop: PropertyListingFixture,
    portionType: PortionType,
    portionId: string,
    studentId: string,
  ): void {
    if (portionType === 'BED') {
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          for (const bed of room.beds) {
            if (bed.id === portionId) {
              bed.isAvailable = false;
              bed.bookedByStudentId = studentId;
              // Sibling beds remain untouched!
              return;
            }
          }
        }
      }
    } else if (portionType === 'ROOM') {
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          if (room.id === portionId) {
            room.isAvailable = false;
            for (const bed of room.beds) {
              bed.isAvailable = false;
              bed.bookedByStudentId = studentId;
            }
            return;
          }
        }
      }
    } else if (portionType === 'UNIT' || portionType === 'APARTMENT') {
      for (const unit of prop.units) {
        if (unit.id === portionId || (prop.propertyType === 'APARTMENT' && prop.id === portionId)) {
          unit.isAvailable = false;
          for (const room of unit.rooms) {
            room.isAvailable = false;
            for (const bed of room.beds) {
              bed.isAvailable = false;
              bed.bookedByStudentId = studentId;
            }
          }
          return;
        }
      }
    }
  }

  private isPortionConflicting(
    prop: PropertyListingFixture,
    confirmedType: PortionType,
    confirmedId: string,
    targetType: PortionType,
    targetId: string,
  ): boolean {
    if (confirmedType === 'BED') {
      // 1. Same bed
      if (targetType === 'BED' && targetId === confirmedId) return true;

      // 2. Parent room and parent unit
      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          if (room.beds.some(b => b.id === confirmedId)) {
            if (targetType === 'ROOM' && targetId === room.id) return true;
            if (
              (targetType === 'UNIT' || targetType === 'APARTMENT') &&
              (targetId === unit.id || targetId === prop.id)
            )
              return true;
          }
        }
      }
      return false;
    }

    if (confirmedType === 'ROOM') {
      // 1. Same room
      if (targetType === 'ROOM' && targetId === confirmedId) return true;

      for (const unit of prop.units) {
        for (const room of unit.rooms) {
          if (room.id === confirmedId) {
            // 2. All child beds in that room
            if (targetType === 'BED' && room.beds.some(b => b.id === targetId)) return true;
            // 3. Parent unit
            if (
              (targetType === 'UNIT' || targetType === 'APARTMENT') &&
              (targetId === unit.id || targetId === prop.id)
            )
              return true;
          }
        }
      }
      return false;
    }

    if (confirmedType === 'UNIT' || confirmedType === 'APARTMENT') {
      // 1. Same unit / apartment
      if (
        (targetType === 'UNIT' || targetType === 'APARTMENT') &&
        (targetId === confirmedId || targetId === prop.id)
      )
        return true;

      for (const unit of prop.units) {
        if (
          unit.id === confirmedId ||
          (prop.propertyType === 'APARTMENT' && prop.id === confirmedId)
        ) {
          // 2. All child rooms in that unit
          if (targetType === 'ROOM' && unit.rooms.some(r => r.id === targetId)) return true;
          // 3. All child beds in that unit
          if (targetType === 'BED' && unit.rooms.some(r => r.beds.some(b => b.id === targetId)))
            return true;
        }
      }
      return false;
    }

    if (confirmedType === 'BUILDING') {
      return true;
    }

    return false;
  }

  public getBookingRequestById(requestId: string): BookingRequestEntity | undefined {
    const req = this.bookingRequests.get(requestId);
    return req ? deepClone(req) : undefined;
  }

  public getStudentBookingRequests(studentId: string): BookingRequestEntity[] {
    const list: BookingRequestEntity[] = [];
    for (const req of this.bookingRequests.values()) {
      if (req.studentId === studentId) list.push(deepClone(req));
    }
    return list;
  }

  // ==========================================
  // MESSAGING & NOTIFICATIONS (F24 - F25)
  // ==========================================

  public createConversation(data: {
    bookingRequestId: string;
    studentId: string;
    providerId: string;
    propertyId: string;
  }): ConversationEntity {
    const conversationId = this.generateId('conv');
    const conversation: ConversationEntity = {
      id: conversationId,
      bookingRequestId: data.bookingRequestId,
      studentId: data.studentId,
      providerId: data.providerId,
      propertyId: data.propertyId,
      isOpenPermanently: true,
      messages: [],
      studentUnreadCount: 0,
      providerUnreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.conversations.set(conversationId, conversation);
    return deepClone(conversation);
  }

  public getConversationByRequestId(
    requestId: string,
    requestingUserId: string,
  ): ConversationEntity {
    const conv = Array.from(this.conversations.values()).find(
      c => c.bookingRequestId === requestId,
    );
    if (!conv) throw { statusCode: 404, message: 'Conversation not found for this request' };

    if (requestingUserId !== conv.studentId && requestingUserId !== conv.providerId) {
      throw { statusCode: 403, message: 'Access denied to this conversation' };
    }

    return deepClone(conv);
  }

  public sendMessage(conversationId: string, senderId: string, text: string): ChatMessageEntity {
    const conv = this.conversations.get(conversationId);
    if (!conv) throw { statusCode: 404, message: 'Conversation not found' };

    const isStudent = senderId === conv.studentId;
    const isProvider = senderId === conv.providerId;

    if (!isStudent && !isProvider) {
      throw { statusCode: 403, message: 'Sender is not a participant in this conversation' };
    }

    if (!text || text.trim().length === 0) {
      throw { statusCode: 400, message: 'Message text cannot be empty' };
    }

    const message: ChatMessageEntity = {
      id: this.generateId('msg'),
      conversationId,
      senderId,
      senderRole: isStudent ? 'STUDENT' : 'OWNER',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(message);
    if (isStudent) {
      conv.providerUnreadCount++;
    } else {
      conv.studentUnreadCount++;
    }

    return deepClone(message);
  }

  public createNotification(
    data: Omit<NotificationEntity, 'id' | 'createdAt' | 'isRead'>,
  ): NotificationEntity {
    const notif: NotificationEntity = {
      id: this.generateId('notif'),
      userId: data.userId,
      type: data.type,
      titleAr: data.titleAr,
      titleEn: data.titleEn,
      messageAr: data.messageAr,
      messageEn: data.messageEn,
      data: data.data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.set(notif.id, notif);
    return deepClone(notif);
  }

  public getUserNotifications(userId: string): NotificationEntity[] {
    const list: NotificationEntity[] = [];
    for (const n of this.notifications.values()) {
      if (n.userId === userId) list.push(deepClone(n));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ==========================================
  // REVIEWS & COMPLAINTS (F26 - F28)
  // ==========================================

  public submitReview(data: {
    bookingRequestId: string;
    studentId: string;
    rating: number; // 1 to 5
    comment?: string;
  }): ReviewEntity {
    const req = this.bookingRequests.get(data.bookingRequestId);
    if (!req) throw { statusCode: 404, message: 'Booking request not found' };

    if (req.studentId !== data.studentId) {
      throw { statusCode: 403, message: 'Only the tenant student can review this booking' };
    }

    // Eligibility gate: MUST have status CONFIRMED (§5.13)
    if (req.status !== 'CONFIRMED') {
      throw {
        statusCode: 403,
        error: 'REVIEW_NOT_ELIGIBLE',
        message: 'Reviews are permitted only after a confirmed booking has been established',
      };
    }

    // Duplicate prevention: Exactly 1 review per confirmed booking (§5.13)
    for (const r of this.reviews.values()) {
      if (r.bookingRequestId === data.bookingRequestId) {
        throw {
          statusCode: 409,
          error: 'REVIEW_ALREADY_EXISTS',
          message: 'Review already submitted for this confirmed booking',
        };
      }
    }

    if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      throw { statusCode: 400, message: 'Rating must be an integer between 1 and 5 stars' };
    }

    const review: ReviewEntity = {
      id: this.generateId('rev'),
      bookingRequestId: data.bookingRequestId,
      propertyId: req.propertyId,
      studentId: data.studentId,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };

    this.reviews.set(review.id, review);
    return deepClone(review);
  }

  public submitReviewResponse(
    reviewId: string,
    providerId: string,
    responseText: string,
  ): ReviewEntity {
    const review = this.reviews.get(reviewId);
    if (!review) throw { statusCode: 404, message: 'Review not found' };

    const prop = this.properties.get(review.propertyId);
    if (!prop || prop.providerId !== providerId) {
      throw { statusCode: 403, message: 'Only the property provider can respond to this review' };
    }

    // Single response enforcement rule (§5.13)
    if (review.response) {
      throw {
        statusCode: 409,
        error: 'RESPONSE_ALREADY_EXISTS',
        message: 'Provider has already submitted the single permitted response to this review',
      };
    }

    if (!responseText || responseText.trim().length === 0) {
      throw { statusCode: 400, message: 'Response text cannot be empty' };
    }

    review.response = {
      id: this.generateId('resp'),
      providerId,
      responseText: responseText.trim(),
      createdAt: new Date().toISOString(),
    };

    return deepClone(review);
  }

  public submitComplaint(data: {
    reporterId: string;
    targetEntityType: 'PROPERTY' | 'USER' | 'REVIEW';
    targetEntityId: string;
    reason: string;
    description: string;
  }): ComplaintEntity {
    if (!data.description || data.description.trim().length === 0) {
      throw { statusCode: 400, message: 'Complaint description is mandatory (text-only)' };
    }

    const complaint: ComplaintEntity = {
      id: this.generateId('cmp'),
      reporterId: data.reporterId,
      targetEntityType: data.targetEntityType,
      targetEntityId: data.targetEntityId,
      reason: data.reason,
      description: data.description.trim(),
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.complaints.set(complaint.id, complaint);
    return deepClone(complaint);
  }

  public updateComplaintStatus(
    complaintId: string,
    adminId: string,
    status: ComplaintStatus,
    resolutionNotes?: string,
  ): ComplaintEntity {
    this.assertAdminRole(adminId);

    const comp = this.complaints.get(complaintId);
    if (!comp) throw { statusCode: 404, message: 'Complaint not found' };

    const before = deepClone(comp);
    comp.status = status;
    if (resolutionNotes) comp.adminResolutionNotes = resolutionNotes;
    comp.updatedAt = new Date().toISOString();

    this.logAdminAction({
      adminId,
      action: 'COMPLAINT_STATUS_UPDATE',
      targetEntity: 'COMPLAINT',
      targetId: complaintId,
      beforeState: before,
      afterState: deepClone(comp),
      ipAddress: '127.0.0.1',
    });

    return deepClone(comp);
  }

  // ==========================================
  // ADMIN DASHBOARD & AUDIT LOGGING (F29 - F30)
  // ==========================================

  public getPendingKycQueue(adminId: string): ProviderUserFixture[] {
    this.assertAdminRole(adminId);
    const list: ProviderUserFixture[] = [];
    for (const p of this.providers.values()) {
      if (p.verificationStatus === 'PENDING') {
        list.push(deepClone(p));
      }
    }
    return list;
  }

  public reviewProviderKyc(
    adminId: string,
    providerId: string,
    approved: boolean,
    rejectionReason?: string,
  ): ProviderUserFixture {
    this.assertAdminRole(adminId);
    const provider = this.providers.get(providerId);
    if (!provider) throw { statusCode: 404, message: 'Provider not found' };

    const beforeState = deepClone(provider);
    provider.verificationStatus = approved ? 'VERIFIED' : 'REJECTED';
    provider.reviewedByAdminId = adminId;
    provider.reviewedAt = new Date().toISOString();
    if (!approved) {
      provider.rejectionReason =
        rejectionReason || 'KYC documents do not meet verification requirements';
    } else {
      provider.rejectionReason = undefined;
      provider.kycDocuments.forEach(doc => (doc.isVerified = true));
    }

    this.logAdminAction({
      adminId,
      action: approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
      targetEntity: 'PROVIDER_KYC',
      targetId: providerId,
      beforeState,
      afterState: deepClone(provider),
      ipAddress: '127.0.0.1',
    });

    return deepClone(provider);
  }

  public getPendingListingQueue(adminId: string): PropertyListingFixture[] {
    this.assertAdminRole(adminId);
    const list: PropertyListingFixture[] = [];
    for (const p of this.properties.values()) {
      if (p.approvalStatus === 'PENDING_APPROVAL') {
        list.push(deepClone(p));
      }
    }
    return list;
  }

  public reviewPropertyListing(
    adminId: string,
    propertyId: string,
    approved: boolean,
    reason?: string,
  ): PropertyListingFixture {
    this.assertAdminRole(adminId);
    const prop = this.properties.get(propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    const beforeState = deepClone(prop);
    prop.approvalStatus = approved ? 'APPROVED' : 'REJECTED';
    prop.isActive = approved;
    prop.isVerified = approved;

    this.logAdminAction({
      adminId,
      action: approved ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      targetEntity: 'PROPERTY_LISTING',
      targetId: propertyId,
      beforeState,
      afterState: deepClone(prop),
      ipAddress: '127.0.0.1',
    });

    return deepClone(prop);
  }

  public suspendPropertyListing(
    adminId: string,
    propertyId: string,
    reason: string,
  ): PropertyListingFixture {
    this.assertAdminRole(adminId);
    const prop = this.properties.get(propertyId);
    if (!prop) throw { statusCode: 404, message: 'Property not found' };

    const beforeState = deepClone(prop);
    prop.approvalStatus = 'SUSPENDED';
    prop.isActive = false;

    this.logAdminAction({
      adminId,
      action: 'LISTING_SUSPENDED',
      targetEntity: 'PROPERTY_LISTING',
      targetId: propertyId,
      beforeState,
      afterState: deepClone(prop),
      ipAddress: '127.0.0.1',
    });

    return deepClone(prop);
  }

  public getAdminActionLogs(adminId: string): AdminActionLogEntry[] {
    this.assertAdminRole(adminId);
    // Return frozen copy (immutable audit log)
    return deepClone(this.adminLogs);
  }

  public getPlatformDashboardMetrics(adminId: string): {
    totalStudents: number;
    totalProviders: number;
    verifiedProviders: number;
    activeProperties: number;
    totalBookings: number;
    confirmedBookings: number;
    avgMonthlyPriceEgp: number;
  } {
    this.assertAdminRole(adminId);

    let priceSum = 0;
    let activeProps = 0;
    for (const p of this.properties.values()) {
      if (p.approvalStatus === 'APPROVED' && p.isActive) {
        priceSum += p.basePriceEgp;
        activeProps++;
      }
    }

    let confirmedCount = 0;
    for (const r of this.bookingRequests.values()) {
      if (r.status === 'CONFIRMED') confirmedCount++;
    }

    let verifiedProviders = 0;
    for (const p of this.providers.values()) {
      if (p.verificationStatus === 'VERIFIED') verifiedProviders++;
    }

    return {
      totalStudents: this.students.size,
      totalProviders: this.providers.size,
      verifiedProviders,
      activeProperties: activeProps,
      totalBookings: this.bookingRequests.size,
      confirmedBookings: confirmedCount,
      avgMonthlyPriceEgp: activeProps > 0 ? Math.round(priceSum / activeProps) : 0,
    };
  }

  private assertAdminRole(adminId: string): void {
    const admin = this.admins.get(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      throw { statusCode: 403, message: 'Forbidden: Requires administrative credentials' };
    }
  }

  public recordAdminAction(
    entry: Omit<AdminActionLogEntry, 'id' | 'timestamp'>,
  ): AdminActionLogEntry {
    this.logAdminAction(entry);
    return deepClone(this.adminLogs[this.adminLogs.length - 1]);
  }

  private logAdminAction(entry: Omit<AdminActionLogEntry, 'id' | 'timestamp'>): void {
    const log: AdminActionLogEntry = {
      id: this.generateId('audit'),
      adminId: entry.adminId,
      action: entry.action,
      targetEntity: entry.targetEntity,
      targetId: entry.targetId,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      ipAddress: entry.ipAddress,
      timestamp: new Date().toISOString(),
    };
    // Append-only invariant
    this.adminLogs.push(Object.freeze(log));
  }
}
