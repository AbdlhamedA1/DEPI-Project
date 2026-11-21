# REST Endpoints Specification (All 24 NestJS Modules)

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب)
- **Specification Document**: Phase 3 Technical Design & API Specifications
- **Document Path**: `docs/api/endpoints.md`
- **Modules Covered**: 24 modules under `apps/api/src/modules/`
- **Total Endpoints Documented**: 67 endpoints
- **Base Route**: `/api/v1`

---

## Catalog of Modules

```
[01] auth                [07] properties          [13] search               [19] reports
[02] users               [08] units               [14] booking-requests     [20] verification
[03] students            [09] rooms               [15] agreements           [21] support
[04] owners              [10] beds                [16] messaging            [22] admin
[05] universities        [11] pricing             [17] notifications        [23] analytics
[06] locations           [12] availability        [18] reviews              [24] platform-settings
```

---

## Module 01: `auth`

Authentication, student registration via phone OTP (+20), provider onboarding, password login, and session refresh.

| Method | Endpoint                        | Access        | Summary                                                |
| ------ | ------------------------------- | ------------- | ------------------------------------------------------ |
| `POST` | `/api/v1/auth/student/register` | Public        | Register new student and send 6-digit verification OTP |
| `POST` | `/api/v1/auth/owner/register`   | Public        | Register property provider account                     |
| `POST` | `/api/v1/auth/login`            | Public        | Authenticate via phone/email and password              |
| `POST` | `/api/v1/auth/verify-otp`       | Public        | Verify OTP code and issue JWT tokens                   |
| `POST` | `/api/v1/auth/resend-otp`       | Public        | Resend OTP code with 60s cooldown                      |
| `POST` | `/api/v1/auth/refresh-token`    | Public        | Refresh expired access token                           |
| `POST` | `/api/v1/auth/logout`           | Authenticated | Revoke refresh token and invalidate session            |

### Detailed Specifications

#### 1. `POST /api/v1/auth/student/register`

- **Summary**: Creates user with role `STUDENT`, provisions `student_profiles` row, and dispatches an OTP via SMS.
- **Request Body**:
  ```json
  {
    "phone": "+201012345678",
    "fullName": "أحمد محمود علي",
    "universityId": "b2c9d1a4-8451-4091-a128-4f81014a6721",
    "gender": "MALE",
    "faculty": "كلية الهندسة",
    "academicYear": "السنة الثانية",
    "password": "OptionalPassword123!"
  }
  ```
- **Validation**:
  - `phone`: E.164 Egyptian mobile format `^\+201[0125][0-9]{8}$`.
  - `universityId`: Must exist in `universities` table.
  - `gender`: `MALE` or `FEMALE`.
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "c1f7a2d8-912b-4d43-9831-7b794f9b8721",
      "phone": "+201012345678",
      "otpExpiresInSeconds": 300
    },
    "message": "تم إرسال رمز التحقق إلى هاتفك المحمول بنجاح",
    "timestamp": "2026-11-20T23:58:00.000Z"
  }
  ```
- **Error Codes**: `ERR_INVALID_PHONE_NUMBER` (422), `ERR_PHONE_ALREADY_REGISTERED` (409), `ERR_UNIVERSITY_REQUIRED` (422), `ERR_OTP_RATE_LIMIT_EXCEEDED` (429).

#### 2. `POST /api/v1/auth/owner/register`

- **Summary**: Registers a property owner/broker/company.
- **Request Body**:
  ```json
  {
    "phone": "+201198765432",
    "email": "owner@property-eg.com",
    "fullName": "محمود إبراهيم حسن",
    "providerType": "INDIVIDUAL_OWNER",
    "nationalIdNumber": "29801010101234",
    "companyName": null,
    "password": "SecurePassword2026!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "d2a8b3e9-023c-4e54-a942-8c805f0c9832",
      "verificationStatus": "UNVERIFIED"
    },
    "message": "تم تسجيل حساب المالك بنجاح. يرجى رفع وثائق إثبات الهوية والملكية لتفعيل نشر العقارات",
    "timestamp": "2026-11-20T23:58:00.000Z"
  }
  ```
- **Error Codes**: `ERR_PHONE_ALREADY_REGISTERED` (409), `ERR_EMAIL_ALREADY_REGISTERED` (409).

#### 3. `POST /api/v1/auth/login`

- **Summary**: Authenticates any user role using password credentials.
- **Request Body**: `{ "phone": "+201012345678", "password": "UserPassword123!" }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d8e7c6b5...",
      "user": {
        "id": "c1f7a2d8-912b-4d43-9831-7b794f9b8721",
        "phone": "+201012345678",
        "email": null,
        "role": "STUDENT",
        "status": "ACTIVE"
      }
    },
    "timestamp": "2026-11-20T23:58:00.000Z"
  }
  ```

#### 4. `POST /api/v1/auth/verify-otp`

- **Summary**: Validates 6-digit OTP code sent via SMS.
- **Request Body**: `{ "phone": "+201012345678", "code": "481920", "purpose": "REGISTRATION" }`
- **Response `200 OK`**: Returns `accessToken`, `refreshToken`, and user payload.
- **Error Codes**: `ERR_OTP_INVALID_OR_EXPIRED` (400).

#### 5. `POST /api/v1/auth/resend-otp`

- **Request Body**: `{ "phone": "+201012345678" }`
- **Response `200 OK`**: `{ "success": true, "message": "تم إعادة إرسال رمز التحقق", "cooldownSeconds": 60 }`

#### 6. `POST /api/v1/auth/refresh-token`

- **Request Body**: `{ "refreshToken": "d8e7c6b5..." }`
- **Response `200 OK`**: `{ "success": true, "data": { "accessToken": "eyJhbGciOi..." } }`

#### 7. `POST /api/v1/auth/logout`

- **Access**: Bearer JWT. Invalidates the active refresh token.
- **Response `200 OK`**: `{ "success": true, "message": "تم تسجيل الخروج بنجاح" }`

---

## Module 02: `users`

User account management, profile retrieval, email updates, and phone number changes with OTP verification.

| Method | Endpoint                             | Access        | Summary                                        |
| ------ | ------------------------------------ | ------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/users/me`                   | Authenticated | Retrieve current user account details          |
| `PUT`  | `/api/v1/users/me`                   | Authenticated | Update basic user email                        |
| `POST` | `/api/v1/users/change-phone/request` | Authenticated | Request phone update (sends OTP to new number) |
| `POST` | `/api/v1/users/change-phone/verify`  | Authenticated | Verify OTP and commit new phone number         |

### Detailed Specifications

- `GET /api/v1/users/me`: Returns user ID, phone, email, role, status, verification timestamps.
- `POST /api/v1/users/change-phone/request`: Body `{ "newPhone": "+201099887766" }`. Emits OTP to `newPhone`.
- `POST /api/v1/users/change-phone/verify`: Body `{ "newPhone": "+201099887766", "code": "654321" }`. Updates `users.phone` upon validation.

---

## Module 03: `students`

Student tenant profile and dashboard statistics.

| Method | Endpoint                        | Access    | Summary                                                     |
| ------ | ------------------------------- | --------- | ----------------------------------------------------------- |
| `GET`  | `/api/v1/students/me`           | `STUDENT` | Get detailed student profile                                |
| `PUT`  | `/api/v1/students/me`           | `STUDENT` | Update student profile details (bio, avatar, faculty, year) |
| `GET`  | `/api/v1/students/me/dashboard` | `STUDENT` | Get student active bookings, requests count, unread count   |

### Detailed Specifications

- `GET /api/v1/students/me`: Returns full name, university details (name, coordinates), faculty, academic year, gender, bio, avatar URL.
- `PUT /api/v1/students/me`: Body:
  ```json
  {
    "fullName": "أحمد محمود علي",
    "faculty": "هندسة القاهرة",
    "academicYear": "السنة الثالثة",
    "bio": "طالب بالسنة الثالثة أبحث عن سكن هادئ بالقرب من الجامعة",
    "avatarUrl": "https://res.cloudinary.com/sakany/image/upload/v1/avatars/student1.jpg"
  }
  ```
- `GET /api/v1/students/me/dashboard`:
  ```json
  {
    "success": true,
    "data": {
      "openRequestsCount": 2,
      "maxOpenRequestsAllowed": 3,
      "confirmedBooking": {
        "bookingId": "e3b9a1d2-...",
        "propertyName": "شقة الدقي للطلاب",
        "moveInDate": "2026-09-01",
        "status": "CONFIRMED"
      },
      "unreadMessagesCount": 1,
      "unreadNotificationsCount": 3
    }
  }
  ```

---

## Module 04: `owners`

Provider profile, KYC status, and property portfolio metrics.

| Method | Endpoint                      | Access  | Summary                                                         |
| ------ | ----------------------------- | ------- | --------------------------------------------------------------- |
| `GET`  | `/api/v1/owners/me`           | `OWNER` | Get provider profile, KYC status, company details               |
| `PUT`  | `/api/v1/owners/me`           | `OWNER` | Update provider details (company name, bio, avatar)             |
| `GET`  | `/api/v1/owners/me/dashboard` | `OWNER` | Get provider occupancy stats, pending requests, active listings |

### Detailed Specifications

- `GET /api/v1/owners/me/dashboard`:
  ```json
  {
    "success": true,
    "data": {
      "verificationStatus": "VERIFIED",
      "totalProperties": 4,
      "publishedProperties": 3,
      "pendingReviewProperties": 1,
      "pendingBookingRequests": 5,
      "totalActiveTenants": 12,
      "freeListingsRemaining": 2
    }
  }
  ```

---

## Module 05: `universities`

Directory of Egyptian public and private universities with coordinates.

| Method | Endpoint                   | Access | Summary                                                     |
| ------ | -------------------------- | ------ | ----------------------------------------------------------- |
| `GET`  | `/api/v1/universities`     | Public | List all active universities (filter by city or name)       |
| `GET`  | `/api/v1/universities/:id` | Public | Get specific university details and main campus coordinates |

### Detailed Specifications

- `GET /api/v1/universities`: Query `{ "cityId": "...", "search": "القاهرة" }`.
- Returns list of universities with `id`, `nameAr`, `nameEn`, `mainCampusLatitude`, `mainCampusLongitude`.

---

## Module 06: `locations`

Egyptian administrative geography (Cities and Areas).

| Method | Endpoint                                 | Access | Summary                                    |
| ------ | ---------------------------------------- | ------ | ------------------------------------------ |
| `GET`  | `/api/v1/locations/cities`               | Public | List all active Egyptian cities            |
| `GET`  | `/api/v1/locations/cities/:cityId/areas` | Public | List neighborhoods/districts within a city |

### Detailed Specifications

- `GET /api/v1/locations/cities`: Returns Cairo, Giza, Alexandria, etc.
- `GET /api/v1/locations/cities/:cityId/areas`: Returns Dokki, Nasr City, New Cairo, etc. with center coordinates.

---

## Module 07: `properties`

Property listing management, full CRUD, moderation lifecycle, and Cloudinary gallery photos.

| Method   | Endpoint                                 | Access             | Summary                                               |
| -------- | ---------------------------------------- | ------------------ | ----------------------------------------------------- |
| `GET`    | `/api/v1/properties`                     | Public             | List published properties with pagination & filtering |
| `GET`    | `/api/v1/properties/:id`                 | Public             | Retrieve full public property profile                 |
| `POST`   | `/api/v1/properties`                     | `OWNER` (Verified) | Create a new property listing                         |
| `PUT`    | `/api/v1/properties/:id`                 | `OWNER` / `ADMIN`  | Update property listing                               |
| `DELETE` | `/api/v1/properties/:id`                 | `OWNER` / `ADMIN`  | Archive / soft-delete property listing                |
| `POST`   | `/api/v1/properties/:id/images`          | `OWNER`            | Upload and attach photo to listing                    |
| `DELETE` | `/api/v1/properties/:id/images/:imageId` | `OWNER`            | Delete photo from listing gallery                     |

### Detailed Specifications

- `POST /api/v1/properties`: Guard checks `verification_status == 'VERIFIED'`. If unverified, returns `ERR_PROVIDER_NOT_VERIFIED` (403).
  ```json
  {
    "titleAr": "سكن طلابي متميز بجوار جامعة القاهرة",
    "titleEn": "Premium Student Housing near Cairo University",
    "descriptionAr": "شقة واسعة مفروشة بالكامل ومجهزة بالإنترنت والمكيفات",
    "descriptionEn": "Spacious fully-furnished flat equipped with Wi-Fi and AC",
    "propertyType": "APARTMENT",
    "genderPolicy": "MALE_ONLY",
    "cityId": "giza-uuid",
    "areaId": "dokki-uuid",
    "streetAddress": "15 شارع الدقي الرئيسي",
    "buildingNumber": "15",
    "latitude": 30.0385,
    "longitude": 31.2119,
    "amenities": ["WIFI", "AIR_CONDITIONING", "ELEVATOR", "BALCONY"],
    "rules": ["NO_SMOKING", "NO_GUESTS_AFTER_10PM"]
  }
  ```
- **Response `201 Created`**: Returns created property with `approvalStatus: 'PENDING_REVIEW'`.

---

## Module 08: `units`

Residential units (apartments) within a property.

| Method   | Endpoint                               | Access  | Summary                                |
| -------- | -------------------------------------- | ------- | -------------------------------------- |
| `GET`    | `/api/v1/properties/:propertyId/units` | Public  | List all apartment units in a property |
| `POST`   | `/api/v1/properties/:propertyId/units` | `OWNER` | Add apartment unit to a property       |
| `PUT`    | `/api/v1/units/:id`                    | `OWNER` | Update unit details                    |
| `DELETE` | `/api/v1/units/:id`                    | `OWNER` | Delete unit                            |

### Detailed Specifications

- `POST /api/v1/properties/:propertyId/units`: Body `{ "unitNumber": "Apt 4B", "floorNumber": 4, "totalRooms": 3, "totalBathrooms": 2, "furnishedStatus": "FURNISHED", "hasKitchen": true, "hasLivingRoom": true }`.

---

## Module 09: `rooms`

Bedrooms within an apartment unit.

| Method   | Endpoint                      | Access  | Summary                              |
| -------- | ----------------------------- | ------- | ------------------------------------ |
| `GET`    | `/api/v1/units/:unitId/rooms` | Public  | List rooms within an apartment unit  |
| `POST`   | `/api/v1/units/:unitId/rooms` | `OWNER` | Add private or shared room to a unit |
| `PUT`    | `/api/v1/rooms/:id`           | `OWNER` | Update room attributes               |
| `DELETE` | `/api/v1/rooms/:id`           | `OWNER` | Delete room                          |

### Detailed Specifications

- `POST /api/v1/units/:unitId/rooms`: Body `{ "roomNumber": "Room 1", "roomType": "SHARED", "capacity": 2, "hasPrivateBathroom": false, "hasAirConditioning": true }`.

---

## Module 10: `beds`

Individual sleeping spots inside a shared room.

| Method   | Endpoint                     | Access  | Summary                        |
| -------- | ---------------------------- | ------- | ------------------------------ |
| `GET`    | `/api/v1/rooms/:roomId/beds` | Public  | List beds within a shared room |
| `POST`   | `/api/v1/rooms/:roomId/beds` | `OWNER` | Add bed to a shared room       |
| `PUT`    | `/api/v1/beds/:id`           | `OWNER` | Update bed details             |
| `DELETE` | `/api/v1/beds/:id`           | `OWNER` | Delete bed                     |

### Detailed Specifications

- `POST /api/v1/rooms/:roomId/beds`: Body `{ "bedNumber": "Bed A", "bedType": "SINGLE" }`.

---

## Module 11: `pricing`

Polymorphic rental pricing rate cards and additional expense schedules.

| Method   | Endpoint                                  | Access  | Summary                                           |
| -------- | ----------------------------------------- | ------- | ------------------------------------------------- |
| `GET`    | `/api/v1/pricing/:entityType/:entityId`   | Public  | Get active pricing options for accommodation tier |
| `POST`   | `/api/v1/pricing/:entityType/:entityId`   | `OWNER` | Set or update pricing rate for tier               |
| `POST`   | `/api/v1/properties/:propertyId/expenses` | `OWNER` | Add itemized utility/maintenance expense          |
| `DELETE` | `/api/v1/expenses/:id`                    | `OWNER` | Remove itemized expense                           |

### Detailed Specifications

- `POST /api/v1/pricing/:entityType/:entityId`:
  ```json
  {
    "pricingUnit": "PER_BED",
    "durationUnit": "MONTHLY",
    "amount": 2500.0,
    "depositAmount": 1000.0
  }
  ```
- `POST /api/v1/properties/:propertyId/expenses`:
  ```json
  {
    "nameAr": "الكهرباء والإنترنت",
    "nameEn": "Electricity & Wi-Fi",
    "amount": 300.0,
    "isMandatory": true,
    "isRecurring": true,
    "billingFrequency": "MONTHLY"
  }
  ```

---

## Module 12: `availability`

Polymorphic accommodation availability tracking and manual status updates.

| Method | Endpoint                                     | Access  | Summary                                               |
| ------ | -------------------------------------------- | ------- | ----------------------------------------------------- |
| `GET`  | `/api/v1/availability/:entityType/:entityId` | Public  | Get current availability state and date ranges        |
| `PUT`  | `/api/v1/availability/:entityType/:entityId` | `OWNER` | Update manual availability status (e.g., MAINTENANCE) |

### Detailed Specifications

- `PUT /api/v1/availability/:entityType/:entityId`:
  ```json
  {
    "status": "MAINTENANCE",
    "availableFrom": "2026-10-01",
    "availableTo": null
  }
  ```

---

## Module 13: `search`

Comprehensive multi-criteria accommodation search with filtering and map bounding box pins.

| Method | Endpoint             | Access | Summary                                                  |
| ------ | -------------------- | ------ | -------------------------------------------------------- |
| `GET`  | `/api/v1/search`     | Public | Search accommodation cards with full filter support      |
| `GET`  | `/api/v1/search/map` | Public | Map search returning coordinate pins within bounding box |

### Detailed Specifications

- `GET /api/v1/search`:
  - **Query Parameters**:
    - `cityId`, `areaId`, `universityId`: UUID filters.
    - `maxDistanceKm`: Number (e.g. `5` km from university).
    - `minPrice`, `maxPrice`: Number (e.g. `1500` to `4000` EGP).
    - `propertyType`: `BUILDING`, `APARTMENT`, `ROOM`, `BED`.
    - `genderPolicy`: `MALE_ONLY`, `FEMALE_ONLY`, `MIXED_FAMILY`.
    - `durationUnit`: `MONTHLY`, `SEMESTER`, `YEARLY`.
    - `page`, `limit`.
- Returns `PaginatedResponse<SearchPropertyCardDto>`.

---

## Module 14: `booking-requests`

Student booking requests lifecycle management, contact disclosure, acceptance, rejection, and cancellation.

| Method | Endpoint                              | Access      | Summary                                               |
| ------ | ------------------------------------- | ----------- | ----------------------------------------------------- |
| `POST` | `/api/v1/booking-requests`            | `STUDENT`   | Submit new booking request (enforces max 3 open rule) |
| `GET`  | `/api/v1/booking-requests/student`    | `STUDENT`   | List booking requests initiated by current student    |
| `GET`  | `/api/v1/booking-requests/owner`      | `OWNER`     | List incoming booking requests for provider listings  |
| `GET`  | `/api/v1/booking-requests/:id`        | Participant | Get request details (discloses phone & email)         |
| `POST` | `/api/v1/booking-requests/:id/accept` | `OWNER`     | Accept request (transitions to agreement stage)       |
| `POST` | `/api/v1/booking-requests/:id/reject` | `OWNER`     | Reject request (optional rejection reason)            |
| `POST` | `/api/v1/booking-requests/:id/cancel` | `STUDENT`   | Cancel request before bilateral confirmation          |

### Detailed Specifications

- `POST /api/v1/booking-requests`:
  - Enforces `BR-BKG-001` (Max 3 open requests). If student holds 3 requests in `PENDING` or `ACCEPTED`, throws `ERR_MAX_OPEN_REQUESTS_REACHED` (400).
  - Enforces `BR-BKG-002` (Max 1 confirmed booking). If student already has a confirmed booking, throws `ERR_STUDENT_HAS_CONFIRMED_BOOKING` (409).
  - **Request Body**:
    ```json
    {
      "propertyId": "property-uuid",
      "targetEntityType": "BED",
      "targetEntityId": "bed-uuid",
      "requestedMoveInDate": "2026-09-01",
      "durationUnit": "SEMESTER",
      "durationCount": 1,
      "studentNote": "طالب بالسنة الأولى بكلية الطب أبحث عن مكان هادئ للمذاكرة"
    }
    ```
  - **Side Effects**: Automatically provisions 1:1 `conversations` thread between student and owner. Discloses student phone, email, and university to owner, and owner phone and email to student (`BR-CNT-001`).

---

## Module 15: `agreements`

Bilateral agreement confirmation, mutual locking transaction, and contract document uploads.

| Method | Endpoint                                   | Access      | Summary                                           |
| ------ | ------------------------------------------ | ----------- | ------------------------------------------------- |
| `GET`  | `/api/v1/agreements/by-request/:requestId` | Participant | Get agreement state and terms                     |
| `POST` | `/api/v1/agreements/:id/confirm-student`   | `STUDENT`   | Student confirms agreement terms                  |
| `POST` | `/api/v1/agreements/:id/confirm-owner`     | `OWNER`     | Owner confirms agreement (triggers row-lock)      |
| `POST` | `/api/v1/agreements/:id/documents`         | Participant | Upload optional signed rental contract document   |
| `GET`  | `/api/v1/agreements/:id/documents/:docId`  | Participant | Get signed private download URL for contract scan |

### Detailed Specifications

- `POST /api/v1/agreements/:id/confirm-student` & `confirm-owner`:
  - When both parties have confirmed, the system executes the atomic row-level locking transaction (`SELECT ... FOR UPDATE` on `availabilities`).
  - Transitions `availabilities.status = 'BOOKED'`.
  - Transitions `agreement_confirmations.status = 'CONFIRMED'`.
  - Transitions `booking_requests.status = 'CONFIRMED'`.
  - Transitions competing requests to `CLOSED_CONFLICT`.

---

## Module 16: `messaging`

Direct text-only messaging between student and owner. Permanent thread decoupling (`BR-MSG-001`).

| Method | Endpoint                                       | Access        | Summary                                        |
| ------ | ---------------------------------------------- | ------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/messaging/conversations`              | Authenticated | List all conversation threads for current user |
| `GET`  | `/api/v1/messaging/conversations/:id`          | Participant   | Get conversation metadata                      |
| `GET`  | `/api/v1/messaging/conversations/:id/messages` | Participant   | Get paginated message history                  |
| `POST` | `/api/v1/messaging/conversations/:id/messages` | Participant   | Send text-only message                         |
| `PUT`  | `/api/v1/messaging/conversations/:id/read`     | Participant   | Mark conversation messages as read             |

### Detailed Specifications

- `POST /api/v1/messaging/conversations/:id/messages`:
  - Body: `{ "body": "السلام عليكم، هل يمكن معاينة الغرفة غداً مساءً؟" }`
  - Validates `body` is plain text. Dispatches in-app notification to the counterparty.

---

## Module 17: `notifications`

In-app notifications feed and read-receipt management.

| Method | Endpoint                         | Access        | Summary                                      |
| ------ | -------------------------------- | ------------- | -------------------------------------------- |
| `GET`  | `/api/v1/notifications`          | Authenticated | List user notifications (filter by `isRead`) |
| `PUT`  | `/api/v1/notifications/:id/read` | Authenticated | Mark individual notification as read         |
| `PUT`  | `/api/v1/notifications/read-all` | Authenticated | Mark all user notifications as read          |

---

## Module 18: `reviews`

Post-booking reviews and single owner rebuttal response (`BR-REV-001`, `BR-REV-002`).

| Method | Endpoint                               | Access        | Summary                                              |
| ------ | -------------------------------------- | ------------- | ---------------------------------------------------- |
| `GET`  | `/api/v1/reviews/property/:propertyId` | Public        | List published reviews for a property listing        |
| `POST` | `/api/v1/reviews`                      | Authenticated | Submit review (requires completed confirmed booking) |
| `POST` | `/api/v1/reviews/:id/response`         | Reviewee      | Submit single public rebuttal response               |

### Detailed Specifications

- `POST /api/v1/reviews`:
  - Validates that `bookingRequestId` is in `CONFIRMED` status and belongs to caller.
  - Body: `{ "bookingRequestId": "...", "rating": 5, "comment": "مكان رائع والمالك متعاون جداً" }`.
- `POST /api/v1/reviews/:id/response`:
  - Body: `{ "responseText": "شكراً جزيلاً، ويسعدنا دائماً استضافتك" }`.
  - Only one response allowed per review. Throws `ERR_REVIEW_RESPONSE_ALREADY_EXISTS` (409) if submitted again.

---

## Module 19: `reports`

Grievance and platform violation reporting.

| Method | Endpoint                     | Access        | Summary                            |
| ------ | ---------------------------- | ------------- | ---------------------------------- |
| `POST` | `/api/v1/reports`            | Authenticated | File a complaint ticket            |
| `GET`  | `/api/v1/reports/my-reports` | Authenticated | List reports filed by current user |

### Detailed Specifications

- `POST /api/v1/reports`:
  ```json
  {
    "reportedPropertyId": "property-uuid",
    "category": "MISLEADING_LISTING",
    "details": "الصور المعروضة للشقة لا تطابق الواقع الفعلي حيث الغرفة بدون تكييف"
  }
  ```

---

## Module 20: `verification`

Provider KYC identity and property ownership document submission.

| Method | Endpoint                         | Access  | Summary                                     |
| ------ | -------------------------------- | ------- | ------------------------------------------- |
| `POST` | `/api/v1/verification/documents` | `OWNER` | Upload KYC verification document            |
| `GET`  | `/api/v1/verification/my-status` | `OWNER` | Check current verification status and notes |

### Detailed Specifications

- `POST /api/v1/verification/documents`:
  - Multipart form data: `documentType` (`NATIONAL_ID`, `OWNERSHIP_DEED`, etc.), `file`, optional `documentRefNo`.
  - Automatically transitions `property_provider_profiles.verification_status` to `PENDING`.

---

## Module 21: `support`

Public platform FAQs and general contact inquiries.

| Method | Endpoint                  | Access | Summary                                     |
| ------ | ------------------------- | ------ | ------------------------------------------- |
| `GET`  | `/api/v1/support/faq`     | Public | Retrieve categorized student and owner FAQs |
| `POST` | `/api/v1/support/contact` | Public | Submit support contact form                 |

---

## Module 22: `admin`

Superadmin dashboard, moderation, KYC approval, user suspension, and immutable audit logs.

| Method | Endpoint                                 | Access  | Summary                                           |
| ------ | ---------------------------------------- | ------- | ------------------------------------------------- |
| `GET`  | `/api/v1/admin/dashboard`                | `ADMIN` | Comprehensive platform stats & operations metrics |
| `GET`  | `/api/v1/admin/verifications/pending`    | `ADMIN` | List pending provider KYC requests                |
| `POST` | `/api/v1/admin/verifications/:id/review` | `ADMIN` | Approve or reject provider KYC                    |
| `GET`  | `/api/v1/admin/properties/pending`       | `ADMIN` | List property listings awaiting approval          |
| `POST` | `/api/v1/admin/properties/:id/review`    | `ADMIN` | Approve or reject property listing                |
| `GET`  | `/api/v1/admin/users`                    | `ADMIN` | Search and list platform users                    |
| `PUT`  | `/api/v1/admin/users/:id/status`         | `ADMIN` | Suspend or reactivate a user account              |
| `GET`  | `/api/v1/admin/reports`                  | `ADMIN` | List filed dispute reports                        |
| `PUT`  | `/api/v1/admin/reports/:id`              | `ADMIN` | Update dispute status and notes                   |
| `GET`  | `/api/v1/admin/audit-logs`               | `ADMIN` | Query immutable administrative audit logs         |

### Detailed Specifications

- `POST /api/v1/admin/verifications/:id/review`:
  - Body: `{ "decision": "APPROVE" }` or `{ "decision": "REJECT", "reason": "صورة بطاقة الرقم القومي غير واضحة" }`.
  - Writes audit entry to `admin_action_logs` synchronously.
- `POST /api/v1/admin/properties/:id/review`:
  - Body: `{ "decision": "APPROVE" }` or `{ "decision": "REJECT", "moderationNote": "يرجى تعديل صور الشقة" }`.
  - Updates `properties.approval_status` and writes audit entry.

---

## Module 23: `analytics`

Administrative reporting on supply, demand, student migrations, and pricing trends.

| Method | Endpoint                           | Access  | Summary                                              |
| ------ | ---------------------------------- | ------- | ---------------------------------------------------- |
| `GET`  | `/api/v1/analytics/overview`       | `ADMIN` | Key platform metrics (total listings, bookings, GMV) |
| `GET`  | `/api/v1/analytics/cities`         | `ADMIN` | City supply vs. demand breakdown                     |
| `GET`  | `/api/v1/analytics/pricing-trends` | `ADMIN` | Average pricing trends per room/bed by area          |

---

## Module 24: `platform-settings`

Runtime configuration management governing platform business rules without deployments.

| Method | Endpoint                           | Access  | Summary                                |
| ------ | ---------------------------------- | ------- | -------------------------------------- |
| `GET`  | `/api/v1/platform-settings/public` | Public  | Retrieve public configuration values   |
| `GET`  | `/api/v1/platform-settings`        | `ADMIN` | Retrieve all configuration keys        |
| `PUT`  | `/api/v1/platform-settings/:key`   | `ADMIN` | Update dynamic configuration parameter |

### Detailed Specifications

- `GET /api/v1/platform-settings/public`: Returns public parameters (e.g. `max_open_requests_per_student: 3`, `otp_expiry_minutes: 5`).
- `PUT /api/v1/platform-settings/:key`: Body `{ "value": { "limit": 10 } }`. Writes before/after diff to `admin_action_logs`.
