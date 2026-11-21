import { z } from 'zod';
import {
  PropertyType,
  GenderPolicy,
  PricingUnit,
  DurationUnit,
  AvailabilityStatus,
} from '@repo/shared-types';

export const createLocationSchema = z.object({
  governorate: z.string().min(2, 'المحافظة مطلوبة'),
  city: z.string().min(2, 'المدينة مطلوبة'),
  district: z.string().min(2, 'الحي أو المنطقة مطلوبة'),
  streetName: z.string().optional(),
  buildingNumber: z.string().optional(),
  latitude: z
    .number()
    .min(22, 'خط العرض يجب أن يكون بين 22 و 32 داخل الحدود المصرية')
    .max(32, 'خط العرض يجب أن يكون بين 22 و 32 داخل الحدود المصرية'),
  longitude: z
    .number()
    .min(25, 'خط الطول يجب أن يكون بين 25 و 37 داخل الحدود المصرية')
    .max(37, 'خط الطول يجب أن يكون بين 25 و 37 داخل الحدود المصرية'),
  postalCode: z.string().optional(),
});

export const createPricingSchema = z.object({
  pricingUnit: z.nativeEnum(PricingUnit),
  durationUnit: z.nativeEnum(DurationUnit),
  amount: z.number().positive('السعر يجب أن يكون أكبر من الصفر'),
  depositAmount: z.number().nonnegative('مبلغ التأمين لا يمكن أن يكون بالسالب').default(0),
  utilitiesIncluded: z.boolean().default(false),
  currency: z.string().default('EGP'),
});

export const createBedSchema = z.object({
  bedNumber: z.string().min(1, 'رقم أو كود السرير مطلوب'),
  pricing: createPricingSchema.optional(),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'رقم أو كود الغرفة مطلوب'),
  capacity: z.number().int().min(1, 'سعة الغرفة شخص واحد على الأقل'),
  isPrivate: z.boolean().default(false),
  hasPrivateBathroom: z.boolean().default(false),
  beds: z.array(createBedSchema).optional(),
  pricing: createPricingSchema.optional(),
});

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1, 'رقم الوحدة/الشقة مطلوب'),
  floor: z.number().int().default(1),
  bathroomsCount: z.number().int().min(1).default(1),
  balconiesCount: z.number().int().default(0),
  hasKitchen: z.boolean().default(true),
  rooms: z.array(createRoomSchema).optional(),
  pricing: createPricingSchema.optional(),
});

export const createPropertySchema = z.object({
  titleAr: z.string().min(5, 'العنوان بالعربية يجب ألا يقل عن 5 أحرف').max(150),
  titleEn: z.string().min(5, 'Title in English must be at least 5 chars').max(150),
  descriptionAr: z.string().min(20, 'الوصف بالعربية يجب ألا يقل عن 20 حرف'),
  descriptionEn: z.string().min(20, 'Description in English must be at least 20 chars'),
  propertyType: z.nativeEnum(PropertyType),
  genderPolicy: z.nativeEnum(GenderPolicy),
  location: createLocationSchema,
  primaryUniversityId: z.string().uuid().optional(),
  distanceToUniversityMeters: z.number().nonnegative().optional(),
  amenityKeys: z.array(z.string()).default([]),
  imageUrls: z.array(z.string().url()).min(1, 'يجب رفع صورة واحدة على الأقل'),
  units: z.array(createUnitSchema).optional(),
  defaultPricing: createPricingSchema.optional(),
});

export const searchPropertyFilterSchema = z.object({
  query: z.string().optional(),
  universityId: z.string().uuid().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  genderPolicy: z.nativeEnum(GenderPolicy).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  durationUnit: z.nativeEnum(DurationUnit).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreatePricingInput = z.infer<typeof createPricingSchema>;
export type CreateBedInput = z.infer<typeof createBedSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type SearchPropertyFilterInput = z.infer<typeof searchPropertyFilterSchema>;
