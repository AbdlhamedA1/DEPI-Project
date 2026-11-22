import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { VerificationService, ExpressMulterFile } from './verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KycDocumentGuard } from '../../common/guards/kyc-document.guard';
import { SecureStorageService } from '../../common/services/secure-storage.service';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly secureStorageService: SecureStorageService,
  ) {}

  @Get('my-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check current authenticated provider KYC status' })
  getMyStatus(@Req() req: any) {
    return this.verificationService.getKycStatus(req.user?.id);
  }

  @Get('user/:userId/status')
  @ApiOperation({ summary: 'Get KYC verification status for user by ID' })
  getStatus(@Param('userId') userId: string) {
    return this.verificationService.getKycStatus(userId);
  }

  @Post(['documents', 'submit', 'kyc'])
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Upload KYC identity/deed documents to private secure storage' })
  async submitKyc(
    @Req() req: any,
    @Body('userId') bodyUserId?: string,
    @Body('documentType') documentType = 'NATIONAL_ID',
    @Body('documentRefNo') documentRefNo?: string,
    @Body('fileUrl') fileUrl?: string,
    @UploadedFile() file?: ExpressMulterFile,
  ) {
    const userId = req.user?.id || bodyUserId;
    const filePayload = file || fileUrl || 'https://sakany.eg/secure_kyc_placeholder.pdf';
    return this.verificationService.submitKyc(userId, documentType, filePayload, documentRefNo);
  }

  @Get('documents/:id')
  @UseGuards(JwtAuthGuard, KycDocumentGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Securely download/stream private KYC document (Admin or Owner only)' })
  async downloadDocument(@Param('id') docId: string, @Req() req: any, @Res() res: Response) {
    const doc = await this.verificationService.getDocumentById(docId, req.user);
    try {
      const { stream, size } = await this.secureStorageService.getFileStream(doc.filePath);
      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Length', size);
      res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
      stream.pipe(res);
    } catch {
      res.json({ success: true, document: doc });
    }
  }
}
