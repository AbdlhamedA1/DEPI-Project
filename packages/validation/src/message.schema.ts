import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z
    .string({ required_error: 'نص الرسالة مطلوب' })
    .trim()
    .min(1, 'نص الرسالة لا يمكن أن يكون فارغاً')
    .max(5000, 'نص الرسالة لا يمكن أن يتجاوز 5000 حرف'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
