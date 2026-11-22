export interface UserAnalytics {
  totalUsers: number;
  studentsCount: number;
  verifiedOwnersCount: number;
  pendingKycCount: number;
  unverifiedCount: number;
  providersClassification: {
    individual: number;
    agent: number;
    company: number;
  };
  universityDistribution: Record<string, number>;
  genderDistribution: {
    male: number;
    female: number;
    unspecified: number;
  };
  activeUsersMonthly: number;
}

export interface InventoryAnalytics {
  totalListings: number;
  approvedListings: number;
  pendingReviewListings: number;
  suspendedListings: number;
  portionBreakdown: {
    buildings: number;
    units: number;
    rooms: number;
    beds: number;
  };
  occupancy: {
    totalCapacity: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
  cityDistribution: Record<string, number>;
}

export interface BookingFunnelAnalytics {
  submitted: number;
  ownerApproved: number;
  confirmed: number;
  cancelledOrRejected: number;
  submissionToApprovalRate: number;
  approvalToConfirmationRate: number;
  overallConversionRate: number;
  avgTurnaroundHours: number;
}

export interface TrustSafetyAnalytics {
  averagePlatformRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  subRatings: {
    cleanliness: number;
    location: number;
    value: number;
    owner: number;
  };
  totalReports: number;
  openDisputes: number;
  resolvedDisputes: number;
  avgResolutionHours: number;
}

export interface PlatformOverviewAnalytics {
  users: UserAnalytics;
  inventory: InventoryAnalytics;
  bookingFunnel: BookingFunnelAnalytics;
  trustAndSafety: TrustSafetyAnalytics;
  summary: {
    monthlyActiveUsers: number;
    monthlyBookingRequests: number;
    conversionRate: number;
    avgMonthlyRentEgp: number;
  };
}

export type ExportFormat = 'csv' | 'json';
export type ExportReportType =
  'overview' | 'users' | 'inventory' | 'bookings' | 'trust-safety' | 'audit-logs';

export interface AnalyticsExportQuery {
  reportType: ExportReportType;
  format: ExportFormat;
  from?: string;
  to?: string;
}

export interface CityAnalyticsSummary {
  cityId: string;
  cityNameAr: string;
  cityNameEn: string;
  listingsCount: number;
  availableBeds: number;
  averageMonthlyRentEgp: number;
  demandIndex: number;
}

export interface PricingTrendPoint {
  period: string;
  portionType: 'BED' | 'ROOM' | 'UNIT';
  averagePriceEgp: number;
  minPriceEgp: number;
  maxPriceEgp: number;
}
