import { Controller, Get, Post, Patch, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@repo/shared-types';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all filed complaints/reports (Admin)' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get('my-reports')
  @ApiOperation({ summary: "Get current user's submitted reports" })
  findMyReports(@Req() req: any) {
    const userId = req.user?.id || 'mock-user-1';
    return this.reportsService.findByReporter(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  findById(@Param('id') id: string) {
    return this.reportsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submit new complaint / report' })
  create(@Body() body: any, @Req() req: any) {
    return this.reportsService.create(body, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report moderation status with admin audit logging' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('adminNotes') adminNotes: string,
    @Req() req: any,
  ) {
    return this.reportsService.updateStatus(id, status, adminNotes, req.user);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report moderation status (PUT)' })
  updateStatusPut(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('adminNotes') adminNotes: string,
    @Req() req: any,
  ) {
    return this.reportsService.updateStatus(id, status, adminNotes, req.user);
  }
}
