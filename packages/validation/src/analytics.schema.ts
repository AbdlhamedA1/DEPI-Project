import { z } from 'zod';

export const analyticsExportQuerySchema = z.object({
  reportType: z.enum(['overview', 'users', 'inventory', 'bookings', 'trust-safety', 'audit-logs'], {
    errorMap: () => ({ message: 'نوع التقرير غير صالح' }),
  }),
  format: z
    .enum(['csv', 'json'], {
      errorMap: () => ({ message: 'صيغة التصدير يجب أن تكون csv أو json' }),
    })
    .default('csv'),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AnalyticsExportQueryInput = z.infer<typeof analyticsExportQuerySchema>;

export const pricingTrendsQuerySchema = z.object({
  cityId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  period: z.enum(['30d', '90d', '1y', 'all']).default('30d'),
});

export type PricingTrendsQueryInput = z.infer<typeof pricingTrendsQuerySchema>;
