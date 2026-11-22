import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { SecureStorageService } from '../../common/services/secure-storage.service';
import { AuthService } from '../auth/auth.service';

export interface ExpressMulterFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size?: number;
  buffer?: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface KycDocumentRecord {
  id: string;
  userId: string;
  documentType: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentRefNo?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly inMemoryDocuments: KycDocumentRecord[] = [];

  constructor(
    private readonly secureStorageService: SecureStorageService,
    private readonly authService: AuthService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async submitKyc(
    userId: string,
    documentType: string,
    fileOrUrl: ExpressMulterFile | string,
    documentRefNo?: string,
  ) {
    let filePath = '';
    let fileName = 'document.pdf';
    let mimeType = 'application/pdf';
    let fileSizeBytes = 1024;

    if (typeof fileOrUrl === 'object' && fileOrUrl.buffer) {
      const saved = await this.secureStorageService.saveFile(
        fileOrUrl.buffer,
        fileOrUrl.originalname,
        fileOrUrl.mimetype,
        `kyc/${userId}`,
      );
      filePath = saved.filePath;
      fileName = saved.originalFileName;
      mimeType = saved.mimeType;
      fileSizeBytes = saved.sizeBytes;
    } else if (typeof fileOrUrl === 'string') {
      filePath = fileOrUrl;
      fileName = fileOrUrl.split('/').pop() || 'document.pdf';
    }

    const docId = randomUUID();
    const now = new Date();

    const record: KycDocumentRecord = {
      id: docId,
      userId,
      documentType,
      filePath,
      fileName,
      mimeType,
      fileSizeBytes,
      documentRefNo,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    this.inMemoryDocuments.push(record);

    // Update user status to PENDING
    this.authService.updateUser(userId, { verificationStatus: 'PENDING' });

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO kyc_documents (id, user_id, document_type, file_path, file_name, mime_type, file_size_bytes, document_ref_no, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            docId,
            userId,
            documentType,
            filePath,
            fileName,
            mimeType,
            fileSizeBytes,
            documentRefNo || null,
            'PENDING',
            now,
            now,
          ],
        );

        await this.pool.query(
          `UPDATE owner_profiles SET verification_status = 'PENDING' WHERE user_id = $1`,
          [userId],
        );
      } catch (err: any) {
        this.logger.warn(`Could not save KYC document to DB: ${err.message}`);
      }
    }

    return {
      success: true,
      data: {
        id: docId,
        documentType,
        status: 'PENDING',
        submittedAt: now.toISOString(),
      },
      id: docId,
      userId,
      documentType,
      status: 'PENDING',
      submittedAt: now.toISOString(),
    };
  }

  async getKycStatus(userId: string) {
    const user = await this.authService.findUserById(userId);
    const docs = this.inMemoryDocuments.filter(d => d.userId === userId);

    const isVerified = user?.verificationStatus === 'VERIFIED';

    return {
      userId,
      isVerified,
      status: user?.verificationStatus || (isVerified ? 'VERIFIED' : 'UNVERIFIED'),
      verificationStatus: user?.verificationStatus || (isVerified ? 'VERIFIED' : 'UNVERIFIED'),
      documents: docs.map(d => ({
        id: d.id,
        documentType: d.documentType,
        fileName: d.fileName,
        status: d.status,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }

  async getDocumentById(docId: string, requestingUser: { id: string; role: string }) {
    const doc = this.inMemoryDocuments.find(d => d.id === docId);
    if (!doc) throw new NotFoundException('الوثيقة غير موجودة');

    if (requestingUser.role !== 'ADMIN' && doc.userId !== requestingUser.id) {
      throw new ForbiddenException('غير مصرح لك بتحميل هذه الوثيقة');
    }

    return doc;
  }

  getAllPending() {
    return this.inMemoryDocuments.filter(d => d.status === 'PENDING');
  }

  updateDocumentStatus(
    docId: string,
    status: 'APPROVED' | 'REJECTED',
    adminId: string,
    rejectionReason?: string,
  ) {
    const doc = this.inMemoryDocuments.find(d => d.id === docId);
    if (!doc) throw new NotFoundException('الوثيقة غير موجودة');

    doc.status = status;
    doc.reviewedBy = adminId;
    doc.reviewedAt = new Date();
    doc.rejectionReason = rejectionReason;
    doc.updatedAt = new Date();

    // Check if owner has all required docs approved
    if (status === 'APPROVED') {
      this.authService.updateUser(doc.userId, {
        verificationStatus: 'VERIFIED',
        isIdVerified: true,
      });
    } else if (status === 'REJECTED') {
      this.authService.updateUser(doc.userId, {
        verificationStatus: 'REJECTED',
      });
    }

    return doc;
  }
}
