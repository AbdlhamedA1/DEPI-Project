# Project: Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

## Architecture

- **Paradigm**: Modular Monolith Monorepo (`student-housing-platform/`). Microservices explicitly barred in MVP.
- **Frontend (`apps/web`)**: Next.js (App Router), React, TypeScript, Tailwind CSS. Bilingual support: Egyptian Arabic (RTL, primary) and English (LTR). Route groups: `(public)`, `(auth)`, `(student)/student/`, `(owner)/owner/`, `(admin)/admin/` under `[locale]`.
- **Backend (`apps/api`)**: Node.js, NestJS Modular Monolith, TypeScript. 24 discrete domain modules (`auth`, `users`, `students`, `owners`, `universities`, `locations`, `properties`, `units`, `rooms`, `beds`, `pricing`, `availability`, `search`, `booking-requests`, `agreements`, `messaging`, `notifications`, `reviews`, `reports`, `verification`, `support`, `admin`, `analytics`, `platform-settings`).
- **Database**: PostgreSQL with strict schema, migrations, and seeds. Supports 26 domain entities with atomic transactions and row-locking (`SELECT FOR UPDATE`) for concurrency.
- **Shared Packages (`packages/`)**:
  - `shared-types`: Unified TypeScript interfaces, enums, DTO contracts.
  - `shared-config`: Shared ESLint, Prettier, and TypeScript base configs.
  - `api-client`: Strongly-typed client SDK for frontend-to-backend communication.
  - `validation`: Shared cross-platform validation schemas (Zod).
- **Integrations**:
  - Google Maps API: Geocoding, autocomplete, distance to main university campus.
  - Cloudinary: Property photo upload, transformation, and optimization.
  - Private Secure Storage: Isolated storage for sensitive KYC documents (National IDs, ownership deeds).
  - Pluggable Notification Gateway: In-app notifications plus SMS/WhatsApp triggers.

---

## Feature Inventory

| #   | Feature                              | Description                                                                                   | Milestone | Source                    |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------- | --------- | ------------------------- |
| 1   | Product Discovery Specification      | Target personas (students, owners, admin), market context, business model, pilot scope        | M1        | app.txt §3, §4, §5        |
| 2   | Product Documentation Deliverables   | Comprehensive docs under `docs/` (35 files) and root (`PROJECT_STATUS.md`, `DECISIONS.md`)    | M1        | app.txt §1, §16; app2.txt |
| 3   | Egyptian Arabic Founder Briefing     | Structured briefing and open business questions formatted in Egyptian Arabic                  | M1        | app.txt §2, §16           |
| 4   | System Architecture Specification    | High-level modular monolith architecture, C4 diagrams, security & infrastructure specs        | M2        | app.txt §6, §7; app2.txt  |
| 5   | Technical Design & Data Modeling     | ERD, PostgreSQL schema, 26 entities, API contracts, migrations strategy                       | M2        | app.txt §8; app2.txt      |
| 6   | Monorepo Foundation Scaffolding      | npm workspaces setup, TypeScript path aliases, configs, Docker Compose, git setup             | M2        | app2.txt; Survey 3        |
| 7   | Student Registration & OTP           | Egyptian mobile (+20), university selection, SMS OTP verification, rate limiting              | M3        | app.txt §5.5, §10         |
| 8   | Property Provider Onboarding & KYC   | Provider registration (owner, agent, company), National ID and title deed upload              | M3        | app.txt §4, §5.4          |
| 9   | RBAC & Security Session Control      | JWT tokens, guards, role permissions (`STUDENT`, `OWNER`, `ADMIN`), private KYC ACLs          | M3        | app.txt §10               |
| 10  | Location & University Directory      | Egyptian governorates, cities, areas, universities with main campus coordinates               | M3        | app.txt §5.1, §5.6        |
| 11  | Hierarchical Accommodation Engine    | Building -> Unit -> Room -> Bed hierarchy; standalone units; partial availability             | M3        | app.txt §5.2, §8          |
| 12  | Flexible Pricing & Expenses in EGP   | EGP pricing per person/bed/room/unit; daily/weekly/monthly/semester/yearly; itemized expenses | M3        | app.txt §5.3              |
| 13  | Cloudinary Media Management          | Property photo uploads, cover selection, responsive optimization                              | M3        | app.txt §6, §8            |
| 14  | Property Listing Approval Queue      | Admin review gate for new and significantly modified listings                                 | M3        | app.txt §5.4, §5.15       |
| 15  | Multi-filter Search Engine           | Filter by city, area, university, distance to campus, budget, type, gender                    | M3        | app.txt §5.6              |
| 16  | Dual Search View (Cards & Maps)      | Synchronized property card list and interactive Google Maps view                              | M3        | app.txt §5.6, §6          |
| 17  | Transparent Student Matching Sort    | Proximity and suitability ranking algorithm without hidden bias                               | M3        | app.txt §5.6              |
| 18  | Booking Request Submission           | Target portion booking; max 3 open requests per student limit                                 | M4        | app.txt §5.8, §8          |
| 19  | Single Confirmed Booking Enforcement | Maximum 1 confirmed booking per student rule                                                  | M4        | app.txt §5.8, §8          |
| 20  | Provider Booking Decision            | Owner acceptance or rejection (without mandatory reason); student cancellation                | M4        | app.txt §5.8              |
| 21  | Mutual Agreement Confirmation        | In-app confirmation by both parties; optional contract document upload                        | M4        | app.txt §5.9              |
| 22  | Concurrency Lock & Auto-Closure      | Atomic transaction: lock portion, mark unavailable, auto-close competing requests             | M4        | app.txt §5.9, §8          |
| 23  | Contact Disclosure Transparency      | Reveal name, phone, email immediately upon booking request submission                         | M4        | app.txt §5.11             |
| 24  | Request-Linked Direct Messaging      | In-app text chat tied to request; permanent thread retention post-cancellation                | M4        | app.txt §5.10, §8         |
| 25  | Notification System                  | In-app notification center and external SMS/phone alert dispatching                           | M4        | app.txt §5.12             |
| 26  | Bidirectional Reviews & Rating       | Post-confirmed-booking reviews (1-5 stars); single response; duplicate prevention             | M4        | app.txt §5.13             |
| 27  | Reporting & Complaint System         | Text-only reports for fraud, misleading listings, or misconduct; progressive review           | M4        | app.txt §5.14             |
| 28  | Admin Management & KYC Portal        | Consolidated admin dashboard, KYC review queue, listing moderation queue                      | M5        | app.txt §5.15             |
| 29  | Immutable Audit Logging              | `AdminActionLog` tracking all administrative actions with non-bypassable diffs                | M5        | app.txt §5.15, §8         |
| 30  | Platform Analytics & Metrics         | Real-time supply, demand, average price trends, and conversion metrics                        | M5        | app.txt §5.15             |
| 31  | Automated Unit & Integration Testing | Unit tests (pricing, validation, state machines) & integration tests (transactions)           | M5        | app.txt §11, §12          |
| 32  | Containerization & Deployment Setup  | Multi-stage Dockerfiles (`web`, `api`), docker-compose.yml, env separation                    | M6        | app.txt §6, §12           |
| 33  | Health Observability & Backup Plan   | `/health` check endpoints, automated database backup scripts                                  | M6        | app.txt §10, §13          |
| 34  | CI/CD Automation                     | GitHub Actions workflows for continuous integration and automated quality gates               | M6        | app.txt §12               |
| 35  | E2E Full-Suite Pass & Hardening      | 100% pass of Tiers 1-4 requirement-driven E2E tests + Tier 5 adversarial hardening            | M6        | ORIGINAL_REQUEST          |

---

## Milestones

| #   | Name                                        | Scope                                                                                                                                                                                                                       | Dependencies | Status      |
| --- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| M1  | Product Discovery & Documentation           | Complete Phase 0 & Phase 1 documentation across `docs/product/`, `docs/design/`, `docs/decisions/`, root `PROJECT_STATUS.md`, `DECISIONS.md`, `MVP_SCOPE.md`, `README.md`, and founder briefing in Egyptian Arabic.         | none         | DONE        |
| M2  | System Architecture & Foundation Setup      | Complete Phase 2 Architecture (`docs/architecture/`, `docs/database/`, `docs/api/`, `docs/development/`) and Phase 4 Foundation Setup (Monorepo scaffolding per `app2.txt`, npm workspaces, shared packages, root configs). | M1           | DONE        |
| M3  | Core Domain: Identity, Properties & Search  | Complete Phase 5 (Auth & KYC), Phase 6 (Locations & Hierarchical Properties), Phase 7 (Search & Proximity Discovery).                                                                                                       | M2           | DONE        |
| M4  | Transactions: Bookings, Messaging & Trust   | Complete Phase 8 (Booking Requests & Agreements), Phase 9 (Messaging & Notifications), Phase 10 (Reviews & Complaints).                                                                                                     | M3           | DONE        |
| M5  | Admin Portal, Analytics & Automated Testing | Complete Phase 11 (Admin Console, Audit Logs, Analytics) and Phase 12 (Comprehensive Unit, Integration, and Domain Test Suites).                                                                                            | M4           | DONE        |
| M6  | Production Readiness & E2E Verification     | Complete Phase 13 (Docker, CI/CD, Backup, Health) and Final Milestone (100% E2E tests pass + Tier 5 Adversarial Coverage Hardening).                                                                                        | M5           | IN_PROGRESS |

---

## Interface Contracts

### 1. `apps/web` (Frontend) ↔ `apps/api` (Backend)

- **Protocol**: HTTPS REST API + WebSocket (for messaging/notifications).
- **Base URL**: `/api/v1`
- **Data Format**: `application/json`
- **Authentication**: `Authorization: Bearer <jwt_access_token>`
- **Standard Response Envelope**:
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: Array<{ field?: string; message: string; code?: string }>;
    timestamp: string;
  }
  ```
- **Error Format**:
  ```typescript
  export interface ApiErrorResponse {
    success: false;
    statusCode: number;
    error: string;
    message: string;
    details?: any;
    timestamp: string;
  }
  ```

### 2. `packages/shared-types` ↔ All Apps

- Exports domain enums:
  - `UserRole`: `'STUDENT' | 'OWNER' | 'ADMIN'`
  - `ProviderType`: `'INDIVIDUAL_OWNER' | 'AUTHORIZED_AGENT' | 'MANAGEMENT_COMPANY'`
  - `VerificationStatus`: `'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'`
  - `PropertyType`: `'BUILDING' | 'APARTMENT' | 'ROOM' | 'BED'`
  - `GenderPolicy`: `'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED_FAMILY'`
  - `PricingUnit`: `'PER_PERSON' | 'PER_BED' | 'PER_ROOM' | 'PER_UNIT'`
  - `DurationUnit`: `'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'YEARLY'`
  - `BookingStatus`: `'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'CLOSED_CONFLICT'`
  - `ReportStatus`: `'NEW' | 'UNDER_REVIEW' | 'RESPONDED' | 'CLOSED'`

### 3. Backend Domain Module Boundaries (`apps/api/src/modules/`)

- Cross-module calls must use Module Services (injected via NestJS Dependency Injection), NOT direct entity mutation across module boundaries.
- Database transactions spanning multiple modules (e.g. Booking confirmation affecting Availability, Requests, and Conversations) must use a centralized unit-of-work or transactional runner with row locking.

---

## Code Layout

```
c:\Users\Hp\OneDrive\Pictures\project-depi\
├── apps/
│   ├── web/                                  # Next.js App Router (Frontend)
│   └── api/                                  # NestJS Modular Monolith (Backend)
├── packages/
│   ├── shared-types/                         # Shared TypeScript types & enums
│   ├── shared-config/                        # Shared ESLint, Prettier, tsconfig
│   ├── api-client/                           # Typed API SDK client
│   └── validation/                           # Shared Zod validation schemas
├── infrastructure/
│   ├── docker/                               # Dockerfiles & docker-compose.yml
│   ├── deployment/                           # Environments deployment configs
│   ├── database/                             # Backup & restore scripts
│   └── monitoring/                           # Health & metrics configs
├── docs/                                     # Product, Architecture, DB, API, Design, Decisions, Dev
├── scripts/                                  # Setup, test, and DB management scripts
├── tests/                                    # E2E test suites (Tiers 1-4)
├── .github/workflows/                        # CI/CD pipelines
├── package.json                              # Root npm workspaces config
├── tsconfig.base.json                        # Base TypeScript compiler config
├── PROJECT_STATUS.md                         # Living status tracking register
├── DECISIONS.md                              # Living architectural decision register
├── MVP_SCOPE.md                              # Scoped features vs roadmap
└── README.md                                 # Developer and quickstart guide
```
