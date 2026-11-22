import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { BookingRequestsModule } from '../booking-requests/booking-requests.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, BookingRequestsModule, NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
