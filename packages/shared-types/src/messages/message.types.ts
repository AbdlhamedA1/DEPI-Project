export enum ReportStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESPONDED = 'RESPONDED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  DISMISSED = 'DISMISSED',
}

export enum ReportReason {
  MISLEADING_INFO = 'MISLEADING_INFO',
  INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR',
  FRAUD = 'FRAUD',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  OTHER = 'OTHER',
}

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_ACCEPTED = 'BOOKING_ACCEPTED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  AGREEMENT_CONFIRMED = 'AGREEMENT_CONFIRMED',
  CONFLICT_CLOSED = 'CONFLICT_CLOSED',
  STATUS_UPDATE = 'STATUS_UPDATE',
  NEW_MESSAGE = 'NEW_MESSAGE',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  VERIFICATION_UPDATE = 'VERIFICATION_UPDATE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface IConversation {
  id: string;
  bookingRequestId?: string;
  propertyId?: string;
  studentId: string;
  ownerId: string;
  lastMessageAt?: Date | string;
  unreadCountStudent: number;
  unreadCountOwner: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt?: Date | string;
  attachmentUrl?: string;
  createdAt: Date | string;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
}

export interface IReview {
  id: string;
  bookingRequestId: string;
  propertyId: string;
  studentId: string;
  rating: number;
  cleanlinessRating?: number;
  locationRating?: number;
  valueRating?: number;
  ownerRating?: number;
  comment: string;
  response?: IReviewResponse;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IReviewResponse {
  id: string;
  reviewId: string;
  ownerId: string;
  comment: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedPropertyId?: string;
  reason: ReportReason;
  description: string;
  evidenceUrls: string[];
  status: ReportStatus;
  adminNotes?: string;
  resolvedById?: string;
  resolvedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPlatformSettings {
  id: string;
  siteNameAr: string;
  siteNameEn: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  autoApproveListings: boolean;
  supportPhone: string;
  supportEmail: string;
  maxActiveBookingsPerStudent: number;
  bookingExpirationHours: number;
  updatedAt: Date | string;
}
