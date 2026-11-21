# ARCHITECTURAL & PRODUCT DECISION LOG

## Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

- **Location**: `docs/decisions/decision-log.md`
- **Synchronization**: Fully synchronized with workspace root [`DECISIONS.md`](../../DECISIONS.md)
- **Governance**: Managed per **Section 14 of `app.txt`** (No silent overwrites; changes require explicit founder approval)
- **Last Updated**: 2026-11-20T23:30:00Z

---

## 1. Decision Governance & Change Management Protocol

Every architectural, engineering, and product decision in this repository is governed by the following rules:

1. **Source of Truth**: This decision log and the root `DECISIONS.md` file constitute the immutable source of truth for architectural invariants.
2. **Standard Structure**: Every decision must be cataloged with:
   - **Decision ID** (e.g., `DEC-001`)
   - **Date** (ISO format)
   - **Topic**
   - **Status** (`Proposed`, `Confirmed`, `Superseded`)
   - **Problem Statement**
   - **Options Considered** (with explicit evaluation)
   - **Final Decision**
   - **Technical & Business Rationale**
   - **System Impact**
   - **Related ADR** (pointer to `architecture-decision-records/ADR-xxx.md`)
3. **No Silent Overwrites**: Decisions cannot be modified simply because an implementation faces difficulty. If an approved decision must be superseded:
   - The conflict or challenge must be documented.
   - Alternatives and trade-offs must be presented to the founder.
   - The old decision is marked `Superseded` with a pointer to the new decision ID upon founder confirmation.

---

## 2. Decision Master Index

|     ID      |    Date    | Category           | Title                                                    |    Status     | ADR Reference                                                                  |
| :---------: | :--------: | :----------------- | :------------------------------------------------------- | :-----------: | :----------------------------------------------------------------------------- |
| **DEC-001** | 2026-11-20 | Architecture       | Monorepo Modular Monolith Architecture                   | **Confirmed** | [ADR-001](architecture-decision-records/ADR-001-modular-monolith.md)           |
| **DEC-002** | 2026-11-20 | Frontend           | Next.js App Router with Bilingual Route Groups           | **Confirmed** | [ADR-002](architecture-decision-records/ADR-002-frontend-nextjs-app-router.md) |
| **DEC-003** | 2026-11-20 | Backend            | NestJS Modular Monolith with 24 Domain Modules           | **Confirmed** | [ADR-003](architecture-decision-records/ADR-003-backend-nestjs.md)             |
| **DEC-004** | 2026-11-20 | Database           | PostgreSQL for Relational Integrity & Concurrency        | **Confirmed** | [ADR-004](architecture-decision-records/ADR-004-database-postgresql.md)        |
| **DEC-005** | 2026-11-20 | Product / Business | 3 Open Requests & 1 Confirmed Booking Rules              | **Confirmed** | N/A (Product Invariant)                                                        |
| **DEC-006** | 2026-11-20 | Data Modeling      | Hierarchical Accommodation with Partial Availability     | **Confirmed** | [ADR-004](architecture-decision-records/ADR-004-database-postgresql.md)        |
| **DEC-007** | 2026-11-20 | Product / UX       | Transparent Contact Disclosure upon Booking Request      | **Confirmed** | N/A (Product Invariant)                                                        |
| **DEC-008** | 2026-11-20 | Trust & Safety     | Post-Confirmation Review Qualification & Single Response | **Confirmed** | N/A (Product Invariant)                                                        |

---

## 3. Comprehensive Decision Records

### DEC-001: Monorepo Modular Monolith Architecture over Microservices

- **Decision ID**: `DEC-001`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: System Architecture
- **Problem Statement**:
  The Egyptian Student Housing Platform requires shared TypeScript types between frontend and backend, atomic database transactions for booking reservations, high execution speed, and minimal DevOps maintenance overhead for MVP. We needed to choose between a microservices architecture, a distributed multi-repo architecture, or a unified monorepo modular monolith.
- **Options Considered**:
  - _Option 1: Microservices Architecture_. Each business capability (Auth, Listings, Bookings, Messaging) deployed as an autonomous service with independent databases.
  - _Option 2: Polyglot Multi-Repo_. Separate git repositories for React frontend and backend services.
  - _Option 3: Monorepo Modular Monolith (Selected)_. Single repository (`student-housing-platform/`) with clearly bounded internal modules in NestJS and Next.js, orchestrated via npm workspaces.
- **Final Decision**:
  Adopt a Monorepo Modular Monolith. All frontend applications, backend services, shared packages, and infrastructure definitions reside in a single repository with strict modular boundaries.
- **Rationale**:
  - `app.txt` Section 6 (Lines 542–546) states explicitly: "Scalable modular monolith... Microservices are explicitly prohibited for MVP."
  - Avoids distributed network latency and failure modes.
  - Eliminates the need for complex distributed transaction managers (Sagas or 2-Phase Commit) during booking agreements where booking status, availability state, and conversation records must update simultaneously.
  - Allows instant end-to-end type safety between `packages/shared-types`, `apps/api`, and `apps/web`.
- **System Impact**:
  - Rapid local setup with a single Docker Compose configuration.
  - Clear architectural path: if a specific domain module (e.g., messaging or search) requires independent scaling in the future, its strict interface allows straightforward extraction into a microservice.
- **ADR Reference**: [`ADR-001-modular-monolith.md`](architecture-decision-records/ADR-001-modular-monolith.md)

---

### DEC-002: Next.js App Router for Web Application with Bilingual Route Groups

- **Decision ID**: `DEC-002`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Frontend Architecture & Internationalization
- **Problem Statement**:
  The frontend must deliver top-tier search engine visibility (SEO) in Egypt for university student housing searches, fast rendering on 3G/4G mobile networks, distinct layouts for three authenticated user roles (Students, Property Providers, Administrators), and seamless bilingual support (Egyptian Arabic RTL primary, English LTR secondary).
- **Options Considered**:
  - _Option 1: Single Page Application (SPA with Vite + React)_. Simple client-side routing, but poor initial SEO and heavy initial JS payloads for mobile users.
  - _Option 2: Next.js Pages Router_. Established SSR/SSG model, but lacks modern nested layouts and React Server Components.
  - _Option 3: Next.js App Router with Route Groups and Dynamic Locale Segments (Selected)_. Next.js 14+ with `src/app/[locale]/` root and nested route groups.
- **Final Decision**:
  Adopt Next.js App Router with dynamic locale routing (`[locale]`) and logical route groups:
  - `(public)`: Landing, search, property details, static information.
  - `(auth)`: Login, registration, OTP verification, onboarding.
  - `(student)/student/`: Student dashboard, booking requests, messaging, reviews.
  - `(owner)/owner/`: Property provider dashboard, listing management, KYC uploads.
  - `(admin)/admin/`: Platform administrator moderation, audit logs, analytics.
- **Rationale**:
  - Server-Side Rendering (SSR) ensures property listing pages and university landing pages are completely indexed by Google in Arabic and English.
  - Route groups isolate layouts without adding redundant path prefixes to URLs.
  - Native RTL/LTR support handled cleanly at the root layout via dynamic `dir` attribute and Tailwind CSS logical properties (`start`, `end`, `ms`, `me`).
- **System Impact**:
  - High performance on mobile devices due to React Server Components streaming.
  - Clean separation of UI concerns across user personas.
- **ADR Reference**: [`ADR-002-frontend-nextjs-app-router.md`](architecture-decision-records/ADR-002-frontend-nextjs-app-router.md)

---

### DEC-003: NestJS Modular Architecture with 24 Discrete Domain Modules

- **Decision ID**: `DEC-003`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Backend Architecture & Domain Modeling
- **Problem Statement**:
  The backend must encapsulate 26 conceptual entities across 14 functional phases. An unopinionated framework often leads to circular dependencies, tight coupling, and difficult unit testing.
- **Options Considered**:
  - _Option 1: Express.js with custom folder conventions_. Lightweight, but lacks standardized dependency injection and architecture enforcement.
  - _Option 2: Fastify standalone_. High throughput, but lacks enterprise module organization.
  - _Option 3: NestJS with 24 Discrete Domain Modules (Selected)_. Highly structured TypeScript framework with Inversion of Control (IoC), Dependency Injection (DI), and lifecycle interceptors.
- **Final Decision**:
  Adopt NestJS (`apps/api`) organized into 24 isolated modules matching the domain model: `auth`, `users`, `students`, `owners`, `universities`, `locations`, `properties`, `units`, `rooms`, `beds`, `pricing`, `availability`, `search`, `booking-requests`, `agreements`, `messaging`, `notifications`, `reviews`, `reports`, `verification`, `support`, `admin`, `analytics`, `platform-settings`.
- **Rationale**:
  - Directly fulfills the module specification detailed in `app.txt` (Section 6, Lines 587–625) and `app2.txt`.
  - Modules interact only through injected services; direct cross-boundary database manipulation is prohibited.
  - Standardized validation pipes automatically enforce Zod and DTO schemas on all incoming requests.
- **System Impact**:
  - Consistent architecture across all backend features.
  - Highly testable codebase with isolated unit tests and integration tests.
- **ADR Reference**: [`ADR-003-backend-nestjs.md`](architecture-decision-records/ADR-003-backend-nestjs.md)

---

### DEC-004: PostgreSQL for Relational Integrity, Row-Locking, and Strict Schema Migrations

- **Decision ID**: `DEC-004`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Database Management System
- **Problem Statement**:
  The platform data model involves deep hierarchical relationships (Property → Unit → Room → Bed), polymorphic pricing structures, foreign keys across profiles, and critical concurrency scenarios (preventing double booking of a single bed).
- **Options Considered**:
  - _Option 1: Document Database (MongoDB)_. Flexible schema, but lacks ACID multi-document row-level locking and relational foreign key constraints.
  - _Option 2: MySQL / MariaDB_. Relational database, but weaker spatial features and less robust handling of complex composite types.
  - _Option 3: PostgreSQL 16+ (Selected)_. Enterprise-grade relational database with strict ACID guarantees, explicit row-level locking (`SELECT ... FOR UPDATE`), and PostGIS spatial capabilities.
- **Final Decision**:
  Adopt PostgreSQL 16+ as the primary transactional database, with strict schema migration management and explicit row-level locking inside booking confirmation transactions.
- **Rationale**:
  - Guarantees zero double bookings during concurrent student agreement confirmations.
  - Foreign key cascades and referential constraints safeguard data integrity across the 26 conceptual entities.
  - Numbered migration files guarantee deterministic database evolution across development, staging, and production.
- **System Impact**:
  - Rock-solid data consistency and transactional integrity.
  - Simple local setup via Docker Compose.
- **ADR Reference**: [`ADR-004-database-postgresql.md`](architecture-decision-records/ADR-004-database-postgresql.md)

---

### DEC-005: 3 Open Requests & 1 Confirmed Booking Concurrency Rules

- **Decision ID**: `DEC-005`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Product & Business Rules
- **Problem Statement**:
  Unrestricted booking requests lead to students spamming dozens of property owners, creating artificial demand spikes, causing owners to reserve units for non-committal leads, and degrading overall platform credibility.
- **Options Considered**:
  - _Option 1: Uncapped Booking Requests_.
  - _Option 2: Pay-Per-Request Monetization_.
  - _Option 3: Platform Guardrail: Max 3 Open Requests & Max 1 Confirmed Booking (Selected)_.
- **Final Decision**:
  Enforce a hard limit of **maximum 3 simultaneous open requests** (`PENDING` or `ACCEPTED`) per student across the entire platform. Additionally, enforce **maximum 1 confirmed booking** (`CONFIRMED`) per student.
- **Rationale**:
  - Explicitly mandated by `app.txt` Section 5.8 (Lines 336–339) and Section 8 (Lines 745–746).
  - Keeps students focused on genuine housing opportunities.
  - Provides property providers with high-confidence leads.
- **System Impact**:
  - Validation guards in `BookingRequestsService` reject 4th open requests with HTTP 400 Bad Request.
  - Agreement confirmation service rejects second confirmation attempts with HTTP 409 Conflict.

---

### DEC-006: Hierarchical Accommodation Model with Partial Availability

- **Decision ID**: `DEC-006`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Domain Modeling & Inventory Management
- **Problem Statement**:
  Student accommodation in Egypt is diverse: owners lease entire buildings, individual apartments, private rooms, or single beds in shared dorm-style rooms. If booking a single bed renders the entire apartment unavailable, property owners lose substantial revenue.
- **Options Considered**:
  - _Option 1: Flat Listing Catalog_. Every listing is a disconnected entity.
  - _Option 2: Rigid Apartment-Only Model_. Only full apartments can be booked.
  - _Option 3: 4-Tier Hierarchical Model with Partial Availability (Selected)_. Building → Unit → Room → Bed.
- **Final Decision**:
  Adopt a 4-tier hierarchical inventory model: `Property` (Building) → `PropertyUnit` (Apartment) → `Room` → `Bed`. Availability state is tracked at the specific bookable entity level. Booking an individual bed updates only that bed's availability status to `BOOKED`, recalculates the parent room and unit available capacity, and leaves sibling beds and units available for other students.
- **Rationale**:
  - Directly matches `app.txt` Section 5.2 (Lines 208–228) and Section 8 (Lines 739–745).
  - Reflects the practical realities of student housing in Egyptian university hubs (e.g., Cairo, Giza, Alexandria, Mansoura, Assiut).
  - Maximizes occupancy rates for property providers.
- **System Impact**:
  - Search queries aggregate availability bottom-up.
  - Auto-closure logic targets only requests specifically competing for the booked entity.

---

### DEC-007: Transparent Contact Disclosure upon Booking Request

- **Decision ID**: `DEC-007`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Product & Communication
- **Problem Statement**:
  Traditional broker websites mask contact details to enforce commission extraction, creating frustration for Egyptian students and property owners who need to quickly verify listing details, ask practical questions, and schedule physical property viewings.
- **Options Considered**:
  - _Option 1: Complete Contact Masking with Telephony Proxies_.
  - _Option 2: Contact Gating behind Confirmed Booking_.
  - _Option 3: Immediate Mutual Contact Disclosure upon Booking Request Submission (Selected)_.
- **Final Decision**:
  Upon the creation of a valid booking request, the platform immediately discloses the student's name, verified mobile number, and email to the property provider, and discloses the provider's name, mobile number, and email to the student. Direct external phone and WhatsApp communication is explicitly permitted.
- **Rationale**:
  - Mandated by `app.txt` Section 5.11 (Lines 387–396).
  - The platform is an intermediary marketplace that does not collect rent or broker fees in MVP.
  - Respects Egyptian cultural norms of direct personal communication before entering housing commitments.
  - Sensitive KYC documents (National IDs, title deeds) remain strictly private and accessible only to superadmins.
- **System Impact**:
  - Contact cards display immediately on the booking request and messaging interfaces.
  - Dramatically improves user trust and viewing conversion rates.

---

### DEC-008: Post-Confirmation Review Qualification with Single Owner Response

- **Decision ID**: `DEC-008`
- **Date**: 2026-11-20
- **Status**: **CONFIRMED**
- **Category**: Trust, Safety & Reputation
- **Problem Statement**:
  Open review systems suffer from fake reviews, malicious competitor ratings, and toxic disputes. On the other hand, suppressing provider responses eliminates fairness and transparency.
- **Options Considered**:
  - _Option 1: Open Public Reviews_. Any registered user can review any property.
  - _Option 2: Post-Viewing Reviews_. Reviews permitted if a user visited the property without renting.
  - _Option 3: Strict Post-Confirmation Qualification with Single Provider Response (Selected)_.
- **Final Decision**:
  Reviews (1–5 star rating + written comment) are strictly restricted to students with an active or completed `CONFIRMED` booking agreement for that property. Property providers are granted the right to publish exactly one official response per review.
- **Rationale**:
  - Mandated by `app.txt` Section 5.13 (Lines 410–428).
  - Prevents fraudulent ratings by parties who never lived in the accommodation.
  - A single provider response allows owners to explain or clarify situations without enabling endless public arguing.
- **System Impact**:
  - Backend validation confirms `AgreementConfirmation.status === 'CONFIRMED'`.
  - Database schema enforces a unique constraint on `ReviewResponse(review_id)`.
