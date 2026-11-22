import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DatabaseModule } from '../../database/database.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => AdminModule)],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
