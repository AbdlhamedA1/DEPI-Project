# API Error Handling Architecture & Domain Error Catalog

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب)
- **Specification Document**: Phase 3 Technical Design & API Specifications
- **Document Path**: `docs/api/error-handling.md`
- **Standard Envelope**: `ApiErrorResponse`
- **Global Filter**: `AllExceptionsFilter`

---

## 1. Standard Error Response Envelope (`ApiErrorResponse`)

Whenever an HTTP request fails across any API endpoint (HTTP `4xx` client errors or `5xx` server errors), the NestJS backend intercepts the exception and formats the payload into a strictly typed, uniform JSON envelope.

### 1.1 TypeScript Schema Definition

```typescript
export interface ValidationErrorDetail {
  field: string;
  issue: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  errorCode: string;
  message: string;
  details?: ValidationErrorDetail[];
  timestamp: string; // ISO 8601 UTC
}
```

### 1.2 JSON Envelope Examples

#### Standard Domain Error:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "errorCode": "ERR_MAX_OPEN_REQUESTS_REACHED",
  "message": "لا يمكن للطالب فتح أكثر من 3 طلبات حجز نشطة في نفس الوقت",
  "timestamp": "2026-11-20T23:58:00.000Z"
}
```

#### Input Validation Failure (`422 Unprocessable Entity`):

```json
{
  "success": false,
  "statusCode": 422,
  "error": "UNPROCESSABLE_ENTITY",
  "errorCode": "ERR_VALIDATION_FAILED",
  "message": "فشل التحقق من صحة البيانات المدخلة",
  "details": [
    {
      "field": "phone",
      "issue": "رقم الهاتف غير صحيح. يجب إدخال رقم محمول مصري صحيح يبدأ بـ 01"
    },
    {
      "field": "amount",
      "issue": "يجب أن تكون قيمة الإيجار أكبر من صفر جنيه مصري"
    }
  ],
  "timestamp": "2026-11-20T23:58:00.000Z"
}
```

---

## 2. HTTP Status Code Mapping Standards

| HTTP Status                 | Standard Description                                  | Platform Trigger & Typical Scenarios                                                                                                             |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `400 Bad Request`           | Malformed syntax or invalid business state transition | Exceeding 3 open requests; cancelling confirmed booking; invalid OTP code format.                                                                |
| `401 Unauthorized`          | Missing or invalid authentication token               | Missing `Authorization: Bearer` header; expired JWT access token; signature verification failure.                                                |
| `403 Forbidden`             | Authenticated user lacks authorization                | Student attempting to call owner endpoints; unverified owner attempting to create listings; user trying to read another user's private messages. |
| `404 Not Found`             | Target resource does not exist                        | Invalid property ID; non-existent booking request UUID; area not found in specified city.                                                        |
| `409 Conflict`              | Unique constraint violation or concurrency collision  | Phone number already registered; accommodation portion already confirmed by another tenant; duplicate review submission.                         |
| `422 Unprocessable Entity`  | Schema or semantic validation failure                 | Malformed Egyptian phone format; negative pricing amounts; end date preceding start date.                                                        |
| `429 Too Many Requests`     | Rate limit or throttling threshold exceeded           | Exceeding 3 OTP requests in 15 minutes; exceeding 5 password login attempts in 15 minutes.                                                       |
| `500 Internal Server Error` | Unexpected server or database exception               | Uncaught database exception; storage provider failure; unhandled runtime error.                                                                  |

---

## 3. Bilingual Domain Error Catalog

The catalog below defines the canonical error codes across all 24 modules, mapped to their HTTP status codes, standard English explanations, and natural Egyptian Arabic localized messages.

| Error Code                            | HTTP Status | English Description                     | Egyptian Arabic Localized Message (عربي مصري)                          |
| ------------------------------------- | ----------- | --------------------------------------- | ---------------------------------------------------------------------- |
| **Identity & Authentication**         |             |                                         |                                                                        |
| `ERR_INVALID_PHONE_NUMBER`            | `422`       | Invalid Egyptian phone number format    | رقم الهاتف غير صحيح. لازم تدخل رقم محمول مصري صحيح يبدأ بـ 01          |
| `ERR_PHONE_ALREADY_REGISTERED`        | `409`       | Phone number is already in use          | رقم الهاتف مسجل بالفعل في حساب تاني                                    |
| `ERR_EMAIL_ALREADY_REGISTERED`        | `409`       | Email address is already in use         | البريد الإلكتروني مسجل بالفعل بحساب آخر                                |
| `ERR_INVALID_CREDENTIALS`             | `401`       | Incorrect phone/email or password       | رقم الهاتف أو كلمة المرور غير صحيحة                                    |
| `ERR_OTP_INVALID_OR_EXPIRED`          | `400`       | OTP code is incorrect or expired        | كود التحقق غير صحيح أو انتهت صلاحيته. اطلب كود جديد                    |
| `ERR_OTP_COOLDOWN_ACTIVE`             | `429`       | Resend cooldown is active               | برجاء الانتظار دقيقة واحدة قبل طلب كود جديد                            |
| `ERR_OTP_RATE_LIMIT_EXCEEDED`         | `429`       | Too many OTP requests                   | عديت الحد المسموح به من المحاولات. برجاء الانتظار 15 دقيقة             |
| `ERR_ACCOUNT_SUSPENDED`               | `403`       | User account is suspended               | الحساب موقوف حالياً من إدارة المنصة. تواصل مع الدعم الفني               |
| `ERR_ACCOUNT_DEACTIVATED`             | `403`       | User account is deactivated             | الحساب ملغي وموقوف عن العمل                                            |
| **Student Domain**                    |             |                                         |                                                                        |
| `ERR_UNIVERSITY_REQUIRED`             | `422`       | University affiliation is required      | لازم تختار الجامعة المقيد بها الطالب                                   |
| `ERR_STUDENT_PROFILE_NOT_FOUND`       | `404`       | Student profile does not exist          | الملف الشخصي للطالب غير موجود                                          |
| **Provider & Verification Domain**    |             |                                         |                                                                        |
| `ERR_PROVIDER_NOT_VERIFIED`           | `403`       | Provider account is not verified        | مينفعش تنشر عقارات قبل ما إدارة المنصة تراجع وثائق الهوية وتأكد الحساب |
| `ERR_KYC_DOCUMENT_REQUIRED`           | `422`       | Verification document file is required  | برجاء رفع صورة واضحة لبطاقة الرقم القومي أو إثبات الملكية              |
| `ERR_INVALID_FILE_TYPE`               | `422`       | Unsupported file format                 | نوع الملف غير مدعوم. المسموح به صور (JPG, PNG) أو ملفات PDF فقط        |
| `ERR_FILE_SIZE_EXCEEDED`              | `422`       | File size exceeds limit (max 10MB)      | حجم الملف أكبر من الحد الأقصى المسموح به (10 ميجابايت)                 |
| **Listing & Inventory Domain**        |             |                                         |                                                                        |
| `ERR_PROPERTY_NOT_FOUND`              | `404`       | Property listing not found              | العقار المطلوب غير موجود أو تم حذفه                                    |
| `ERR_PROPERTY_NOT_PUBLISHED`          | `403`       | Property is not publicly available      | العقار غير منشور حالياً أو قيد المراجعة                                 |
| `ERR_UNIT_NOT_FOUND`                  | `404`       | Unit not found in property              | الوحدة السكنية المطلوبة غير مسجلة                                      |
| `ERR_ROOM_NOT_FOUND`                  | `404`       | Room not found in unit                  | الغرفة المطلوبة غير موجودة                                             |
| `ERR_BED_NOT_FOUND`                   | `404`       | Bed not found in room                   | السرير المطلوب غير موجود                                               |
| `ERR_INVALID_PRICE_AMOUNT`            | `422`       | Rent amount must be greater than zero   | لازم سعر الإيجار يكون أكبر من صفر جنيه مصري                            |
| `ERR_PILOT_LISTING_LIMIT_REACHED`     | `403`       | Free listing allowance exceeded         | استنفدت الحد المسموح به من الإعلانات المجانية خلال المرحلة التجريبية   |
| **Booking & Availability Invariants** |             |                                         |                                                                        |
| `ERR_MAX_OPEN_REQUESTS_REACHED`       | `400`       | Maximum 3 open requests allowed         | مينفعش تفتح أكتر من 3 طلبات حجز نشطة في نفس الوقت                      |
| `ERR_STUDENT_HAS_CONFIRMED_BOOKING`   | `409`       | Student already has a confirmed booking | مينفعش تأكد حجز جديد عشان عندك حجز مؤكد بالفعل                         |
| `ERR_PORTION_ALREADY_BOOKED`          | `409`       | Accommodation portion is already booked | السكن ده تم حجزه بالفعل ومبقاش متاح                                    |
| `ERR_INVALID_MOVE_IN_DATE`            | `422`       | Move-in date cannot be in the past      | تاريخ السكن مينفعش يكون في الماضي                                      |
| `ERR_REQUEST_NOT_PENDING`             | `400`       | Booking request is no longer pending    | الطلب ده مبقاش معلق ومينفعش تعديل حالته                                |
| `ERR_CANNOT_CANCEL_CONFIRMED`         | `400`       | Confirmed bookings cannot be cancelled  | مينفعش إلغاء الحجز بعد تأكيده رسمياً بين الطرفين                        |
| **Agreement Domain**                  |             |                                         |                                                                        |
| `ERR_AGREEMENT_NOT_FOUND`             | `404`       | Agreement confirmation record not found | بيانات الاتفاق غير موجودة                                              |
| `ERR_TERMS_NOT_ACCEPTED`              | `422`       | Agreement terms must be accepted        | لازم توافق على شروط وأحكام الاتفاق للمتابعة                            |
| `ERR_AGREEMENT_ALREADY_CONFIRMED`     | `400`       | Agreement has already been confirmed    | تم تأكيد هذا الاتفاق مسبقاً                                             |
| **Messaging Domain**                  |             |                                         |                                                                        |
| `ERR_CONVERSATION_NOT_FOUND`          | `404`       | Conversation thread not found           | المحادثة المطلوبة غير موجودة                                           |
| `ERR_UNAUTHORIZED_CHAT_ACCESS`        | `403`       | You are not a participant in this chat  | مفيش صلاحية للدخول على المحادثة دي                                     |
| `ERR_EMPTY_MESSAGE_BODY`              | `422`       | Message body cannot be empty            | مينفعش تبعت رسالة فاضية                                                |
| **Reviews & Trust Domain**            |             |                                         |                                                                        |
| `ERR_REVIEW_INELIGIBLE`               | `403`       | Review requires a confirmed booking     | التقييم متاح فقط بعد إتمام حجز مؤكد                                    |
| `ERR_DUPLICATE_REVIEW`                | `409`       | Review already submitted for booking    | بعت تقييمك للحجز ده قبل كده                                            |
| `ERR_REVIEW_RESPONSE_EXISTS`          | `409`       | Response already submitted              | مسموح بالرد على التقييم مرة واحدة فقط                                  |
| `ERR_INVALID_RATING_VALUE`            | `422`       | Rating must be between 1 and 5          | التقييم لازم يكون من 1 إلى 5 نجوم                                      |
| **Governance & System Domain**        |             |                                         |                                                                        |
| `ERR_IMMUTABLE_LOG_MODIFICATION`      | `403`       | Audit logs cannot be modified           | سجل العمليات الإدارية غير قابل للتعديل أو الحذف نهائياً                 |
| `ERR_SETTING_NOT_FOUND`               | `404`       | Platform setting key not found          | إعداد النظام المطلوب غير مسجل                                          |
| `ERR_INTERNAL_SERVER_ERROR`           | `500`       | Unexpected internal server error        | حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً                       |

---

## 4. NestJS Global Exception Filter Architecture

The global exception filter (`apps/api/src/common/filters/all-exceptions.filter.ts`) intercepts all exceptions emitted by controllers, guards, and services across all 24 modules.

### 4.1 Implementation Architecture

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ValidationErrorDetail } from '@sakany/shared-types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Resolve Language Preference
    const acceptLanguage = request.headers['accept-language'] || 'ar-EG';
    const isArabic = !acceptLanguage.toLowerCase().startsWith('en');

    // 2. Resolve HTTP Status and Error Metadata
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_SERVER_ERROR';
    let errorCode = 'ERR_INTERNAL_SERVER_ERROR';
    let message = isArabic
      ? 'حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً'
      : 'An unexpected internal server error occurred. Please try again later.';
    let details: ValidationErrorDetail[] | undefined = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        error = resObj.error || exception.name;
        errorCode = resObj.errorCode || `ERR_${error.toUpperCase()}`;
        message = resObj.message || message;
        details = resObj.details;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[Unhandled Exception] ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    // 3. Assemble Standard ApiErrorResponse Envelope
    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      error,
      errorCode,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
    };

    // 4. Secure Production Response (Stack traces stripped)
    response.status(statusCode).json(errorResponse);
  }
}
```

### 4.2 Error Handling Pipeline Guarantees

1. **Zero Leaked Stack Traces**: Raw database exceptions, query syntax errors, and file system paths are never exposed to clients in production environments.
2. **Deterministic Error Codes**: Client applications rely on stable string `errorCode` identifiers (e.g. `ERR_MAX_OPEN_REQUESTS_REACHED`) rather than string-matching error messages.
3. **Seamless Localization**: Responses automatically return Egyptian Arabic when `Accept-Language` defaults to `ar-EG`, ensuring native user experience for Egyptian university students.
