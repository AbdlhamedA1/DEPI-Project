import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getDashboardAnalytics() {
    return {
      monthlyActiveUsers: 3400,
      monthlyBookingRequests: 1250,
      conversionRate: 0.78,
      avgMonthlyRentEgp: 2450,
    };
  }
}
