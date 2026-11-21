import { z } from 'zod';
import { UserRole, ProviderType, Gender } from '@repo/shared-types';

export const egyptianPhoneRegex = /^(\+20|0)?(10|11|12|15)\d{8}$/;
export const nationalIdRegex = /^\d{14}$/;

export const loginSchema = z
  .object({
    phoneNumber: z
      .string()
      .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح (مثال: 01012345678)')
      .optional(),
    phone: z
      .string()
      .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح (مثال: 01012345678)')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.phoneNumber && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رقم الهاتف يجب أن يكون رقم مصري صحيح (مثال: 01012345678)',
        path: ['phone'],
      });
    }
  });

export const verifyOtpSchema = z
  .object({
    phoneNumber: z
      .string()
      .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح')
      .optional(),
    phone: z.string().regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح').optional(),
    otpCode: z
      .string()
      .length(6, 'رمز التحقق يجب أن يتكون من 6 أرقام')
      .regex(/^\d+$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط')
      .optional(),
    code: z
      .string()
      .length(6, 'رمز التحقق يجب أن يتكون من 6 أرقام')
      .regex(/^\d+$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.phoneNumber && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رقم الهاتف مطلوب',
        path: ['phone'],
      });
    }
    if (!data.otpCode && !data.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رمز التحقق مطلوب',
        path: ['code'],
      });
    }
  });

export const registerStudentSchema = z
  .object({
    phoneNumber: z
      .string()
      .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح')
      .optional(),
    phone: z.string().regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح').optional(),
    fullName: z
      .string()
      .min(3, 'الاسم بالكامل يجب أن لا يقل عن 3 أحرف')
      .max(100, 'الاسم بالكامل طويل جداً'),
    gender: z.nativeEnum(Gender, {
      errorMap: () => ({ message: 'يجب اختيار النوع (ذكر أو أنثى)' }),
    }),
    universityId: z.string().uuid('معرف الجامعة غير صالح'),
    faculty: z.string().min(2, 'اسم الكلية مطلوب'),
    academicYear: z
      .number()
      .int()
      .min(1, 'السنة الدراسية يجب أن تكون 1 على الأقل')
      .max(7, 'السنة الدراسية غير صالحة'),
    nationalIdNumber: z
      .string()
      .regex(nationalIdRegex, 'الرقم القومي يجب أن يتكون من 14 رقم')
      .optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z
      .string()
      .regex(egyptianPhoneRegex, 'رقم هاتف الطوارئ غير صالح')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.phoneNumber && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رقم الهاتف مطلوب',
        path: ['phone'],
      });
    }
  });

export const registerOwnerSchema = z
  .object({
    phoneNumber: z
      .string()
      .regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح')
      .optional(),
    phone: z.string().regex(egyptianPhoneRegex, 'رقم الهاتف يجب أن يكون رقم مصري صحيح').optional(),
    fullName: z
      .string()
      .min(3, 'الاسم بالكامل يجب أن لا يقل عن 3 أحرف')
      .max(100, 'الاسم بالكامل طويل جداً'),
    providerType: z.nativeEnum(ProviderType, {
      errorMap: () => ({ message: 'نوع المؤجر غير صالح' }),
    }),
    nationalIdNumber: z
      .string()
      .regex(nationalIdRegex, 'الرقم القومي يجب أن يتكون من 14 رقم')
      .optional(),
    commercialRegistrationNumber: z.string().optional(),
    taxNumber: z.string().optional(),
    companyName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.phoneNumber && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رقم الهاتف مطلوب',
        path: ['phone'],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;
