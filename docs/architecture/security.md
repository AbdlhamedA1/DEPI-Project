# Egyptian Student Housing Platform — Security & Privacy Architecture

**Document ID**: `ARCH-SEC-001`  
**Version**: `1.0.0` (Phase 2 System Architecture)  
**Status**: `Approved Standard`  
**Target Systems**: `apps/web`, `apps/api`, Storage Infrastructure  
**Regulatory Context**: Egyptian Data Protection Law (Law No. 151 of 2020) & OWASP Top 10 Standards  
**Architectural Decision Records**: `ADR-003` (NestJS Backend), `ADR-004` (PostgreSQL), `ADR-007` (Contact Disclosure), `ADR-008` (Review Qualification)

---

## 1. Security Philosophy & Threat Modeling

### 1.1 Core Principles

Security and privacy are non-negotiable foundations of the Egyptian Student Housing Platform. Because the platform processes sensitive personal data—including Egyptian national identity cards, legal property deeds, mobile numbers, and live student-owner communication—security controls are implemented natively into every layer rather than patched retroactively.

Key mandates:

1. **Zero-Trust Backend Validation**: Never rely on frontend checks as the sole authorization mechanism. Every API endpoint independently verifies user identity, role privileges, resource ownership, and input validity.
2. **Confidential PII Isolation**: Verification documents (National IDs, title deeds) are strictly isolated from public media storage (Cloudinary) and safeguarded behind time-limited pre-signed URLs with role-based ACLs.
3. **Passwordless Authentication**: Avoid weak user passwords by employing cryptographically generated 6-digit OTP codes sent to Egyptian mobile numbers (+20), protected by rigorous rate limiting.
4. **Immutable Audit Accountability**: All administrative operations, listing status changes, user suspensions, and KYC approvals are permanently recorded in an append-only `AdminActionLog` table.

---

## 2. Authentication Architecture

### 2.1 Passwordless Mobile Phone OTP Authentication

To suit Egyptian market realities where mobile phones are the primary identity vector, authentication is passwordless:

1. **Egyptian Mobile Number Normalization**:
   - Phone numbers must strictly adhere to the Egyptian E.164 standard: `+201[0125][0-9]{8}` (covering Vodafone, Orange, Etisalat, and WE).
   - Normalized at the API boundary via `packages/validation`.
2. **Cryptographically Secure OTP Generation**:
   - Generated using Node.js `crypto.randomInt(100000, 1000000)`.
   - Never logged to stdout in production or exposed in API response payloads.
3. **Secure Storage & Verification**:
   - OTP codes are hashed using bcrypt or Argon2 before storage in the database table `otp_records`.
   - Lifespan is strictly enforced at 5 minutes (TTL).
4. **Brute-Force & Flooding Protections**:
   - **Generation Throttle**: Maximum 3 OTP dispatches per phone number or IP address within any 15-minute window.
   - **Verification Throttle**: Maximum 5 invalid OTP verification attempts before the token is invalidated and the account undergoes a 30-minute lockout.

### 2.2 JWT Token Lifecycle & Refresh Rotation

Authentication state is managed via dual-token JWT architecture:

```
[Client Application]                                    [AuthModule API]
        │                                                       │
        │── 1. POST /api/v1/auth/verify-otp ───────────────────►│ (Validates OTP)
        │                                                       │
        │◄── 2. Response: Access Token (JSON) ──────────────────│
        │        Set-Cookie: refresh_token (HttpOnly, Secure) ──│
        │                                                       │
        │── 3. GET /api/v1/protected (Bearer AccessToken) ─────►│ (Validates JWT)
        │                                                       │
        │── 4. POST /api/v1/auth/refresh (Cookie RefreshToken) ─►│ (Rotates Family)
        │                                                       │
        │◄── 5. Response: New Access Token ─────────────────────│
        │        Set-Cookie: New refresh_token ─────────────────│
```

1. **Access Token**:
   - Short lifespan: 15 minutes.
   - Transmitted in the `Authorization: Bearer <token>` header.
   - Payload: `{ sub: userId, role: UserRole, phone: string, exp: number }`.
2. **Refresh Token**:
   - Long lifespan: 7 days.
   - Stored strictly in an `httpOnly`, `Secure`, `SameSite=Strict` cookie, completely inaccessible to JavaScript (XSS immune).
   - Stored in the database as a SHA-256 hash linked to a token family ID.
   - **Token Family Rotation**: When a refresh token is used, it is revoked and replaced with a new token in the same family. If an already-revoked refresh token is submitted, the system detects token theft and immediately revokes all tokens within that family, forcing re-authentication.

### 2.3 Secure Phone Number Update Flow

To prevent account takeover via SIM-swap or session tampering:

1. User requests a phone update while authenticated with an active session.
2. System dispatches an OTP to the _new_ Egyptian mobile number.
3. User must submit the valid OTP along with their current JWT token to `/api/v1/users/change-phone`.
4. Upon successful verification, the phone number is updated, all existing sessions and refresh tokens are revoked, and a new session is issued.

---

## 3. Authorization & Role-Based Access Control (RBAC)

### 3.1 Role Hierarchy & Provider Subtypes

The platform implements a server-enforced RBAC model:

| Role      | Scope                        | Permitted Capabilities                                                                                                                                   |
| --------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STUDENT` | Egyptian University Students | Search listings, submit up to 3 open booking requests, execute 1 confirmed booking, access request chat threads, submit reviews, submit abuse reports.   |
| `OWNER`   | Property Providers           | Manage property inventory (Buildings/Units/Rooms/Beds), upload verification KYC docs, respond to booking requests, confirm agreements, reply to reviews. |
| `ADMIN`   | Platform Superadmins         | Approve/reject property listings, inspect & verify provider KYC deeds, triage abuse reports, oversee audit logs, broadcast platform announcements.       |

#### Property Provider Subtypes (`app.txt` §4)

- `INDIVIDUAL_OWNER`: Directly owns the residential property.
- `AUTHORIZED_AGENT`: Representative acting on behalf of the owner (mandates legal power of attorney).
- `MANAGEMENT_COMPANY`: Commercial entity managing student residences (mandates commercial registration docs).

### 3.2 NestJS Guard Pipeline

Every backend endpoint enforces a multi-tiered guard pipeline:

```typescript
@Controller('api/v1/admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminVerificationsController {
  // Only authenticated admins can access this endpoint
}
```

1. **`JwtAuthGuard`**: Validates token signature, expiration, and user account status (`ACTIVE`).
2. **`RolesGuard`**: Compares the user's role against `@Roles(...)` decorator metadata.
3. **`OwnershipGuard` (Attribute-Based Access Control)**:
   - For resources owned by specific users (e.g. `BookingRequest`, `Conversation`, `Property`), the guard asserts that `request.user.id === resource.ownerId` or `request.user.id === resource.studentId`.
   - Prevents Insecure Direct Object References (IDOR).

### 3.3 Single Superadmin Principle

- To eliminate unauthorized administrative privilege escalation, administrative accounts cannot be created via public registration endpoints.
- The platform operates on the **Single Superadmin Principle**: the initial superadmin is provisioned manually through a secure database seed or CLI script (`scripts/setup/init-admin.ts`) requiring environment-level credentials.
- Additional administrative accounts can only be provisioned directly by the primary superadmin.

---

## 4. Private KYC Document Storage & Isolation ACL

### 4.1 Strict Physical & Logical Isolation from Public CDN

Per `app.txt` (§6, §10), the platform maintains a rigorous boundary between public media and sensitive verification files:

```
+---------------------------------------------------------------------------------+
| PUBLIC MEDIA STORAGE (Cloudinary)                                               |
| - Property exterior & interior photos                                           |
| - Floor plans & unit photographs                                                |
| - Publicly accessible via CDN edge cache                                        |
| - Zero sensitive PII permitted                                                  |
+---------------------------------------------------------------------------------+
| ISOLATED PRIVATE STORAGE (S3-Compatible Private Bucket / Encrypted Volume)       |
| - Egyptian National ID Card scans (Face & Back)                                 |
| - Property Ownership Deeds (عقد الملكية)                                        |
| - Registered Power of Attorney (توكيل رسمي)                                     |
| - Commercial Registration & Tax Cards                                          |
| - Access restricted strictly to Platform Superadmins & Uploading Provider       |
| - Zero public read permissions; files delivered via 5-minute pre-signed URLs     |
+---------------------------------------------------------------------------------+
```

### 4.2 Document Access Control Implementation

KYC documents can only be retrieved through an authenticated proxy endpoint:

```typescript
// apps/api/src/modules/verification/verification.controller.ts
@Controller('api/v1/verifications')
@UseGuards(JwtAuthGuard, KycDocumentGuard)
export class VerificationController {
  constructor(private readonly secureStorageService: SecureStorageService) {}

  @Get(':verificationId/documents/:documentKey')
  async getSecureDocument(
    @Param('verificationId') verificationId: string,
    @Param('documentKey') documentKey: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // KycDocumentGuard has already verified that req.user is either ADMIN
    // or the specific OWNER who uploaded this verification.

    // Returns a short-lived pre-signed download URL (5 minutes TTL)
    const downloadUrl = await this.secureStorageService.getPresignedUrl(
      documentKey,
      300, // 300 seconds TTL
    );

    return { success: true, data: { downloadUrl } };
  }
}
```

---

## 5. Input Validation, Sanitization & Vulnerability Defenses

### 5.1 Validation & Sanitization Engine

1. **NestJS Global `ValidationPipe`**:
   - `whitelist: true`: Strips any incoming payload properties that do not match the DTO definition.
   - `forbidNonWhitelisted: true`: Rejects requests containing unexpected keys with HTTP 400.
   - `transform: true`: Automatically coerces payload primitives to declared DTO types.
2. **Shared Zod Schemas**:
   - Shared between `apps/web` (client validation) and `apps/api` (server validation) via `packages/validation`.
3. **Cross-Site Scripting (XSS) Defenses**:
   - All free-text inputs (property descriptions, chat messages, reviews, report descriptions) are sanitized server-side using `DOMPurify` / `sanitize-html` to neutralize embedded script tags, `javascript:` pseudo-protocols, or malicious HTML attributes.
4. **SQL Injection Defenses**:
   - Parameterized queries are universally enforced via TypeORM QueryBuilder and repository methods.
   - Direct raw string concatenation into SQL queries is strictly prohibited across all modules.

### 5.2 HTTP Security Headers & Cross-Origin Policies

- **Helmet**: NestJS integrates `helmet()` middleware applying:
  - `Content-Security-Policy`: Restricts script execution to approved domains.
  - `Strict-Transport-Security` (HSTS): `max-age=31536000; includeSubDomains; preload`.
  - `X-Frame-Options`: `DENY` to prevent clickjacking attacks.
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
- **CORS Policies**:
  - Restricts allowed origins strictly to the configured `FRONTEND_URL`.
  - `credentials: true` enables authenticated cookie transmission.
- **CSRF Protection**:
  - State-altering endpoints require CSRF double-submit cookies or standard custom headers (`X-Requested-With: XMLHttpRequest`).

---

## 6. Immutable Administrative Audit Logging (`AdminActionLog`)

### 6.1 Audit Log Data Model

To guarantee accountability and regulatory compliance under Egyptian Law 151/2020, every administrative action is recorded permanently in the PostgreSQL `admin_action_logs` table:

```sql
CREATE TABLE admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(64) NOT NULL,
    target_entity_type VARCHAR(64) NOT NULL,
    target_entity_id UUID NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    before_state JSONB,
    after_state JSONB,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_admin_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_logs_entity ON admin_action_logs(target_entity_type, target_entity_id);
```

### 6.2 Audit Interceptor Mechanics

- An administrative interceptor wraps all mutations in `AdminModule`, capturing the resource state prior to execution (`beforeState`) and post-execution (`afterState`).
- The database enforces append-only permissions on this table: updates and deletions are barred at the database permission level.
