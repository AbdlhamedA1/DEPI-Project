import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  secureStorageLocalPath: process.env.SECURE_STORAGE_LOCAL_PATH || './uploads/secure_kyc',
  secureStorageBucket: process.env.SECURE_STORAGE_BUCKET || 'student-housing-kyc-private',
}));
