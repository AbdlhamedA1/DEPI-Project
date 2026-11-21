import { z } from 'zod';
import { ReportReason } from '@repo/shared-types';

export const createReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  reportedPropertyId: z.string().uuid().optional(),
  reason: z.nativeEnum(ReportReason, {
    errorMap: () => ({ message: 'سبب الإبلاغ غير صالح' }),
  }),
  description: z
    .string()
    .min(10, 'الوصف يجب أن لا يقل عن 10 أحرف')
    .max(1500, 'الوصف لا يمكن أن يتجاوز 1500 حرف'),
  evidenceUrls: z.array(z.string().url()).default([]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
