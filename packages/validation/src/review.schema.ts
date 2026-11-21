import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingRequestId: z.string().uuid('معرف طلب الحجز غير صالح'),
  rating: z.number().int().min(1, 'التقييم يجب أن يكون بين 1 و 5').max(5),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  locationRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  ownerRating: z.number().int().min(1).max(5).optional(),
  comment: z
    .string()
    .min(10, 'التعليق يجب أن لا يقل عن 10 أحرف')
    .max(1000, 'التعليق لا يمكن أن يتجاوز 1000 حرف'),
});

export const createReviewResponseSchema = z.object({
  comment: z
    .string()
    .min(5, 'الرد يجب أن لا يقل عن 5 أحرف')
    .max(500, 'الرد لا يمكن أن يتجاوز 500 حرف'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateReviewResponseInput = z.infer<typeof createReviewResponseSchema>;
