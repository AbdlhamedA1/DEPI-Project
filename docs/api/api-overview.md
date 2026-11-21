# REST API Overview & Protocol Architecture

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب)
- **Specification Document**: Phase 3 Technical Design & API Specifications
- **Document Path**: `docs/api/api-overview.md`
- **Framework**: Node.js 20+ / NestJS Modular Monolith
- **Base URL**: `/api/v1`

---

## 1. REST Architecture Conventions

The Sakany backend API adheres strictly to RESTful principles over HTTP/1.1 and HTTP/2. All requests and responses are exchanged using standard JSON payloads, unless explicitly documented for multipart file uploads.

### 1.1 Base URL & Environment Addressing

- **Local Development**: `http://localhost:4000/api/v1`
- **Staging Environment**: `https://staging-api.sakany.eg/api/v1`
- **Production Environment**: `https://api.sakany.eg/api/v1`

All requests must use TLS/HTTPS in non-local environments. Unencrypted HTTP traffic to staging and production endpoints is permanently redirected with `301 Moved Permanently`.

### 1.2 HTTP Methods Standard

| Verb     | Usage                                                                      | Idempotent | Body Allowed | Typical Status Code          |
| -------- | -------------------------------------------------------------------------- | ---------- | ------------ | ---------------------------- |
| `GET`    | Retrieve resource representation or paginated collection                   | Yes        | No           | `200 OK`                     |
| `POST`   | Create a new entity, trigger a state mutation, or execute RPC-style action | No         | Yes          | `201 Created` or `200 OK`    |
| `PUT`    | Update an entire resource or replace an existing entity state              | Yes        | Yes          | `200 OK`                     |
| `DELETE` | Remove or soft-archive a resource                                          | Yes        | No           | `200 OK` or `204 No Content` |

### 1.3 Standard Request Headers

```http
Content-Type: application/json; charset=utf-8
Accept: application/json
Accept-Language: ar-EG, ar;q=0.9, en-US;q=0.8
Authorization: Bearer <jwt_access_token>
```

---

## 2. Authentication & Authorization

Authentication is stateless and powered by JSON Web Tokens (JWT). All authenticated endpoints require a valid Bearer token in the `Authorization` request header.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.1 Token Lifecycle

- **Access Token**: Short-lived JWT (lifetime: 15 minutes). Contains user `id`, `role`, and verification claims.
- **Refresh Token**: Long-lived token (lifetime: 7 days) stored securely in an `HttpOnly`, `SameSite=Lax` cookie or returned in the login payload for native apps.
- **Refresh Flow**: When the access token expires (`401 Unauthorized`), the client calls `POST /api/v1/auth/refresh-token` with the refresh token to receive a new 15-minute access token without re-authenticating.

### 2.2 Role-Based Access Control (RBAC)

User permissions are enforced at the NestJS controller and route level using custom `@Roles()` decorators and `RolesGuard`:

- `STUDENT`: Access to search, booking submission, student profile, student agreements, tenant messaging tray.
- `OWNER`: Access to listing management, unit/room/bed inventory, KYC submissions, provider incoming requests, provider agreements.
- `ADMIN`: Access to platform administration, KYC reviews, listing moderation, user management, audit logs, analytics, platform settings.

### 2.3 Resource Ownership Guards

For endpoints accessing tenant-specific or provider-specific data (e.g. `PUT /api/v1/properties/:id`, `GET /api/v1/booking-requests/:id`), NestJS `OwnershipGuard` verifies that the `req.user.id` matches the owning entity or that the user possesses the `ADMIN` role. Unauthorized attempts return `403 Forbidden`.

---

## 3. Standard Response Envelopes

To ensure complete consistency for frontend consumers (`apps/web`), all backend endpoints wrap their responses in standardized TypeScript envelopes.

### 3.1 Standard Success Envelope (`ApiResponse<T>`)

Used for single resource retrieval, creation, and state mutation operations.

#### TypeScript Interface:

```typescript
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string; // ISO 8601 UTC
}
```

#### JSON Example:

```json
{
  "success": true,
  "data": {
    "id": "c1f7a2d8-912b-4d43-9831-7b794f9b8721",
    "titleAr": "شقة مفروشة بالقرب من جامعة القاهرة",
    "titleEn": "Furnished Apartment near Cairo University",
    "propertyType": "APARTMENT",
    "approvalStatus": "PUBLISHED"
  },
  "message": "تم استرجاع تفاصيل العقار بنجاح",
  "timestamp": "2026-11-20T23:58:00.000Z"
}
```

---

### 3.2 Standard Paginated Envelope (`PaginatedResponse<T>`)

Used for endpoints returning collections, search results, message history, and audit logs.

#### TypeScript Interface:

```typescript
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  timestamp: string; // ISO 8601 UTC
}
```

#### JSON Example:

```json
{
  "success": true,
  "data": [
    {
      "id": "c1f7a2d8-912b-4d43-9831-7b794f9b8721",
      "title": "شقة مفروشة بالدقي",
      "price": 3500.0,
      "cityName": "الجيزة",
      "areaName": "الدقي"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-11-20T23:58:00.000Z"
}
```

---

### 3.3 Standard Error Envelope (`ApiErrorResponse`)

Returned whenever an HTTP request fails (`4xx` or `5xx`). Intercepted and shaped globally by `AllExceptionsFilter`.

#### TypeScript Interface:

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

#### JSON Example:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "errorCode": "ERR_MAX_OPEN_REQUESTS_REACHED",
  "message": "لا يمكن للطالب فتح أكثر من 3 طلبات حجز نشطة في نفس الوقت",
  "details": [
    {
      "field": "studentId",
      "issue": "Student already holds 3 pending/accepted requests"
    }
  ],
  "timestamp": "2026-11-20T23:58:00.000Z"
}
```

---

## 4. Query Parameters, Pagination & Sorting

All collection endpoints support standardized query parameters for pagination, sorting, and field filtering:

### 4.1 Pagination Parameters

- `page`: 1-based page index (Type: `number`, Default: `1`, Minimum: `1`).
- `limit`: Number of items per page (Type: `number`, Default: `20`, Maximum: `100`).

### 4.2 Sorting Parameters

- `sortBy`: Field name to order by (e.g., `createdAt`, `price`, `distanceToUniversityKm`, `lastMessageAt`). Default is `createdAt`.
- `sortOrder`: Sorting direction. Either `ASC` (ascending) or `DESC` (descending). Default is `DESC`.

### 4.3 Date Representation

All timestamps exchanged across API query parameters and JSON payloads must use ISO 8601 Extended Format in UTC:
`YYYY-MM-DDTHH:mm:ss.sssZ` (e.g. `2026-11-20T23:58:00.000Z`).
Date-only fields (such as move-in dates) use `YYYY-MM-DD` (e.g. `2026-09-01`).

---

## 5. Internationalization & Localization (i18n)

The platform natively supports Arabic (`ar-EG`) as the primary language and English (`en-US`) as secondary.

### 5.1 Language Header Negotiation

Clients pass the `Accept-Language` header to determine the language for error messages, automated notifications, and transactional emails:

- `Accept-Language: ar-EG` (Default Egyptian Arabic)
- `Accept-Language: en-US` (English)

If the header is omitted, the API defaults to Egyptian Arabic (`ar-EG`).

### 5.2 Content Localization

Bilingual entities (`Property`, `City`, `Area`, `University`) store both languages in the database (`title_ar`, `title_en`, etc.). The API returns both localized fields in responses, allowing the frontend client to render according to the user's active locale switch without extra round-trips.

---

## 6. Rate Limiting & Throttling Rules

To safeguard platform availability against denial-of-service and brute-force attacks, NestJS Throttler guards enforce tiered rate limits:

| Endpoint Scope                                                               | Limit        | Window     | Purpose                                              |
| ---------------------------------------------------------------------------- | ------------ | ---------- | ---------------------------------------------------- |
| OTP Requests (`/api/v1/auth/student/register`, `/verify-otp`, `/resend-otp`) | 3 requests   | 15 minutes | Prevent SMS gateway toll fraud and OTP brute-forcing |
| Password Authentication (`/api/v1/auth/login`)                               | 5 attempts   | 15 minutes | Prevent credential brute-forcing                     |
| Standard Authenticated Endpoints                                             | 300 requests | 1 minute   | General user session protection                      |
| Public Endpoints (`/api/v1/search`, `/properties`, `/locations`)             | 100 requests | 1 minute   | Prevent web scraping & server saturation             |

When a rate limit is exceeded, the server responds with HTTP `429 Too Many Requests` and standard headers:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1763683200
```

Payload:

```json
{
  "success": false,
  "statusCode": 429,
  "error": "TOO_MANY_REQUESTS",
  "errorCode": "ERR_RATE_LIMIT_EXCEEDED",
  "message": "لقد تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار والمحاولة لاحقاً",
  "timestamp": "2026-11-20T23:58:00.000Z"
}
```
