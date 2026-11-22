import { Module } from '@nestjs/common';
import { AgreementsController } from './agreements.controller';
import { AgreementsService } from './agreements.service';
import { BookingRequestsModule } from '../booking-requests/booking-requests.module';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, BookingRequestsModule, AvailabilityModule, NotificationsModule],
  controllers: [AgreementsController],
  providers: [AgreementsService],
  exports: [AgreementsService],
})
export class AgreementsModule {}
