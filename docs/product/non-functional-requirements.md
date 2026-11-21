# Non-Functional Requirements Specification (NFR)

## Egyptian Student Housing Platform _(منصة سكن الطلاب في مصر)_

---

## 1. Overview & Architecture Standards

This document establishes the non-functional requirements (NFRs), quality attributes, and architectural constraints governing the Egyptian Student Housing Platform. Built as a Modular Monolith in strict accordance with `app.txt` and `app2.txt`, the platform prioritizes security, transactional integrity, sub-second performance, bilingual accessibility (Egyptian Arabic RTL / English LTR), and operational reliability.

---

## 2. Security & Compliance Architecture

### 2.1 Authentication & Credential Management

- **Password Hashing**: Passwords hashed using **Argon2id** (recommended: memory cost 64MB, time cost 3, parallelism 1) or **bcrypt** with a minimum cost factor of 12. Plaintext passwords never logged or persisted.
- **Session Tokens**: Stateless JSON Web Tokens (JWT):
  - Access Token: Short-lived (15 minutes expiry), signed with `RS256` or `HS256` (256-bit secret), carrying user ID, role, and verification status.
  - Refresh Token: Long-lived (7 days expiry), cryptographically random token stored in an HTTP-only, Secure, SameSite (`Strict` or `Lax`) cookie, with a SHA-256 hash stored in the database for instant revocation.
- **SMS OTP Rate Limiting & Anti-Brute Force**:
  - Enforce maximum 3 OTP generation requests per phone number within a 15-minute rolling window.
  - Enforce maximum 5 OTP verification attempts per issued code before immediate invalidation.
  - Exponential backoff applied to login attempts per IP and per account.

### 2.2 Sensitive Document Storage & Data Isolation

- **KYC Private Storage**: National IDs, property ownership deeds, and powers of attorney must be uploaded to a dedicated **Private Storage Bucket** (e.g., AWS S3 Private Bucket or Google Cloud Storage Private Bucket) with zero public read permissions.
- **Time-Limited Signed URLs**: Access to KYC files by authorized administrators is granted exclusively via pre-signed URLs expiring in $\le 10$ minutes.
- **Response Serialization Scrubbing**: Backend DTO interceptors and serializers must strip and exclude National ID numbers, deed file paths, and private contact notes from all public and student-facing API responses.

### 2.3 Application Defense & Attack Mitigation

- **Input Validation & Sanitization**: Strict input validation using Zod and class-validator schemas on all incoming payloads.
- **Cross-Site Scripting (XSS)**: Automatic context-aware output encoding in React/Next.js; Markdown text sanitized using DOMPurify.
- **Cross-Site Request Forgery (CSRF)**: CSRF tokens enforced on all state-mutating requests utilizing cookie-based authentication.
- **SQL Injection Prevention**: 100% parameterization via TypeORM / Prisma / raw parameterized SQL drivers; zero string-concatenated queries.
- **Security Headers**: Enforce HTTP security headers:
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 2.4 Immutable Administrative Audit Logging

- Every administrative action (KYC verification, listing approval/rejection, user ban, report closure, setting change) must execute within an atomic transaction that records an immutable entry into `AdminActionLog`.
- Log records include `admin_id`, `action_type`, `entity_type`, `entity_id`, before/after JSON diff, client IP, and UTC timestamp. Log entries cannot be updated or deleted.

---

## 3. Performance & Concurrency Benchmarks

### 3.1 Query Response & Latency SLAs

- **Public Search & Discovery**:
  - 95th percentile ($P_{95}$) search response time $< 400\text{ ms}$ under 200 concurrent active users.
  - Distance calculations (Haversine / PostGIS) executed with spatial indices (`GIST` on geocoordinates).
- **Property Details Page**: Complete page data payload delivered in $< 300\text{ ms}$.
- **Booking Submission & Messaging**: API round-trip response time $< 250\text{ ms}$.
- **Frontend Core Web Vitals (Lighthouse Targets)**:
  - Largest Contentful Paint (LCP) $\le 2.0\text{ s}$.
  - First Input Delay (FID) $\le 100\text{ ms}$ / Interaction to Next Paint (INP) $\le 200\text{ ms}$.
  - Cumulative Layout Shift (CLS) $\le 0.1$.

### 3.2 Concurrency & Transactional Integrity

- **Database Row-Level Locking**: Mutual agreement confirmations and availability updates must execute under PostgreSQL row locks (`SELECT ... FOR UPDATE`) on target accommodation entities (beds, rooms, units).
- **Zero Race Conditions**: Under simultaneous concurrent confirmation requests for the same room or bed, the database transaction isolation ensures exactly one confirmation succeeds while the competing transaction aborts with a concurrency conflict (`HTTP 409`).

### 3.3 Static Asset & Media Optimization

- **Cloudinary CDN**: Property photos uploaded directly to Cloudinary with automatic WebP/AVIF format conversion, progressive JPEG fallback, and responsive dimension transformations (`f_auto,q_auto,w_800`).
- **Edge Caching**: Static web assets (fonts, icons, script bundles) cached at CDN edge with `Cache-Control: public, max-age=31536000, immutable`.

---

## 4. Localization, Internationalization (i18n) & Accessibility

### 4.1 Bilingual Architecture

- **Primary Language**: Egyptian Arabic (`ar-EG`), rendered natively with right-to-left (`dir="rtl"`) text direction.
- **Secondary Language**: English (`en-US`), rendered with left-to-right (`dir="ltr"`) text direction.
- **Dynamic Locale Routing**: Next.js App Router localized paths under `/[locale]/...` (e.g., `/ar/properties/123`, `/en/properties/123`).
- **Currency & Date Formatting**:
  - Currency rendered explicitly in Egyptian Pounds: `EGP` or `ج.م` (e.g., `2,500 ج.م / شهرياً` or `2,500 EGP / Month`).
  - Dates formatted using standard Egyptian Gregorian conventions (`dd/MM/yyyy`).

### 4.2 Typography & Brand Consistency

- **Arabic Typography**: Cairo and Alexandria Google Fonts for clear readability and natural Egyptian Arabic proportions across mobile screens.
- **Latin Typography**: Inter for clean English typography.
- **Brand Colors**: Vibrant Orange (`#FF6B00` / `#FA5A00`) as primary action color paired with deep Navy (`#0A192F` / `#1E293B`) for stable authority.

### 4.3 Accessibility Standards (WCAG 2.1 AA)

- **Contrast Ratios**: Minimum text contrast ratio of 4.5:1 against backgrounds for standard text, and 3:1 for large display headers.
- **Keyboard Navigation**: All interactive controls, search filters, modals, and map switches navigable via keyboard (`Tab`, `Enter`, `Escape`).
- **Screen Reader Support**: Semantic HTML tags (`<nav>`, `<main>`, `<article>`, `<aside>`) supplemented with descriptive `aria-label` attributes in Arabic and English.
- **Theme Preference**: Automatically detects device preference for light or dark mode (`prefers-color-scheme`), defaulting to an optimized light theme.

---

## 5. Scalability, Reliability & Maintainability

### 5.1 Modular Monolith Scalability

- **Code Separation**: Single monorepo architecture preventing microservices network latency overhead while maintaining strict domain module boundaries in NestJS (`apps/api/src/modules/`).
- **Horizontal Scaling**: Stateless web and API server instances containerized to allow horizontal scaling behind a reverse proxy (e.g., NGINX / Cloudflare).
- **Database Connection Pooling**: PostgreSQL managed connection pooling (`pgbouncer` or internal pool size tuned to 20–50 connections per instance).

### 5.2 Containerization & Deployment Standards

- **Docker Multi-Stage Builds**:
  - `apps/web/Dockerfile`: Stage 1: Dependency resolution; Stage 2: Next.js standalone build; Stage 3: Minimal Node.js Alpine runtime image.
  - `apps/api/Dockerfile`: Multi-stage build producing lean production container with pruned devDependencies.
- **Non-Root Execution**: Container processes run under an unprivileged `appuser` (UID 10001) for defense-in-depth container security.

### 5.3 Reliability, Backup & Disaster Recovery

- **Uptime Target**: 99.5% service availability during pilot operations.
- **Automated Database Backups**:
  - Nightly automated PostgreSQL full database dump (`pg_dump`) with gzip compression, encrypted and shipped to remote off-site storage.
  - Retention policy: 7 daily snapshots, 4 weekly snapshots, 12 monthly archives.
- **Recovery Time Objective (RTO)**: $< 2\text{ hours}$ for full database restore from snapshot.
- **Recovery Point Objective (RPO)**: $< 24\text{ hours}$ (maximum acceptable data loss in catastrophic restore scenario).

---

## 6. Observability & Health Telemetry

### 6.1 Health & Readiness Endpoints

- **Liveness Probe**: `GET /health/liveness` returns `200 OK` if the process event loop is responsive.
- **Readiness Probe**: `GET /health/readiness` checks live connectivity to PostgreSQL database and external storage before accepting traffic.

### 6.2 Structured Logging & Error Tracking

- **JSON Structured Logs**: All application logs emitted in structured JSON format including timestamp, log level (`INFO`, `WARN`, `ERROR`), request ID, user ID, module name, and execution duration.
- **PII Scrubbing**: Logs must sanitize and exclude passwords, National IDs, OTP codes, and payment tokens.
