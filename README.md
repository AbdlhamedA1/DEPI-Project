# Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#architecture-overview)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](#technology-stack)
[![Next.js 14](https://img.shields.io/badge/Next.js-App%20Router-black.svg)](#frontend)
[![NestJS 10](https://img.shields.io/badge/NestJS-Modular%20Backend-red.svg)](#backend)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16%20ACID-blue.svg)](#database)
[![Status: Milestone 1 Complete](https://img.shields.io/badge/Status-Milestone%201%20Complete-green.svg)](PROJECT_STATUS.md)

---

## 📌 Problem Statement & Overview

Finding safe, affordable, and trustworthy student housing around universities in Egypt is a fraught and fragmented process. Students face unverified brokers, inflated hidden commissions, deceptive photos, and lack of clear contractual transparency. Property owners, meanwhile, struggle to reach serious university students, manage inquiries efficiently, and avoid frivolous listing cancellations.

The **Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)** is a verified technology marketplace engineered to solve this challenge from the ground up. The platform connects students enrolled in Egyptian public, private, and national universities directly with verified property owners, authorized managers, and housing companies.

### What the Platform Is and Is Not

- **Technology Marketplace**: Direct, transparent connection between students and verified property providers.
- **Strictly Not a Brokerage**: No rental commissions or hidden fees charged to students in MVP.
- **Not a Rental Management Entity**: Does not collect rent, hold escrow funds, or physically manage tenancies.
- **Verified Supply**: Property providers must submit formal proof of identity (National ID) and ownership/authorization deeds before listings can be published.
- **Deterministic Search**: Transparent search results sorted by actual distance to main university campuses and verified criteria without paid bias.

---

## 🚀 Key Features

### For Students

- **Egyptian Mobile OTP Auth**: Fast, passwordless registration via phone number (`+20`) with university association.
- **Hierarchical Discovery**: Search across entire buildings, full apartments, private rooms, shared rooms, or individual beds.
- **Dual Synchronized Views**: Switch seamlessly between interactive Google Maps pin view and responsive property cards.
- **Campus Proximity Calculation**: Accurate real-time distance calculations to main university campuses.
- **Controlled Booking Workflow**: Submit up to 3 simultaneous open booking requests; lock in exactly 1 confirmed agreement.
- **Direct 1:1 In-App Messaging**: Instant text messaging with property owners paired with immediate contact disclosure (phone, name, email) for viewing coordination.
- **Post-Confirmation Verified Reviews**: Review property and provider (1–5 stars) strictly after a confirmed booking agreement.

### For Property Providers (Owners & Managers)

- **Multi-Category Verification (KYC)**: Secure verification workflows for individual owners, legal agents, and property management companies.
- **Flexible Accommodation Hierarchy**: Manage buildings, units, rooms, and beds with partial availability (booking a bed does not lock out sibling beds or the apartment).
- **Multi-Unit Pricing & Itemized Expenses**: Set pricing in EGP per person, bed, room, or unit across flexible rental terms (daily, monthly, semester, yearly) with itemized mandatory and optional expenses.
- **Cloudinary Image Optimization**: Fast, responsive photo uploads with automated compression and cover selection.
- **Single Official Response**: Right to submit exactly one immutable response to student reviews.

### For Platform Administrators

- **Consolidated Superadmin Console**: Unified review queues for provider KYC verifications and property listing moderation.
- **Immutable Audit Logging**: Every administrative action, ban, verification, or modification is captured with non-bypassable JSON diffs in `AdminActionLog`.
- **Market Intelligence Analytics**: Real-time aggregation of housing supply, student demand, average rental rates, and conversion metrics across Egyptian cities and universities.

---

## 🏗️ Architecture Overview

The platform is designed as a **Modular Monolith monorepo** (`student-housing-platform/`) prioritizing transactional consistency, shared TypeScript contracts, and low operational overhead. Microservices are deliberately excluded for MVP to prevent distributed state and latency overhead across the hierarchical booking workflow.

```
                                 ┌─────────────────────────────────────────┐
                                 │       Next.js 14 App Router (Web)       │
                                 │       apps/web (Bilingual ar / en)      │
                                 │                                         │
                                 │  (public)  (auth)  (student)   (owner)  │
                                 └────────────────────┬────────────────────┘
                                                      │
                                                      │ HTTPS REST / WebSocket
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │        NestJS Modular Monolith          │
                                 │         apps/api (24 Modules)           │
                                 │                                         │
                                 │  [Auth] [Users] [Properties] [Bookings] │
                                 │  [Search] [Messaging] [Reviews] [Admin] │
                                 └────────────────────┬────────────────────┘
                                                      │
                                      ┌───────────────┴───────────────┐
                                      ▼                               ▼
                      ┌───────────────────────────────┐   ┌───────────────────────────┐
                      │    PostgreSQL 16 Database     │   │   External Integrations   │
                      │  ACID Transactions & Locking  │   │  • Google Maps (Geo/Dist) │
                      │  26 Domain Entities & Migr.   │   │  • Cloudinary (Photos)    │
                      └───────────────────────────────┘   │  • Private Secure Storage │
                                                          └───────────────────────────┘
```

---

## 📁 Monorepo Directory Layout

The repository strictly conforms to the structure defined in `app2.txt`:

```
student-housing-platform/
│
├── apps/
│   ├── web/                                  # Frontend — Next.js 14 App Router (TypeScript, Tailwind CSS)
│   │   ├── public/                           # Static assets, icons, fonts
│   │   └── src/
│   │       ├── app/[locale]/                 # Dynamic bilingual locale routing (ar / en)
│   │       │   ├── (public)/                 # Landing page, search, property details, about
│   │       │   ├── (auth)/                   # Login, register, verify OTP, role select
│   │       │   ├── (student)/student/        # Student dashboard, requests, messages, reviews
│   │       │   ├── (owner)/owner/            # Owner dashboard, properties, inventory, KYC
│   │       │   └── (admin)/admin/            # Admin console, verifications, moderation, logs
│   │       ├── components/                   # Reusable UI component library (cards, maps, modals)
│   │       ├── features/                     # Domain-specific UI features
│   │       ├── hooks/                        # Custom React hooks
│   │       └── lib/                          # Client utilities, i18n dictionary loaders
│   │
│   └── api/                                  # Backend — NestJS Modular Monolith (TypeScript)
│       └── src/
│           ├── common/                       # Decorators, filters, guards, interceptors, middleware
│           ├── config/                       # Type-safe environment configuration
│           ├── database/                     # PostgreSQL migrations, seeds, connection management
│           └── modules/                      # 24 Isolated Domain Modules
│               ├── auth/                     # OTP generation, verification, JWT session tokens
│               ├── users/                    # Base user accounts, credentials, status
│               ├── students/                 # Student profiles, university affiliation
│               ├── owners/                   # Provider profiles, business details, KYC
│               ├── universities/             # University catalog & main campus coordinates
│               ├── locations/                # Egyptian governorates, cities, areas
│               ├── properties/               # Property buildings, addresses, media
│               ├── units/                    # Apartment units within buildings
│               ├── rooms/                    # Private and shared rooms
│               ├── beds/                     # Individual beds in shared rooms
│               ├── pricing/                  # Multi-tier pricing rates and itemized expenses
│               ├── availability/             # Atomic availability state machine
│               ├── search/                   # Proximity filtering & ranking engine
│               ├── booking-requests/         # Booking request lifecycle & 3-request limit
│               ├── agreements/               # Mutual agreement confirmation & row-locking
│               ├── messaging/                # 1:1 Request-linked chat conversations
│               ├── notifications/            # In-app notification center & alerts
│               ├── reviews/                  # Post-confirmation reviews & ratings
│               ├── reports/                  # User violation & abuse complaints
│               ├── verification/             # Provider KYC inspection workflow
│               ├── support/                  # Platform assistance & helpdesk
│               ├── admin/                    # Administrative management & moderation
│               ├── analytics/                # Aggregated metrics & marketplace reporting
│               └── platform-settings/        # Dynamic runtime system configurations
│
├── packages/                                 # Shared Workspace Packages
│   ├── shared-types/                         # Unified domain TypeScript interfaces & enums
│   ├── shared-config/                        # Shared ESLint, Prettier, and tsconfig baselines
│   ├── api-client/                           # Strongly-typed frontend API client SDK
│   └── validation/                           # Shared Zod validation schemas
│
├── infrastructure/                           # Infrastructure & Deployment
│   ├── docker/                               # Development & production Dockerfiles + docker-compose.yml
│   ├── deployment/                           # Deployment environments & scripts
│   ├── database/                             # Database backup and recovery scripts
│   └── monitoring/                           # Prometheus / health check configurations
│
├── docs/                                     # Product, Architecture, DB, API & Design Documentation
│   ├── product/                              # PRD, Vision, Business Rules, User Roles, Open Questions
│   ├── architecture/                         # System, Frontend, Backend, Security & Infrastructure
│   ├── database/                             # ERD, Schemas, Relationships, Migrations
│   ├── api/                                  # API Overview, Endpoints specification, Error Handling
│   ├── design/                               # Design system, Typography, Colors, UI Components
│   ├── decisions/                            # Decision Log and Architecture Decision Records (ADRs)
│   └── development/                          # Local Setup, Testing, Deployment, Troubleshooting
│
├── scripts/                                  # Administrative & Seed Scripts
├── tests/                                    # E2E & Integration Test Suites
├── PROJECT_STATUS.md                         # Living status tracking register
├── DECISIONS.md                              # Living architectural decision register
├── MVP_SCOPE.md                              # Scoped features vs deferred roadmap
└── README.md                                 # Main repository documentation (this file)
```

---

## 💻 Technology Stack

| Layer                       | Technology                                   | Justification                                                                                         |
| :-------------------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Monorepo Management**     | npm workspaces                               | Native Node.js dependency management with zero external monorepo complexity.                          |
| **Frontend Framework**      | Next.js 14+ (App Router)                     | Hybrid SSR/SSG for Arabic/English SEO, React Server Components, flexible route groups.                |
| **Styling & Design System** | Tailwind CSS                                 | Utility-first CSS with native logical properties (`start`, `end`, `ms`, `me`) for RTL/LTR support.    |
| **Typography**              | Cairo / Alexandria (Arabic), Inter (English) | High-legibility Google Fonts optimized for Arabic and Latin reading experiences.                      |
| **Backend Framework**       | NestJS (Node.js)                             | Structured modular architecture, Dependency Injection, validation pipes, enterprise scalability.      |
| **Primary Database**        | PostgreSQL 16                                | Relational consistency, foreign keys, row-level locking (`SELECT ... FOR UPDATE`), ACID transactions. |
| **Data Validation**         | Zod + class-validator                        | Shared cross-platform schemas across frontend and backend.                                            |
| **Media Hosting**           | Cloudinary                                   | Automated image compression, responsive WebP formatting, thumbnail transformations.                   |
| **Maps & Geolocation**      | Google Maps JavaScript API                   | Autocomplete, geocoding, campus distance matrix, interactive map pins.                                |
| **Containerization**        | Docker & Docker Compose                      | Containerized local development and reproducible multi-stage production builds.                       |

---

## ⚡ Quickstart & Development Setup

### 1. Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher
- **Docker & Docker Compose**: For local PostgreSQL database
- **Git**

### 2. Clone and Setup Environment

```bash
# Clone the repository
git clone https://github.com/organization/student-housing-platform.git
cd student-housing-platform

# Copy environment variables
cp .env.example .env
```

### 3. Install Dependencies

```bash
# Install dependencies across all monorepo packages
npm install
```

### 4. Start Local Services

```bash
# Start local PostgreSQL instance via Docker Compose
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### 5. Run Database Migrations & Seeds

```bash
# Apply schema migrations to PostgreSQL
npm run db:migrate --workspace=apps/api

# Seed Egyptian universities, cities, and initial admin account
npm run db:seed --workspace=apps/api
```

### 6. Start Development Servers

```bash
# Run both Next.js frontend and NestJS backend concurrently
npm run dev
```

- **Frontend (Web)**: `http://localhost:3000`
- **Backend (API)**: `http://localhost:4000/api/v1`
- **API Documentation**: `http://localhost:4000/api/docs`

---

## 🔒 Architectural Invariants & Business Rules

1. **NEVER GUESS**: No unapproved business rules, pricing assumptions, or legal policies may be introduced.
2. **Atomic Booking Concurrency**: Reserving a unit executes under a PostgreSQL row-level lock (`SELECT ... FOR UPDATE`) in an isolated transaction to prevent race conditions or double bookings.
3. **Hard Concurrency Limits**: Students are constrained to a maximum of **3 active open booking requests** and **1 active confirmed booking** across the platform.
4. **Partial Availability**: Booking an individual bed in a shared room reserves only that bed; sibling beds and parent apartments remain available with recalculated capacity.
5. **Decoupled Conversations**: Request-linked 1:1 chat conversations remain permanently open even if the underlying booking request is rejected or canceled.
6. **Strict Review Qualification**: Reviews and star ratings are strictly restricted to students who have held a confirmed booking agreement for the property.

---

## 📖 Documentation Index

Complete documentation is maintained under the `docs/` directory:

- **Product Specifications**: [`docs/product/`](docs/product/) — PRD, Vision, Business Rules, User Journeys, Open Questions.
- **System Architecture**: [`docs/architecture/`](docs/architecture/) — C4 System Architecture, Frontend, Backend, Security.
- **Database & Schemas**: [`docs/database/`](docs/database/) — Relational ERD, PostgreSQL Schemas, Migrations.
- **API Specifications**: [`docs/api/`](docs/api/) — REST Endpoints, Envelope Contracts, Error Codes.
- **Design System**: [`docs/design/`](docs/design/) — Design Tokens, Typography, Color Palette, Component Library.
- **Decision Records**: [`docs/decisions/`](docs/decisions/) — Central Decision Log & Architecture Decision Records (ADRs).
- **Development Guides**: [`docs/development/`](docs/development/) — Setup, Testing Strategy, Deployment, Troubleshooting.

---

## 📄 License & Attribution

Internal proprietary development for the **Egyptian Student Housing Platform**. All rights reserved.
