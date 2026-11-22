import { z } from 'zod';

export const markNotificationReadSchema = z.object({
  id: z.string().uuid('معرف الإشعار غير صالح'),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
