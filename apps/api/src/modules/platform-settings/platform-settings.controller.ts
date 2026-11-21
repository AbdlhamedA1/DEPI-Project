import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';

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
  @ApiOperation({ summary: 'Update global platform settings' })
  updateSettings(@Body() body: any) {
    return this.platformSettingsService.updateSettings(body);
  }
}
