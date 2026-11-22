import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  adminId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().uuid().optional(),
  from: z
    .string()
    .datetime()
    .optional()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    ),
  to: z
    .string()
    .datetime()
    .optional()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    ),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'], {
    errorMap: () => ({ message: 'حالة الحساب يجب أن تكون ACTIVE أو SUSPENDED' }),
  }),
  reason: z.string().min(3, 'يجب تقديم سبب تغيير الحالة (3 أحرف على الأقل)').max(500).optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const suspendPropertySchema = z.object({
  reason: z.string().min(3, 'يجب توضيح سبب تعليق الإعلان').max(500).optional(),
});

export type SuspendPropertyInput = z.infer<typeof suspendPropertySchema>;

export const adminUserFilterSchema = z.object({
  role: z.enum(['STUDENT', 'OWNER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type AdminUserFilterInput = z.infer<typeof adminUserFilterSchema>;
