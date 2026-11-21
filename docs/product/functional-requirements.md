# Comprehensive Functional Requirements Specification

## Egyptian Student Housing Platform _(منصة سكن الطلاب في مصر)_

---

## 1. Document Overview

This document provides the definitive, granular functional requirements specification for the Egyptian Student Housing Platform, organized systematically across all **14 Development Phases** specified in `app.txt` (Sections 5, 12, 16). Every functional requirement is assigned a traceable identifier (`FR-PHx-yyy`), detailing inputs, core business processing logic, outputs, and edge/error behaviors in accordance with the **"NEVER GUESS"** standard.

---

## 2. Requirements Index Across the 14 Phases

| Phase  | Phase Name             | Primary Modules & Scope                                                             |
| :----: | :--------------------- | :---------------------------------------------------------------------------------- |
| **0**  | Product Discovery      | Domain boundary definitions, Egyptian market context, decision register.            |
| **1**  | Product Documentation  | PRD, vision, business rules, roles, journeys, functional/NFR specs.                 |
| **2**  | System Architecture    | Modular monolith topology, Next.js / NestJS architecture, security architecture.    |
| **3**  | UI/UX Design           | Bilingual design system (Orange/Navy), Cairo/Inter typography, responsive layouts.  |
| **4**  | Project Foundation     | Monorepo scaffolding, npm workspaces, TypeScript path aliases, Docker setup.        |
| **5**  | Auth & User Accounts   | Phone + OTP authentication, student/owner profiles, provider KYC verification gate. |
| **6**  | Locations & Properties | Cities, universities, hierarchical accommodation (building/unit/room/bed), pricing. |
| **7**  | Search & Discovery     | Multi-filter search engine, Google Maps integration, campus distance calculation.   |
| **8**  | Bookings & Agreements  | Booking requests (max 3), mutual agreement confirmation, partial availability.      |
| **9**  | Messaging & Alerts     | Request-linked permanent 1:1 chat, unread counters, in-app notification center.     |
| **10** | Reviews & Reports      | Post-confirmed reviews (1-5 stars), single provider response, text-only reports.    |
| **11** | Admin & Analytics      | Superadmin dashboard, KYC queue, ad moderation, audit logging, market analytics.    |
| **12** | Quality Assurance      | Automated unit, integration, and E2E test suites (Tiers 1-4) across modules.        |
| **13** | Production Readiness   | Containerization, environment separation, health checks, automated backups.         |

---

## 3. Granular Functional Requirements by Phase

---

### Phase 0: Product Discovery & Domain Modeling

#### `FR-PH0-001`: Intermediary Marketplace Scope Boundary

- **Description**: The platform operates strictly as a digital technology intermediary connecting students with verified housing providers.
- **Inputs**: Platform transaction triggers.
- **Processing Logic**:
  - The platform does **not** act as a real estate broker and takes **zero rental commission** from students in MVP.
  - The platform does **not** collect monthly rent or execute rental collection contracts.
  - The platform does **not** oversee or manage tenancy durations or tenant stays.
- **Outputs**: System records transaction confirmations without assuming legal landlord liabilities.
- **Error Behavior**: API endpoints for rental payments or broker commission deductions are strictly barred from MVP scope.

#### `FR-PH0-002`: Multi-City Expandable Data Architecture

- **Description**: The data model must support multi-city operations across Egypt from inception while focusing initial launch operations on a dedicated pilot area.
- **Inputs**: Administrative city and area configurations.
- **Outputs**: Scalable relational hierarchy (`City` $\to$ `Area` $\to$ `University` $\to$ `Property`).

---

### Phase 1: Product Documentation & Requirements Catalog

#### `FR-PH1-001`: Persistent Living Project Registers

- **Description**: Maintain living project memory tracking phase progress and formal decisions.
- **Inputs**: Developer and architect task updates.
- **Processing Logic**:
  - Maintain `PROJECT_STATUS.md` in repository root recording current phase, tests executed, files modified, and next tasks.
  - Maintain `DECISIONS.md` in repository root logging every architectural decision with Decision ID, Date, Problem, Options, Decision, and Impact.
- **Outputs**: Synchronized root project documentation artifacts.

---

### Phase 2: System Architecture & Topology

#### `FR-PH2-001`: Modular Monolith Monorepo Topology

- **Description**: Implement a scalable single-monorepo modular monolith (`student-housing-platform/`) housing Next.js frontend, NestJS backend, and shared packages.
- **Inputs**: Monorepo build and development commands.
- **Processing Logic**: Microservices are explicitly barred for MVP. Discrete domain logic partitioned into 24 NestJS domain modules and Next.js App Router route groups.
- **Outputs**: Unified monorepo structure with shared TypeScript definitions.

---

### Phase 3: UI/UX Design System & Accessibility

#### `FR-PH3-001`: Bilingual Bidirectional Theme Support

- **Description**: Full bilingual localization supporting Egyptian Arabic (RTL, Primary) and English (LTR, Secondary).
- **Inputs**: User locale selection (`ar` | `en`) or browser `Accept-Language` header.
- **Processing Logic**:
  - Arabic layout sets `dir="rtl"` with primary font Cairo / Alexandria.
  - English layout sets `dir="ltr"` with primary font Inter.
  - Color palette binds to Orange (`#FF6B00` / `#FA5A00`) and Navy (`#0A192F` / `#1E293B`).
  - Supports automatic matching of system dark/light mode preference.
- **Outputs**: Rendered bilingual UI layout without layout distortion or text overflow.

---

### Phase 4: Project Foundation & Tooling

#### `FR-PH4-001`: Shared Workspace Tooling & Validation

- **Description**: Centralize validation schemas, DTOs, and base configurations across frontend and backend.
- **Processing Logic**:
  - `packages/shared-types`: Unified TypeScript interfaces and enums.
  - `packages/validation`: Cross-platform Zod schemas.
  - `packages/api-client`: Strongly-typed API client wrapper.
- **Outputs**: Shared npm workspace packages referenced via TypeScript path aliases.

---

### Phase 5: Authentication & User Accounts

#### `FR-PH5-001`: Student Registration via Egyptian Phone & OTP

- **Inputs**: Student Full Name, Egyptian Mobile Phone (`+2010|11|12|15...`), Email, University ID.
- **Processing Logic**:
  1. Validate phone number against Egyptian regex: `^(\+20|0)?1[0125][0-9]{8}$`.
  2. Generate 6-digit numeric OTP with 5-minute time-to-live.
  3. Enforce rate limiting: maximum 3 OTP requests per phone per 15 minutes.
  4. Verify OTP; upon success, activate student account and persist mandatory university affiliation.
- **Outputs**: JWT access token (15 min) and HTTP-only refresh token (7 days).
- **Error Behavior**:
  - Invalid phone format: HTTP 422 (`ERR_INVALID_PHONE_NUMBER`).
  - Rate limit exceeded: HTTP 429 (`ERR_OTP_RATE_LIMIT_EXCEEDED`).
  - Incorrect/expired OTP: HTTP 400 (`ERR_OTP_INVALID_OR_EXPIRED`).

#### `FR-PH5-002`: Property Provider Categorized Registration

- **Inputs**: Full Name, Email, Egyptian Mobile Phone, Provider Type (`INDIVIDUAL_OWNER` | `AUTHORIZED_AGENT` | `MANAGEMENT_COMPANY`), Business Name (optional/company), Tax ID (optional/company).
- **Processing Logic**: Create provider account in `ACTIVE` state with `verification_status = 'UNVERIFIED'`.
- **Outputs**: Provider profile record; publishing privileges disabled until KYC approval.

#### `FR-PH5-003`: Provider KYC Verification Submission & Gating

- **Inputs**: National ID card image/scan + Property Ownership Deed or Official Notarized Power of Attorney or Commercial Registry.
- **Processing Logic**:
  1. Upload documents to isolated private cloud storage with restricted ACLs.
  2. Create verification request ticket in `PENDING_REVIEW` status.
  3. Bar provider from publishing listings until an administrator reviews and approves the ticket (`BR-PRV-002`).
- **Outputs**: Updated verification ticket status; audit log entry upon admin action.
- **Error Behavior**: Attempting to publish property while unverified returns HTTP 403 (`ERR_PROVIDER_NOT_VERIFIED`).

#### `FR-PH5-004`: Seeded Superadmin Authentication

- **Inputs**: Administrator credentials (email & password) seeded during database setup.
- **Processing Logic**: Validate credentials against database password hash. Issue JWT with `role = 'ADMIN'`. Public administrator registration endpoints are completely absent (`BR-ADM-001`).

---

### Phase 6: Locations & Hierarchical Properties Management

#### `FR-PH6-001`: Egyptian Geographic & University Directory

- **Inputs**: Governorates, Cities, Areas, and Universities database records.
- **Processing Logic**: Each university record stores its official Arabic name, English name, affiliated city, and exact main campus geocoordinates (`latitude`, `longitude`).
- **Outputs**: Accessible directory for search filters and registration forms.

#### `FR-PH6-002`: Hierarchical Accommodation Creation Engine

- **Inputs**: Property classification parameters:
  - Building container (optional): Name, address, total floors.
  - Unit: Unit number, floor level, total bathrooms, common facilities.
  - Room: Room number, room type (`PRIVATE` capacity = 1, `SHARED` capacity > 1).
  - Bed: Bed designation / label (e.g., Bed 1, Bed 2).
- **Processing Logic**: Provider can list a whole building, a standalone apartment, a private room, or an individual bed (`BR-ACC-001`, `BR-ACC-002`).
- **Outputs**: Persisted accommodation entity hierarchy with independent publication flags.

#### `FR-PH6-003`: Flexible EGP Pricing & Itemized Expenses

- **Inputs**:
  - Base price amount in EGP.
  - Pricing Unit: `PER_PERSON` | `PER_BED` | `PER_ROOM` | `PER_UNIT`.
  - Duration Unit: `DAILY` | `WEEKLY` | `MONTHLY` | `SEMESTER` | `YEARLY`.
  - Itemized expenses list: Name (Arabic/English), amount (EGP), `is_mandatory` (boolean), `is_recurring` (boolean).
- **Outputs**: Bound pricing records and expense sub-entities.
- **Error Behavior**: Negative or zero prices return HTTP 422 (`ERR_INVALID_PRICE_AMOUNT`).

#### `FR-PH6-004`: Cloudinary Media Upload & Optimization

- **Inputs**: Property photo files (JPEG, PNG, WebP).
- **Processing Logic**: Upload photos to Cloudinary CDN under structured folders; assign display order; designate single cover photo.
- **Outputs**: Cloudinary secure URL and public ID stored in `PropertyImage`.

#### `FR-PH6-005`: Administrative Advertisement Moderation Gate

- **Inputs**: Provider listing submission action.
- **Processing Logic**:
  - Listing placed in `PENDING_REVIEW` status.
  - Admin reviews photos, description, and address.
  - Upon approval, listing transitions to `PUBLISHED` (visible in public search).
  - Significant updates to an active listing (address, room structure) reset status to `PENDING_REVIEW` (`BR-LST-002`).

---

### Phase 7: Search & Property Discovery

#### `FR-PH7-001`: Multi-Parameter Query Engine

- **Inputs**: Filter parameters: City, Area, University ID, Max Campus Distance (km), Min/Max Budget (EGP), Accommodation Type, Duration Unit, Gender Policy (`MALE_ONLY` | `FEMALE_ONLY` | `MIXED_FAMILY`).
- **Processing Logic**: Construct dynamic PostgreSQL query filtering published and available accommodations.
- **Outputs**: Paginated list of matching accommodation records.

#### `FR-PH7-002`: Campus Proximity Metric

- **Inputs**: Property coordinates (`latitude`, `longitude`) and University ID.
- **Processing Logic**: Calculate distance in kilometers between property location and university main campus coordinates using the Haversine formula or PostGIS `ST_DistanceSphere`. Sub-campus locations are ignored per `app.txt` Line 302.
- **Outputs**: Precise distance attribute (e.g., `1.4 km to Cairo University Main Campus`).

#### `FR-PH7-003`: Dual-View Interface (Cards & Google Maps)

- **Inputs**: User view mode toggle (`cards` | `map`).
- **Processing Logic**:
  - In card view: Render responsive grid of property cards with cover photo, price, type, and campus distance.
  - In map view: Render interactive Google Maps canvas populated with synchronized property pins displaying price badges and hover previews.
- **Outputs**: Synchronized spatial and list view interfaces.

#### `FR-PH7-004`: Transparent Suitability Ordering

- **Inputs**: Search query without explicit user sort preference.
- **Processing Logic**: Rank listings objectively by campus proximity and budget match. Sponsored ranking algorithms or paid visibility boosts are prohibited in MVP.

---

### Phase 8: Booking Requests & Agreements

#### `FR-PH8-001`: Booking Request Submission & 3-Request Limit

- **Inputs**: Target accommodation portion ID (`property_id`, `unit_id`, `room_id`, or `bed_id`), Student user session, optional note.
- **Processing Logic**:
  1. Check count of student's open requests (`status IN ('PENDING', 'ACCEPTED')`).
  2. If count $\ge 3$, reject submission (`BR-BKG-001`).
  3. Insert booking request record (`status = 'PENDING'`).
  4. Disclose full contact details (Name, Phone, Email) immediately to both parties (`BR-BKG-003`).
  5. Spawn 1:1 conversation thread linked to request (`BR-MSG-001`).
- **Outputs**: Booking request record, initial chat thread, provider notification.
- **Error Behavior**: HTTP 400 Bad Request (`ERR_MAX_OPEN_REQUESTS_REACHED`).

#### `FR-PH8-002`: Owner Request Decision

- **Inputs**: Booking request ID, Action (`ACCEPT` | `REJECT`), optional rejection note.
- **Processing Logic**:
  - Accept transitions status to `ACCEPTED`.
  - Reject transitions status to `REJECTED`. Rejection does not require mandatory justification (`BR-BKG-004`).
  - Linked conversation remains open permanently (`BR-MSG-001`).
- **Outputs**: Updated request status; student in-app alert.

#### `FR-PH8-003`: Student Request Cancellation

- **Inputs**: Booking request ID, Student cancellation action.
- **Processing Logic**:
  - If request is unconfirmed, transition status to `CANCELLED`.
  - Increment student internal cancellation metric (private to admins, `BR-BKG-005`).
  - Provider notified in real-time. Student's 3-request quota slot immediately freed.

#### `FR-PH8-004`: Mutual Agreement Confirmation & Concurrency Lock

- **Inputs**: Booking request ID, Student confirmation action, Provider confirmation action, optional contract document.
- **Processing Logic**:
  1. Acquire PostgreSQL row lock (`SELECT ... FOR UPDATE`) on target accommodation entity.
  2. Verify student has zero existing confirmed bookings (`BR-BKG-002`).
  3. When both parties confirm, transition agreement to `CONFIRMED`.
  4. Partial Availability: Mark **only the target portion** as `BOOKED` (`BR-AGR-002`).
  5. Competing Requests: Automatically transition all other pending requests targeting the same portion to `CLOSED_CONFLICT` (`BR-AGR-003`).
- **Outputs**: Confirmed tenancy record, updated availability status, conflict closure alerts.
- **Error Behavior**: Concurrency collision or duplicate confirmation returns HTTP 409 (`ERR_CONCURRENT_BOOKING_CONFLICT`).

---

### Phase 9: Messaging & Notifications

#### `FR-PH9-001`: Request-Linked Permanent 1:1 Chat

- **Inputs**: Conversation ID, Sender ID, Text message payload.
- **Processing Logic**:
  - Text-only messages persisted with timestamp and delivery status.
  - Conversation decoupled from booking request status: remains permanently open even if request is canceled or rejected (`BR-MSG-001`).
  - Unread message counters incremented for recipient until viewed.
- **Outputs**: Real-time message delivery and unread counter badges.

#### `FR-PH9-002`: Multi-Channel Notification Gateway

- **Inputs**: System event triggers (new request, acceptance, cancellation, confirmation, new message).
- **Processing Logic**:
  - Dispatch in-app notification with unread tracking and target URL.
  - Pluggable gateway prepared for SMS/phone notifications via approved provider.
- **Outputs**: Accessible notification center at `/student/notifications` and `/owner/notifications`.

---

### Phase 10: Reviews, Ratings & Reports

#### `FR-PH10-001`: Post-Confirmation Review Submission

- **Inputs**: Confirmed Booking ID, Rating (1 to 5 integer), Optional text comment.
- **Processing Logic**:
  - Verify booking `status = 'CONFIRMED'`. Viewings and unconfirmed requests are strictly barred (`BR-REV-001`).
  - Enforce duplicate check: exactly 1 review per confirmed booking (`BR-REV-002`).
- **Outputs**: Public review record on property profile; updated aggregate average rating.
- **Error Behavior**: HTTP 403 Forbidden (`ERR_REVIEW_INELIGIBLE_NO_CONFIRMED_BOOKING`).

#### `FR-PH10-002`: Single Provider Review Response

- **Inputs**: Review ID, Provider response text.
- **Processing Logic**: Verify provider is the recipient of the review and has not already submitted a response (`BR-REV-003`).
- **Outputs**: Response text published directly beneath the review.
- **Error Behavior**: Second response attempt returns HTTP 409 (`ERR_REVIEW_RESPONSE_ALREADY_EXISTS`).

#### `FR-PH10-003`: Text-Only Progressive Complaint Reporting

- **Inputs**: Reporter ID, Target Type (`PROPERTY` | `USER` | `BOOKING`), Target ID, Reason Category, Description.
- **Processing Logic**:
  - Create report record in `NEW` status (`BR-REP-001`).
  - Admin updates status through `UNDER_REVIEW` $\to$ `RESPONDED` $\to$ `CLOSED`.
- **Outputs**: Dedicated ticket visible in Admin Report Queue.

---

### Phase 11: Administration Dashboard & Analytics

#### `FR-PH11-001`: Consolidated Governance Console

- **Description**: Centralized interface for superadmin managing:
  - User verification queue (KYC review & approval).
  - Listing moderation queue (review photos, pricing, address).
  - Dispute resolution desk.
  - Global system settings.

#### `FR-PH11-002`: Non-Bypassable Administrative Audit Logging

- **Inputs**: Any administrative state-changing action.
- **Processing Logic**: Synchronously insert record into `AdminActionLog` containing `admin_id`, `action_type`, `entity_type`, `entity_id`, timestamp, and before/after JSON diff (`BR-ADM-002`).
- **Outputs**: Immutable audit log queryable by administrator.

#### `FR-PH11-003`: Real-Time Housing Market Analytics

- **Description**: Aggregate platform metrics displayed at `/admin/analytics`:
  - Active listings and total bed capacity segmented by City and Area.
  - Student search volume and demand density per University.
  - Average rental price per bed/room across university zones.
  - Conversion metrics: Time-to-acceptance and request-to-confirmation conversion rates.

---

### Phase 12: Quality Assurance & Testing Infrastructure

#### `FR-PH12-001`: Comprehensive Test Suite Coverage

- **Description**: Automated test suites validating business rules without inspecting test code prior to implementation:
  - Unit tests: Pricing calculations, OTP validation, Zod schemas, state machines.
  - Integration tests: Database row-locking, mutual confirmation transactions, auto-closure of competing requests, audit logging.
  - End-to-End (E2E) tests: Complete user journeys (student search to confirmation, provider onboarding to publishing).

---

### Phase 13: Production Preparation & Deployment Readiness

#### `FR-PH13-001`: Containerization & Environment Isolation

- **Description**: Multi-stage production Dockerfiles for `apps/web` and `apps/api` with minimal runtime images. Docker Compose for local development and integration testing.
- **Outputs**: Production-ready container images with non-root security execution.

#### `FR-PH13-002`: Health Observability & Automated Backup Routines

- **Description**: Implement `/health` check endpoints reporting database and memory status. Shell and PostgreSQL scripts for scheduled daily database dumps and point-in-time recovery.
