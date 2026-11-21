# DECISION REGISTER (سجل القرارات)

## Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

This document serves as the formal, persistent decision register for all major architectural, engineering, and product decisions. Per **Section 14 of `app.txt`**, every entry includes a unique Decision ID, Date, Topic, Problem Statement, Options Considered, Final Decision, Technical/Business Rationale, and System Impact.

No decision recorded here may be altered or overwritten silently. Any change or replacement requires explicit founder approval and an updated entry.

---

## Decision Summary Register

| Decision ID |    Date    | Topic                                                    |    Status     | Impact Summary                                                                                                                |
| :---------: | :--------: | :------------------------------------------------------- | :-----------: | :---------------------------------------------------------------------------------------------------------------------------- |
| **DEC-001** | 2026-11-20 | Monorepo Modular Monolith Architecture                   | **Confirmed** | Single monorepo (`student-housing-platform/`); eliminates distributed transaction complexity; enables shared typing.          |
| **DEC-002** | 2026-11-20 | Next.js App Router with Bilingual Route Groups           | **Confirmed** | SSR/SSG for SEO, localized routing (`[locale]`), RTL/LTR support, route grouping for public, auth, student, owner, and admin. |
| **DEC-003** | 2026-11-20 | NestJS Modular Monolith with 24 Domain Modules           | **Confirmed** | Clear bounded contexts, dependency injection, isolated DTOs, cross-module communication via typed services.                   |
| **DEC-004** | 2026-11-20 | PostgreSQL for Relational Integrity & Row-Locking        | **Confirmed** | ACID transactions, explicit `SELECT ... FOR UPDATE` row locks for booking concurrency, strict migration discipline.           |
| **DEC-005** | 2026-11-20 | 3 Open Requests & 1 Confirmed Booking Rules              | **Confirmed** | Concurrency guardrails preventing listing hoarding and booking spam while maximizing platform liquidity.                      |
| **DEC-006** | 2026-11-20 | Hierarchical Accommodation with Partial Availability     | **Confirmed** | 4-tier tree (Building → Unit → Room → Bed). Booking a sub-unit reserves only that unit without locking parent/siblings.       |
| **DEC-007** | 2026-11-20 | Transparent Contact Disclosure upon Booking Request      | **Confirmed** | Mutual immediate disclosure of name, phone, and email upon request submission to facilitate offline viewing.                  |
| **DEC-008** | 2026-11-20 | Post-Confirmation Review Qualification & Single Response | **Confirmed** | Reviews strictly restricted to confirmed bookings; exactly one immutable provider response permitted.                         |
| **DEC-009** | 2026-11-21 | Monorepo Workspace & Packaging Architecture              | **Confirmed** | npm workspaces with dual-mode emit (`dist/`) and path mapping preventing circular builds and TS6059 errors.                   |
| **DEC-010** | 2026-11-21 | Next.js 14 ESM Configuration & Locale Generation         | **Confirmed** | Standard `next.config.mjs` with SSG/ISR static parameter generation across 71 bilingual route pages.                          |
| **DEC-011** | 2026-11-21 | Centralized API Response Envelope & Error Taxonomy       | **Confirmed** | Global `TransformInterceptor` and `HttpExceptionFilter` ensuring unified `ApiResponse<T>` and `ApiErrorResponse`.             |

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
