import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { SecureStorageService } from '../../common/services/secure-storage.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VerificationController],
  providers: [VerificationService, SecureStorageService],
  exports: [VerificationService, SecureStorageService],
})
export class VerificationModule {}
