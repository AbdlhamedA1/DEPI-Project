import { Module, forwardRef } from '@nestjs/common';
import { BookingRequestsController } from './booking-requests.controller';
import { BookingRequestsService } from './booking-requests.service';
import { AvailabilityModule } from '../availability/availability.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../../database/database.module';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    DatabaseModule,
    AvailabilityModule,
    MessagingModule,
    NotificationsModule,
    forwardRef(() => PropertiesModule),
  ],
  controllers: [BookingRequestsController],
  providers: [BookingRequestsService],
  exports: [BookingRequestsService],
})
export class BookingRequestsModule {}
