import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@repo/shared-types';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get(['metrics', 'dashboard', 'dashboard/metrics'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overview metrics for admin dashboard' })
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get(['verifications/pending', 'moderation/kyc'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending provider KYC verification requests' })
  getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  @Post(['verifications/:id/review', 'moderation/kyc/:id/review'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject provider KYC verification with audit logging' })
  reviewVerification(@Param('id') docId: string, @Req() req: any, @Body() body: any) {
    const adminId = req.user?.id || 'admin-super';
    const decision =
      body?.decision !== undefined ? body.decision : body?.approved ? 'APPROVE' : 'REJECT';
    const reason = body?.reason || body?.rejectionReason;
    const ip = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'AdminClient';
    return this.adminService.reviewVerification(docId, adminId, decision, reason, ip, userAgent);
  }

  @Patch('kyc/:userId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve KYC verification for user' })
  approveKyc(@Param('userId') userId: string, @Req() req: any) {
    const adminId = req.user?.id || 'admin-super';
    const ip = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'AdminClient';
    return this.adminService.approveKyc(userId, adminId, ip, userAgent);
  }

  @Get(['properties/pending', 'moderation/properties'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List property listings awaiting administrative review' })
  getPendingProperties() {
    return this.adminService.getPendingProperties();
  }

  @Post(['properties/:id/review', 'moderation/properties/:id/review'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject property listing with audit logging' })
  reviewProperty(@Param('id') propertyId: string, @Req() req: any, @Body() body: any) {
    const adminId = req.user?.id || 'admin-super';
    const decision =
      body?.decision !== undefined ? body.decision : body?.approved ? 'APPROVE' : 'REJECT';
    const note = body?.moderationNote || body?.reason;
    const ip = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'AdminClient';
    return this.adminService.reviewProperty(propertyId, adminId, decision, note, ip, userAgent);
  }

  @Post(['properties/:id/suspend', 'moderation/properties/:id/suspend'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend an active property listing for policy violations' })
  suspendProperty(
    @Param('id') propertyId: string,
    @Req() req: any,
    @Body('reason') reason?: string,
  ) {
    const adminId = req.user?.id || 'admin-super';
    const ip = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'AdminClient';
    return this.adminService.suspendProperty(propertyId, adminId, reason, ip, userAgent);
  }

  @Patch('properties/:propertyId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve property for public listing' })
  approveProperty(@Param('propertyId') propertyId: string, @Req() req: any) {
    const adminId = req.user?.id || 'admin-super';
    return this.adminService.approveProperty(propertyId, adminId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List platform users with optional filters' })
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Put('users/:id/status')
  @Patch('users/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user account status (suspend / reactivate)' })
  updateUserStatus(
    @Param('id') userId: string,
    @Req() req: any,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
    @Body('reason') reason?: string,
  ) {
    const adminId = req.user?.id || 'admin-super';
    const ip = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'AdminClient';
    return this.adminService.updateUserStatus(userId, status, adminId, reason, ip, userAgent);
  }

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query immutable administrative audit logs' })
  getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs(query);
  }
}
