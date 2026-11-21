import { z } from 'zod';
import { BookingStatus, PricingUnit, DurationUnit } from '@repo/shared-types';

export const createBookingRequestSchema = z
  .object({
    propertyId: z.string().uuid('معرف العقار غير صالح'),
    unitId: z.string().uuid('معرف الوحدة غير صالح').optional(),
    roomId: z.string().uuid('معرف الغرفة غير صالح').optional(),
    bedId: z.string().uuid('معرف السرير غير صالح').optional(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    pricingUnit: z.nativeEnum(PricingUnit, {
      errorMap: () => ({ message: 'وحدة التسعير غير صالحة' }),
    }),
    durationUnit: z.nativeEnum(DurationUnit, {
      errorMap: () => ({ message: 'وحدة مدة الإقامة غير صالحة' }),
    }),
    notes: z.string().max(500, 'الملاحظات لا يمكن أن تتجاوز 500 حرف').optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Chronological order validation: endDate must be strictly after startDate
    const startTime = new Date(data.startDate).getTime();
    const endTime = new Date(data.endDate).getTime();

    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تاريخ انتهاء الحجز يجب أن يكون بعد تاريخ البداية',
        path: ['endDate'],
      });
    }

    // 2. Portion targeting validation per business rule BR-BKG-004
    if (data.pricingUnit === PricingUnit.PER_BED && !data.bedId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'معرف السرير (bedId) مطلوب عند اختيار الحجز بنظام السرير',
        path: ['bedId'],
      });
    }

    if (data.pricingUnit === PricingUnit.PER_ROOM && !data.roomId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'معرف الغرفة (roomId) مطلوب عند اختيار الحجز بنظام الغرفة',
        path: ['roomId'],
      });
    }

    if (data.pricingUnit === PricingUnit.PER_UNIT && !data.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'معرف الوحدة (unitId) مطلوب عند اختيار الحجز بنظام الشقة/الوحدة',
        path: ['unitId'],
      });
    }
  });

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    BookingStatus.ACCEPTED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
    BookingStatus.CONFIRMED,
  ]),
  reason: z.string().max(500).optional(),
});

export const confirmAgreementSchema = z.object({
  bookingRequestId: z.string().uuid('معرف طلب الحجز غير صالح'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'يجب الموافقة على الشروط والأحكام' }),
  }),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type ConfirmAgreementInput = z.infer<typeof confirmAgreementSchema>;
