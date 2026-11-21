import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformSettingsService {
  private settings = {
    otpExpiryMinutes: 5,
    otpMaxAttempts: 3,
    maintenanceMode: false,
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
  };

  async getSettings() {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }
}
