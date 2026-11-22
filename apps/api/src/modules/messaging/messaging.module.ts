import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
