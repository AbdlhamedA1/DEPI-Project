import { Injectable, Inject, Optional, forwardRef, Logger } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);

  private settings = {
    otpExpiryMinutes: 5,
    otpMaxAttempts: 3,
    maintenanceMode: false,
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
    maxActiveBookingsPerStudent: 3,
    bookingExpirationHours: 48,
    supportPhone: '+201000000000',
    supportEmail: 'support@studenthousing.eg',
  };

  constructor(
    @Optional()
    @Inject(forwardRef(() => AdminService))
    private readonly adminService?: AdminService,
  ) {}

  async getSettings() {
    return this.settings;
  }

  async updateSettings(
    newSettings: Partial<typeof this.settings>,
    adminId = 'admin-super',
    ipAddress = '127.0.0.1',
    userAgent = 'AdminPortal',
  ) {
    const previous = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    if (this.adminService) {
      try {
        await this.adminService.logAdminAction(
          adminId,
          'PLATFORM_SETTING_UPDATE',
          'PLATFORM_SETTING',
          'global',
          {
            previous,
            updated: newSettings,
            updatedKeys: Object.keys(newSettings),
          },
          ipAddress,
          userAgent,
          'PLATFORM_SETTING_UPDATED',
          'PLATFORM_SETTING',
          previous,
          this.settings,
        );
      } catch (err: any) {
        this.logger.warn(`Could not log platform settings update: ${err.message}`);
      }
    }

    return this.settings;
  }
}
