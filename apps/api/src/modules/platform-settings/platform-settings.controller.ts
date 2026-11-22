import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@repo/shared-types';

@ApiTags('Platform Settings')
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(private readonly platformSettingsService: PlatformSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get global platform settings' })
  getSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update global platform settings' })
  updateSettings(@Body() body: any, @Req() req: any) {
    const adminId = req?.user?.id || 'admin-super';
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'AdminClient';
    return this.platformSettingsService.updateSettings(body, adminId, ip, userAgent);
  }
}
