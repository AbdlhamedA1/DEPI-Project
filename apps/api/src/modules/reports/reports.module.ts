import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AdminModule } from '../admin/admin.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, AdminModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
