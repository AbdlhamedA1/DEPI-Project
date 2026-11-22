import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VerificationModule } from '../verification/verification.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [VerificationModule, DatabaseModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
