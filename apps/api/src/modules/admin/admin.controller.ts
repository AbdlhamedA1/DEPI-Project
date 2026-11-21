import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get overview metrics for admin dashboard' })
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Patch('kyc/:userId/approve')
  @ApiOperation({ summary: 'Approve KYC verification for user' })
  approveKyc(@Param('userId') userId: string) {
    return this.adminService.approveKyc(userId);
  }

  @Patch('properties/:propertyId/approve')
  @ApiOperation({ summary: 'Approve property for public listing' })
  approveProperty(@Param('propertyId') propertyId: string) {
    return this.adminService.approveProperty(propertyId);
  }
}
