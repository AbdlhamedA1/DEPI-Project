import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration Loaders
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { storageConfig } from './config/storage.config';
import { mapsConfig } from './config/maps.config';
import { validationConfig } from './config/validation.config';

// Infrastructure Modules
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

// 24 Domain Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { OwnersModule } from './modules/owners/owners.module';
import { UniversitiesModule } from './modules/universities/universities.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UnitsModule } from './modules/units/units.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BedsModule } from './modules/beds/beds.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { SearchModule } from './modules/search/search.module';
import { BookingRequestsModule } from './modules/booking-requests/booking-requests.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { VerificationModule } from './modules/verification/verification.module';
import { SupportModule } from './modules/support/support.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, storageConfig, mapsConfig, validationConfig],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    OwnersModule,
    UniversitiesModule,
    LocationsModule,
    PropertiesModule,
    UnitsModule,
    RoomsModule,
    BedsModule,
    PricingModule,
    AvailabilityModule,
    SearchModule,
    BookingRequestsModule,
    AgreementsModule,
    MessagingModule,
    NotificationsModule,
    ReviewsModule,
    ReportsModule,
    VerificationModule,
    SupportModule,
    AdminModule,
    AnalyticsModule,
    PlatformSettingsModule,
  ],
})
export class AppModule {}
