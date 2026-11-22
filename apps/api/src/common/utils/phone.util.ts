import { BadRequestException } from '@nestjs/common';

/**
 * Normalizes any Egyptian mobile number to canonical E.164 format (+201XXXXXXXXX).
 * Valid Egyptian mobile network prefixes:
 * - 010 (Vodafone)
 * - 011 (Etisalat)
 * - 012 (Orange)
 * - 015 (Telecom Egypt / WE)
 */
export function normalizeEgyptianPhone(phone: string): string {
  if (!phone) {
    throw new BadRequestException('رقم الهاتف مطلوب');
  }

  // Remove whitespace, dashes, dots, parentheses
  let cleaned = phone.trim().replace(/[\s.()-]/g, '');

  // If starts with 002, replace with +2
  if (cleaned.startsWith('002')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // If starts with 01[0125] followed by 8 digits
  if (/^01[0125]\d{8}$/.test(cleaned)) {
    return '+2' + cleaned;
  }

  // If starts with 201[0125] followed by 8 digits
  if (/^201[0125]\d{8}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // If starts with +201[0125] followed by 8 digits
  if (/^\+201[0125]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // If starts with 1[0125] followed by 8 digits
  if (/^1[0125]\d{8}$/.test(cleaned)) {
    return '+20' + cleaned;
  }

  throw new BadRequestException(
    'رقم الهاتف غير صالح، يجب أن يكون رقماً مصرياً صحيحاً (010, 011, 012, 015)',
  );
}
