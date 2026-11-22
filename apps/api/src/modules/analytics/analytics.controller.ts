import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@repo/shared-types';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated platform analytics summary' })
  getDashboardAnalytics() {
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get multi-dimensional 4-pillar platform overview' })
  getOverviewAnalytics() {
    return this.analyticsService.getOverviewAnalytics();
  }

  @Get('cities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get geographic supply and demand metrics across Egyptian student hubs',
  })
  getCitiesAnalytics() {
    return this.analyticsService.getCitiesAnalytics();
  }

  @Get('pricing-trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rental pricing trends across beds, rooms, and units' })
  getPricingTrends(@Query() query: any) {
    return this.analyticsService.getPricingTrends(query?.cityId, query?.areaId, query?.period);
  }

  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 4-stage booking lifecycle funnel metrics' })
  getBookingFunnel() {
    return this.analyticsService.getBookingFunnelAnalytics();
  }

  @Get('trust-safety')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform trust, reviews, and dispute resolution metrics' })
  getTrustSafetyMetrics() {
    return this.analyticsService.getTrustSafetyAnalytics();
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export platform data and audit trails in CSV or JSON' })
  async exportAnalytics(@Query() query: any, @Res() res: Response) {
    const reportType = query?.reportType || 'overview';
    const format = query?.format || 'csv';
    const result = await this.analyticsService.exportAnalytics(
      reportType,
      format,
      query?.from,
      query?.to,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  }
}
