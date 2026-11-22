import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface SavedFileResult {
  storedFileName: string;
  originalFileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class SecureStorageService {
  private readonly logger = new Logger(SecureStorageService.name);
  private readonly basePath: string;

  constructor() {
    this.basePath =
      process.env.SECURE_STORAGE_LOCAL_PATH || path.resolve(process.cwd(), 'uploads/secure_kyc');
    this.ensureDirectoryExists(this.basePath);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        this.logger.log(`Created private KYC secure storage directory: ${dirPath}`);
      } catch (err: any) {
        this.logger.error(`Failed to create secure storage directory: ${err.message}`);
      }
    }
  }

  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subFolder = 'documents',
  ): Promise<SavedFileResult> {
    try {
      const targetDir = path.join(this.basePath, subFolder);
      this.ensureDirectoryExists(targetDir);

      const ext = path.extname(originalName) || '.bin';
      const storedFileName = `${randomUUID()}${ext}`;
      const fullPath = path.join(targetDir, storedFileName);

      await fs.promises.writeFile(fullPath, fileBuffer);

      return {
        storedFileName,
        originalFileName: originalName,
        filePath: fullPath,
        mimeType,
        sizeBytes: fileBuffer.length,
      };
    } catch (err: any) {
      this.logger.error(`Error saving secure file: ${err.message}`, err.stack);
      throw new InternalServerErrorException('فشل في حفظ المستند في وحدة التخزين الآمنة');
    }
  }

  async getFileStream(filePath: string): Promise<{ stream: fs.ReadStream; size: number }> {
    if (!fs.existsSync(filePath)) {
      throw new InternalServerErrorException('الملف المطلوب غير موجود في وحدة التخزين الآمنة');
    }
    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);
    return { stream, size: stat.size };
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err: any) {
      this.logger.warn(`Failed to delete secure file ${filePath}: ${err.message}`);
      return false;
    }
  }
}
