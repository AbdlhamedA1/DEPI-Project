# DECISION REGISTER (سجل القرارات)

## Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

This document serves as the formal, persistent decision register for all major architectural, engineering, and product decisions. Per **Section 14 of `app.txt`**, every entry includes a unique Decision ID, Date, Topic, Problem Statement, Options Considered, Final Decision, Technical/Business Rationale, and System Impact.

No decision recorded here may be altered or overwritten silently. Any change or replacement requires explicit founder approval and an updated entry.

---

## Decision Summary Register

| Decision ID |    Date    | Topic                                                      |    Status     | Impact Summary                                                                                                                                               |
| :---------: | :--------: | :--------------------------------------------------------- | :-----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEC-001** | 2026-11-20 | Monorepo Modular Monolith Architecture                     | **Confirmed** | Single monorepo (`student-housing-platform/`); eliminates distributed transaction complexity; enables shared typing.                                         |
| **DEC-002** | 2026-11-20 | Next.js App Router with Bilingual Route Groups             | **Confirmed** | SSR/SSG for SEO, localized routing (`[locale]`), RTL/LTR support, route grouping for public, auth, student, owner, and admin.                                |
| **DEC-003** | 2026-11-20 | NestJS Modular Monolith with 24 Domain Modules             | **Confirmed** | Clear bounded contexts, dependency injection, isolated DTOs, cross-module communication via typed services.                                                  |
| **DEC-004** | 2026-11-20 | PostgreSQL for Relational Integrity & Row-Locking          | **Confirmed** | ACID transactions, explicit `SELECT ... FOR UPDATE` row locks for booking concurrency, strict migration discipline.                                          |
| **DEC-005** | 2026-11-20 | 3 Open Requests & 1 Confirmed Booking Rules                | **Confirmed** | Concurrency guardrails preventing listing hoarding and booking spam while maximizing platform liquidity.                                                     |
| **DEC-006** | 2026-11-20 | Hierarchical Accommodation with Partial Availability       | **Confirmed** | 4-tier tree (Building → Unit → Room → Bed). Booking a sub-unit reserves only that unit without locking parent/siblings.                                      |
| **DEC-007** | 2026-11-20 | Transparent Contact Disclosure upon Booking Request        | **Confirmed** | Mutual immediate disclosure of name, phone, and email upon request submission to facilitate offline viewing.                                                 |
| **DEC-008** | 2026-11-20 | Post-Confirmation Review Qualification & Single Response   | **Confirmed** | Reviews strictly restricted to confirmed bookings; exactly one immutable provider response permitted.                                                        |
| **DEC-009** | 2026-11-21 | Monorepo Workspace & Packaging Architecture                | **Confirmed** | npm workspaces with dual-mode emit (`dist/`) and path mapping preventing circular builds and TS6059 errors.                                                  |
| **DEC-010** | 2026-11-21 | Next.js 14 ESM Configuration & Locale Generation           | **Confirmed** | Standard `next.config.mjs` with SSG/ISR static parameter generation across 71 bilingual route pages.                                                         |
| **DEC-011** | 2026-11-21 | Centralized API Response Envelope & Error Taxonomy         | **Confirmed** | Global `TransformInterceptor` and `HttpExceptionFilter` ensuring unified `ApiResponse<T>` and `ApiErrorResponse`.                                            |
| **DEC-012** | 2026-11-21 | Concurrency Row-Locking & Partial Availability             | **Confirmed** | Concurrency safety via `SELECT FOR UPDATE`; booked portion marked `BOOKED` while sibling portions remain available; competing requests auto-close.           |
| **DEC-013** | 2026-11-21 | Request-Linked Direct Chat & Permanent Retention           | **Confirmed** | 1:1 conversation automatically provisioned upon request submission; permanently preserved even if request cancelled or auto-closed.                          |
| **DEC-014** | 2026-11-21 | Mutual Immediate Contact Transparency                      | **Confirmed** | Name, phone (+20), email immediately disclosed to both parties; student university revealed to provider; private KYC files strictly excluded.                |
| **DEC-015** | 2026-11-21 | Post-Booking Review Eligibility & Single Provider Reply    | **Confirmed** | Reviews restricted strictly to confirmed bookings; duplicate prevention; exactly one rebuttal response permitted per review.                                 |
| **DEC-016** | 2026-11-21 | Immutable Audit Logging Guarded by DB Trigger (BR-ADM-002) | **Confirmed** | AdminActionLog enriched with IP and User Agent; PostgreSQL trigger blocks all UPDATE and DELETE attempts; synchronous logging on all administrative actions. |
| **DEC-017** | 2026-11-21 | Multi-Dimensional Analytics & Periodic Export Engine       | **Confirmed** | Real-time supply/demand, 4-stage booking funnel, occupancy metrics, pricing trends; UTF-8 BOM CSV export for Arabic Excel support and structured JSON.       |

---

## Detailed Decision Records

### DEC-001: Monorepo Modular Monolith Architecture over Microservices

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: System Architecture & Repository Structure
- **Problem Statement**:
  The Egyptian Student Housing Platform requires high reliability, atomic transactions across bookings and availability, shared TypeScript data contracts, rapid feature iteration, and low operational overhead for MVP. We needed to choose an architectural paradigm that satisfies these constraints without premature distributed complexity.
- **Options Considered**:
  - _Option A: Microservices Architecture (Polyglot / Multi-repo)_. Independent services for Auth, Listings, Bookings, Messaging, etc.
  - _Option B: Multi-repo Monoliths_. Separate repositories for frontend and backend.
  - _Option C: Monorepo Modular Monolith (Recommended)_. Single repository (`student-housing-platform/`) with clearly bounded domain modules, shared TypeScript packages, and single deployment artifacts.
- **Final Decision**:
  Adopt Option C: Monorepo Modular Monolith using npm workspaces, containing `apps/web` (Next.js), `apps/api` (NestJS), and shared packages (`packages/shared-types`, `packages/shared-config`, `packages/api-client`, `packages/validation`).
- **Rationale**:
  - `app.txt` (Section 6, Lines 542–546) explicitly states: "Scalable modular monolith... Microservices are explicitly prohibited for MVP."
  - Booking confirmation requires atomic updates across multiple entities (BookingRequest, AgreementConfirmation, Availability, Conversation). In a distributed microservice setup, this would require 2-Phase Commit (2PC) or Sagas, introducing eventual consistency anomalies and distributed locking failures.
  - In a modular monolith, in-process method calls provide microsecond latency, zero serialization overhead, and standard PostgreSQL ACID transaction boundaries.
  - Monorepo tooling allows instantaneous synchronization of API client contracts (`packages/api-client`) and validation schemas (`packages/validation`) across frontend and backend.
- **Impact**:
  - Single CI/CD pipeline and single Docker Compose setup for development.
  - Enforced module boundaries prevent spaghetti dependencies, allowing future extraction into microservices if high-scale demands warrant it.

---

### DEC-002: Next.js App Router for Web Application with Bilingual Route Groups

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Frontend Architecture & Internationalization (i18n)
- **Problem Statement**:
  The frontend must deliver high SEO discoverability for public listing pages, fast initial page loads on mobile networks across Egypt, distinct dashboard layouts for students, property providers, and administrators, and native bilingual support (Egyptian Arabic RTL as primary, English LTR as secondary).
- **Options Considered**:
  - _Option A: Client-Side Single Page Application (Vite + React SPA)_.
  - _Option B: Next.js Pages Router_.
  - _Option C: Next.js App Router with Bilingual Dynamic Locale Route Segments (Recommended)_.
- **Final Decision**:
  Adopt Option C: Next.js App Router (`apps/web`) utilizing `src/app/[locale]/` with route groups: `(public)`, `(auth)`, `(student)/student/`, `(owner)/owner/`, and `(admin)/admin/`.
- **Rationale**:
  - Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR) provide optimal search engine indexing for properties, cities, and universities in Arabic and English.
  - Route groups decouple layout hierarchies without altering clean URL paths.
  - Dynamic `[locale]` parameter enables automatic extraction of locale (`ar-EG` or `en-US`), dynamic setting of `dir="rtl"` or `dir="ltr"`, and localized typography (Cairo / Alexandria for Arabic, Inter for English).
  - React Server Components (RSC) reduce client JavaScript bundle size on mobile devices.
- **Impact**:
  - High SEO ranking for university housing queries across Egypt.
  - Fast page navigation and responsive mobile-first UI for students and property managers.

---

### DEC-003: NestJS Modular Architecture with 24 Discrete Domain Modules

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Backend Architecture & Bounded Contexts
- **Problem Statement**:
  The backend must model 26 conceptual domain entities across authentication, property hierarchy, availability, bookings, agreements, direct messaging, reviews, reports, and administrative auditing. Without strict structural enforcement, monolith codebases rapidly degrade into tightly coupled, unmaintainable code.
- **Options Considered**:
  - _Option A: Express.js with Ad-hoc Controller-Service Folders_.
  - _Option B: Fastify with Plugin Architecture_.
  - _Option C: NestJS with 24 Discrete Domain Modules (Recommended)_.
- **Final Decision**:
  Adopt Option C: NestJS framework (`apps/api`) organized into 24 isolated modules: `auth`, `users`, `students`, `owners`, `universities`, `locations`, `properties`, `units`, `rooms`, `beds`, `pricing`, `availability`, `search`, `booking-requests`, `agreements`, `messaging`, `notifications`, `reviews`, `reports`, `verification`, `support`, `admin`, `analytics`, `platform-settings`.
- **Rationale**:
  - Strict Dependency Injection (DI) allows explicit encapsulation of repositories, services, and controllers.
  - Cross-module operations must go through public exported services, completely forbidding direct queries against private repositories of other modules.
  - Built-in validation pipes using class-validator and Zod guarantee runtime type safety on all HTTP request payloads.
  - Standardized lifecycle hooks and middleware facilitate non-bypassable administrative audit logging and role-based access control (RBAC).
- **Impact**:
  - Predictable project structure matching the domain model catalog defined in `app.txt` and `app2.txt`.
  - Seamless testing via mockable dependencies in Jest.

---

### DEC-004: PostgreSQL for Relational Integrity, Row-Locking, and Strict Schema Migrations

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Database Management System & Transactional Concurrency
- **Problem Statement**:
  The platform manages deeply relational, hierarchical data (Building → Unit → Room → Bed), flexible multi-duration pricing, foreign-key relationships, and high-concurrency booking reservations where two students may simultaneously attempt to confirm the same room. A storage engine with strict relational guarantees and row-level locking is mandatory.
- **Options Considered**:
  - _Option A: MongoDB / NoSQL Document Store_.
  - _Option B: MySQL / MariaDB_.
  - _Option C: PostgreSQL 16+ Relational Database (Recommended)_.
- **Final Decision**:
  Adopt Option C: PostgreSQL 16+ with strict schema definitions, migration version control, foreign key constraints with explicit cascade rules, spatial coordinates support, and atomic transactions using `SELECT ... FOR UPDATE` row locking.
- **Rationale**:
  - Relational integrity: Accommodation hierarchy, KYC documents, user profiles, reviews, and booking records must maintain referential consistency without dangling records.
  - Concurrency safety: PostgreSQL row-level locking ensures that when an agreement confirmation is committed, the target entity is locked during the transaction, preventing race conditions or double bookings.
  - Strict migration requirement: Per `app.txt` Section 15 (Line 1329), all database changes must be versioned through numbered migration scripts; ad-hoc schema modifications are strictly barred.
- **Impact**:
  - Zero double bookings or orphaned records.
  - Full auditability and straightforward automated test fixtures with rolled-back transactions.

---

### DEC-005: 3 Open Requests & 1 Confirmed Booking Concurrency Rules

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Booking Lifecycle & Business Concurrency Rules
- **Problem Statement**:
  In a student housing marketplace, students may submit speculative booking requests across dozens of properties, tying up inventory, generating false demand, and overwhelming property owners. Conversely, holding multiple confirmed leases undermines trust and artificially restricts housing supply.
- **Options Considered**:
  - _Option A: Unlimited Open Requests, Unlimited Confirmed Bookings_.
  - _Option B: Pay-per-Request (Monetized Gating)_.
  - _Option C: Hard Limit of 3 Simultaneous Open Requests & Exactly 1 Confirmed Booking (Recommended)_.
- **Final Decision**:
  Adopt Option C: A student may hold a maximum of 3 active/open booking requests (`PENDING` or `ACCEPTED`) simultaneously across the entire platform. Submitting a 4th request is blocked by backend validation (HTTP 400). Furthermore, a student may hold at most 1 `CONFIRMED` booking. Attempting to confirm a second booking is blocked (HTTP 409 Conflict).
- **Rationale**:
  - Mandated by `app.txt` Section 5.8 (Lines 336–339) and Section 8 (Lines 745–746).
  - Encourages students to carefully select serious accommodation preferences.
  - Prevents owners from waiting on frivolous inquiries.
  - Preserves platform liquidity and fair distribution of available student accommodations.
- **Impact**:
  - Enforced in `BookingRequestsService` within an isolated database check and atomic validation guard.
  - Clear user interface indicators in the student dashboard showing remaining request slots (e.g., "2 of 3 requests active").

---

### DEC-006: Hierarchical Accommodation Model with Partial Availability

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Property Inventory Data Modeling
- **Problem Statement**:
  Student accommodation in Egypt varies widely: from entire residential buildings leased to groups, to full apartments, to private single rooms, to shared rooms with multiple beds. Booking one bed or one room must not erroneously take the entire apartment or building off the market.
- **Options Considered**:
  - _Option A: Flat Listing Model_. Every listing is treated as an independent property without parent-child relations.
  - _Option B: Rigid 2-Tier Unit Model_. Fixed building and apartment entities only.
  - _Option C: 4-Tier Hierarchical Tree with Partial Availability State Engine (Recommended)_.
- **Final Decision**:
  Adopt Option C: 4-tier tree: `Property` (Building) → `PropertyUnit` (Apartment) → `Room` → `Bed`. An availability record is attached to the specific bookable entity level (`target_entity_type` + `target_entity_id`). Booking a bed marks only that bed as `BOOKED`; the parent room, sibling beds, unit, and building remain `AVAILABLE` with adjusted residual capacity.
- **Rationale**:
  - Mandated by `app.txt` Section 5.2 (Lines 208–228) and Section 8 (Lines 739–745).
  - Reflects the real physical reality of student housing in Egyptian university districts (e.g., Dokki, Giza, Nasr City, 6th of October).
  - Maximizes occupancy and rental yield for property owners.
- **Impact**:
  - Database schema supports polymorphic or explicit FK linkage for `Pricing` and `Availability`.
  - Search queries aggregate availability bottom-up to determine if a unit or room still has vacant capacity.

---

### DEC-007: Transparent Contact Disclosure upon Booking Request

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Marketplace Transparency & Communication Boundary
- **Problem Statement**:
  Traditional real estate platforms frequently mask user contact details to force payment intermediation or charge broker fees. The Egyptian Student Housing Platform is a transparent technology facilitator that does not collect rent or broker fees in MVP. Students and owners must coordinate physical viewings easily.
- **Options Considered**:
  - _Option A: Masked / Proxied Phone Numbers_. All calls and messages routed through an expensive telephony proxy.
  - _Option B: Contact Details Gated Behind Confirmed Agreement_.
  - _Option C: Immediate Mutual Contact Disclosure upon Booking Request Submission (Recommended)_.
- **Final Decision**:
  Adopt Option C: As soon as a student submits a valid booking request for a property, the system reveals the student's name, verified phone number, and email to the owner, and reveals the owner's name, phone number, and email to the student. External offline communication is explicitly permitted.
- **Rationale**:
  - Mandated by `app.txt` Section 5.11 (Lines 387–396).
  - Students and owners in Egypt strongly prefer direct phone/WhatsApp contact to confirm viewing times and ask practical questions.
  - Private KYC documents (National ID photos, ownership title deeds) remain strictly private and accessible only to superadmins.
- **Impact**:
  - Contact cards render automatically in the request view and messaging screen.
  - High user trust and low friction in scheduling physical property inspections.

---

### DEC-008: Post-Confirmation Review Qualification with Single Owner Response

- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Topic**: Trust, Safety & Reputation Management
- **Problem Statement**:
  Unregulated review systems on classifieds and rental websites suffer from fake reviews, competitor sabotage, extortion, and flame wars. Reviews must reflect genuine tenant experiences, while owners must have a fair right of reply without degenerating into infinite public arguments.
- **Options Considered**:
  - _Option A: Open Reviews for Any Registered User_.
  - _Option B: Reviews Permitted After Physical Viewing_.
  - _Option C: Reviews Strictly Qualified by Confirmed Booking + Exactly One Provider Response (Recommended)_.
- **Final Decision**:
  Adopt Option C: Only users with a `CONFIRMED` booking agreement are eligible to submit a review (1–5 star rating + text review). Attending an informal viewing without an agreement does not qualify. The reviewed party (owner/property) is permitted to publish exactly one response. Multiple responses or follow-up arguments are prevented by schema constraints.
- **Rationale**:
  - Mandated by `app.txt` Section 5.13 (Lines 410–428).
  - Eliminates fake reviews from users who never stayed at the property.
  - A single formal response gives the property manager an official voice to clarify issues while preventing harassment and flame wars.
- **Impact**:
  - `ReviewsService` validates that `AgreementConfirmation.status === 'CONFIRMED'` before allowing review creation.
  - Database unique index `(booking_request_id, reviewer_id)` prevents duplicate reviews.
  - Database unique constraint on `ReviewResponse(review_id)` enforces the single-response invariant.

---

### DEC-009: Monorepo Workspace & Packaging Architecture

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Monorepo Scaffolding, Package Linking & TypeScript Emit Strategy
- **Problem Statement**:
  In a TypeScript monorepo with multiple shared libraries (`@repo/shared-types`, `@repo/validation`, `@repo/api-client`) consumed by frontend (`apps/web`) and backend (`apps/api`), cross-package imports can trigger TypeScript `rootDir` boundary violations (`TS6059`) if source files are directly referenced, or runtime errors if declaration maps and CommonJS/ESM modules are mismatched.
- **Options Considered**:
  - _Option A: Zero-build source references (no dist emit)_. All packages consume `.ts` files directly via path aliases.
  - _Option B: Complex build tools (Turborepo / Nx / Lerna)_. Introduces external tooling dependencies not present on host.
  - _Option C: Native npm Workspaces with Typed Dist Emits & Configured Path Mapping (Recommended)_.
- **Final Decision**:
  Adopt Option C: Shared packages emit compiled `.js` and declaration `.d.ts` files into their respective `dist/` directories upon build. `package.json` references `dist/index.js` and `dist/index.d.ts`. Applications and dependent packages reference the declarations, avoiding `rootDir` leakage while allowing standard npm workspaces symlinking.
- **Rationale**:
  - Guarantees zero `TS6059` compilation errors.
  - Requires zero third-party global CLIs; functions natively with Node 24 and npm 11.
  - Deterministic build ordering (`build:packages && build:apps`) in root `package.json`.
- **Impact**:
  - All packages and applications type-check with 0 diagnostic errors (`npm run type-check`).
  - Production builds (`npm run build`) execute cleanly from root.

---

### DEC-010: Next.js 14 ESM Configuration & Locale Generation

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Frontend Build Configuration & Bilingual Route Groups
- **Problem Statement**:
  Next.js 14 requires `next.config.mjs` or `next.config.js` for configuration parsing. The frontend must statically generate 71 distinct pages across Arabic (`ar`) and English (`en`) for public, authentication, student, owner, and administrator routes.
- **Options Considered**:
  - _Option A: TypeScript next.config.ts (unsupported in Next.js 14 without experimental flags)_.
  - _Option B: CommonJS next.config.js_.
  - _Option C: ES Module next.config.mjs with Static Locale Params (Recommended)_.
- **Final Decision**:
  Adopt Option C: Use `next.config.mjs` with `transpilePackages` for all `@repo/*` packages, remote pattern configurations for Cloudinary, and explicit `generateStaticParams()` returning `[{ locale: 'ar' }, { locale: 'en' }]` across root layout routes.
- **Rationale**:
  - Standard ESM module resolution in Next.js 14.
  - Clean prerendering of all 71 route endpoints at build time (SSG).
  - RTL direction automatically resolved for `ar` and LTR for `en`.
- **Impact**:
  - `apps/web` builds into production bundles with 0 compilation errors and all route trees verified.

---

### DEC-011: Centralized API Response Envelope & Error Taxonomy

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Backend API Contract Consistency & Error Standardization
- **Problem Statement**:
  A modular monolith with 24 domain modules requires uniform HTTP responses and error payloads so that the frontend SDK (`@repo/api-client`) can reliably parse and display feedback without per-endpoint custom handling.
- **Options Considered**:
  - _Option A: Raw controller returns (unwrapped)_.
  - _Option B: Manual controller wrapping in each endpoint_.
  - _Option C: Global NestJS TransformInterceptor & HttpExceptionFilter (Recommended)_.
- **Final Decision**:
  Adopt Option C: Implement global `TransformInterceptor` that wraps all successful responses into `ApiResponse<T>` with `statusCode`, `message`, `data`, and `meta` (timestamp, path, version). Implement global `HttpExceptionFilter` that intercepts all exceptions and emits standardized `ApiErrorResponse` with HTTP status code, error type, message/array, path, timestamp, and validation details.
- **Rationale**:
  - Enforces contract compliance across all 24 domain modules automatically.
  - Seamlessly integrates with class-validator and Zod validation errors.
  - Provides uniform Swagger documentation for REST consumers.
- **Impact**:
  - Standardized REST envelopes across `/api/v1/*`.
  - Type-safe unwrapping in `@repo/api-client`.

---

### DEC-012: Concurrency Row-Locking & Partial Availability Preservation

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Booking Concurrency & Accommodation Hierarchy State Machine
- **Problem Statement**:
  Simultaneous booking confirmations by multiple students targeting the same portion or overlapping units could lead to double-booking anomalies. Furthermore, booking an individual bed or room must not render the parent apartment or building unavailable.
- **Options Considered**:
  - _Option A: Optimistic locking with version counters alone_.
  - _Option B: Pessimistic locking via Redis distributed mutex_.
  - _Option C: PostgreSQL `SELECT FOR UPDATE` row locks with partial availability state enforcement (Recommended)_.
- **Final Decision**:
  Adopt Option C: During bilateral confirmation, execute atomic row locking via `SELECT ... FROM availabilities WHERE entity_type = $1 AND entity_id = $2 FOR UPDATE`. Mark strictly the targeted portion as `BOOKED`. Sibling rooms/beds remain `AVAILABLE`. Automatically transition competing pending or accepted requests on the exact portion to `CLOSED_CONFLICT`.
- **Rationale**:
  - Eliminates race conditions in high-concurrency student application rushes without introducing third-party caching dependencies.
  - Aligns with business rule `BR-AGR-002` prohibiting over-locking of parent buildings or sibling beds.
  - Auto-closing competing requests (`BR-AGR-003`) prevents stale requests from blocking student quotas.
- **Impact**:
  - Zero double-booking vulnerability.
  - Competing students are immediately notified and their 3-request quota slot is freed.

---

### DEC-013: Request-Linked Direct Chat & Permanent Retention

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: In-App Messaging Lifecycle & Audit Trail
- **Problem Statement**:
  Students and property owners require a direct 1:1 communication channel tied to their booking inquiries. If a request is cancelled or closed due to conflict, deleting the conversation would erase the communication trail and dispute evidence.
- **Options Considered**:
  - _Option A: Temporary chat session that closes on request resolution_.
  - _Option B: General user-to-user chat independent of booking requests_.
  - _Option C: 1:1 request-linked conversation with permanent retention (Recommended)_.
- **Final Decision**:
  Adopt Option C: Automatically create a conversation thread bound to `booking_request_id` upon request creation. Retain the conversation permanently in the database even if the booking request transitions to `CANCELLED`, `REJECTED`, or `CLOSED_CONFLICT`.
- **Rationale**:
  - Direct request linkage (`BR-MSG-001`) ensures context is preserved for both parties.
  - Permanent retention (`BR-MSG-002`) provides an unalterable audit trail for moderation and dispute resolution.
  - Participants retain read and send access post-cancellation.
- **Impact**:
  - Immutable conversation history accessible to authorized participants and platform administrators.

---

### DEC-014: Mutual Immediate Contact Transparency

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Privacy & Communication Policy
- **Problem Statement**:
  Students in Egypt require swift offline inspection and phone coordination before signing contracts, but sensitive identity documents (National ID, Title Deeds) must remain confidential.
- **Options Considered**:
  - _Option A: Hide contact info until contract confirmation_.
  - _Option B: Reveal contact info and verification documents upon request_.
  - _Option C: Immediate mutual contact disclosure (Name, Phone, Email, University) while strictly isolating KYC documents (Recommended)_.
- **Final Decision**:
  Adopt Option C: Immediately upon booking request creation, reveal student name, phone (+20), email, and university to the owner; reveal owner name, phone (+20), and email to the student. Sensitive KYC verification files are strictly isolated and never exposed.
- **Rationale**:
  - Accelerates offline inspection scheduling (`BR-BKG-003`, `BR-CNT-001`, `F23`).
  - Strict ACL protection prevents unauthorized access to private legal documents.
- **Impact**:
  - High trust and rapid offline coordination with zero KYC privacy exposure.

---

### DEC-015: Post-Confirmed Booking Review Qualification & Single Owner Reply

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Platform Trust, Reputation & Review Integrity
- **Problem Statement**:
  Online reviews are susceptible to fake reviews, review bombing, or unverified claims by non-tenants.
- **Options Considered**:
  - _Option A: Open public reviews for any registered user_.
  - _Option B: Post-visit reviews without booking verification_.
  - _Option C: Strict post-confirmed booking qualification with single owner rebuttal (Recommended)_.
- **Final Decision**:
  Adopt Option C: A student can only review a property after holding a `CONFIRMED` booking for that property (`BR-REV-001`). Enforce a unique database constraint on `(booking_request_id, student_id)` to prevent duplicate reviews (`BR-REV-002`). The property owner is permitted exactly one rebuttal response (`BR-REV-003`).
- **Rationale**:
  - Guarantees 100% verified tenant authenticity.
  - Eliminates fake reviews and review bribery.
  - Provides a fair, balanced mechanism for owners to respond to tenant feedback.
- **Impact**:
  - High-integrity reputation system establishing market confidence for students and parents.

---

### DEC-016: Immutable Administrative Action Audit Logging Guarded by PostgreSQL Trigger

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Regulatory Compliance, Audit Integrity & Security Governance
- **Problem Statement**:
  Administrative actions (approving/rejecting KYC documents, approving or suspending property listings, suspending or reactivating user accounts, and modifying platform parameters) require guaranteed immutability. If an audit log could be modified or deleted by an administrator or malicious actor, forensic integrity would be compromised (`BR-ADM-002`).
- **Options Considered**:
  - _Option A: Application-level check only (NestJS service-level prevent delete)_.
  - _Option B: Append-only ledger in an external cloud service_.
  - _Option C: PostgreSQL Trigger Guard (`trg_protect_admin_action_logs`) raising `ERR_IMMUTABLE_LOG_MODIFICATION` on any `UPDATE` or `DELETE` query (Recommended)_.
- **Final Decision**:
  Adopt Option C: Migration `004_m5_admin_audit_analytics.sql` creates a database trigger that rejects all `UPDATE` or `DELETE` operations on `admin_action_logs`. Enrich `admin_action_logs` with `ip_address` and `user_agent`. Synchronously log all administrative actions in `AdminService` and `PlatformSettingsService`.
- **Rationale**:
  - Direct database trigger guarantee cannot be bypassed even by raw SQL queries in the database shell.
  - Satisfies `BR-ADM-002`, `docs/database/database-schema.md` (Table 25), and `docs/api/error-handling.md`.
  - Captures complete before/after state diffs and client IP addresses for auditing.
- **Impact**:
  - Write-only tamper-evident audit trail for all platform management operations.

---

### DEC-017: Multi-Dimensional Analytics Engine & Periodic Export Engine

- **Date**: 2026-11-21
- **Status**: **CONFIRMED**
- **Topic**: Business Intelligence, Platform Observability & Data Export
- **Problem Statement**:
  The platform leadership requires real-time observability across 4 operational pillars (User demographics, property inventory and occupancy, 4-stage booking funnel, and trust/safety metrics) as well as periodic export capabilities that correctly render Egyptian Arabic characters in tools like Microsoft Excel.
- **Options Considered**:
  - _Option A: Static daily cron job generating pre-rendered files_.
  - _Option B: Real-time dual-mode dynamic aggregation engine with UTF-8 BOM CSV and JSON export endpoints (Recommended)_.
- **Final Decision**:
  Adopt Option B: Implement `AnalyticsService` and `AnalyticsController` supporting `/analytics/overview`, `/analytics/cities`, `/analytics/pricing-trends`, `/analytics/funnel`, `/analytics/trust-safety`, and `/analytics/export`. Export engine prepends UTF-8 BOM (`\uFEFF`) to CSV files and localized Arabic/English column headers.
- **Rationale**:
  - Supports live operational decisions without batch latency.
  - Dual-mode architecture runs efficiently on live PostgreSQL and gracefully falls back in isolated testing environments.
  - UTF-8 Byte Order Mark ensures Microsoft Excel displays Arabic text properly without encoding artifacts.
- **Impact**:
  - Full observability of platform liquidity, conversion rates, and supply/demand dynamics across Egyptian universities.

---

### DEC-018: Production Multi-Stage Containerization & Standalone Bundling

- **Date**: 2026-11-22
- **Status**: **CONFIRMED**
- **Topic**: Production Containerization, Docker Security & Next.js Standalone Optimization
- **Problem Statement**:
  Monorepo Docker images often suffer from massive image sizes (>1.5 GB), host file leakage (Windows binaries into Linux containers), dangling symlinks for `@repo/*` workspace packages, and security risks from running as root (`uid 0`).
- **Options Considered**:
  - _Option A: Single-stage Dockerfile copying host node_modules_.
  - _Option B: Multi-stage Dockerfile with standard `next start` (large ~1.2GB image)_.
  - _Option C: Multi-stage Alpine images with native build tooling, pruned production dependencies, non-root users (`nestjs` / `nextjs`), and Next.js standalone output (Recommended)_.
- **Final Decision**:
  Adopt Option C:
  - Add root `.dockerignore` excluding local node_modules, build caches, git, and logs.
  - Enable `output: 'standalone'` in `apps/web/next.config.mjs` reducing Next.js container footprint to ~120MB.
  - Build `Dockerfile.api` on Node 20 LTS Alpine with `python3 make g++` in `deps` stage for native compilation (`bcrypt`), pruned production modules, non-root user `nestjs` (uid 1001), and dynamic startup script.
  - Configure `docker-compose.yml` with healthchecks, volume persistence, migration bootstrapping, and isolated network bridge.
- **Rationale**:
  - Eliminates host binary contamination and broken workspace symlinks.
  - Minimizes container attack surface and enforces principle of least privilege (non-root execution).
  - Produces lean, production-grade container images ready for cloud deployment.
- **Impact**:
  - Verified Docker assets ready for GitHub Container Registry publication and Kubernetes/Compose deployment.

---

### DEC-019: Multi-Tier Health Observability & Real-Time Connection Probes

- **Date**: 2026-11-22
- **Status**: **CONFIRMED**
- **Topic**: Health Telemetry, Observability & Container Orchestration Probes
- **Problem Statement**:
  Container orchestrators (Kubernetes, Docker Compose, AWS ECS) require separate probes for process liveness (is the event loop responsive?) versus readiness (is the database connection pool ready to serve traffic?), as well as detailed system telemetry for observability dashboards.
- **Options Considered**:
  - _Option A: Single static `/health` endpoint returning 200 OK without dependencies_.
  - _Option B: Heavy external APM agent without native REST endpoints_.
  - _Option C: Three-tier native telemetry (`/health`, `/health/liveness`, `/health/readiness`) with live database ping, latency tracking, uptime formatting, and memory metrics (Recommended)_.
- **Final Decision**:
  Adopt Option C: Implement `HealthController` with:
  - `GET /health/liveness`: Fast process responsiveness probe without external dependencies.
  - `GET /health/readiness`: Database connectivity probe returning 503 if the connection pool is unresponsive.
  - `GET /health`: Comprehensive system telemetry including status (`ok` | `degraded` | `down`), database latency in ms, formatted uptime string, and process memory breakdown (`heapUsed`, `heapTotal`, `rss`).
- **Rationale**:
  - Prevents premature container restart loops during transient database maintenance.
  - Enables zero-downtime rolling updates by ensuring traffic is routed only to ready pods.
  - Conforms to modern cloud-native observability standards.
- **Impact**:
  - Full operational visibility for SRE teams and container orchestrators.

---

### DEC-020: Automated Database Backup & Disaster Recovery with Cryptographic Verification

- **Date**: 2026-11-22
- **Status**: **CONFIRMED**
- **Topic**: Disaster Recovery, Business Continuity & Automated Data Protection
- **Problem Statement**:
  Operational data protection requires automated database backups, data retention pruning to prevent disk exhaustion, pre-flight safety prompts for destructive restores, and cryptographic integrity verification to detect archive corruption.
- **Options Considered**:
  - _Option A: Manual SQL dump commands executed in terminal without automation_.
  - _Option B: Cloud-only vendor proprietary snapshots without local tooling_.
  - _Option C: Cross-platform automated backup and restore toolchain (`.sh` and `.ps1`) with `-Fc` compressed archives, SHA256 verification, 7-day automated pruning, and Docker fallback (Recommended)_.
- **Final Decision**:
  Adopt Option C: Create `scripts/database/backup.sh`, `restore.sh`, `backup.ps1`, `restore.ps1` (and `infrastructure/database/` mirrors). The scripts utilize `pg_dump -F c` compressed archive format, generate `.sha256` checksum files, automatically delete snapshots older than 7 days, require explicit typed confirmation (`CONFIRM`) on restore, and fall back to Docker `student_housing_db` if local client tools are absent.
- **Rationale**:
  - Fulfills `docs/architecture/infrastructure.md` Section 6.3 disaster recovery SLA (RTO < 30m, RPO < 24h).
  - Custom archive format allows parallel restore, selective table restoration, and clean overwrites (`--clean --if-exists`).
  - Cross-platform support ensures seamless operation on Windows development environments and Linux CI/CD runners.
- **Impact**:
  - Automated, verifiable disaster recovery readiness.

---

### DEC-021: Defense-in-Depth API Security: Reverse-Proxy IP Tracking & Formula Injection Neutralization

- **Date**: 2026-11-22
- **Status**: **CONFIRMED**
- **Topic**: Application Security, OWASP CWE-1236 & Audit Trail Integrity
- **Problem Statement**:
  1. Operating behind reverse proxies (NGINX, Cloudflare, Docker network bridge) causes `req.ip` to resolve to the gateway IP, corrupting IP rate limits and administrative audit logs.
  2. Public administrative routes could be accessed without authentication if guards are not explicitly configured.
  3. Exporting CSV analytics reports containing user-supplied strings could expose spreadsheet users to Formula Injection / CSV Injection attacks (OWASP CWE-1236).
- **Options Considered**:
  - _Option A: Defer security hardening to post-launch infrastructure layer_.
  - _Option B: Code-level defense-in-depth across controllers, proxy configurations, and data exporters (Recommended)_.
- **Final Decision**:
  Adopt Option B:
  - Add `app.set('trust proxy', 1)` in `apps/api/src/main.ts` for accurate client IP resolution from `X-Forwarded-For`.
  - Apply `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ADMIN)` to all administrative endpoints (`/admin/kyc/:userId/approve`, `/admin/properties/:propertyId/approve`, `/admin/metrics`).
  - Implement `sanitizeCsvCell()` in `AnalyticsService` prefixing formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) with an apostrophe (`'`) and escaping quotes.
- **Rationale**:
  - Prevents IP spoofing while guaranteeing valid client IPs in `admin_action_logs`.
  - Enforces strict RBAC across every administrative mutation.
  - Fully neutralizes OWASP CWE-1236 formula injection in spreadsheet software.
- **Impact**:
  - Hardened API perimeter and robust regulatory audit compliance.
