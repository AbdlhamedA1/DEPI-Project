import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AdminService } from '../admin/admin.service';

describe('AnalyticsService (Phase 12 QA)', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const adminServiceMock = {
      getAuditLogs: jest.fn().mockResolvedValue([
        {
          id: 'log-1',
          adminId: 'admin-super',
          actionType: 'KYC_APPROVE',
          targetType: 'KYC_DOCUMENT',
          targetId: 'doc-1',
          ipAddress: '127.0.0.1',
          timestamp: '2026-11-21T10:00:00Z',
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: AdminService, useValue: adminServiceMock }],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Multi-dimensional Platform Analytics', () => {
    it('should return backward-compatible dashboard analytics summary', async () => {
      const summary = await service.getDashboardAnalytics();
      expect(summary.monthlyActiveUsers).toBeGreaterThan(0);
      expect(summary.monthlyBookingRequests).toBeGreaterThan(0);
      expect(summary.conversionRate).toBeGreaterThan(0);
      expect(summary.avgMonthlyRentEgp).toBeGreaterThan(0);
    });

    it('should return comprehensive 4-pillar overview analytics', async () => {
      const overview = await service.getOverviewAnalytics();
      expect(overview.users).toBeDefined();
      expect(overview.inventory).toBeDefined();
      expect(overview.bookingFunnel).toBeDefined();
      expect(overview.trustAndSafety).toBeDefined();
      expect(overview.summary).toBeDefined();

      // Check User Demographics
      expect(overview.users.totalUsers).toBeGreaterThan(0);
      expect(overview.users.studentsCount).toBeGreaterThan(0);
      expect(overview.users.providersClassification.individual).toBeGreaterThan(0);

      // Check Inventory & Occupancy
      expect(overview.inventory.totalListings).toBeGreaterThan(0);
      expect(overview.inventory.occupancy.occupancyRate).toBeGreaterThan(0);

      // Check 4-Stage Booking Funnel
      expect(overview.bookingFunnel.submitted).toBeGreaterThan(0);
      expect(overview.bookingFunnel.confirmed).toBeGreaterThan(0);
      expect(overview.bookingFunnel.overallConversionRate).toBeGreaterThan(0);

      // Check Trust & Safety KPIs
      expect(overview.trustAndSafety.averagePlatformRating).toBeGreaterThanOrEqual(1);
      expect(overview.trustAndSafety.subRatings.cleanliness).toBeGreaterThan(0);
    });

    it('should return geographic breakdown across Egyptian student hubs', async () => {
      const cities = await service.getCitiesAnalytics();
      expect(cities.length).toBeGreaterThanOrEqual(3);
      expect(cities.some(c => c.cityNameAr.includes('الجيزة'))).toBe(true);
      expect(cities.some(c => c.cityNameAr.includes('القاهرة'))).toBe(true);
      expect(cities.some(c => c.cityNameAr.includes('الإسكندرية'))).toBe(true);
    });

    it('should return rental price trends for bed, room, and apartment portions', async () => {
      const trends = await service.getPricingTrends();
      expect(trends.length).toBeGreaterThan(0);
      expect(trends.some(t => t.portionType === 'BED')).toBe(true);
      expect(trends.some(t => t.portionType === 'ROOM')).toBe(true);
      expect(trends.some(t => t.portionType === 'UNIT')).toBe(true);
    });
  });

  describe('Report Export Engine (CSV with UTF-8 BOM & JSON)', () => {
    it('should export CSV with UTF-8 BOM for Arabic character rendering in Excel', async () => {
      const csvReport = await service.exportAnalytics('overview', 'csv');
      expect(csvReport.contentType).toBe('text/csv; charset=utf-8');
      expect(csvReport.filename).toMatch(/\.csv$/);
      // Starts with UTF-8 BOM \uFEFF
      expect(csvReport.content.startsWith('\uFEFF')).toBe(true);
      expect(csvReport.content).toContain('المستخدمين');
    });

    it('should export JSON formatted report', async () => {
      const jsonReport = await service.exportAnalytics('users', 'json');
      expect(jsonReport.contentType).toBe('application/json; charset=utf-8');
      expect(jsonReport.filename).toMatch(/\.json$/);
      const parsed = JSON.parse(jsonReport.content);
      expect(parsed.totalUsers).toBeDefined();
    });

    it('should export audit logs in CSV format', async () => {
      const auditCsv = await service.exportAnalytics('audit-logs', 'csv');
      expect(auditCsv.content.startsWith('\uFEFF')).toBe(true);
      expect(auditCsv.content).toContain('KYC_APPROVE');
      expect(auditCsv.content).toContain('admin-super');
    });
  });
});
